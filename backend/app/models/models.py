from pydantic import  ConfigDict,BaseModel, Field, field_validator, model_validator
from pydantic import BaseModel
from typing import Literal


class Candle(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    timestamp: str
    open: float
    high: float
    low: float
    close: float
    volume: float

    @field_validator("open", "high", "low", "close", "volume")
    @classmethod
    def values_must_be_finite(cls, value: float) -> float:
        if value != value or value in (float("inf"), float("-inf")):
            raise ValueError("OHLCV values must be finite numbers.")
        return value

    @model_validator(mode="after")
    def prices_must_be_consistent(self) -> "Candle":
        if self.high < max(self.open, self.close, self.low):
            raise ValueError("high must be greater than or equal to open, low, and close.")
        if self.low > min(self.open, self.close, self.high):
            raise ValueError("low must be less than or equal to open, high, and close.")
        if self.volume < 0:
            raise ValueError("volume must be greater than or equal to zero.")
        return self


class IndicatorConfig(BaseModel):
    sma: list[int] = Field(default_factory=list)
    ema: list[int] = Field(default_factory=list)
    rsi: int | None = None
    bollinger: int | None = None

    @field_validator("sma", "ema")
    @classmethod
    def periods_must_be_positive(cls, periods: list[int]) -> list[int]:
        for period in periods:
            if period <= 0:
                raise ValueError("Indicator periods must be positive integers.")
        return periods

    @field_validator("rsi", "bollinger")
    @classmethod
    def optional_period_must_be_positive(cls, period: int | None) -> int | None:
        if period is not None and period <= 0:
            raise ValueError("Indicator periods must be positive integers.")
        return period

class Signal(BaseModel):
    timestamp: str
    time: str
    type: Literal["buy", "sell"]
    price: float
    reason: str = "SMA crossover"


class Trade(BaseModel):
    entry_time: str
    exit_time: str
    entry_price: float
    exit_price: float
    quantity: float
    profit: float
    profit_pct: float


class BacktestSummary(BaseModel):
    initial_cash: float
    final_equity: float
    net_profit: float
    net_profit_pct: float
    total_trades: int
    win_rate: float
    max_drawdown: float
    sharpe_ratio: float = 0.0


class BacktestStats(BaseModel):
    total_trades: int
    net_profit: float
    win_rate: float
    max_drawdown: float
    sharpe_ratio: float


class EquityPoint(BaseModel):
    time: str
    value: float


class BacktestResponse(BaseModel):
    summary: BacktestSummary
    stats: BacktestStats
    trades: list[Trade]
    signals: list[Signal]
    equity_curve: list[EquityPoint]

class IndicatorRequest(BaseModel):
    candles: list[Candle] = Field(min_length=1)
    indicators: IndicatorConfig


class BacktestRequest(BaseModel):
    candles: list[Candle] = Field(min_length=2)
    short_window: int = Field(gt=0)
    long_window: int = Field(gt=0)
    initial_cash: float = Field(gt=0)
    fee_rate: float = Field(default=0.001, ge=0, lt=1)

    @model_validator(mode="after")
    def short_window_must_be_less_than_long_window(self) -> "BacktestRequest":
        if self.short_window >= self.long_window:
            raise ValueError("short_window must be less than long_window.")
        if self.long_window > len(self.candles):
            raise ValueError("long_window cannot be larger than the number of candles.")
        return self