import math

__all__ = [
    "sma",
    "ema",
    "rsi",
    "bollinger_bands",
    "validate_period",
]

NullableFloat = float | None


def sma(values: list[float], period: int) -> list[NullableFloat]:
    """Compute the Simple Moving Average (SMA).

    Args:
        values: Ordered list of price (or any numeric) data points.
        period: Look-back window size; must be a positive integer.

    Returns:
        A list of the same length as *values*.  The first ``period - 1``
        positions are ``None``; subsequent positions hold the arithmetic
        mean of the preceding *period* values (inclusive).
    """
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
    """Compute the Exponential Moving Average (EMA).

    Uses a standard smoothing multiplier of ``2 / (period + 1)``.  The
    first valid EMA value is seeded from the SMA of the first *period*
    data points.

    Args:
        values: Ordered list of price (or any numeric) data points.
        period: Look-back window size; must be a positive integer.

    Returns:
        A list of the same length as *values*.  The first ``period - 1``
        positions are ``None``; subsequent positions hold the EMA value.
        Returns an empty list when *values* is empty.
    """
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
    """Compute the Relative Strength Index (RSI).

    Implements Wilder's smoothed RSI using a recursive average-gain /
    average-loss approach.

    Args:
        values: Ordered list of price (or any numeric) data points.
        period: Look-back window size; must be a positive integer.
            Defaults to 14.

    Returns:
        A list of the same length as *values*.  The first *period*
        positions are ``None``; subsequent positions hold an RSI value
        in the range ``[0, 100]``.  Returns an empty list when *values*
        is empty.
    """
    validate_period(period)
    if not values:
        return []

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
    """Compute Bollinger Bands (upper, middle, lower).

    The middle band is an SMA.  The upper and lower bands are placed
    *standard_deviation_multiplier* population standard deviations above
    and below the middle band respectively.  Population std-dev (dividing
    by *period*, not *period - 1*) is used to match the conventional
    Bollinger Band definition.

    Args:
        values: Ordered list of price (or any numeric) data points.
        period: Look-back window size; must be a positive integer.
            Defaults to 20.
        standard_deviation_multiplier: Number of standard deviations for
            the band width.  Defaults to 2.

    Returns:
        A dict with keys ``"upper"``, ``"middle"``, and ``"lower"``, each
        mapping to a list of the same length as *values*.  The first
        ``period - 1`` positions in every list are ``None``.
    """
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
        variance = sum((v - mean) ** 2 for v in window) / period
        deviation = math.sqrt(variance)
        middle.append(round_number(mean))
        upper.append(round_number(mean + standard_deviation_multiplier * deviation))
        lower.append(round_number(mean - standard_deviation_multiplier * deviation))

    return {"upper": upper, "middle": middle, "lower": lower}


def validate_period(period: int) -> None:
    """Validate that *period* is a positive, non-bool integer.

    Args:
        period: The value to validate.

    Raises:
        ValueError: If *period* is a bool, not an int, or not positive.
            ``bool`` is explicitly rejected because it is a subclass of
            ``int`` in Python, so ``True`` and ``False`` would otherwise
            pass a plain ``isinstance(period, int)`` check.
    """
    if isinstance(period, bool) or not isinstance(period, int) or period <= 0:
        raise ValueError("Period must be a positive integer.")


def _rsi_from_averages(average_gain: float, average_loss: float) -> float:
    """Convert smoothed gain/loss averages to an RSI value.

    Args:
        average_gain: Wilder-smoothed average of gains over the period.
        average_loss: Wilder-smoothed average of losses over the period.

    Returns:
        RSI value in the range ``[0, 100]``.  Returns ``100.0`` when
        *average_loss* is zero (no losing periods).
    """
    if average_loss == 0:
        return 100.0
    relative_strength = average_gain / average_loss
    return round_number(100 - 100 / (1 + relative_strength))


def round_number(value: float, decimals: int = 4) -> float:
    """Round *value* to *decimals* decimal places.

    Args:
        value: The number to round.
        decimals: Number of decimal places. Defaults to 4.

    Returns:
        The rounded float.
    """
    return round(float(value), decimals)
