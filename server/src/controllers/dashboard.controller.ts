import type { Request, Response } from "express";
import * as dashboard from "../services/dashboard.service.js";
import { z } from "zod";

const sectionQuerySchema = z.object({
  section: z.enum(["BLOCKERS", "ACHIEVEMENTS"]).default("BLOCKERS"),
  week: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const member = async (req: Request, res: Response) =>
  res.json(await dashboard.memberDashboard(req.user!.userId));

export const manager = async (_req: Request, res: Response) =>
  res.json(await dashboard.managerDashboard());

export const activity = async (_req: Request, res: Response) =>
  res.json(await dashboard.recentActivity());

export const sections = async (req: Request, res: Response) => {
  const query = sectionQuerySchema.parse(req.query);
  return res.json(await dashboard.sectionView(query.section, query.week));
};
