import { prisma } from "../config/prisma.js";

export async function memberDashboard(userId: string) {
  const monday = new Date();
  monday.setUTCHours(0, 0, 0, 0);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  const reports = await prisma.report.findMany({
    where: { userId },
    include: {
      project: true,
      reviews: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { weekStartDate: "desc" },
  });
  return {
    current:
      reports.find(
        (report) =>
          report.weekStartDate >= monday && report.weekStartDate <= sunday,
      ) ?? null,
    recent: reports.slice(0, 5),
    summary: {
      pendingApproval: reports.filter((r) => r.status === "SUBMITTED").length,
      needsAttention: reports.filter((r) => r.status === "NEEDS_CORRECTION")
        .length,
    },
  };
}
export async function managerDashboard() {
  const monday = new Date();
  monday.setUTCHours(0, 0, 0, 0);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const nextMonday = new Date(monday);
  nextMonday.setUTCDate(nextMonday.getUTCDate() + 7);
  const [reports, members, activity] = await Promise.all([
    prisma.report.findMany({
      where: { status: { not: "DRAFT" } },
      include: {
        user: { select: { id: true, name: true } },
        project: true,
        tasks: true,
        workHours: true,
        blockers: true,
      },
    }),
    prisma.user.findMany({
      where: { role: "TEAM_MEMBER", isActive: true },
      select: { id: true, name: true },
    }),
    prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]);
  const activeMemberIds = new Set(members.map((member) => member.id)),
    currentWeekReports = reports.filter(
      (r) => r.weekStartDate >= monday && r.weekStartDate < nextMonday,
    ),
    submittedMemberIds = new Set(
      currentWeekReports
        .filter((report) => activeMemberIds.has(report.userId))
        .map((report) => report.userId),
    );
  const statusByMember = members.map((m) => {
    const rs = reports.filter((r) => r.userId === m.id);
    return {
      name: m.name,
      approved: rs.filter((r) => r.status === "APPROVED").length,
      submitted: rs.filter((r) => r.status === "SUBMITTED").length,
      correction: rs.filter((r) => r.status === "NEEDS_CORRECTION").length,
    };
  });
  const byProject = new Map<string, number>(),
    byType = new Map<string, number>(),
    trend = new Map<string, number>();
  reports.forEach((r) => {
    byProject.set(
      r.project.name,
      (byProject.get(r.project.name) || 0) + r.tasks.length,
    );
    r.workHours.forEach((h) =>
      byType.set(h.workType, (byType.get(h.workType) || 0) + h.hours),
    );
    const w = r.weekStartDate.toISOString().slice(0, 10);
    trend.set(
      w,
      (trend.get(w) || 0) +
        r.tasks.filter((t) => t.status === "COMPLETED").length,
    );
  });
  return {
    summary: {
      submittedThisWeek: reports.filter(
        (r) =>
          r.submittedAt &&
          r.submittedAt >= monday &&
          r.submittedAt < nextMonday,
      ).length,
      complianceRate: members.length
        ? Math.round((submittedMemberIds.size / members.length) * 100)
        : 0,
      pending: members.length - submittedMemberIds.size,
      approved: currentWeekReports.filter((r) => r.status === "APPROVED")
        .length,
      needsCorrection: currentWeekReports.filter(
        (r) => r.status === "NEEDS_CORRECTION",
      ).length,
      openBlockers: currentWeekReports
        .flatMap((r) => r.blockers)
        .filter((b) => b.status === "OPEN").length,
    },
    taskTrend: [...trend].sort().map(([week, tasks]) => ({ week, tasks })),
    statusByMember,
    workloadByProject: [...byProject].map(([name, value]) => ({ name, value })),
    timeByWorkType: [...byType].map(([name, value]) => ({ name, value })),
    submissionOverview: [
      { name: "Submitted", value: submittedMemberIds.size },
      {
        name: "Not submitted",
        value: members.length - submittedMemberIds.size,
      },
    ],
    recentActivity: activity,
  };
}
export async function sectionView(
  section: "BLOCKERS" | "ACHIEVEMENTS",
  week?: string,
  page = 1,
  limit = 10,
) {
  const reportWhere = {
    status: { not: "DRAFT" as const },
    ...(week ? { weekStartDate: new Date(week) } : {}),
    ...(section === "BLOCKERS"
      ? { blockers: { some: {} } }
      : { achievements: { some: {} } }),
  };
  const skip = (page - 1) * limit;

  if (section === "BLOCKERS") {
    const [reports, total] = await prisma.$transaction([
      prisma.report.findMany({
        where: reportWhere,
        select: {
          id: true,
          weekStartDate: true,
          weekEndDate: true,
          user: { select: { name: true } },
          project: { select: { name: true } },
          blockers: {
            select: {
              id: true,
              title: true,
              description: true,
              isKeyIssue: true,
              status: true,
            },
            orderBy: { title: "asc" },
          },
        },
        orderBy: [
          { weekStartDate: "desc" },
          { user: { name: "asc" } },
          { id: "asc" },
        ],
        skip,
        take: limit,
      }),
      prisma.report.count({ where: reportWhere }),
    ]);
    return {
      items: reports.map(({ blockers, ...report }) => ({
        ...report,
        entries: blockers.map(({ isKeyIssue, ...item }) => ({
          ...item,
          isKey: isKeyIssue,
        })),
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  const [reports, total] = await prisma.$transaction([
    prisma.report.findMany({
      where: reportWhere,
      select: {
        id: true,
        weekStartDate: true,
        weekEndDate: true,
        user: { select: { name: true } },
        project: { select: { name: true } },
        achievements: {
          select: {
            id: true,
            title: true,
            description: true,
            isKeyAchievement: true,
          },
          orderBy: { title: "asc" },
        },
      },
        orderBy: [
          { weekStartDate: "desc" },
          { user: { name: "asc" } },
          { id: "asc" },
        ],
      skip,
      take: limit,
    }),
    prisma.report.count({ where: reportWhere }),
  ]);
  return {
    items: reports.map(({ achievements, ...report }) => ({
      ...report,
      entries: achievements.map(({ isKeyAchievement, ...item }) => ({
        ...item,
        isKey: isKeyAchievement,
      })),
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export function recentActivity() {
  return prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
