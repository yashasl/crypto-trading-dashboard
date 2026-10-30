import { Activity, Wifi, WifiOff, XCircle, Settings, Bell, User } from 'lucide-react';

interface Props {
  wsStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  apiConfigured: boolean;
  env: string;
  market: string;
  onSettingsClick?: () => void;
}

export default function DashboardHeader({ wsStatus, apiConfigured, env, market, onSettingsClick }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-600/20">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight">Trade<span className="gradient-text">Live</span></div>
            <div className="text-xs text-slate-400">Binance Trading Dashboard</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs">
            <span className={`h-2 w-2 rounded-full ${wsStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : wsStatus === 'disconnected' ? 'bg-red-400' : 'bg-amber-400 animate-pulse'}`} />
            <span className="text-slate-300">WS: {wsStatus}</span>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs">
            <div className={`h-2 w-2 rounded-full ${apiConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-slate-300">API: {apiConfigured ? 'Live' : 'Demo/None'}</span>
          </div>

          <span className="rounded-full bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300">
            {env} / {market}
          </span>

          <button onClick={onSettingsClick} className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white">
            <Settings className="h-4 w-4" />
          </button>

          <button className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white">
            <Bell className="h-4 w-4" />
          </button>

          <button className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white">
            <User className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
