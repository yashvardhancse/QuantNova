import { ApiBacktestResponse, ApiBinanceCandle, ApiCandle, Candle, TradingPair } from '../utils/types'; // CHANGED: added TradingPair for fetchBinanceSymbols

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export interface IndicatorResponse {
  [key: string]: unknown;
}

export async function getHealth(): Promise<{ status: string; service: string }> {
  return request<{ status: string; service: string }>('/health');
}

export async function getSampleData(): Promise<Candle[]> {
  const candles = await request<ApiCandle[]>('/api/sample-data');
  return candles.map(fromApiCandle);
}

export async function uploadData(file: File): Promise<Candle[]> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_URL}/api/data/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message || `Data upload failed with status ${response.status}.`);
  }

  const candles = (await response.json()) as ApiCandle[];
  return candles.map(fromApiCandle);
}

export async function fetchBinanceKlines(payload: {
  symbol: string;
  interval: string;
  startDate: string;
  endDate: string;
}): Promise<Candle[]> {
  const params = new URLSearchParams({
    symbol: payload.symbol,
    interval: payload.interval,
    start_date: payload.startDate,
    end_date: payload.endDate,
  });
  const candles = await request<ApiBinanceCandle[]>(`/market/binance/klines?${params.toString()}`, {
    headers: {},
  });
  return candles.map(fromBinanceCandle);
}

// CHANGED: fetches the curated popular-pairs list from GET /market/binance/symbols
export async function fetchBinanceSymbols(): Promise<TradingPair[]> {
  return request<TradingPair[]>('/market/binance/symbols');
}

export async function calculateIndicators(
  candles: Candle[],
  config: { sma: number[]; ema: number[]; rsi: number; bollinger: number },
) {
  return request<IndicatorResponse>('/api/indicators', {
    method: 'POST',
    body: JSON.stringify({
      candles: candles.map(toApiCandle),
      indicators: config,
    }),
  });
}

export async function runMaCrossoverBacktest(payload: {
  candles: Candle[];
  shortWindow: number;
  longWindow: number;
  initialCash: number;
  feeRate: number;
}) {
  return request<ApiBacktestResponse>('/api/backtest/ma-crossover', {
    method: 'POST',
    body: JSON.stringify({
      candles: payload.candles.map(toApiCandle),
      short_window: payload.shortWindow,
      long_window: payload.longWindow,
      initial_cash: payload.initialCash,
      fee_rate: payload.feeRate,
    }),
  });
}

function toApiCandle(candle: Candle): ApiCandle {
  return {
    timestamp: candle.timestamp ?? candle.date,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
  };
}

function fromApiCandle(candle: ApiCandle): Candle {
  return {
    date: candle.timestamp,
    timestamp: candle.timestamp,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
  };
}

function fromBinanceCandle(candle: ApiBinanceCandle): Candle {
  const timestamp =
    typeof candle.time === 'number'
      ? new Date(candle.time * 1000).toISOString()
      : String(candle.time);
  return {
    date: timestamp,
    timestamp,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message || `API request failed with status ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) return '';
  try {
    const body = JSON.parse(text) as { detail?: unknown };
    if (typeof body.detail === 'string') return body.detail;
    if (Array.isArray(body.detail)) {
      return body.detail
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && 'msg' in item) {
            return String((item as { msg: unknown }).msg);
          }
          return String(item);
        })
        .join(' ');
    }
  } catch {
    return text;
  }
  return text;
}
