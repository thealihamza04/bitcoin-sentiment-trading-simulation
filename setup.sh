#!/usr/bin/env bash
# One-time setup: create the backend venv + install all deps, then install the
# frontend deps. Safe to re-run (idempotent). After this, use ./run.sh.
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "════════════════════════════════════════════"
echo "  Bitcoin Sentiment Trading Simulation setup"
echo "════════════════════════════════════════════"

# ---------- prerequisites ----------
need() { command -v "$1" >/dev/null 2>&1 || { echo "❌ '$1' is required but not installed."; exit 1; }; }
need python3
need node
need npm
echo "✓ python3 $(python3 --version 2>&1 | awk '{print $2}') | node $(node -v) | npm $(npm -v)"

# ---------- backend ----------
echo ""
echo "▶ Backend (FastAPI)…"
cd "$ROOT/backend"
if [ ! -d ".venv" ]; then
  echo "  creating virtual environment (.venv)…"
  python3 -m venv .venv
fi
./.venv/bin/python -m pip install --upgrade pip -q

# CPU-only torch wheel first (much smaller than the default CUDA build).
echo "  installing PyTorch (CPU build)…"
./.venv/bin/pip install -q torch --index-url https://download.pytorch.org/whl/cpu

echo "  installing backend requirements…"
./.venv/bin/pip install -q -r requirements.txt
echo "✓ backend deps installed"

# ---------- frontend ----------
echo ""
echo "▶ Frontend (React + Vite)…"
cd "$ROOT/frontend"
npm install --no-fund --no-audit
echo "✓ frontend deps installed"

# ---------- model check ----------
echo ""
if [ -f "$ROOT/backend/model/config.json" ]; then
  echo "✓ model found in backend/model/"
else
  echo "⚠️  No model in backend/model/ yet."
  echo "   Train it in Colab (colab/), download finbert-finetuned.zip, and unzip"
  echo "   its contents into backend/model/  (see backend/model/README.md)."
fi

echo ""
echo "✅ Setup complete!  Start everything with:  ./run.sh"
