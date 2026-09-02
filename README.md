# WeekFlow — Weekly Report Generator & Team Dashboard

WeekFlow is a production-oriented full-stack application for creating structured weekly reports, reviewing correction cycles, preserving submitted versions, and analyzing team delivery. All UI data comes from the REST API and PostgreSQL—there is no mock application state.

## Features

- JWT login/registration, bcrypt password hashes, active-account enforcement, and server-side RBAC
- Draft → Submitted → Needs Correction → resubmitted → Approved workflow
- Atomic report snapshot creation on every submission and version-linked review history
- Member dashboard/history, dynamic report form, correction feedback, and read-only submitted reports
- Manager filtering, review page, team profiles, cross-team blocker/achievement view, and five data-driven charts
- Project soft-deactivation and admin user role/status management
- Zod validation, centralized errors, Helmet/CORS, ownership checks, and Supertest RBAC coverage

## Stack and architecture

React 19, TypeScript, Vite, Tailwind CSS, React Router, Axios, Recharts, React Hot Toast; Node.js, Express 5, TypeScript, Zod, JWT, bcrypt; PostgreSQL and Prisma ORM; Vitest and Supertest. See [architecture](docs/ARCHITECTURE.md), [API](docs/API.md), and [ER diagram](docs/ER_DIAGRAM.md).

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

## Verification commands

```bash
cd server
npm test
npm run build
npx prisma validate

cd ../client
npm run build
```

## Demo accounts

All seeded accounts use `Password123!` (development only): `admin@example.com`, `manager@example.com`, and `member1@example.com` through `member4@example.com`.

## API, RBAC, and workflow

The bearer JWT contains only `userId` and `role`. `authenticate` verifies it; `authorizeRoles` gates role-only endpoints. Report services additionally enforce object ownership, so changing an ID cannot expose another member's report. Managers can alter only review state/comments and never report content.

Every submit/resubmit transaction writes an immutable JSON snapshot with the next version number and changes the status to `SUBMITTED`. Every review transaction creates a review linked to that exact version, changes status, and writes an activity entry. Requesting changes requires a comment.

## Screenshots

Capture the seeded member dashboard, manager charts, review/version view, and report form for submission materials.

## Deployment

Build both packages, run `prisma migrate deploy` during release, serve `server/dist/server.js`, and host `client/dist` on a static host. Configure HTTPS, a restricted `CLIENT_URL`, managed PostgreSQL, a rotated `JWT_SECRET`, and platform environment variables. The optional Gemini key is reserved but AI is not included in this core build.
