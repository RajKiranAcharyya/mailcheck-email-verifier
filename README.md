# MailCheck – Email Verification Tool (Full Stack)

[![CI](https://github.com/RajKiranAcharyya/mailcheck-email-verifier/actions/workflows/ci.yml/badge.svg)](https://github.com/RajKiranAcharyya/mailcheck-email-verifier/actions)

> Full-stack email verification platform: syntax, disposable-domain, role-based and MX-record checks with a risk score, typo suggestions, two-level domain caching, CSV bulk upload/export, and an interactive Next.js dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend API** | Node.js · TypeScript · Express |
| **Frontend** | Next.js 14 · React · Tailwind CSS |
| **Database** | SQLite (via Knex query builder) |
| **Documentation** | Swagger / OpenAPI 3.0 |
| **Testing** | Jest · Supertest (52 tests across 9 suites) |
| **Infrastructure** | Docker · Docker Compose · GitHub Actions CI |

---

## Key Features

### Email Verification Engine
- **Syntax validation** – RFC 5322 compliant with length, TLD and formatting checks
- **Disposable domain detection** – 57,700+ known throwaway providers loaded at startup
- **Role-based detection** – Identifies generic departmental mailboxes (admin, support, billing, noreply…)
- **MX record lookup** – Live DNS MX resolution with A-record fallback per RFC 5321
- **Typo suggestions** – Levenshtein-distance matching against popular providers (Gmail, Yahoo, Outlook…)
- **Risk scoring** – Composite 0–100 score combining all check signals

### Two-Level Domain Cache (Memory + SQLite, 24-hour TTL)
- **Level 1 (In-Memory)** – Sub-millisecond Map lookup for repeat domains
- **Level 2 (SQLite DB)** – Persistent cache survives restarts; repopulates L1 on hit
- **24-hour TTL** – Auto-expiry with background cleanup
- **Proven by unit tests** – Dedicated test suite verifies L1 hit, L2 fallback, TTL expiry, and DNS call reduction

### Asynchronous Bulk Jobs
- **CSV upload** – Auto-detects email column from header row
- **Limited concurrency** – Configurable worker pool (default 5) using `p-limit`
- **Progress endpoint** – Polled by the UI every 1.5 seconds for live updates
- **Startup recovery** – On boot, marks any pending/processing jobs as `interrupted` to prevent ghost workers
- **CSV export** – Download verified results for the entire job

### API & Documentation
- **REST API** with structured JSON error responses (`{ success, error: { code, message, details } }`)
- **Zod validation** middleware on every endpoint
- **Rate limiting** via `express-rate-limit` (configurable window and max)
- **Swagger UI** mounted at `/api-docs` documenting every endpoint

### Frontend
- **Code-split** paginated results table via `next/dynamic` for smaller initial bundle
- **Tab-based** single/bulk verification interface
- **Live job progress** with auto-polling and summary counters
- **Status filter + pagination** on bulk results table
- **Typo suggestion banner** with one-click "Apply Fix" re-verification

---

## Project Structure

```
mailcheck-email-verifier/
├── backend/
│   ├── src/
│   │   ├── controllers/       # Express route handlers
│   │   ├── database/          # Knex config, migrations
│   │   ├── middleware/         # Rate limiter, Zod validator, error handler
│   │   ├── routes/            # Verify & job route definitions (with OpenAPI JSDoc)
│   │   ├── schemas/           # Zod validation schemas
│   │   ├── services/          # Verification, DNS, cache, disposable, role, typo, job
│   │   ├── swagger/           # Swagger/OpenAPI setup
│   │   ├── types/             # TypeScript interfaces
│   │   ├── app.ts             # Express app factory
│   │   └── server.ts          # Entry point (migrations + startup recovery)
│   ├── tests/                 # 9 Jest test suites (52 tests)
│   ├── data/                  # 57,700+ disposable domains list
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/               # Next.js App Router (layout, page, globals.css)
│   │   ├── components/        # Header, SingleVerifyCard, BulkVerifyCard, PaginatedResultsTable, RiskGauge
│   │   └── lib/               # API client
│   └── package.json
├── .github/workflows/ci.yml   # GitHub Actions CI pipeline
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── README.md
```

---

## Quick Start

### Prerequisites
- **Node.js** v20+
- **npm** v9+

### 1. Backend

```bash
cd backend
npm install
npm run migrate          # Apply SQLite migrations
npm run dev              # Starts on http://localhost:5000
```

| Endpoint | URL |
|---|---|
| Health Check | `http://localhost:5000/health` |
| Swagger Docs | `http://localhost:5000/api-docs` |

### 2. Frontend

```bash
cd frontend
npm install
npm run dev              # Starts on http://localhost:3000
```

### 3. Docker Compose (Full Stack)

```bash
docker compose up --build
```

Backend on `:5000`, frontend on `:3000`.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/verify` | Verify single email (JSON body) |
| `GET` | `/api/verify?email=...` | Verify single email (query param) |
| `POST` | `/api/verify/batch` | Verify up to 25 emails synchronously |
| `POST` | `/api/jobs` | Create bulk job from JSON email array |
| `POST` | `/api/jobs/upload` | Create bulk job from CSV file upload |
| `GET` | `/api/jobs/:id` | Poll job progress (UI polling endpoint) |
| `GET` | `/api/jobs/:id/items` | Paginated job results with status filter |
| `GET` | `/api/jobs/:id/export` | Download verified results as CSV |
| `GET` | `/health` | Service health check |
| `GET` | `/api-docs` | Interactive Swagger documentation |

---

## Tests

```bash
cd backend
npm test
```

**52 tests across 9 suites:**

| Suite | Tests | Covers |
|---|---|---|
| `syntax.test.ts` | 10 | RFC 5322 validation, edge cases |
| `disposable.test.ts` | 5 | 57k+ domain detection, subdomains |
| `role.test.ts` | 4 | Role-based mailbox identification |
| `typo.test.ts` | 5 | Levenshtein distance suggestions |
| `cache.test.ts` | 6 | Two-level cache L1/L2, TTL, DNS cut |
| `riskScore.test.ts` | 6 | Composite scoring & status mapping |
| `startupRecovery.test.ts` | 2 | Crash recovery for interrupted jobs |
| `jobQueue.test.ts` | 3 | Bulk jobs, pagination, CSV export |
| `api.test.ts` | 11 | Full REST endpoint integration tests |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | API server port |
| `NODE_ENV` | `development` | Environment mode |
| `DATABASE_FILE` | `./dev.sqlite3` | SQLite database path |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX` | `1000` | Max requests per window |
| `JOB_CONCURRENCY` | `5` | Bulk job worker concurrency |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Backend API base URL |

---

## Deployment

- **Backend** → Deploy on [Render](https://render.com) (Node.js web service)
- **Frontend** → Deploy on [Vercel](https://vercel.com) (Next.js)
- **CI** → GitHub Actions runs tests on every push and PR

---

## License

MIT
