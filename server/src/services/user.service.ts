import type { Role } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/errors.js";

const publicUser = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

export function listUsers() {
  return prisma.user.findMany({ select: publicUser, orderBy: { name: "asc" } });
}

export async function getUserProfile(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      ...publicUser,
      reports: {
        include: {
          project: true,
          _count: { select: { tasks: true, blockers: true } },
          blockers: true,
        },
        orderBy: { weekStartDate: "desc" },
      },
    },
  });
  if (!user) throw new AppError(404, "User not found");

  const reports = user.reports;
  return {
    ...user,
    statistics: {
      total: reports.length,
      approved: reports.filter((report) => report.status === "APPROVED").length,
      corrections: reports.filter(
        (report) => report.status === "NEEDS_CORRECTION",
      ).length,
      averageCompletedTasks: reports.length
        ? reports.reduce((total, report) => total + report._count.tasks, 0) /
          reports.length
        : 0,
      openBlockers: reports
        .flatMap((report) => report.blockers)
        .filter((blocker) => blocker.status === "OPEN").length,
    },
  };
}

export function changeRole(actorId: string, userId: string, role: Role) {
  if (actorId === userId)
    throw new AppError(400, "You cannot change your own role");
  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: publicUser,
  });
}

export function changeStatus(
  actorId: string,
  userId: string,
  isActive: boolean,
) {
  if (actorId === userId)
    throw new AppError(400, "You cannot deactivate yourself");
  return prisma.user.update({
    where: { id: userId },
    data: { isActive },
    select: publicUser,
  });
}
