# Architecture

## Request path

```text
React page → shared Axios client → Express route → controller → service → Prisma → PostgreSQL
```

Pages own presentation/loading state. The auth context owns the session; the Axios interceptor attaches the bearer token and clears an expired session. Routes apply authentication and role middleware. Controllers parse HTTP input and services contain workflow, ownership, transaction, and aggregation logic. Prisma is the only persistence layer.

## Authentication and authorization

Login compares a bcrypt hash and signs an eight-hour JWT containing `userId` and `role`. `authenticate` validates the signature and reloads the current role/active state from PostgreSQL on every protected request, so deactivation and role changes take effect immediately. `authorizeRoles` handles coarse permissions, while `report.service.ts` handles object-level member ownership. Admin self-role change and self-deactivation are blocked.

## Report workflow and versioning

Only owners edit `DRAFT` and `NEEDS_CORRECTION`; `SUBMITTED` and `APPROVED` are immutable. Only managers/admins review `SUBMITTED`. A correction comment is mandatory. Submission uses a Prisma transaction to store a complete JSON snapshot, increment the report version, update status, and log activity. Review uses another transaction to link its decision/comment to the current version and update status. This makes each correction cycle auditable.

## Analytics

The manager dashboard service reads related team report data once and returns a purpose-built response: summary, completed-task trend, per-member status, project task distribution, work-type hours, and activity. The browser never downloads the full report archive merely to derive charts. For very large installations, these reductions can move to PostgreSQL `groupBy`/materialized views without changing the response contract.

## Data integrity and dates

Relational child sections cascade when a report is removed; projects referenced by reports are deactivated instead of deleted. A unique key prevents duplicate user/project/week reports. ISO date-only week boundaries are stored as PostgreSQL `DATE`; timestamps remain UTC and the UI localizes them for display.

## AI manager assistant

The manager-only `/api/ai/chat` endpoint retrieves up to 60 recent non-draft reports before calling Gemini. The service constructs compact context containing names, projects, week dates, workflow status, work details, blockers, achievements, and hours. Password hashes, emails, links, database IDs, and draft reports are excluded. Report text is explicitly treated as untrusted data in the system instruction.

The model must answer only from supplied context and acknowledge missing evidence. A low temperature favors repeatable summaries. Missing configuration returns `AI assistant is not configured.` without affecting core features. The browser never receives the Gemini key; only Express calls Google.
