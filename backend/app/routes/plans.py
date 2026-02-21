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

    # Count results for total_schools
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

    school_results = [
        SchoolResult(
            school_name=r.school_name,
            school_type=r.school_type,
            num_students=r.num_students,
            socioeconomic_index=r.socioeconomic_index,
            district=r.district,
            socioeconomic_addition_per_pupil=r.socioeconomic_addition_per_pupil,
            total_per_pupil=r.total_per_pupil,
            total_allocation=r.total_allocation,
        )
        for r in session.results
    ]

    summary = _build_summary(school_results)
    parameters = CalculationParameters(
        base_amount_per_pupil=session.base_amount_per_pupil,
        municipal_supplement=session.municipal_supplement,
        socioeconomic_weight=session.socioeconomic_weight,
        max_socioeconomic_supplement=session.max_socioeconomic_supplement,
        index_scale=session.index_scale,
    )

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
