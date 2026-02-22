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

function fmtTkr(n: number): string {
  return new Intl.NumberFormat("sv-SE").format(Math.round(n / 1000));
}

type SortKey =
  | "school_name"
  | "district"
  | "socioeconomic_index"
  | "total_school_students"
  | "total_fritids_students"
  | "num_fsk"
  | "num_ak1_3"
  | "num_ak4_6"
  | "num_ak7_9"
  | "num_fritids_6_9"
  | "num_fritids_10_12"
  | "per_pupil_fsk"
  | "per_pupil_ak1_3"
  | "per_pupil_ak4_6"
  | "per_pupil_ak7_9"
  | "per_pupil_fritids_6_9"
  | "per_pupil_fritids_10_12"
  | "total_allocation";

type SortDir = "asc" | "desc";

function ZeroCell({ value }: { value: number }) {
  if (value === 0) {
    return <span className="text-muted-foreground/30">—</span>;
  }
  return <>{fmt(value)}</>;
}

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
      "Socioekonomiskt index",
      "FSK",
      "ÅK1-3",
      "ÅK4-6",
      "ÅK7-9",
      "Fritids 6-9",
      "Fritids 10-12",
      "Totalt antal skola",
      "Totalt antal fritids",
      "Per elev FSK (kr)",
      "Per elev ÅK1-3 (kr)",
      "Per elev ÅK4-6 (kr)",
      "Per elev ÅK7-9 (kr)",
      "Per elev F6-9 (kr)",
      "Per elev F10-12 (kr)",
      "Budget (tkr)",
    ];
    const rows = sorted.map((s) => [
      s.school_name,
      s.district || "",
      s.socioeconomic_index,
      s.num_fsk,
      s.num_ak1_3,
      s.num_ak4_6,
      s.num_ak7_9,
      s.num_fritids_6_9,
      s.num_fritids_10_12,
      s.total_school_students,
      s.total_fritids_students,
      s.per_pupil_fsk,
      s.per_pupil_ak1_3,
      s.per_pupil_ak4_6,
      s.per_pupil_ak7_9,
      s.per_pupil_fritids_6_9,
      s.per_pupil_fritids_10_12,
      Math.round(s.total_allocation / 1000),
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
      className={`cursor-pointer select-none whitespace-nowrap ${className || ""}`}
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className="size-3 shrink-0 text-muted-foreground" />
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
        <Table className="text-xs">
          {/* Two-row grouped header matching official table layout */}
          <TableHeader>
            {/* Group row */}
            <TableRow className="bg-muted/60 border-b-0">
              <TableHead rowSpan={2} className="align-middle font-semibold text-foreground border-r border-border/40">
                Skolenhet
              </TableHead>
              <TableHead rowSpan={2} className="align-middle text-center whitespace-nowrap border-r border-border/40">
                Socioek.<br />index
              </TableHead>
              {/* Antal elever group */}
              <TableHead colSpan={4} className="text-center border-b border-border/40 border-r border-border/20">
                Antal elever
              </TableHead>
              {/* Antal fritids group */}
              <TableHead colSpan={2} className="text-center border-b border-border/40 border-r border-border/20">
                Antal fritids
              </TableHead>
              {/* Totalt antal group */}
              <TableHead colSpan={2} className="text-center border-b border-border/40 border-r border-border/20">
                Totalt antal
              </TableHead>
              {/* Per elev group */}
              <TableHead colSpan={6} className="text-center border-b border-border/40 border-r border-border/20">
                Belopp per elev (kr)
              </TableHead>
              {/* Budget */}
              <TableHead rowSpan={2} className="align-middle text-right font-semibold text-foreground">
                Budget<br />(tkr)
              </TableHead>
            </TableRow>
            {/* Sub-header row */}
            <TableRow className="bg-muted/40">
              {/* Antal elever sub-headers */}
              <SortableHead label="FSK" field="num_fsk" className="text-right" />
              <SortableHead label="ÅK 1-3" field="num_ak1_3" className="text-right" />
              <SortableHead label="ÅK 4-6" field="num_ak4_6" className="text-right" />
              <SortableHead label="ÅK 7-9" field="num_ak7_9" className="text-right border-r border-border/20" />
              {/* Antal fritids sub-headers */}
              <SortableHead label="F6-9" field="num_fritids_6_9" className="text-right" />
              <SortableHead label="F10-12" field="num_fritids_10_12" className="text-right border-r border-border/20" />
              {/* Totalt sub-headers */}
              <SortableHead label="Skola" field="total_school_students" className="text-right" />
              <SortableHead label="Fritids" field="total_fritids_students" className="text-right border-r border-border/20" />
              {/* Per elev sub-headers */}
              <SortableHead label="FSK" field="per_pupil_fsk" className="text-right" />
              <SortableHead label="ÅK 1-3" field="per_pupil_ak1_3" className="text-right" />
              <SortableHead label="ÅK 4-6" field="per_pupil_ak4_6" className="text-right" />
              <SortableHead label="ÅK 7-9" field="per_pupil_ak7_9" className="text-right" />
              <SortableHead label="F6-9 år" field="per_pupil_fritids_6_9" className="text-right" />
              <SortableHead label="F10-12 år" field="per_pupil_fritids_10_12" className="text-right border-r border-border/20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((s, i) => (
              <TableRow key={i} className="even:bg-muted/20">
                {/* School name + district */}
                <TableCell className="font-medium whitespace-nowrap border-r border-border/40">
                  <div>{s.school_name}</div>
                  {s.district && (
                    <div className="text-muted-foreground/60 font-normal">{s.district}</div>
                  )}
                </TableCell>
                {/* Index */}
                <TableCell className="text-center border-r border-border/40">
                  {s.socioeconomic_index}
                </TableCell>
                {/* Student counts — school */}
                <TableCell className="text-right"><ZeroCell value={s.num_fsk} /></TableCell>
                <TableCell className="text-right"><ZeroCell value={s.num_ak1_3} /></TableCell>
                <TableCell className="text-right"><ZeroCell value={s.num_ak4_6} /></TableCell>
                <TableCell className="text-right border-r border-border/20"><ZeroCell value={s.num_ak7_9} /></TableCell>
                {/* Student counts — fritids */}
                <TableCell className="text-right"><ZeroCell value={s.num_fritids_6_9} /></TableCell>
                <TableCell className="text-right border-r border-border/20"><ZeroCell value={s.num_fritids_10_12} /></TableCell>
                {/* Totalt antal */}
                <TableCell className="text-right font-medium">{fmt(s.total_school_students)}</TableCell>
                <TableCell className="text-right font-medium border-r border-border/20">
                  {s.total_fritids_students > 0 ? fmt(s.total_fritids_students) : <span className="text-muted-foreground/30">—</span>}
                </TableCell>
                {/* Per pupil amounts */}
                <TableCell className="text-right">
                  {s.num_fsk > 0 ? fmt(s.per_pupil_fsk) : <span className="text-muted-foreground/30">—</span>}
                </TableCell>
                <TableCell className="text-right">
                  {s.num_ak1_3 > 0 ? fmt(s.per_pupil_ak1_3) : <span className="text-muted-foreground/30">—</span>}
                </TableCell>
                <TableCell className="text-right">
                  {s.num_ak4_6 > 0 ? fmt(s.per_pupil_ak4_6) : <span className="text-muted-foreground/30">—</span>}
                </TableCell>
                <TableCell className="text-right">
                  {s.num_ak7_9 > 0 ? fmt(s.per_pupil_ak7_9) : <span className="text-muted-foreground/30">—</span>}
                </TableCell>
                <TableCell className="text-right">
                  {s.num_fritids_6_9 > 0 ? fmt(s.per_pupil_fritids_6_9) : <span className="text-muted-foreground/30">—</span>}
                </TableCell>
                <TableCell className="text-right border-r border-border/20">
                  {s.num_fritids_10_12 > 0 ? fmt(s.per_pupil_fritids_10_12) : <span className="text-muted-foreground/30">—</span>}
                </TableCell>
                {/* Budget total */}
                <TableCell className="text-right font-semibold">
                  {fmtTkr(s.total_allocation)}
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
          Detaljerad tilldelning per skola och åldersgrupp.
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
