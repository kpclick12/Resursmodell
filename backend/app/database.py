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
        # v2 calculation_sessions columns
        "ALTER TABLE calculation_sessions ADD COLUMN model_version TEXT",
        "ALTER TABLE calculation_sessions ADD COLUMN total_budget_param REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN budget_grundskola REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN budget_fritidshem REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN andel_struktur_grundskola REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN andel_struktur_fritidshem REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN avdrag_kommunal_procent REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN moms_kompensation REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN admin_kompensation_fri REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN vikt_f REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN vikt_ak1 REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN vikt_ak2 REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN vikt_ak3 REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN vikt_ak4 REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN vikt_ak5 REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN vikt_ak6 REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN vikt_ak7 REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN vikt_ak8 REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN vikt_ak9 REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN vikt_fritids_6_9 REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN vikt_fritids_10_12 REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN tillagg_skoladmin_per_elev REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN tillagg_likvärdig_grund_per_elev REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN tillagg_likvärdig_struktur_per_elev REAL",
        "ALTER TABLE calculation_sessions ADD COLUMN tillagg_fritidsavgift_per_fritidsbarn REAL",
        # v2 school_records individual year columns
        "ALTER TABLE school_records ADD COLUMN elever_f INTEGER",
        "ALTER TABLE school_records ADD COLUMN elever_ak1 INTEGER",
        "ALTER TABLE school_records ADD COLUMN elever_ak2 INTEGER",
        "ALTER TABLE school_records ADD COLUMN elever_ak3 INTEGER",
        "ALTER TABLE school_records ADD COLUMN elever_ak4 INTEGER",
        "ALTER TABLE school_records ADD COLUMN elever_ak5 INTEGER",
        "ALTER TABLE school_records ADD COLUMN elever_ak6 INTEGER",
        "ALTER TABLE school_records ADD COLUMN elever_ak7 INTEGER",
        "ALTER TABLE school_records ADD COLUMN elever_ak8 INTEGER",
        "ALTER TABLE school_records ADD COLUMN elever_ak9 INTEGER",
        # v2 allocation_results columns
        "ALTER TABLE allocation_results ADD COLUMN elever_f INTEGER",
        "ALTER TABLE allocation_results ADD COLUMN elever_ak1 INTEGER",
        "ALTER TABLE allocation_results ADD COLUMN elever_ak2 INTEGER",
        "ALTER TABLE allocation_results ADD COLUMN elever_ak3 INTEGER",
        "ALTER TABLE allocation_results ADD COLUMN elever_ak4 INTEGER",
        "ALTER TABLE allocation_results ADD COLUMN elever_ak5 INTEGER",
        "ALTER TABLE allocation_results ADD COLUMN elever_ak6 INTEGER",
        "ALTER TABLE allocation_results ADD COLUMN elever_ak7 INTEGER",
        "ALTER TABLE allocation_results ADD COLUMN elever_ak8 INTEGER",
        "ALTER TABLE allocation_results ADD COLUMN elever_ak9 INTEGER",
        "ALTER TABLE allocation_results ADD COLUMN grundersattning REAL",
        "ALTER TABLE allocation_results ADD COLUMN strukturersattning REAL",
        "ALTER TABLE allocation_results ADD COLUMN grundersattning_fritids REAL",
        "ALTER TABLE allocation_results ADD COLUMN strukturersattning_fritids REAL",
        "ALTER TABLE allocation_results ADD COLUMN grundbelopp_brutto REAL",
        "ALTER TABLE allocation_results ADD COLUMN lokalt_avdrag REAL",
        "ALTER TABLE allocation_results ADD COLUMN moms_tillagg REAL",
        "ALTER TABLE allocation_results ADD COLUMN admin_tillagg REAL",
        "ALTER TABLE allocation_results ADD COLUMN tillagg_totalt REAL",
        "ALTER TABLE allocation_results ADD COLUMN netto REAL",
        "ALTER TABLE allocation_results ADD COLUMN nettokvot REAL",
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
