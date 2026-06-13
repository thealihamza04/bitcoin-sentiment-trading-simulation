# Backtest results — parameter sweep

BTC-USD, 2021-01-01 → 2023-12-31. Initial capital normalised; metrics are scale-independent.

## Benchmark

| | Trades | Return | Sharpe | Max DD | Win rate |
|---|--:|--:|--:|--:|--:|
| **Buy & Hold** | — | +43.5% | 0.51 | -76.6% | 49% |

## A. Effect of sentiment threshold  (smoothing=3, cost=5 bps, long-only)

| | Trades | Return | Sharpe | Max DD | Win rate |
|---|--:|--:|--:|--:|--:|
| threshold = 0.05 | 49 | -8.9% | 0.26 | -77.0% | 48% |
| threshold = 0.10 | 19 | -3.1% | 0.29 | -72.5% | 48% |
| threshold = 0.15 | 3 | +35.2% | 0.47 | -72.4% | 49% |
| threshold = 0.20 | 3 | +33.5% | 0.47 | -72.7% | 49% |
| threshold = 0.30 | 1 | +23.0% | 0.42 | -76.6% | 49% |

## B. Effect of smoothing window  (threshold=0.10, cost=5 bps, long-only)

| | Trades | Return | Sharpe | Max DD | Win rate |
|---|--:|--:|--:|--:|--:|
| smoothing = 1 d | 91 | +45.1% | 0.51 | -71.4% | 48% |
| smoothing = 3 d | 19 | -3.1% | 0.29 | -72.5% | 48% |
| smoothing = 7 d | 1 | +14.4% | 0.39 | -76.6% | 49% |
| smoothing = 14 d | 1 | +17.7% | 0.40 | -76.6% | 49% |

## C. Overtrading & transaction-cost drag  (threshold=0.00, smoothing=1, long/short)

| | Trades | Return | Sharpe | Max DD | Win rate |
|---|--:|--:|--:|--:|--:|
| cost = 1 bps | 306 | -46.3% | 0.00 | -74.9% | 49% |
| cost = 5 bps | 306 | -57.9% | -0.12 | -79.3% | 48% |
| cost = 10 bps | 306 | -69.0% | -0.28 | -83.8% | 47% |
| cost = 20 bps | 306 | -83.2% | -0.60 | -90.4% | 46% |
| cost = 41 bps | 306 | -95.4% | -1.26 | -97.2% | 44% |

## D. Long-only vs long/short  (threshold=0.10, smoothing=3, cost=5 bps)

| | Trades | Return | Sharpe | Max DD | Win rate |
|---|--:|--:|--:|--:|--:|
| long / flat | 19 | -3.1% | 0.29 | -72.5% | 48% |
| long / short | 19 | -25.0% | 0.17 | -71.1% | 48% |
