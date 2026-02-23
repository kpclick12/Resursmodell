import csv
import io
from fastapi import HTTPException

from app.models import SchoolInput

REQUIRED_COLUMNS = {
    "school_name",
    "school_type",
    "elever_f",
    "elever_ak1",
    "elever_ak2",
    "elever_ak3",
    "elever_ak4",
    "elever_ak5",
    "elever_ak6",
    "elever_ak7",
    "elever_ak8",
    "elever_ak9",
    "elever_fritids_6_9",
    "elever_fritids_10_12",
    "socioeconomic_index",
}
VALID_TYPES = {"kommunal", "fristående"}


def _parse_non_neg_int(value: str, field: str) -> int:
    try:
        n = int(value)
    except ValueError:
        raise ValueError(f"{field} must be an integer, got '{value}'")
    if n < 0:
        raise ValueError(f"{field} must be >= 0, got {n}")
    return n


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

            elever_f   = _parse_non_neg_int(row["elever_f"],   "elever_f")
            elever_ak1 = _parse_non_neg_int(row["elever_ak1"], "elever_ak1")
            elever_ak2 = _parse_non_neg_int(row["elever_ak2"], "elever_ak2")
            elever_ak3 = _parse_non_neg_int(row["elever_ak3"], "elever_ak3")
            elever_ak4 = _parse_non_neg_int(row["elever_ak4"], "elever_ak4")
            elever_ak5 = _parse_non_neg_int(row["elever_ak5"], "elever_ak5")
            elever_ak6 = _parse_non_neg_int(row["elever_ak6"], "elever_ak6")
            elever_ak7 = _parse_non_neg_int(row["elever_ak7"], "elever_ak7")
            elever_ak8 = _parse_non_neg_int(row["elever_ak8"], "elever_ak8")
            elever_ak9 = _parse_non_neg_int(row["elever_ak9"], "elever_ak9")
            elever_fritids_6_9   = _parse_non_neg_int(row["elever_fritids_6_9"],   "elever_fritids_6_9")
            elever_fritids_10_12 = _parse_non_neg_int(row["elever_fritids_10_12"], "elever_fritids_10_12")

            total = (
                elever_f + elever_ak1 + elever_ak2 + elever_ak3
                + elever_ak4 + elever_ak5 + elever_ak6
                + elever_ak7 + elever_ak8 + elever_ak9
                + elever_fritids_6_9 + elever_fritids_10_12
            )
            if total == 0:
                raise ValueError("at least one student count must be > 0")

            schools.append(
                SchoolInput(
                    school_name=row["school_name"],
                    school_type=school_type,
                    elever_f=elever_f,
                    elever_ak1=elever_ak1,
                    elever_ak2=elever_ak2,
                    elever_ak3=elever_ak3,
                    elever_ak4=elever_ak4,
                    elever_ak5=elever_ak5,
                    elever_ak6=elever_ak6,
                    elever_ak7=elever_ak7,
                    elever_ak8=elever_ak8,
                    elever_ak9=elever_ak9,
                    elever_fritids_6_9=elever_fritids_6_9,
                    elever_fritids_10_12=elever_fritids_10_12,
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
