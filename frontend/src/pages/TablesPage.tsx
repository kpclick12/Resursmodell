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
import { ArrowRight, Download, ArrowUpDown, AlertCircle } from "lucide-react";
import type { SchoolResult } from "@/types";
import { PlanSelector } from "@/components/plans/PlanSelector";

function fmt(n: number): string {
  return new Intl.NumberFormat("sv-SE").format(Math.round(n));
}

function fmtTkr(n: number): string {
  return new Intl.NumberFormat("sv-SE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(n);
}

type SortKey =
  | "school_name"
  | "district"
  | "socioeconomic_index"
  | "total_school_students"
  | "total_fritids_students"
  | "elever_f"
  | "elever_ak1"
  | "elever_ak2"
  | "elever_ak3"
  | "elever_ak4"
  | "elever_ak5"
  | "elever_ak6"
  | "elever_ak7"
  | "elever_ak8"
  | "elever_ak9"
  | "elever_fritids_6_9"
  | "elever_fritids_10_12"
  | "grundbelopp_brutto"
  | "netto";

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
  isV1,
}: {
  title: string;
  schools: SchoolResult[];
  filenamePrefix: string;
  isV1: boolean;
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
      "F",
      "Åk1",
      "Åk2",
      "Åk3",
      "Åk4",
      "Åk5",
      "Åk6",
      "Åk7",
      "Åk8",
      "Åk9",
      "Fritids 6-9",
      "Fritids 10-12",
      "Totalt skola",
      "Totalt fritids",
      "Grundersättning GS (tkr)",
      "Strukturersättning GS (tkr)",
      "Grundersättning Fritids (tkr)",
      "Strukturersättning Fritids (tkr)",
      "Brutto (tkr)",
      "Avdrag/Moms+Admin (tkr)",
      "Tillägg totalt (tkr)",
      "Netto (tkr)",
    ];
    const rows = sorted.map((s) => [
      s.school_name,
      s.district || "",
      s.socioeconomic_index,
      s.elever_f,
      s.elever_ak1,
      s.elever_ak2,
      s.elever_ak3,
      s.elever_ak4,
      s.elever_ak5,
      s.elever_ak6,
      s.elever_ak7,
      s.elever_ak8,
      s.elever_ak9,
      s.elever_fritids_6_9,
      s.elever_fritids_10_12,
      s.total_school_students,
      s.total_fritids_students,
      s["grundersättning"].toFixed(1),
      s["strukturersättning"].toFixed(1),
      s["grundersättning_fritids"].toFixed(1),
      s["strukturersättning_fritids"].toFixed(1),
      s.grundbelopp_brutto.toFixed(1),
      s.school_type === "kommunal"
        ? s.lokalt_avdrag.toFixed(1)
        : (s.moms_tillagg + s.admin_tillagg).toFixed(1),
      s.tillagg_totalt.toFixed(1),
      s.netto.toFixed(1),
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

      {isV1 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-400">
          <AlertCircle className="size-4 shrink-0" />
          Sparad med gamla modellen — beräkningsdetaljer (grundersättning, strukturersättning, brutto) visas ej.
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border/60">
        <Table className="text-xs">
          <TableHeader>
            {/* Group row */}
            <TableRow className="bg-muted/60 border-b-0">
              <TableHead rowSpan={2} className="align-middle font-semibold text-foreground border-r border-border/40 whitespace-nowrap">
                Skolenhet
              </TableHead>
              <TableHead rowSpan={2} className="align-middle text-center whitespace-nowrap border-r border-border/40">
                Socioek.<br />index
              </TableHead>
              {/* Antal elever — individual years */}
              <TableHead colSpan={10} className="text-center border-b border-border/40 border-r border-border/20">
                Antal elever per åk
              </TableHead>
              {/* Antal fritids */}
              <TableHead colSpan={2} className="text-center border-b border-border/40 border-r border-border/20">
                Antal fritids
              </TableHead>
              {/* Totalt */}
              <TableHead colSpan={2} className="text-center border-b border-border/40 border-r border-border/20">
                Totalt antal
              </TableHead>
              {/* Grundersättning */}
              <TableHead colSpan={2} className="text-center border-b border-border/40 border-r border-border/20">
                Grundersättning (tkr)
              </TableHead>
              {/* Strukturersättning */}
              <TableHead colSpan={2} className="text-center border-b border-border/40 border-r border-border/20">
                Strukturersättning (tkr)
              </TableHead>
              {/* Brutto */}
              <TableHead rowSpan={2} className="align-middle text-right whitespace-nowrap border-r border-border/20">
                Brutto<br />(tkr)
              </TableHead>
              {/* Avdrag/Tillägg */}
              <TableHead colSpan={2} className="text-center border-b border-border/40 border-r border-border/20">
                Avdrag / Tillägg (tkr)
              </TableHead>
              {/* Netto */}
              <TableHead rowSpan={2} className="align-middle text-right font-semibold text-foreground">
                Netto<br />(tkr)
              </TableHead>
            </TableRow>
            {/* Sub-header row */}
            <TableRow className="bg-muted/40">
              {/* Elever per åk */}
              <SortableHead label="F" field="elever_f" className="text-right" />
              <SortableHead label="Åk1" field="elever_ak1" className="text-right" />
              <SortableHead label="Åk2" field="elever_ak2" className="text-right" />
              <SortableHead label="Åk3" field="elever_ak3" className="text-right" />
              <SortableHead label="Åk4" field="elever_ak4" className="text-right" />
              <SortableHead label="Åk5" field="elever_ak5" className="text-right" />
              <SortableHead label="Åk6" field="elever_ak6" className="text-right" />
              <SortableHead label="Åk7" field="elever_ak7" className="text-right" />
              <SortableHead label="Åk8" field="elever_ak8" className="text-right" />
              <SortableHead label="Åk9" field="elever_ak9" className="text-right border-r border-border/20" />
              {/* Fritids */}
              <SortableHead label="6-9" field="elever_fritids_6_9" className="text-right" />
              <SortableHead label="10-12" field="elever_fritids_10_12" className="text-right border-r border-border/20" />
              {/* Totalt */}
              <SortableHead label="Skola" field="total_school_students" className="text-right" />
              <SortableHead label="Fritids" field="total_fritids_students" className="text-right border-r border-border/20" />
              {/* Grundersättning */}
              <TableHead className="text-right text-muted-foreground">GS</TableHead>
              <TableHead className="text-right text-muted-foreground border-r border-border/20">Fritids</TableHead>
              {/* Strukturersättning */}
              <TableHead className="text-right text-muted-foreground">GS</TableHead>
              <TableHead className="text-right text-muted-foreground border-r border-border/20">Fritids</TableHead>
              {/* Avdrag/Tillägg */}
              <TableHead className="text-right text-muted-foreground">Avdrag</TableHead>
              <TableHead className="text-right text-muted-foreground border-r border-border/20">Tillägg</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((s, i) => {
              const isKommunal = s.school_type === "kommunal";
              const avdragCell = isKommunal
                ? s.lokalt_avdrag
                : s.moms_tillagg + s.admin_tillagg;
              const avdragLabel = isKommunal ? "−" : "+";
              return (
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
                  {/* Individual year counts */}
                  <TableCell className="text-right"><ZeroCell value={s.elever_f} /></TableCell>
                  <TableCell className="text-right"><ZeroCell value={s.elever_ak1} /></TableCell>
                  <TableCell className="text-right"><ZeroCell value={s.elever_ak2} /></TableCell>
                  <TableCell className="text-right"><ZeroCell value={s.elever_ak3} /></TableCell>
                  <TableCell className="text-right"><ZeroCell value={s.elever_ak4} /></TableCell>
                  <TableCell className="text-right"><ZeroCell value={s.elever_ak5} /></TableCell>
                  <TableCell className="text-right"><ZeroCell value={s.elever_ak6} /></TableCell>
                  <TableCell className="text-right"><ZeroCell value={s.elever_ak7} /></TableCell>
                  <TableCell className="text-right"><ZeroCell value={s.elever_ak8} /></TableCell>
                  <TableCell className="text-right border-r border-border/20"><ZeroCell value={s.elever_ak9} /></TableCell>
                  {/* Fritids counts */}
                  <TableCell className="text-right"><ZeroCell value={s.elever_fritids_6_9} /></TableCell>
                  <TableCell className="text-right border-r border-border/20"><ZeroCell value={s.elever_fritids_10_12} /></TableCell>
                  {/* Totalt */}
                  <TableCell className="text-right font-medium">{fmt(s.total_school_students)}</TableCell>
                  <TableCell className="text-right font-medium border-r border-border/20">
                    {s.total_fritids_students > 0 ? fmt(s.total_fritids_students) : <span className="text-muted-foreground/30">—</span>}
                  </TableCell>
                  {/* Grundersättning */}
                  <TableCell className="text-right">
                    {isV1 ? <span className="text-muted-foreground/30">—</span> : fmtTkr(s["grundersättning"])}
                  </TableCell>
                  <TableCell className="text-right border-r border-border/20">
                    {isV1 ? <span className="text-muted-foreground/30">—</span> : fmtTkr(s["grundersättning_fritids"])}
                  </TableCell>
                  {/* Strukturersättning */}
                  <TableCell className="text-right">
                    {isV1 ? <span className="text-muted-foreground/30">—</span> : fmtTkr(s["strukturersättning"])}
                  </TableCell>
                  <TableCell className="text-right border-r border-border/20">
                    {isV1 ? <span className="text-muted-foreground/30">—</span> : fmtTkr(s["strukturersättning_fritids"])}
                  </TableCell>
                  {/* Brutto */}
                  <TableCell className="text-right border-r border-border/20">
                    {isV1 ? <span className="text-muted-foreground/30">—</span> : fmtTkr(s.grundbelopp_brutto)}
                  </TableCell>
                  {/* Avdrag */}
                  <TableCell className="text-right">
                    {isV1 ? (
                      <span className="text-muted-foreground/30">—</span>
                    ) : (
                      <span className={avdragCell > 0 ? (isKommunal ? "text-destructive/70" : "text-emerald-600") : ""}>
                        {avdragCell > 0 ? `${avdragLabel} ${fmtTkr(avdragCell)}` : "—"}
                      </span>
                    )}
                  </TableCell>
                  {/* Tillägg */}
                  <TableCell className="text-right border-r border-border/20">
                    {isV1 || !isKommunal ? (
                      <span className="text-muted-foreground/30">—</span>
                    ) : (
                      s.tillagg_totalt > 0 ? <span className="text-emerald-600">+ {fmtTkr(s.tillagg_totalt)}</span> : "—"
                    )}
                  </TableCell>
                  {/* Netto */}
                  <TableCell className="text-right font-semibold">
                    {fmtTkr(s.netto)}
                  </TableCell>
                </TableRow>
              );
            })}
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
  const modelVersion = useDataStore((s) => s.activeModelVersion());
  const isV1 = modelVersion === "v1";

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
        isV1={isV1}
      />

      <SchoolTable
        title="Fristående skolor"
        schools={fristaende}
        filenamePrefix="fristaende_skolor"
        isV1={isV1}
      />
    </div>
  );
}
