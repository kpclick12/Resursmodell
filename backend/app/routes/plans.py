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


def _get_model_version(session: CalculationSession) -> str:
    return session.model_version or "v1"


def _session_to_parameters(session: CalculationSession) -> CalculationParameters:
    """Reconstruct CalculationParameters from a stored session."""
    version = _get_model_version(session)
    if version == "v2":
        return CalculationParameters(
            total_budget=session.total_budget_param or session.total_budget,
            budget_grundskola=session.budget_grundskola or 0.85,
            budget_fritidshem=session.budget_fritidshem or 0.15,
            andel_struktur_grundskola=session.andel_struktur_grundskola or 0.19,
            andel_struktur_fritidshem=session.andel_struktur_fritidshem or 0.10,
            avdrag_kommunal_procent=session.avdrag_kommunal_procent or 0.48,
            moms_kompensation=session.moms_kompensation or 0.06,
            admin_kompensation_fri=session.admin_kompensation_fri or 0.03,
            vikt_f=session.vikt_f or 1.000,
            vikt_ak1=session.vikt_ak1 or 1.000,
            vikt_ak2=session.vikt_ak2 or 1.180,
            vikt_ak3=session.vikt_ak3 or 1.310,
            vikt_ak4=session.vikt_ak4 or 1.260,
            vikt_ak5=session.vikt_ak5 or 1.290,
            vikt_ak6=session.vikt_ak6 or 1.350,
            vikt_ak7=session.vikt_ak7 or 1.420,
            vikt_ak8=session.vikt_ak8 or 1.430,
            vikt_ak9=session.vikt_ak9 or 1.430,
            vikt_fritids_6_9=session.vikt_fritids_6_9 or 1.000,
            vikt_fritids_10_12=session.vikt_fritids_10_12 or 0.340,
            tillagg_skoladmin_per_elev=session.tillagg_skoladmin_per_elev or 0.0,
            tillagg_likvärdig_grund_per_elev=session.tillagg_likvärdig_grund_per_elev or 0.0,
            tillagg_likvärdig_struktur_per_elev=session.tillagg_likvärdig_struktur_per_elev or 0.0,
            tillagg_fritidsavgift_per_fritidsbarn=session.tillagg_fritidsavgift_per_fritidsbarn or 0.0,
        )
    # v1 legacy session: return default v2 params (used only to satisfy type; not re-run)
    return CalculationParameters(total_budget=session.total_budget)


def _result_to_school_result(r: AllocationResult, model_version: str) -> SchoolResult:
    """Reconstruct SchoolResult from a stored AllocationResult row."""
    if model_version == "v2":
        return SchoolResult(
            school_name=r.school_name,
            school_type=r.school_type,
            elever_f=r.elever_f or 0,
            elever_ak1=r.elever_ak1 or 0,
            elever_ak2=r.elever_ak2 or 0,
            elever_ak3=r.elever_ak3 or 0,
            elever_ak4=r.elever_ak4 or 0,
            elever_ak5=r.elever_ak5 or 0,
            elever_ak6=r.elever_ak6 or 0,
            elever_ak7=r.elever_ak7 or 0,
            elever_ak8=r.elever_ak8 or 0,
            elever_ak9=r.elever_ak9 or 0,
            elever_fritids_6_9=r.num_fritids_6_9 or 0,
            elever_fritids_10_12=r.num_fritids_10_12 or 0,
            total_school_students=(
                (r.elever_f or 0) + (r.elever_ak1 or 0) + (r.elever_ak2 or 0)
                + (r.elever_ak3 or 0) + (r.elever_ak4 or 0) + (r.elever_ak5 or 0)
                + (r.elever_ak6 or 0) + (r.elever_ak7 or 0) + (r.elever_ak8 or 0)
                + (r.elever_ak9 or 0)
            ),
            total_fritids_students=(r.num_fritids_6_9 or 0) + (r.num_fritids_10_12 or 0),
            socioeconomic_index=r.socioeconomic_index,
            district=r.district,
            grundersättning=r.grundersattning or 0.0,
            strukturersättning=r.strukturersattning or 0.0,
            grundersättning_fritids=r.grundersattning_fritids or 0.0,
            strukturersättning_fritids=r.strukturersattning_fritids or 0.0,
            grundbelopp_brutto=r.grundbelopp_brutto or 0.0,
            lokalt_avdrag=r.lokalt_avdrag or 0.0,
            moms_tillagg=r.moms_tillagg or 0.0,
            admin_tillagg=r.admin_tillagg or 0.0,
            tillagg_totalt=r.tillagg_totalt or 0.0,
            netto=r.netto or r.total_allocation,
            nettokvot=r.nettokvot,
        )
    # v1 legacy: map old grouped counts and set all breakdown fields to 0
    num_fsk       = r.num_fsk or 0
    num_ak1_3     = r.num_ak1_3 or 0
    num_ak4_6     = r.num_ak4_6 or 0
    num_ak7_9     = r.num_ak7_9 or 0
    num_fritids_69   = r.num_fritids_6_9 or 0
    num_fritids_1012 = r.num_fritids_10_12 or 0
    school_students  = num_fsk + num_ak1_3 + num_ak4_6 + num_ak7_9
    fritids_students = num_fritids_69 + num_fritids_1012
    return SchoolResult(
        school_name=r.school_name,
        school_type=r.school_type,
        # Distribute v1 grouped counts into individual-year fields as best-effort
        elever_f=num_fsk,
        elever_ak1=num_ak1_3,
        elever_ak2=0,
        elever_ak3=0,
        elever_ak4=num_ak4_6,
        elever_ak5=0,
        elever_ak6=0,
        elever_ak7=num_ak7_9,
        elever_ak8=0,
        elever_ak9=0,
        elever_fritids_6_9=num_fritids_69,
        elever_fritids_10_12=num_fritids_1012,
        total_school_students=school_students,
        total_fritids_students=fritids_students,
        socioeconomic_index=r.socioeconomic_index,
        district=r.district,
        grundersättning=0.0,
        strukturersättning=0.0,
        grundersättning_fritids=0.0,
        strukturersättning_fritids=0.0,
        grundbelopp_brutto=0.0,
        lokalt_avdrag=0.0,
        moms_tillagg=0.0,
        admin_tillagg=0.0,
        tillagg_totalt=0.0,
        netto=r.total_allocation,
        nettokvot=None,
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

    version = _get_model_version(session)
    parameters = _session_to_parameters(session)
    school_results = [_result_to_school_result(r, version) for r in session.results]
    summary = _build_summary(school_results, parameters)
    # Preserve the actual model_version in the summary
    summary = summary.model_copy(update={"model_version": version})

    return PlanDetail(
        session_id=session.session_id,
        name=session.name or "",
        parameters=parameters,
        summary=summary,
        schools=school_results,
        created_at=session.created_at,
        model_version=version,
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
