import type { Request, Response } from "express";
import * as dashboard from "../services/dashboard.service.js";

export const member = async (req: Request, res: Response) =>
  res.json(await dashboard.memberDashboard(req.user!.userId));

export const manager = async (_req: Request, res: Response) =>
  res.json(await dashboard.managerDashboard());

export const activity = async (_req: Request, res: Response) =>
  res.json(await dashboard.recentActivity());

export const sections = async (req: Request, res: Response) =>
  res.json(
    await dashboard.sectionView(
      String(req.query.section || "BLOCKERS"),
      req.query.week ? String(req.query.week) : undefined,
    ),
  );
