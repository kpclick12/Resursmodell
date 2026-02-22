import datetime
from pydantic import BaseModel


class LoginRequest(BaseModel):
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SchoolInput(BaseModel):
    school_name: str
    school_type: str  # "kommunal" | "fristående"
    num_fsk: int = 0
    num_ak1_3: int = 0
    num_ak4_6: int = 0
    num_ak7_9: int = 0
    num_fritids_6_9: int = 0
    num_fritids_10_12: int = 0
    socioeconomic_index: float
    district: str | None = None

    @property
    def total_school_students(self) -> int:
        return self.num_fsk + self.num_ak1_3 + self.num_ak4_6 + self.num_ak7_9

    @property
    def total_fritids_students(self) -> int:
        return self.num_fritids_6_9 + self.num_fritids_10_12


class CalculationParameters(BaseModel):
    g_fsk: float = 49_500        # Förskoleklass grundbelopp
    g_ak13: float = 62_000       # ÅK1-3 grundbelopp
    g_ak46: float = 66_100       # ÅK4-6 grundbelopp
    g_ak79: float = 70_100       # ÅK7-9 grundbelopp
    g_fritids_69: float = 30_800   # Fritids age 6–9 grundbelopp
    g_fritids_1012: float = 9_900  # Fritids age 10–12 grundbelopp
    structural_share: float = 0.19  # 19% redistributed by socioeconomic index
    index_scale: float = 100.0      # index normalized to avg=100


class CalculateRequest(BaseModel):
    schools: list[SchoolInput]
    parameters: CalculationParameters


class SchoolResult(BaseModel):
    school_name: str
    school_type: str
    num_fsk: int
    num_ak1_3: int
    num_ak4_6: int
    num_ak7_9: int
    num_fritids_6_9: int
    num_fritids_10_12: int
    total_school_students: int
    total_fritids_students: int
    socioeconomic_index: float
    district: str | None = None
    per_pupil_fsk: float
    per_pupil_ak1_3: float
    per_pupil_ak4_6: float
    per_pupil_ak7_9: float
    per_pupil_fritids_6_9: float
    per_pupil_fritids_10_12: float
    total_school_allocation: float
    total_fritids_allocation: float
    total_allocation: float


class SummaryResult(BaseModel):
    total_budget: float
    total_schools: int
    kommunal_schools: int
    fristaende_schools: int
    total_pupils: int           # school pupils only (fsk+ak1_3+ak4_6+ak7_9)
    kommunal_pupils: int
    fristaende_pupils: int
    avg_per_pupil_overall: float   # total_school_alloc / total_school_pupils
    avg_per_pupil_kommunal: float
    avg_per_pupil_fristaende: float
    min_allocation: float
    max_allocation: float
    fristaende_budget_share: float
    socioeconomic_total: float     # structural (index-driven) portion of budget
    socioeconomic_share: float     # structural / total_budget × 100


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
