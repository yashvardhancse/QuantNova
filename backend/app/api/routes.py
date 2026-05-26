from datetime import date
from typing import Annotated, Any

from fastapi import APIRouter, File, HTTPException, UploadFile

from backend.app.models.models import BacktestRequest, BacktestResponse, Candle, IndicatorRequest
from app.services.backtester import run_ma_crossover_backtest
from app.services.binance import fetch_klines
from app.services.data_loader import load_sample_candles, parse_upload_file
from app.services.indicators import bollinger_bands, ema, rsi, sma

router = APIRouter()


@router.get("/api/sample-data", response_model=list[Candle])
def get_sample_data() -> list[Candle]:
    return load_sample_candles()


@router.post("/api/upload-csv", response_model=list[Candle])
async def upload_csv(file: Annotated[UploadFile, File()]) -> list[Candle]:
    try:
        return await parse_upload_file(file)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/api/data/upload", response_model=list[Candle])
async def upload_api_data(file: Annotated[UploadFile, File()]) -> list[Candle]:
    try:
        return await parse_upload_file(file)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/data/upload", response_model=list[Candle])
async def upload_data(file: Annotated[UploadFile, File()]) -> list[Candle]:
    try:
        return await parse_upload_file(file)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/market/binance/klines")
def get_binance_klines(
    symbol: str,
    interval: str,
    start_date: date,
    end_date: date,
) -> list[dict[str, Any]]:
    try:
        return fetch_klines(
            symbol=symbol,
            interval=interval,
            start_date=start_date,
            end_date=end_date,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/api/indicators")
def calculate_indicators(request: IndicatorRequest) -> dict[str, object]:
    closes = [candle.close for candle in request.candles]
    output: dict[str, object] = {}

    for period in request.indicators.sma:
        output[f"sma_{period}"] = sma(closes, period)
    for period in request.indicators.ema:
        output[f"ema_{period}"] = ema(closes, period)
    if request.indicators.rsi is not None:
        output[f"rsi_{request.indicators.rsi}"] = rsi(closes, request.indicators.rsi)
    if request.indicators.bollinger is not None:
        output[f"bollinger_{request.indicators.bollinger}"] = bollinger_bands(
            closes, request.indicators.bollinger
        )

    return output


@router.post("/api/backtest/ma-crossover", response_model=BacktestResponse)
def run_backtest(request: BacktestRequest) -> BacktestResponse:
    try:
        return run_ma_crossover_backtest(
            candles=request.candles,
            short_window=request.short_window,
            long_window=request.long_window,
            initial_cash=request.initial_cash,
            fee_rate=request.fee_rate,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
