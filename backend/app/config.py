"""Central backend configuration."""
from __future__ import annotations

from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = BACKEND_DIR / "model"          # drop the exported Colab model folder here
DATA_DIR = BACKEND_DIR / "data"             # cached prices / news
DATA_DIR.mkdir(parents=True, exist_ok=True)

BTC_PRICES_PATH = DATA_DIR / "btc_prices.parquet"
CRYPTO_TEXT_PATH = DATA_DIR / "crypto_text.parquet"
SENTIMENT_PATH = DATA_DIR / "sentiment.parquet"   # cached per-headline scores

# Sentiment label space (must match the fine-tuned model).
LABELS = ["negative", "neutral", "positive"]
LABEL2ID = {l: i for i, l in enumerate(LABELS)}
ID2LABEL = {i: l for l, i in LABEL2ID.items()}
MAX_SEQ_LENGTH = 128

# Price data
BTC_TICKER = "BTC-USD"
BTC_START = "2021-01-01"
BTC_END = "2023-12-31"

# Strategy / simulation defaults
SENTIMENT_THRESHOLD = 0.10
SMOOTHING_WINDOW = 5
ALLOW_SHORT = False
INITIAL_CAPITAL = 10_000.0
TRANSACTION_COST_BPS = 10.0
RISK_FREE_RATE = 0.0
TRADING_DAYS_PER_YEAR = 365

# CORS: the Vite dev server origins allowed to call this API.
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


def model_available() -> bool:
    """True once a usable model folder has been placed in backend/model/."""
    return (MODEL_DIR / "config.json").exists() and any(
        (MODEL_DIR / f).exists() for f in ("model.safetensors", "pytorch_model.bin")
    )
