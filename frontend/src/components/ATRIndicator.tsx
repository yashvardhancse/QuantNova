import React, { useState } from 'react';
import { LineData } from 'lightweight-charts';

interface OHLCVData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ATRIndicatorProps {
  data: OHLCVData[];
  onCalculate?: (atrData: number[]) => void;
}

export const ATRIndicator: React.FC<ATRIndicatorProps> = ({ data, onCalculate }) => {
  const [period, setPeriod] = useState<number>(14);
  const [atrValues, setAtrValues] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const calculateATR = async () => {
    if (!data || data.length < period) {
      setError(`Need at least ${period} candles to calculate ATR`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/indicators/atr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: data.map(candle => ({
            high: candle.high,
            low: candle.low,
            close: candle.close
          })),
          period
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to calculate ATR');
      }

      const result = await response.json();
      setAtrValues(result.atr_values);
      
      if (onCalculate) {
        onCalculate(result.atr_values);
      }
    } catch (err) {
      try {
        const calculatedATR = calculateATRFrontend(data, period);
        setAtrValues(calculatedATR);
        if (onCalculate) {
          onCalculate(calculatedATR);
        }
      } catch (frontendErr) {
        setError(err instanceof Error ? err.message : 'Failed to calculate ATR');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateATRFrontend = (candles: OHLCVData[], atrPeriod: number): number[] => {
    if (candles.length < atrPeriod) {
      throw new Error(`Need at least ${atrPeriod} candles`);
    }

    const trueRanges: number[] = [];
    const atr: number[] = [];

    for (let i = 0; i < candles.length; i++) {
      if (i === 0) {
        trueRanges.push(candles[i].high - candles[i].low);
      } else {

        const tr1 = candles[i].high - candles[i].low;
        const tr2 = Math.abs(candles[i].high - candles[i - 1].close);
        const tr3 = Math.abs(candles[i].low - candles[i - 1].close);
        trueRanges.push(Math.max(tr1, tr2, tr3));
      }
    }

    const multiplier = 2 / (atrPeriod + 1);
    
    let sum = 0;
    for (let i = 0; i < atrPeriod; i++) {
      sum += trueRanges[i];
      atr.push(0); 
    }
    atr[atrPeriod - 1] = sum / atrPeriod;

    for (let i = atrPeriod; i < candles.length; i++) {
      const ema = (trueRanges[i] - atr[i - 1]) * multiplier + atr[i - 1];
      atr.push(ema);
    }

    return atr;
  };

  const getATRChartData = (): LineData[] => {
    return data.map((candle, index) => ({
      time: new Date(candle.timestamp).getTime() / 1000,
      value: atrValues[index] || 0
    })).filter((_, index) => index >= period - 1); 
  };

  const averageATR = atrValues.length > 0
    ? (atrValues.reduce((a, b) => a + b, 0) / atrValues.length).toFixed(2)
    : '0.00';

  const currentATR = atrValues.length > 0
    ? atrValues[atrValues.length - 1].toFixed(2)
    : '0.00';

  return (
    <div className="atr-indicator">
      <div className="indicator-header">
        <h3>Average True Range (ATR)</h3>
        <p className="indicator-description">
          Measures market volatility. Higher values = higher volatility.
        </p>
      </div>

      <div className="indicator-controls">
        <label>
          Period:
          <input
            type="number"
            min="2"
            max="200"
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            disabled={loading}
          />
        </label>
        
        <button onClick={calculateATR} disabled={loading || data.length === 0}>
          {loading ? 'Calculating...' : 'Calculate ATR'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {atrValues.length > 0 && (
        <div className="indicator-stats">
          <div className="stat-item">
            <span className="stat-label">Current ATR:</span>
            <span className="stat-value">{currentATR}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Average ATR:</span>
            <span className="stat-value">{averageATR}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Period:</span>
            <span className="stat-value">{period}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ATRIndicator;
