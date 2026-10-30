"""
Trading Dashboard Backend - FastAPI server
Provides REST endpoints and WebSocket for live trading data
Wraps existing binancedata.py logic + SQLite trade tracking
"""

from __future__ import annotations

import asyncio
import json
import os
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd
import requests
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .database import (
    add_trade,
    add_watchlist,
    delete_trade,
    get_trade_stats,
    get_trades,
    get_watchlist,
    get_setting,
    set_setting,
    get_db,
)

# ---------------------------------------------------------------------------
# Lifespan & globals
# ---------------------------------------------------------------------------

# Binance config (read from env or defaults)
BINANCE_ENV = os.getenv("BINANCE_ENV", "demo")
BINANCE_MARKET = os.getenv("BINANCE_MARKET", "futures")
MIN_VOLUME = float(os.getenv("MIN_VOLUME", "1000"))

BASE_URLS = {
    ("spot", "live"): "https://api.binance.com",
    ("spot", "demo"): "https://demo-api.binance.com",
    ("futures", "live"): "https://fapi.binance.com",
    ("futures", "demo"): "https://demo-fapi.binance.com",
}

TICKER_PATHS = {
    "spot": "/api/v3/ticker/24hr",
    "futures": "/fapi/v1/ticker/24hr",
}

EXCHANGE_INFO_PATHS = {
    "spot": "/api/v3/exchangeInfo",
    "futures": "/fapi/v1/exchangeInfo",
}

ACCOUNT_PATHS = {
    "spot": "/api/v3/account",
    "futures": "/fapi/v2/balance",
}

# Binance kline/candlestick paths
KLINE_PATHS = {
    "spot": "/api/v3/klines",
    "futures": "/fapi/v1/klines",
}

# Global state for live WS connections
active_ws_clients: set[WebSocket] = set()


def _resolve_base_url() -> str:
    return BASE_URLS.get((BINANCE_MARKET, BINANCE_ENV), BASE_URLS[("futures", "demo")])


def _request_json(session, url, *, headers=None):
    """GET JSON with helpful errors (mirrors binancedata.py style)."""
    try:
        resp = session.get(url, headers=headers, timeout=20)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        raise RuntimeError(f"Binance request failed: {e}")


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialise DB
    from . import database
    database.init_db()
    
    # Start background price fetcher
    import threading
    from .binancedata import fetch_24hr_tickers, fetch_tradable_symbols, build_snapshot
    import requests as req
    
    base_url = _resolve_base_url()
    
    def fetch_loop():
        session = req.Session()
        while True:
            try:
                tickers_df = fetch_24hr_tickers(base_url, BINANCE_MARKET, session)
                symbols = fetch_tradable_symbols(base_url, BINANCE_MARKET, "USDT", session)
                snapshot = build_snapshot(base_url, BINANCE_MARKET, "USDT", MIN_VOLUME, session)
                
                # Push to all WS clients
                data = snapshot.to_dict(orient="records")
                payload = json.dumps({
                    "type": "market_data",
                    "timestamp": datetime.utcnow().isoformat(),
                    "symbols": len(snapshot),
                    "data": data,
                })
                for ws in list(active_ws_clients):
                    try:
                        ws.send_text(payload)
                    except Exception:
                        active_ws_clients.discard(ws)
            except Exception as e:
                print(f"[fetch_loop] error: {e}")
            time.sleep(5)  # 5-second polling
    
    thread = threading.Thread(target=fetch_loop, daemon=True)
    thread.start()
    print("[lifespan] background fetcher started")
    
    yield
    # Cleanup on shutdown
    print("[lifespan] shutting down")


# ---------------------------------------------------------------------------
# FastAPI app setup
# ---------------------------------------------------------------------------

def create_app() -> FastAPI:
    app = FastAPI(
        title="Trading Dashboard API",
        version="1.0.0",
        lifespan=lifespan,
    )
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # tweak for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # ------------------------------------------------------------------
    # Market data endpoints
    # ------------------------------------------------------------------
    
    @app.get("/api/market/tickers")
    async def get_tickers(
        quote: str = "USDT",
        market: str | None = None,
        min_volume: float = MIN_VOLUME,
    ):
        """Fetch filtered market tickers (same logic as binancedata.py build_snapshot)."""
        import requests as req
        from .binancedata import fetch_24hr_tickers, fetch_tradable_symbols, build_snapshot
        
        market = market or BINANCE_MARKET
        base_url = _resolve_base_url()
        session = req.Session()
        
        tickers_df = fetch_24hr_tickers(base_url, market, session)
        tradable = fetch_tradable_symbols(base_url, market, quote, session)
        snapshot = build_snapshot(base_url, market, quote, min_volume, session)
        
        # Only return symbols that are in our filtered snapshot
        data = snapshot[snapshot["symbol"].isin(tradable)].copy()
        records = data.to_dict(orient="records")
        
        return {
            "timestamp": pd.Timestamp.utcnow().isoformat(),
            "quote": quote,
            "count": len(records),
            "data": records,
        }
    
    @app.get("/api/market/gainers")
    async def get_gainers(
        top: int = 20,
        quote: str = "USDT",
        min_volume: float = MIN_VOLUME,
    ):
        """Top gainers by 24h price change %."""
        import requests as req
        from .binancedata import fetch_24hr_tickers, build_snapshot
        
        base_url = _resolve_base_url()
        session = req.Session()
        tickers_df = fetch_24hr_tickers(base_url, BINANCE_MARKET, session)
        snapshot = build_snapshot(base_url, BINANCE_MARKET, quote, min_volume, session)
        
        top_gainers = (
            snapshot[snapshot["quoteVolume"] >= min_volume]
            .sort_values("priceChangePercent", ascending=False)
            .head(top)
        )
        
        columns = ["symbol", "lastPrice", "priceChangePercent", "quoteVolume", "highPrice", "lowPrice"]
        data = top_gainers[columns].to_dict(orient="records")
        
        return {"data": data, "top": top, "quote": quote}
    
    @app.get("/api/market/losers")
    async def get_losers(
        top: int = 20,
        quote: str = "USDT",
        min_volume: float = MIN_VOLUME,
    ):
        """Top losers by 24h price change %."""
        import requests as req
        from .binancedata import fetch_24hr_tickers, build_snapshot
        
        base_url = _resolve_base_url()
        session = req.Session()
        tickers_df = fetch_24hr_tickers(base_url, BINANCE_MARKET, session)
        snapshot = build_snapshot(base_url, BINANCE_MARKET, quote, min_volume, session)
        
        top_losers = (
            snapshot[snapshot["quoteVolume"] >= min_volume]
            .sort_values("priceChangePercent", ascending=True)
            .head(top)
        )
        
        columns = ["symbol", "lastPrice", "priceChangePercent", "quoteVolume", "highPrice", "lowPrice"]
        data = top_losers[columns].to_dict(orient="records")
        
        return {"data": data, "top": top, "quote": quote}
    
    @app.get("/api/market/volume-leaders")
    async def get_volume_leaders(
        top: int = 20,
        quote: str = "USDT",
        min_volume: float = MIN_VOLUME,
    ):
        """Top volume leaders by 24h quote volume."""
        import requests as req
        from .binancedata import fetch_24hr_tickers, build_snapshot
        
        base_url = _resolve_base_url()
        session = req.Session()
        tickers_df = fetch_24hr_tickers(base_url, BINANCE_MARKET, session)
        snapshot = build_snapshot(base_url, BINANCE_MARKET, quote, min_volume, session)
        
        volume_leaders = (
            snapshot[snapshot["quoteVolume"] >= min_volume]
            .sort_values("quoteVolume", ascending=False)
            .head(top)
        )
        
        columns = ["symbol", "lastPrice", "priceChangePercent", "quoteVolume", "highPrice", "lowPrice"]
        data = volume_leaders[columns].to_dict(orient="records")
        
        return {"data": data, "top": top, "quote": quote}
    
    @app.get("/api/market/{symbol}/ticker")
    async def get_symbol_ticker(symbol: str, quote: str = "USDT"):
        """Get current ticker for a specific symbol."""
        import requests as req
        from .binancedata import fetch_24hr_tickers, fetch_tradable_symbols
        
        market = BINANCE_MARKET
        base_url = _resolve_base_url()
        session = req.Session()
        tickers_df = fetch_24hr_tickers(base_url, market, session)
        
        # Filter for the specific symbol
        symbol_data = tickers_df[tickers_df["symbol"] == symbol.upper()]
        if symbol_data.empty:
            raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found")
        
        row = symbol_data.iloc[0]
        return {
            "symbol": row["symbol"],
            "lastPrice": float(row["lastPrice"]),
            "priceChange": float(row["priceChange"]),
            "priceChangePercent": float(row["priceChangePercent"]),
            "quoteVolume": float(row["quoteVolume"]),
            "highPrice": float(row["highPrice"]),
            "lowPrice": float(row["lowPrice"]),
            "timestamp": datetime.fromtimestamp(row["closeTime"] / 1000).isoformat(),
        }
    
    @app.get("/api/market/{symbol}/klines")
    async def get_klines(
        symbol: str,
        interval: str = "1h",
        limit: int = 100,
        quote: str = "USDT",
    ):
        """Fetch candlestick/kline data from Binance."""
        import requests as req
        
        # Validate interval
        valid_intervals = ["1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h", "1d", "3d", "1w", "1M"]
        if interval not in valid_intervals:
            raise HTTPException(status_code=400, detail=f"Invalid interval. Choose from: {valid_intervals}")
        
        # Binance limits max 1000 candles per request
        limit = min(max(limit, 1), 1000)
        
        base_url = _resolve_base_url()
        session = req.Session()
        url = f"{base_url}{KLINE_PATHS['futures'] if BINANCE_MARKET == 'futures' else KLINE_PATHS['spot']}"
        
        params = {
            "symbol": symbol.upper(),
            "interval": interval,
            "limit": limit,
        }
        
        try:
            resp = session.get(url, params=params, timeout=20)
            resp.raise_for_status()
            candles = resp.json()
            
            # Format: [open_time, open, high, low, close, volume, close_time, quote_asset_volume, trades, taker_buy_base_vol, taker_buy_quote_vol, ignore]
            formatted = []
            for c in candles:
                formatted.append({
                    "timestamp": c[0] / 1000,  # open time in seconds
                    "open": float(c[1]),
                    "high": float(c[2]),
                    "low": float(c[3]),
                    "close": float(c[4]),
                    "volume": float(c[5]),
                    "quoteVolume": float(c[7]),
                    "trades": int(c[8]),
                })
            
            return {
                "symbol": symbol.upper(),
                "interval": interval,
                "count": len(formatted),
                "data": formatted,
            }
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Binance klines error: {str(e)}")
    
    # ------------------------------------------------------------------
    # Account & balances (optional, read-only)
    # ------------------------------------------------------------------
    
    @app.get("/api/account/balances")
    async def get_balances(api_key: str | None = None, api_secret: str | None = None):
        """Fetch account balances (requires API key/secret if not configured)."""
        import requests as req
        
        market = BINANCE_MARKET
        base_url = _resolve_base_url()
        api_key = api_key or os.getenv("BINANCE_API_KEY")
        api_secret = api_secret or os.getenv("BINANCE_API_SECRET")
        
        if not api_key or not api_secret:
            return {
                "note": "No API credentials provided. Set BINANCE_API_KEY/BINANCE_API_SECRET env vars or pass them.",
                "balances": [],
            }
        
        client = req.Session()
        params = {"timestamp": int(time.time() * 1000), "recvWindow": 5000}
        
        # Simple HMAC signing
        import hashlib, hmac as hmac_mod
        query = "&".join([f"{k}={v}" for k, v in params.items()])
        signature = hmac_mod.new(
            api_secret.encode("utf-8"), query.encode("utf-8"), hashlib.sha256
        ).hexdigest()
        signed_url = f"{ACCOUNT_PATHS[market]}?{query}&signature={signature}"
        
        try:
            resp = client.get(signed_url, headers={"X-MBX-APIKEY": api_key}, timeout=20)
            resp.raise_for_status()
            payload = resp.json()
            
            if market == "spot":
                balances = payload.get("balances", [])
                rows = [
                    {"asset": item.get("asset"), "free": float(item.get("free", 0)), "locked": float(item.get("locked", 0))}
                    for item in balances
                ]
            else:
                rows = [
                    {"asset": item.get("asset"), "balance": float(item.get("balance", 0))}
                    for item in payload
                    if isinstance(item, dict)
                ]
            
            # Filter non-zero
            non_zero = [r for r in rows if r.get("free", 0) > 0 or r.get("locked", 0) > 0]
            
            return {"balances": non_zero}
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Binance account error: {str(e)}")
    
    # ------------------------------------------------------------------
    # Trade history (SQLite)
    # ------------------------------------------------------------------
    
    @app.get("/api/trades")
    async def list_trades(
        symbol: str | None = None,
        limit: int = 100,
    ):
        """Get trade history from SQLite."""
        trades = get_trades(symbol=symbol, limit=limit)
        return {"trades": trades}
    
    @app.post("/api/trades")
    async def create_trade(
        symbol: str,
        side: str,  # "buy" or "sell"
        price: float,
        quantity: float,
        realized_pnl: float = 0.0,
    ):
        """Record a new trade in SQLite."""
        add_trade(symbol, side, price, quantity, realized_pnl)
        return {"status": "recorded", "symbol": symbol, "side": side, "price": price, "quantity": quantity}
    
    @app.delete("/api/trades/{trade_id}")
    async def delete_trade_endpoint(trade_id: int):
        """Delete a trade from history."""
        delete_trade(trade_id)
        return {"status": "deleted", "trade_id": trade_id}
    
    @app.get("/api/trades/stats")
    async def trade_stats():
        """Get trade statistics from SQLite."""
        stats = get_trade_stats()
        return stats
    
    # ------------------------------------------------------------------
    # Watchlist (SQLite)
    # ------------------------------------------------------------------
    
    @app.get("/api/watchlist")
    async def get_watchlist_endpoint():
        """Get current watchlist."""
        return {"watchlist": get_watchlist()}
    
    @app.post("/api/watchlist")
    async def add_to_watchlist(symbol: str):
        """Add symbol to watchlist."""
        add_watchlist(symbol.upper())
        return {"status": "added", "symbol": symbol.upper()}
    
    @app.delete("/api/watchlist/{symbol}")
    async def remove_from_watchlist(symbol: str):
        """Remove symbol from watchlist."""
        remove_watchlist(symbol.upper())
        return {"status": "removed", "symbol": symbol.upper()}
    
    # ------------------------------------------------------------------
    # Settings (SQLite)
    # ------------------------------------------------------------------
    
    @app.get("/api/settings")
    async def get_settings():
        """Get application settings."""
        # Check if API keys are configured
        api_key = os.getenv("BINANCE_API_KEY")
        api_secret = os.getenv("BINANCE_API_SECRET")
        env = os.getenv("BINANCE_ENV", "demo")
        market = os.getenv("BINANCE_MARKET", "futures")
        
        return {
            "api_configured": bool(api_key and api_secret),
            "environment": env,
            "market": market,
            "min_volume": MIN_VOLUME,
        }
    
    @app.post("/api/settings")
    async def set_settings(env: str | None = None, market: str | None = None, min_volume: float | None = None):
        """Update application settings."""
        if env:
            set_setting("BINANCE_ENV", env)
        if market:
            set_setting("BINANCE_MARKET", market)
        if min_volume is not None:
            set_setting("MIN_VOLUME", min_volume)
        
        # Update globals
        global BINANCE_ENV, BINANCE_MARKET, MIN_VOLUME
        if env:
            BINANCE_ENV = env
        if market:
            BINANCE_MARKET = market
        if min_volume is not None:
            MIN_VOLUME = min_volume
        
        return {"status": "updated"}
    
    # ------------------------------------------------------------------
    # WebSocket endpoint for live prices
    # ------------------------------------------------------------------
    
    @app.websocket("/api/ws/prices")
    async def ws_prices(websocket: WebSocket):
        await websocket.accept()
        active_ws_clients.add(websocket)
        try:
            # Send initial data
            import requests as req
            from .binancedata import fetch_24hr_tickers, fetch_tradable_symbols, build_snapshot
            
            base_url = _resolve_base_url()
            session = req.Session()
            tickers_df = fetch_24hr_tickers(base_url, BINANCE_MARKET, session)
            tradable = fetch_tradable_symbols(base_url, BINANCE_MARKET, "USDT", session)
            snapshot = build_snapshot(base_url, BINANCE_MARKET, "USDT", MIN_VOLUME, session)
            
            data = snapshot[snapshot["symbol"].isin(tradable)].copy()
            initial = {
                "type": "market_data",
                "timestamp": datetime.utcnow().isoformat(),
                "symbols": len(snapshot),
                "data": [row.to_dict() for _, row in snapshot.iterrows()],
            }
            await websocket.send_text(json.dumps(initial))
            
            # Keep connection alive - client will receive updates from background fetcher
            while True:
                # Just keep the connection alive
                await asyncio.sleep(30)
        except WebSocketDisconnect:
            active_ws_clients.discard(websocket)
        except Exception as e:
            print(f"[WS] error: {e}")
            active_ws_clients.discard(websocket)
    
    return app


# Create the app instance
app = create_app()