import json
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

import app.services.binance as binance_module
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_cache():
    # CHANGED: wipe the in-memory cache before every test to prevent cross-test pollution
    binance_module._klines_cache.clear()
    yield
    binance_module._klines_cache.clear()


def test_symbols_endpoint_returns_popular_pairs() -> None:
    response = client.get("/market/binance/symbols")

    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 20
    assert any(pair["symbol"] == "BTCUSDT" for pair in data)
    assert {"symbol", "base_asset", "quote_asset"} <= set(data[0])


def test_symbols_endpoint_includes_eth_and_bnb() -> None:
    response = client.get("/market/binance/symbols")
    symbols = [p["symbol"] for p in response.json()]

    assert "ETHUSDT" in symbols
    assert "BNBUSDT" in symbols


def test_binance_klines_rejects_invalid_symbol_format() -> None:
    response = client.get(
        "/market/binance/klines",
        params={
            "symbol": "BAD SYMBOL!",
            "interval": "1h",
            "start_date": "2026-01-01",
            "end_date": "2026-01-02",
        },
    )

    assert response.status_code == 400
    assert "Invalid trading pair" in response.json()["detail"]


def test_binance_klines_rejects_interval_unchanged() -> None:
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


def test_binance_klines_cache_avoids_second_http_call() -> None:
    # CHANGED: uses 1d interval — single candle covers the full day so the pagination
    # loop exits after one urlopen call, making the cache assertion unambiguous
    binance_payload = [
        [
            1704067200000, "42000.00", "43000.00", "41500.00", "42500.00", "100.00",
            1704153599999, "4200000.00", 10, "42500.00", "42500.00", "0",
        ]
    ]

    mock_response = MagicMock()
    mock_response.read.return_value = json.dumps(binance_payload).encode()
    mock_response.__enter__ = lambda s: s
    mock_response.__exit__ = MagicMock(return_value=False)

    params = {
        "symbol": "ETHUSDT",
        "interval": "1d",
        "start_date": "2024-01-01",
        "end_date": "2024-01-01",
    }

    with patch("app.services.binance.urlopen", return_value=mock_response) as mock_open:
        first = client.get("/market/binance/klines", params=params).json()
        second = client.get("/market/binance/klines", params=params).json()

    assert mock_open.call_count == 1
    assert first == second

