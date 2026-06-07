# 🎤 Demo Script — Bitcoin Sentiment Trading Simulation

A ~5-minute live walkthrough for **first-time viewers**. Read the **Say** lines
out loud; do the **Do** lines on screen.

---

## ✅ Before you start (2 min prep)

1. Start everything:
   ```bash
   ./run.sh
   ```
2. Open **http://localhost:5173** in the browser.
3. Confirm the badge top-right says **● model loaded** (green).
4. Wait for the dashboard to auto-run once (skeletons → charts appear).
5. Have a couple of headlines ready to type, e.g.
   - *"Bitcoin soars as a major bank adds crypto custody."* (positive)
   - *"Regulators announce a sweeping crypto ban."* (negative)

> If anything looks blank: refresh the page; if `model not loaded`, the backend
> needs the model in `backend/model/` (see README).

---

## 1. The hook (30s)

> **Say:** "Everyone says *'buy the dip'* or *'the news moves the market.'* So I
> built a system that actually tests it: an AI reads Bitcoin news every day,
> decides to buy or sell based on the mood, and we replay real history to see if
> it would've made money — versus just holding Bitcoin."

---

## 2. The big picture (45s)

> **Do:** Point at the header and sidebar.
>
> **Say:** "There are three pieces. **One** — an AI model called FinBERT reads a
> headline and scores it positive, negative, or neutral. **Two** — we turn that
> daily mood into a buy or sell decision. **Three** — we simulate trading on
> real Bitcoin prices and compare it to buy-and-hold."

---

## 3. Run a simulation (60s)

> **Do:** Point to the **Strategy** sliders on the left.
>
> **Say:** "These control the strategy — how strong the sentiment must be before
> we act, how much we smooth it, and trading fees."
>
> **Do:** Click **Run simulation**.
>
> **Say:** "Now watch — the **green line** is our news-driven strategy, the
> **grey line** is just holding Bitcoin. And up here are the scorecards:
> total return, Sharpe ratio (risk-adjusted return), and the worst drop
> (max drawdown)."

> 💡 Be honest about the result on screen — if green is *below* grey, say:
> "Here the strategy actually *underperformed* holding Bitcoin — which is a real,
> common finding. The point is we can *measure* it."

---

## 4. Make it interactive (45s)

> **Do:** Drag the **Sentiment threshold** slider to a different value, click
> **Run** again.
>
> **Say:** "Because it's all live, I can change the strategy and instantly
> re-test it on three years of history. Try a higher threshold — now it trades
> less often and the curve changes."

> **Optional:** toggle **Allow short positions** and re-run to show it betting
> on price drops too.

---

## 5. The AI, live (60s)

> **Do:** Click **Sentiment tester** (top-right). Type a clearly positive
> headline → **Analyze sentiment**.
>
> **Say:** "This is the actual model running. Watch — I'll type a headline…"
>
> **Do:** Read the result — the **badge** and the **probability bars**.
>
> **Say:** "It says *positive* with high confidence. Let me try a bad one…"
>
> **Do:** Click **Analyze another**, type a negative headline, analyze.
>
> **Say:** "…and now it flips to *negative*. That's the same model that drives
> every buy/sell decision in the simulation."

---

## 6. Wrap up (30s)

> **Say:** "Everything here is **real data** — real Bitcoin prices, real
> headlines, a real fine-tuned model, and an honest backtest with no peeking into
> the future. The takeaway isn't *'this gets rich'* — it's a full pipeline that
> lets you **test whether news-based trading actually works**, with real numbers."

> **Do:** (Optional) Show the GitHub repo / README.

---

## 🛟 Likely questions (quick answers)

- **"Is this live / real-time?"** → No — it's a *backtest* on 2021–2023 history.
  That's the right tool to evaluate a strategy. Live mode would be a future add-on.
- **"Did you train the model?"** → Yes, fine-tuned FinBERT on a labelled
  financial-sentiment dataset, evaluated on a held-out test set.
- **"Why doesn't it beat buy-and-hold?"** → Simple daily sentiment is a weak
  signal, and crypto is volatile. Honestly reporting that is part of good
  science — and you can tune the parameters to explore.
- **"Could it lose money in real life?"** → Yes — backtests don't include
  slippage, and past performance never guarantees the future.
- **"What's the tech?"** → FinBERT (PyTorch/Transformers) → FastAPI backend →
  React dashboard.

---

## ⏱️ Timing cheat-sheet

| Section | Time |
|---|---|
| Hook | 0:30 |
| Big picture | 0:45 |
| Run simulation | 1:00 |
| Interactive | 0:45 |
| AI live | 1:00 |
| Wrap up | 0:30 |
| **Total** | **~4.5 min** |
