import type { Request, Response } from "express";
import { z } from "zod";
import { askManagerAssistant } from "../services/ai.service.js";

const questionSchema = z.object({
  message: z.string().trim().min(2).max(1000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string().trim().min(1).max(4000),
      }),
    )
    .max(10)
    .default([]),
});

export const chat = async (req: Request, res: Response) => {
  const { message, history } = questionSchema.parse(req.body);
  return res.json(await askManagerAssistant(message, history));
};
