import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import engine, AsyncSessionLocal

@pytest.mark.asyncio
async def test_database_connection():
    """Test that database connection is established successfully."""
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT 1"))
        assert result.fetchone()[0] == 1

@pytest.mark.asyncio
async def test_session_creation():
    """Test that async session can be created."""
    async with AsyncSessionLocal() as session:
        assert session is not None
        assert isinstance(session, AsyncSession)