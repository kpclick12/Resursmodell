import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# Ensure data directory exists
data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "data")
os.makedirs(data_dir, exist_ok=True)

engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def create_tables():
    async with engine.begin() as conn:
        from app.db_models import SchoolRecord, CalculationSession, AllocationResult  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)

    # Idempotent migration for new columns
    async with engine.begin() as conn:
        for statement in [
            "ALTER TABLE calculation_sessions ADD COLUMN name TEXT",
            "ALTER TABLE calculation_sessions ADD COLUMN is_saved INTEGER DEFAULT 0",
        ]:
            try:
                await conn.execute(__import__("sqlalchemy").text(statement))
            except Exception:
                pass  # Column already exists


async def get_db():
    async with async_session() as session:
        yield session
