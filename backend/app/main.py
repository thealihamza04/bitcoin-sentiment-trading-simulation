"""FastAPI inference + simulation API.

Run from the backend/ folder:
    uvicorn app.main:app --reload

Interactive docs: http://localhost:8000/docs
"""
from __future__ import annotations

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from . import config as C
from . import data as D
from .backtest import performance_metrics, run_backtest
from .schemas import (
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
        "allow_short": allow_short, "initial_capital": initial_capital,
        "transaction_cost_bps": transaction_cost_bps,
    }
    return SimulateResponse(params=params, metrics=metrics, curve=curve)
