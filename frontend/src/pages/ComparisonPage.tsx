import { useState, useEffect, useMemo } from "react";
import { listPlans, getPlan } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { PlanSummary, PlanDetail, SchoolResult } from "@/types";
import { toast } from "sonner";

const COLORS = ["#1B2A4A", "#2A9D8F", "#E76F51", "#264653"];

function fmt(n: number): string {
  return new Intl.NumberFormat("sv-SE").format(Math.round(n));
}

function fmtSek(n: number): string {
  return `${fmt(n)} kr`;
}

/** Average school allocation per school pupil (fsk+ak1-3+ak4-6+ak7-9). */
function avgPerPupil(school: SchoolResult): number {
  if (school.total_school_students === 0) return 0;
  return school.total_school_allocation / school.total_school_students;
}

export function ComparisonPage() {
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadedPlans, setLoadedPlans] = useState<Map<string, PlanDetail>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listPlans().then(setPlans).catch(() => {});
  }, []);

  const togglePlan = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) {
        toast.error("Max 4 scenarier kan jämföras.");
        return prev;
      }
      return [...prev, id];
    });
  };

  useEffect(() => {
    const missing = selectedIds.filter((id) => !loadedPlans.has(id));
    if (missing.length === 0) return;

    setLoading(true);
    Promise.all(missing.map((id) => getPlan(id)))
      .then((details) => {
        setLoadedPlans((prev) => {
          const next = new Map(prev);
          for (const d of details) next.set(d.session_id, d);
          return next;
        });
      })
      .catch(() => toast.error("Kunde inte ladda scenarier."))
      .finally(() => setLoading(false));
  }, [selectedIds, loadedPlans]);

  const activePlans = useMemo(
    () => selectedIds.map((id) => loadedPlans.get(id)).filter(Boolean) as PlanDetail[],
    [selectedIds, loadedPlans]
  );

  // Summary comparison metrics
  const metrics = useMemo(() => {
    if (activePlans.length === 0) return [];
    return [
      { label: "Total budget", values: activePlans.map((p) => fmtSek(p.summary.total_budget)) },
      { label: "Antal skolor", values: activePlans.map((p) => String(p.summary.total_schools)) },
      { label: "Skolelever totalt", values: activePlans.map((p) => fmt(p.summary.total_pupils)) },
      { label: "Genomsnitt per elev", values: activePlans.map((p) => fmtSek(p.summary.avg_per_pupil_overall)) },
      { label: "Genomsnitt kommunal", values: activePlans.map((p) => fmtSek(p.summary.avg_per_pupil_kommunal)) },
      { label: "Genomsnitt fristående", values: activePlans.map((p) => fmtSek(p.summary.avg_per_pupil_fristaende)) },
      {
        label: "Kommunal–fristående gap",
        values: activePlans.map((p) =>
          fmtSek(p.summary.avg_per_pupil_kommunal - p.summary.avg_per_pupil_fristaende)
        ),
      },
      {
        label: "Strukturell andel",
        values: activePlans.map((p) => `${p.summary.socioeconomic_share.toFixed(1)}%`),
      },
    ];
  }, [activePlans]);

  // Grouped bar chart data
  const barChartData = useMemo(() => {
    return activePlans.map((p) => ({
      name: p.name,
      Kommunal: p.summary.avg_per_pupil_kommunal,
      Fristående: p.summary.avg_per_pupil_fristaende,
    }));
  }, [activePlans]);

  // Per-school delta (2 plans only) — compare total allocation
  const deltaRows = useMemo(() => {
    if (activePlans.length !== 2) return [];
    const [a, b] = activePlans;
    const bMap = new Map(b.schools.map((s) => [s.school_name, s]));
    return a.schools
      .map((sa) => {
        const sb = bMap.get(sa.school_name);
        if (!sb) return null;
        const a_per_pupil = avgPerPupil(sa);
        const b_per_pupil = avgPerPupil(sb);
        return {
          school_name: sa.school_name,
          a_total: sa.total_allocation,
          a_per_pupil,
          b_total: sb.total_allocation,
          b_per_pupil,
          diff_per_pupil: b_per_pupil - a_per_pupil,
        };
      })
      .filter(Boolean)
      .sort((a, b) => Math.abs(b!.diff_per_pupil) - Math.abs(a!.diff_per_pupil)) as {
      school_name: string;
      a_total: number;
      a_per_pupil: number;
      b_total: number;
      b_per_pupil: number;
      diff_per_pupil: number;
    }[];
  }, [activePlans]);

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-3xl tracking-tight text-primary"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Jämför scenarier
        </h1>
        <p className="mt-1 text-muted-foreground">
          Välj 2–4 sparade scenarier att jämföra.
        </p>
      </div>

      {/* Plan picker */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          <h3
            className="mb-3 text-lg"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Välj scenarier
          </h3>
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Inga sparade scenarier. Spara scenarier från sammanfattningssidan.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {plans.map((plan) => {
                const selected = selectedIds.includes(plan.session_id);
                return (
                  <Button
                    key={plan.session_id}
                    variant={selected ? "default" : "outline"}
                    size="sm"
                    onClick={() => togglePlan(plan.session_id)}
                  >
                    {plan.name}
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {loading && (
        <p className="text-sm text-muted-foreground">Laddar scenarier...</p>
      )}

      {activePlans.length >= 2 && (
        <>
          {/* Summary comparison table */}
          <Card className="border-border/60">
            <CardContent className="pt-6">
              <h3
                className="mb-4 text-lg"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Jämförelsetabell
              </h3>
              <div className="overflow-x-auto rounded-lg border border-border/60">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Nyckeltal</TableHead>
                      {activePlans.map((p) => (
                        <TableHead key={p.session_id} className="text-right">
                          {p.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.map((m) => (
                      <TableRow key={m.label} className="even:bg-muted/20">
                        <TableCell className="font-medium">{m.label}</TableCell>
                        {m.values.map((v, i) => (
                          <TableCell key={i} className="text-right">
                            {v}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Grouped bar chart */}
          <Card className="border-border/60">
            <CardContent className="pt-6">
              <h3
                className="mb-4 text-lg"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Genomsnitt per elev — kommunal vs fristående
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D4CCBD" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip formatter={(value: number) => fmtSek(value)} />
                  <Legend />
                  <Bar
                    dataKey="Kommunal"
                    fill={COLORS[0]}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Fristående"
                    fill={COLORS[1]}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Per-school delta (2 plans only) */}
          {deltaRows.length > 0 && (
            <Card className="border-border/60">
              <CardContent className="pt-6">
                <h3
                  className="mb-4 text-lg"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Skillnad per skola
                </h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  Jämförelse mellan {activePlans[0].name} och {activePlans[1].name}, sorterad efter störst skillnad.
                  Belopp per elev baserat på skolelever (exkl. fritids).
                </p>
                <div className="overflow-x-auto rounded-lg border border-border/60">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Skola</TableHead>
                        <TableHead className="text-right">
                          {activePlans[0].name} (kr/elev)
                        </TableHead>
                        <TableHead className="text-right">
                          {activePlans[1].name} (kr/elev)
                        </TableHead>
                        <TableHead className="text-right">Skillnad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deltaRows.map((row) => (
                        <TableRow
                          key={row.school_name}
                          className="even:bg-muted/20"
                        >
                          <TableCell className="font-medium">
                            {row.school_name}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmtSek(row.a_per_pupil)}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmtSek(row.b_per_pupil)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-semibold ${
                              row.diff_per_pupil > 0
                                ? "text-green-600"
                                : row.diff_per_pupil < 0
                                  ? "text-red-600"
                                  : ""
                            }`}
                          >
                            {row.diff_per_pupil > 0 ? "+" : ""}
                            {fmtSek(row.diff_per_pupil)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {activePlans.length === 1 && (
        <p className="text-sm text-muted-foreground">
          Välj minst ett scenario till för att jämföra.
        </p>
      )}
    </div>
  );
}
