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

  setSchools: (schools: SchoolInput[]) => void;
  setParameters: (params: Partial<CalculationParameters>) => void;
  setResults: (results: SchoolResult[], summary: SummaryResult, sessionId: string) => void;
  clearResults: () => void;
  setSelectedPlan: (
    id: string | null,
    results?: SchoolResult[] | null,
    summary?: SummaryResult | null,
    name?: string | null
  ) => void;
  clearSelectedPlan: () => void;

  // Computed-like accessors
  activeResults: () => SchoolResult[] | null;
  activeSummary: () => SummaryResult | null;
}

export const useDataStore = create<DataState>((set, get) => ({
  schools: [],
  parameters: {
    base_amount_per_pupil: 85000,
    municipal_supplement: 0,
    socioeconomic_weight: 0.3,
    max_socioeconomic_supplement: 15000,
    index_scale: 100,
  },
  results: null,
  summary: null,
  latestSessionId: null,

  selectedPlanId: null,
  selectedPlanResults: null,
  selectedPlanSummary: null,
  selectedPlanName: null,

  setSchools: (schools) => set({ schools }),

  setParameters: (params) =>
    set({ parameters: { ...get().parameters, ...params } }),

  setResults: (results, summary, sessionId) =>
    set({ results, summary, latestSessionId: sessionId }),

  clearResults: () =>
    set({ results: null, summary: null, latestSessionId: null }),

  setSelectedPlan: (id, results = null, summary = null, name = null) =>
    set({
      selectedPlanId: id,
      selectedPlanResults: results,
      selectedPlanSummary: summary,
      selectedPlanName: name,
    }),

  clearSelectedPlan: () =>
    set({
      selectedPlanId: null,
      selectedPlanResults: null,
      selectedPlanSummary: null,
      selectedPlanName: null,
    }),

  activeResults: () => {
    const state = get();
    return state.selectedPlanId ? state.selectedPlanResults : state.results;
  },

  activeSummary: () => {
    const state = get();
    return state.selectedPlanId ? state.selectedPlanSummary : state.summary;
  },
}));
