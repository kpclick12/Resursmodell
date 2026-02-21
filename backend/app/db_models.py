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
    num_students: Mapped[int] = mapped_column(Integer)
    socioeconomic_index: Mapped[float] = mapped_column(Float)
    district: Mapped[str | None] = mapped_column(String, nullable=True)
    uploaded_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )


class CalculationSession(Base):
    __tablename__ = "calculation_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    base_amount_per_pupil: Mapped[float] = mapped_column(Float)
    municipal_supplement: Mapped[float] = mapped_column(Float)
    socioeconomic_weight: Mapped[float] = mapped_column(Float)
    max_socioeconomic_supplement: Mapped[float] = mapped_column(Float)
    index_scale: Mapped[float] = mapped_column(Float)
    total_budget: Mapped[float] = mapped_column(Float)
    name: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    is_saved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    results: Mapped[list["AllocationResult"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )


class AllocationResult(Base):
    __tablename__ = "allocation_results"

    id: Mapped[int] = mapped_column(primary_key=True)
    calc_session_id: Mapped[int] = mapped_column(ForeignKey("calculation_sessions.id"))
    school_name: Mapped[str] = mapped_column(String)
    school_type: Mapped[str] = mapped_column(String)
    num_students: Mapped[int] = mapped_column(Integer)
    socioeconomic_index: Mapped[float] = mapped_column(Float)
    district: Mapped[str | None] = mapped_column(String, nullable=True)
    socioeconomic_addition_per_pupil: Mapped[float] = mapped_column(Float)
    total_per_pupil: Mapped[float] = mapped_column(Float)
    total_allocation: Mapped[float] = mapped_column(Float)

    session: Mapped["CalculationSession"] = relationship(back_populates="results")
