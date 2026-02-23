export interface SchoolInput {
  school_name: string;
  school_type: "kommunal" | "fristående";
  elever_f: number;
  elever_ak1: number;
  elever_ak2: number;
  elever_ak3: number;
  elever_ak4: number;
  elever_ak5: number;
  elever_ak6: number;
  elever_ak7: number;
  elever_ak8: number;
  elever_ak9: number;
  elever_fritids_6_9: number;
  elever_fritids_10_12: number;
  socioeconomic_index: number;
  district?: string | null;
}

export interface CalculationParameters {
  total_budget: number;
  budget_grundskola: number;
  budget_fritidshem: number;
  andel_struktur_grundskola: number;
  andel_struktur_fritidshem: number;
  avdrag_kommunal_procent: number;
  moms_kompensation: number;
  admin_kompensation_fri: number;
  // Year weights
  vikt_f: number;
  vikt_ak1: number;
  vikt_ak2: number;
  vikt_ak3: number;
  vikt_ak4: number;
  vikt_ak5: number;
  vikt_ak6: number;
  vikt_ak7: number;
  vikt_ak8: number;
  vikt_ak9: number;
  vikt_fritids_6_9: number;
  vikt_fritids_10_12: number;
  // Tillägg (tkr/elev)
  tillagg_skoladmin_per_elev: number;
  "tillagg_likvärdig_grund_per_elev": number;
  "tillagg_likvärdig_struktur_per_elev": number;
  tillagg_fritidsavgift_per_fritidsbarn: number;
}

export interface SchoolResult {
  school_name: string;
  school_type: string;
  elever_f: number;
  elever_ak1: number;
  elever_ak2: number;
  elever_ak3: number;
  elever_ak4: number;
  elever_ak5: number;
  elever_ak6: number;
  elever_ak7: number;
  elever_ak8: number;
  elever_ak9: number;
  elever_fritids_6_9: number;
  elever_fritids_10_12: number;
  total_school_students: number;
  total_fritids_students: number;
  socioeconomic_index: number;
  district?: string | null;
  // Allocation breakdown (tkr)
  "grundersättning": number;
  "strukturersättning": number;
  "grundersättning_fritids": number;
  "strukturersättning_fritids": number;
  grundbelopp_brutto: number;
  lokalt_avdrag: number;
  moms_tillagg: number;
  admin_tillagg: number;
  tillagg_totalt: number;
  netto: number;
  nettokvot?: number | null;
}

export interface SummaryResult {
  total_budget: number;
  total_schools: number;
  kommunal_schools: number;
  fristaende_schools: number;
  total_pupils: number;
  kommunal_pupils: number;
  fristaende_pupils: number;
  avg_netto_per_pupil_overall: number;
  avg_netto_per_pupil_kommunal: number;
  avg_netto_per_pupil_fristaende: number;
  min_allocation: number;
  max_allocation: number;
  fristaende_budget_share: number;
  strukturersattning_total: number;
  strukturersattning_share: number;
  model_version: string;
}

export interface CalculateResponse {
  session_id: string;
  summary: SummaryResult;
  schools: SchoolResult[];
  model_version: string;
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
  model_version: string;
}
