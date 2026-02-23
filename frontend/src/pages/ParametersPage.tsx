import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useDataStore, DEFAULT_PARAMETERS } from "@/store/dataStore";
import { uploadCsv, calculate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Upload, Loader2, Calculator, FileSpreadsheet, Info, ChevronDown, RotateCcw } from "lucide-react";
import type { SchoolInput } from "@/types";

function fmt(n: number): string {
  return new Intl.NumberFormat("sv-SE").format(Math.round(n));
}

function fmtTkr(n: number): string {
  return `${new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n)} tkr`;
}

export function ParametersPage() {
  const {
    schools,
    parameters,
    setSchools,
    setParameters,
    setResults,
  } = useDataStore();

  const [uploading, setUploading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [weightsOpen, setWeightsOpen] = useState(false);
  const navigate = useNavigate();

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".csv")) {
        toast.error("Vänligen ladda upp en CSV-fil.");
        return;
      }
      setUploading(true);
      try {
        const data = await uploadCsv(file);
        setSchools(data.schools);
        toast.success(`${data.count} skolor laddades upp.`);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Fel vid uppladdning."
        );
      } finally {
        setUploading(false);
      }
    },
    [setSchools]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleCalculate = async () => {
    if (schools.length === 0) {
      toast.error("Ladda upp skoldata först.");
      return;
    }
    if (!parameters.total_budget || parameters.total_budget <= 0) {
      toast.error("Ange total budget (tkr) före beräkning.");
      return;
    }
    setCalculating(true);
    try {
      const data = await calculate({ schools, parameters });
      setResults(data.schools, data.summary, data.session_id);
      toast.success("Beräkning klar!");
      navigate("/summary");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Fel vid beräkning."
      );
    } finally {
      setCalculating(false);
    }
  };

  const updateParam = (key: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setParameters({ [key]: num });
    }
  };

  const resetWeights = () => {
    setParameters({
      vikt_f: DEFAULT_PARAMETERS.vikt_f,
      vikt_ak1: DEFAULT_PARAMETERS.vikt_ak1,
      vikt_ak2: DEFAULT_PARAMETERS.vikt_ak2,
      vikt_ak3: DEFAULT_PARAMETERS.vikt_ak3,
      vikt_ak4: DEFAULT_PARAMETERS.vikt_ak4,
      vikt_ak5: DEFAULT_PARAMETERS.vikt_ak5,
      vikt_ak6: DEFAULT_PARAMETERS.vikt_ak6,
      vikt_ak7: DEFAULT_PARAMETERS.vikt_ak7,
      vikt_ak8: DEFAULT_PARAMETERS.vikt_ak8,
      vikt_ak9: DEFAULT_PARAMETERS.vikt_ak9,
      vikt_fritids_6_9: DEFAULT_PARAMETERS.vikt_fritids_6_9,
      vikt_fritids_10_12: DEFAULT_PARAMETERS.vikt_fritids_10_12,
    });
    toast.success("Vikter återställda till standardvärden.");
  };

  const weightRows: { label: string; key: keyof typeof parameters }[] = [
    { label: "Förskoleklass (F)", key: "vikt_f" },
    { label: "Åk 1", key: "vikt_ak1" },
    { label: "Åk 2", key: "vikt_ak2" },
    { label: "Åk 3", key: "vikt_ak3" },
    { label: "Åk 4", key: "vikt_ak4" },
    { label: "Åk 5", key: "vikt_ak5" },
    { label: "Åk 6", key: "vikt_ak6" },
    { label: "Åk 7", key: "vikt_ak7" },
    { label: "Åk 8", key: "vikt_ak8" },
    { label: "Åk 9", key: "vikt_ak9" },
    { label: "Fritids 6–9 år", key: "vikt_fritids_6_9" },
    { label: "Fritids 10–12 år", key: "vikt_fritids_10_12" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-3xl tracking-tight text-primary"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Parametrar
        </h1>
        <p className="mt-1 text-muted-foreground">
          Ladda upp skoldata och konfigurera beräkningsmodellen.
        </p>
      </div>

      {/* CSV Upload */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle
            className="flex items-center gap-2 text-xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <FileSpreadsheet className="size-5 text-accent" />
            CSV-uppladdning
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
              dragActive
                ? "border-accent bg-accent/5"
                : "border-border hover:border-accent/50"
            }`}
          >
            {uploading ? (
              <Loader2 className="size-8 animate-spin text-accent" />
            ) : (
              <>
                <Upload className="mb-3 size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Dra och släpp en CSV-fil här, eller
                </p>
                <label className="mt-2 cursor-pointer">
                  <span className="text-sm font-medium text-accent underline-offset-2 hover:underline">
                    välj fil
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                </label>
              </>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Obligatoriska kolumner:{" "}
            <code className="rounded bg-muted px-1">school_name</code>,{" "}
            <code className="rounded bg-muted px-1">school_type</code> (kommunal/fristående),{" "}
            <code className="rounded bg-muted px-1">elever_f</code>,{" "}
            <code className="rounded bg-muted px-1">elever_ak1</code>…<code className="rounded bg-muted px-1">elever_ak9</code>,{" "}
            <code className="rounded bg-muted px-1">elever_fritids_6_9</code>,{" "}
            <code className="rounded bg-muted px-1">elever_fritids_10_12</code>,{" "}
            <code className="rounded bg-muted px-1">socioeconomic_index</code>.{" "}
            Valfri: <code className="rounded bg-muted px-1">district</code>
          </p>

          {/* Preview table */}
          {schools.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Förhandsvisning ({schools.length} skolor totalt)
              </p>
              <div className="overflow-x-auto rounded-lg border border-border/60">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Skolnamn</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead className="text-right">F</TableHead>
                      <TableHead className="text-right">Åk1</TableHead>
                      <TableHead className="text-right">Åk2</TableHead>
                      <TableHead className="text-right">Åk3</TableHead>
                      <TableHead className="text-right">Åk4</TableHead>
                      <TableHead className="text-right">Åk5</TableHead>
                      <TableHead className="text-right">Åk6</TableHead>
                      <TableHead className="text-right">Åk7</TableHead>
                      <TableHead className="text-right">Åk8</TableHead>
                      <TableHead className="text-right">Åk9</TableHead>
                      <TableHead className="text-right">F6-9</TableHead>
                      <TableHead className="text-right">F10-12</TableHead>
                      <TableHead className="text-right">Index</TableHead>
                      <TableHead>Stadsdel</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schools.slice(0, 5).map((s: SchoolInput, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{s.school_name}</TableCell>
                        <TableCell>{s.school_type}</TableCell>
                        <TableCell className={`text-right ${s.elever_f === 0 ? "text-muted-foreground" : ""}`}>{s.elever_f}</TableCell>
                        <TableCell className={`text-right ${s.elever_ak1 === 0 ? "text-muted-foreground" : ""}`}>{s.elever_ak1}</TableCell>
                        <TableCell className={`text-right ${s.elever_ak2 === 0 ? "text-muted-foreground" : ""}`}>{s.elever_ak2}</TableCell>
                        <TableCell className={`text-right ${s.elever_ak3 === 0 ? "text-muted-foreground" : ""}`}>{s.elever_ak3}</TableCell>
                        <TableCell className={`text-right ${s.elever_ak4 === 0 ? "text-muted-foreground" : ""}`}>{s.elever_ak4}</TableCell>
                        <TableCell className={`text-right ${s.elever_ak5 === 0 ? "text-muted-foreground" : ""}`}>{s.elever_ak5}</TableCell>
                        <TableCell className={`text-right ${s.elever_ak6 === 0 ? "text-muted-foreground" : ""}`}>{s.elever_ak6}</TableCell>
                        <TableCell className={`text-right ${s.elever_ak7 === 0 ? "text-muted-foreground" : ""}`}>{s.elever_ak7}</TableCell>
                        <TableCell className={`text-right ${s.elever_ak8 === 0 ? "text-muted-foreground" : ""}`}>{s.elever_ak8}</TableCell>
                        <TableCell className={`text-right ${s.elever_ak9 === 0 ? "text-muted-foreground" : ""}`}>{s.elever_ak9}</TableCell>
                        <TableCell className={`text-right ${s.elever_fritids_6_9 === 0 ? "text-muted-foreground" : ""}`}>{s.elever_fritids_6_9}</TableCell>
                        <TableCell className={`text-right ${s.elever_fritids_10_12 === 0 ? "text-muted-foreground" : ""}`}>{s.elever_fritids_10_12}</TableCell>
                        <TableCell className="text-right">{s.socioeconomic_index}</TableCell>
                        <TableCell>{s.district || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {schools.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  Visar 5 av {schools.length} rader.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle
            className="text-xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Budget
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="total_budget">Total budget att fördela</Label>
              <div className="relative">
                <Input
                  id="total_budget"
                  type="number"
                  step="1000"
                  min="0"
                  value={parameters.total_budget || ""}
                  onChange={(e) => updateParam("total_budget", e.target.value)}
                  className="pr-12"
                  placeholder="t.ex. 3 000 000"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  tkr
                </span>
              </div>
              {parameters.total_budget > 0 && (
                <p className="text-xs text-muted-foreground">
                  {fmtTkr(parameters.total_budget)} = {fmt(parameters.total_budget * 1000)} kr
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget_grundskola">Andel grundskola</Label>
              <div className="relative">
                <Input
                  id="budget_grundskola"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={parameters.budget_grundskola}
                  onChange={(e) => updateParam("budget_grundskola", e.target.value)}
                  className="pr-8"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {(parameters.budget_grundskola * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {parameters.total_budget > 0
                  ? fmtTkr(parameters.total_budget * parameters.budget_grundskola)
                  : "–"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget_fritidshem">Andel fritidshem</Label>
              <div className="relative">
                <Input
                  id="budget_fritidshem"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={parameters.budget_fritidshem}
                  onChange={(e) => updateParam("budget_fritidshem", e.target.value)}
                  className="pr-8"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {(parameters.budget_fritidshem * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {parameters.total_budget > 0
                  ? fmtTkr(parameters.total_budget * parameters.budget_fritidshem)
                  : "–"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-4 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-accent" />
            <p>
              Totalbudget avser den ram som återstår efter centrala avsättningar.
              Andel grundskola + fritidshem behöver inte summera till 100%.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Strukturandel */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle
            className="text-xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Strukturandel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="andel_struktur_grundskola">Grundskola</Label>
              <div className="relative">
                <Input
                  id="andel_struktur_grundskola"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={parameters.andel_struktur_grundskola}
                  onChange={(e) => updateParam("andel_struktur_grundskola", e.target.value)}
                  className="pr-8"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {(parameters.andel_struktur_grundskola * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Andel av grundskolans budget som fördelas efter socioekonomiskt index.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="andel_struktur_fritidshem">Fritidshem</Label>
              <div className="relative">
                <Input
                  id="andel_struktur_fritidshem"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={parameters.andel_struktur_fritidshem}
                  onChange={(e) => updateParam("andel_struktur_fritidshem", e.target.value)}
                  className="pr-8"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {(parameters.andel_struktur_fritidshem * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Andel av fritidshemmens budget som fördelas efter socioekonomiskt index.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skoltyp-justeringar */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle
            className="text-xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Skoltyp-justeringar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="avdrag_kommunal_procent">Lokalt avdrag kommunal</Label>
              <div className="relative">
                <Input
                  id="avdrag_kommunal_procent"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={parameters.avdrag_kommunal_procent}
                  onChange={(e) => updateParam("avdrag_kommunal_procent", e.target.value)}
                  className="pr-8"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {(parameters.avdrag_kommunal_procent * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Avdrag på bruttobelopp för lokaler, måltider, skolledning m.m.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="moms_kompensation">Momskompensation fristående</Label>
              <div className="relative">
                <Input
                  id="moms_kompensation"
                  type="number"
                  step="0.01"
                  min="0"
                  value={parameters.moms_kompensation}
                  onChange={(e) => updateParam("moms_kompensation", e.target.value)}
                  className="pr-8"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {(parameters.moms_kompensation * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Läggs till bruttobelopp för fristående skolor.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin_kompensation_fri">Adminpåslag fristående</Label>
              <div className="relative">
                <Input
                  id="admin_kompensation_fri"
                  type="number"
                  step="0.01"
                  min="0"
                  value={parameters.admin_kompensation_fri}
                  onChange={(e) => updateParam("admin_kompensation_fri", e.target.value)}
                  className="pr-8"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {(parameters.admin_kompensation_fri * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Läggs till bruttobelopp för fristående skolor.
              </p>
            </div>
          </div>

          <Separator />

          <div className="rounded-lg bg-muted/40 p-4">
            <p className="mb-2 text-sm font-medium text-foreground">Formel nettobelopp</p>
            <code className="block text-xs leading-relaxed text-muted-foreground">
              Kommunal: netto = brutto × (1 − {(parameters.avdrag_kommunal_procent * 100).toFixed(0)}%) + tillägg
              <br />
              Fristående: netto = brutto × (1 + {(parameters.moms_kompensation * 100).toFixed(0)}% + {(parameters.admin_kompensation_fri * 100).toFixed(0)}%)
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Vikttabell — collapsible */}
      <Card className="border-border/60">
        <CardHeader>
          <button
            type="button"
            className="flex w-full items-center justify-between"
            onClick={() => setWeightsOpen(!weightsOpen)}
          >
            <CardTitle
              className="text-xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Vikttabell
            </CardTitle>
            <ChevronDown
              className={`size-5 text-muted-foreground transition-transform ${weightsOpen ? "rotate-180" : ""}`}
            />
          </button>
        </CardHeader>
        {weightsOpen && (
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {weightRows.map(({ label, key }) => (
                <div key={key} className="space-y-1">
                  <Label htmlFor={key} className="text-xs">{label}</Label>
                  <Input
                    id={key}
                    type="number"
                    step="0.001"
                    min="0"
                    value={parameters[key] as number}
                    onChange={(e) => updateParam(key, e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={resetWeights}
              className="gap-1.5"
            >
              <RotateCcw className="size-3.5" />
              Återställ till standardvärden
            </Button>
            <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-4 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0 text-accent" />
              <p>
                Vikterna baseras på timplan × insatsfaktor per årskurs.
                Grundersättning fördelas proportionellt mot viktade elevantal.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tillägg */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle
            className="text-xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Tillägg (kommunala skolor)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tillagg_skoladmin_per_elev">Skoladministration per elev</Label>
              <div className="relative">
                <Input
                  id="tillagg_skoladmin_per_elev"
                  type="number"
                  step="0.001"
                  min="0"
                  value={parameters.tillagg_skoladmin_per_elev}
                  onChange={(e) => updateParam("tillagg_skoladmin_per_elev", e.target.value)}
                  className="pr-12"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  tkr/elev
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tillagg_likvärdig_grund_per_elev">Likvärdig skola / grundersättning per elev</Label>
              <div className="relative">
                <Input
                  id="tillagg_likvärdig_grund_per_elev"
                  type="number"
                  step="0.001"
                  min="0"
                  value={parameters["tillagg_likvärdig_grund_per_elev"]}
                  onChange={(e) => updateParam("tillagg_likvärdig_grund_per_elev", e.target.value)}
                  className="pr-12"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  tkr/elev
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tillagg_likvärdig_struktur_per_elev">Likvärdig skola / strukturersättning per elev</Label>
              <div className="relative">
                <Input
                  id="tillagg_likvärdig_struktur_per_elev"
                  type="number"
                  step="0.001"
                  min="0"
                  value={parameters["tillagg_likvärdig_struktur_per_elev"]}
                  onChange={(e) => updateParam("tillagg_likvärdig_struktur_per_elev", e.target.value)}
                  className="pr-12"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  tkr/elev
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tillagg_fritidsavgift_per_fritidsbarn">Fritidshemsavgift per fritidsbarn</Label>
              <div className="relative">
                <Input
                  id="tillagg_fritidsavgift_per_fritidsbarn"
                  type="number"
                  step="0.001"
                  min="0"
                  value={parameters.tillagg_fritidsavgift_per_fritidsbarn}
                  onChange={(e) => updateParam("tillagg_fritidsavgift_per_fritidsbarn", e.target.value)}
                  className="pr-12"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  tkr/barn
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-4 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-accent" />
            <p>
              Tillägg läggs till nettobeloppet för kommunala skolor.
              Alla belopp anges i tkr/elev (0 = inget tillägg).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Calculate */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleCalculate}
          disabled={calculating || schools.length === 0}
          className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {calculating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Calculator className="size-4" />
          )}
          Beräkna
        </Button>
      </div>
    </div>
  );
}
