import { create } from "zustand";
import type {
  SchoolInput,
  CalculationParameters,
  SchoolResult,
  SummaryResult,
} from "@/types";

interface DataState {
  schools: SchoolInput[];
  parameters: CalculationParameters;
  results: SchoolResult[] | null;
  summary: SummaryResult | null;
  latestSessionId: string | null;

  // Selected saved plan
  selectedPlanId: string | null;
  selectedPlanResults: SchoolResult[] | null;
  selectedPlanSummary: SummaryResult | null;
  selectedPlanName: string | null;
  selectedPlanModelVersion: string | null;

  setSchools: (schools: SchoolInput[]) => void;
  setParameters: (params: Partial<CalculationParameters>) => void;
  setResults: (results: SchoolResult[], summary: SummaryResult, sessionId: string) => void;
  clearResults: () => void;
  setSelectedPlan: (
    id: string | null,
    results?: SchoolResult[] | null,
    summary?: SummaryResult | null,
    name?: string | null,
    modelVersion?: string | null
  ) => void;
  clearSelectedPlan: () => void;

  // Computed-like accessors
  activeResults: () => SchoolResult[] | null;
  activeSummary: () => SummaryResult | null;
  activeModelVersion: () => string;
}

export const DEFAULT_PARAMETERS: CalculationParameters = {
  total_budget: 0,
  budget_grundskola: 0.85,
  budget_fritidshem: 0.15,
  andel_struktur_grundskola: 0.19,
  andel_struktur_fritidshem: 0.10,
  avdrag_kommunal_procent: 0.48,
  moms_kompensation: 0.06,
  admin_kompensation_fri: 0.03,
  vikt_f: 1.000,
  vikt_ak1: 1.000,
  vikt_ak2: 1.180,
  vikt_ak3: 1.310,
  vikt_ak4: 1.260,
  vikt_ak5: 1.290,
  vikt_ak6: 1.350,
  vikt_ak7: 1.420,
  vikt_ak8: 1.430,
  vikt_ak9: 1.430,
  vikt_fritids_6_9: 1.000,
  vikt_fritids_10_12: 0.340,
  tillagg_skoladmin_per_elev: 0,
  "tillagg_likvärdig_grund_per_elev": 0,
  "tillagg_likvärdig_struktur_per_elev": 0,
  tillagg_fritidsavgift_per_fritidsbarn: 0,
};

export const useDataStore = create<DataState>((set, get) => ({
  schools: [],
  parameters: { ...DEFAULT_PARAMETERS },
  results: null,
  summary: null,
  latestSessionId: null,

  selectedPlanId: null,
  selectedPlanResults: null,
  selectedPlanSummary: null,
  selectedPlanName: null,
  selectedPlanModelVersion: null,

  setSchools: (schools) => set({ schools }),

  setParameters: (params) =>
    set({ parameters: { ...get().parameters, ...params } }),

  setResults: (results, summary, sessionId) =>
    set({ results, summary, latestSessionId: sessionId }),

  clearResults: () =>
    set({ results: null, summary: null, latestSessionId: null }),

  setSelectedPlan: (id, results = null, summary = null, name = null, modelVersion = null) =>
    set({
      selectedPlanId: id,
      selectedPlanResults: results,
      selectedPlanSummary: summary,
      selectedPlanName: name,
      selectedPlanModelVersion: modelVersion,
    }),

  clearSelectedPlan: () =>
    set({
      selectedPlanId: null,
      selectedPlanResults: null,
      selectedPlanSummary: null,
      selectedPlanName: null,
      selectedPlanModelVersion: null,
    }),

  activeResults: () => {
    const state = get();
    return state.selectedPlanId ? state.selectedPlanResults : state.results;
  },

  activeSummary: () => {
    const state = get();
    return state.selectedPlanId ? state.selectedPlanSummary : state.summary;
  },

  activeModelVersion: () => {
    const state = get();
    if (state.selectedPlanId) {
      return state.selectedPlanModelVersion || "v2";
    }
    return state.summary?.model_version || "v2";
  },
}));
