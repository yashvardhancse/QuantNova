import { NullableNumber } from '../utils/types';

export interface BollingerBandPoint {
  middle: number;
  upper: number;
  lower: number;
}

export function calculateSma(values: number[], period: number): NullableNumber[] {
  validatePeriod(period);
  return values.map((_, index) => {
    if (index + 1 < period) return null;
    const window = values.slice(index + 1 - period, index + 1);
    return round(window.reduce((sum, value) => sum + value, 0) / period);
  });
}

export function calculateEma(values: number[], period: number): NullableNumber[] {
  validatePeriod(period);
  if (values.length === 0) return [];

  const multiplier = 2 / (period + 1);
  const ema: NullableNumber[] = Array(values.length).fill(null);
  let previous: number | null = null;

  values.forEach((value, index) => {
    if (index + 1 < period) return;

    if (previous === null) {
      const seed = values.slice(index + 1 - period, index + 1);
      previous = seed.reduce((sum, item) => sum + item, 0) / period;
    } else {
      previous = (value - previous) * multiplier + previous;
    }

    ema[index] = round(previous);
  });

  return ema;
}

export function calculateRsi(values: number[], period = 14): NullableNumber[] {
  validatePeriod(period);
  if (values.length === 0) return [];

  const result: NullableNumber[] = Array(values.length).fill(null);
  let averageGain = 0;
  let averageLoss = 0;

  for (let index = 1; index <= period && index < values.length; index += 1) {
    const change = values[index] - values[index - 1];
    averageGain += Math.max(change, 0);
    averageLoss += Math.max(-change, 0);
  }

  if (values.length <= period) return result;

  averageGain /= period;
  averageLoss /= period;
  result[period] = rsiFromAverages(averageGain, averageLoss);

  for (let index = period + 1; index < values.length; index += 1) {
    const change = values[index] - values[index - 1];
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);
    averageGain = (averageGain * (period - 1) + gain) / period;
    averageLoss = (averageLoss * (period - 1) + loss) / period;
    result[index] = rsiFromAverages(averageGain, averageLoss);
  }

  return result;
}

export function calculateAtr(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14,
): NullableNumber[] {
  validatePeriod(period);

  if (highs.length !== lows.length || highs.length !== closes.length) {
    throw new Error('High, low, and close arrays must have the same length.');
  }

  if (highs.length === 0) return [];

  const trueRanges: number[] = [];

  for (let i = 0; i < highs.length; i += 1) {
    if (i === 0) {
      trueRanges.push(highs[i] - lows[i]);
      continue;
    }

    const highLow = highs[i] - lows[i];
    const highPrevClose = Math.abs(highs[i] - closes[i - 1]);
    const lowPrevClose = Math.abs(lows[i] - closes[i - 1]);

    trueRanges.push(Math.max(highLow, highPrevClose, lowPrevClose));
  }

  const atr: NullableNumber[] = Array(highs.length).fill(null);

  if (trueRanges.length < period) return atr;

  let previousAtr = trueRanges.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period;

  atr[period - 1] = round(previousAtr);

  for (let i = period; i < trueRanges.length; i += 1) {
    previousAtr = (previousAtr * (period - 1) + trueRanges[i]) / period;

    atr[i] = round(previousAtr);
  }

  return atr;
}

export function calculateBollingerBands(
  values: number[],
  period = 20,
  standardDeviationMultiplier = 2,
): Array<BollingerBandPoint | null> {
  validatePeriod(period);
  return values.map((_, index) => {
    if (index + 1 < period) return null;
    const window = values.slice(index + 1 - period, index + 1);
    const middle = window.reduce((sum, value) => sum + value, 0) / period;
    const variance = window.reduce((sum, value) => sum + Math.pow(value - middle, 2), 0) / period;
    const deviation = Math.sqrt(variance);

    return {
      middle: round(middle),
      upper: round(middle + standardDeviationMultiplier * deviation),
      lower: round(middle - standardDeviationMultiplier * deviation),
    };
  });
}

function validatePeriod(period: number) {
  if (!Number.isInteger(period) || period <= 0) {
    throw new Error('Period must be a positive integer.');
  }
}

function rsiFromAverages(averageGain: number, averageLoss: number): number {
  if (averageLoss === 0) return 100;
  const relativeStrength = averageGain / averageLoss;
  return round(100 - 100 / (1 + relativeStrength));
}

export function round(value: number, decimals = 4): number {
  return Number(value.toFixed(decimals));
}
