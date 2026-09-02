import type { Request, Response } from "express";
import * as projects from "../services/project.service.js";
import { projectSchema } from "../validators/schemas.js";

export const list = async (req: Request, res: Response) =>
  res.json(await projects.listProjects(req.user!.role));

export const create = async (req: Request, res: Response) =>
  res
    .status(201)
    .json(await projects.createProject(projectSchema.parse(req.body)));

export const update = async (req: Request, res: Response) =>
  res.json(
    await projects.updateProject(
      String(req.params.id),
      projectSchema.partial().parse(req.body),
    ),
  );

export const remove = async (req: Request, res: Response) => {
  const project = await projects.removeProject(String(req.params.id));
  return project ? res.json(project) : res.status(204).send();
};
