import { Router } from "express";
import * as dashboard from "../controllers/dashboard.controller.js";
import { authorizeRoles } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async.js";

export const dashboardRouter = Router();
dashboardRouter.get(
  "/member",
  authorizeRoles("TEAM_MEMBER"),
  asyncHandler(dashboard.member),
);
dashboardRouter.get(
  "/manager",
  authorizeRoles("MANAGER", "ADMIN"),
  asyncHandler(dashboard.manager),
);
dashboardRouter.get(
  "/activity",
  authorizeRoles("MANAGER", "ADMIN"),
  asyncHandler(dashboard.activity),
);
dashboardRouter.get(
  "/section-view",
  authorizeRoles("MANAGER", "ADMIN"),
  asyncHandler(dashboard.sections),
);
