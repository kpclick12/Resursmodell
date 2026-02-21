import csv
import io
from fastapi import HTTPException

from app.models import SchoolInput

REQUIRED_COLUMNS = {"school_name", "school_type", "num_students", "socioeconomic_index"}
VALID_TYPES = {"kommunal", "fristående"}


def parse_csv(content: str) -> list[SchoolInput]:
    reader = csv.DictReader(io.StringIO(content))

    if reader.fieldnames is None:
        raise HTTPException(status_code=400, detail="CSV file is empty or has no headers")

    columns = {c.strip().lower() for c in reader.fieldnames}
    missing = REQUIRED_COLUMNS - columns
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {', '.join(sorted(missing))}",
        )

    schools: list[SchoolInput] = []
    for i, row in enumerate(reader, start=2):
        row = {k.strip().lower(): v.strip() for k, v in row.items()}
        try:
            school_type = row["school_type"].lower()
            if school_type not in VALID_TYPES:
                raise ValueError(
                    f"school_type must be 'kommunal' or 'fristående', got '{school_type}'"
                )
            schools.append(
                SchoolInput(
                    school_name=row["school_name"],
                    school_type=school_type,
                    num_students=int(row["num_students"]),
                    socioeconomic_index=float(row["socioeconomic_index"]),
                    district=row.get("district") or None,
                )
            )
        except (ValueError, KeyError) as e:
            raise HTTPException(
                status_code=400,
                detail=f"Row {i}: {e}",
            )

    if not schools:
        raise HTTPException(status_code=400, detail="CSV contains no data rows")

    return schools
