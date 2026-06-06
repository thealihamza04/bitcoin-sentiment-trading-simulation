"""Data loading: BTC prices (yfinance) and dated crypto headlines (HuggingFace).

Both cache to parquet under backend/data/ so repeated API calls are fast and work
offline after the first fetch.
"""
from __future__ import annotations

import warnings

import pandas as pd

from . import config as C

# Candidate HF datasets for dated crypto headlines: (id, date_col, text_col).
_TEXT_CANDIDATES = [
    ("FadedCalendula/cryptonews_srp_data", "date", "header"),
    ("khaihernlow/bitcoin-news-articles-text-corpora", "published_date", "title"),
]


# --------------------------------------------------------------------------- #
# BTC prices
# --------------------------------------------------------------------------- #
def load_btc_prices(
    start: str | None = None, end: str | None = None, use_cache: bool = True
) -> pd.DataFrame:
    """Daily BTC-USD OHLCV indexed by date; columns include 'close'."""
    start, end = start or C.BTC_START, end or C.BTC_END
    if use_cache and C.BTC_PRICES_PATH.exists():
        return pd.read_parquet(C.BTC_PRICES_PATH).loc[start:end]

    import yfinance as yf

    raw = yf.download(C.BTC_TICKER, start=start, end=end, progress=False, auto_adjust=True)
    if raw.empty:
        raise RuntimeError("yfinance returned no BTC data — check connectivity.")
    if isinstance(raw.columns, pd.MultiIndex):
        raw.columns = raw.columns.get_level_values(0)
    raw = raw.rename(columns=str.lower)[["open", "high", "low", "close", "volume"]]
    raw.index = pd.to_datetime(raw.index).tz_localize(None).normalize()
    raw.index.name = "date"
    raw.to_parquet(C.BTC_PRICES_PATH)
    return raw


# --------------------------------------------------------------------------- #
# Crypto headlines
# --------------------------------------------------------------------------- #
def _normalize(df: pd.DataFrame, date_col: str, text_col: str) -> pd.DataFrame:
    out = df[[date_col, text_col]].rename(columns={date_col: "date", text_col: "text"})
    out["date"] = pd.to_datetime(out["date"], errors="coerce", utc=True).dt.tz_localize(None).dt.normalize()
    out["text"] = out["text"].astype(str).str.split("\n").str[0].str.replace(r"\s+", " ", regex=True).str.strip()
    out = out.dropna(subset=["date"])
    return out[out["text"].str.len() > 0].sort_values("date").reset_index(drop=True)


def load_crypto_text(use_cache: bool = True) -> pd.DataFrame:
    """Dated headlines with columns ['date', 'text'], filtered to the BTC window."""
    if use_cache and C.CRYPTO_TEXT_PATH.exists():
        return pd.read_parquet(C.CRYPTO_TEXT_PATH)

    df = None
    for hid, dcol, tcol in _TEXT_CANDIDATES:
        try:
            from datasets import load_dataset

            cand = load_dataset(hid, split="train").to_pandas()
            if dcol in cand.columns and tcol in cand.columns:
                df = _normalize(cand, dcol, tcol)
                if len(df) > 50:
                    print(f"[data] crypto text from '{hid}' ({len(df)} rows)")
                    break
        except Exception as exc:  # noqa: BLE001
            warnings.warn(f"text candidate '{hid}' failed: {exc}")
            df = None

    if df is None or df.empty:
        print("[data] falling back to synthetic crypto headlines")
        df = _synthetic_text()

    mask = (df["date"] >= pd.Timestamp(C.BTC_START)) & (df["date"] <= pd.Timestamp(C.BTC_END))
    df = df[mask].reset_index(drop=True)
    df.to_parquet(C.CRYPTO_TEXT_PATH, index=False)
    return df


def _synthetic_text() -> pd.DataFrame:
    pos = ["Bitcoin surges as institutional investors pile in",
           "BTC rallies to new highs on strong adoption news",
           "Bitcoin ETF inflows hit record, bulls take control"]
    neg = ["Bitcoin plunges amid regulatory crackdown fears",
           "BTC tumbles as risk-off sentiment grips markets",
           "Exchange hack rattles investors, Bitcoin falls"]
    neu = ["Bitcoin trades sideways as traders await direction",
           "BTC holds steady near key support level"]
    dates = pd.date_range(C.BTC_START, C.BTC_END, freq="D")
    rows = []
    for i, d in enumerate(dates):
        rows.append((d, pos[i % len(pos)]))
        rows.append((d, neg[(i + 1) % len(neg)]))
        if i % 2 == 0:
            rows.append((d, neu[i % len(neu)]))
    return pd.DataFrame(rows, columns=["date", "text"])
