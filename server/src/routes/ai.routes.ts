import { Router } from "express";
import { chat } from "../controllers/ai.controller.js";
import { authorizeRoles } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async.js";

export const aiRouter = Router();
aiRouter.post("/chat", authorizeRoles("MANAGER", "ADMIN"), asyncHandler(chat));
