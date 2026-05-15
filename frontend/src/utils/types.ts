export interface Candle {
  date: string;
  timestamp?: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type NullableNumber = number | null;

export interface Trade {
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  profit: number;
  returnPct: number;
}

export interface BacktestResult {
  totalTrades: number;
  netProfit: number;
  winRate: number;
  maxDrawdown: number;
  finalEquity: number;
  sharpeRatio: number;
  trades: Trade[];
  equityCurve: EquityPoint[];
}

export interface BacktestSignal {
  timestamp?: string;
  time: string;
  type: 'buy' | 'sell';
  price: number;
  reason: string;
}

export interface EquityPoint {
  time: string;
  value: number;
}

export interface ApiCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ApiBinanceCandle {
  time: number | string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ApiBacktestResponse {
  summary: {
    initial_cash: number;
    final_equity: number;
    net_profit: number;
    net_profit_pct: number;
    total_trades: number;
    win_rate: number;
    max_drawdown: number;
    sharpe_ratio?: number;
  };
  stats?: {
    total_trades: number;
    net_profit: number;
    win_rate: number;
    max_drawdown: number;
    sharpe_ratio: number;
  };
  trades: Array<{
    entry_time: string;
    exit_time: string;
    entry_price: number;
    exit_price: number;
    quantity: number;
    profit: number;
    profit_pct: number;
  }>;
  signals: BacktestSignal[];
  equity_curve: Array<number | EquityPoint>;
}
