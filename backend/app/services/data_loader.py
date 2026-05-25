from datetime import datetime
import re
import json
from io import BytesIO
from pathlib import Path

import pandas as pd
from fastapi import UploadFile
from pydantic import ValidationError

from backend.app.models.models import Candle

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
        raise ValueError(f"Row {row_number} has empty {column} value.")

    cleaned = str(value).strip()

    if not cleaned:
        raise ValueError(f"Row {row_number} has empty {column} value.")

    cleaned = re.sub(r"[$€£¥,%_\s]", "", cleaned)

    return float(cleaned)



def parse_timestamp(value: object, row_number: int) -> str:
    if pd.isna(value):
        raise ValueError(f"Row {row_number} timestamp is empty.")

    try:
        timestamp = pd.to_datetime(value)
        return timestamp.isoformat()

    except Exception as exc:
        raise ValueError(
            f"Invalid timestamp format at row {row_number}."
        ) from exc



def validate_chronological_order(timestamps: list[datetime]) -> None:
    for i in range(1, len(timestamps)):
        if timestamps[i] <= timestamps[i - 1]:
            raise ValueError(
                "Timestamps must be in strictly chronological order."
            )



def validate_duplicate_timestamps(timestamps: list[datetime]) -> None:
    if len(timestamps) != len(set(timestamps)):
        raise ValueError("Duplicate timestamps detected in uploaded file.")


def load_sample_candles() -> list[Candle]:
    """Loads a sample set of candles for default data testing."""
    base_dir = Path(__file__).resolve().parent.parent.parent
    sample_path = base_dir / "data" / "sample_candles.json"
    
    if not sample_path.exists():
        sample_path = base_dir / "app" / "data" / "sample_candles.json"

    if not sample_path.exists():
        return [
            Candle(
                timestamp=f"2024-01-{i + 1:02d}T00:00:00",
                open=100.0 + i,
                high=105.0 + i,
                low=95.0 + i,
                close=102.0 + i,
                volume=1000.0 + i,
            )
            for i in range(25)
        ]
        
    with open(sample_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    return [Candle(**item) for item in data]


async def parse_upload_file(file: UploadFile) -> list[Candle]:
    """Parses an uploaded CSV or JSON file into a list of Candle models."""
    content = await file.read()
    
    if file.filename.endswith('.csv'):
        df = pd.read_csv(BytesIO(content), sep=None, engine='python')
    elif file.filename.endswith('.xlsx'):
        df = pd.read_excel(BytesIO(content))
    else:
        raise ValueError("Only .csv and .xlsx files are supported")

    columns = {normalize_column(col): str(col) for col in df.columns}

    time_col = find_source_column(columns, {"time", "timestamp", "date", "t", "open_time", "datetime", "date_time"})
    open_col = find_source_column(columns, {"open", "o", "open_price"})
    high_col = find_source_column(columns, {"high", "h", "high_price"})
    low_col = find_source_column(columns, {"low", "l", "low_price"})
    close_col = find_source_column(columns, {"close", "c", "last_price"})
    volume_col = find_source_column(columns, {"volume", "vol", "v"})

    if not all([time_col, open_col, high_col, low_col, close_col]):
        raise ValueError("Missing required columns (time, open, high, low, close) in uploaded data.")

    candles = []
    timestamps = []

    for index, row in df.iterrows():
        row_number = index + 1
        
        ts_str = parse_timestamp(row[time_col], row_number)
        ts_dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
        timestamps.append(ts_dt)

        candles.append(Candle(
            timestamp=ts_str,
            open=parse_number(row[open_col], row_number, "open"),
            high=parse_number(row[high_col], row_number, "high"),
            low=parse_number(row[low_col], row_number, "low"),
            close=parse_number(row[close_col], row_number, "close"),
            volume=parse_number(row[volume_col], row_number, "volume") if volume_col else 0.0
        ))

    validate_chronological_order(timestamps)
    validate_duplicate_timestamps(timestamps)

    return candles