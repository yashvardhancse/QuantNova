import math
import pandas as pd
from typing import List, Dict, Any

NullableFloat = float | None


def sma(values: list[float], period: int) -> list[NullableFloat]:
    validate_period(period)
    output: list[NullableFloat] = []
    for index in range(len(values)):
        if index + 1 < period:
            output.append(None)
            continue
        window = values[index + 1 - period : index + 1]
        output.append(round_number(sum(window) / period))
    return output


def ema(values: list[float], period: int) -> list[NullableFloat]:
    validate_period(period)
    if not values:
        return []

    multiplier = 2 / (period + 1)
    output: list[NullableFloat] = [None] * len(values)
    previous: float | None = None

    for index, value in enumerate(values):
        if index + 1 < period:
            continue
        if previous is None:
            seed = values[index + 1 - period : index + 1]
            previous = sum(seed) / period
        else:
            previous = (value - previous) * multiplier + previous
        output[index] = round_number(previous)

    return output


def rsi(values: list[float], period: int = 14) -> list[NullableFloat]:
    validate_period(period)
    output: list[NullableFloat] = [None] * len(values)
    if len(values) <= period:
        return output

    average_gain = 0.0
    average_loss = 0.0

    for index in range(1, period + 1):
        change = values[index] - values[index - 1]
        average_gain += max(change, 0)
        average_loss += max(-change, 0)

    average_gain /= period
    average_loss /= period
    output[period] = _rsi_from_averages(average_gain, average_loss)

    for index in range(period + 1, len(values)):
        change = values[index] - values[index - 1]
        gain = max(change, 0)
        loss = max(-change, 0)
        average_gain = (average_gain * (period - 1) + gain) / period
        average_loss = (average_loss * (period - 1) + loss) / period
        output[index] = _rsi_from_averages(average_gain, average_loss)

    return output


def bollinger_bands(
    values: list[float], period: int = 20, standard_deviation_multiplier: float = 2
) -> dict[str, list[NullableFloat]]:
    validate_period(period)
    upper: list[NullableFloat] = []
    middle: list[NullableFloat] = []
    lower: list[NullableFloat] = []

    for index in range(len(values)):
        if index + 1 < period:
            upper.append(None)
            middle.append(None)
            lower.append(None)
            continue

        window = values[index + 1 - period : index + 1]
        mean = sum(window) / period
        variance = sum((value - mean) ** 2 for value in window) / period
        deviation = math.sqrt(variance)
        middle.append(round_number(mean))
        upper.append(round_number(mean + standard_deviation_multiplier * deviation))
        lower.append(round_number(mean - standard_deviation_multiplier * deviation))

    return {"upper": upper, "middle": middle, "lower": lower}


def validate_period(period: int) -> None:
    if not isinstance(period, int) or period <= 0:
        raise ValueError("Period must be a positive integer.")


def _rsi_from_averages(average_gain: float, average_loss: float) -> float:
    if average_loss == 0:
        return 100.0
    relative_strength = average_gain / average_loss
    return round_number(100 - 100 / (1 + relative_strength))


def round_number(value: float, decimals: int = 4) -> float:
    return round(float(value), decimals)

def calculate_atr(data: List[Dict[str, Any]], period: int = 14) -> List[float]:

    if len(data) < period:
        raise ValueError(f"Insufficient data: need at least {period} candles, got {len(data)}")
    
    required_keys = {'high', 'low', 'close'}
    if not all(required_keys.issubset(candle.keys()) for candle in data):
        raise ValueError(f"Each candle must contain: {required_keys}")
    
    df = pd.DataFrame(data)

    df['prev_close'] = df['close'].shift(1)
    df['tr1'] = df['high'] - df['low']  # High - Low
    df['tr2'] = abs(df['high'] - df['prev_close'])  
    df['tr3'] = abs(df['low'] - df['prev_close'])   
    
    df['tr'] = df[['tr1', 'tr2', 'tr3']].max(axis=1)
    df['atr'] = df['tr'].ewm(span=period, adjust=False).mean()
    df.loc[0, 'atr'] = df.loc[0, 'tr1']
    
    return df['atr'].tolist()