import { Link } from "react-router";
import { useDataStore } from "@/store/dataStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertCircle } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { PlanSelector } from "@/components/plans/PlanSelector";
import { SavePlanDialog } from "@/components/plans/SavePlanDialog";

const COLORS = ["#1B2A4A", "#2A9D8F"];

function fmt(n: number): string {
  return new Intl.NumberFormat("sv-SE").format(Math.round(n));
}

function fmtTkr(n: number): string {
  return `${new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n)} tkr`;
}

function fmtMkr(n: number): string {
  return `${new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n / 1_000)} Mkr`;
}

export function SummaryPage() {
  const summary = useDataStore((s) => s.activeSummary());
  const results = useDataStore((s) => s.activeResults());
  const modelVersion = useDataStore((s) => s.activeModelVersion());
  const isV1 = modelVersion === "v1";

  if (!summary || !results) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg text-muted-foreground">
          Inga beräkningsresultat ännu.
        </p>
        <Link to="/parameters">
          <Button variant="outline" className="mt-4 gap-2">
            Gå till parametrar
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      </div>
    );
  }

  const kommunalNetto = results
    .filter((r) => r.school_type === "kommunal")
    .reduce((sum, r) => sum + r.netto, 0);
  const fristaendeNetto = results
    .filter((r) => r.school_type === "fristående")
    .reduce((sum, r) => sum + r.netto, 0);

  // Year-group pupil breakdown across all schools
  const totalF     = results.reduce((s, r) => s + r.elever_f, 0);
  const totalAk1   = results.reduce((s, r) => s + r.elever_ak1, 0);
  const totalAk2   = results.reduce((s, r) => s + r.elever_ak2, 0);
  const totalAk3   = results.reduce((s, r) => s + r.elever_ak3, 0);
  const totalAk4   = results.reduce((s, r) => s + r.elever_ak4, 0);
  const totalAk5   = results.reduce((s, r) => s + r.elever_ak5, 0);
  const totalAk6   = results.reduce((s, r) => s + r.elever_ak6, 0);
  const totalAk7   = results.reduce((s, r) => s + r.elever_ak7, 0);
  const totalAk8   = results.reduce((s, r) => s + r.elever_ak8, 0);
  const totalAk9   = results.reduce((s, r) => s + r.elever_ak9, 0);
  const totalF69   = results.reduce((s, r) => s + r.elever_fritids_6_9, 0);
  const totalF1012 = results.reduce((s, r) => s + r.elever_fritids_10_12, 0);

  const pieData = [
    { name: "Kommunala", value: kommunalNetto },
    { name: "Fristående", value: fristaendeNetto },
  ];

  const barData = [
    { name: "Totalt", amount: summary.avg_netto_per_pupil_overall },
    { name: "Kommunala", amount: summary.avg_netto_per_pupil_kommunal },
    { name: "Fristående", amount: summary.avg_netto_per_pupil_fristaende },
  ];

  const stats = [
    { label: "Total budget", value: fmtMkr(summary.total_budget) },
    {
      label: "Antal skolor",
      value: `${summary.total_schools} (${summary.kommunal_schools} kommunala, ${summary.fristaende_schools} fristående)`,
    },
    {
      label: "Skolelever totalt",
      value: `${fmt(summary.total_pupils)} (${fmt(summary.kommunal_pupils)} kommunala, ${fmt(summary.fristaende_pupils)} fristående)`,
    },
    { label: "Genomsnitt netto per elev (skola)", value: fmtTkr(summary.avg_netto_per_pupil_overall) },
    { label: "Lägsta nettotilldelning", value: fmtTkr(summary.min_allocation) },
    { label: "Högsta nettotilldelning", value: fmtTkr(summary.max_allocation) },
    {
      label: "Fristående andel av netto",
      value: `${summary.fristaende_budget_share.toFixed(1)}%`,
    },
    {
      label: "Strukturersättning totalt",
      value: `${fmtMkr(summary.strukturersattning_total)} (${summary.strukturersattning_share.toFixed(1)}% av budget)`,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-3xl tracking-tight text-primary"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Sammanfattning
        </h1>
        <p className="mt-1 text-muted-foreground">
          Översikt av resursfördelningen.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <PlanSelector />
        <SavePlanDialog />
      </div>

      {isV1 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-400">
          <AlertCircle className="size-4 shrink-0" />
          Sparad med gamla modellen — budgetfördelning och tilldelningsdetaljer visas ej.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="pt-6">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Year-group pupil breakdown */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          <h3
            className="mb-4 text-lg"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Elever per åldersgrupp
          </h3>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-12">
            {[
              { label: "FSK", value: totalF },
              { label: "Åk1", value: totalAk1 },
              { label: "Åk2", value: totalAk2 },
              { label: "Åk3", value: totalAk3 },
              { label: "Åk4", value: totalAk4 },
              { label: "Åk5", value: totalAk5 },
              { label: "Åk6", value: totalAk6 },
              { label: "Åk7", value: totalAk7 },
              { label: "Åk8", value: totalAk8 },
              { label: "Åk9", value: totalAk9 },
              { label: "F 6-9", value: totalF69 },
              { label: "F 10-12", value: totalF1012 },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-muted/40 p-3 text-center">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="mt-1 text-base font-semibold text-foreground">{fmt(value)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <h3
              className="mb-4 text-lg"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Nettobudget per skoltyp
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => fmtTkr(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <h3
              className="mb-4 text-lg"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Genomsnitt netto per elev (skola)
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D4CCBD" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v.toFixed(0)} tkr`} />
                <Tooltip formatter={(value: number) => fmtTkr(value)} />
                <Legend />
                <Bar dataKey="amount" name="tkr/elev" fill="#2A9D8F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
