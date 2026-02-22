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
        # Legacy columns written as 0 for new-format sessions
        base_amount_per_pupil=0,
        municipal_supplement=0,
        socioeconomic_weight=0,
        max_socioeconomic_supplement=0,
        index_scale=p.index_scale,
        total_budget=response.summary.total_budget,
        # New parameter columns
        g_fsk=p.g_fsk,
        g_ak13=p.g_ak13,
        g_ak46=p.g_ak46,
        g_ak79=p.g_ak79,
        g_fritids_69=p.g_fritids_69,
        g_fritids_1012=p.g_fritids_1012,
        structural_share=p.structural_share,
        new_index_scale=p.index_scale,
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
                total_allocation=school.total_allocation,
                # New year-group student counts
                num_fsk=school.num_fsk,
                num_ak1_3=school.num_ak1_3,
                num_ak4_6=school.num_ak4_6,
                num_ak7_9=school.num_ak7_9,
                num_fritids_6_9=school.num_fritids_6_9,
                num_fritids_10_12=school.num_fritids_10_12,
                # New per-pupil amounts
                per_pupil_fsk=school.per_pupil_fsk,
                per_pupil_ak1_3=school.per_pupil_ak1_3,
                per_pupil_ak4_6=school.per_pupil_ak4_6,
                per_pupil_ak7_9=school.per_pupil_ak7_9,
                per_pupil_fritids_6_9=school.per_pupil_fritids_6_9,
                per_pupil_fritids_10_12=school.per_pupil_fritids_10_12,
                # New allocation breakdown
                total_school_allocation=school.total_school_allocation,
                total_fritids_allocation=school.total_fritids_allocation,
            )
        )
    await db.commit()

    response.session_id = session_id
    return response
