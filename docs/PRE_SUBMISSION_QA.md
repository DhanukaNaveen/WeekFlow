# Pre-submission QA report

Audit date: 2026-09-04

## Verification summary

- Production build: PASS (server TypeScript and client Vite build)
- ESLint: PASS
- Automated tests: PASS, 26 passed and 0 failed
- Prisma schema validation: PASS
- Migration status: PASS, 5 committed migrations applied
- Fresh migration and seed: PASS in an isolated temporary Neon schema; cleanup verified
- Live API regression: PASS for authentication, RBAC, report correction workflow, version history, dashboard calculations, filtering, pagination, malformed input, and duplicate requests
- Browser automation: NOT RUN because no browser runtime was available in the audit environment

## Fixed defects

| Severity | Issue and reproduction | Root cause | Fix and retest |
|---|---|---|---|
| HIGH | A manager calling `GET /api/users` could see manager/admin accounts and could request their profiles. | The manager and admin paths shared an unrestricted user service query. | Manager lists are now restricted to `TEAM_MEMBER`; non-member profiles return 404. Verified against the live API and automated tests. |
| HIGH | Simultaneous submit or review calls could both pass the initial status check and create duplicate workflow history. | Status validation happened before the transaction without an atomic conditional claim. | Edit, submit, and review transactions now claim the expected status and `updatedAt`; stale/duplicate calls return 409. Live double-click regression returned 200/409 and created only the intended versions/reviews. |
| HIGH | Malformed JSON and oversized bodies could reach the generic 500 handler. | Express parser errors were not mapped separately. | Parser failures now return clear 400/413 responses. Verified through live raw HTTP requests and an automated malformed-JSON test. |
| MEDIUM | Paginating reports with equal week dates produced a duplicate and omitted another record. | Sorting used only `weekStartDate`, so tied rows had nondeterministic order. | Added stable ID tie-breakers to report, profile, and section pagination. Live four-page traversal returned 19/19 unique IDs. |
| MEDIUM | A report date range constrained only `weekStartDate`; a report ending outside the range could be included. | The end filter was applied to the start-date column. | Start now filters `weekStartDate >=`; end filters `weekEndDate <=`. Combined live-filter verification returned zero violations. |
| MEDIUM | New reports could bypass the UI and submit non-Monday/Sunday weeks. | The invariant existed only in the client. | New reports and changed dates are server-validated as Monday through Sunday. Unchanged legacy dates remain editable for correction compatibility. |
| MEDIUM | Seeded historical reports all received the current timestamp, inflating “Submitted this week.” | Seed timestamps used `new Date()` rather than the represented report week. | Seed submissions, versions, approvals, and reviews now use their report week. Fresh isolated seed verification passed. |
| LOW | A historical version could display a renamed/current project rather than its submitted project name. | Version snapshots stored only `projectId`. | New snapshots include the submitted project identity, and the detail renderer uses it with backward-compatible fallback. |
| LOW | Validation errors attempted to scroll the window although the application uses an independently scrolling `<main>`. | The wrong scroll container was targeted. | Validation now scrolls the main content region. |

No CRITICAL defects were found. No HIGH defects remain open.

## Security and workflow evidence

- Passwords are bcrypt hashes and are not returned by authentication/user responses.
- JWT signatures are checked, and every protected request reloads the current database role and active state.
- Member access to another member's report: 403.
- Member access to manager/admin endpoints and review actions: 403.
- Manager attempts to rewrite member report content or perform admin actions: 403.
- Inactive account login: 403; an existing inactive-account token: 401.
- Invalid token: 401.
- Draft -> submit -> correction -> edit -> resubmit -> approve completed live.
- Submitted/approved member edits returned 409.
- Versions 1 and 2 remained available; the correction review referenced version 1.
- Duplicate submit, correction, and approval requests each produced one success and one 409.

## Dashboard, filters, and pagination

Dashboard summary values matched an independent Prisma calculation exactly. Task trend, status-by-member, workload-by-project, time-by-work-type, and submission-overview series contained no `NaN`, `undefined`, or non-finite numeric values. Combined member/project/status/date filtering returned no out-of-scope records. Pagination returned every report once after stable ordering was added.

## Requirement audit

| Requirement | Status | Evidence |
|---|:---:|---|
| Authentication and safe passwords | PASS | Live success/failure/inactive tests; bcrypt and safe selects inspected |
| Team member, manager, and admin roles | PASS | Route middleware, current-role reload, object ownership, and live direct API tests |
| Weekly report create/edit/submit | PASS | Live isolated report with all repeatable sections and server validation |
| Review and correction cycle | PASS | Full live correction/resubmission/approval regression |
| Immutable report versions | PASS | Live versions 1/2 plus automated creation/resubmission coverage |
| Manager dashboard and charts | PASS | Independent database reconciliation and finite-series checks |
| Report filtering and pagination | PASS | Server-side filters, stable ordering, counts, and live multi-page traversal |
| Project management and assignments | PASS | Live temporary project assignment and member-scoped project retrieval |
| Seven or more routed pages | PASS | Public, member, manager, admin, section, and AI routes inspected and built |
| Real backend/database data | PASS | Express/Prisma/PostgreSQL paths exercised live; no mock UI data |
| Seed data | PASS | Fresh isolated 5-migration seed: 6 users, 16 reports, all statuses, valid weeks, versions, reviews |
| RBAC automated test | PASS | Included within 26-test Supertest/Vitest suite |
| Documentation and ER diagram | PASS | README, API, architecture, ER, demo, presentation, and requirements documents present |
| AI bonus | PASS | Manager-only endpoint; deterministic blocker answer exercised live; privacy-minimized context inspected |
| Responsive browser verification | PARTIAL | Responsive source/build audit passed; interactive 375/768/1024/1440 browser run unavailable |

## Remaining known issues

1. The active Neon data contains 20 legacy reports with old Sunday-Saturday or Monday-Friday ranges and placeholder test content. They remain readable and correction-compatible. The corrected seed is clean; reset the active demo database only after confirming it is disposable and taking any required backup.
2. The client production bundle is approximately 799 KB before gzip and triggers Vite's chunk-size warning. This is non-blocking; route-level lazy loading is a future optimization.
3. `npm audit` reports a high advisory in `deepmerge-ts` through Prisma's development CLI dependency. No compatible Prisma 6 update is offered; it is not an application request path. Reassess when upgrading Prisma.
4. Prisma client regeneration could not replace the Windows query-engine DLL while the development API held it open. Schema validation, migrations, clean-schema seed, server compilation, and the existing generated client all passed. Stop the API before running `npx prisma generate` locally.
5. JWTs are stored in local storage and logout is client-side token disposal; production hardening should use HttpOnly cookies/refresh-token rotation and revocation. Authentication remains suitable for the assignment's documented scope.
6. Interactive browser console and exact breakpoint checks remain manual because no browser runtime was available.
7. The active `server/.env` Neon URL omits `schema=public`. Application queries still work, but run migration commands with `&schema=public` appended (as documented in `.env.example` and the README) so Prisma can locate migration history reliably.

## Submission readiness

**READY WITH MINOR ISSUES**

The application code has no known critical/high defects after remediation. Before the presentation, perform one manual browser pass at the four target widths and decide whether to back up and reseed the active demo database so screenshots and dashboard metrics use the clean seed data.
