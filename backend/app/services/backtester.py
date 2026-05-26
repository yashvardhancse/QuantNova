from statistics import mean, pstdev

from backend.app.models.models import (
    BacktestResponse,
    BacktestStats,
    BacktestSummary,
    Candle,
    EquityPoint,
    Signal,
    Trade,
)
from app.services.indicators import round_number, sma


def run_ma_crossover_backtest(
    candles: list[Candle],
    short_window: int,
    long_window: int,
    initial_cash: float,
    fee_rate: float = 0.001,
) -> BacktestResponse:
    if short_window >= long_window:
        raise ValueError("short_window must be less than long_window.")
    if long_window > len(candles):
        raise ValueError("long_window cannot be larger than the number of candles.")

    closes = [candle.close for candle in candles]
    short_sma = sma(closes, short_window)
    long_sma = sma(closes, long_window)

    trades: list[Trade] = []
    signals: list[Signal] = []
    equity_curve: list[EquityPoint] = []
    cash = initial_cash
    quantity = 0.0
    entry_price = 0.0
    entry_time = ""
    peak_equity = initial_cash
    max_drawdown = 0.0

    for index in range(1, len(candles)):
        candle = candles[index]
        previous_short = short_sma[index - 1]
        previous_long = long_sma[index - 1]
        current_short = short_sma[index]
        current_long = long_sma[index]

        if None not in (previous_short, previous_long, current_short, current_long):
            crosses_above = previous_short <= previous_long and current_short > current_long
            crosses_below = previous_short >= previous_long and current_short < current_long

            if crosses_above and quantity == 0:
                fee = cash * fee_rate
                quantity = (cash - fee) / candle.close
                cash = 0.0
                entry_price = candle.close
                entry_time = candle.timestamp
                signals.append(
                    Signal(
                        timestamp=candle.timestamp,
                        time=candle.timestamp,
                        type="buy",
                        price=candle.close,
                        reason="SMA crossover",
                    )
                )
            elif crosses_below and quantity > 0:
                gross_exit = quantity * candle.close
                fee = gross_exit * fee_rate
                cash = gross_exit - fee
                profit = cash - (quantity * entry_price)
                profit_pct = ((candle.close - entry_price) / entry_price) * 100
                trades.append(
                    Trade(
                        entry_time=entry_time,
                        exit_time=candle.timestamp,
                        entry_price=entry_price,
                        exit_price=candle.close,
                        quantity=round_number(quantity),
                        profit=round_number(profit, 2),
                        profit_pct=round_number(profit_pct, 2),
                    )
                )
                signals.append(
                    Signal(
                        timestamp=candle.timestamp,
                        time=candle.timestamp,
                        type="sell",
                        price=candle.close,
                        reason="SMA crossover",
                    )
                )
                quantity = 0.0

        equity = cash + quantity * candle.close
        peak_equity = max(peak_equity, equity)
        drawdown = 0 if peak_equity == 0 else (peak_equity - equity) / peak_equity
        max_drawdown = max(max_drawdown, drawdown)
        equity_curve.append(EquityPoint(time=candle.timestamp, value=round_number(equity, 2)))

    if quantity > 0:
        last = candles[-1]
        gross_exit = quantity * last.close
        fee = gross_exit * fee_rate
        cash = gross_exit - fee
        profit = cash - (quantity * entry_price)
        trades.append(
            Trade(
                entry_time=entry_time,
                exit_time=last.timestamp,
                entry_price=entry_price,
                exit_price=last.close,
                quantity=round_number(quantity),
                profit=round_number(profit, 2),
                profit_pct=round_number(((last.close - entry_price) / entry_price) * 100, 2),
            )
        )
        signals.append(
            Signal(
                timestamp=last.timestamp,
                time=last.timestamp,
                type="sell",
                price=last.close,
                reason="SMA crossover",
            )
        )

    net_profit = cash - initial_cash
    winning_trades = len([trade for trade in trades if trade.profit > 0])
    total_trades = len(trades)
    win_rate = 0 if total_trades == 0 else round_number((winning_trades / total_trades) * 100, 2)
    sharpe_ratio = calculate_sharpe_ratio([point.value for point in equity_curve])
    stats = BacktestStats(
        total_trades=total_trades,
        net_profit=round_number(net_profit, 2),
        win_rate=win_rate,
        max_drawdown=round_number(max_drawdown * 100, 2),
        sharpe_ratio=sharpe_ratio,
    )

    return BacktestResponse(
        summary=BacktestSummary(
            initial_cash=round_number(initial_cash, 2),
            final_equity=round_number(cash, 2),
            net_profit=round_number(net_profit, 2),
            net_profit_pct=round_number((net_profit / initial_cash) * 100, 2),
            total_trades=total_trades,
            win_rate=win_rate,
            max_drawdown=round_number(max_drawdown * 100, 2),
            sharpe_ratio=sharpe_ratio,
        ),
        stats=stats,
        trades=trades,
        signals=signals,
        equity_curve=equity_curve,
    )


def calculate_sharpe_ratio(equity_values: list[float]) -> float:
    if len(equity_values) < 3:
        return 0.0
    returns = [
        (current - previous) / previous
        for previous, current in zip(equity_values, equity_values[1:], strict=False)
        if previous != 0
    ]
    if len(returns) < 2:
        return 0.0
    volatility = pstdev(returns)
    if volatility == 0:
        return 0.0
    return round_number((mean(returns) / volatility) * (len(returns) ** 0.5), 2)
