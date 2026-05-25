import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarData,
  BarSeries,
  CandlestickData,
  CandlestickSeries,
  ColorType,
  createChart,
  createSeriesMarkers,
  HistogramData,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  ISeriesMarkersPluginApi,
  LineData,
  LineSeries,
  LineStyle,
  MouseEventParams,
  SeriesMarker,
  Time,
} from 'lightweight-charts';

import { BacktestSignal, Candle } from '../utils/types';

export type ChartType = 'candlestick' | 'bar';

interface CandleChartProps {
  candles: Candle[];
  shortSma: Array<number | null>;
  longSma: Array<number | null>;
  signals: BacktestSignal[];
  chartType: ChartType;
  showSignals: boolean;
  showSma: boolean;
  showVolume: boolean;
  chartAction?: 'zoom-in' | 'zoom-out' | 'fit' | null;
  onChartActionHandled?: () => void;
  selectedSymbol?: string;
  selectedInterval?: string;
  onIntervalChange?: (interval: string) => void;
}

interface HoverCandle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function CandleChart({
  candles,
  shortSma,
  longSma,
  signals,
  chartType,
  showSignals,
  showSma,
  showVolume,
  chartAction,
  onChartActionHandled,
  selectedSymbol = 'BTCUSDT',
  selectedInterval = '15m',
  onIntervalChange,
}: CandleChartProps) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const barSeriesRef = useRef<ISeriesApi<'Bar'> | null>(null);
  const shortSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const longSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const candleMarkersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const barMarkersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const candlesRef = useRef<Candle[]>(candles);
  const [hoverCandle, setHoverCandle] = useState<HoverCandle | null>(null);

  const ohlcData = useMemo(
    () =>
      candles.map((candle): CandlestickData<Time> & BarData<Time> => ({
        time: toChartTime(candle.timestamp ?? candle.date),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      })),
    [candles],
  );

  const volumeData = useMemo(
    () =>
      candles.map(
        (candle): HistogramData<Time> => ({
          time: toChartTime(candle.timestamp ?? candle.date),
          value: candle.volume,
          color:
            candle.close >= candle.open ? 'rgba(22, 199, 132, 0.28)' : 'rgba(234, 57, 67, 0.28)',
        }),
      ),
    [candles],
  );

  useEffect(() => {
    candlesRef.current = candles;
  }, [candles]);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#080b12' },
        textColor: '#7f8da3',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(148, 163, 184, 0.13)', style: LineStyle.Dashed },
        horzLines: { color: 'rgba(148, 163, 184, 0.16)', style: LineStyle.Dashed },
      },
      width: chartContainerRef.current.clientWidth,
      height: 540,
      crosshair: {
        mode: 0,
        vertLine: { color: 'rgba(165, 180, 204, 0.42)', style: LineStyle.Dashed },
        horzLine: { color: 'rgba(165, 180, 204, 0.42)', style: LineStyle.Dashed },
      },
      localization: {
        priceFormatter: (price: number) =>
          price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      },
      rightPriceScale: {
        borderColor: 'rgba(148, 163, 184, 0.18)',
        scaleMargins: { top: 0.06, bottom: 0.2 },
      },
      timeScale: {
        borderColor: 'rgba(148, 163, 184, 0.18)',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 6,
        barSpacing: 8,
      },
    });
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#16c784',
      downColor: '#ea3943',
      borderUpColor: '#16c784',
      borderDownColor: '#ea3943',
      wickUpColor: 'rgba(22, 199, 132, 0.9)',
      wickDownColor: 'rgba(234, 57, 67, 0.9)',
      priceLineColor: 'rgba(22, 199, 132, 0.7)',
      priceLineStyle: LineStyle.Dashed,
      priceLineWidth: 1,
    });
    const barSeries = chart.addSeries(BarSeries, {
      upColor: '#16c784',
      downColor: '#ea3943',
      openVisible: true,
      thinBars: false,
      priceLineColor: 'rgba(22, 199, 132, 0.7)',
      priceLineStyle: LineStyle.Dashed,
      priceLineWidth: 1,
      visible: false,
    });
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      lastValueVisible: false,
      priceLineVisible: false,
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.78, bottom: 0 },
    });
    const shortSeries = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 2 });
    const longSeries = chart.addSeries(LineSeries, { color: '#8b5cf6', lineWidth: 2 });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    barSeriesRef.current = barSeries;
    volumeSeriesRef.current = volumeSeries;
    shortSeriesRef.current = shortSeries;
    longSeriesRef.current = longSeries;
    candleMarkersRef.current = createSeriesMarkers(candleSeries, []);
    barMarkersRef.current = createSeriesMarkers(barSeries, []);

    chart.subscribeCrosshairMove((params) => {
      setHoverCandle(readHoveredCandle(params, candlesRef.current));
    });

    const resizeObserver = new ResizeObserver(() => {
      if (!chartContainerRef.current) return;
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      barSeriesRef.current = null;
      shortSeriesRef.current = null;
      longSeriesRef.current = null;
      volumeSeriesRef.current = null;
      candleMarkersRef.current = null;
      barMarkersRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (
      !candleSeriesRef.current ||
      !barSeriesRef.current ||
      !shortSeriesRef.current ||
      !longSeriesRef.current ||
      !volumeSeriesRef.current
    ) {
      return;
    }
    candleSeriesRef.current.setData(ohlcData);
    barSeriesRef.current.setData(ohlcData);
    volumeSeriesRef.current.setData(volumeData);
    shortSeriesRef.current.setData(buildLineData(candles, shortSma));
    longSeriesRef.current.setData(buildLineData(candles, longSma));
    chartRef.current?.timeScale().fitContent();
  }, [candles, longSma, ohlcData, shortSma, volumeData]);

  useEffect(() => {
    candleSeriesRef.current?.applyOptions({ visible: chartType === 'candlestick' });
    barSeriesRef.current?.applyOptions({ visible: chartType === 'bar' });
    shortSeriesRef.current?.applyOptions({ visible: showSma });
    longSeriesRef.current?.applyOptions({ visible: showSma });
    volumeSeriesRef.current?.applyOptions({ visible: showVolume });
  }, [chartType, showSma, showVolume]);

  useEffect(() => {
    const markers = showSignals ? buildSignalMarkers(signals) : [];
    candleMarkersRef.current?.setMarkers(chartType === 'candlestick' ? markers : []);
    barMarkersRef.current?.setMarkers(chartType === 'bar' ? markers : []);
  }, [chartType, showSignals, signals]);

  useEffect(() => {
    if (!chartRef.current || !chartAction) return;
    const scale = chartRef.current.timeScale();
    if (chartAction === 'fit') {
      scale.fitContent();
    } else {
      const range = scale.getVisibleLogicalRange();
      if (range) {
        const span = range.to - range.from;
        const factor = chartAction === 'zoom-in' ? 0.8 : 1.25;
        const center = (range.from + range.to) / 2;
        const nextSpan = Math.max(10, span * factor);
        scale.setVisibleLogicalRange({
          from: center - nextSpan / 2,
          to: center + nextSpan / 2,
        });
      }
    }
    onChartActionHandled?.();
  }, [chartAction, onChartActionHandled]);

  if (candles.length === 0) {
    return <div className="empty-chart">Load OHLCV data to render a chart.</div>;
  }

  return (
    <div className="chart-wrap">
      <div className="chart-toolbar" aria-label="Chart controls">
        <div className="chart-symbol">
          <span className="search-dot" />
          {selectedSymbol}
        </div>
        <div className="chart-timeframes" aria-label="Timeframes">
          {['1m', '5m', '15m', '30m', '1h', '2h', '4h', '12h', '1d', '1w'].map((item) => (
            <button
              key={item}
              className={item === selectedInterval ? 'active' : undefined}
              onClick={() => onIntervalChange?.(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        <div className="chart-tool-spacer" />
        <span className="chart-toolbar-button">Indicators</span>
      </div>
      <div className="chart-stage">
        <div className="lw-chart" ref={chartContainerRef} />
        <div className="chart-hover-card">
          {(hoverCandle ?? candles[candles.length - 1]) ? (
            <OhlcvReadout candle={(hoverCandle ?? toHoverCandle(candles[candles.length - 1]))!} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function OhlcvReadout({ candle }: { candle: HoverCandle }) {
  return (
    <>
      <span>{candle.time}</span>
      <strong>O {formatCompact(candle.open)}</strong>
      <strong>H {formatCompact(candle.high)}</strong>
      <strong>L {formatCompact(candle.low)}</strong>
      <strong>C {formatCompact(candle.close)}</strong>
      <strong>V {formatCompact(candle.volume)}</strong>
    </>
  );
}

function toChartTime(value: string): Time {
  const unix = Date.parse(value);
  return Number.isNaN(unix) ? value : (Math.floor(unix / 1000) as Time);
}

function buildLineData(candles: Candle[], values: Array<number | null>): LineData<Time>[] {
  return values
    .map((value, index) => {
      if (value === null || !candles[index]) return null;
      return {
        time: toChartTime(candles[index].timestamp ?? candles[index].date),
        value,
      };
    })
    .filter((item): item is LineData<Time> => item !== null);
}

function buildSignalMarkers(signals: BacktestSignal[]): SeriesMarker<Time>[] {
  return signals.map((signal) => {
    const isBuy = signal.type === 'buy';
    return {
      time: toChartTime(signal.time || signal.timestamp || ''),
      position: isBuy ? 'belowBar' : 'aboveBar',
      color: isBuy ? '#16c784' : '#ea3943',
      shape: isBuy ? 'arrowUp' : 'arrowDown',
      text: isBuy ? 'BUY' : 'SELL',
    };
  });
}

function readHoveredCandle(params: MouseEventParams<Time>, candles: Candle[]): HoverCandle | null {
  if (params.time === undefined) return null;
  const hoverTime = String(params.time);
  const candle = candles.find(
    (item) => String(toChartTime(item.timestamp ?? item.date)) === hoverTime,
  );
  return candle ? toHoverCandle(candle) : null;
}

function toHoverCandle(candle?: Candle): HoverCandle | null {
  if (!candle) return null;
  return {
    time: candle.timestamp ?? candle.date,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
  };
}

function formatCompact(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
