import { Router } from "express";
import * as users from "../controllers/user.controller.js";
import { authorizeRoles } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async.js";

export const userRouter = Router();
userRouter.use(authorizeRoles("MANAGER", "ADMIN"));
userRouter.get("/", asyncHandler(users.list));
userRouter.get("/:id", asyncHandler(users.profile));
userRouter.patch(
  "/:id/role",
  authorizeRoles("ADMIN"),
  asyncHandler(users.updateRole),
);
userRouter.patch(
  "/:id/status",
  authorizeRoles("ADMIN"),
  asyncHandler(users.updateStatus),
);
