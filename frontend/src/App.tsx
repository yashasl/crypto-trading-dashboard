import { useState, useCallback } from 'react';
import DashboardHeader from './components/DashboardHeader';
import PortfolioOverview from './components/PortfolioOverview';
import TradingChart from './components/TradingChart';
import TradeHistory from './components/TradeHistory';
import MarketOverview from './components/MarketOverview';
import Watchlist from './components/Watchlist';
import SettingsPanel from './components/SettingsPanel';
import useDashboard from './hooks/useDashboard';
import { Card, CardContent } from './components/Card';

export default function App() {
  const {
    tickers, gainers, losers, volumeLeaders, trades, stats,
    watchlist, settings, candleData, activeSymbol,
    wsStatus, loading,
    fetchCandles, fetchTrades
  } = useDashboard();

  const [showSettings, setShowSettings] = useState(false);

  const handleAddWatchlist = useCallback(async (symbol: string) => {
    try {
      const { watchlistEndpoints } = await import('./services/api');
      await watchlistEndpoints.add(symbol);
      window.location.reload();
    } catch { /* ignore */ }
  }, []);

  const handleDeleteTrade = useCallback(async (id: number) => {
    try {
      const { tradeEndpoints } = await import('./services/api');
      await tradeEndpoints.deleteTrade(id);
      fetchTrades();
    } catch { /* ignore */ }
  }, [fetchTrades]);

  const handleSaveSettings = useCallback(async (env: string, market: string, minVolume: number) => {
    try {
      const { settingsEndpoints } = await import('./services/api');
      await settingsEndpoints.update(env, market, minVolume);
      window.location.reload();
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-slate-100 font-sans antialiased">
      <DashboardHeader
        wsStatus={wsStatus}
        apiConfigured={settings.api_configured}
        env={settings.environment}
        market={settings.market}
        onSettingsClick={() => setShowSettings(!showSettings)}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <PortfolioOverview stats={stats} tickersCount={tickers.length} />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <TradingChart candles={candleData} symbol={activeSymbol} />

            <div className="grid gap-6 lg:grid-cols-3">
              <MarketOverview gainers={gainers} losers={losers} volumeLeaders={volumeLeaders} />
            </div>
          </div>

          <div className="space-y-6">
            <Watchlist watchlist={watchlist} tickers={tickers} addToWatchlist={handleAddWatchlist} />

            <Card className="flex flex-col">
              <CardContent className="p-5">
                <h3 className="text-sm font-medium text-slate-300 mb-2">API Status</h3>
                <div className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${wsStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : wsStatus === 'disconnected' ? 'bg-rose-400' : 'bg-amber-400 animate-pulse'}`} />
                  <span className="text-xs">WebSocket: <strong className="text-white">{wsStatus}</strong></span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${settings.api_configured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className="text-xs">Binance API: <strong className="text-white">{settings.api_configured ? 'Live' : 'Demo / Not Configured'}</strong></span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <TradeHistory trades={trades} stats={stats} onDelete={handleDeleteTrade} />

        {showSettings && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold tracking-tight">Dashboard Settings</h2>
            <SettingsPanel settings={settings} onSave={handleSaveSettings} />
          </div>
        )}
      </main>
    </div>
  );
}