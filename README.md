# TradeLive — Trading Dashboard

Live trading dashboard built on your existing `binancedata.py` Python backend + React frontend with SQLite storage.

## Project Structure

```
Trade-Live-Stocks/
├── binancedata.py          # Your original Binance CLI scanner
├── backend/
│   ├── __init__.py
│   ├── main.py             # FastAPI server (REST + WebSocket)
│   ├── database.py         # SQLite trade/watchlist/settings
│   ├── binancedata.py      # Copied for import
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── index.css
│       ├── hooks/useDashboard.ts
│       ├── services/api.ts
│       ├── services/websocket.ts
│       └── components/
│           ├── DashboardHeader.tsx
│           ├── PortfolioOverview.tsx
│           ├── TradingChart.tsx
│           ├── TradeHistory.tsx
│           ├── MarketOverview.tsx
│           ├── Watchlist.tsx
│           ├── SettingsPanel.tsx
│           └── Card.tsx
└── run_backend.py          # Uvicorn runner script
```

## Backend API Endpoints (FastAPI)

| Endpoint | Description |
|---|---|
| `GET /api/market/tickers` | Filtered 24h tickers (quote=USDT, min_volume) |
| `GET /api/market/gainers` | Top % gainers |
| `GET /api/market/losers` | Top % losers |
| `GET /api/market/volume-leaders` | Top volume pairs |
| `GET /api/market/{symbol}/ticker` | Single pair ticker |
| `GET /api/market/{symbol}/klines` | Candlestick data (1m to 1w intervals) |
| `GET /api/account/balances` | Account balances (optional — requires BINANCE_API_KEY) |
| `GET /api/trades` | Trade history from SQLite |
| `POST /api/trades` | Record a trade |
| `DELETE /api/trades/{id}` | Delete trade |
| `GET /api/trades/stats` | Win rate / total P&L |
| `GET /api/watchlist` | Watchlist from SQLite |
| `POST /api/watchlist` | Add symbol |
| `DELETE /api/watchlist/{symbol}` | Remove symbol |
| `GET /api/settings` | App settings (env, market, min_volume) |
| `POST /api/settings` | Update settings |
| `WS /api/ws/prices` | Live price updates (5s polling) |

## Setup

### Backend
```bash
# 1. Install
pip install -r backend/requirements.txt

# 2. Run server (includes SQLite init + WebSocket fetcher)
python run_backend.py
# or: python -m uvicorn backend.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Access at `http://localhost:3000`. Backend runs at `http://localhost:8000`.

## SQLite Database

`backend/trading.db` stores:
- `trades` — symbol, side, price, qty, realized_pnl, timestamp
- `watchlist` — tracked symbols
- `settings` — env/market/min_volume

No external database server needed.

## Security — Important

- **No Binance secrets in React code**. The frontend only communicates with your local backend.
- If you want live account balances (`/api/account/balances`), set `BINANCE_API_KEY` and `BINANCE_API_SECRET` as environment variables on the server side only (not in `frontend/`).
- All market data (`/api/market/*`, `/api/ws/prices`) comes from Binance **public APIs** — no API key required.
- Use **read-only** Binance API permissions for account tracking if you do configure keys.

## Binance Integration Scope

The dashboard supports:
- ✅ Live market tracking (tickers, charts, indicators)
- ✅ Portfolio monitoring (trade history from SQLite + optional Binance account balances)
- ✅ Watchlist / settings persistence (SQLite)
- ❌ Automated order execution (not implemented — requires additional `POST /api/orders` endpoint if you need it)

To extend to automated buying/selling, you would add POST endpoints that call Binance `/api/v3/order` with signed requests from the backend.

## Design References

Inspired by Binance, TradingView, and modern fintech dashboards. Built with:
- React 18 + Vite
- Tailwind CSS + custom glassmorphism cards
- Lightweight Charts for candlestick rendering
- Lucide React icons
- SQLite (file-based, no server)
