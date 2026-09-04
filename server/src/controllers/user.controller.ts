import type { Request, Response } from "express";
import { z } from "zod";
import * as users from "../services/user.service.js";

const roleSchema = z.object({
  role: z.enum(["TEAM_MEMBER", "MANAGER", "ADMIN"]),
});
const statusSchema = z.object({ isActive: z.boolean() });
const profileQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const list = async (req: Request, res: Response) =>
  res.json(await users.listUsers(req.user!.role));

export const profile = async (req: Request, res: Response) => {
  const pagination = profileQuerySchema.parse(req.query);
  return res.json(
    await users.getUserProfile(req.user!.role, String(req.params.id), pagination),
  );
};

export const updateRole = async (req: Request, res: Response) => {
  const { role } = roleSchema.parse(req.body);
  return res.json(
    await users.changeRole(req.user!.userId, String(req.params.id), role),
  );
};

export const updateStatus = async (req: Request, res: Response) => {
  const { isActive } = statusSchema.parse(req.body);
  return res.json(
    await users.changeStatus(req.user!.userId, String(req.params.id), isActive),
  );
};
