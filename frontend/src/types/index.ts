export interface SchoolInput {
  school_name: string;
  school_type: "kommunal" | "fristående";
  num_fsk: number;
  num_ak1_3: number;
  num_ak4_6: number;
  num_ak7_9: number;
  num_fritids_6_9: number;
  num_fritids_10_12: number;
  socioeconomic_index: number;
  district?: string | null;
}

export interface CalculationParameters {
  g_fsk: number;
  g_ak13: number;
  g_ak46: number;
  g_ak79: number;
  g_fritids_69: number;
  g_fritids_1012: number;
  structural_share: number;
  index_scale: number;
}

export interface SchoolResult {
  school_name: string;
  school_type: string;
  num_fsk: number;
  num_ak1_3: number;
  num_ak4_6: number;
  num_ak7_9: number;
  num_fritids_6_9: number;
  num_fritids_10_12: number;
  total_school_students: number;
  total_fritids_students: number;
  socioeconomic_index: number;
  district?: string | null;
  per_pupil_fsk: number;
  per_pupil_ak1_3: number;
  per_pupil_ak4_6: number;
  per_pupil_ak7_9: number;
  per_pupil_fritids_6_9: number;
  per_pupil_fritids_10_12: number;
  total_school_allocation: number;
  total_fritids_allocation: number;
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
