from __future__ import annotations

import json
import re
import time
from datetime import UTC, date, datetime, timedelta
from urllib.error import (
    HTTPError,  # CHANGED: import HTTPError to catch invalid-symbol responses from Binance
)
from urllib.parse import urlencode
from urllib.request import urlopen

BINANCE_KLINES_URL = "https://api.binance.com/api/v3/klines"
MAX_KLINES_PER_REQUEST = 1000
CACHE_TTL_SECONDS = 300  # CHANGED: 5-minute TTL for the in-memory response cache

INTERVAL_TO_MS = {
    "1m": 60_000,
    "3m": 180_000,
    "5m": 300_000,
    "15m": 900_000,
    "30m": 1_800_000,
    "1h": 3_600_000,
    "2h": 7_200_000,
    "4h": 14_400_000,
    "6h": 21_600_000,
    "8h": 28_800_000,
    "12h": 43_200_000,
    "1d": 86_400_000,
    "3d": 259_200_000,
    "1w": 604_800_000,
    "1M": 2_592_000_000,
}

# CHANGED: curated list of 30 popular Binance spot pairs for the UI selector
POPULAR_PAIRS: list[dict[str, str]] = [
    {"symbol": "BTCUSDT", "base_asset": "BTC", "quote_asset": "USDT"},
    {"symbol": "ETHUSDT", "base_asset": "ETH", "quote_asset": "USDT"},
    {"symbol": "BNBUSDT", "base_asset": "BNB", "quote_asset": "USDT"},
    {"symbol": "XRPUSDT", "base_asset": "XRP", "quote_asset": "USDT"},
    {"symbol": "ADAUSDT", "base_asset": "ADA", "quote_asset": "USDT"},
    {"symbol": "SOLUSDT", "base_asset": "SOL", "quote_asset": "USDT"},
    {"symbol": "DOGEUSDT", "base_asset": "DOGE", "quote_asset": "USDT"},
    {"symbol": "DOTUSDT", "base_asset": "DOT", "quote_asset": "USDT"},
    {"symbol": "LTCUSDT", "base_asset": "LTC", "quote_asset": "USDT"},
    {"symbol": "LINKUSDT", "base_asset": "LINK", "quote_asset": "USDT"},
    {"symbol": "AVAXUSDT", "base_asset": "AVAX", "quote_asset": "USDT"},
    {"symbol": "UNIUSDT", "base_asset": "UNI", "quote_asset": "USDT"},
    {"symbol": "ATOMUSDT", "base_asset": "ATOM", "quote_asset": "USDT"},
    {"symbol": "MATICUSDT", "base_asset": "MATIC", "quote_asset": "USDT"},
    {"symbol": "TRXUSDT", "base_asset": "TRX", "quote_asset": "USDT"},
    {"symbol": "SHIBUSDT", "base_asset": "SHIB", "quote_asset": "USDT"},
    {"symbol": "NEARUSDT", "base_asset": "NEAR", "quote_asset": "USDT"},
    {"symbol": "AAVEUSDT", "base_asset": "AAVE", "quote_asset": "USDT"},
    {"symbol": "ALGOUSDT", "base_asset": "ALGO", "quote_asset": "USDT"},
    {"symbol": "FILUSDT", "base_asset": "FIL", "quote_asset": "USDT"},
    {"symbol": "VETUSDT", "base_asset": "VET", "quote_asset": "USDT"},
    {"symbol": "SANDUSDT", "base_asset": "SAND", "quote_asset": "USDT"},
    {"symbol": "MANAUSDT", "base_asset": "MANA", "quote_asset": "USDT"},
    {"symbol": "GALAUSDT", "base_asset": "GALA", "quote_asset": "USDT"},
    {"symbol": "APEUSDT", "base_asset": "APE", "quote_asset": "USDT"},
    {"symbol": "FTMUSDT", "base_asset": "FTM", "quote_asset": "USDT"},
    {"symbol": "ETHBTC", "base_asset": "ETH", "quote_asset": "BTC"},
    {"symbol": "BNBBTC", "base_asset": "BNB", "quote_asset": "BTC"},
    {"symbol": "LTCBTC", "base_asset": "LTC", "quote_asset": "BTC"},
    {"symbol": "XRPBTC", "base_asset": "XRP", "quote_asset": "BTC"},
]

# CHANGED: regex to reject malformed symbol strings before hitting Binance
_SYMBOL_RE = re.compile(r"^[A-Z0-9]{3,20}$")

# CHANGED: module-level cache keyed by (symbol, interval, start_date, end_date)
_klines_cache: dict[tuple[str, str, str, str], tuple[float, list[dict[str, object]]]] = {}


def get_popular_pairs() -> list[dict[str, str]]:
    # CHANGED: returns the curated list consumed by GET /market/binance/symbols
    return POPULAR_PAIRS


def fetch_klines(
    symbol: str,
    interval: str,
    start_date: date,
    end_date: date,
) -> list[dict[str, object]]:
    if interval not in INTERVAL_TO_MS:
        raise ValueError(f"Unsupported interval '{interval}'.")
    if end_date < start_date:
        raise ValueError("end_date must be greater than or equal to start_date.")

    # CHANGED: validate symbol format before making any network call
    normalized_symbol = symbol.strip().upper()
    if not _SYMBOL_RE.match(normalized_symbol):
        raise ValueError(
            f"Invalid trading pair '{symbol}'. "
            "Symbols must be 3-20 alphanumeric characters (e.g. BTCUSDT, ETHUSDT)."
        )

    # CHANGED: check the in-memory cache before issuing HTTP requests to Binance
    cache_key = (normalized_symbol, interval, str(start_date), str(end_date))
    cached = _klines_cache.get(cache_key)
    if cached is not None:
        fetched_at, result = cached
        if time.monotonic() - fetched_at < CACHE_TTL_SECONDS:
            return result

    start_dt = datetime.combine(start_date, datetime.min.time(), tzinfo=UTC)
    end_dt_exclusive = datetime.combine(
        end_date + timedelta(days=1),
        datetime.min.time(),
        tzinfo=UTC,
    )
    start_ms = int(start_dt.timestamp() * 1000)
    end_ms_exclusive = int(end_dt_exclusive.timestamp() * 1000)
    step_ms = INTERVAL_TO_MS[interval]

    normalized: list[dict[str, object]] = []
    cursor_ms = start_ms

    while cursor_ms < end_ms_exclusive:
        params = {
            "symbol": normalized_symbol,
            "interval": interval,
            "startTime": cursor_ms,
            "endTime": end_ms_exclusive - 1,
            "limit": MAX_KLINES_PER_REQUEST,
        }
        url = f"{BINANCE_KLINES_URL}?{urlencode(params)}"
        # CHANGED: catch HTTPError so invalid symbols return a clean 400 instead of a 500
        try:
            with urlopen(url, timeout=20) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            raise ValueError(
                f"Binance rejected symbol '{normalized_symbol}': {exc.reason}. "
                "Ensure the symbol is a valid Binance spot pair (e.g. BTCUSDT, ETHUSDT)."
            ) from exc

        if not payload:
            break

        for candle in payload:
            open_time_ms = int(candle[0])
            normalized.append(
                {
                    "time": open_time_ms // 1000,
                    "open": float(candle[1]),
                    "high": float(candle[2]),
                    "low": float(candle[3]),
                    "close": float(candle[4]),
                    "volume": float(candle[5]),
                }
            )

        last_open_ms = int(payload[-1][0])
        next_cursor_ms = last_open_ms + step_ms
        if next_cursor_ms <= cursor_ms:
            break
        cursor_ms = next_cursor_ms

    # CHANGED: store result in cache before returning
    _klines_cache[cache_key] = (time.monotonic(), normalized)
    return normalized
