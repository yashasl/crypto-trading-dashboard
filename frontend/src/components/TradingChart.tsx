import { useEffect, useRef } from 'react';
import LightChart, { IChartApi } from 'lightweight-charts';
import { Candle } from '../hooks/useDashboard';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { BarChart3 } from 'lucide-react';

interface Props {
  candles: Candle[];
  symbol: string;
}

export default function TradingChart({ candles, symbol }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = LightChart.create(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: 'solid', color: '#0f172a' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      localization: {
        priceFormatter: (price) => `$${price.toFixed(2)}`,
        timeFormatter: () => '',
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.2, bottom: 0.2 },
      },
      candleLineData: candles.map(c => ({
        time: c.timestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    });

    chartRef.current = chart;

    // Add technical indicators
    // SMA (20-period)
    const smaSeries = chart.addLineSeries({
      color: '#3b82f6',
      lineWidth: 2,
    });
    const smaValues = [];
    for (let i = 0; i < candles.length; i++) {
      if (i < 20) {
        smaValues.push({ time: candles[i].timestamp, value: candles[i].close });
      } else {
        const sum = candles.slice(i - 19, i + 1).reduce((a, c) => a + c.close, 0);
        smaValues.push({ time: candles[i].timestamp, value: sum / 20 });
      }
    }
    smaSeries.setData(smaValues);

    // Bollinger Bands (20, 2 std)
    const upperBB = chart.addLineSeries({ color: '#ef4444', lineWidth: 1 });
    const lowerBB = chart.addLineSeries({ color: '#ef4444', lineWidth: 1 });
    const bbData = [];
    for (let i = 0; i < candles.length; i++) {
      if (i < 20) {
        bbData.push({ time: candles[i].timestamp, upper: candles[i].close, lower: candles[i].close });
      } else {
        const slice = candles.slice(i - 19, i + 1);
        const mean = slice.reduce((a, c) => a + c.close, 0) / 20;
        const std = Math.sqrt(slice.reduce((a, c, _, arr) => a + Math.pow(c.close - mean, 2), 0) / 20);
        bbData.push({ time: candles[i].timestamp, upper: mean + 2 * std, lower: mean - 2 * std });
      }
      upperBB.setData([{ time: candles[i].timestamp, value: bbData[i].upper }]);
      lowerBB.setData([{ time: candles[i].timestamp, value: bbData[i].lower }]);
    }

    return () => chart.remove();
  }, [candles]);

  useEffect(() => {
    if (chartRef.current && candles.length > 0) {
      chartRef.current.timeScale().scrollToRealTime();
    }
  }, [candles]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          <BarChart3 className="inline h-4 w-4 mr-2" />
          {symbol}
        </CardTitle>
        <div className="text-xs text-slate-400">1H Chart</div>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="w-full" />
      </CardContent>
    </Card>
  );
}