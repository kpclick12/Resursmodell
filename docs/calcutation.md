# Resursfördelningsmodell – Grundskola, Göteborgs stad

## Syfte

Denna fil beskriver beräkningslogiken i resursfördelningsmodellen för grundskola (inklusive förskoleklass och fritidshem) i Göteborgs stad. Syftet är att dokumentationen ska vara tillräcklig för att implementera modellen i Python som backend till en webbapplikation (FastAPI + React).

---

## Konfigurerbar input (parametrar)

Dessa värden ska kunna justeras av användaren:

| Parameter | Beskrivning | Nuvarande värde |
|---|---|---|
| `total_budget` | Total ram att fördela i modellen (tkr) | Sätts årligen |
| `budget_grundskola` | Andel av total budget till grundskola inkl. förskoleklass | Sätts årligen |
| `budget_fritidshem` | Andel av total budget till fritidshem | Sätts årligen |
| `andel_struktur_grundskola` | Andel av grundskolans budget till strukturersättning | 0.19 |
| `andel_struktur_fritidshem` | Andel av fritidshemmens budget till strukturersättning | 0.10 |
| `avdrag_kommunal_procent` | Lokalt avdrag för kommunala skolor (andel av grundbelopp) | 0.48 |
| `moms_kompensation` | Momskompensation för fristående skolor | 0.06 |
| `admin_kompensation_fri` | Administrationspåslag för fristående skolor | 0.03 |

---

## Data-input (per skola)

Följande data krävs per skola och läses in som dataset:

| Fält | Beskrivning |
|---|---|
| `skola` | Skolans namn |
| `huvudman` | `kommunal` eller `fristående` |
| `socioekonomiskt_index` | Skolans socioekonomiska index (SCB). Genomsnitt 100 för Göteborgs skolor. Högre index = sämre förväntade resultat = mer resurser. |
| `elever_f` | Antal elever i förskoleklass |
| `elever_ak1` | Antal elever i åk 1 |
| `elever_ak2` | Antal elever i åk 2 |
| `elever_ak3` | Antal elever i åk 3 |
| `elever_ak4` | Antal elever i åk 4 |
| `elever_ak5` | Antal elever i åk 5 |
| `elever_ak6` | Antal elever i åk 6 |
| `elever_ak7` | Antal elever i åk 7 |
| `elever_ak8` | Antal elever i åk 8 |
| `elever_ak9` | Antal elever i åk 9 |
| `elever_fritids_6_9` | Antal fritidsbarn 6–9 år |
| `elever_fritids_10_12` | Antal fritidsbarn 10–12 år |

Elevantal baseras på inskrivna elever per den 15 oktober.

---

## Vikttabell

Vikten per årskurs baseras på timplan och en faktor för "tidiga insatser". Slutvikt = timplan × insatser.

### Grundskola (inklusive förskoleklass)

| Årskurs | Timplan | Insatser | Vikt |
|---|---|---|---|
| F | 1.000 | 1.0 | 1.000 |
| Åk 1 | 1.000 | 1.0 | 1.000 |
| Åk 2 | 1.182 | 1.0 | 1.180 |
| Åk 3 | 1.310 | 1.0 | 1.310 |
| Åk 4 | 1.390 | 0.9 | 1.260 |
| Åk 5 | 1.417 | 0.9 | 1.290 |
| Åk 6 | 1.481 | 0.9 | 1.350 |
| Åk 7 | 1.561 | 0.9 | 1.420 |
| Åk 8 | 1.578 | 0.9 | 1.430 |
| Åk 9 | 1.578 | 0.9 | 1.430 |

### Fritidshem

| Åldersgrupp | Vikt |
|---|---|
| 6–9 år | 1.000 |
| 10–12 år | 0.340 |

---

## Beräkningssteg

### Steg 1: Dela upp totalbudget

```
budget_grundskola_tkr = total_budget × budget_grundskola
budget_fritidshem_tkr = total_budget × budget_fritidshem
```

Totalbudgeten avser den ram som återstår efter centrala avsättningar (administration, myndighetsutövning, riskhantering, grundsärskola, SU4, nyanlända, skärgårdstillägg, kollektivtrafikkort, politiska satsningar m.m.). Dessa centrala avsättningar hanteras utanför denna modell.

### Steg 2: Dela upp i grundersättning och strukturersättning

```
# Grundskola
grundersättning_grundskola = budget_grundskola_tkr × (1 - andel_struktur_grundskola)
strukturersättning_grundskola = budget_grundskola_tkr × andel_struktur_grundskola

# Fritidshem
grundersättning_fritidshem = budget_fritidshem_tkr × (1 - andel_struktur_fritidshem)
strukturersättning_fritidshem = budget_fritidshem_tkr × andel_struktur_fritidshem
```

### Steg 3: Beräkna grundersättning per skola

Grundersättningen fördelas proportionellt efter viktade elevantal.

```
# Per skola: summera viktade elever för grundskola
viktade_elever_grundskola[skola] = (
    elever_f × 1.000 +
    elever_ak1 × 1.000 +
    elever_ak2 × 1.180 +
    elever_ak3 × 1.310 +
    elever_ak4 × 1.260 +
    elever_ak5 × 1.290 +
    elever_ak6 × 1.350 +
    elever_ak7 × 1.420 +
    elever_ak8 × 1.430 +
    elever_ak9 × 1.430
)

# Totalt i kommunen
total_viktade_grundskola = sum(viktade_elever_grundskola för alla skolor)

# Grundersättning per skola
grundersättning[skola] = (
    viktade_elever_grundskola[skola] / total_viktade_grundskola
) × grundersättning_grundskola
```

Samma logik för fritidshem:

```
viktade_elever_fritids[skola] = (
    elever_fritids_6_9 × 1.000 +
    elever_fritids_10_12 × 0.340
)

total_viktade_fritids = sum(viktade_elever_fritids för alla skolor)

grundersättning_fritids[skola] = (
    viktade_elever_fritids[skola] / total_viktade_fritids
) × grundersättning_fritidshem
```

### Steg 4: Beräkna strukturersättning per skola

Strukturersättningen fördelas proportionellt efter elevantal × socioekonomiskt index. Fördelningen är linjär – en skola med index 200 får dubbelt per elev jämfört med en skola med index 100.

```
# Per skola: totalt antal grundskoleelever (oviktat)
total_elever_grundskola[skola] = elever_f + elever_ak1 + ... + elever_ak9

# Viktat strukturtal
strukturtal[skola] = total_elever_grundskola[skola] × socioekonomiskt_index[skola]

# Totalt i kommunen
total_strukturtal = sum(strukturtal för alla skolor)

# Strukturersättning per skola
strukturersättning[skola] = (
    strukturtal[skola] / total_strukturtal
) × strukturersättning_grundskola
```

Samma logik för fritidshem:

```
total_elever_fritids[skola] = elever_fritids_6_9 + elever_fritids_10_12

strukturtal_fritids[skola] = total_elever_fritids[skola] × socioekonomiskt_index[skola]

total_strukturtal_fritids = sum(strukturtal_fritids för alla skolor)

strukturersättning_fritids[skola] = (
    strukturtal_fritids[skola] / total_strukturtal_fritids
) × strukturersättning_fritidshem
```

### Steg 5: Grundbelopp (brutto)

```
grundbelopp_brutto[skola] = (
    grundersättning[skola] + strukturersättning[skola] +
    grundersättning_fritids[skola] + strukturersättning_fritids[skola]
)
```

Detta bruttovärde beräknas på lika villkor för kommunala och fristående skolor.

### Steg 6: Justeringar för fristående skolor

Fristående skolor får tillägg för moms och administration:

```
if huvudman == "fristående":
    moms_tillägg[skola] = grundbelopp_brutto[skola] × moms_kompensation
    admin_tillägg[skola] = grundbelopp_brutto[skola] × admin_kompensation_fri
```

Fristående skolor har inga lokala avdrag. Nettobelopp = brutto + moms + admin.

### Steg 7: Lokala avdrag för kommunala skolor

Kommunala skolor får ett procentuellt avdrag på grundbeloppet. Avdraget finansierar centralt hanterade kostnader: lokaler (inkl. städ och vaktmästeri), måltider, skolledning, elevhälsa och särskilt riktat stöd (SU-grupp 2).

```
if huvudman == "kommunal":
    lokalt_avdrag[skola] = grundbelopp_brutto[skola] × avdrag_kommunal_procent
```

**Viktigt:** Eftersom avdraget är en procentsats av grundbeloppet (som inkluderar strukturersättningen) blir avdraget högre i kronor för skolor med högt socioekonomiskt index. Detta innebär att strukturersättningen i praktiken får en avtagande effekt för kommunala skolor.

### Steg 8: Tillägg för kommunala skolor

Utöver grundbeloppet tillkommer tillägg som endast gäller kommunala skolor:

| Tillägg | Beskrivning | Fördelningslogik |
|---|---|---|
| Skoladministration | Schablonbelopp per elev | Fast belopp × antal elever |
| Likvärdig skola / grundersättning | Statsbidrag | Fast belopp per elev och årskurs |
| Likvärdig skola / strukturersättning | Statsbidrag | Utifrån årskurs och socioekonomiskt index |
| Fritidshemsavgift | Intäkter från fritidshem | Utifrån antal inskrivna fritidsbarn |

```
tillägg_totalt[skola] = (
    tillägg_skoladmin[skola] +
    tillägg_likvärdig_grund[skola] +
    tillägg_likvärdig_struktur[skola] +
    tillägg_fritidsavgift[skola]
)
```

### Steg 9: Nettobelopp

```
if huvudman == "kommunal":
    netto[skola] = grundbelopp_brutto[skola] - lokalt_avdrag[skola] + tillägg_totalt[skola]

if huvudman == "fristående":
    netto[skola] = grundbelopp_brutto[skola] + moms_tillägg[skola] + admin_tillägg[skola]
```

---

## Nyckeltal

| Nyckeltal | Formel | Beskrivning |
|---|---|---|
| Nettokvot | `netto[skola] / grundbelopp_brutto[skola]` | Andel av brutto som skolan disponerar. Gäller bara kommunala skolor. |
| Grundersättning per elev | `grundersättning[skola] / antal_elever[skola]` | Genomsnittlig grundersättning per elev |
| Strukturersättning per elev | `strukturersättning[skola] / antal_elever[skola]` | Genomsnittlig strukturersättning per elev |
| Referensbelopp | Viktat snittbelopp per elev över alla skolor | Jämförelsetal |

---

## Socioekonomiskt index

Indexet tas fram av SCB på uppdrag av Göteborgs stad. Det är ett anpassat index baserat på SCB:s riksmodell (Modell 2, förklaringsgrad 83,4%).

**Beroende variabel:** Andel elever som uppnår behörighet till gymnasieskolans yrkesprogram.

**Förklaringsvariabler:**

- Kön
- Invandringsår
- Högsta utbildning för vårdnadshavarna
- Ekonomiskt bistånd
- Bor med en eller båda vårdnadshavarna
- Hushållets inkomst
- Utländsk bakgrund
- Human Development Index (HDI) – uppdelning av invandring baserat på grupp av födelseland
- Bostadsområdets sociala tyngd

**Indexskala:** Genomsnittet för Göteborgs skolor = 100. Högre index innebär sämre förväntade resultat och ger mer strukturersättning.

**Hantering av saknad data:** Elever med tillfälligt personnummer (där SCB inte kan ta fram socioekonomisk bakgrund) tilldelas ett uppskattat högt index baserat på grundantaganden. Fristående skolor med hög andel sådana elever tilldelas istället ett genomsnittsindex för samtliga fristående skolor i Göteborg.

---

## Ordlista

| Begrepp | Definition |
|---|---|
| **Grundbelopp** | Samlingsbegrepp för grundersättning + strukturersättning |
| **Grundersättning** | Fast ersättning per elev viktad efter årskurs/ålder baserat på timplan |
| **Strukturersättning** | Socioekonomiskt viktad ersättning. 19% för grundskola, 10% för fritidshem |
| **Socioekonomiskt index** | SCB-framtaget index på skolnivå. Indikerar förväntat studieresultat. Genomsnitt = 100 |
| **Lokala avsättningar** | Kostnadsposter som finansieras centralt för kommunala skolor (lokaler, måltider, ledning, elevhälsa, SU2) |
| **Bruttobelopp** | Grundbeloppet innan avdrag för lokala avsättningar. Gäller kommunala skolor |
| **Nettobelopp** | Grundbeloppet efter avdrag och tillägg. Gäller kommunala skolor |
| **Nettokvot** | Nettobelopp / Bruttobelopp |
| **Fördelningsprofil** | Fasta kostnader per kommunal skola som beskriver hur avdragen för lokala avsättningar görs |
| **Centrala avsättningar** | Medel som avsätts från nämndens ram innan beräkning av grundbelopp (administration, riskhantering, grundsärskola, SU4, nyanlända m.m.). Hanteras utanför denna modell. |

---

## Sammanfattning av beräkningsflödet

```
Kommunbidrag (ramtilldelning från kommunfullmäktige)
    │
    ├── Centrala avsättningar (hanteras utanför modellen)
    │
    └── Total budget att fördela
            │
            ├── Grundskola inkl. förskoleklass
            │       ├── Grundersättning (81%) → viktas per årskurs (timplan × insatser)
            │       └── Strukturersättning (19%) → viktas per index × elevantal
            │
            └── Fritidshem
                    ├── Grundersättning (90%) → viktas per åldersgrupp
                    └── Strukturersättning (10%) → viktas per index × elevantal
            │
            = Grundbelopp (brutto) per skola
            │
            ├── Fristående: + 6% moms + 3% administration = Nettobelopp
            │
            └── Kommunal:
                    ├── − Lokalt avdrag (48% av brutto)
                    ├── + Tillägg (skoladmin, likvärdig skola, fritidsavgift)
                    └── = Nettobelopp
```
