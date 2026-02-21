import datetime
from pydantic import BaseModel


class LoginRequest(BaseModel):
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SchoolInput(BaseModel):
    school_name: str
    school_type: str  # "kommunal" or "fristående"
    num_students: int
    socioeconomic_index: float
    district: str | None = None


class CalculationParameters(BaseModel):
    base_amount_per_pupil: float = 85000
    municipal_supplement: float = 0
    socioeconomic_weight: float = 0.3
    max_socioeconomic_supplement: float = 15000
    index_scale: float = 100


class CalculateRequest(BaseModel):
    schools: list[SchoolInput]
    parameters: CalculationParameters


class SchoolResult(BaseModel):
    school_name: str
    school_type: str
    num_students: int
    socioeconomic_index: float
    district: str | None = None
    socioeconomic_addition_per_pupil: float
    total_per_pupil: float
    total_allocation: float


class SummaryResult(BaseModel):
    total_budget: float
    total_schools: int
    kommunal_schools: int
    fristaende_schools: int
    total_pupils: int
    kommunal_pupils: int
    fristaende_pupils: int
    avg_per_pupil_overall: float
    avg_per_pupil_kommunal: float
    avg_per_pupil_fristaende: float
    min_allocation: float
    max_allocation: float
    fristaende_budget_share: float
    socioeconomic_total: float
    socioeconomic_share: float


class CalculateResponse(BaseModel):
    session_id: str = ""
    summary: SummaryResult
    schools: list[SchoolResult]


class SavePlanRequest(BaseModel):
    session_id: str
    name: str


class RenamePlanRequest(BaseModel):
    name: str


class PlanSummary(BaseModel):
    session_id: str
    name: str
    total_budget: float
    total_schools: int
    created_at: datetime.datetime


class PlanDetail(BaseModel):
    session_id: str
    name: str
    parameters: CalculationParameters
    summary: SummaryResult
    schools: list[SchoolResult]
    created_at: datetime.datetime
