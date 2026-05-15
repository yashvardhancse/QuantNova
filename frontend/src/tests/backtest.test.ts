import { describe, expect, it } from 'vitest';
import { runMovingAverageCrossoverBacktest } from '../backtest/movingAverageCrossover';
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

  it('calculates sharpe ratio for fallback backtest', () => {
    const result = runMovingAverageCrossoverBacktest(candles, {
      shortPeriod: 2,
      longPeriod: 4,
      initialCash: 1000,
    });
    expect(result.sharpeRatio).toBeTypeOf('number');
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
});
