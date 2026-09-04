import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/errors.js";

export const notFound: RequestHandler = (_req, _res, next) =>
  next(new AppError(404, "Route not found"));
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError)
    return res
      .status(400)
      .json({ message: "Validation failed", errors: err.flatten() });
  if (
    err instanceof SyntaxError &&
    (err as SyntaxError & { status?: number }).status === 400
  )
    return res.status(400).json({ message: "Malformed JSON request body" });
  if (typeof err?.status === "number" && err.status >= 400 && err.status < 500)
    return res.status(err.status).json({
      message: err.status === 413 ? "Request body is too large" : "Invalid request",
    });
  if (err instanceof AppError)
    return res
      .status(err.statusCode)
      .json({ message: err.message, details: err.details });
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002"
  )
    return res
      .status(409)
      .json({ message: "A record with these values already exists" });
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2025"
  )
    return res.status(404).json({ message: "Record not found" });
  console.error(err);
  return res.status(500).json({ message: "Internal server error" });
};
