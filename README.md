# 📊 Crypto Sentiment Trading Simulation

An end-to-end NLP project: a fine-tuned **FinBERT** model reads Bitcoin news,
turns daily sentiment into **trading signals**, and a **backtest** replays real
BTC history to compare the strategy against buy-and-hold.

Three tiers:

```
COLAB (train)  ──model folder──▶  FASTAPI (inference + simulate)  ◀──JSON──▶  REACT (dashboard)
   cloud, once                         backend/ (this machine)              frontend/ (browser)
```

## Quick start
```bash
./setup.sh    # one-time: create backend venv + install backend & frontend deps
./run.sh      # start backend (:8000) and frontend (:5173) together
```
Then add the trained model to `backend/model/` (see below) and open
http://localhost:5173.

## Repository layout
```
.
├── colab/                 # Stage 1 — training notebook (train, test, export model)
├── backend/               # Stage 2 — FastAPI inference + simulation API
│   ├── app/               #   main.py, sentiment.py, data.py, signals.py, backtest.py
│   ├── model/             #   ← drop the exported FinBERT folder here
│   └── requirements.txt
└── frontend/              # Stage 3 — React + Vite dashboard
    └── src/               #   App.jsx, api.js, components/
```

## Stage 1 — Train in Google Colab
Run the training notebook on a **GPU runtime** (Runtime → Change runtime type →
T4 GPU). It fine-tunes FinBERT on Financial PhraseBank, reports accuracy /
macro-F1 / confusion matrix, then exports `finbert-finetuned.zip`. Download it.

## Stage 2 — Backend (FastAPI)
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt           # for CPU torch see note below
uvicorn app.main:app --reload             # http://localhost:8000  (docs at /docs)
```
**Add the model:** unzip `finbert-finetuned.zip` and copy its contents into
`backend/model/` (see `backend/model/README.md`). Restart the server — `GET /`
will report `"model_loaded": true`.

> CPU-only machine? Install torch from the smaller wheel first:
> `pip install torch --index-url https://download.pytorch.org/whl/cpu`

Endpoints: `GET /` (health) · `POST /predict` (headline → sentiment) ·
`GET /prices` (BTC history) · `GET /simulate` (run the backtest).

## Stage 3 — Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev                                # http://localhost:5173
```
The API URL is set in `frontend/.env` (`VITE_API_URL`). The dashboard has
strategy sliders, an equity-curve vs buy-and-hold chart, a price+sentiment
chart, and a live headline sentiment tester.

**Frontend stack:** React + Vite · **Tailwind v4 + shadcn/ui** (dark theme,
Geist font) · **Recharts** (equity curve) + **TradingView lightweight-charts**
(BTC price) · **TanStack Query + axios** (data layer) · **lucide-react** icons ·
**Framer Motion** animations · **sonner** toasts.

## Run order
1. Train + export in Colab → get the model folder.
2. Start the backend, drop the model in `backend/model/`, restart.
3. Start the frontend, open `http://localhost:5173`, click **Run simulation**.

> Note: `/prices` works without the model; `/predict` and `/simulate` return a
> clear 503 until the model folder is in place.
