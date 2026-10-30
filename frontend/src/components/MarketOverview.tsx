import { ArrowUpRight, ArrowDownRight, BarChart3, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

interface Ticker {
  symbol: string;
  lastPrice: number;
  priceChangePercent: number;
  quoteVolume: number;
}

interface Props {
  gainers: Ticker[];
  losers: Ticker[];
  volumeLeaders: Ticker[];
}

export default function MarketOverview({ gainers, losers, volumeLeaders }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle><TrendingUp className="inline h-4 w-4 mr-2 text-emerald-400" />Top Gainers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {gainers.map((item, i) => (
            <div key={item.symbol} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-white/5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-600">{i + 1}</span>
                <span className="text-sm font-medium">{item.symbol}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-emerald-400 font-medium">+{item.priceChangePercent.toFixed(2)}%</span>
                <div className="text-xs text-slate-400">${item.lastPrice.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle><ArrowDownRight className="inline h-4 w-4 mr-2 text-rose-400" />Top Losers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {losers.map((item, i) => (
            <div key={item.symbol} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-white/5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-600">{i + 1}</span>
                <span className="text-sm font-medium">{item.symbol}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-rose-400 font-medium">{item.priceChangePercent.toFixed(2)}%</span>
                <div className="text-xs text-slate-400">${item.lastPrice.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle><BarChart3 className="inline h-4 w-4 mr-2 text-amber-400" />Volume Leaders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {volumeLeaders.map((item, i) => (
            <div key={item.symbol} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-white/5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-600">{i + 1}</span>
                <span className="text-sm font-medium">{item.symbol}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-300">{(item.quoteVolume / 1e6).toFixed(1)}M</span>
                <div className="text-xs text-slate-400">${item.lastPrice.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}