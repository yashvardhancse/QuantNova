from datetime import datetime

from sqlalchemy import DateTime, Float, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class CandleDB(Base):
    __tablename__ = "candles"

    # Optional but recommended for production flexibility
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Time-series column (indexed by TimescaleDB)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    # Optional but VERY useful if you scale beyond one asset
    symbol: Mapped[str] = mapped_column(index=True)

    open: Mapped[float] = mapped_column(Float, nullable=False)
    high: Mapped[float] = mapped_column(Float, nullable=False)
    low: Mapped[float] = mapped_column(Float, nullable=False)
    close: Mapped[float] = mapped_column(Float, nullable=False)
    volume: Mapped[float] = mapped_column(Float, nullable=False)

    __table_args__ = (
        # Critical for time-range queries (backtesting speed)
        Index("ix_candles_symbol_timestamp", "symbol", "timestamp"),
    )