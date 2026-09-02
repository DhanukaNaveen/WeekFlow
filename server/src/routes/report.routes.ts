import { Router } from "express";
import * as c from "../controllers/report.controller.js";
import { asyncHandler } from "../middleware/async.js";
import { authorizeRoles } from "../middleware/auth.js";
export const reportRouter = Router();
reportRouter.post("/", authorizeRoles("TEAM_MEMBER"), asyncHandler(c.create));
reportRouter.get("/my", authorizeRoles("TEAM_MEMBER"), asyncHandler(c.mine));
reportRouter.get("/", authorizeRoles("MANAGER", "ADMIN"), asyncHandler(c.list));
reportRouter.get("/:id/reviews", asyncHandler(c.reviews));
reportRouter.get("/:id/versions", asyncHandler(c.versions));
reportRouter.get("/:id", asyncHandler(c.get));
reportRouter.patch(
  "/:id",
  authorizeRoles("TEAM_MEMBER"),
  asyncHandler(c.update),
);
reportRouter.post(
  "/:id/submit",
  authorizeRoles("TEAM_MEMBER"),
  asyncHandler(c.submit),
);
reportRouter.post(
  "/:id/approve",
  authorizeRoles("MANAGER", "ADMIN"),
  asyncHandler(c.approve),
);
reportRouter.post(
  "/:id/request-changes",
  authorizeRoles("MANAGER", "ADMIN"),
  asyncHandler(c.changes),
);
