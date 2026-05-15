import { calculateSma, round } from '../indicators';
import { BacktestResult, Candle, EquityPoint, Trade } from '../utils/types';

interface MovingAverageCrossoverOptions {
  shortPeriod: number;
  longPeriod: number;
  initialCash: number;
}

export function runMovingAverageCrossoverBacktest(
  candles: Candle[],
  options: MovingAverageCrossoverOptions,
): BacktestResult {
  if (options.shortPeriod >= options.longPeriod) {
    throw new Error('Short period must be less than long period.');
  }

  const closes = candles.map((candle) => candle.close);
  const shortSma = calculateSma(closes, options.shortPeriod);
  const longSma = calculateSma(closes, options.longPeriod);
  const trades: Trade[] = [];
  const equityCurve: EquityPoint[] = [];
  let cash = options.initialCash;
  let units = 0;
  let entryPrice = 0;
  let entryDate = '';
  let peakEquity = options.initialCash;
  let maxDrawdown = 0;

  for (let index = 1; index < candles.length; index += 1) {
    const previousShort = shortSma[index - 1];
    const previousLong = longSma[index - 1];
    const currentShort = shortSma[index];
    const currentLong = longSma[index];
    const close = candles[index].close;

    if (
      previousShort !== null &&
      previousLong !== null &&
      currentShort !== null &&
      currentLong !== null
    ) {
      const crossesAbove = previousShort <= previousLong && currentShort > currentLong;
      const crossesBelow = previousShort >= previousLong && currentShort < currentLong;

      if (crossesAbove && units === 0) {
        units = cash / close;
        cash = 0;
        entryPrice = close;
        entryDate = candles[index].date;
      } else if (crossesBelow && units > 0) {
        cash = units * close;
        trades.push(createTrade(entryDate, candles[index].date, entryPrice, close, units));
        units = 0;
      }
    }

    const equity = cash + units * close;
    peakEquity = Math.max(peakEquity, equity);
    const drawdown = peakEquity === 0 ? 0 : (peakEquity - equity) / peakEquity;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
    equityCurve.push({
      time: candles[index].timestamp ?? candles[index].date,
      value: round(equity, 2),
    });
  }

  if (units > 0 && candles.length > 0) {
    const lastCandle = candles[candles.length - 1];
    cash = units * lastCandle.close;
    trades.push(createTrade(entryDate, lastCandle.date, entryPrice, lastCandle.close, units));
  }

  const netProfit = cash - options.initialCash;
  const winningTrades = trades.filter((trade) => trade.profit > 0).length;

  const sharpeRatio = calculateSharpeRatio(equityCurve.map((point) => point.value));

  return {
    totalTrades: trades.length,
    netProfit: round(netProfit, 2),
    winRate: trades.length === 0 ? 0 : round((winningTrades / trades.length) * 100, 2),
    maxDrawdown: round(maxDrawdown * 100, 2),
    finalEquity: round(cash, 2),
    sharpeRatio,
    trades,
    equityCurve,
  };
}

function calculateSharpeRatio(equityValues: number[]): number {
  if (equityValues.length < 3) {
    return 0;
  }

  const returns: number[] = [];

  for (let index = 1; index < equityValues.length; index += 1) {
    const previous = equityValues[index - 1];

    if (previous !== 0) {
      returns.push((equityValues[index] - previous) / previous);
    }
  }

  if (returns.length < 2) {
    return 0;
  }

  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;

  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;

  const volatility = Math.sqrt(variance);

  if (volatility === 0) {
    return 0;
  }

  return round((mean / volatility) * Math.sqrt(returns.length), 2);
}

function createTrade(
  entryDate: string,
  exitDate: string,
  entryPrice: number,
  exitPrice: number,
  units: number,
): Trade {
  const profit = (exitPrice - entryPrice) * units;

  return {
    entryDate,
    exitDate,
    entryPrice,
    exitPrice,
    profit: round(profit, 2),
    returnPct: round(((exitPrice - entryPrice) / entryPrice) * 100, 2),
  };
}
