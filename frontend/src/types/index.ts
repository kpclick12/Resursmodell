export interface SchoolInput {
  school_name: string;
  school_type: "kommunal" | "fristående";
  num_students: number;
  socioeconomic_index: number;
  district?: string | null;
}

export interface CalculationParameters {
  base_amount_per_pupil: number;
  municipal_supplement: number;
  socioeconomic_weight: number;
  max_socioeconomic_supplement: number;
  index_scale: number;
}

export interface SchoolResult {
  school_name: string;
  school_type: string;
  num_students: number;
  socioeconomic_index: number;
  district?: string | null;
  socioeconomic_addition_per_pupil: number;
  total_per_pupil: number;
  total_allocation: number;
}

export interface SummaryResult {
  total_budget: number;
  total_schools: number;
  kommunal_schools: number;
  fristaende_schools: number;
  total_pupils: number;
  kommunal_pupils: number;
  fristaende_pupils: number;
  avg_per_pupil_overall: number;
  avg_per_pupil_kommunal: number;
  avg_per_pupil_fristaende: number;
  min_allocation: number;
  max_allocation: number;
  fristaende_budget_share: number;
  socioeconomic_total: number;
  socioeconomic_share: number;
}

export interface CalculateResponse {
  session_id: string;
  summary: SummaryResult;
  schools: SchoolResult[];
}

export interface PlanSummary {
  session_id: string;
  name: string;
  total_budget: number;
  total_schools: number;
  created_at: string;
}

export interface PlanDetail {
  session_id: string;
  name: string;
  parameters: CalculationParameters;
  summary: SummaryResult;
  schools: SchoolResult[];
  created_at: string;
}
