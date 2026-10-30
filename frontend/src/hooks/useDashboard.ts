import { useEffect, useState, useCallback } from 'react';
import { WebSocketType } from './services/websocket';
import axios from 'axios';

const API = 'http://localhost:8000';

export interface Ticker {
  symbol: string;
  lastPrice: number;
  priceChangePercent: number;
  quoteVolume: number;
  highPrice: number;
  lowPrice: number;
}

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Trade {
  id: number;
  symbol: string;
  side: string;
  price: number;
  quantity: number;
  realized_pnl: number;
  timestamp: string;
}

export interface PortfolioStat {
  total_trades: number;
  wins: number;
  total_pnl: number;
}

export default function useDashboard() {
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [gainers, setGainers] = useState<Ticker[]>([]);
  const [losers, setLosers] = useState<Ticker[]>([]);
  const [volumeLeaders, setVolumeLeaders] = useState<Ticker[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<PortfolioStat>({ total_trades: 0, wins: 0, total_pnl: 0 });
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [settings, setSettings] = useState({ api_configured: false, environment: 'demo', market: 'futures', min_volume: 1000 });
  const [candleData, setCandleData] = useState<Candle[]>([]);
  const [activeSymbol, setActiveSymbol] = useState('BTCUSDT');
  const [wsStatus, setWsStatus] = useState('connecting');
  const [loading, setLoading] = useState(true);

  // Load market data
  const fetchMarket = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/market/tickers`);
      setTickers(res.data.data || []);
    } catch { /* silent */ }
  }, []);

  const fetchGainers = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/market/gainers?top=10&quote=USDT`);
      setGainers(res.data.data || []);
    } catch { /* silent */ }
  }, []);

  const fetchLosers = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/market/losers?top=10&quote=USDT`);
      setLosers(res.data.data || []);
    } catch { /* silent */ }
  }, []);

  const fetchVolume = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/market/volume-leaders?top=10&quote=USDT`);
      setVolumeLeaders(res.data.data || []);
    } catch { /* silent */ }
  }, []);

  // Load trades / stats / watchlist
  const fetchTrades = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/trades?limit=20`);
      setTrades(res.data.trades || []);
    } catch { /* silent */ }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/trades/stats`);
      setStats(res.data || { total_trades: 0, wins: 0, total_pnl: 0 });
    } catch { /* silent */ }
  }, []);

  const fetchWatchlist = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/watchlist`);
      setWatchlist((res.data.watchlist || []).map((w: any) => w.symbol));
    } catch { /* silent */ }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/settings`);
      setSettings(res.data || settings);
    } catch { /* silent */ }
  }, []);

  const fetchCandles = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/market/${activeSymbol}/klines?interval=1h&limit=60`);
      setCandleData(res.data.data || []);
    } catch { /* silent */ }
  }, [activeSymbol]);

  // WebSocket connect for live updates
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/api/ws/prices');
    ws.onopen = () => { setWsStatus('connected'); };
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'market_data') {
          const symbols = msg.data || [];
          const mapped = symbols.map((d: any) => ({
            symbol: d.symbol,
            lastPrice: d.lastPrice,
            priceChangePercent: d.priceChangePercent,
            quoteVolume: d.quoteVolume,
            highPrice: d.highPrice,
            lowPrice: d.lowPrice,
          }));
          setTickers(mapped);
        }
      } catch { /* ignore bad frames */ }
    };
    ws.onclose = () => { setWsStatus('disconnected'); };
    ws.onerror = () => { setWsStatus('error'); };

    return () => ws.close();
  }, []);

  // Load all at mount
  useEffect(() => {
    Promise.all([
      fetchMarket(),
      fetchGainers(),
      fetchLosers(),
      fetchVolume(),
      fetchTrades(),
      fetchStats(),
      fetchWatchlist(),
      fetchSettings(),
      fetchCandles(),
    ]).then(() => setLoading(false));
  }, [fetchMarket, fetchGainers, fetchLosers, fetchVolume, fetchTrades, fetchStats, fetchWatchlist, fetchSettings, fetchCandles]);

  // Refresh tickers every 5s
  useEffect(() => {
    const id = setInterval(() => fetchMarket(), 5000);
    return () => clearInterval(id);
  }, [fetchMarket]);

  return {
    tickers, gainers, losers, volumeLeaders, trades, stats,
    watchlist, settings, candleData, activeSymbol, setActiveSymbol,
    wsStatus, loading, fetchCandles, fetchTrades, fetchStats,
  };
}
