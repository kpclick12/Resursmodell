# Spec: Gothenburg Primary School Resource Allocation Calculator

## Overview

A password-protected web application that calculates and visualizes how financial resources are distributed across primary schools (grundskolor) in Gothenburg — both municipal (kommunala) and independent (fristående) schools. The app implements Gothenburg's actual resource distribution model (including socioeconomic weighting) and allows users to upload school data via CSV, adjust key parameters, and export results.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python with FastAPI |
| Frontend | React (Vite) |
| Styling | Tailwind CSS |
| Auth | Simple password protection (env-var based, JWT token in session) |
| Data | CSV upload, in-memory processing |
| Export | CSV download via browser |

---

## Authentication

- Single shared password (configured via environment variable `APP_PASSWORD`)
- On correct entry, a JWT token is stored in session/localStorage with a configurable TTL (e.g. 24h)
- All pages/routes require valid token — redirect to login if missing or expired
- No user management, no registration; single-user or shared-team use

---

## Pages & Navigation

The app has a top navigation bar with four pages:

1. **Landing** (`/`)
2. **Parameters** (`/parameters`)
3. **Summary** (`/summary`)
4. **School Tables** (`/tables`)

---

## Page 1: Landing Page (`/`)

Purpose: Explain what the app does and guide the user to get started.

**Content:**
- App name and a short tagline
- Description of Gothenburg's resource distribution model and why transparency matters
- What the app enables:
  - Upload school data
  - Adjust distribution parameters
  - View aggregated summaries
  - Inspect per-school allocations for both municipal and independent schools
  - Export results as CSV
- A "Get started" button that links to `/parameters`
- Brief note on data privacy (data is processed in-memory, not stored)

---

## Page 2: Parameters (`/parameters`)

Purpose: Configure the calculation model and upload school data.

### Section A – CSV Upload

- Upload button for a CSV file containing school data
- Expected CSV columns (displayed to user):
  - `school_name` (string)
  - `school_type` (string: `kommunal` or `fristående`)
  - `num_students` (integer)
  - `socioeconomic_index` (float, 0–1 scale or raw score — configurable)
  - *(optional)* `district` (string)
- After upload: preview table showing first 5 rows and total row count
- Validation errors displayed inline (missing columns, wrong types, etc.)

### Section B – Base Amount (Grundbelopp)

Editable fields for base per-pupil amounts (SEK/year):

| Parameter | Description |
|---|---|
| `base_amount_per_pupil` | Base allocation per pupil regardless of school type |
| `municipal_supplement` | Additional amount for municipal schools (if applicable) |

### Section C – Socioeconomic Weighting

Configure how the socioeconomic index affects allocation:

| Parameter | Description |
|---|---|
| `socioeconomic_weight` | Multiplier applied to index (e.g. 0.0 = disabled, 1.0 = full weight) |
| `max_socioeconomic_supplement` | Cap in SEK per pupil for socioeconomic addition |
| `index_scale` | Define the input scale of the index (e.g. 0–100 or 0–1) |

The formula used:

```
socioeconomic_addition = min(
    (socioeconomic_index / index_scale) * socioeconomic_weight * base_amount_per_pupil,
    max_socioeconomic_supplement
)

total_per_pupil = base_amount_per_pupil + socioeconomic_addition
total_allocation = total_per_pupil * num_students
```

### Section D – Actions

- **Calculate** button: runs the allocation model and stores results in app state
- Success/error toast notification after calculation
- Results persist in state during the session as the user navigates between pages

---

## Page 3: Summary (`/summary`)

Purpose: Provide a high-level overview of the resource distribution.

**Requires:** Calculation results to be available (otherwise show prompt to go to Parameters).

**Content:**

- Total budget allocated (all schools combined, SEK)
- Total number of schools (municipal vs. independent breakdown)
- Total number of pupils (municipal vs. independent)
- Average allocation per pupil (overall, municipal, independent)
- Minimum and maximum allocation per school
- Share of total budget going to independent schools (%)
- Socioeconomic supplement total (SEK and % of total budget)

Displayed using clear stat cards and optionally a simple bar or pie chart (e.g. budget split by school type).

---

## Page 4: School Tables (`/tables`)

Purpose: Show per-school allocation details in two separate tables.

**Requires:** Calculation results to be available.

### Table: Municipal Schools (Kommunala skolor)

Columns:
- School name
- District (if available)
- Number of pupils
- Socioeconomic index
- Socioeconomic supplement per pupil (SEK)
- Total per pupil (SEK)
- Total allocation (SEK)

### Table: Independent Schools (Fristående skolor)

Same columns as above.

### Table Features

- Sortable columns (click header)
- Search/filter field above each table (filter by school name)
- Row count shown below table
- **Download CSV button** per table — exports currently visible (filtered) rows as a `.csv` file with a timestamped filename, e.g. `kommunala_skolor_2024-11-01.csv`

---

## API Endpoints (FastAPI backend)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Validate password, return JWT |
| `POST` | `/api/upload` | Upload and validate CSV, return parsed school data |
| `POST` | `/api/calculate` | Accept parameters + school data, return allocation results |

All endpoints except `/api/auth/login` require `Authorization: Bearer <token>` header.

### `/api/calculate` – Request Body

```json
{
  "schools": [...],
  "parameters": {
    "base_amount_per_pupil": 85000,
    "municipal_supplement": 0,
    "socioeconomic_weight": 0.3,
    "max_socioeconomic_supplement": 15000,
    "index_scale": 100
  }
}
```

### `/api/calculate` – Response Body

```json
{
  "summary": { ... },
  "schools": [
    {
      "school_name": "...",
      "school_type": "kommunal",
      "num_students": 320,
      "socioeconomic_index": 42.5,
      "socioeconomic_addition_per_pupil": 5400,
      "total_per_pupil": 90400,
      "total_allocation": 28928000
    }
  ]
}
```

---

## Data Handling & Privacy

- All uploaded data is processed in-memory on the backend — nothing is written to disk or stored in a database
- Data is not persisted between sessions
- The backend does not log uploaded content

---

## Non-Functional Requirements

- Responsive layout (desktop-first, but usable on tablet)
- Error states for all async operations (upload, calculate)
- Loading indicators during API calls
- The app should clearly communicate when no data has been loaded yet (empty states on Summary and Tables pages)
- Environment variables for: `APP_PASSWORD`, `JWT_SECRET`, `JWT_TTL_HOURS`

---

## Out of Scope (v1)

- Multi-year comparisons
- User accounts or role-based access
- Direct integration with Skolverket API
- Map visualization
- Support for school types other than grundskola
