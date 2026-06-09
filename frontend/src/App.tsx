import { useEffect, useMemo, useRef, useState } from 'react';
import {
  calculateIndicators,
  fetchBinanceKlines,
  getHealth,
  getSampleData,
  runMaCrossoverBacktest,
  uploadData,
} from './api/client';
import { CandleChart, ChartType } from './components/CandleChart';
import { DataLoader } from './components/DataLoader';
import { Header } from './components/Header';
import sampleCandles from './data/sample-ohlcv.json';
import { useReplayEngine } from './backtest/useReplayEngine';
import { ReplayControls } from './components/ReplayControls';
import { runMovingAverageCrossoverBacktest } from './backtest/movingAverageCrossover';
import {
  BollingerBandPoint,
  calculateBollingerBands,
  calculateEma,
  calculateRsi,
  calculateSma,
} from './indicators';
import { ApiBacktestResponse, BacktestResult, Candle, NullableNumber, Trade } from './utils/types';
import { createBinanceWebSocket } from './api/binanceWebSocket';
type Section = 'Terminal' | 'Strategies' | 'Portfolio' | 'Backtests' | 'History' | 'Monitor';
type ApiStatus = 'checking' | 'connected' | 'fallback';

interface HistoryEntry {
  id: string;
  strategy: string;
  asset: string;
  timeframe: string;
  netProfit: number;
  winRate: number;
  maxDrawdown: number;
  totalTrades: number;
  status: string;
  timestamp: string;
}

const defaultCandles = sampleCandles as Candle[];
const navItems: Section[] = ['Terminal', 'Strategies', 'Portfolio', 'Backtests', 'History'];
const historyKey = 'QuantNova.backtestHistory';
const defaultLiveRange = getRecentDateRange(7);

function App() {
  const [section, setSection] = useState<Section>(() => readSectionFromHash());
  const [candles, setCandles] = useState<Candle[]>(defaultCandles);
  const [dataSource, setDataSource] = useState('Bundled fallback sample data');
  const [shortWindow, setShortWindow] = useState(5);
  const [longWindow, setLongWindow] = useState(12);
  const [initialCash, setInitialCash] = useState(10_000);
  const [feeRate, setFeeRate] = useState(0.001);
  const [timeframe] = useState('15m');
  const [backtestStartDate, setBacktestStartDate] = useState('');
  const [backtestEndDate, setBacktestEndDate] = useState('');
  const [binanceSymbol, setBinanceSymbol] = useState('BTCUSDT');
  const [binanceInterval, setBinanceInterval] = useState('15m');
  const [binanceStartDate, setBinanceStartDate] = useState(defaultLiveRange.startDate);
  const [binanceEndDate, setBinanceEndDate] = useState(defaultLiveRange.endDate);
  const [chartAction, setChartAction] = useState<'zoom-in' | 'zoom-out' | 'fit' | null>(null);
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [showSignals, setShowSignals] = useState(true);
  const [showSma, setShowSma] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking');
  const [statusMessage, setStatusMessage] = useState('Checking backend health...');
  const [error, setError] = useState<string | null>(null);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [isRunningBacktest, setIsRunningBacktest] = useState(false);
  const [indicatorMenuOpen, setIndicatorMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleIndicators, setVisibleIndicators] = useState({
    smaShort: true,
    smaLong: true,
    ema: true,
    rsi: true,
    macd: false,
    vwap: false,
    bollinger: true,
    atr: false,
    supertrend: false,
  });
  const [apiIndicators, setApiIndicators] = useState<{
    smaShort: NullableNumber[];
    smaLong: NullableNumber[];
    ema: NullableNumber[];
    rsi: NullableNumber[];
    bands: Array<BollingerBandPoint | null>;
  } | null>(null);
  const [apiBacktest, setApiBacktest] = useState<ApiBacktestResponse | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(() => readHistory());
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsManagerRef = useRef(createBinanceWebSocket());
  const [livePrice, setLivePrice] = useState<number | null>(null);

  const filteredCandles = useMemo(
    () => filterCandlesByDateRange(candles, backtestStartDate, backtestEndDate),
    [backtestEndDate, backtestStartDate, candles],
  );
  const closes = useMemo(() => filteredCandles.map((candle) => candle.close), [filteredCandles]);
  const strategyError = validateStrategy(shortWindow, longWindow, filteredCandles.length);
  const fallbackSmaShort = useMemo(
    () => calculateSma(closes, Math.max(shortWindow, 2)),
    [closes, shortWindow],
  );
  const fallbackSmaLong = useMemo(
    () => calculateSma(closes, Math.max(longWindow, 3)),
    [closes, longWindow],
  );
  const fallbackEma = useMemo(() => calculateEma(closes, 10), [closes]);
  const fallbackRsi = useMemo(() => calculateRsi(closes, 14), [closes]);
  const fallbackBands = useMemo(() => calculateBollingerBands(closes, 20, 2), [closes]);
  const fallbackBacktest = useMemo(
    () =>
      strategyError
        ? emptyBacktest()
        : runMovingAverageCrossoverBacktest(filteredCandles, {
            shortPeriod: shortWindow,
            longPeriod: longWindow,
            initialCash,
          }),
    [filteredCandles, initialCash, longWindow, shortWindow, strategyError],
  );
  const smaShort = apiIndicators?.smaShort ?? fallbackSmaShort;
  const smaLong = apiIndicators?.smaLong ?? fallbackSmaLong;
  const ema = apiIndicators?.ema ?? fallbackEma;
  const rsi = apiIndicators?.rsi ?? fallbackRsi;
  const bands = apiIndicators?.bands ?? fallbackBands;
  const backtest = useMemo(
    () => (apiBacktest ? fromApiBacktest(apiBacktest) : fallbackBacktest),
    [apiBacktest, fallbackBacktest],
  );
  const replay = useReplayEngine(filteredCandles.length);
  const { currentIndex } = replay;

  const visibleCandles = useMemo(
    () => filteredCandles.slice(0, currentIndex + 1),
    [filteredCandles, currentIndex],
  );
  const visibleSmaShort = useMemo(
    () => smaShort.slice(0, currentIndex + 1),
    [smaShort, currentIndex],
  );
  const visibleSmaLong = useMemo(() => smaLong.slice(0, currentIndex + 1), [smaLong, currentIndex]);

  const latestIndex = currentIndex >= 0 ? currentIndex : 0;
  const latestCandle = filteredCandles[latestIndex];
  const latestBand = bands[latestIndex];
  const latestSignal = getLatestSignal(apiBacktest, backtest);

  const visibleSignals = useMemo(() => {
    const allSignals = apiBacktest?.signals ?? backtest.signals ?? [];
    if (!latestCandle) return [];
    const cutoffTime = new Date(latestCandle.timestamp ?? latestCandle.date).getTime();
    return allSignals.filter((s) => new Date(s.time || s.timestamp || '').getTime() <= cutoffTime);
  }, [apiBacktest, backtest, latestCandle]);

  const visibleTrades = useMemo(() => {
    if (!latestCandle) return [];
    const cutoffTime = new Date(latestCandle.timestamp ?? latestCandle.date).getTime();
    return backtest.trades.filter((t) => new Date(t.exitDate).getTime() <= cutoffTime);
  }, [backtest.trades, latestCandle]);

  useEffect(() => {
    checkHealth();
    loadLiveBinanceData();
    // Run the boot load once with the default Binance range.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.history.replaceState(null, '', `#${section.toLowerCase()}`);
  }, [section]);

  useEffect(() => {
    refreshIndicators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredCandles, shortWindow, longWindow]);

  useEffect(() => {
    const { startDate, endDate } = getRecentDateRange(7);
    setBinanceStartDate(startDate);
    setBinanceEndDate(endDate);

    async function autoFetch() {
      setIsLoadingSample(true);
      try {
        const nextCandles = await fetchBinanceKlines({
          symbol: binanceSymbol,
          interval: binanceInterval,
          startDate,
          endDate,
        });
        setCandles(nextCandles);
        setDataSource(`Live Binance ${binanceSymbol} ${binanceInterval}`);
        setApiBacktest(null);
        setApiIndicators(null);
        setApiStatus('connected');
        setStatusMessage(`Loaded ${nextCandles.length} candles for ${binanceSymbol}.`);
      } catch {
        setStatusMessage(`Failed to fetch ${binanceSymbol}. Using cached data.`);
      } finally {
        setIsLoadingSample(false);
      }
    }

    void autoFetch();

    // Clear old polling interval and start a new one (every 30s)
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => {
      void autoFetch();
    }, 30_000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [binanceSymbol, binanceInterval]);

  useEffect(() => {
    const wsManager = wsManagerRef.current;
    wsManager.connect(binanceSymbol, (price) => {
      setLivePrice(price);
    });
    return () => {
      wsManager.disconnect();
    };
  }, [binanceSymbol]);

  async function checkHealth() {
    try {
      await getHealth();
      setApiStatus('connected');
      setStatusMessage('API connected');
    } catch {
      setApiStatus('fallback');
      setStatusMessage('Backend unavailable. Local fallback is active.');
    }
  }

  async function loadSampleData() {
    setIsLoadingSample(true);
    setError(null);
    try {
      const apiCandles = await getSampleData();
      setCandles(apiCandles);
      setDataSource('FastAPI sample BTC-USD candles');
      setApiBacktest(null);
      setApiIndicators(null);
      setApiStatus('connected');
      setStatusMessage('Sample data loaded from API.');
    } catch {
      setCandles(defaultCandles);
      setDataSource('Bundled fallback sample data');
      setApiBacktest(null);
      setApiIndicators(null);
      setApiStatus('fallback');
      setStatusMessage('Backend unavailable. Loaded bundled fallback sample data.');
    } finally {
      setIsLoadingSample(false);
    }
  }

  async function loadLiveBinanceData() {
    setIsLoadingSample(true);
    setError(null);
    try {
      const nextCandles = await fetchBinanceKlines({
        symbol: binanceSymbol.trim().toUpperCase(),
        interval: binanceInterval,
        startDate: binanceStartDate,
        endDate: binanceEndDate,
      });
      setCandles(nextCandles);
      setDataSource(`Live Binance ${binanceSymbol.toUpperCase()} ${binanceInterval}`);
      setApiBacktest(null);
      setApiIndicators(null);
      setApiStatus('connected');
      setStatusMessage(`Loaded ${nextCandles.length} live Binance candles.`);
    } catch {
      await loadSampleData();
      setStatusMessage('Live Binance fetch failed. Loaded bundled fallback sample data.');
    } finally {
      setIsLoadingSample(false);
    }
  }

  async function handleUpload(file: File) {
    setError(null);
    try {
      const uploaded = await uploadData(file);
      if (uploaded.length === 0) {
        throw new Error('Uploaded file did not contain any valid candles.');
      }
      setCandles(uploaded);
      setDataSource(file.name);
      setApiBacktest(null);
      setApiIndicators(null);
      setStatusMessage(`Loaded ${uploaded.length} candles from ${file.name}.`);
      setApiStatus('connected');
    } catch (uploadError) {
      const message = parseError(
        uploadError,
        'Invalid file. Required columns: timestamp/date/time, open, high, low, close, volume.',
      );
      setError(message);
    }
  }

  async function refreshIndicators() {
    if (strategyError) return;
    try {
      const response = await calculateIndicators(filteredCandles, {
        sma: [shortWindow, longWindow],
        ema: [10],
        rsi: 14,
        bollinger: 20,
      });
      setApiIndicators({
        smaShort: readNumberArray(response[`sma_${shortWindow}`]),
        smaLong: readNumberArray(response[`sma_${longWindow}`]),
        ema: readNumberArray(response.ema_10),
        rsi: readNumberArray(response.rsi_14),
        bands: readBands(response.bollinger_20),
      });
      setApiStatus('connected');
    } catch {
      setApiIndicators(null);
      setApiStatus('fallback');
    }
  }

  async function handleRunBacktest() {
    if (strategyError) return;
    setIsRunningBacktest(true);
    setError(null);
    setStatusMessage('Running backtest...');
    try {
      const result = await runMaCrossoverBacktest({
        candles: filteredCandles,
        shortWindow,
        longWindow,
        initialCash,
        feeRate,
      });
      setApiBacktest(result);
      setApiStatus('connected');
      setStatusMessage('Backtest completed successfully.');
      const entry = toHistoryEntry(result, timeframe);
      const next = [entry, ...history].slice(0, 25);
      setHistory(next);
      localStorage.setItem(historyKey, JSON.stringify(next));
      setSection('Backtests');
    } catch (runError) {
      setApiStatus('fallback');
      setError(parseError(runError, 'Backtest failed. Start the FastAPI backend and try again.'));
      setStatusMessage('Backtest failed.');
    } finally {
      setIsRunningBacktest(false);
    }
  }

  async function handleFetchBinance() {
    setError(null);
    if (!binanceStartDate || !binanceEndDate) {
      setError('Select Binance start and end dates.');
      return;
    }
    try {
      const nextCandles = await fetchBinanceKlines({
        symbol: binanceSymbol.trim().toUpperCase(),
        interval: binanceInterval,
        startDate: binanceStartDate,
        endDate: binanceEndDate,
      });
      setCandles(nextCandles);
      setDataSource(`Live Binance ${binanceSymbol.toUpperCase()} ${binanceInterval}`);
      setApiBacktest(null);
      setApiIndicators(null);
      setStatusMessage(`Loaded ${nextCandles.length} candles from Binance.`);
      setApiStatus('connected');
    } catch (fetchError) {
      setError(parseError(fetchError, 'Failed to fetch Binance candles.'));
    }
  }

  function clearHistory() {
    setHistory([]);
    localStorage.removeItem(historyKey);
  }

  function exportHistoryCsv() {
    downloadCsv(
      'QuantNova-backtest-history.csv',
      ['strategy,asset,timeframe,net_profit,win_rate,max_drawdown,total_trades,status,timestamp'],
      history.map((item) =>
        [
          item.strategy,
          item.asset,
          item.timeframe,
          item.netProfit,
          item.winRate,
          item.maxDrawdown,
          item.totalTrades,
          item.status,
          item.timestamp,
        ].join(','),
      ),
    );
  }

  function exportTradeLogCsv() {
    downloadCsv(
      'QuantNova-trade-log.csv',
      ['entry_time,exit_time,entry_price,exit_price,profit,profit_pct'],
      backtest.trades.map((trade) =>
        [
          trade.entryDate,
          trade.exitDate,
          trade.entryPrice,
          trade.exitPrice,
          trade.profit,
          trade.returnPct,
        ].join(','),
      ),
    );
  }
  return (
    <>
      <Header currentSection={section} onNavigate={setSection} />
      <main className="terminal-shell">
        <aside className="terminal-sidebar" aria-label="Primary navigation">
          <div className="brand-lockup">
            <div className="brand-mark">QN</div>
            <div>
              <h1>QuantNova</h1>
              <span>Open-source terminal</span>
            </div>
          </div>

          <div className="sidebar-footer">
            <div className="system-card">
              <span>Backend</span>
              <strong>{apiStatus === 'connected' ? 'API connected' : 'Local fallback'}</strong>
              <small>{statusMessage}</small>
            </div>
            <button
              className="nav-item"
              type="button"
              title="Settings are planned for a later milestone."
              disabled
            >
              Settings
            </button>
            <button
              className="nav-item"
              type="button"
              title="Support channel setup is coming soon."
              disabled
            >
              Support
            </button>
          </div>
        </aside>

        <section className="terminal-main">
          <header className="topbar">
            <div className="tab-group" aria-label="Workspace sections">
              <button
                className={section === 'Terminal' ? 'top-tab active' : 'top-tab'}
                onClick={() => setSection('Terminal')}
              >
                Workspace
              </button>
              <button
                className={section === 'Backtests' ? 'top-tab active' : 'top-tab'}
                onClick={() => setSection('Backtests')}
              >
                Backtest
              </button>
              <button
                className="top-tab"
                disabled
                title="Coming soon: optimization is not implemented in the foundation MVP."
              >
                Optimize
              </button>
              <button
                className="top-tab"
                disabled
                title="Coming soon: live trading is not implemented in the foundation MVP."
              >
                Live
              </button>
            </div>

            <div className="market-controls">
              <div className="market-ticker">
                <span>Last</span>
                <strong>{formatMoney(livePrice ?? latestCandle?.close ?? 0)}</strong>
                {livePrice ? <span className="live-dot" title="Live price feed active" /> : null}
              </div>
              <select
                aria-label="Asset selector"
                value={binanceSymbol}
                onChange={(e) => {
                  setBinanceSymbol(e.target.value);
                }}
              >
                {['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'].map((pair) => (
                  <option key={pair} value={pair}>
                    {pair}
                  </option>
                ))}
              </select>
              <div className="timeframe-group" aria-label="Timeframe selector">
                {['1m', '5m', '15m', '1h'].map((item) => (
                  <button
                    className={binanceInterval === item ? 'timeframe active' : 'timeframe'}
                    key={item}
                    onClick={() => setBinanceInterval(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <button
                className="ghost-button"
                onClick={() => setIndicatorMenuOpen((open) => !open)}
              >
                Indicators
              </button>
              <button
                className="purple-button"
                disabled
                title="Coming soon: deployment is not implemented in the foundation MVP."
              >
                Deploy
              </button>
              <button className="ghost-button" onClick={() => setSection('Monitor')}>
                Monitor
              </button>
            </div>
          </header>

          {indicatorMenuOpen ? (
            <section
              className="terminal-panel indicator-menu"
              style={{ maxWidth: '100%', overflowX: 'hidden' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#6b7280',
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                  }}
                >
                  Active Indicators
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleIndicators({
                        smaShort: true,
                        smaLong: true,
                        ema: true,
                        rsi: true,
                        macd: true,
                        vwap: true,
                        bollinger: true,
                        atr: true,
                        supertrend: true,
                      })
                    }
                    style={{
                      padding: '3px 10px',
                      borderRadius: '5px',
                      border: '1px solid #374151',
                      background: 'transparent',
                      color: '#6b7280',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4b5563';
                      e.currentTarget.style.color = '#9ca3af';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#374151';
                      e.currentTarget.style.color = '#6b7280';
                    }}
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleIndicators({
                        smaShort: false,
                        smaLong: false,
                        ema: false,
                        rsi: false,
                        macd: false,
                        vwap: false,
                        bollinger: false,
                        atr: false,
                        supertrend: false,
                      })
                    }
                    style={{
                      padding: '3px 10px',
                      borderRadius: '5px',
                      border: '1px solid #374151',
                      background: 'transparent',
                      color: '#6b7280',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4b5563';
                      e.currentTarget.style.color = '#9ca3af';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#374151';
                      e.currentTarget.style.color = '#6b7280';
                    }}
                  >
                    Clear all
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '14px',
                  minHeight: '36px',
                  minWidth: 0,
                  width: '100%',
                }}
              >
                {Object.entries({
                  smaShort: `SMA ${shortWindow}`,
                  smaLong: `SMA ${longWindow}`,
                  ema: 'EMA 10',
                  rsi: 'RSI 14',
                  macd: 'MACD',
                  vwap: 'VWAP',
                  bollinger: 'Bollinger Bands',
                  atr: 'ATR',
                  supertrend: 'Supertrend',
                })
                  .filter(([key]) => visibleIndicators[key as keyof typeof visibleIndicators])
                  .map(([key, label]) => (
                    <div
                      key={key}
                      style={{
                        background: '#1e3a8a',
                        border: '1px solid #2563eb',
                        color: '#93c5fd',
                        padding: '5px 12px',
                        borderRadius: '999px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        fontWeight: 500,
                        flexShrink: 0,
                      }}
                    >
                      <span>{label}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setVisibleIndicators((current) => ({
                            ...current,
                            [key]: false,
                          }))
                        }
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#60a5fa',
                          cursor: 'pointer',
                          fontSize: '15px',
                          lineHeight: 1,
                          padding: '0 2px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#60a5fa')}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                {!Object.values(visibleIndicators).some(Boolean) && (
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#374151',
                      fontStyle: 'italic',
                      alignSelf: 'center',
                    }}
                  >
                    No indicators selected
                  </span>
                )}
              </div>

              <div style={{ marginBottom: '14px', width: '100%' }}>
                <input
                  type="text"
                  placeholder="Search indicators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #374151',
                    background: '#0d1117',
                    color: '#f9fafb',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#374151')}
                />
              </div>

              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#4b5563',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                }}
              >
                All Indicators
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  minWidth: 0,
                  width: '100%',
                }}
              >
                {(() => {
                  const allIndicators: Record<string, { label: string; category: string }> = {
                    smaShort: { label: `SMA ${shortWindow}`, category: 'Trend' },
                    smaLong: { label: `SMA ${longWindow}`, category: 'Trend' },
                    ema: { label: 'EMA 10', category: 'Trend' },
                    rsi: { label: 'RSI 14', category: 'Momentum' },
                    macd: { label: 'MACD', category: 'Momentum' },
                    vwap: { label: 'VWAP', category: 'Volume' },
                    bollinger: { label: 'Bollinger Bands', category: 'Volatility' },
                    atr: { label: 'ATR', category: 'Volatility' },
                    supertrend: { label: 'Supertrend', category: 'Trend' },
                  };

                  const filtered = Object.entries(allIndicators).filter(([, { label }]) =>
                    label.toLowerCase().includes(searchQuery.toLowerCase()),
                  );

                  if (filtered.length === 0) {
                    return (
                      <span style={{ fontSize: '13px', color: '#4b5563', fontStyle: 'italic' }}>
                        No indicators match "{searchQuery}"
                      </span>
                    );
                  }

                  return filtered.map(([key, { label, category }]) => {
                    const isActive = visibleIndicators[key as keyof typeof visibleIndicators];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setVisibleIndicators((current) => ({
                            ...current,
                            [key]: !current[key as keyof typeof current],
                          }))
                        }
                        style={{
                          padding: '7px 14px',
                          borderRadius: '999px',
                          border: isActive ? '1px solid #2563eb' : '1px solid #374151',
                          background: isActive ? '#1e3a8a' : '#1f2937',
                          color: isActive ? '#93c5fd' : '#9ca3af',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.borderColor = '#4b5563';
                            e.currentTarget.style.color = '#d1d5db';
                            e.currentTarget.style.background = '#374151';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.borderColor = '#374151';
                            e.currentTarget.style.color = '#9ca3af';
                            e.currentTarget.style.background = '#1f2937';
                          }
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: isActive ? '#60a5fa' : '#374151',
                            flexShrink: 0,
                          }}
                        />
                        {label}
                        <span
                          style={{
                            fontSize: '9px',
                            color: isActive ? '#3b82f6' : '#6b7280',
                            marginLeft: '2px',
                          }}
                        >
                          {category}
                        </span>
                      </button>
                    );
                  });
                })()}
              </div>
            </section>
          ) : null}

          {section === 'Terminal' ? renderTerminal() : null}
          {section === 'Strategies' ? renderStrategies() : null}
          {section === 'Portfolio' ? (
            <InfoPage
              title="Portfolio"
              message="Portfolio tracking is planned. No live trading is implemented yet."
            />
          ) : null}
          {section === 'Monitor' ? (
            <InfoPage title="Monitor" message={`Read-only status: ${statusMessage}`} />
          ) : null}
          {section === 'Backtests' ? renderBacktests() : null}
          {section === 'History' ? renderHistory() : null}
        </section>
      </main>
    </>
  );

  function renderTerminal() {
    return (
      <>
        <section className="workspace-grid">
          <section className="chart-panel terminal-panel">
            <PanelHeading
              eyebrow="Terminal"
              title={`${binanceSymbol} strategy workspace`}
              status={apiStatus === 'connected' ? 'API connected' : 'Local fallback'}
            />
            <div className="chart-statline">
              <span>O {formatCompact(latestCandle?.open ?? 0)}</span>
              <span>H {formatCompact(latestCandle?.high ?? 0)}</span>
              <span>L {formatCompact(latestCandle?.low ?? 0)}</span>
              <span>C {formatCompact(latestCandle?.close ?? 0)}</span>
              <span>Vol {formatCompact(latestCandle?.volume ?? 0)}</span>
            </div>
            <div className="indicator-strip" aria-label="Current indicator values">
              {visibleIndicators.smaShort ? (
                <IndicatorPill
                  label={`SMA ${shortWindow}`}
                  value={smaShort[latestIndex]}
                  tone="green"
                />
              ) : null}
              {visibleIndicators.smaLong ? (
                <IndicatorPill
                  label={`SMA ${longWindow}`}
                  value={smaLong[latestIndex]}
                  tone="purple"
                />
              ) : null}
              {visibleIndicators.ema ? (
                <IndicatorPill label="EMA 10" value={ema[latestIndex]} tone="blue" />
              ) : null}
              {visibleIndicators.rsi ? (
                <IndicatorPill label="RSI 14" value={rsi[latestIndex]} tone="neutral" />
              ) : null}
              {visibleIndicators.bollinger ? (
                <IndicatorPill label="BB Upper" value={latestBand?.upper ?? null} tone="neutral" />
              ) : null}
              {visibleIndicators.bollinger ? (
                <IndicatorPill label="BB Lower" value={latestBand?.lower ?? null} tone="neutral" />
              ) : null}
            </div>
            <CandleChart
              candles={visibleCandles}
              shortSma={visibleSmaShort}
              longSma={visibleSmaLong}
              signals={visibleSignals}
              chartType={chartType}
              showSignals={showSignals}
              showSma={showSma && (visibleIndicators.smaShort || visibleIndicators.smaLong)}
              showVolume={showVolume}
              chartAction={chartAction}
              onChartActionHandled={() => setChartAction(null)}
              selectedSymbol={binanceSymbol}
              selectedInterval={binanceInterval}
              onIntervalChange={(interval) => setBinanceInterval(interval)}
            />
          </section>
          <aside className="right-rail">
            {renderControls()}
            <ReplayControls
              isPlaying={replay.isPlaying}
              togglePlay={replay.togglePlay}
              pause={replay.pause}
              reset={replay.reset}
              playbackSpeed={replay.playbackSpeed}
              setPlaybackSpeed={replay.setPlaybackSpeed}
              currentIndex={replay.currentIndex}
              setCurrentIndex={replay.setCurrentIndex}
              totalLength={filteredCandles.length}
            />
            <DataLoader
              onUpload={handleUpload}
              onResetSample={loadSampleData}
              status={
                isLoadingSample
                  ? 'Loading sample data...'
                  : `${candles.length} candles loaded from ${dataSource}.`
              }
              error={error}
            />
          </aside>
        </section>
        {renderMetricsAndTrades()}
      </>
    );
  }

  function renderControls() {
    return (
      <section className="terminal-panel controls-panel">
        <PanelHeading eyebrow="Execution" title="Backtest Controls" />
        <div className="strategy-card">
          <span>Strategy</span>
          <strong>
            SMA crossover {shortWindow}/{longWindow}
          </strong>
          <small>Run explicitly after changing parameters. No live execution is included.</small>
        </div>
        <div className="execution-grid">
          <label>
            <span>Initial equity</span>
            <input
              type="number"
              value={initialCash}
              min="1"
              onChange={(event) => setInitialCash(Number(event.target.value))}
            />
          </label>
          <label>
            <span>Fee rate</span>
            <input
              type="number"
              value={feeRate}
              min="0"
              step="0.001"
              onChange={(event) => setFeeRate(Number(event.target.value))}
            />
          </label>
        </div>
        <div className="execution-grid">
          <label>
            <span>Backtest start date</span>
            <input
              type="date"
              value={backtestStartDate}
              onChange={(event) => setBacktestStartDate(event.target.value)}
            />
          </label>
          <label>
            <span>Backtest end date</span>
            <input
              type="date"
              value={backtestEndDate}
              onChange={(event) => setBacktestEndDate(event.target.value)}
            />
          </label>
        </div>
        <label className="field">
          <span>Short window</span>
          <input
            min="2"
            type="number"
            value={shortWindow}
            onChange={(event) => setShortWindow(Number(event.target.value))}
          />
        </label>
        <label className="field">
          <span>Long window</span>
          <input
            min="3"
            type="number"
            value={longWindow}
            onChange={(event) => setLongWindow(Number(event.target.value))}
          />
        </label>
        {strategyError ? <p className="status-text error-text">{strategyError}</p> : null}
        <button
          className="run-button"
          type="button"
          onClick={handleRunBacktest}
          disabled={Boolean(strategyError) || isRunningBacktest}
        >
          {isRunningBacktest ? 'Running Backtest...' : 'Run Backtest'}
        </button>
        <div className="signal-box">
          <span>Latest signal</span>
          <strong>{latestSignal}</strong>
          <small>{statusMessage}</small>
        </div>
        <div className="button-row">
          <button type="button" onClick={() => setChartAction('zoom-in')}>
            Zoom In
          </button>
          <button type="button" onClick={() => setChartAction('zoom-out')}>
            Zoom Out
          </button>
          <button type="button" className="secondary" onClick={() => setChartAction('fit')}>
            Reset View
          </button>
        </div>
        <div className="control-group">
          <span>Chart Type</span>
          <div className="segmented-control">
            <button
              type="button"
              className={chartType === 'candlestick' ? 'active' : undefined}
              onClick={() => setChartType('candlestick')}
            >
              Candlestick
            </button>
            <button
              type="button"
              className={chartType === 'bar' ? 'active' : undefined}
              onClick={() => setChartType('bar')}
            >
              Bar
            </button>
          </div>
        </div>
        <div className="toggle-stack">
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={showSignals}
              onChange={() => setShowSignals((current) => !current)}
            />
            Show Signals
          </label>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={showSma}
              onChange={() => setShowSma((current) => !current)}
            />
            Show SMA
          </label>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={showVolume}
              onChange={() => setShowVolume((current) => !current)}
            />
            Show Volume
          </label>
        </div>
        <div className="execution-grid">
          <label>
            <span>Binance symbol</span>
            <input
              type="text"
              value={binanceSymbol}
              onChange={(event) => setBinanceSymbol(event.target.value)}
            />
          </label>
          <label>
            <span>Binance interval</span>
            <select
              value={binanceInterval}
              onChange={(event) => setBinanceInterval(event.target.value)}
            >
              {['1m', '5m', '15m', '1h', '4h', '1d'].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Binance start date</span>
            <input
              type="date"
              value={binanceStartDate}
              onChange={(event) => setBinanceStartDate(event.target.value)}
            />
          </label>
          <label>
            <span>Binance end date</span>
            <input
              type="date"
              value={binanceEndDate}
              onChange={(event) => setBinanceEndDate(event.target.value)}
            />
          </label>
        </div>
        <button className="ghost-button" type="button" onClick={handleFetchBinance}>
          Fetch Binance Candles
        </button>
      </section>
    );
  }

  function renderMetricsAndTrades() {
    return (
      <section className="bottom-grid">
        <section className="terminal-panel status-panel">
          <h2 className="visually-hidden">Strategy results</h2>
          <Metric
            label="Session status"
            value={apiStatus === 'connected' ? 'API Ready' : 'Fallback'}
            tone={apiStatus === 'connected' ? 'positive' : 'muted-strong'}
          />
          <Metric label="Total trades" value={String(backtest.totalTrades)} />
          <Metric
            label="Net profit"
            value={formatMoney(backtest.netProfit)}
            tone={backtest.netProfit >= 0 ? 'positive' : 'negative'}
          />
          <Metric label="Win rate" value={`${backtest.winRate.toFixed(2)}%`} />
          <Metric
            label="Max drawdown"
            value={`${backtest.maxDrawdown.toFixed(2)}%`}
            tone="negative"
          />
          <Metric
            label="Sharpe ratio"
            value={formatCompact(
              apiBacktest?.stats?.sharpe_ratio ??
                apiBacktest?.summary.sharpe_ratio ??
                backtest.sharpeRatio,
            )}
            tone="muted-strong"
          />
        </section>
        <section className="terminal-panel trade-preview">
          <PanelHeading eyebrow="Signals" title="Trade log" />
          <button
            className="ghost-button small-action"
            onClick={exportTradeLogCsv}
            disabled={visibleTrades.length === 0}
            title={
              visibleTrades.length === 0 ? 'No trades generated to export.' : 'Export trade log CSV'
            }
          >
            Export Trade Log CSV
          </button>
          <TradePreview trades={visibleTrades} />
        </section>
      </section>
    );
  }

  function renderStrategies() {
    return (
      <section className="terminal-panel page-panel">
        <PanelHeading eyebrow="Strategies" title="Available Strategies" />
        <div className="strategy-card">
          <span>Available</span>
          <strong>SMA crossover</strong>
          <small>Uses backend-calculated moving averages and explicit backtest execution.</small>
        </div>
      </section>
    );
  }

  function renderBacktests() {
    return (
      <>
        <section className="terminal-panel page-panel">
          <PanelHeading eyebrow="Backtest" title="Latest Backtest Summary" />
          {renderMetricsAndTrades()}
        </section>
      </>
    );
  }

  function renderHistory() {
    return (
      <section className="terminal-panel history-panel">
        <PanelHeading eyebrow="History" title="Saved Local Backtest History" />
        <div className="button-row">
          <button
            onClick={exportHistoryCsv}
            disabled={history.length === 0}
            title={
              history.length === 0
                ? 'Run a backtest before exporting history.'
                : 'Export saved backtest history as CSV.'
            }
          >
            Export CSV
          </button>
          <button
            className="secondary"
            onClick={clearHistory}
            disabled={history.length === 0}
            title={
              history.length === 0
                ? 'No saved backtest history to clear.'
                : 'Clear saved local backtest history.'
            }
          >
            Clear History
          </button>
        </div>
        <HistoryTable history={history} />
      </section>
    );
  }
}

function PanelHeading({
  eyebrow,
  title,
  status,
}: {
  eyebrow: string;
  title: string;
  status?: string;
}) {
  return (
    <div className="panel-header compact">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {status ? (
        <div className="live-status">
          <span />
          {status}
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="metric-tile">
      <span>{label}</span>
      <strong className={tone}>{value}</strong>
    </div>
  );
}

function InfoPage({ title, message }: { title: string; message: string }) {
  return (
    <section className="terminal-panel page-panel">
      <PanelHeading eyebrow={title} title={title} />
      <p className="empty-state">{message}</p>
    </section>
  );
}

function IndicatorPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | null | undefined;
  tone: 'green' | 'purple' | 'blue' | 'neutral';
}) {
  return (
    <span className={`indicator-pill ${tone}`}>
      {label}
      <strong>{typeof value === 'number' ? formatCompact(value) : 'Pending'}</strong>
    </span>
  );
}

function TradePreview({ trades }: { trades: Trade[] }) {
  if (trades.length === 0)
    return (
      <p className="empty-state">No trades generated. Run a backtest to populate the trade log.</p>
    );
  return (
    <div className="compact-log">
      {trades.map((trade) => (
        <div className="log-row" key={`${trade.entryDate}-${trade.exitDate}`}>
          <span>
            {trade.entryDate} / {trade.exitDate}
          </span>
          <strong className={trade.profit >= 0 ? 'positive' : 'negative'}>
            {formatMoney(trade.profit)}
          </strong>
        </div>
      ))}
    </div>
  );
}

function HistoryTable({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0)
    return <p className="empty-state">No saved backtests yet. Run a backtest to create history.</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Strategy name</th>
            <th>Asset/timeframe</th>
            <th>Net profit</th>
            <th>Win rate</th>
            <th>Drawdown</th>
            <th>Status</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {history.map((item) => (
            <tr key={item.id}>
              <td>{item.strategy}</td>
              <td>
                {item.asset} / {item.timeframe}
              </td>
              <td className={item.netProfit >= 0 ? 'positive' : 'negative'}>
                {formatMoney(item.netProfit)}
              </td>
              <td>{item.winRate.toFixed(2)}%</td>
              <td className="negative">{item.maxDrawdown.toFixed(2)}%</td>
              <td>
                <span className="status-chip">{item.status}</span>
              </td>
              <td>{item.timestamp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function fromApiBacktest(response: ApiBacktestResponse): BacktestResult {
  return {
    totalTrades: response.summary.total_trades,
    netProfit: response.summary.net_profit,
    winRate: response.summary.win_rate,
    maxDrawdown: response.summary.max_drawdown,
    sharpeRatio: response.stats?.sharpe_ratio ?? response.summary.sharpe_ratio ?? 0,
    finalEquity: response.summary.final_equity,
    trades: response.trades.map((trade) => ({
      entryDate: trade.entry_time,
      exitDate: trade.exit_time,
      entryPrice: trade.entry_price,
      exitPrice: trade.exit_price,
      profit: trade.profit,
      returnPct: trade.profit_pct,
    })),
    equityCurve: response.equity_curve.map((point, index) =>
      typeof point === 'number' ? { time: String(index), value: point } : point,
    ),
  };
}

function toHistoryEntry(response: ApiBacktestResponse, timeframe: string): HistoryEntry {
  return {
    id: `${Date.now()}`,
    strategy: 'SMA crossover',
    asset: 'BTCUSDT',
    timeframe,
    netProfit: response.summary.net_profit,
    winRate: response.summary.win_rate,
    maxDrawdown: response.summary.max_drawdown,
    totalTrades: response.summary.total_trades,
    status: 'Completed',
    timestamp: new Date().toISOString(),
  };
}

function readHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(historyKey) ?? '[]') as HistoryEntry[];
  } catch {
    return [];
  }
}

function getRecentDateRange(daysBack: number): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - daysBack);
  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end),
  };
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function readSectionFromHash(): Section {
  const hash = window.location.hash.replace('#', '').toLowerCase();
  const match = navItems.find((item) => item.toLowerCase() === hash);
  if (match) return match;
  if (hash === 'monitor') return 'Monitor';
  return 'Terminal';
}

function readNumberArray(value: unknown): NullableNumber[] {
  return Array.isArray(value) ? value.map((item) => (typeof item === 'number' ? item : null)) : [];
}

function readBands(value: unknown): Array<BollingerBandPoint | null> {
  if (!value || typeof value !== 'object') return [];
  const bands = value as { upper?: unknown; middle?: unknown; lower?: unknown };
  const upper = readNumberArray(bands.upper);
  const middle = readNumberArray(bands.middle);
  const lower = readNumberArray(bands.lower);
  return middle.map((middleValue, index) =>
    middleValue === null || upper[index] === null || lower[index] === null
      ? null
      : { middle: middleValue, upper: upper[index] as number, lower: lower[index] as number },
  );
}

function filterCandlesByDateRange(candles: Candle[], startDate: string, endDate: string): Candle[] {
  if (!startDate && !endDate) return candles;
  const start = startDate ? Date.parse(startDate) : Number.NEGATIVE_INFINITY;
  const end = endDate ? Date.parse(`${endDate}T23:59:59.999Z`) : Number.POSITIVE_INFINITY;
  return candles.filter((candle) => {
    const candleTime = Date.parse(candle.timestamp ?? candle.date);
    if (Number.isNaN(candleTime)) return false;
    return candleTime >= start && candleTime <= end;
  });
}

function validateStrategy(
  shortWindow: number,
  longWindow: number,
  candleCount: number,
): string | null {
  if (shortWindow < 2) return 'Short window must be at least 2.';
  if (longWindow <= shortWindow) return 'Long window must be greater than short window.';
  if (longWindow > candleCount) return 'Long window cannot be larger than the number of candles.';
  return null;
}

function emptyBacktest(): BacktestResult {
  return {
    totalTrades: 0,
    netProfit: 0,
    winRate: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
    finalEquity: 0,
    trades: [],
    equityCurve: [],
  };
}

function getLatestSignal(
  apiBacktest: ApiBacktestResponse | null,
  backtest: BacktestResult,
): string {
  const latest = apiBacktest?.signals.at(-1);
  if (latest) return `${latest.type.toUpperCase()} at ${formatMoney(latest.price)}`;
  return backtest.totalTrades > 0 ? 'Backtest completed' : 'No signal yet';
}

function parseError(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function downloadCsv(filename: string, header: string[], rows: string[]) {
  const csv = [...header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return 'Pending';
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatMoney(value: number) {
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
}

export default App;
