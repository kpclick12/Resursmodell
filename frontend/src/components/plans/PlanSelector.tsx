import { useState, useEffect, useRef } from "react";
import { useDataStore } from "@/store/dataStore";
import { listPlans, getPlan, renamePlan, deletePlan } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Pencil, Trash2, Check, X } from "lucide-react";
import type { PlanSummary } from "@/types";
import { toast } from "sonner";

export function PlanSelector() {
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedPlanId = useDataStore((s) => s.selectedPlanId);
  const selectedPlanName = useDataStore((s) => s.selectedPlanName);
  const setSelectedPlan = useDataStore((s) => s.setSelectedPlan);
  const clearSelectedPlan = useDataStore((s) => s.clearSelectedPlan);

  const fetchPlans = async () => {
    try {
      const data = await listPlans();
      setPlans(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setEditingId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = async (sessionId: string | null) => {
    if (sessionId === null) {
      clearSelectedPlan();
      setOpen(false);
      return;
    }
    try {
      const detail = await getPlan(sessionId);
      setSelectedPlan(sessionId, detail.schools, detail.summary, detail.name, detail.model_version);
      setOpen(false);
    } catch {
      toast.error("Kunde inte ladda scenariot.");
    }
  };

  const handleRename = async (sessionId: string) => {
    if (!editName.trim()) return;
    try {
      await renamePlan(sessionId, editName.trim());
      await fetchPlans();
      if (selectedPlanId === sessionId) {
        setSelectedPlan(selectedPlanId, useDataStore.getState().selectedPlanResults, useDataStore.getState().selectedPlanSummary, editName.trim(), useDataStore.getState().selectedPlanModelVersion);
      }
      setEditingId(null);
      toast.success("Scenario omdöpt.");
    } catch {
      toast.error("Kunde inte döpa om scenariot.");
    }
  };

  const handleDelete = async (sessionId: string) => {
    try {
      await deletePlan(sessionId);
      await fetchPlans();
      if (selectedPlanId === sessionId) {
        clearSelectedPlan();
      }
      toast.success("Scenario borttaget.");
    } catch {
      toast.error("Kunde inte ta bort scenariot.");
    }
  };

  const displayLabel = selectedPlanId ? selectedPlanName : "Senaste beräkning";

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        className="w-72 justify-between gap-2"
        onClick={() => { setOpen(!open); if (!open) fetchPlans(); }}
      >
        <span className="truncate text-left">{displayLabel}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </Button>

      {open && (
        <div className="absolute z-50 mt-1 w-80 rounded-md border border-border bg-card shadow-lg">
          <div className="max-h-64 overflow-y-auto p-1">
            <button
              className={`flex w-full items-center rounded px-3 py-2 text-sm transition-colors ${
                !selectedPlanId
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-muted"
              }`}
              onClick={() => handleSelect(null)}
            >
              Senaste beräkning
            </button>

            {plans.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                Inga sparade scenarier.
              </p>
            )}

            {plans.map((plan) => (
              <div
                key={plan.session_id}
                className={`group flex items-center gap-1 rounded px-3 py-2 text-sm transition-colors ${
                  selectedPlanId === plan.session_id
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {editingId === plan.session_id ? (
                  <div className="flex flex-1 items-center gap-1">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-7 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(plan.session_id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0"
                      onClick={() => handleRename(plan.session_id)}
                    >
                      <Check className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <button
                      className="flex-1 truncate text-left"
                      onClick={() => handleSelect(plan.session_id)}
                    >
                      {plan.name}
                    </button>
                    <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(plan.session_id);
                          setEditName(plan.name);
                        }}
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(plan.session_id);
                        }}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
