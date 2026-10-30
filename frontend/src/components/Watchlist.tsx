import { Plus, Minus, WifiOff } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

interface Props {
  watchlist: string[];
  tickers: any[];
  addToWatchlist: (symbol: string) => void;
}

export default function Watchlist({ watchlist, tickers, addToWatchlist }: Props) {
  const [newSymbol, setNewSymbol] = useState('');

  const watchlistPrices = watchlist.map(symbol => {
    const ticker = tickers.find((t: any) => t.symbol === symbol);
    return ticker || { symbol, lastPrice: 0, priceChangePercent: 0 };
  });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
        <CardTitle>Watchlist</CardTitle>
        <div className="flex items-center gap-2">
          <input
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
            placeholder="Add symbol"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs focus:ring-2 focus:ring-violet-500 outline-none"
          />
          <button
            onClick={() => {
              if (newSymbol) addToWatchlist(newSymbol);
              setNewSymbol('');
            }}
            className="rounded-lg bg-violet-600 px-3 py-2 text-xs text-white hover:bg-violet-500"
          >
            <Plus className="h-3 w-3 mr-1" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {watchlistPrices.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            <WifiOff className="mx-auto h-6 w-6 mb-2 opacity-50" />
            <p>No symbols in watchlist</p>
            <p className="text-xs mt-2">Add symbols above to track live prices</p>
          </div>
        ) : (
          watchlistPrices.map((item: any) => (
            <div key={item.symbol} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-200">{item.symbol}</span>
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${item.priceChangePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${item.priceChangePercent >= 0 ? '+' : ''}${item.priceChangePercent.toFixed(2)}%
                </span>
                <div className="text-xs text-slate-400">${item.lastPrice.toFixed(2)}</div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function useState(initialValue: any): [any, (v: any) => void] {
  throw new Error('useState must be imported from react');
}