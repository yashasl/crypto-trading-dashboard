import { Save, Key, Globe, Settings as SettingsIcon } from 'lucide-react';
import { useState as useReactState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

interface Props {
  settings: {
    api_configured: boolean;
    environment: string;
    market: string;
    min_volume: number;
  };
  onSave: (env: string, market: string, minVolume: number) => void;
}

export default function SettingsPanel({ settings, onSave }: Props) {
  const [env, setEnv] = useReactState(settings.environment);
  const [market, setMarket] = useReactState(settings.market);
  const [minVolume, setMinVolume] = useReactState(settings.min_volume);
  const [apiKey, setApiKey] = useReactState('');
  const [apiSecret, setApiSecret] = useReactState('');

  return (
    <Card>
      <CardHeader>
        <CardTitle><SettingsIcon className="inline h-4 w-4 mr-2" />Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-xs font-medium text-slate-400">Binance API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={settings.api_configured ? "Configured in backend" : "Enter API key (optional)"}
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
          />
          <p className="text-xs text-slate-500 mt-1">Read-only API key recommended for portfolio tracking</p>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400">Binance Secret</label>
          <input
            type="password"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            placeholder="Enter API secret (optional)"
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-400">Environment</label>
            <select
              value={env}
              onChange={(e) => setEnv(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="demo">Demo</option>
              <option value="live">Live</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400">Market</label>
            <select
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="spot">Spot</option>
              <option value="futures">Futures</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400">Min 24h Volume</label>
          <input
            type="number"
            value={minVolume}
            onChange={(e) => setMinVolume(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <button
          onClick={() => onSave(env, market, minVolume)}
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition"
        >
          <Save className="h-4 w-4" />
          Save Settings
        </button>
      </CardContent>
    </Card>
  );
}

function useState(initial: any): [any, (v: any) => void] {
  throw new Error('import useState from react');
}