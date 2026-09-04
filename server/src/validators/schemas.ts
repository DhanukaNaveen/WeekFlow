import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});
export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});
const task = z.object({
  name: z.string().trim().min(1).max(200),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  plannedPercentage: z.number().int().min(0).max(100),
  actualPercentage: z.number().int().min(0).max(100),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "BLOCKED"]),
  plannedTime: z.number().min(0).max(168),
  actualTime: z.number().min(0).max(168),
  deliverable: z.string().max(2000),
});
const nextTask = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional().default(""),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
});
const blocker = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional().default(""),
  isKeyIssue: z.boolean().default(false),
  status: z.enum(["OPEN", "RESOLVED"]).default("OPEN"),
});
const achievement = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional().default(""),
  isKeyAchievement: z.boolean().default(false),
});
const hours = z.object({
  workType: z.string().trim().min(1).max(100),
  hours: z.number().min(0).max(168),
});
export const reportSchema = z
  .object({
    projectId: z.string().min(1),
    weekStartDate: z.coerce.date(),
    weekEndDate: z.coerce.date(),
    notes: z.string().max(10000).optional().nullable(),
    links: z.array(z.string().url().max(2048)).max(50).default([]),
    tasks: z.array(task).max(100).default([]),
    nextWeekTasks: z.array(nextTask).max(100).default([]),
    blockers: z.array(blocker).max(100).default([]),
    achievements: z.array(achievement).max(100).default([]),
    workHours: z.array(hours).max(100).default([]),
  })
  .refine((v) => v.weekEndDate >= v.weekStartDate, {
    message: "Week end must be after week start",
    path: ["weekEndDate"],
  })
  .refine(
    (v) => {
      const nextWeek = new Date();
      nextWeek.setUTCHours(0, 0, 0, 0);
      nextWeek.setUTCDate(
        nextWeek.getUTCDate() - ((nextWeek.getUTCDay() + 6) % 7) + 7,
      );
      return v.weekStartDate < nextWeek;
    },
    {
      message: "Reports cannot be created for a future week.",
      path: ["weekStartDate"],
    },
  )
  .refine(
    (v) => {
      const nextWeek = new Date();
      nextWeek.setUTCHours(0, 0, 0, 0);
      nextWeek.setUTCDate(
        nextWeek.getUTCDate() - ((nextWeek.getUTCDay() + 6) % 7) + 7,
      );
      return v.weekEndDate < nextWeek;
    },
    {
      message: "The week end cannot be in a future week.",
      path: ["weekEndDate"],
    },
  )
  .refine((v) => v.blockers.filter((x) => x.isKeyIssue).length <= 1, {
    message: "Only one key issue is allowed",
    path: ["blockers"],
  })
  .refine((v) => v.achievements.filter((x) => x.isKeyAchievement).length <= 1, {
    message: "Only one key achievement is allowed",
    path: ["achievements"],
  });
export const projectSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
});
export const projectMembersSchema = z.object({
  memberIds: z
    .array(z.string().min(1))
    .max(500)
    .transform((ids) => [...new Set(ids)]),
});
export const correctionSchema = z.object({
  comment: z
    .string()
    .trim()
    .min(1, "A correction comment is required")
    .max(2000),
});
export const approvalSchema = z.object({
  comment: z.string().trim().max(2000).optional(),
});

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use an ISO date (YYYY-MM-DD)")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  }, "Use a valid calendar date");

const optionalQuery = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    schema.optional(),
  );

export const reportQuerySchema = z
  .object({
    userId: optionalQuery(z.string().min(1)),
    projectId: optionalQuery(z.string().min(1)),
    status: optionalQuery(
      z.enum([
        "DRAFT",
        "SUBMITTED",
        "NEEDS_CORRECTION",
        "APPROVED",
        "NOT_STARTED",
      ]),
    ),
    startDate: optionalQuery(isoDate),
    endDate: optionalQuery(isoDate),
    page: optionalQuery(z.string().regex(/^\d+$/)),
    limit: optionalQuery(z.string().regex(/^\d+$/)),
  })
  .refine(
    (query) =>
      !query.startDate || !query.endDate || query.startDate <= query.endDate,
    { message: "Start date must be on or before end date", path: ["endDate"] },
  );
