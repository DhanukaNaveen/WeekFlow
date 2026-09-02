import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { authorizeRoles } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async.js";
import { projectSchema } from "../validators/schemas.js";
export const projectRouter = Router();
projectRouter.get(
  "/",
  asyncHandler(async (req, res) =>
    res.json(
      await prisma.project.findMany({
        where: req.user!.role === "TEAM_MEMBER" ? { isActive: true } : {},
        orderBy: { name: "asc" },
      }),
    ),
  ),
);
projectRouter.post(
  "/",
  authorizeRoles("MANAGER", "ADMIN"),
  asyncHandler(async (req, res) =>
    res
      .status(201)
      .json(
        await prisma.project.create({ data: projectSchema.parse(req.body) }),
      ),
  ),
);
projectRouter.patch(
  "/:id",
  authorizeRoles("MANAGER", "ADMIN"),
  asyncHandler(async (req, res) =>
    res.json(
      await prisma.project.update({
        where: { id: String(req.params.id) },
        data: projectSchema.partial().parse(req.body),
      }),
    ),
  ),
);
projectRouter.delete(
  "/:id",
  authorizeRoles("MANAGER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const n = await prisma.report.count({
      where: { projectId: String(req.params.id) },
    });
    if (n)
      return res.json(
        await prisma.project.update({
          where: { id: String(req.params.id) },
          data: { isActive: false },
        }),
      );
    await prisma.project.delete({ where: { id: String(req.params.id) } });
    res.status(204).send();
  }),
);
