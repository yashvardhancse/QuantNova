import re
from io import BytesIO
from pathlib import Path

import pandas as pd
from fastapi import UploadFile
from pydantic import ValidationError

from backend.app.models.models import Candle

REQUIRED_COLUMNS = ("open", "high", "low", "close", "volume")
TIME_ALIASES = {
    "timestamp",
    "date",
    "datetime",
    "date_time",
    "date_time_utc",
    "time",
    "open_time",
    "open_time_utc",
    "start_time",
    "candle_time",
}
COLUMN_ALIASES = {
    "open": {"open", "o", "open_price", "price_open"},
    "high": {"high", "h", "high_price", "price_high"},
    "low": {"low", "l", "low_price", "price_low"},
    "close": {"close", "c", "last", "last_price", "close_price", "price_close", "adj_close"},
    "volume": {"volume", "vol", "v", "base_volume", "volume_btc", "volume_usd", "volume_usdt"},
}
SAMPLE_DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "sample_btc_usd.csv"


def load_sample_candles() -> list[Candle]:
    return parse_ohlcv_csv(SAMPLE_DATA_PATH.read_text(encoding="utf-8"))


async def parse_upload_file(file: UploadFile) -> list[Candle]:
    filename = (file.filename or "").lower()
    content = await file.read()
    if not content:
        raise ValueError("Uploaded file is empty.")

    if filename.endswith(".csv"):
        dataframe = pd.read_csv(BytesIO(content), sep=None, engine="python")
    elif filename.endswith(".xlsx"):
        dataframe = pd.read_excel(BytesIO(content))
    else:
        raise ValueError("Only .csv and .xlsx files are supported.")

    return parse_ohlcv_dataframe(dataframe)


def parse_ohlcv_csv(csv_text: str) -> list[Candle]:
    lines = [line.strip() for line in csv_text.strip().splitlines() if line.strip()]
    if len(lines) < 2:
        raise ValueError("CSV must include a header row and at least one candle row.")

    headers = [normalize_column(header) for header in lines[0].split(",")]
    time_column = next((column for column in TIME_ALIASES if column in headers), None)
    missing = sorted(set(REQUIRED_COLUMNS) - set(headers))

    if time_column is None:
        missing.insert(0, "timestamp or date")
    if missing:
        raise ValueError(f"CSV is missing required columns: {', '.join(missing)}.")

    candles: list[Candle] = []
    for row_number, line in enumerate(lines[1:], start=2):
        cells = [cell.strip() for cell in line.split(",")]
        if len(cells) != len(headers):
            raise ValueError(
                f"Row {row_number} has {len(cells)} values but expected {len(headers)}."
            )

        row = dict(zip(headers, cells, strict=True))
        try:
            candles.append(
                Candle(
                    timestamp=row[time_column],
                    open=float(row["open"]),
                    high=float(row["high"]),
                    low=float(row["low"]),
                    close=float(row["close"]),
                    volume=float(row["volume"]),
                )
            )
        except (KeyError, TypeError, ValueError, ValidationError) as exc:
            raise ValueError(f"Row {row_number} contains invalid OHLCV data.") from exc

    return candles


def parse_ohlcv_dataframe(dataframe: pd.DataFrame) -> list[Candle]:
    if dataframe.empty:
        raise ValueError("Uploaded file must include at least one candle row.")

    columns = {normalize_column(column): str(column) for column in dataframe.columns}
    time_source = find_source_column(columns, TIME_ALIASES)
    source_columns = {
        canonical: find_source_column(columns, aliases)
        for canonical, aliases in COLUMN_ALIASES.items()
    }
    missing = sorted([column for column, source in source_columns.items() if source is None])
    if time_source is None:
        missing.insert(0, "timestamp/date/datetime/time")
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(missing)}.")

    candles: list[Candle] = []
    for row_index, row in dataframe.iterrows():
        row_number = row_index + 2
        try:
            if row_is_empty(row, [time_source, *source_columns.values()]):
                continue
            candles.append(
                Candle(
                    timestamp=format_timestamp(row[time_source]),
                    open=parse_number(row[source_columns["open"]], row_number, "open"),
                    high=parse_number(row[source_columns["high"]], row_number, "high"),
                    low=parse_number(row[source_columns["low"]], row_number, "low"),
                    close=parse_number(row[source_columns["close"]], row_number, "close"),
                    volume=parse_number(row[source_columns["volume"]], row_number, "volume"),
                )
            )
        except (KeyError, TypeError, ValueError, ValidationError) as exc:
            raise ValueError(f"Row {row_number} contains invalid OHLCV data.") from exc

    if not candles:
        raise ValueError("Uploaded file must include at least one valid candle row.")

    return candles


def normalize_column(column: object) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "_", str(column).strip().lower())
    return normalized.strip("_")


def find_source_column(columns: dict[str, str], aliases: set[str]) -> str | None:
    for alias in aliases:
        if alias in columns:
            return columns[alias]
    return None


def parse_number(value: object, row_number: int, column: str) -> float:
    if pd.isna(value):
        raise ValueError(f"Row {row_number} has an empty {column} value.")
    if isinstance(value, int | float):
        return float(value)

    cleaned = str(value).strip()
    if not cleaned:
        raise ValueError(f"Row {row_number} has an empty {column} value.")
    if cleaned.startswith("(") and cleaned.endswith(")"):
        cleaned = f"-{cleaned[1:-1]}"
    cleaned = re.sub(r"[$€£¥,%_\s]", "", cleaned)
    cleaned = cleaned.replace(",", "")
    return float(cleaned)


def format_timestamp(value: object) -> str:
    if pd.isna(value):
        raise ValueError("Timestamp value is empty.")
    if isinstance(value, pd.Timestamp):
        if value.time() == pd.Timestamp(value.date()).time():
            return value.date().isoformat()
        return value.isoformat()
    return str(value).strip()


def row_is_empty(row: pd.Series, columns: list[str | None]) -> bool:
    present_columns = [column for column in columns if column is not None]
    return all(pd.isna(row[column]) or str(row[column]).strip() == "" for column in present_columns)
