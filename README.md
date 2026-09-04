# WeekFlow — Weekly Report Generator & Team Dashboard

WeekFlow is a production-oriented full-stack application for creating structured weekly reports, reviewing correction cycles, preserving submitted versions, and analyzing team delivery. All UI data comes from the REST API and PostgreSQL—there is no mock application state.

## Features

- JWT login/registration, bcrypt password hashes, active-account enforcement, and server-side RBAC
- Draft → Submitted → Needs Correction → resubmitted → Approved workflow
- Atomic report snapshot creation on every submission and version-linked review history
- Member dashboard/history, dynamic report form, correction feedback, and read-only submitted reports
- Manager filtering, review page, team profiles, cross-team blocker/achievement view, and five data-driven charts
- Project soft-deactivation, member assignments, and admin user role/status management
- Optional manager-only Gemini assistant grounded in privacy-filtered report data
- Zod validation, centralized errors, Helmet/CORS, ownership checks, and Supertest RBAC coverage

## Screenshots

### Manager dashboard

![WeekFlow manager dashboard](<docs/images/Manager dashboard.png>)

### Team member reports

![WeekFlow team member reports](<docs/images/Team member-my reports.png>)

## Stack and architecture

React 19, TypeScript, Vite, Tailwind CSS, React Router, Axios, Recharts, React Hot Toast; Node.js, Express 5, TypeScript, Zod, JWT, bcrypt; PostgreSQL and Prisma ORM; Vitest and Supertest. See [architecture](docs/ARCHITECTURE.md), [API](docs/API.md), and the [ER diagram](docs/ER_DIAGRAM_CHEN.md).

```text
client/src  → pages, reusable components, auth context, Axios client
server/src  → routes → controllers → services → Prisma/PostgreSQL
server/prisma → schema, SQL migrations, realistic seed
docs        → architecture, API reference, and ER diagram
```

## Setup instructions

Prerequisites: Node.js 20+, npm, and PostgreSQL 15+ (local or hosted).

### 1. Install dependencies

```bash
npm install
npm run install:all
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Clone the repository first, open a terminal in its root directory, and run the commands above. Update `server/.env` with your PostgreSQL connection details and a long random `JWT_SECRET`. If the database URL already has query parameters, append `&schema=public`; otherwise append `?schema=public`. Set `client/.env` to the backend API URL when it differs from the local default.

### 2. Run the database

Start your PostgreSQL service or create a hosted PostgreSQL database. For example, a local PostgreSQL installation with the command-line tools available can create the database with:

```bash
createdb weekflow
```

Set `DATABASE_URL` and, when applicable, `DIRECT_URL` in `server/.env`, then apply the committed migrations from the repository root:

```bash
cd server
npx prisma generate
npx prisma migrate deploy
```

Optionally populate a new, disposable development database with the demo dataset. The seed replaces all existing WeekFlow application data and cannot run when `NODE_ENV=production`.

Bash/macOS:

```bash
ALLOW_DEMO_RESET=true npx prisma db seed
```

PowerShell:

```powershell
$env:ALLOW_DEMO_RESET="true"
npx prisma db seed
Remove-Item Env:ALLOW_DEMO_RESET
```

### 3. Run the backend

From the repository root, run:

```bash
npm run dev --prefix server
```

The API runs at `http://localhost:5000` by default. Confirm it at `http://localhost:5000/api/health`.

### 4. Run the frontend

In a second terminal, from the repository root, run:

```bash
npm run dev --prefix client
```

Open `http://localhost:5173` in a browser.

## Verification commands

Run these commands from the repository root:

```bash
npm run lint
npm test
npm run build
cd server
npx prisma validate
```

## Environment variables

| Variable | Required | Purpose |
|---|---:|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma |
| `DIRECT_URL` | Hosted DBs | Direct PostgreSQL connection for migrations; Neon direct host omits `-pooler` |
| `JWT_SECRET` | Yes | Long random secret used to sign authentication tokens |
| `NODE_ENV` | No | Runtime mode; defaults to `development` |
| `PORT` | No | Express port; defaults to `5000` |
| `CLIENT_URL` | No | Allowed browser origin; defaults to `http://localhost:5173` |
| `GEMINI_API_KEY` | No | Enables the manager AI assistant |
| `GEMINI_MODEL` | No | Gemini model; defaults to `gemini-3.1-flash-lite` |
| `ALLOW_DEMO_RESET` | Seed only | Must be explicitly set to `true` to replace all WeekFlow application data; the seed always refuses to run when `NODE_ENV=production` |
| `VITE_API_URL` | Production | Browser-visible REST API base URL; local development defaults to `http://localhost:5000/api` |

## Demo accounts

All seeded accounts use the development-only password `Password123!`.

| Role | Name | Email |
|---|---|---|
| Admin | System Admin | `admin@example.com` |
| Manager | Sarah Fernando | `manager@example.com` |
| Team member | Dhanuka Naveen | `member1@example.com` |
| Team member | Kasun Perera | `member2@example.com` |
| Team member | Nimal Silva | `member3@example.com` |
| Team member | Amali Fernando | `member4@example.com` |
| Team member | Tharindu Jayasinghe | `member5@example.com` |

## API, RBAC, and workflow

The bearer JWT contains only `userId` and `role`. `authenticate` verifies it; `authorizeRoles` gates role-only endpoints. Report services additionally enforce object ownership, so changing an ID cannot expose another member's report. Managers can alter only review state/comments and never report content.

Every submit/resubmit transaction writes an immutable JSON snapshot with the next version number and changes the status to `SUBMITTED`. Every review transaction creates a review linked to that exact version, changes status, and writes an activity entry. Requesting changes requires a comment.

Managers and admins assign team members to projects. Members receive only their active assigned projects and the server rejects new drafts for unassigned projects. Removing an assignment never deletes historical reports; a correction-required report can still be completed under its original project.

## AI assistant setup and privacy

The AI Manager Assistant is optional and never affects core reporting. Create a Gemini API key in Google AI Studio and configure the server only:

```env
GEMINI_API_KEY="your-key"
GEMINI_MODEL="gemini-3.1-flash-lite"
```

The server provides dedicated, deterministic database answers for previous-week activity, the all-history development-time leader, key open blockers, and reports currently awaiting review. Other questions—including the suggested generated team summary—use Gemini with compact all-history aggregates plus up to 60 recent non-draft reports. Emails, passwords, links, database identifiers, drafts, and future reporting weeks are excluded. The system prompt treats report content as untrusted data, requires grounded answers with an explicit time/team scope, and uses a low temperature. Up to 10 recent chat messages provide follow-up context. Gemini must return the same fixed JSON answer shape, which the server validates with Zod before the UI renders it. The Gemini key remains server-side. Free-tier data handling may differ from paid-tier handling, so production deployments should review Google's current terms and privacy controls.

## Deployment

Build both packages, run `prisma migrate deploy` during release, serve `server/dist/server.js`, and host `client/dist` on a static host. Configure HTTPS, a restricted `CLIENT_URL`, managed PostgreSQL, a rotated `JWT_SECRET`, and platform environment variables. Set `GEMINI_API_KEY` to enable the manager assistant and optionally set `GEMINI_MODEL`; without a key, all core functionality remains available.

Because the client uses browser-history routing, configure the static host to rewrite unknown routes to `client/dist/index.html`. Without this SPA fallback, refreshing a direct URL such as `/reports/:id` can return the host's 404 page.
