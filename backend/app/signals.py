"""Turn per-headline sentiment into a daily trading position {-1, 0, +1}."""
from __future__ import annotations

import numpy as np
import pandas as pd

from . import config as C


def aggregate_daily(scored: pd.DataFrame) -> pd.DataFrame:
    """Collapse scored headlines to one sentiment value per day."""
    df = scored.copy()
    df["date"] = pd.to_datetime(df["date"]).dt.normalize()
    return (
        df.groupby("date")
        .agg(sentiment=("sentiment", "mean"), n_articles=("sentiment", "size"))
        .sort_index()
    )


def build_signals(
    daily: pd.DataFrame,
    threshold: float = C.SENTIMENT_THRESHOLD,
    smoothing_window: int = C.SMOOTHING_WINDOW,
    allow_short: bool = C.ALLOW_SHORT,
) -> pd.DataFrame:
    """Add 'sentiment_smooth' and 'position' columns.

    s >  threshold -> long (+1); s < -threshold -> flat/short; else hold previous.
    """
    out = daily.copy()
    w = max(int(smoothing_window), 1)
    out["sentiment_smooth"] = out["sentiment"].rolling(w, min_periods=1).mean()

    s = out["sentiment_smooth"].to_numpy()
    pos = np.zeros(len(s), dtype=int)
    prev, down = 0, (-1 if allow_short else 0)
    for i, v in enumerate(s):
        if v > threshold:
            prev = 1
        elif v < -threshold:
            prev = down
        pos[i] = prev
    out["position"] = pos
    return out


def signals_for(scored: pd.DataFrame, **kwargs) -> pd.DataFrame:
    return build_signals(aggregate_daily(scored), **kwargs)
