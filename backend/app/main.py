from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .indicators import router as indicators_router

from app.api.routes import router

app = FastAPI(
    title="QuantNova API",
    description="Backend foundation for OHLCV validation, indicators, and simple backtesting.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "QuantNova-api"}


app.include_router(router)
app.include_router(indicators_router)