# Live coding guide

## Where important behavior lives

- JWT creation: `server/src/services/auth.service.ts`; verification/roles: `server/src/middleware/auth.ts`.
- Report ownership, writes, workflow, snapshots and reviews: `server/src/services/report.service.ts`.
- Models/relations: `server/prisma/schema.prisma`; validation: `server/src/validators/schemas.ts`.
- Analytics: `server/src/services/dashboard.service.ts`.
- AI context, privacy filtering, and Gemini request: `server/src/services/ai.service.ts`.
- HTTP wiring: `server/src/routes`; HTTP parsing: `server/src/controllers`.
- Frontend API/token behavior: `client/src/api/client.ts`; session: `client/src/contexts/AuthContext.tsx`.
- Form: `client/src/pages/reports/ReportForm.tsx`; shared read-only view: `client/src/components/reports/ReportSummary.tsx`.
- Role routes/navigation: `client/src/App.tsx` and `client/src/layouts/AppLayout.tsx`.

## Likely interview changes

1. Add a report status — Prisma enum, migration, status type/badge, service transitions and filters.
2. Add a dashboard filter — route query, dashboard service `where`, page control.
3. Add a task field — Prisma model/migration, Zod task schema, form row, summary.
4. Harden unauthorized report access — `getReport` ownership branch and RBAC test.
5. Change pagination — `listReports` page/limit and `ReportList` controls.
6. Add a manager metric — aggregate in dashboard service, card in `Dashboards.tsx`.
7. Change report validation — `validators/schemas.ts`, then surface backend message in form.
8. Add a project field — Prisma/migration, project schema, Projects page.
9. Add a review action — enum/migration, `reviewReport`, route and review controls.
10. Add work types — no schema migration (stored string); update form options and aggregation.
11. Change token expiry — JWT options in auth service.
12. Add project membership — junction model, project endpoints, creation authorization.
13. Add email notification — trigger after successful review transaction via a separate service/outbox.
14. Optimize analytics — replace in-memory reductions in dashboard service with Prisma groupBy/raw SQL.
15. Add version diff — compare selected snapshot objects in a new reusable frontend component; snapshots already contain all content.
