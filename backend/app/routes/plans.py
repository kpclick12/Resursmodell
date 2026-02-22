from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_user
from app.database import get_db
from app.db_models import CalculationSession, AllocationResult
from app.models import (
    SavePlanRequest,
    RenamePlanRequest,
    PlanSummary,
    PlanDetail,
    CalculationParameters,
    SchoolResult,
)
from app.services.calculator import _build_summary

router = APIRouter(prefix="/api/plans", tags=["plans"])


@router.post("", response_model=PlanSummary)
async def save_plan(
    body: SavePlanRequest,
    _user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CalculationSession).where(
            CalculationSession.session_id == body.session_id
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.is_saved:
        raise HTTPException(status_code=400, detail="Session already saved as a plan")

    session.name = body.name
    session.is_saved = True
    await db.commit()
    await db.refresh(session)

    count_result = await db.execute(
        select(AllocationResult).where(
            AllocationResult.calc_session_id == session.id
        )
    )
    total_schools = len(count_result.scalars().all())

    return PlanSummary(
        session_id=session.session_id,
        name=session.name,
        total_budget=session.total_budget,
        total_schools=total_schools,
        created_at=session.created_at,
    )


@router.get("", response_model=list[PlanSummary])
async def list_plans(
    _user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CalculationSession)
        .where(CalculationSession.is_saved == True)  # noqa: E712
        .options(selectinload(CalculationSession.results))
        .order_by(CalculationSession.created_at.desc())
    )
    sessions = result.scalars().all()

    return [
        PlanSummary(
            session_id=s.session_id,
            name=s.name or "",
            total_budget=s.total_budget,
            total_schools=len(s.results),
            created_at=s.created_at,
        )
        for s in sessions
    ]


def _session_to_parameters(session: CalculationSession) -> CalculationParameters:
    """Reconstruct CalculationParameters from a stored session."""
    # New-format session: use the new grundbelopp columns
    if session.g_fsk is not None:
        return CalculationParameters(
            g_fsk=session.g_fsk,
            g_ak13=session.g_ak13 or 62_000,
            g_ak46=session.g_ak46 or 66_100,
            g_ak79=session.g_ak79 or 70_100,
            g_fritids_69=session.g_fritids_69 or 30_800,
            g_fritids_1012=session.g_fritids_1012 or 9_900,
            structural_share=session.structural_share or 0.19,
            index_scale=session.new_index_scale or 100.0,
        )
    # Legacy session: return defaults
    return CalculationParameters()


def _result_to_school_result(r: AllocationResult) -> SchoolResult:
    """Reconstruct SchoolResult from a stored AllocationResult row."""
    num_fsk        = r.num_fsk or 0
    num_ak1_3      = r.num_ak1_3 or 0
    num_ak4_6      = r.num_ak4_6 or 0
    num_ak7_9      = r.num_ak7_9 or 0
    num_fritids_6_9   = r.num_fritids_6_9 or 0
    num_fritids_10_12 = r.num_fritids_10_12 or 0

    school_students = num_fsk + num_ak1_3 + num_ak4_6 + num_ak7_9
    fritids_students = num_fritids_6_9 + num_fritids_10_12

    school_alloc  = r.total_school_allocation or 0.0
    fritids_alloc = r.total_fritids_allocation or 0.0
    # For legacy rows, total_allocation is the source of truth
    total_alloc = r.total_allocation

    return SchoolResult(
        school_name=r.school_name,
        school_type=r.school_type,
        num_fsk=num_fsk,
        num_ak1_3=num_ak1_3,
        num_ak4_6=num_ak4_6,
        num_ak7_9=num_ak7_9,
        num_fritids_6_9=num_fritids_6_9,
        num_fritids_10_12=num_fritids_10_12,
        total_school_students=school_students,
        total_fritids_students=fritids_students,
        socioeconomic_index=r.socioeconomic_index,
        district=r.district,
        per_pupil_fsk=r.per_pupil_fsk or 0.0,
        per_pupil_ak1_3=r.per_pupil_ak1_3 or 0.0,
        per_pupil_ak4_6=r.per_pupil_ak4_6 or 0.0,
        per_pupil_ak7_9=r.per_pupil_ak7_9 or 0.0,
        per_pupil_fritids_6_9=r.per_pupil_fritids_6_9 or 0.0,
        per_pupil_fritids_10_12=r.per_pupil_fritids_10_12 or 0.0,
        total_school_allocation=school_alloc,
        total_fritids_allocation=fritids_alloc,
        total_allocation=total_alloc,
    )


@router.get("/{session_id}", response_model=PlanDetail)
async def get_plan(
    session_id: str,
    _user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CalculationSession)
        .where(CalculationSession.session_id == session_id)
        .options(selectinload(CalculationSession.results))
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Plan not found")

    parameters = _session_to_parameters(session)
    school_results = [_result_to_school_result(r) for r in session.results]
    summary = _build_summary(school_results, parameters)

    return PlanDetail(
        session_id=session.session_id,
        name=session.name or "",
        parameters=parameters,
        summary=summary,
        schools=school_results,
        created_at=session.created_at,
    )


@router.patch("/{session_id}", response_model=PlanSummary)
async def rename_plan(
    session_id: str,
    body: RenamePlanRequest,
    _user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CalculationSession)
        .where(CalculationSession.session_id == session_id)
        .options(selectinload(CalculationSession.results))
    )
    session = result.scalar_one_or_none()
    if not session or not session.is_saved:
        raise HTTPException(status_code=404, detail="Plan not found")

    session.name = body.name
    await db.commit()
    await db.refresh(session)

    return PlanSummary(
        session_id=session.session_id,
        name=session.name or "",
        total_budget=session.total_budget,
        total_schools=len(session.results),
        created_at=session.created_at,
    )


@router.delete("/{session_id}", status_code=204)
async def delete_plan(
    session_id: str,
    _user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CalculationSession).where(
            CalculationSession.session_id == session_id
        )
    )
    session = result.scalar_one_or_none()
    if not session or not session.is_saved:
        raise HTTPException(status_code=404, detail="Plan not found")

    await db.delete(session)
    await db.commit()
