import { useState, useEffect } from "react";
import { useDataStore } from "@/store/dataStore";
import { savePlan, listPlans } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Save } from "lucide-react";
import { toast } from "sonner";

export function SavePlanDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const latestSessionId = useDataStore((s) => s.latestSessionId);
  const selectedPlanId = useDataStore((s) => s.selectedPlanId);

  const canSave = latestSessionId && !selectedPlanId;

  useEffect(() => {
    if (open) {
      // Auto-suggest name
      listPlans()
        .then((plans) => {
          const letter = String.fromCharCode(65 + plans.length); // A, B, C...
          const today = new Date().toISOString().slice(0, 10);
          setName(`Scenario ${letter} — ${today}`);
        })
        .catch(() => {
          const today = new Date().toISOString().slice(0, 10);
          setName(`Scenario A — ${today}`);
        });
    }
  }, [open]);

  const handleSave = async () => {
    if (!latestSessionId || !name.trim()) return;
    setSaving(true);
    try {
      await savePlan(latestSessionId, name.trim());
      toast.success("Scenario sparat!");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kunde inte spara scenariot.");
    } finally {
      setSaving(false);
    }
  };

  if (!canSave) return null;

  return (
    <>
      <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <Save className="size-4" />
        Spara scenario
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Spara scenario</DialogTitle>
            <DialogDescription>
              Ge scenariot ett namn för att kunna jämföra det senare.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="plan-name">Namn</Label>
            <Input
              id="plan-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? "Sparar..." : "Spara"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
