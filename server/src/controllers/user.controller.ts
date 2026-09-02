import type { Request, Response } from "express";
import { z } from "zod";
import * as users from "../services/user.service.js";

const roleSchema = z.object({
  role: z.enum(["TEAM_MEMBER", "MANAGER", "ADMIN"]),
});
const statusSchema = z.object({ isActive: z.boolean() });

export const list = async (_req: Request, res: Response) =>
  res.json(await users.listUsers());

export const profile = async (req: Request, res: Response) =>
  res.json(await users.getUserProfile(String(req.params.id)));

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
