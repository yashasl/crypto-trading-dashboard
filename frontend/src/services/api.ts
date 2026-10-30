import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

export default api;

// Market endpoints
export const marketEndpoints = {
  getTickers: (quote = 'USDT', min_volume = 1000) =>
    api.get('/api/market/tickers', { params: { quote, min_volume } }),
  getGainers: (top = 20, quote = 'USDT', min_volume = 1000) =>
    api.get('/api/market/gainers', { params: { top, quote, min_volume } }),
  getLosers: (top = 20, quote = 'USDT', min_volume = 1000) =>
    api.get('/api/market/losers', { params: { top, quote, min_volume } }),
  getVolumeLeaders: (top = 20, quote = 'USDT', min_volume = 1000) =>
    api.get('/api/market/volume-leaders', { params: { top, quote, min_volume } }),
  getSymbolTicker: (symbol: string, quote = 'USDT') =>
    api.get(`/api/market/${symbol}/ticker`, { params: { quote } }),
  getKlines: (symbol: string, interval = '1h', limit = 100, quote = 'USDT') =>
    api.get(`/api/market/${symbol}/klines`, { params: { interval, limit, quote } }),
};

// Account
export const accountEndpoints = {
  getBalances: (apiKey?: string, apiSecret?: string) =>
    api.get('/api/account/balances', { params: { apiKey, apiSecret } }),
};

// Trades
export const tradeEndpoints = {
  getTrades: (symbol?: string, limit = 100) =>
    api.get('/api/trades', { params: { symbol, limit } }),
  createTrade: (trade: { symbol: string; side: string; price: number; quantity: number; realized_pnl: number }) =>
    api.post('/api/trades', trade),
  getStats: () => api.get('/api/trades/stats'),
  deleteTrade: (id: number) => api.delete(`/api/trades/${id}`),
};

// Watchlist
export const watchlistEndpoints = {
  get: () => api.get('/api/watchlist'),
  add: (symbol: string) => api.post('/api/watchlist', null, { params: { symbol } }),
  remove: (symbol: string) => api.delete(`/api/watchlist/${symbol}`),
};

// Settings
export const settingsEndpoints = {
  get: () => api.get('/api/settings'),
  update: (env?: string, market?: string, minVolume?: number) =>
    api.post('/api/settings', null, { params: { env, market, minVolume } }),
};

export const endpoints = {
  market: marketEndpoints,
  account: accountEndpoints,
  trades: tradeEndpoints,
  watchlist: watchlistEndpoints,
  settings: settingsEndpoints,
};
