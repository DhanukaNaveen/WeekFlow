import type { Request, Response } from "express";
import { z } from "zod";
import { askManagerAssistant } from "../services/ai.service.js";

const questionSchema = z.object({
  message: z.string().trim().min(2).max(1000),
});

export const chat = async (req: Request, res: Response) => {
  const { message } = questionSchema.parse(req.body);
  return res.json(await askManagerAssistant(message));
};
