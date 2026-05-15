from io import BytesIO

import pandas as pd
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_sample_data_endpoint() -> None:
    response = client.get("/api/sample-data")

    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 20
    assert {"timestamp", "open", "high", "low", "close", "volume"} <= set(data[0])


def test_indicators_endpoint() -> None:
    candles = client.get("/api/sample-data").json()
    response = client.post(
        "/api/indicators",
        json={
            "candles": candles,
            "indicators": {"sma": [5, 12], "ema": [10], "rsi": 14, "bollinger": 20},
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "sma_5" in data
    assert "ema_10" in data
    assert "rsi_14" in data
    assert "bollinger_20" in data
    assert len(data["sma_5"]) == len(candles)


def test_backtest_endpoint() -> None:
    candles = client.get("/api/sample-data").json()
    response = client.post(
        "/api/backtest/ma-crossover",
        json={
            "candles": candles,
            "short_window": 5,
            "long_window": 12,
            "initial_cash": 10000,
            "fee_rate": 0.001,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert {"summary", "stats", "trades", "signals", "equity_curve"} <= set(data)
    assert "final_equity" in data["summary"]
    assert {"total_trades", "net_profit", "win_rate", "max_drawdown", "sharpe_ratio"} <= set(
        data["stats"]
    )
    if data["signals"]:
        assert {"time", "type", "price", "reason"} <= set(data["signals"][0])
    if data["equity_curve"]:
        assert {"time", "value"} <= set(data["equity_curve"][0])


def test_csv_upload_endpoint_accepts_ohlcv_file() -> None:
    response = client.post(
        "/api/data/upload",
        files={
            "file": (
                "good.csv",
                "date,open,high,low,close,volume\n2024-01-01,10,12,9,11,100",
                "text/csv",
            )
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data[0]["timestamp"] == "2024-01-01T00:00:00"
    assert data[0]["close"] == 11


def test_csv_upload_accepts_common_export_aliases_and_formatted_numbers() -> None:
    response = client.post(
        "/api/data/upload",
        files={
            "file": (
                "broker-export.csv",
                "\n".join(
                    [
                        "Open Time,Open Price,High Price,Low Price,Last Price,Vol",
                        '2024-01-01,"$1,000.50","$1,020.75","$990.25","$1,010.00","12,345"',
                    ]
                ),
                "text/csv",
            )
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data[0]["timestamp"] == "2024-01-01T00:00:00"
    assert data[0]["open"] == 1000.5
    assert data[0]["close"] == 1010
    assert data[0]["volume"] == 12345


def test_csv_upload_accepts_semicolon_separated_files() -> None:
    response = client.post(
        "/api/data/upload",
        files={
            "file": (
                "semicolon.csv",
                "datetime;open;high;low;close;volume\n2024-01-01 12:00:00;10;12;9;11;100",
                "text/csv",
            )
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data[0]["timestamp"] == "2024-01-01T12:00:00"
    assert data[0]["close"] == 11


def test_xlsx_upload_endpoint_accepts_ohlcv_file() -> None:
    buffer = BytesIO()
    pd.DataFrame(
        [
            {
                "Date/Time": "2024-01-01 00:00:00",
                "Open": 10,
                "High": 12,
                "Low": 9,
                "Close": 11,
                "Volume": 100,
            }
        ]
    ).to_excel(buffer, index=False)
    buffer.seek(0)

    response = client.post(
        "/api/data/upload",
        files={
            "file": (
                "good.xlsx",
                buffer.getvalue(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data[0]["close"] == 11


def test_invalid_csv_upload_returns_clear_400() -> None:
    response = client.post(
        "/api/upload-csv",
        files={"file": ("bad.csv", "timestamp,open,close\n2024-01-01,10,11", "text/csv")},
    )

    assert response.status_code == 400
    assert "Missing required columns" in response.json()["detail"]


def test_upload_endpoint_rejects_unsupported_type() -> None:
    response = client.post(
        "/api/data/upload",
        files={"file": ("bad.json", '{"a":1}', "application/json")},
    )

    assert response.status_code == 400
    assert "Only .csv and .xlsx files are supported" in response.json()["detail"]


def test_binance_endpoint_validates_interval() -> None:
    response = client.get(
        "/market/binance/klines",
        params={
            "symbol": "BTCUSDT",
            "interval": "13m",
            "start_date": "2026-01-01",
            "end_date": "2026-01-02",
        },
    )

    assert response.status_code == 400
    assert "Unsupported interval" in response.json()["detail"]
