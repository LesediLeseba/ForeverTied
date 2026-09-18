# MemorialCode (Pty) Ltd — V1

A South African DeathTech SaaS platform bridging **physical tombstone plaques**
with **digital memorial pages** through weatherproof QR code plates.

Funeral homes pre-order batches of stainless steel plates. Each plate carries a
unique code; when it is bound to a memorial, a visitor who scans it at the grave
site is redirected straight to that person's memorial page.

```
┌──────────────────┐   scan    ┌───────────────────────┐  302  ┌──────────────────────────┐
│ Steel QR plate   │ ────────► │ FastAPI               │ ────► │ React memorial page      │
│ /q/K9X2P7A1      │           │ GET /q/{identifier}   │       │ /memorials/john-doe-1980 │
└──────────────────┘           └───────────┬───────────┘       └────────────┬─────────────┘
                                           │  lookup                        │ GET
                                           ▼                                ▼
                                    PostgreSQL              /api/v1/public/memorials/{slug}
                                    qr_codes ⋈ memorials
```

---

## Core MVP workflow

1. Funeral homes and families arrive at the B2B landing page (`/`).
2. Staff pre-generate a batch of unique physical QR codes (`/admin/plates`).
3. Staff create memorial pages from direct image URLs (`/admin/memorials`).
4. Staff bind an unassigned plate to a memorial record (`/admin/inventory`).
5. A visitor scans the plate → `GET /q/{code}` → **HTTP 302** → the React
   memorial view.

---

## Stack

| Layer      | Technology                                                                 |
| ---------- | -------------------------------------------------------------------------- |
| Frontend   | React 18, Vite 5, TypeScript, React Router v6, TanStack Query, Axios       |
| UI         | Tailwind CSS 3, Shadcn-style primitives on Radix UI, Lucide, Sonner        |
| QR         | `qrcode.react` (canvas render + PNG download for etching)                  |
| Backend    | FastAPI (Python 3.11+), Pydantic v2, SQLAlchemy 2.0 async + `asyncpg`      |
| Migrations | Alembic (async)                                                            |
| Database   | PostgreSQL 13+ (`gen_random_uuid()`, native `qrstatus` enum)                |
| Auth       | **None in V1** — public admin endpoints for fast MVP validation            |

---

## Repository layout

```
backend/
  app/
    api/
      resolver.py               GET /q/{code_identifier}  → 302 redirect
      v1/public/memorials.py    GET /api/v1/public/memorials/{slug}
      v1/admin/memorials.py     POST/GET /api/v1/admin/memorials
      v1/admin/qr_codes.py      batch, list, assign, unassign, status
    core/                       settings + async engine/session
    models/                     SQLAlchemy models (memorials, qr_codes, QRStatus)
    schemas/                    Pydantic v2 request/response models
    services/                   slug allocation, plate generation, binding
    utils/slug.py               slugify + birth-year extraction
  alembic/                      async migration environment
  alembic/versions/0001_…py     initial schema
  scripts/dev_postgres.py       local PostgreSQL without Docker (pgserver)
  scripts/seed.py               demo memorials + plates (idempotent)
  tests/                        59 tests against real PostgreSQL
frontend/
  src/components/ui/            Shadcn primitives (Button, Table, Select, Dialog…)
  src/components/landing/       B2B landing sections
  src/components/admin/         Plate QR card with PNG download
  src/pages/                    LandingPage, MemorialPage, SetupPage, admin/*
  src/hooks/                    TanStack Query hooks + mutations
  src/lib/                      api client, types, design helpers
```

---

## Quick start

### 1. PostgreSQL

Either with Docker:

```bash
cp .env.example .env      # then fill in the database credential in your copy
docker compose up -d
```

The compose file pulls its credentials from that local `.env` via `env_file`, so
no credential value is ever committed. Use the conventional local superuser
credential to match the backend's default `DATABASE_URL`; if you choose something
stronger, update `backend/.env` to match.

…or without Docker (uses the PostgreSQL binaries bundled with `pgserver`):

```bash
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python scripts/dev_postgres.py start     # initdb + start on 127.0.0.1:5432
```

### 2. Backend

```bash
cd backend
cp .env.example .env                    # adjust if your DSN differs
.venv/bin/alembic upgrade head          # create schema
.venv/bin/python scripts/seed.py        # sample memorial + 12 plates
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Swagger UI: <http://localhost:8000/docs>

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                             # http://localhost:5173
```

Vite proxies `/api` and `/q` to `http://127.0.0.1:8000`, so the browser only
ever makes same-origin requests (override the target with `VITE_PROXY_TARGET`).

---

## Scan resolution

Physical plates encode a **static** URL: `{API_BASE_URL}/q/{code_identifier}`.

`GET /q/{code_identifier}`:

| Plate state                                  | Response                                                     |
| -------------------------------------------- | ------------------------------------------------------------ |
| `active` + bound memorial                    | `302` → `{FRONTEND_BASE_URL}/memorials/{slug}`                |
| unknown code                                 | `302` → `{FRONTEND}/setup?code=…&reason=unknown_code`         |
| `unassigned`                                 | `302` → `{FRONTEND}/setup?code=…&reason=unassigned`           |
| `damaged`                                    | `302` → `{FRONTEND}/setup?code=…&reason=damaged`              |

Set `RESOLVER_MISS_MODE=not_found` to return a plain `404` instead of the
`/setup` redirect. Identifiers are matched case-insensitively.

Because the plate only ever stores the resolver URL, the memorial behind it can
be rewritten, re-pointed or retired without re-etching a single plate.

---

## API surface

### Public

| Method | Path                              | Purpose                          |
| ------ | --------------------------------- | -------------------------------- |
| GET    | `/q/{code_identifier}`            | Scan resolver → 302              |
| GET    | `/api/v1/public/memorials/{slug}` | Memorial JSON for the React page |
| GET    | `/api/v1/health`                  | Liveness probe                   |

### Admin (no auth in V1)

| Method | Path                                          | Purpose                                   |
| ------ | --------------------------------------------- | ----------------------------------------- |
| POST   | `/api/v1/admin/qr-codes/batch`                | `{quantity}` → N unique `unassigned` codes |
| GET    | `/api/v1/admin/qr-codes`                      | List plates (`status`, `memorial_id`)      |
| PATCH  | `/api/v1/admin/qr-codes/{code}/assign`        | Bind to `memorial_id` → `active`           |
| PATCH  | `/api/v1/admin/qr-codes/{code}/unassign`      | Release back to the pool                   |
| PATCH  | `/api/v1/admin/qr-codes/{code}/status`        | Flag `damaged` (drops the binding)         |
| POST   | `/api/v1/admin/memorials`                     | Create memorial, auto-slug                 |
| GET    | `/api/v1/admin/memorials`                     | List with bound-plate stats                |
| GET    | `/api/v1/admin/memorials/{id}` `/by-slug/{s}` | Single record                              |

Slug rule: `slugify(deceased_name + "-" + birth_year)` → `john-doe-1980`, with
`-1`, `-2`… appended on collision. Re-binding an already-bound plate returns
`409` unless `{"force": true}` is sent.

---

## Data model

**`memorials`** — `id` UUID PK (`gen_random_uuid()`), `deceased_name` (255),
`slug` (255, unique, indexed), `dates` (100), `biography` (text),
`photo_url` (1000, nullable), `created_at` timestamptz.

**`qr_codes`** — `id` UUID PK, `code_identifier` (12, unique, indexed),
`status` enum `qrstatus('unassigned'|'active'|'damaged')` default `unassigned`,
`memorial_id` UUID FK → `memorials.id` (`ON DELETE SET NULL`, nullable),
`created_at` timestamptz.

---

## Design system — "Organic & Earthy / Archival"

| Token           | Value     | Token          | Value     |
| --------------- | --------- | -------------- | --------- |
| Background      | `#FDFBF7` | Text primary   | `#1A1A1C` |
| Surface         | `#FFFFFF` | Text secondary | `#5C5C5A` |
| Primary         | `#1B2A26` | Border         | `#E5E1DA` |
| Primary hover   | `#2C403B` | Secondary      | `#E4DFD6` |

Type: **Cormorant Garamond** (headings) + **Manrope** (body), loaded from Google
Fonts in `index.html`.

* Public pages (`/`, `/memorials/:slug`, `/setup`) are hand-built Tailwind —
  high contrast for sunlight reading, generous `p-8`–`p-12` spacing, arch-shaped
  portrait (`rounded-t-[50%]`) and a 10% stone-grain overlay. No Shadcn Cards.
* Admin (`/admin/*`) uses Shadcn primitives on Radix: radii capped at 8px, flat
  1px-bordered surfaces, no heavy shadows, Sonner toasts.
* Every interactive element in the admin carries a kebab-case `data-testid`
  (e.g. `create-memorial-btn`, `generate-batch-btn`, `qr-code-row`,
  `assign-plate-select`).

---

## Testing

Backend (59 tests, real PostgreSQL, real Alembic migration):

```bash
cd backend
.venv/bin/python -m pytest -q
```

Creates/drops into a dedicated `memorialcode_test` database, so the dev data is
untouched. Override with `MEMORIALCODE_TEST_DB`.

Frontend (24 tests, Vitest + Testing Library, plus `tsc` typecheck):

```bash
cd frontend
npm run test
npm run typecheck
npm run build
```

Coverage includes the landing page structure, the public memorial view (fetch,
portrait fallback, 404 state), the plate grid and batch validation, the
inventory damage-confirmation dialog, and the mutation hooks.

> Known gap: Radix `Select` renders its options in a portal that never mounts
> under jsdom (and deadlocks teardown), so the assign dropdown is exercised at
> the hook/API layer (`useAdminData.test.tsx`) rather than through a simulated
> pointer interaction. Browser-level E2E (Playwright) is the right place to
> cover that click path.

---

## V1 limitations (deliberate)

* **No authentication** on the admin API — the console is intended for internal
  staff networks during MVP validation.
* **Media by URL only** — no upload pipeline; paste an Unsplash or hosted URL.
* **One memorial per page** — galleries, tributes and audio are V2 scope.
* No pagination UI in the admin tables (API supports `limit`/`offset`).
