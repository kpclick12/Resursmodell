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
    calc_session = CalculationSession(
        session_id=session_id,
        base_amount_per_pupil=body.parameters.base_amount_per_pupil,
        municipal_supplement=body.parameters.municipal_supplement,
        socioeconomic_weight=body.parameters.socioeconomic_weight,
        max_socioeconomic_supplement=body.parameters.max_socioeconomic_supplement,
        index_scale=body.parameters.index_scale,
        total_budget=response.summary.total_budget,
    )
    db.add(calc_session)
    await db.flush()

    for school in response.schools:
        db.add(
            AllocationResult(
                calc_session_id=calc_session.id,
                school_name=school.school_name,
                school_type=school.school_type,
                num_students=school.num_students,
                socioeconomic_index=school.socioeconomic_index,
                district=school.district,
                socioeconomic_addition_per_pupil=school.socioeconomic_addition_per_pupil,
                total_per_pupil=school.total_per_pupil,
                total_allocation=school.total_allocation,
            )
        )
    await db.commit()

    response.session_id = session_id
    return response
