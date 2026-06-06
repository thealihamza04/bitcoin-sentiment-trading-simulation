"""Sentiment inference.

Heavy ML libraries (torch/transformers) are imported lazily inside the loader so
the API server boots even before the model folder exists or those libs are
installed. The model is loaded once and cached for the process lifetime.
"""
from __future__ import annotations

from functools import lru_cache

import pandas as pd

from . import config as C


class ModelNotReady(RuntimeError):
    """Raised when /predict or /simulate is called before the model is present."""


@lru_cache(maxsize=1)
def _get_pipeline():
    if not C.model_available():
        raise ModelNotReady(
            "No model found in backend/model/. Export it from Colab, unzip it, "
            "and place config.json + model weights + tokenizer files there."
        )
    # Lazy imports — only needed once a real model is loaded.
    import torch
    from transformers import (
        AutoModelForSequenceClassification,
        AutoTokenizer,
        pipeline,
    )

    tok = AutoTokenizer.from_pretrained(C.MODEL_DIR)
    model = AutoModelForSequenceClassification.from_pretrained(C.MODEL_DIR)
    device = 0 if torch.cuda.is_available() else -1
    return pipeline(
        "text-classification",
        model=model,
        tokenizer=tok,
        top_k=None,
        truncation=True,
        max_length=C.MAX_SEQ_LENGTH,
        device=device,
    )


def _row(scores: list[dict]) -> dict:
    probs = {d["label"].lower(): float(d["score"]) for d in scores}
    pos, neg, neu = probs.get("positive", 0.0), probs.get("negative", 0.0), probs.get("neutral", 0.0)
    label = max(("positive", "neutral", "negative"), key=lambda k: probs.get(k, 0.0))
    return {
        "label": label,
        "p_negative": neg,
        "p_neutral": neu,
        "p_positive": pos,
        "sentiment": pos - neg,
    }


def predict_one(text: str) -> dict:
    return _row(_get_pipeline()([text])[0])


def predict_many(texts: list[str], batch_size: int = 32) -> pd.DataFrame:
    results = _get_pipeline()(list(texts), batch_size=batch_size)
    return pd.DataFrame([_row(r) for r in results])
