import "dotenv/config";
import {
  BlockerStatus,
  Prisma,
  PrismaClient,
  Priority,
  ReportStatus,
  ReviewAction,
  Role,
  TaskStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const DEMO_PASSWORD = "Password123!";
const HOUR = 3_600_000;

const people = [
  {
    key: "admin",
    email: "admin@example.com",
    name: "System Admin",
    role: Role.ADMIN,
  },
  {
    key: "manager",
    email: "manager@example.com",
    name: "Sarah Fernando",
    role: Role.MANAGER,
  },
  {
    key: "john",
    email: "member1@example.com",
    name: "Dhanuka Naveen",
    role: Role.TEAM_MEMBER,
    title: "Frontend Engineer",
    projectKeys: ["portal", "mobile", "tooling"],
    focus: [
      "Refine the account overview responsive layout",
      "Add keyboard navigation to the command menu",
      "Optimize the customer search result rendering",
      "Build reusable form validation feedback",
      "Improve loading states for slow connections",
      "Migrate dashboard cards to shared components",
      "Reduce the initial JavaScript bundle",
      "Add accessible focus management to dialogs",
      "Implement optimistic updates for profile settings",
      "Resolve cross-browser date input styling",
      "Improve error recovery on the project selector",
    ],
  },
  {
    key: "maya",
    email: "member2@example.com",
    name: "Kasun Perera",
    role: Role.TEAM_MEMBER,
    title: "Backend Engineer",
    projectKeys: ["portal", "analytics", "identity", "tooling"],
    focus: [
      "Add cursor-safe pagination to the audit API",
      "Optimize report aggregation queries",
      "Implement idempotent webhook processing",
      "Harden validation for bulk imports",
      "Add caching to project summary endpoints",
      "Refactor notification delivery retries",
      "Improve database connection recovery",
      "Implement scoped access-token validation",
      "Add structured logging to background jobs",
      "Tune indexes for report history filters",
      "Create an export endpoint for compliance data",
    ],
  },
  {
    key: "alex",
    email: "member3@example.com",
    name: "Nimal Silva",
    role: Role.TEAM_MEMBER,
    title: "Quality Engineer",
    projectKeys: ["portal", "mobile", "identity", "analytics"],
    focus: [
      "Complete regression coverage for report approvals",
      "Automate mobile navigation accessibility checks",
      "Validate API behavior under duplicate requests",
      "Expand authentication boundary tests",
      "Create performance baselines for dashboards",
      "Test project assignment edge cases",
      "Add contract tests for analytics responses",
      "Verify version history across correction cycles",
      "Run cross-browser checks for weekly forms",
      "Improve seeded-data consistency assertions",
      "Exercise failure recovery for external services",
    ],
  },
  {
    key: "priya",
    email: "member4@example.com",
    name: "Amali Fernando",
    role: Role.TEAM_MEMBER,
    title: "DevOps Engineer",
    projectKeys: ["cloud", "tooling", "analytics", "identity"],
    focus: [
      "Roll out production health-check dashboards",
      "Reduce container image build time",
      "Configure alert routing for API latency",
      "Automate migration checks in the release pipeline",
      "Review database backup restoration steps",
      "Add deployment smoke tests",
      "Rotate non-production service credentials",
      "Tune autoscaling thresholds for worker queues",
      "Document incident response ownership",
      "Improve preview environment cleanup",
      "Add dependency scanning to pull requests",
    ],
  },
  {
    key: "daniel",
    email: "member5@example.com",
    name: "Tharindu Jayasinghe",
    role: Role.TEAM_MEMBER,
    title: "Product Designer",
    projectKeys: ["portal", "mobile", "analytics"],
    focus: [
      "Validate the onboarding flow with support teams",
      "Prepare responsive specifications for report filters",
      "Improve empty-state guidance across dashboards",
      "Create a consistent status color reference",
      "Simplify the mobile report review experience",
      "Map usability findings to the next release",
      "Design workload comparison interactions",
      "Review form labels and helper text",
      "Prototype an accessible activity timeline",
      "Update handoff notes for the component library",
      "Assess information density on manager views",
    ],
  },
] as const;

const projectDefinitions = [
  {
    key: "portal",
    name: "Customer Portal",
    description: "Self-service account, billing, and support experience for customers.",
    outcomes: [
      "invoice download flow",
      "account search experience",
      "support request timeline",
      "billing preference controls",
    ],
  },
  {
    key: "analytics",
    name: "Insights & Analytics",
    description: "Operational reporting, delivery metrics, and decision-support dashboards.",
    outcomes: [
      "delivery health dashboard",
      "saved report filters",
      "workload distribution view",
      "compliance export",
    ],
  },
  {
    key: "tooling",
    name: "Developer Experience",
    description: "Internal tooling, release automation, and engineering productivity improvements.",
    outcomes: [
      "local environment bootstrap",
      "release readiness checks",
      "component documentation site",
      "build performance report",
    ],
  },
  {
    key: "mobile",
    name: "Mobile Experience",
    description: "Responsive and mobile-first workflows for customers and field teams.",
    outcomes: [
      "mobile navigation refresh",
      "offline status messaging",
      "touch-friendly report cards",
      "device accessibility audit",
    ],
  },
  {
    key: "identity",
    name: "Identity & Access",
    description: "Authentication, authorization, account lifecycle, and security controls.",
    outcomes: [
      "role administration workflow",
      "inactive-account enforcement",
      "session security telemetry",
      "permission audit trail",
    ],
  },
  {
    key: "cloud",
    name: "Cloud Operations",
    description: "Deployment reliability, observability, infrastructure, and incident readiness.",
    outcomes: [
      "API latency alerting",
      "database recovery runbook",
      "deployment smoke-test suite",
      "capacity planning dashboard",
    ],
  },
] as const;

type MemberDefinition = (typeof people)[number] & {
  title: string;
  projectKeys: readonly string[];
  focus: readonly string[];
};

type WorkContent = {
  notes: string;
  links: string[];
  tasks: Array<{
    name: string;
    priority: Priority;
    plannedPercentage: number;
    actualPercentage: number;
    status: TaskStatus;
    plannedTime: number;
    actualTime: number;
    deliverable: string;
  }>;
  nextWeekTasks: Array<{
    name: string;
    description: string;
    priority: Priority;
  }>;
  blockers: Array<{
    title: string;
    description: string;
    isKeyIssue: boolean;
    status: BlockerStatus;
  }>;
  achievements: Array<{
    title: string;
    description: string;
    isKeyAchievement: boolean;
  }>;
  workHours: Array<{ workType: string; hours: number }>;
};

function addDays(date: Date, days: number, hour = 0) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  result.setUTCHours(hour, 0, 0, 0);
  return result;
}

function mondayFor(date = new Date()) {
  const monday = new Date(date);
  monday.setUTCHours(0, 0, 0, 0);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return monday;
}

function statusFor(memberIndex: number, weekIndex: number): ReportStatus | null {
  if (weekIndex === 0)
    return [null, "SUBMITTED", "NEEDS_CORRECTION", "APPROVED", "DRAFT"][
      memberIndex
    ] as ReportStatus | null;
  if (weekIndex === 1)
    return ["APPROVED", "APPROVED", "SUBMITTED", "APPROVED", "NEEDS_CORRECTION"][
      memberIndex
    ] as ReportStatus;
  if (weekIndex === 2)
    return ["APPROVED", "APPROVED", "APPROVED", "SUBMITTED", "APPROVED"][
      memberIndex
    ] as ReportStatus;
  if (weekIndex === 3)
    return ["SUBMITTED", "NEEDS_CORRECTION", "APPROVED", "APPROVED", "APPROVED"][
      memberIndex
    ] as ReportStatus;
  return "APPROVED";
}

function correctionVersions(memberIndex: number, weekIndex: number) {
  if (memberIndex === 1 && weekIndex === 2) return 3;
  const twoVersionReports = new Set([
    "4-2",
    "3-3",
    "2-4",
    "0-5",
    "1-6",
    "4-7",
    "0-8",
    "3-9",
  ]);
  return twoVersionReports.has(`${memberIndex}-${weekIndex}`) ? 2 : 1;
}

function contentFor(
  member: MemberDefinition,
  memberIndex: number,
  project: (typeof projectDefinitions)[number],
  weekIndex: number,
  status: ReportStatus,
): WorkContent {
  const focus = member.focus[(10 - weekIndex + memberIndex) % member.focus.length];
  const outcome = project.outcomes[(weekIndex + memberIndex) % project.outcomes.length];
  const hasOpenBlocker =
    (weekIndex === 0 && [1, 2, 4].includes(memberIndex)) ||
    (weekIndex > 0 && (weekIndex + memberIndex) % 7 === 0);
  const keyBlocker =
    (weekIndex === 0 && memberIndex === 2) ||
    (hasOpenBlocker && (weekIndex + memberIndex) % 2 === 0);
  const primaryComplete = status === "APPROVED" || weekIndex > 1;
  const primaryActual = primaryComplete
    ? 100
    : status === "DRAFT"
      ? 45
      : status === "NEEDS_CORRECTION"
        ? 78
        : 88;
  const primaryHours = 10 + ((weekIndex + memberIndex * 2) % 7);
  const secondaryHours = 5 + ((weekIndex * 2 + memberIndex) % 5);
  const workBase = 18 + ((weekIndex + memberIndex * 3) % 8);
  const roleWorkType = [
    "Development",
    "Development",
    "Testing",
    "DevOps",
    "Design",
  ][memberIndex];
  const collaborationHours = 3 + ((weekIndex + memberIndex) % 3);
  const tasks: WorkContent["tasks"] = [
    {
      name: focus,
      priority:
        hasOpenBlocker || (weekIndex + memberIndex) % 4 === 0
          ? Priority.HIGH
          : Priority.MEDIUM,
      plannedPercentage: 100,
      actualPercentage: primaryActual,
      status: primaryComplete ? TaskStatus.COMPLETED : TaskStatus.IN_PROGRESS,
      plannedTime: primaryHours + 1,
      actualTime: primaryHours,
      deliverable: primaryComplete
        ? `Reviewed ${outcome} increment ready for team use`
        : `Working increment of the ${outcome} with review notes`,
    },
    {
      name: `Review and validate the ${outcome}`,
      priority: (weekIndex + memberIndex) % 3 === 0 ? Priority.HIGH : Priority.MEDIUM,
      plannedPercentage: 100,
      actualPercentage: hasOpenBlocker ? 65 : 100,
      status: hasOpenBlocker ? TaskStatus.BLOCKED : TaskStatus.COMPLETED,
      plannedTime: secondaryHours,
      actualTime: hasOpenBlocker ? Math.max(2, secondaryHours - 2) : secondaryHours,
      deliverable: hasOpenBlocker
        ? "Validation evidence captured; external dependency remains"
        : "Acceptance notes and follow-up actions shared with the project team",
    },
  ];
  if ((weekIndex + memberIndex) % 3 === 0)
    tasks.push({
      name: `Document decisions for ${project.name}`,
      priority: Priority.LOW,
      plannedPercentage: 100,
      actualPercentage: 100,
      status: TaskStatus.COMPLETED,
      plannedTime: 3,
      actualTime: 2 + ((weekIndex + memberIndex) % 2),
      deliverable: "Decision record and concise handoff notes",
    });

  const blockers: WorkContent["blockers"] = [
    {
      title: hasOpenBlocker
        ? [
            "Final accessibility review is awaiting a test device",
            "The analytics contract needs stakeholder confirmation",
            "A staging account is missing the required permission",
            "The deployment window depends on platform approval",
            "Research participants are not yet confirmed",
          ][memberIndex]
        : `Resolved dependency for the ${outcome}`,
      description: hasOpenBlocker
        ? [
            "The implementation is ready, but keyboard and screen-reader validation needs the shared mobile device lab.",
            "Two field definitions differ between the product brief and the current API response; a decision is scheduled.",
            "The automated scenario cannot complete until the QA service account receives the project-scoped role.",
            "Infrastructure changes are reviewed and ready, with the release window awaiting platform-owner approval.",
            "The prototype is prepared, but two customer interview slots still need confirmation from support.",
          ][memberIndex]
        : "The dependency was clarified during the week and no longer affects the planned delivery.",
      isKeyIssue: keyBlocker,
      status: hasOpenBlocker ? BlockerStatus.OPEN : BlockerStatus.RESOLVED,
    },
  ];
  if ((weekIndex + memberIndex) % 5 === 0)
    blockers.push({
      title: "Test data refresh completed later than planned",
      description:
        "The team used a smaller verified dataset for early checks, then completed the full regression after the refresh.",
      isKeyIssue: false,
      status: BlockerStatus.RESOLVED,
    });

  const achievements: WorkContent["achievements"] = [
    {
      title: [
        "Usability feedback incorporated ahead of review",
        "API response time improved under representative load",
        "Regression suite completed without release-blocking defects",
        "Deployment checks completed with clear rollback evidence",
        "Design handoff accepted without clarification gaps",
      ][memberIndex],
      description: `${member.name} completed a measurable improvement for the ${outcome} and shared the evidence with the team.`,
      isKeyAchievement: (weekIndex + memberIndex) % 4 === 0,
    },
  ];
  if ((weekIndex + memberIndex) % 4 === 2)
    achievements.push({
      title: "Cross-functional review completed on schedule",
      description:
        "Engineering, design, and quality owners agreed on the remaining scope and acceptance criteria.",
      isKeyAchievement: false,
    });

  return {
    notes: `${member.title} update for ${project.name}. The week focused on ${focus.toLowerCase()} and left clear ownership for the remaining ${outcome} work.`,
    links:
      weekIndex % 4 === 0
        ? [
            `https://example.com/weekflow/${project.key}/delivery-notes`,
            `https://example.com/weekflow/${project.key}/quality-checks`,
          ]
        : [`https://example.com/weekflow/${project.key}/weekly-update`],
    tasks,
    nextWeekTasks: [
      {
        name: `Complete the next ${outcome} increment`,
        description: hasOpenBlocker
          ? "Resolve the named dependency first, then complete acceptance checks."
          : "Build on this week's reviewed outcome and prepare it for stakeholder validation.",
        priority: hasOpenBlocker ? Priority.HIGH : Priority.MEDIUM,
      },
      ...((weekIndex + memberIndex) % 4 === 1
        ? [
            {
              name: `Share ${project.name} learnings with the wider team`,
              description: "Capture reusable decisions and answer implementation questions.",
              priority: Priority.LOW,
            },
          ]
        : []),
    ],
    blockers,
    achievements,
    workHours: [
      { workType: roleWorkType, hours: workBase },
      {
        workType: memberIndex === 2 ? "Test Automation" : "Documentation",
        hours: 4 + ((weekIndex + memberIndex) % 4),
      },
      { workType: "Meetings", hours: collaborationHours },
    ],
  };
}

function earlierContent(content: WorkContent, versionNumber: number) {
  const reduction = versionNumber === 1 ? 22 : 10;
  return {
    ...content,
    notes:
      versionNumber === 1
        ? `${content.notes} Initial evidence required clarification before approval.`
        : `${content.notes} The first review points were addressed; one final detail remained.`,
    tasks: content.tasks.map((task, index) =>
      index === 0
        ? {
            ...task,
            actualPercentage: Math.max(40, task.actualPercentage - reduction),
            status: TaskStatus.IN_PROGRESS,
            actualTime: Math.max(1, task.actualTime - (versionNumber === 1 ? 2 : 1)),
            deliverable:
              versionNumber === 1
                ? "Initial implementation and draft verification notes"
                : "Updated implementation awaiting final evidence",
          }
        : task,
    ),
  };
}

function snapshot(
  project: { id: string; name: string },
  weekStartDate: Date,
  weekEndDate: Date,
  content: WorkContent,
) {
  return {
    projectId: project.id,
    project,
    weekStartDate: weekStartDate.toISOString(),
    weekEndDate: weekEndDate.toISOString(),
    ...content,
  } as unknown as Prisma.InputJsonValue;
}

function reviewComment(projectName: string, round: number) {
  const comments = [
    `Please add the acceptance evidence for ${projectName} and align the completion percentage with the delivered scope.`,
    `The updated evidence is helpful. Please clarify the remaining dependency and identify its owner before final approval.`,
  ];
  return comments[Math.min(round - 1, comments.length - 1)];
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to reset demo data while NODE_ENV=production.");
  }
  if (process.env.ALLOW_DEMO_RESET?.trim().toLowerCase() !== "true") {
    throw new Error(
      "Demo reset blocked. Set ALLOW_DEMO_RESET=true only after confirming the configured database is disposable.",
    );
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const currentMonday = mondayFor();
  const now = new Date();

  const result = await db.$transaction(
    async (tx) => {
      await tx.review.deleteMany();
      await tx.reportVersion.deleteMany();
      await tx.activityLog.deleteMany();
      await tx.report.deleteMany();
      await tx.projectAssignment.deleteMany();
      await tx.project.deleteMany();
      await tx.user.deleteMany();

      const createdUsers = new Map<string, { id: string; name: string }>();
      for (const person of people) {
        const user = await tx.user.create({
          data: {
            email: person.email,
            name: person.name,
            role: person.role,
            passwordHash,
            isActive: true,
          },
          select: { id: true, name: true },
        });
        createdUsers.set(person.key, user);
      }

      const createdProjects = new Map<
        string,
        { id: string; name: string; key: string }
      >();
      for (const definition of projectDefinitions) {
        const project = await tx.project.create({
          data: {
            name: definition.name,
            description: definition.description,
          },
          select: { id: true, name: true },
        });
        createdProjects.set(definition.key, {
          ...project,
          key: definition.key,
        });
      }

      const members = people.filter(
        (person): person is MemberDefinition => person.role === Role.TEAM_MEMBER,
      );
      await tx.projectAssignment.createMany({
        data: members.flatMap((member) =>
          member.projectKeys.map((projectKey) => ({
            userId: createdUsers.get(member.key)!.id,
            projectId: createdProjects.get(projectKey)!.id,
          })),
        ),
      });

      const manager = createdUsers.get("manager")!;
      const activities: Prisma.ActivityLogCreateManyInput[] = [];
      const reportExamples: Array<{
        id: string;
        member: string;
        project: string;
        weekStart: string;
        versions: number;
        status: ReportStatus;
      }> = [];

      for (let weekIndex = 10; weekIndex >= 0; weekIndex -= 1) {
        const weekStartDate = addDays(currentMonday, -7 * weekIndex);
        const weekEndDate = addDays(weekStartDate, 6);

        for (let memberIndex = 0; memberIndex < members.length; memberIndex += 1) {
          const member = members[memberIndex];
          const status = statusFor(memberIndex, weekIndex);
          if (!status) continue;

          const projectKey =
            member.projectKeys[(10 - weekIndex + memberIndex) % member.projectKeys.length];
          const project = createdProjects.get(projectKey)!;
          const projectDefinition = projectDefinitions.find(
            (definition) => definition.key === projectKey,
          )!;
          const content = contentFor(
            member,
            memberIndex,
            projectDefinition,
            weekIndex,
            status,
          );
          const requestedVersionCount =
            status === ReportStatus.DRAFT
              ? 0
              : status === ReportStatus.NEEDS_CORRECTION
                ? 1
                : correctionVersions(memberIndex, weekIndex);

          let initialSubmittedAt = addDays(weekStartDate, 4, 15);
          if (weekIndex === 0) {
            const earliest = addDays(weekStartDate, 0, 8);
            const hoursAgo = status === "SUBMITTED" ? 3 : status === "APPROVED" ? 30 : 20;
            initialSubmittedAt = new Date(
              Math.max(earliest.getTime(), now.getTime() - hoursAgo * HOUR),
            );
          }

          const correctionTimes: Array<{
            requestedAt: Date;
            updatedAt: Date;
            resubmittedAt: Date;
          }> = [];
          for (let round = 1; round < requestedVersionCount; round += 1) {
            const requestedAt = addDays(weekEndDate, round * 2 - 1, 10);
            correctionTimes.push({
              requestedAt,
              updatedAt: new Date(requestedAt.getTime() + 5 * HOUR),
              resubmittedAt: addDays(weekEndDate, round * 2, 10),
            });
          }

          let outstandingCorrectionAt: Date | null = null;
          if (status === ReportStatus.NEEDS_CORRECTION) {
            outstandingCorrectionAt =
              weekIndex === 0
                ? new Date(Math.max(initialSubmittedAt.getTime() + HOUR, now.getTime() - 2 * HOUR))
                : addDays(weekEndDate, 1, 10);
          }

          const latestSubmittedAt =
            correctionTimes.at(-1)?.resubmittedAt ?? initialSubmittedAt;
          const approvedAt =
            status === ReportStatus.APPROVED
              ? new Date(latestSubmittedAt.getTime() + (weekIndex === 0 ? 4 : 6) * HOUR)
              : null;
          const correctionUpdatedAt = correctionTimes.at(-1)?.updatedAt ?? null;
          const latestEventAt =
            approvedAt ?? outstandingCorrectionAt ?? latestSubmittedAt ?? addDays(weekStartDate, 2, 12);

          const report = await tx.report.create({
            data: {
              userId: createdUsers.get(member.key)!.id,
              projectId: project.id,
              weekStartDate,
              weekEndDate,
              status,
              notes: content.notes,
              links: content.links,
              submittedAt: status === ReportStatus.DRAFT ? null : latestSubmittedAt,
              approvedAt,
              correctionUpdatedAt,
              createdAt: addDays(weekStartDate, 0, 9),
              updatedAt: latestEventAt,
              tasks: { create: content.tasks },
              nextWeekTasks: { create: content.nextWeekTasks },
              blockers: { create: content.blockers },
              achievements: { create: content.achievements },
              workHours: { create: content.workHours },
            },
          });

          const versionIds: string[] = [];
          for (let versionNumber = 1; versionNumber <= requestedVersionCount; versionNumber += 1) {
            const isLatest = versionNumber === requestedVersionCount;
            const versionContent = isLatest
              ? content
              : earlierContent(content, versionNumber);
            const submittedAt =
              versionNumber === 1
                ? initialSubmittedAt
                : correctionTimes[versionNumber - 2].resubmittedAt;
            const version = await tx.reportVersion.create({
              data: {
                reportId: report.id,
                versionNumber,
                snapshot: snapshot(project, weekStartDate, weekEndDate, versionContent),
                submittedAt,
              },
              select: { id: true },
            });
            versionIds.push(version.id);
            activities.push({
              actorId: createdUsers.get(member.key)!.id,
              action: versionNumber === 1 ? "REPORT_SUBMITTED" : "REPORT_RESUBMITTED",
              description: `${member.name} ${versionNumber === 1 ? "submitted" : "resubmitted"} the ${project.name} report for ${weekStartDate.toISOString().slice(0, 10)}`,
              createdAt: submittedAt,
            });

            if (!isLatest) {
              const requestedAt = correctionTimes[versionNumber - 1].requestedAt;
              await tx.review.create({
                data: {
                  reportId: report.id,
                  reviewerId: manager.id,
                  versionId: version.id,
                  action: ReviewAction.CHANGES_REQUESTED,
                  comment: reviewComment(project.name, versionNumber),
                  createdAt: requestedAt,
                },
              });
              activities.push({
                actorId: manager.id,
                action: "CHANGES_REQUESTED",
                description: `${manager.name} requested changes to ${member.name}'s ${project.name} report`,
                createdAt: requestedAt,
              });
            }
          }

          if (status === ReportStatus.NEEDS_CORRECTION) {
            await tx.review.create({
              data: {
                reportId: report.id,
                reviewerId: manager.id,
                versionId: versionIds[0],
                action: ReviewAction.CHANGES_REQUESTED,
                comment: reviewComment(project.name, 1),
                createdAt: outstandingCorrectionAt!,
              },
            });
            activities.push({
              actorId: manager.id,
              action: "CHANGES_REQUESTED",
              description: `${manager.name} requested changes to ${member.name}'s ${project.name} report`,
              createdAt: outstandingCorrectionAt!,
            });
          }

          if (status === ReportStatus.APPROVED) {
            await tx.review.create({
              data: {
                reportId: report.id,
                reviewerId: manager.id,
                versionId: versionIds.at(-1)!,
                action: ReviewAction.APPROVED,
                comment: `Clear evidence and a well-scoped update for ${project.name}. Approved for the weekly record.`,
                createdAt: approvedAt!,
              },
            });
            activities.push({
              actorId: manager.id,
              action: "APPROVED",
              description: `${manager.name} approved ${member.name}'s ${project.name} report`,
              createdAt: approvedAt!,
            });
          }

          reportExamples.push({
            id: report.id,
            member: member.name,
            project: project.name,
            weekStart: weekStartDate.toISOString().slice(0, 10),
            versions: requestedVersionCount,
            status,
          });
        }
      }

      await tx.activityLog.createMany({ data: activities });

      return {
        users: createdUsers.size,
        projects: createdProjects.size,
        assignments: members.reduce(
          (total, member) => total + member.projectKeys.length,
          0,
        ),
        reports: reportExamples.length,
        activities: activities.length,
        reportExamples,
      };
    },
    { maxWait: 30_000, timeout: 300_000 },
  );

  const statusCounts = await db.report.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const versionCounts = await db.reportVersion.groupBy({
    by: ["reportId"],
    _count: { _all: true },
  });
  const threeVersionReport = result.reportExamples.find(
    (report) => report.versions === 3,
  );

  console.log("Seeded the WeekFlow demo dataset.");
  console.log(
    JSON.stringify(
      {
        users: result.users,
        projects: result.projects,
        assignments: result.assignments,
        reports: result.reports,
        activities: result.activities,
        statuses: Object.fromEntries(
          statusCounts.map((row) => [row.status, row._count._all]),
        ),
        reportsWithMultipleVersions: versionCounts.filter(
          (row) => row._count._all > 1,
        ).length,
        threeVersionExample: threeVersionReport,
        password: DEMO_PASSWORD,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => db.$disconnect());
