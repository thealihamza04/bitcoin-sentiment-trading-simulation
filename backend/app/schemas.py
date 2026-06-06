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
