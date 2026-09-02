# Presentation outline (10 slides)

1. **Project overview** — Problem, structured weekly reporting, traceable review, analytics.
2. **Users and requirements** — Member, manager, admin capabilities; object-level privacy.
3. **System architecture** — React/Vite → REST → Express layers → Prisma/PostgreSQL.
4. **Database design** — Normalized report sections, relationships, unique weekly constraint.
5. **Authentication and RBAC** — bcrypt, minimal JWT claims, middleware, ownership checks.
6. **Report workflow** — Allowed transitions, immutable states, backend enforcement.
7. **Versioning and review** — Atomic snapshot on submit; review linked to exact version.
8. **Dashboard/front end** — Responsive role navigation, reusable rendering, server analytics, five charts.
9. **Testing, security, and AI** — Supertest RBAC cases, Zod, Helmet/CORS, privacy-scoped Gemini summaries.
10. **Challenges and future work** — Date consistency and transactions; refresh-token cookies, database-native analytics, notifications, and background jobs.
