"""Pre-score all crypto headlines once and cache to disk.

Run from the backend/ folder after the model is in place:
    python -m app.precompute

This is the slow step (FinBERT over thousands of headlines on CPU). Doing it
once up front means the first /simulate call is instant.
"""
from __future__ import annotations

import time

from . import config as C
from . import data as D
from .sentiment import predict_many


def main():
    text = D.load_crypto_text()
    print(f"[precompute] scoring {len(text)} headlines on CPU — this can take several minutes…")
    t0 = time.time()
    scored = text.join(predict_many(text["text"].tolist()))
    scored.to_parquet(C.SENTIMENT_PATH, index=False)
    print(f"[precompute] done in {time.time() - t0:.0f}s → cached to {C.SENTIMENT_PATH}")
    print(scored[["date", "label", "sentiment"]].head(5).to_string())


if __name__ == "__main__":
    main()
