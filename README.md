# WeekFlow — Weekly Report Generator & Team Dashboard

WeekFlow is a production-oriented full-stack application for creating structured weekly reports, reviewing correction cycles, preserving submitted versions, and analyzing team delivery. All UI data comes from the REST API and PostgreSQL—there is no mock application state.

## Features

- JWT login/registration, bcrypt password hashes, active-account enforcement, and server-side RBAC
- Draft → Submitted → Needs Correction → resubmitted → Approved workflow
- Atomic report snapshot creation on every submission and version-linked review history
- Member dashboard/history, dynamic report form, correction feedback, and read-only submitted reports
- Manager filtering, review page, team profiles, cross-team blocker/achievement view, and five data-driven charts
- Project soft-deactivation and admin user role/status management
- Optional manager-only Gemini assistant grounded in privacy-filtered report data
- Zod validation, centralized errors, Helmet/CORS, ownership checks, and Supertest RBAC coverage

## Stack and architecture

React 19, TypeScript, Vite, Tailwind CSS, React Router, Axios, Recharts, React Hot Toast; Node.js, Express 5, TypeScript, Zod, JWT, bcrypt; PostgreSQL and Prisma ORM; Vitest and Supertest. See [architecture](docs/ARCHITECTURE.md), [API](docs/API.md), [ER diagram](docs/ER_DIAGRAM.md), and the [requirements checklist](docs/REQUIREMENTS_CHECKLIST.md).

```text
client/src  → pages, reusable components, auth context, Axios client
server/src  → routes → controllers → services → Prisma/PostgreSQL
server/prisma → schema, SQL migration, realistic seed
docs        → architecture, API, presentation, demo, live-coding guide
```

## Local setup

Prerequisites: Node.js 20+, npm, and PostgreSQL 15+.

```bash
git clone <repository-url>
cd WeekFlow
cp server/.env.example server/.env
cp client/.env.example client/.env
cd server
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

In another terminal:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`. Update `DATABASE_URL` and use a long random `JWT_SECRET` in `server/.env`. The backend defaults to port 5000; `VITE_API_URL` defaults to `http://localhost:5000/api`.

For an existing hosted database such as Neon, apply committed migrations with:

```bash
cd server
npx prisma migrate deploy
npx prisma db seed
```

## Verification commands

```bash
cd server
npm test
npm run build
npx prisma validate

cd ../client
npm run build
```

## Environment variables

| Variable | Required | Purpose |
|---|---:|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma |
| `DIRECT_URL` | Hosted DBs | Direct PostgreSQL connection for migrations; Neon direct host omits `-pooler` |
| `JWT_SECRET` | Yes | Long random secret used to sign authentication tokens |
| `PORT` | No | Express port; defaults to `5000` |
| `CLIENT_URL` | No | Allowed browser origin; defaults to `http://localhost:5173` |
| `GEMINI_API_KEY` | No | Enables the manager AI assistant |
| `GEMINI_MODEL` | No | Gemini model; defaults to `gemini-3.1-flash-lite` |
| `VITE_API_URL` | Yes | Browser-visible REST API base URL |

## Demo accounts

All seeded accounts use `Password123!` (development only): `admin@example.com`, `manager@example.com`, and `member1@example.com` through `member4@example.com`.

## API, RBAC, and workflow

The bearer JWT contains only `userId` and `role`. `authenticate` verifies it; `authorizeRoles` gates role-only endpoints. Report services additionally enforce object ownership, so changing an ID cannot expose another member's report. Managers can alter only review state/comments and never report content.

Every submit/resubmit transaction writes an immutable JSON snapshot with the next version number and changes the status to `SUBMITTED`. Every review transaction creates a review linked to that exact version, changes status, and writes an activity entry. Requesting changes requires a comment.

## AI assistant setup and privacy

The AI Manager Assistant is optional and never affects core reporting. Create a Gemini API key in Google AI Studio and configure the server only:

```env
GEMINI_API_KEY="your-key"
GEMINI_MODEL="gemini-3.1-flash-lite"
```

The server recognizes the four suggested questions and returns verified structured answers directly from deterministic database queries: explicit previous-week reports, all-history work-hour totals, currently open blockers, or valid current/past reports whose current status is `SUBMITTED`. Other questions use Gemini with compact all-history aggregates plus up to 60 recent non-draft reports. Emails, passwords, links, database identifiers, drafts, and future reporting weeks are excluded. The system prompt treats report content as untrusted data, requires grounded answers with an explicit time/team scope, and uses a low temperature. Up to 10 recent chat messages provide follow-up context. Gemini must return the same fixed JSON answer shape, which the server validates with Zod before the UI renders it. The Gemini key remains server-side. Free-tier data handling may differ from paid-tier handling, so production deployments should review Google's current terms and privacy controls.

## Screenshots

Capture the seeded member dashboard, manager charts, review/version view, and report form for submission materials.

## Deployment

Build both packages, run `prisma migrate deploy` during release, serve `server/dist/server.js`, and host `client/dist` on a static host. Configure HTTPS, a restricted `CLIENT_URL`, managed PostgreSQL, a rotated `JWT_SECRET`, and platform environment variables. Set `GEMINI_API_KEY` to enable the manager assistant and optionally set `GEMINI_MODEL`; without a key, all core functionality remains available.
