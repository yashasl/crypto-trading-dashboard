import sqlite3
import json
import os
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).with_name("trading.db")

TRAINING_TABLE = """
CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL,
    price REAL NOT NULL,
    quantity REAL NOT NULL,
    realized_pnl REAL DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)
"""

WATCHLIST_TABLE = """
CREATE TABLE IF NOT EXISTS watchlist (
    symbol TEXT PRIMARY KEY,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
"""

SETTINGS_TABLE = """
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
)
"""

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute(TRAINING_TABLE)
    conn.execute(WATCHLIST_TABLE)
    conn.execute(SETTINGS_TABLE)
    conn.commit()
    conn.close()

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def add_trade(symbol, side, price, quantity, realized_pnl=0):
    conn = get_db()
    conn.execute("INSERT INTO trades (symbol, side, price, quantity, realized_pnl) VALUES (?, ?, ?, ?, ?)",
                 (symbol, side, price, quantity, realized_pnl))
    conn.commit()
    conn.close()

def get_trades(symbol=None, limit=100):
    conn = get_db()
    if symbol:
        rows = conn.execute("SELECT * FROM trades WHERE symbol = ? ORDER BY timestamp DESC LIMIT ?", (symbol, limit)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM trades ORDER BY timestamp DESC LIMIT ?", (limit,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def delete_trade(trade_id):
    conn = get_db()
    conn.execute("DELETE FROM trades WHERE id = ?", (trade_id,))
    conn.commit()
    conn.close()

def get_trade_stats():
    conn = get_db()
    total = conn.execute("SELECT COUNT(*) FROM trades").fetchone()[0]
    wins = conn.execute("SELECT COUNT(*) FROM trades WHERE realized_pnl > 0").fetchone()[0]
    total_pnl = conn.execute("SELECT COALESCE(SUM(realized_pnl), 0) FROM trades").fetchone()[0]
    conn.close()
    return {"total_trades": total, "wins": wins, "total_pnl": total_pnl or 0}

def add_watchlist(symbol):
    conn = get_db()
    conn.execute("INSERT OR IGNORE INTO watchlist (symbol) VALUES (?)", (symbol,))
    conn.commit()
    conn.close()

def remove_watchlist(symbol):
    conn = get_db()
    conn.execute("DELETE FROM watchlist WHERE symbol = ?", (symbol,))
    conn.commit()
    conn.close()

def get_watchlist():
    conn = get_db()
    rows = conn.execute("SELECT symbol, added_at FROM watchlist").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def set_setting(key, value):
    conn = get_db()
    conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, str(value)))
    conn.commit()
    conn.close()

def get_setting(key, default=None):
    conn = get_db()
    row = conn.execute("SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
    conn.close()
    return row[0] if row else default

init_db()
