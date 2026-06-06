"""Daily backtest of the sentiment strategy vs buy-and-hold (no look-ahead)."""
from __future__ import annotations

import numpy as np
import pandas as pd

from . import config as C


def run_backtest(
    prices: pd.DataFrame,
    signals: pd.DataFrame,
    initial_capital: float = C.INITIAL_CAPITAL,
    transaction_cost_bps: float = C.TRANSACTION_COST_BPS,
) -> pd.DataFrame:
    """Equity curve indexed by date for the strategy and buy-and-hold."""
    cost = transaction_cost_bps / 10_000.0
    df = pd.DataFrame(index=prices.index.copy())
    df["close"] = prices["close"]
    df["sentiment"] = signals["sentiment_smooth"].reindex(df.index).ffill()
    df["position"] = signals["position"].reindex(df.index).ffill().fillna(0)

    df["market_return"] = df["close"].pct_change().fillna(0.0)
    df["position_eff"] = df["position"].shift(1).fillna(0)        # trade today, earn tomorrow
    turnover = df["position_eff"].diff().abs().fillna(df["position_eff"].abs())
    df["strategy_return"] = df["position_eff"] * df["market_return"] - turnover * cost

    df["equity"] = initial_capital * (1.0 + df["strategy_return"]).cumprod()
    df["buy_hold_equity"] = initial_capital * (1.0 + df["market_return"]).cumprod()
    return df


def performance_metrics(bt: pd.DataFrame) -> dict:
    return {
        "strategy": _metrics(bt["strategy_return"], bt["equity"], bt["position_eff"]),
        "buy_hold": _metrics(bt["market_return"], bt["buy_hold_equity"]),
    }


def _metrics(returns: pd.Series, equity: pd.Series, position=None) -> dict:
    returns = returns.fillna(0.0)
    n = len(returns)
    total = equity.iloc[-1] / equity.iloc[0] - 1.0 if n else 0.0
    years = n / C.TRADING_DAYS_PER_YEAR if n else 0.0
    cagr = (equity.iloc[-1] / equity.iloc[0]) ** (1 / years) - 1 if years > 0 else 0.0
    std = returns.std()
    excess = returns.mean() - C.RISK_FREE_RATE / C.TRADING_DAYS_PER_YEAR
    sharpe = (excess / std * np.sqrt(C.TRADING_DAYS_PER_YEAR)) if std > 0 else 0.0
    dd = ((equity - equity.cummax()) / equity.cummax()).min()
    active = returns[returns != 0]
    win = (active > 0).mean() if len(active) else 0.0
    out = {
        "total_return": float(total), "cagr": float(cagr), "sharpe": float(sharpe),
        "max_drawdown": float(dd), "win_rate": float(win),
    }
    if position is not None:
        out["n_trades"] = int(position.diff().abs().fillna(0).gt(0).sum())
    return out
