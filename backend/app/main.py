"""FastAPI inference + simulation API.

Run from the backend/ folder:
    uvicorn app.main:app --reload

Interactive docs: http://localhost:8000/docs
"""
from __future__ import annotations

import pandas as pd
import random
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from . import config as C
from . import data as D
from .backtest import performance_metrics, run_backtest
from .schemas import (
    BrokerConfig,
    BrokerResult,
    BrokerSimRequest,
    BrokerSimResponse,
    DaySnapshot,
    PredictRequest,
    PredictResponse,
    PricePoint,
    PricesResponse,
    SimulateResponse,
)
from .sentiment import ModelNotReady, predict_many, predict_one
from .signals import signals_for

app = FastAPI(title="Crypto Sentiment Trading Simulation API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=C.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------- #
# Health
# --------------------------------------------------------------------------- #
@app.get("/")
def health():
    return {
        "status": "ok",
        "model_loaded": C.model_available(),
        "message": "Model ready." if C.model_available()
        else "Model not loaded yet — place the exported folder in backend/model/.",
    }


# --------------------------------------------------------------------------- #
# Sentiment of a single headline
# --------------------------------------------------------------------------- #
@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    try:
        return predict_one(req.text)
    except ModelNotReady as e:
        raise HTTPException(status_code=503, detail=str(e))


# --------------------------------------------------------------------------- #
# BTC price history (works without the model)
# --------------------------------------------------------------------------- #
@app.get("/prices", response_model=PricesResponse)
def prices(start: str | None = None, end: str | None = None):
    df = D.load_btc_prices(start, end)
    points = [PricePoint(date=d.strftime("%Y-%m-%d"), close=float(c))
              for d, c in df["close"].items()]
    return PricesResponse(ticker=C.BTC_TICKER, points=points)


# --------------------------------------------------------------------------- #
# Full simulation: score news -> signals -> backtest vs buy-and-hold
# --------------------------------------------------------------------------- #
# Scored headlines are cached (in memory + on disk) so changing only strategy
# sliders never re-runs the model — the expensive scoring happens at most once.
_sentiment_cache: pd.DataFrame | None = None


def _daily_sentiment() -> pd.DataFrame:
    global _sentiment_cache
    if _sentiment_cache is not None:
        return _sentiment_cache
    if C.SENTIMENT_PATH.exists():
        _sentiment_cache = pd.read_parquet(C.SENTIMENT_PATH)
        return _sentiment_cache

    text = D.load_crypto_text()
    scored = text.join(predict_many(text["text"].tolist()))
    scored.to_parquet(C.SENTIMENT_PATH, index=False)
    _sentiment_cache = scored
    return _sentiment_cache


# --------------------------------------------------------------------------- #
# Multi-broker simulation — correct day-by-day serving
#
# On EVERY trading day the model serves each broker once, in queue order.
# Queue order is a weighted-random shuffle decided once per request (not per day).
# Each broker has its own strategy params so their signals and equity curves differ.
# --------------------------------------------------------------------------- #
@app.post("/simulate/brokers", response_model=BrokerSimResponse)
def simulate_brokers(req: BrokerSimRequest):
    try:
        scored = _daily_sentiment()
    except ModelNotReady as e:
        raise HTTPException(status_code=503, detail=str(e))

    if not req.brokers:
        raise HTTPException(status_code=422, detail="Provide at least one broker.")

    prices = D.load_btc_prices(req.start, req.end)
    trading_days = list(prices.index)

    # Weighted-random shuffle decides which broker gets slot 1, 2, 3… for every day.
    # Higher weight → more likely to be first, but not guaranteed.
    ordered = sorted(
        req.brokers,
        key=lambda b: random.random() ** (1.0 / max(b.weight, 0.01)),
        reverse=True,
    )
    queue_order = [b.name for b in ordered]

    # Pre-compute signals for every broker (each has different params).
    # This is where the model "serves" each broker: it scores the same news
    # but applies each broker's threshold/smoothing to produce their unique signals.
    broker_signals = {}
    for broker in ordered:
        broker_signals[broker.name] = signals_for(
            scored,
            threshold=broker.threshold,
            smoothing_window=broker.smoothing_window,
            allow_short=broker.allow_short,
        )

    # Run each broker's backtest using their own signals and capital.
    broker_backtests = {}
    for broker in ordered:
        broker_backtests[broker.name] = run_backtest(
            prices,
            broker_signals[broker.name],
            initial_capital=broker.initial_capital,
            transaction_cost_bps=broker.transaction_cost_bps,
        )

    # Build daily_snapshots: for every trading day, cycle through all brokers
    # in queue order so the frontend can animate "Day 1 → serve A, serve B, serve C
    # → Day 2 → serve A, serve B, serve C → …"
    daily_snapshots: list[DaySnapshot] = []
    for day in trading_days:
        date_str = day.strftime("%Y-%m-%d")
        for broker_name in queue_order:
            daily_snapshots.append(DaySnapshot(date=date_str, serving=broker_name))

    # Build per-broker result curves and metrics
    broker_results: list[BrokerResult] = []
    buy_hold_curve = None

    for slot, broker in enumerate(ordered):
        bt = broker_backtests[broker.name]
        metrics = performance_metrics(bt)

        curve = [
            {
                "date": d.strftime("%Y-%m-%d"),
                "equity": float(r.equity),
                "buy_hold_equity": float(r.buy_hold_equity),
                "close": float(r.close),
                "sentiment": None if pd.isna(r.sentiment) else float(r.sentiment),
                "position": int(r.position),
            }
            for d, r in bt.iterrows()
        ]

        if buy_hold_curve is None:
            buy_hold_curve = curve

        broker_results.append(BrokerResult(
            name=broker.name,
            weight=broker.weight,
            initial_capital=broker.initial_capital,
            metrics=metrics["strategy"],
            curve=curve,
            queue_slot=slot + 1,
        ))

    return BrokerSimResponse(
        buy_hold_curve=buy_hold_curve,
        brokers=broker_results,
        queue_order=queue_order,
        daily_snapshots=daily_snapshots,
    )


@app.get("/simulate", response_model=SimulateResponse)
def simulate(
    threshold: float = Query(C.SENTIMENT_THRESHOLD, ge=0.0, le=1.0),
    smoothing_window: int = Query(C.SMOOTHING_WINDOW, ge=1, le=30),
    allow_short: bool = C.ALLOW_SHORT,
    initial_capital: float = Query(C.INITIAL_CAPITAL, gt=0),
    transaction_cost_bps: float = Query(C.TRANSACTION_COST_BPS, ge=0, le=100),
    start: str | None = None,
    end: str | None = None,
):
    try:
        scored = _daily_sentiment()
    except ModelNotReady as e:
        raise HTTPException(status_code=503, detail=str(e))

    prices = D.load_btc_prices(start, end)
    signals = signals_for(
        scored, threshold=threshold, smoothing_window=smoothing_window, allow_short=allow_short
    )
    bt = run_backtest(prices, signals, initial_capital=initial_capital,
                      transaction_cost_bps=transaction_cost_bps)
    metrics = performance_metrics(bt)

    curve = [
        {
            "date": d.strftime("%Y-%m-%d"),
            "equity": float(r.equity),
            "buy_hold_equity": float(r.buy_hold_equity),
            "close": float(r.close),
            "sentiment": None if pd.isna(r.sentiment) else float(r.sentiment),
            "position": int(r.position),
        }
        for d, r in bt.iterrows()
    ]
    params = {
        "threshold": threshold, "smoothing_window": smoothing_window,
        "allow_short": allow_short,
        "initial_capital": initial_capital, "transaction_cost_bps": transaction_cost_bps,
    }
    return SimulateResponse(params=params, metrics=metrics, curve=curve)
