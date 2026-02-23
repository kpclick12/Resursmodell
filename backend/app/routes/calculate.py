import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.db_models import CalculationSession, AllocationResult
from app.models import CalculateRequest, CalculateResponse
from app.services.calculator import calculate_allocation

router = APIRouter(prefix="/api", tags=["calculate"])


@router.post("/calculate", response_model=CalculateResponse)
async def calculate(
    body: CalculateRequest,
    _user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    response = calculate_allocation(body.schools, body.parameters)

    session_id = str(uuid.uuid4())
    p = body.parameters
    calc_session = CalculationSession(
        session_id=session_id,
        # Legacy columns written as 0 for backward compat
        base_amount_per_pupil=0,
        municipal_supplement=0,
        socioeconomic_weight=0,
        max_socioeconomic_supplement=0,
        index_scale=100,
        total_budget=p.total_budget,
        # v2 model discriminant
        model_version="v2",
        # v2 budget params
        total_budget_param=p.total_budget,
        budget_grundskola=p.budget_grundskola,
        budget_fritidshem=p.budget_fritidshem,
        andel_struktur_grundskola=p.andel_struktur_grundskola,
        andel_struktur_fritidshem=p.andel_struktur_fritidshem,
        avdrag_kommunal_procent=p.avdrag_kommunal_procent,
        moms_kompensation=p.moms_kompensation,
        admin_kompensation_fri=p.admin_kompensation_fri,
        # v2 weights
        vikt_f=p.vikt_f,
        vikt_ak1=p.vikt_ak1,
        vikt_ak2=p.vikt_ak2,
        vikt_ak3=p.vikt_ak3,
        vikt_ak4=p.vikt_ak4,
        vikt_ak5=p.vikt_ak5,
        vikt_ak6=p.vikt_ak6,
        vikt_ak7=p.vikt_ak7,
        vikt_ak8=p.vikt_ak8,
        vikt_ak9=p.vikt_ak9,
        vikt_fritids_6_9=p.vikt_fritids_6_9,
        vikt_fritids_10_12=p.vikt_fritids_10_12,
        # v2 tillägg
        tillagg_skoladmin_per_elev=p.tillagg_skoladmin_per_elev,
        tillagg_likvärdig_grund_per_elev=p.tillagg_likvärdig_grund_per_elev,
        tillagg_likvärdig_struktur_per_elev=p.tillagg_likvärdig_struktur_per_elev,
        tillagg_fritidsavgift_per_fritidsbarn=p.tillagg_fritidsavgift_per_fritidsbarn,
    )
    db.add(calc_session)
    await db.flush()

    for school in response.schools:
        db.add(
            AllocationResult(
                calc_session_id=calc_session.id,
                school_name=school.school_name,
                school_type=school.school_type,
                # Legacy columns
                num_students=0,
                socioeconomic_index=school.socioeconomic_index,
                district=school.district,
                socioeconomic_addition_per_pupil=0,
                total_per_pupil=0,
                total_allocation=school.netto,  # v1 compat: write netto to total_allocation
                # v2 individual year counts
                elever_f=school.elever_f,
                elever_ak1=school.elever_ak1,
                elever_ak2=school.elever_ak2,
                elever_ak3=school.elever_ak3,
                elever_ak4=school.elever_ak4,
                elever_ak5=school.elever_ak5,
                elever_ak6=school.elever_ak6,
                elever_ak7=school.elever_ak7,
                elever_ak8=school.elever_ak8,
                elever_ak9=school.elever_ak9,
                num_fritids_6_9=school.elever_fritids_6_9,
                num_fritids_10_12=school.elever_fritids_10_12,
                # v2 breakdown
                grundersattning=school.grundersättning,
                strukturersattning=school.strukturersättning,
                grundersattning_fritids=school.grundersättning_fritids,
                strukturersattning_fritids=school.strukturersättning_fritids,
                grundbelopp_brutto=school.grundbelopp_brutto,
                lokalt_avdrag=school.lokalt_avdrag,
                moms_tillagg=school.moms_tillagg,
                admin_tillagg=school.admin_tillagg,
                tillagg_totalt=school.tillagg_totalt,
                netto=school.netto,
                nettokvot=school.nettokvot,
            )
        )
    await db.commit()

    response.session_id = session_id
    return response
