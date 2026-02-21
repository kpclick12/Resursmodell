import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Upload,
  SlidersHorizontal,
  BarChart3,
  Table2,
  Download,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Ladda upp skoldata",
    description: "Importera CSV med skolor, elevantal och socioekonomiskt index.",
  },
  {
    icon: SlidersHorizontal,
    title: "Justera parametrar",
    description:
      "Ändra grundbelopp, kommunalt tillägg och socioekonomisk viktning.",
  },
  {
    icon: BarChart3,
    title: "Visualisera fördelning",
    description:
      "Se sammanfattande statistik och diagram över budgetfördelningen.",
  },
  {
    icon: Table2,
    title: "Granska per skola",
    description:
      "Detaljerade tabeller för kommunala och fristående skolor med sortering och filtrering.",
  },
  {
    icon: Download,
    title: "Exportera resultat",
    description: "Ladda ner beräkningar som CSV för vidare analys.",
  },
  {
    icon: ShieldCheck,
    title: "Dataintegritet",
    description:
      "All data behandlas lokalt. Ingen känslig information lagras permanent.",
  },
];

export function LandingPage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="py-8 text-center sm:py-12">
        <h1
          className="text-4xl tracking-tight text-primary sm:text-5xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Resursfördelning för
          <br />
          Göteborgs grundskolor
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Beräkna och visualisera hur ekonomiska resurser fördelas mellan
          kommunala och fristående grundskolor — inklusive socioekonomisk
          viktning enligt Göteborgs modell.
        </p>
        <Link to="/parameters">
          <Button size="lg" className="mt-8 gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
            Kom igång
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      </section>

      {/* Features */}
      <section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border border-border/60 bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-accent/10">
                <f.icon className="size-5 text-accent" />
              </div>
              <h3
                className="text-lg text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {f.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
