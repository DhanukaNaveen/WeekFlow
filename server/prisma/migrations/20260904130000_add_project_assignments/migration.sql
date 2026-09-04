CREATE TABLE "ProjectAssignment" (
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectAssignment_pkey" PRIMARY KEY ("userId", "projectId")
);

CREATE INDEX "ProjectAssignment_projectId_idx" ON "ProjectAssignment"("projectId");

ALTER TABLE "ProjectAssignment"
ADD CONSTRAINT "ProjectAssignment_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectAssignment"
ADD CONSTRAINT "ProjectAssignment_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve existing behavior during rollout. Managers can narrow these
-- assignments after deployment without invalidating historical reports.
INSERT INTO "ProjectAssignment" ("userId", "projectId")
SELECT users."id", projects."id"
FROM "User" AS users
CROSS JOIN "Project" AS projects
WHERE users."role" = 'TEAM_MEMBER'
  AND projects."isActive" = true
ON CONFLICT DO NOTHING;
