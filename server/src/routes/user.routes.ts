import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { authorizeRoles } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async.js";
import { z } from "zod";
import { AppError } from "../utils/errors.js";
const safe = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;
export const userRouter = Router();
userRouter.use(authorizeRoles("MANAGER", "ADMIN"));
userRouter.get(
  "/",
  asyncHandler(async (_req, res) =>
    res.json(
      await prisma.user.findMany({ select: safe, orderBy: { name: "asc" } }),
    ),
  ),
);
userRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const user: any = await prisma.user.findUnique({
      where: { id: String(req.params.id) },
      select: {
        ...safe,
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
    const rs = user.reports;
    res.json({
      ...user,
      statistics: {
        total: rs.length,
        approved: rs.filter((r: any) => r.status === "APPROVED").length,
        corrections: rs.filter((r: any) => r.status === "NEEDS_CORRECTION").length,
        averageCompletedTasks: rs.length
          ? rs.reduce((n: number, r: any) => n + r._count.tasks, 0) / rs.length
          : 0,
        openBlockers: rs
          .flatMap((r: any) => r.blockers)
          .filter((b: any) => b.status === "OPEN").length,
      },
    });
  }),
);
userRouter.patch(
  "/:id/role",
  authorizeRoles("ADMIN"),
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user!.userId)
      throw new AppError(400, "You cannot change your own role");
    const { role } = z
      .object({ role: z.enum(["TEAM_MEMBER", "MANAGER", "ADMIN"]) })
      .parse(req.body);
    res.json(
      await prisma.user.update({
        where: { id: String(req.params.id) },
        data: { role },
        select: safe,
      }),
    );
  }),
);
userRouter.patch(
  "/:id/status",
  authorizeRoles("ADMIN"),
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user!.userId)
      throw new AppError(400, "You cannot deactivate yourself");
    const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
    res.json(
      await prisma.user.update({
        where: { id: String(req.params.id) },
        data: { isActive },
        select: safe,
      }),
    );
  }),
);
