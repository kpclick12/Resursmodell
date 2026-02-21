import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useDataStore } from "@/store/dataStore";
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
import { Upload, Loader2, Calculator, FileSpreadsheet } from "lucide-react";
import type { SchoolInput } from "@/types";

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
            Kolumner: <code className="rounded bg-muted px-1">school_name</code>,{" "}
            <code className="rounded bg-muted px-1">school_type</code> (kommunal/fristående),{" "}
            <code className="rounded bg-muted px-1">num_students</code>,{" "}
            <code className="rounded bg-muted px-1">socioeconomic_index</code>,{" "}
            <code className="rounded bg-muted px-1">district</code> (valfri)
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
                      <TableHead className="text-right">Elever</TableHead>
                      <TableHead className="text-right">Index</TableHead>
                      <TableHead>Stadsdel</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schools.slice(0, 5).map((s: SchoolInput, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          {s.school_name}
                        </TableCell>
                        <TableCell>{s.school_type}</TableCell>
                        <TableCell className="text-right">
                          {s.num_students}
                        </TableCell>
                        <TableCell className="text-right">
                          {s.socioeconomic_index}
                        </TableCell>
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

      {/* Base Amount */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle
            className="text-xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Grundbelopp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="base_amount">Grundbelopp per elev (SEK)</Label>
              <Input
                id="base_amount"
                type="number"
                value={parameters.base_amount_per_pupil}
                onChange={(e) => updateParam("base_amount_per_pupil", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="municipal_supplement">
                Kommunalt tillägg (SEK)
              </Label>
              <Input
                id="municipal_supplement"
                type="number"
                value={parameters.municipal_supplement}
                onChange={(e) => updateParam("municipal_supplement", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Extra belopp per elev för kommunala skolor.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Socioeconomic Weighting */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle
            className="text-xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Socioekonomisk viktning
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="weight">Viktningsfaktor</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={parameters.socioeconomic_weight}
                onChange={(e) => updateParam("socioeconomic_weight", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_supplement">Max tillägg (SEK/elev)</Label>
              <Input
                id="max_supplement"
                type="number"
                value={parameters.max_socioeconomic_supplement}
                onChange={(e) =>
                  updateParam("max_socioeconomic_supplement", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="index_scale">Indexskala</Label>
              <Input
                id="index_scale"
                type="number"
                value={parameters.index_scale}
                onChange={(e) => updateParam("index_scale", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                t.ex. 100 om index är 0–100
              </p>
            </div>
          </div>

          <Separator />

          <div className="rounded-lg bg-muted/40 p-4">
            <p className="mb-2 text-sm font-medium text-foreground">Formel</p>
            <code className="block text-xs leading-relaxed text-muted-foreground">
              socioekonomiskt_tillägg = min((index / skala) × vikt × grundbelopp,
              max_tillägg)
              <br />
              total_per_elev = grundbelopp + socioekonomiskt_tillägg +
              (kommunalt_tillägg om kommunal)
              <br />
              total = total_per_elev × antal_elever
            </code>
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
