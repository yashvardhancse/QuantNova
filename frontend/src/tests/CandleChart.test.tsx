import { render, screen, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CandleChart } from '../components/CandleChart';
import { MouseEventParams, Time } from 'lightweight-charts';

// Global variables to hold the captured callbacks
let mockSubscribeCrosshairMove: (param: MouseEventParams<Time>) => void;

vi.mock('lightweight-charts', () => {
  const series = {
    setData: vi.fn(),
    applyOptions: vi.fn(),
    priceScale: () => ({ applyOptions: vi.fn() }),
  };
  return {
    BarSeries: 'BarSeries',
    CandlestickSeries: 'CandlestickSeries',
    ColorType: { Solid: 'solid' },
    HistogramSeries: 'HistogramSeries',
    LineSeries: 'LineSeries',
    LineStyle: { Dashed: 1 },
    createSeriesMarkers: () => ({ setMarkers: vi.fn() }),
    createChart: () => ({
      addSeries: () => series,
      applyOptions: vi.fn(),
      remove: vi.fn(),
      subscribeCrosshairMove: vi.fn((cb) => {
        mockSubscribeCrosshairMove = cb;
      }),
      timeScale: () => ({
        fitContent: vi.fn(),
        getVisibleLogicalRange: vi.fn(() => ({ from: 0, to: 10 })),
        setVisibleLogicalRange: vi.fn(),
      }),
    }),
  };
});

const mockCandles = [
  {
    date: '2024-01-15',
    timestamp: '2024-01-15T14:30:00Z',
    open: 42100.5,
    high: 42450.75,
    low: 41950.25,
    close: 42350.0,
    volume: 1234.56,
  },
];

describe('CandleChart Tooltip', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without tooltip initially', () => {
    render(
      <CandleChart
        candles={mockCandles}
        shortSma={[]}
        longSma={[]}
        signals={[]}
        chartType="candlestick"
        showSignals={false}
        showSma={false}
        showVolume={false}
      />,
    );
    expect(screen.queryByTestId('chart-tooltip')).not.toBeInTheDocument();
  });

  it('shows tooltip with formatted OHLCV data on hover', () => {
    // We must mock clientWidth/clientHeight for the tooltip boundary checks
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 800 });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      value: 600,
    });

    render(
      <CandleChart
        candles={mockCandles}
        shortSma={[]}
        longSma={[]}
        signals={[]}
        chartType="candlestick"
        showSignals={false}
        showSma={false}
        showVolume={false}
        selectedSymbol="BTCUSDT"
      />,
    );

    // Simulate crosshair move over the first candle
    act(() => {
      if (mockSubscribeCrosshairMove) {
        mockSubscribeCrosshairMove({
          point: { x: 100, y: 100 },
          time: 1705329000 as Time, // Equivalent to '2024-01-15T14:30:00Z' roughly, though our toChartTime uses floor(Date.parse/1000)
        } as MouseEventParams<Time>);
      }
    });

    // We need to match the actual logic inside CandleChart's toChartTime which uses Math.floor(Date.parse(timestamp)/1000)
    // 2024-01-15T14:30:00Z -> 1705329000
    const timeValue = Math.floor(Date.parse('2024-01-15T14:30:00Z') / 1000) as Time;

    act(() => {
      if (mockSubscribeCrosshairMove) {
        mockSubscribeCrosshairMove({
          point: { x: 100, y: 100 },
          time: timeValue,
        });
      }
    });

    const tooltip = screen.getByTestId('chart-tooltip');
    expect(tooltip).toBeInTheDocument();

    // Check formatted outputs
    expect(screen.getAllByText('BTCUSDT')).toHaveLength(2);
    expect(screen.getByText('2024-01-15 14:30 UTC')).toBeInTheDocument(); // Format check

    expect(screen.getByText('42,100.50')).toBeInTheDocument(); // Open
    expect(screen.getByText('42,450.75')).toBeInTheDocument(); // High
    expect(screen.getByText('41,950.25')).toBeInTheDocument(); // Low
    expect(screen.getByText('42,350.00')).toBeInTheDocument(); // Close
    expect(screen.getByText('1,234.56')).toBeInTheDocument(); // Volume
  });

  it('hides tooltip when crosshair is out of bounds or not on a point', () => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 800 });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      value: 600,
    });

    render(
      <CandleChart
        candles={mockCandles}
        shortSma={[]}
        longSma={[]}
        signals={[]}
        chartType="candlestick"
        showSignals={false}
        showSma={false}
        showVolume={false}
      />,
    );

    const timeValue = Math.floor(Date.parse('2024-01-15T14:30:00Z') / 1000) as Time;

    // Show tooltip
    act(() => {
      if (mockSubscribeCrosshairMove) {
        mockSubscribeCrosshairMove({
          point: { x: 100, y: 100 },
          time: timeValue,
        });
      }
    });
    expect(screen.getByTestId('chart-tooltip')).toBeInTheDocument();

    // Move out of bounds (undefined point)
    act(() => {
      if (mockSubscribeCrosshairMove) {
        mockSubscribeCrosshairMove({
          point: undefined,
          time: undefined,
        });
      }
    });
    expect(screen.queryByTestId('chart-tooltip')).not.toBeInTheDocument();
  });
});
