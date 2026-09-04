import type { Role } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/errors.js";

export interface ProjectInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

const assignedMemberSelect = {
  id: true,
  name: true,
  email: true,
  isActive: true,
} as const;

export async function listProjects(role: Role, userId: string) {
  if (role === "TEAM_MEMBER") {
    return prisma.project.findMany({
      where: {
        isActive: true,
        memberAssignments: { some: { userId } },
      },
      orderBy: { name: "asc" },
    });
  }
  const projects = await prisma.project.findMany({
    include: {
      memberAssignments: {
        select: { user: { select: assignedMemberSelect } },
        orderBy: { user: { name: "asc" } },
      },
    },
    orderBy: { name: "asc" },
  });
  return projects.map(({ memberAssignments, ...project }) => ({
    ...project,
    assignedMembers: memberAssignments.map((assignment) => assignment.user),
  }));
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

export async function assignProjectMembers(id: string, memberIds: string[]) {
  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!project) throw new AppError(404, "Project not found");

  const members = await prisma.user.findMany({
    where: { id: { in: memberIds }, role: "TEAM_MEMBER" },
    select: { id: true },
  });
  if (members.length !== memberIds.length)
    throw new AppError(400, "Assignments must contain team members only");

  const changes = [
    prisma.projectAssignment.deleteMany({ where: { projectId: id } }),
  ];
  if (members.length)
    changes.push(
      prisma.projectAssignment.createMany({
        data: members.map((member) => ({ projectId: id, userId: member.id })),
      }),
    );
  await prisma.$transaction(changes);

  const updated = await prisma.project.findUnique({
    where: { id },
    include: {
      memberAssignments: {
        select: { user: { select: assignedMemberSelect } },
        orderBy: { user: { name: "asc" } },
      },
    },
  });
  if (!updated) throw new AppError(404, "Project not found");
  const { memberAssignments, ...projectDetails } = updated;
  return {
    ...projectDetails,
    assignedMembers: memberAssignments.map((assignment) => assignment.user),
  };
}
