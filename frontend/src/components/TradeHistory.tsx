import { Trash2, Download, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Trade } from '../hooks/useDashboard';

interface Props {
  trades: Trade[];
  stats: { total_trades: number; wins: number; total_pnl: number };
  onDelete: (id: number) => void;
}

export default function TradeHistory({ trades, stats, onDelete }: Props) {
  const [page, setPage] = useState(1);
  const [filterSymbol, setFilterSymbol] = useState('');
  const [filterSide, setFilterSide] = useState<'all' | 'buy' | 'sell'>('all');
  const itemsPerPage = 10;

  const filteredTrades = useMemo(() => {
    return trades.filter(t => {
      const matchSymbol = !filterSymbol || t.symbol.toLowerCase().includes(filterSymbol.toLowerCase());
      const matchSide = filterSide === 'all' || t.side === filterSide;
      return matchSymbol && matchSide;
    });
  }, [trades, filterSymbol, filterSide]);

  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);
  const paginatedTrades = filteredTrades.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Trade History</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div className="p-4 border-b border-white/10">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Filter by symbol..."
                value={filterSymbol}
                onChange={(e) => setFilterSymbol(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <select
              value={filterSide}
              onChange={(e) => setFilterSide(e.target.value as any)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="all">All</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
            <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10">
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {trades.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-slate-400">
            No trades recorded yet
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="p-3 text-left font-medium text-slate-300">Time</th>
                    <th className="p-3 text-left font-medium text-slate-300">Symbol</th>
                    <th className="p-3 text-left font-medium text-slate-300">Side</th>
                    <th className="p-3 text-right font-medium text-slate-300">Price</th>
                    <th className="p-3 text-right font-medium text-slate-300">Qty</th>
                    <th className="p-3 text-right font-medium text-slate-300">P&L</th>
                    <th className="p-3 text-center font-medium text-slate-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTrades.map((trade) => (
                    <tr key={trade.id} className="border-t border-white/5 hover:bg-white/5">
                      <td className="p-3 text-slate-400 font-mono">
                        {new Date(trade.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3 font-medium">{trade.symbol}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          trade.side === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {trade.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono">${trade.price.toFixed(4)}</td>
                      <td className="p-3 text-right font-mono">{trade.quantity.toFixed(4)}</td>
                      <td className="p-3 text-right font-mono font-medium">
                        <span className={trade.realized_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          ${trade.realized_pnl.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onDelete(trade.id)}
                          className="text-slate-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-white/10">
                <div className="text-sm text-slate-400">
                  Page {page} of {totalPages} — {filteredTrades.length} trades
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-white/10 bg-white/5 p-2 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border border-white/10 bg-white/5 p-2 disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}