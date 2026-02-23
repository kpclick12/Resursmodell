import datetime
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SchoolRecord(Base):
    __tablename__ = "school_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[str] = mapped_column(String, index=True)
    school_name: Mapped[str] = mapped_column(String)
    school_type: Mapped[str] = mapped_column(String)
    # Legacy column — kept for backward compat, new uploads write 0
    num_students: Mapped[int] = mapped_column(Integer, default=0)
    socioeconomic_index: Mapped[float] = mapped_column(Float)
    district: Mapped[str | None] = mapped_column(String, nullable=True)
    uploaded_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    # v1 year-group columns (grouped)
    num_fsk: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    num_ak1_3: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    num_ak4_6: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    num_ak7_9: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    num_fritids_6_9: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    num_fritids_10_12: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    # v2 individual year-group columns
    elever_f: Mapped[int | None] = mapped_column(Integer, nullable=True)
    elever_ak1: Mapped[int | None] = mapped_column(Integer, nullable=True)
    elever_ak2: Mapped[int | None] = mapped_column(Integer, nullable=True)
    elever_ak3: Mapped[int | None] = mapped_column(Integer, nullable=True)
    elever_ak4: Mapped[int | None] = mapped_column(Integer, nullable=True)
    elever_ak5: Mapped[int | None] = mapped_column(Integer, nullable=True)
    elever_ak6: Mapped[int | None] = mapped_column(Integer, nullable=True)
    elever_ak7: Mapped[int | None] = mapped_column(Integer, nullable=True)
    elever_ak8: Mapped[int | None] = mapped_column(Integer, nullable=True)
    elever_ak9: Mapped[int | None] = mapped_column(Integer, nullable=True)


class CalculationSession(Base):
    __tablename__ = "calculation_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    # Legacy param columns — kept for backward compat, new sessions write 0
    base_amount_per_pupil: Mapped[float] = mapped_column(Float, default=0)
    municipal_supplement: Mapped[float] = mapped_column(Float, default=0)
    socioeconomic_weight: Mapped[float] = mapped_column(Float, default=0)
    max_socioeconomic_supplement: Mapped[float] = mapped_column(Float, default=0)
    index_scale: Mapped[float] = mapped_column(Float, default=100)
    total_budget: Mapped[float] = mapped_column(Float)
    name: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    is_saved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    # v1 year-group grundbelopp columns
    g_fsk: Mapped[float | None] = mapped_column(Float, nullable=True)
    g_ak13: Mapped[float | None] = mapped_column(Float, nullable=True)
    g_ak46: Mapped[float | None] = mapped_column(Float, nullable=True)
    g_ak79: Mapped[float | None] = mapped_column(Float, nullable=True)
    g_fritids_69: Mapped[float | None] = mapped_column(Float, nullable=True)
    g_fritids_1012: Mapped[float | None] = mapped_column(Float, nullable=True)
    structural_share: Mapped[float | None] = mapped_column(Float, nullable=True)
    new_index_scale: Mapped[float | None] = mapped_column(Float, nullable=True)
    # v2 model version discriminant
    model_version: Mapped[str | None] = mapped_column(String, nullable=True)
    # v2 budget params
    total_budget_param: Mapped[float | None] = mapped_column(Float, nullable=True)
    budget_grundskola: Mapped[float | None] = mapped_column(Float, nullable=True)
    budget_fritidshem: Mapped[float | None] = mapped_column(Float, nullable=True)
    andel_struktur_grundskola: Mapped[float | None] = mapped_column(Float, nullable=True)
    andel_struktur_fritidshem: Mapped[float | None] = mapped_column(Float, nullable=True)
    avdrag_kommunal_procent: Mapped[float | None] = mapped_column(Float, nullable=True)
    moms_kompensation: Mapped[float | None] = mapped_column(Float, nullable=True)
    admin_kompensation_fri: Mapped[float | None] = mapped_column(Float, nullable=True)
    # v2 weight params
    vikt_f: Mapped[float | None] = mapped_column(Float, nullable=True)
    vikt_ak1: Mapped[float | None] = mapped_column(Float, nullable=True)
    vikt_ak2: Mapped[float | None] = mapped_column(Float, nullable=True)
    vikt_ak3: Mapped[float | None] = mapped_column(Float, nullable=True)
    vikt_ak4: Mapped[float | None] = mapped_column(Float, nullable=True)
    vikt_ak5: Mapped[float | None] = mapped_column(Float, nullable=True)
    vikt_ak6: Mapped[float | None] = mapped_column(Float, nullable=True)
    vikt_ak7: Mapped[float | None] = mapped_column(Float, nullable=True)
    vikt_ak8: Mapped[float | None] = mapped_column(Float, nullable=True)
    vikt_ak9: Mapped[float | None] = mapped_column(Float, nullable=True)
    vikt_fritids_6_9: Mapped[float | None] = mapped_column(Float, nullable=True)
    vikt_fritids_10_12: Mapped[float | None] = mapped_column(Float, nullable=True)
    # v2 tillägg params
    tillagg_skoladmin_per_elev: Mapped[float | None] = mapped_column(Float, nullable=True)
    tillagg_likvärdig_grund_per_elev: Mapped[float | None] = mapped_column(Float, nullable=True)
    tillagg_likvärdig_struktur_per_elev: Mapped[float | None] = mapped_column(Float, nullable=True)
    tillagg_fritidsavgift_per_fritidsbarn: Mapped[float | None] = mapped_column(Float, nullable=True)

    results: Mapped[list["AllocationResult"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )


class AllocationResult(Base):
    __tablename__ = "allocation_results"

    id: Mapped[int] = mapped_column(primary_key=True)
    calc_session_id: Mapped[int] = mapped_column(ForeignKey("calculation_sessions.id"))
    school_name: Mapped[str] = mapped_column(String)
    school_type: Mapped[str] = mapped_column(String)
    # Legacy columns — kept for backward compat
    num_students: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    socioeconomic_index: Mapped[float] = mapped_column(Float)
    district: Mapped[str | None] = mapped_column(String, nullable=True)
    socioeconomic_addition_per_pupil: Mapped[float | None] = mapped_column(Float, nullable=True, default=0)
    total_per_pupil: Mapped[float | None] = mapped_column(Float, nullable=True, default=0)
    total_allocation: Mapped[float] = mapped_column(Float)
    # v1 year-group student count columns
    num_fsk: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    num_ak1_3: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    num_ak4_6: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    num_ak7_9: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    num_fritids_6_9: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    num_fritids_10_12: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    # v1 per-pupil amount columns
    per_pupil_fsk: Mapped[float | None] = mapped_column(Float, nullable=True, default=0)
    per_pupil_ak1_3: Mapped[float | None] = mapped_column(Float, nullable=True, default=0)
    per_pupil_ak4_6: Mapped[float | None] = mapped_column(Float, nullable=True, default=0)
    per_pupil_ak7_9: Mapped[float | None] = mapped_column(Float, nullable=True, default=0)
    per_pupil_fritids_6_9: Mapped[float | None] = mapped_column(Float, nullable=True, default=0)
    per_pupil_fritids_10_12: Mapped[float | None] = mapped_column(Float, nullable=True, default=0)
    # v1 allocation breakdown columns
    total_school_allocation: Mapped[float | None] = mapped_column(Float, nullable=True, default=0)
    total_fritids_allocation: Mapped[float | None] = mapped_column(Float, nullable=True, default=0)
    # v2 individual year-group columns
    elever_f: Mapped[int | None] = mapped_column(Integer, nullable=True)
    elever_ak1: Mapped[int | None] = mapped_column(Integer, nullable=True)
    elever_ak2: Mapped[int | None] = mapped_column(Integer, nullable=True)
    elever_ak3: Mapped[int | None] = mapped_column(Integer, nullable=True)
    elever_ak4: Mapped[int | None] = mapped_column(Integer, nullable=True)
    elever_ak5: Mapped[int | None] = mapped_column(Integer, nullable=True)
    elever_ak6: Mapped[int | None] = mapped_column(Integer, nullable=True)
    elever_ak7: Mapped[int | None] = mapped_column(Integer, nullable=True)
    elever_ak8: Mapped[int | None] = mapped_column(Integer, nullable=True)
    elever_ak9: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # v2 allocation breakdown columns (all in tkr)
    grundersattning: Mapped[float | None] = mapped_column(Float, nullable=True)
    strukturersattning: Mapped[float | None] = mapped_column(Float, nullable=True)
    grundersattning_fritids: Mapped[float | None] = mapped_column(Float, nullable=True)
    strukturersattning_fritids: Mapped[float | None] = mapped_column(Float, nullable=True)
    grundbelopp_brutto: Mapped[float | None] = mapped_column(Float, nullable=True)
    lokalt_avdrag: Mapped[float | None] = mapped_column(Float, nullable=True)
    moms_tillagg: Mapped[float | None] = mapped_column(Float, nullable=True)
    admin_tillagg: Mapped[float | None] = mapped_column(Float, nullable=True)
    tillagg_totalt: Mapped[float | None] = mapped_column(Float, nullable=True)
    netto: Mapped[float | None] = mapped_column(Float, nullable=True)
    nettokvot: Mapped[float | None] = mapped_column(Float, nullable=True)

    session: Mapped["CalculationSession"] = relationship(back_populates="results")
