import type { Role } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export interface ProjectInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export function listProjects(role: Role) {
  return prisma.project.findMany({
    where: role === "TEAM_MEMBER" ? { isActive: true } : {},
    orderBy: { name: "asc" },
  });
}

export function createProject(
  input: Required<Pick<ProjectInput, "name">> & ProjectInput,
) {
  return prisma.project.create({ data: input });
}

export function updateProject(id: string, input: ProjectInput) {
  return prisma.project.update({ where: { id }, data: input });
}

export async function removeProject(id: string) {
  const reportCount = await prisma.report.count({ where: { projectId: id } });
  if (reportCount > 0) {
    return prisma.project.update({ where: { id }, data: { isActive: false } });
  }
  await prisma.project.delete({ where: { id } });
  return null;
}
