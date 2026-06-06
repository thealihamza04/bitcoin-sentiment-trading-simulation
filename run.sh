#!/usr/bin/env bash
# Start the backend (FastAPI) and frontend (Vite) together.
# Usage:  ./run.sh        (Ctrl+C stops both)
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# --- sanity checks ---
if [ ! -d "backend/.venv" ]; then
  echo "❌ backend/.venv not found. Run:  cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt"
  exit 1
fi
if [ ! -d "frontend/node_modules" ]; then
  echo "❌ frontend/node_modules not found. Run:  cd frontend && npm install"
  exit 1
fi
if [ ! -f "backend/model/config.json" ]; then
  echo "⚠️  No model in backend/model/ — /predict and /simulate will return 503 until you add it."
fi

# --- stop both on exit ---
PIDS=()
cleanup() {
  echo ""
  echo "🛑 Stopping…"
  for pid in "${PIDS[@]}"; do kill "$pid" 2>/dev/null || true; done
  exit 0
}
trap cleanup INT TERM

# --- backend ---
echo "🚀 Backend  → http://localhost:8000  (docs: /docs)"
( cd backend && .venv/bin/uvicorn app.main:app --port 8000 ) &
PIDS+=($!)

# --- frontend ---
echo "🎨 Frontend → http://localhost:5173"
( cd frontend && npm run dev ) &
PIDS+=($!)

echo ""
echo "✅ Both running. Press Ctrl+C to stop."
wait
