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

    # Idempotent migrations — add columns that may not exist yet
    migrations = [
        # calculation_sessions: legacy columns with defaults
        "ALTER TABLE calculation_sessions ADD COLUMN name TEXT",
        "ALTER TABLE calculation_sessions ADD COLUMN is_saved INTEGER DEFAULT 0",
        # calculation_sessions: new year-group grundbelopp columns
        "ALTER TABLE calculation_sessions ADD COLUMN g_fsk REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN g_ak13 REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN g_ak46 REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN g_ak79 REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN g_fritids_69 REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN g_fritids_1012 REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN structural_share REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN new_index_scale REAL",
        # school_records: new year-group student count columns
        "ALTER TABLE school_records ADD COLUMN num_fsk INTEGER DEFAULT 0",
        "ALTER TABLE school_records ADD COLUMN num_ak1_3 INTEGER DEFAULT 0",
        "ALTER TABLE school_records ADD COLUMN num_ak4_6 INTEGER DEFAULT 0",
        "ALTER TABLE school_records ADD COLUMN num_ak7_9 INTEGER DEFAULT 0",
        "ALTER TABLE school_records ADD COLUMN num_fritids_6_9 INTEGER DEFAULT 0",
        "ALTER TABLE school_records ADD COLUMN num_fritids_10_12 INTEGER DEFAULT 0",
        # allocation_results: make legacy columns nullable (SQLite: add new cols)
        "ALTER TABLE allocation_results ADD COLUMN num_fsk INTEGER DEFAULT 0",
        "ALTER TABLE allocation_results ADD COLUMN num_ak1_3 INTEGER DEFAULT 0",
        "ALTER TABLE allocation_results ADD COLUMN num_ak4_6 INTEGER DEFAULT 0",
        "ALTER TABLE allocation_results ADD COLUMN num_ak7_9 INTEGER DEFAULT 0",
        "ALTER TABLE allocation_results ADD COLUMN num_fritids_6_9 INTEGER DEFAULT 0",
        "ALTER TABLE allocation_results ADD COLUMN num_fritids_10_12 INTEGER DEFAULT 0",
        "ALTER TABLE allocation_results ADD COLUMN per_pupil_fsk REAL DEFAULT 0",
        "ALTER TABLE allocation_results ADD COLUMN per_pupil_ak1_3 REAL DEFAULT 0",
        "ALTER TABLE allocation_results ADD COLUMN per_pupil_ak4_6 REAL DEFAULT 0",
        "ALTER TABLE allocation_results ADD COLUMN per_pupil_ak7_9 REAL DEFAULT 0",
        "ALTER TABLE allocation_results ADD COLUMN per_pupil_fritids_6_9 REAL DEFAULT 0",
        "ALTER TABLE allocation_results ADD COLUMN per_pupil_fritids_10_12 REAL DEFAULT 0",
        "ALTER TABLE allocation_results ADD COLUMN total_school_allocation REAL DEFAULT 0",
        "ALTER TABLE allocation_results ADD COLUMN total_fritids_allocation REAL DEFAULT 0",
    ]

    async with engine.begin() as conn:
        for statement in migrations:
            try:
                await conn.execute(__import__("sqlalchemy").text(statement))
            except Exception:
                pass  # Column already exists


async def get_db():
    async with async_session() as session:
        yield session
