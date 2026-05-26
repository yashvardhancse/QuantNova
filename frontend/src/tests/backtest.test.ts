import { describe, expect, it } from 'vitest';
import {
  calculateSharpeRatio,
  runMovingAverageCrossoverBacktest,
} from '../backtest/movingAverageCrossover';
import { Candle } from '../utils/types';

const closes = [10, 9, 8, 9, 10, 11, 12, 11, 10, 9, 8, 7];
const candles: Candle[] = closes.map((close, index) => ({
  date: `2024-01-${String(index + 1).padStart(2, '0')}`,
  open: close,
  high: close + 1,
  low: close - 1,
  close,
  volume: 1000 + index,
}));

describe('moving average crossover backtest', () => {
  it('creates real trades from crossover signals', () => {
    const result = runMovingAverageCrossoverBacktest(candles, {
      shortPeriod: 2,
      longPeriod: 4,
      initialCash: 1000,
    });

    expect(result.totalTrades).toBe(1);
    expect(result.trades[0]).toMatchObject({
      entryDate: '2024-01-05',
      exitDate: '2024-01-09',
      entryPrice: 10,
      exitPrice: 10,
      profit: 0,
    });
    expect(result.finalEquity).toBe(1000);
  });

  it('requires the short period to be less than the long period', () => {
    expect(() =>
      runMovingAverageCrossoverBacktest(candles, {
        shortPeriod: 5,
        longPeriod: 5,
        initialCash: 1000,
      }),
    ).toThrow('Short period must be less than long period.');
  });

  it('includes a sharpe ratio in the result', () => {
    const result = runMovingAverageCrossoverBacktest(candles, {
      shortPeriod: 2,
      longPeriod: 4,
      initialCash: 1000,
    });

    expect(typeof result.sharpeRatio).toBe('number');
    expect(Number.isFinite(result.sharpeRatio)).toBe(true);
  });
});

describe('calculateSharpeRatio', () => {
  it('returns 0 for fewer than 3 equity values', () => {
    expect(calculateSharpeRatio([])).toBe(0);
    expect(calculateSharpeRatio([100])).toBe(0);
    expect(calculateSharpeRatio([100, 110])).toBe(0);
  });

  it('returns 0 when all equity values are the same', () => {
    expect(calculateSharpeRatio([100, 100, 100, 100])).toBe(0);
  });

  it('returns a positive ratio for consistently rising equity', () => {
    const rising = [100, 105, 110, 115, 120, 125];
    const ratio = calculateSharpeRatio(rising);
    expect(ratio).toBeGreaterThan(0);
  });

  it('returns a negative ratio for consistently falling equity', () => {
    const falling = [100, 95, 90, 85, 80, 75];
    const ratio = calculateSharpeRatio(falling);
    expect(ratio).toBeLessThan(0);
  });

  it('skips zero-valued previous entries to avoid division by zero', () => {
    expect(calculateSharpeRatio([0, 0, 100, 110, 120])).toBeGreaterThan(0);
  });

  it('returns a finite number for volatile equity curves', () => {
    const volatile = [100, 120, 90, 130, 80, 140];
    const ratio = calculateSharpeRatio(volatile);
    expect(Number.isFinite(ratio)).toBe(true);
  });
});
