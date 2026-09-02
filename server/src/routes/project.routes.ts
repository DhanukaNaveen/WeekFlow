import { Router } from "express";
import * as projects from "../controllers/project.controller.js";
import { authorizeRoles } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async.js";

export const projectRouter = Router();
projectRouter.get("/", asyncHandler(projects.list));
projectRouter.post(
  "/",
  authorizeRoles("MANAGER", "ADMIN"),
  asyncHandler(projects.create),
);
projectRouter.patch(
  "/:id",
  authorizeRoles("MANAGER", "ADMIN"),
  asyncHandler(projects.update),
);
projectRouter.delete(
  "/:id",
  authorizeRoles("MANAGER", "ADMIN"),
  asyncHandler(projects.remove),
);
