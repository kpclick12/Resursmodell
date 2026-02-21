import { useState, useMemo } from "react";
import { Link } from "react-router";
import { useDataStore } from "@/store/dataStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRight, Download, ArrowUpDown } from "lucide-react";
import type { SchoolResult } from "@/types";
import { PlanSelector } from "@/components/plans/PlanSelector";

function fmt(n: number): string {
  return new Intl.NumberFormat("sv-SE").format(Math.round(n));
}

type SortKey = keyof SchoolResult;
type SortDir = "asc" | "desc";

function SchoolTable({
  title,
  schools,
  filenamePrefix,
}: {
  title: string;
  schools: SchoolResult[];
  filenamePrefix: string;
}) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("school_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return schools.filter(
      (s) =>
        s.school_name.toLowerCase().includes(term) ||
        (s.district && s.district.toLowerCase().includes(term))
    );
  }, [schools, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey] ?? "";
      const bVal = b[sortKey] ?? "";
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal), "sv")
        : String(bVal).localeCompare(String(aVal), "sv");
    });
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const exportCsv = () => {
    const headers = [
      "Skolnamn",
      "Stadsdel",
      "Elever",
      "Socioekonomiskt index",
      "Socioekon. tillägg/elev",
      "Total/elev",
      "Total tilldelning",
    ];
    const rows = sorted.map((s) => [
      s.school_name,
      s.district || "",
      s.num_students,
      s.socioeconomic_index,
      s.socioeconomic_addition_per_pupil,
      s.total_per_pupil,
      s.total_allocation,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `${filenamePrefix}_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortableHead = ({
    label,
    field,
    className,
  }: {
    label: string;
    field: SortKey;
    className?: string;
  }) => (
    <TableHead
      className={`cursor-pointer select-none ${className || ""}`}
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className="size-3 text-muted-foreground" />
      </span>
    </TableHead>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2
          className="text-xl text-primary"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Sök skola eller stadsdel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            className="gap-1"
          >
            <Download className="size-3.5" />
            CSV
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border/60">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <SortableHead label="Skolnamn" field="school_name" />
              <SortableHead label="Stadsdel" field="district" />
              <SortableHead
                label="Elever"
                field="num_students"
                className="text-right"
              />
              <SortableHead
                label="Index"
                field="socioeconomic_index"
                className="text-right"
              />
              <SortableHead
                label="Socioekon. tillägg"
                field="socioeconomic_addition_per_pupil"
                className="text-right"
              />
              <SortableHead
                label="Total/elev"
                field="total_per_pupil"
                className="text-right"
              />
              <SortableHead
                label="Total tilldelning"
                field="total_allocation"
                className="text-right"
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((s, i) => (
              <TableRow key={i} className="even:bg-muted/20">
                <TableCell className="font-medium">{s.school_name}</TableCell>
                <TableCell>{s.district || "—"}</TableCell>
                <TableCell className="text-right">{fmt(s.num_students)}</TableCell>
                <TableCell className="text-right">
                  {s.socioeconomic_index}
                </TableCell>
                <TableCell className="text-right">
                  {fmt(s.socioeconomic_addition_per_pupil)} kr
                </TableCell>
                <TableCell className="text-right">
                  {fmt(s.total_per_pupil)} kr
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {fmt(s.total_allocation)} kr
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Visar {sorted.length} av {schools.length} skolor
      </p>
    </div>
  );
}

export function TablesPage() {
  const results = useDataStore((s) => s.activeResults());

  if (!results) {
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

  const kommunal = results.filter((r) => r.school_type === "kommunal");
  const fristaende = results.filter((r) => r.school_type === "fristående");

  return (
    <div className="space-y-12">
      <div>
        <h1
          className="text-3xl tracking-tight text-primary"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Skoltabeller
        </h1>
        <p className="mt-1 text-muted-foreground">
          Detaljerad tilldelning per skola.
        </p>
      </div>

      <PlanSelector />

      <SchoolTable
        title="Kommunala skolor"
        schools={kommunal}
        filenamePrefix="kommunala_skolor"
      />

      <SchoolTable
        title="Fristående skolor"
        schools={fristaende}
        filenamePrefix="fristaende_skolor"
      />
    </div>
  );
}
