# REST API

All protected calls use `Authorization: Bearer <JWT>`. List filters accept `page`, `limit`, `userId`, `projectId`, `status`, `startDate`, and `endDate` where relevant.

| Method       | Endpoint                           | Role               | Purpose                                   |
| ------------ | ---------------------------------- | ------------------ | ----------------------------------------- |
| POST         | `/api/auth/register`               | Public             | Register member                           |
| POST         | `/api/auth/login`                  | Public             | Login and receive JWT                     |
| GET          | `/api/auth/me`                     | Authenticated      | Current safe user                         |
| POST         | `/api/auth/logout`                 | Authenticated      | Client-token logout acknowledgement       |
| GET/POST     | `/api/projects`                    | Auth / Manager+    | List/create projects                      |
| PATCH/DELETE | `/api/projects/:id`                | Manager+           | Edit or safely deactivate/delete          |
| PUT          | `/api/projects/:id/members`        | Manager+           | Replace assigned team members              |
| POST         | `/api/reports`                     | Member             | Create own draft                          |
| GET          | `/api/reports/my`                  | Member             | Paginated own history                     |
| GET          | `/api/reports`                     | Manager+           | Filter team reports                       |
| GET/PATCH    | `/api/reports/:id`                 | Authorized / owner | Detail/update editable own report         |
| POST         | `/api/reports/:id/submit`          | Owner              | Submit/resubmit and snapshot              |
| POST         | `/api/reports/:id/approve`         | Manager+           | Approve submitted version                 |
| POST         | `/api/reports/:id/request-changes` | Manager+           | Require correction with comment           |
| GET          | `/api/reports/:id/reviews`         | Authorized         | Review history                            |
| GET          | `/api/reports/:id/versions`        | Authorized         | Submitted snapshots                       |
| GET          | `/api/dashboard/member`            | Member             | Personal summary                          |
| GET          | `/api/dashboard/manager`           | Manager+           | Team analytics                            |
| GET          | `/api/dashboard/section-view`      | Manager+           | Cross-team blockers/achievements          |
| POST         | `/api/ai/chat`                     | Manager+           | Ask Gemini about submitted report context |
| GET          | `/api/users/:id`                   | Manager+           | Profile, statistics, paginated history    |
| PATCH        | `/api/users/:id/role`              | Admin              | Assign role                               |
| PATCH        | `/api/users/:id/status`            | Admin              | Activate/deactivate                       |
