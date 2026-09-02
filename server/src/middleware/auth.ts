import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/errors.js";

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : undefined;
  if (!token) return next(new AppError(401, "Authentication required"));
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
      role: Role;
    };
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, isActive: true },
    });
    if (!user?.isActive)
      return next(new AppError(401, "Account is inactive or unavailable"));
    req.user = { userId: user.id, role: user.role };
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(new AppError(401, "Invalid or expired token"));
  }
}
export const authorizeRoles =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) =>
    req.user && roles.includes(req.user.role)
      ? next()
      : next(new AppError(403, "Insufficient permissions"));
