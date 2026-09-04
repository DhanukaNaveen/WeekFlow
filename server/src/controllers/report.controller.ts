import type { Request, Response } from "express";
import {
  approvalSchema,
  correctionSchema,
  reportQuerySchema,
  reportSchema,
} from "../validators/schemas.js";
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
    await reports.listReports(req.user!, reportQuerySchema.parse(req.query)),
  );
export const mine = async (req: Request, res: Response) =>
  res.json(
    await reports.listReports(
      req.user!,
      reportQuerySchema.parse(req.query),
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
      approvalSchema.parse(req.body ?? {}).comment,
    ),
  );
export const changes = async (req: Request, res: Response) =>
  res.json(
    await reports.reviewReport(
      req.user!.userId,
      String(req.params.id),
      "CHANGES_REQUESTED",
      correctionSchema.parse(req.body).comment,
    ),
  );
export const reviews = async (req: Request, res: Response) =>
  res.json((await reports.getReport(req.user!, String(req.params.id))).reviews);
export const versions = async (req: Request, res: Response) =>
  res.json(
    (await reports.getReport(req.user!, String(req.params.id))).versions,
  );
