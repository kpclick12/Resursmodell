import uuid
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.db_models import SchoolRecord
from app.services.csv_parser import parse_csv

router = APIRouter(prefix="/api", tags=["upload"])


@router.post("/upload")
async def upload_csv(
    file: UploadFile = File(...),
    _user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    content = await file.read()
    text = content.decode("utf-8-sig")
    schools = parse_csv(text)

    session_id = str(uuid.uuid4())
    for school in schools:
        db.add(
            SchoolRecord(
                session_id=session_id,
                school_name=school.school_name,
                school_type=school.school_type,
                num_students=0,  # legacy column, kept for compat
                socioeconomic_index=school.socioeconomic_index,
                district=school.district,
                num_fsk=school.num_fsk,
                num_ak1_3=school.num_ak1_3,
                num_ak4_6=school.num_ak4_6,
                num_ak7_9=school.num_ak7_9,
                num_fritids_6_9=school.num_fritids_6_9,
                num_fritids_10_12=school.num_fritids_10_12,
            )
        )
    await db.commit()

    return {
        "session_id": session_id,
        "count": len(schools),
        "schools": [s.model_dump() for s in schools],
    }
