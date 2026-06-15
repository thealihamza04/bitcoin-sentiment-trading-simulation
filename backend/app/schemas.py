"""Pydantic request/response models — the JSON contract with the frontend."""
from __future__ import annotations

from pydantic import BaseModel, Field


# ---- /predict ----
class PredictRequest(BaseModel):
    text: str = Field(..., min_length=1, examples=["Bitcoin surges to a new all-time high."])


class PredictResponse(BaseModel):
    label: str
    sentiment: float                # P(pos) - P(neg), in [-1, 1]
    p_negative: float
    p_neutral: float
    p_positive: float


# ---- /prices ----
class PricePoint(BaseModel):
    date: str
    close: float


class PricesResponse(BaseModel):
    ticker: str
    points: list[PricePoint]


# ---- /simulate ----
class MetricSet(BaseModel):
    total_return: float
    cagr: float
    sharpe: float
    max_drawdown: float
    win_rate: float
    n_trades: int | None = None


class EquityPoint(BaseModel):
    date: str
    equity: float
    buy_hold_equity: float
    close: float
    sentiment: float | None = None
    position: int | None = None


class SimulateResponse(BaseModel):
    params: dict
    metrics: dict[str, MetricSet]   # {"strategy": ..., "buy_hold": ...}
    curve: list[EquityPoint]


# ---- /simulate/brokers ----
class BrokerConfig(BaseModel):
    name: str = Field(..., min_length=1)
    weight: float = Field(1.0, ge=0.0, le=1.0)
    initial_capital: float = Field(10_000.0, gt=0)
    threshold: float = Field(0.10, ge=0.0, le=1.0)
    smoothing_window: int = Field(5, ge=1, le=30)
    allow_short: bool = False
    transaction_cost_bps: float = Field(10.0, ge=0, le=100)


class BrokerSimRequest(BaseModel):
    brokers: list[BrokerConfig]
    start: str | None = None
    end: str | None = None


class BrokerResult(BaseModel):
    name: str
    weight: float
    initial_capital: float
    metrics: MetricSet
    curve: list[EquityPoint]
    queue_slot: int   # fixed slot in the daily queue (1 = served first each day)


class DaySnapshot(BaseModel):
    date: str
    serving: str   # which broker the model is serving on this date (cycles through queue_order)


class BrokerSimResponse(BaseModel):
    buy_hold_curve: list[EquityPoint]
    brokers: list[BrokerResult]
    queue_order: list[str]       # broker names in their daily serving order
    daily_snapshots: list[DaySnapshot]  # day-by-day record of which broker was being served
