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
    elever_f: int = 0
    elever_ak1: int = 0
    elever_ak2: int = 0
    elever_ak3: int = 0
    elever_ak4: int = 0
    elever_ak5: int = 0
    elever_ak6: int = 0
    elever_ak7: int = 0
    elever_ak8: int = 0
    elever_ak9: int = 0
    elever_fritids_6_9: int = 0
    elever_fritids_10_12: int = 0
    socioeconomic_index: float
    district: str | None = None

    @property
    def total_school_students(self) -> int:
        return (
            self.elever_f + self.elever_ak1 + self.elever_ak2 + self.elever_ak3
            + self.elever_ak4 + self.elever_ak5 + self.elever_ak6
            + self.elever_ak7 + self.elever_ak8 + self.elever_ak9
        )

    @property
    def total_fritids_students(self) -> int:
        return self.elever_fritids_6_9 + self.elever_fritids_10_12


class CalculationParameters(BaseModel):
    total_budget: float                          # Total budget to distribute (tkr)
    budget_grundskola: float = 0.85             # Share of budget for grundskola
    budget_fritidshem: float = 0.15             # Share of budget for fritidshem
    andel_struktur_grundskola: float = 0.19     # Structural share for grundskola
    andel_struktur_fritidshem: float = 0.10     # Structural share for fritidshem
    avdrag_kommunal_procent: float = 0.48       # Local deduction for kommunal schools
    moms_kompensation: float = 0.06             # VAT compensation for fristående
    admin_kompensation_fri: float = 0.03        # Admin supplement for fristående
    # Year weights (grundskola)
    vikt_f: float = 1.000
    vikt_ak1: float = 1.000
    vikt_ak2: float = 1.180
    vikt_ak3: float = 1.310
    vikt_ak4: float = 1.260
    vikt_ak5: float = 1.290
    vikt_ak6: float = 1.350
    vikt_ak7: float = 1.420
    vikt_ak8: float = 1.430
    vikt_ak9: float = 1.430
    # Year weights (fritidshem)
    vikt_fritids_6_9: float = 1.000
    vikt_fritids_10_12: float = 0.340
    # Tillägg (tkr/elev, kommunala only, default 0)
    tillagg_skoladmin_per_elev: float = 0.0
    tillagg_likvärdig_grund_per_elev: float = 0.0
    tillagg_likvärdig_struktur_per_elev: float = 0.0
    tillagg_fritidsavgift_per_fritidsbarn: float = 0.0


class CalculateRequest(BaseModel):
    schools: list[SchoolInput]
    parameters: CalculationParameters


class SchoolResult(BaseModel):
    school_name: str
    school_type: str
    elever_f: int
    elever_ak1: int
    elever_ak2: int
    elever_ak3: int
    elever_ak4: int
    elever_ak5: int
    elever_ak6: int
    elever_ak7: int
    elever_ak8: int
    elever_ak9: int
    elever_fritids_6_9: int
    elever_fritids_10_12: int
    total_school_students: int
    total_fritids_students: int
    socioeconomic_index: float
    district: str | None = None
    # Allocation breakdown (tkr)
    grundersättning: float
    strukturersättning: float
    grundersättning_fritids: float
    strukturersättning_fritids: float
    grundbelopp_brutto: float
    lokalt_avdrag: float
    moms_tillagg: float
    admin_tillagg: float
    tillagg_totalt: float
    netto: float
    nettokvot: float | None = None   # kommunal only


class SummaryResult(BaseModel):
    total_budget: float
    total_schools: int
    kommunal_schools: int
    fristaende_schools: int
    total_pupils: int           # school pupils only
    kommunal_pupils: int
    fristaende_pupils: int
    avg_netto_per_pupil_overall: float
    avg_netto_per_pupil_kommunal: float
    avg_netto_per_pupil_fristaende: float
    min_allocation: float
    max_allocation: float
    fristaende_budget_share: float
    strukturersattning_total: float
    strukturersattning_share: float
    model_version: str = "v2"


class CalculateResponse(BaseModel):
    session_id: str = ""
    summary: SummaryResult
    schools: list[SchoolResult]
    model_version: str = "v2"


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
    model_version: str = "v2"
