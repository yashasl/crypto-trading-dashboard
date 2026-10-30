import { TrendingUp, TrendingDown, Plus, ShieldCheck, Activity, Wallet } from 'lucide-react';
import { Card, CardContent } from './Card';

interface Props {
  stats: { total_trades: number; wins: number; total_pnl: number };
  tickersCount: number;
}

export default function PortfolioOverview({ stats, tickersCount }: Props) {
  const totalBalance = 100000 + stats.total_pnl;
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-5 flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/20 to-violet-600/5 border border-violet-500/20">
            <Wallet className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Total Portfolio</div>
            <div className="text-xl font-bold tracking-tight">${totalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <div className="text-xs font-medium text-emerald-400 mt-1">+2.34% today</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20">
            <TrendingUp className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Realized P&L</div>
            <div className={`text-xl font-bold tracking-tight ${stats.total_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${stats.total_pnl.toFixed(2)}</div>
            <div className="text-xs text-slate-400 mt-1">{stats.total_trades} trades executed</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/20">
            <ShieldCheck className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Win Rate</div>
            <div className="text-xl font-bold tracking-tight text-white">{stats.total_trades > 0 ? Math.round((stats.wins / stats.total_trades) * 100) : 0}%</div>
            <div className="text-xs text-slate-400 mt-1">{stats.wins} winning trades</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-500/5 border border-rose-500/20">
            <Activity className="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Active Markets</div>
            <div className="text-xl font-bold tracking-tight text-white">{tickersCount}</div>
            <div className="text-xs text-slate-400 mt-1">Binance futures / spot</div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}