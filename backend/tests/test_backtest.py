from backend.app.models.models import Candle
from app.services.backtester import run_ma_crossover_backtest


def test_ma_crossover_backtest_returns_summary_trades_and_signals() -> None:
    closes = [10, 9, 8, 9, 10, 11, 12, 11, 10, 9, 8, 7]
    candles = [
        Candle(
            timestamp=f"2024-01-{index + 1:02d}",
            open=close,
            high=close + 1,
            low=close - 1,
            close=close,
            volume=1000 + index,
        )
        for index, close in enumerate(closes)
    ]

    result = run_ma_crossover_backtest(
        candles=candles,
        short_window=2,
        long_window=4,
        initial_cash=1000,
        fee_rate=0,
    )

    assert result.summary.total_trades == 1
    assert result.summary.final_equity == 1000
    assert result.trades[0].entry_time == "2024-01-05"
    assert result.trades[0].exit_time == "2024-01-09"
    assert result.signals[0].type == "buy"
    assert result.signals[0].time == "2024-01-05"
    assert result.signals[0].price == 10
    assert result.signals[0].reason == "SMA crossover"
    assert result.signals[1].type == "sell"
    assert result.signals[1].time == "2024-01-09"
    assert len(result.equity_curve) == len(candles) - 1
    assert result.equity_curve[0].time == "2024-01-02"
    assert result.equity_curve[0].value == 1000
    assert result.stats.total_trades == 1
    assert result.stats.sharpe_ratio == result.summary.sharpe_ratio
