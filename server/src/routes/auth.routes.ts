import { Router } from "express";
import * as c from "../controllers/auth.controller.js";
import { asyncHandler } from "../middleware/async.js";
import { authenticate } from "../middleware/auth.js";
export const authRouter = Router();
authRouter.post("/register", asyncHandler(c.register));
authRouter.post("/login", asyncHandler(c.login));
authRouter.get("/me", authenticate, asyncHandler(c.me));
authRouter.post("/logout", authenticate, asyncHandler(c.logout));
