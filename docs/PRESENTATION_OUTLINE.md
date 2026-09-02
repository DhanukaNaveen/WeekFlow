# Presentation outline (10 slides)

1. **Project overview** — Problem, structured weekly reporting, traceable review, analytics.
2. **Users and requirements** — Member, manager, admin capabilities; object-level privacy.
3. **System architecture** — React/Vite → REST → Express layers → Prisma/PostgreSQL.
4. **Database design** — Normalized report sections, relationships, unique weekly constraint.
5. **Authentication and RBAC** — bcrypt, minimal JWT claims, middleware, ownership checks.
6. **Report workflow** — Allowed transitions, immutable states, backend enforcement.
7. **Versioning and review** — Atomic snapshot on submit; review linked to exact version.
8. **Dashboard/front end** — Responsive role navigation, reusable rendering, server analytics, five charts.
9. **Testing and security** — Supertest RBAC cases, Zod, Helmet/CORS, safe API responses.
10. **Challenges and future work** — Date consistency and transactions; refresh-token cookies, database-native analytics, notifications, optional privacy-scoped AI summaries.
