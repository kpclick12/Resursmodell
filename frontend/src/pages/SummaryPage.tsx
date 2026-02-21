import { Link } from "react-router";
import { useDataStore } from "@/store/dataStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
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

function fmtSek(n: number): string {
  return `${fmt(n)} kr`;
}

export function SummaryPage() {
  const summary = useDataStore((s) => s.activeSummary());
  const results = useDataStore((s) => s.activeResults());

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

  const kommunalBudget = results
    .filter((r) => r.school_type === "kommunal")
    .reduce((sum, r) => sum + r.total_allocation, 0);
  const fristaendeBudget = results
    .filter((r) => r.school_type === "fristående")
    .reduce((sum, r) => sum + r.total_allocation, 0);

  const pieData = [
    { name: "Kommunala", value: kommunalBudget },
    { name: "Fristående", value: fristaendeBudget },
  ];

  const barData = [
    {
      name: "Totalt",
      amount: summary.avg_per_pupil_overall,
    },
    {
      name: "Kommunala",
      amount: summary.avg_per_pupil_kommunal,
    },
    {
      name: "Fristående",
      amount: summary.avg_per_pupil_fristaende,
    },
  ];

  const stats = [
    { label: "Total budget", value: fmtSek(summary.total_budget) },
    { label: "Antal skolor", value: `${summary.total_schools} (${summary.kommunal_schools} kommunala, ${summary.fristaende_schools} fristående)` },
    { label: "Totalt antal elever", value: `${fmt(summary.total_pupils)} (${fmt(summary.kommunal_pupils)} kommunala, ${fmt(summary.fristaende_pupils)} fristående)` },
    { label: "Genomsnitt per elev", value: fmtSek(summary.avg_per_pupil_overall) },
    { label: "Lägsta tilldelning", value: fmtSek(summary.min_allocation) },
    { label: "Högsta tilldelning", value: fmtSek(summary.max_allocation) },
    { label: "Fristående andel av budget", value: `${summary.fristaende_budget_share.toFixed(1)}%` },
    { label: "Socioekonomiskt tillägg totalt", value: `${fmtSek(summary.socioeconomic_total)} (${summary.socioeconomic_share.toFixed(1)}% av budget)` },
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

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <h3
              className="mb-4 text-lg"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Budget per skoltyp
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
                  formatter={(value: number) => fmtSek(value)}
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
              Genomsnitt per elev
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D4CCBD" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => fmtSek(value)} />
                <Legend />
                <Bar dataKey="amount" name="SEK/elev" fill="#2A9D8F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
