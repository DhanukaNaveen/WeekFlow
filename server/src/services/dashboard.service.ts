import { prisma } from "../config/prisma.js";

export async function memberDashboard(userId: string) {
  const reports = await prisma.report.findMany({
    where: { userId },
    include: {
      project: true,
      reviews: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { weekStartDate: "desc" },
    take: 8,
  });
  return {
    current: reports[0] ?? null,
    recent: reports,
    summary: {
      total: reports.length,
      approved: reports.filter((r) => r.status === "APPROVED").length,
      needsCorrection: reports.filter((r) => r.status === "NEEDS_CORRECTION")
        .length,
    },
  };
}
export async function managerDashboard() {
  const monday = new Date();
  monday.setUTCHours(0, 0, 0, 0);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const [reports, members, activity] = await Promise.all([
    prisma.report.findMany({
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
  const weekly = reports.filter((r) => r.weekStartDate >= monday),
    createdUsers = new Set(
      weekly.filter((r) => r.status !== "DRAFT").map((r) => r.userId),
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
      submittedThisWeek: weekly.filter((r) => r.status !== "DRAFT").length,
      complianceRate: members.length
        ? Math.round((createdUsers.size / members.length) * 100)
        : 0,
      pending: members.length - createdUsers.size,
      approved: weekly.filter((r) => r.status === "APPROVED").length,
      needsCorrection: weekly.filter((r) => r.status === "NEEDS_CORRECTION")
        .length,
      openBlockers: weekly
        .flatMap((r) => r.blockers)
        .filter((b) => b.status === "OPEN").length,
    },
    taskTrend: [...trend].sort().map(([week, tasks]) => ({ week, tasks })),
    statusByMember,
    workloadByProject: [...byProject].map(([name, value]) => ({ name, value })),
    timeByWorkType: [...byType].map(([name, value]) => ({ name, value })),
    recentActivity: activity,
  };
}
export async function sectionView(section: string, week?: string) {
  const where = week ? { weekStartDate: new Date(week) } : {};
  return prisma.report.findMany({
    where,
    select: {
      id: true,
      user: { select: { name: true } },
      project: { select: { name: true } },
      blockers: section === "BLOCKERS",
      achievements: section === "ACHIEVEMENTS",
    },
    orderBy: { user: { name: "asc" } },
  });
}

export function recentActivity() {
  return prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
