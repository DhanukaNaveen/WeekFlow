import type { Request, Response } from "express";
import { reportSchema } from "../validators/schemas.js";
import * as reports from "../services/report.service.js";
export const create = async (req: Request, res: Response) =>
  res
    .status(201)
    .json(
      await reports.createReport(
        req.user!.userId,
        reportSchema.parse(req.body),
      ),
    );
export const update = async (req: Request, res: Response) =>
  res.json(
    await reports.updateReport(
      req.user!.userId,
      String(req.params.id),
      reportSchema.parse(req.body),
    ),
  );
export const get = async (req: Request, res: Response) =>
  res.json(await reports.getReport(req.user!, String(req.params.id)));
export const list = async (req: Request, res: Response) =>
  res.json(
    await reports.listReports(req.user!, req.query as Record<string, string>),
  );
export const mine = async (req: Request, res: Response) =>
  res.json(
    await reports.listReports(
      req.user!,
      req.query as Record<string, string>,
      true,
    ),
  );
export const submit = async (req: Request, res: Response) =>
  res.json(await reports.submitReport(req.user!.userId, String(req.params.id)));
export const approve = async (req: Request, res: Response) =>
  res.json(
    await reports.reviewReport(
      req.user!.userId,
      String(req.params.id),
      "APPROVED",
      req.body.comment,
    ),
  );
export const changes = async (req: Request, res: Response) =>
  res.json(
    await reports.reviewReport(
      req.user!.userId,
      String(req.params.id),
      "CHANGES_REQUESTED",
      req.body.comment,
    ),
  );
