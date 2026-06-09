import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

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
      subscribeCrosshairMove: vi.fn(),
      timeScale: () => ({
        fitContent: vi.fn(),
        getVisibleLogicalRange: vi.fn(() => ({ from: 0, to: 10 })),
        setVisibleLogicalRange: vi.fn(),
      }),
    }),
  };
});

const candles = Array.from({ length: 14 }, (_, index) => ({
  timestamp: `2024-01-${String(index + 1).padStart(2, '0')}`,
  open: 100 + index,
  high: 102 + index,
  low: 99 + index,
  close: 101 + index,
  volume: 1000 + index,
}));

const backtestResponse = {
  summary: {
    initial_cash: 10000,
    final_equity: 10250,
    net_profit: 250,
    net_profit_pct: 2.5,
    total_trades: 1,
    win_rate: 100,
    max_drawdown: 1.2,
  },
  trades: [
    {
      entry_time: '2024-01-05',
      exit_time: '2024-01-10',
      entry_price: 105,
      exit_price: 110,
      quantity: 95,
      profit: 250,
      profit_pct: 4.76,
    },
  ],
  signals: [
    { timestamp: '2024-01-05', type: 'buy', price: 105 },
    { timestamp: '2024-01-10', type: 'sell', price: 110 },
  ],
  equity_curve: [10000, 10100, 10250],
};
let invalidUpload = false;

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
    invalidUpload = false;
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn(mockFetch));
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:QuantNova');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  });

  it('renders the QuantNova dashboard', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'QuantNova' })).toBeInTheDocument();
    expect(screen.getByText('OHLCV loader')).toBeInTheDocument();
    expect(screen.getByText('Strategy results')).toBeInTheDocument();
    expect(screen.getByText('Trade log')).toBeInTheDocument();
    expect(await screen.findAllByText('API connected')).not.toHaveLength(0);
  });

  it('runs a backend backtest and updates metrics/history', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Run Backtest' }));

    expect(await screen.findAllByText('$250.00')).not.toHaveLength(0);
    expect(screen.getByText('Backtest completed successfully.')).toBeInTheDocument();
    expect(localStorage.getItem('QuantNova.backtestHistory')).toContain('SMA crossover');
  });

  it('shows invalid CSV upload errors from the API', async () => {
    const user = userEvent.setup();
    invalidUpload = true;
    render(<App />);

    const file = new File(['timestamp,open,close\n2024-01-01,10,11'], 'bad.csv', {
      type: 'text/csv',
    });
    await user.upload(await screen.findByLabelText('Upload OHLCV file'), file);

    expect(await screen.findByText(/Missing required columns/i)).toBeInTheDocument();
  });

  it('disables Run Backtest for invalid strategy windows', async () => {
    const user = userEvent.setup();
    render(<App />);

    const shortInput = await screen.findByLabelText('Short window');
    await user.clear(shortInput);
    await user.type(shortInput, '1');

    expect(screen.getByText('Short window must be at least 2.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run Backtest' })).toBeDisabled();
  });

  it('exports saved history as CSV', async () => {
    const user = userEvent.setup();
    const click = vi.fn();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Run Backtest' }));
    await user.click(screen.getAllByRole('button', { name: 'History' })[0]);
    vi.spyOn(document, 'createElement').mockReturnValue({
      click,
      set href(_value: string) {},
      set download(_value: string) {},
    } as unknown as HTMLAnchorElement);
    await user.click(screen.getByRole('button', { name: 'Export CSV' }));

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
  });
});

async function mockFetch(input: RequestInfo | URL) {
  const url = String(input);
  if (url.endsWith('/health')) return json({ status: 'ok', service: 'QuantNova-api' });
  if (url.endsWith('/api/sample-data')) return json(candles);
  if (url.endsWith('/api/indicators')) {
    return json({
      sma_5: Array(candles.length).fill(null),
      sma_12: Array(candles.length).fill(null),
      ema_10: Array(candles.length).fill(null),
      rsi_14: Array(candles.length).fill(null),
      bollinger_20: {
        upper: Array(candles.length).fill(null),
        middle: Array(candles.length).fill(null),
        lower: Array(candles.length).fill(null),
      },
    });
  }
  if (url.endsWith('/api/backtest/ma-crossover')) return json(backtestResponse);
  if (url.includes('/market/binance/klines')) return json(candles);
  if (url.endsWith('/api/data/upload')) {
    if (invalidUpload) {
      return new Response(JSON.stringify({ detail: 'Missing required columns: high, low.' }), {
        status: 400,
      });
    }
    return json(candles);
  }
  return new Response('Not found', { status: 404 });
}

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
