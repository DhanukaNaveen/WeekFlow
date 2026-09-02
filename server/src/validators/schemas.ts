import { z } from 'zod';

export const registerSchema = z.object({ name:z.string().trim().min(2), email:z.string().email(), password:z.string().min(8) });
export const loginSchema = z.object({ email:z.string().email(), password:z.string().min(1) });
const task = z.object({ name:z.string().trim().min(1), priority:z.enum(['LOW','MEDIUM','HIGH']), plannedPercentage:z.number().int().min(0).max(100), actualPercentage:z.number().int().min(0).max(100), status:z.enum(['NOT_STARTED','IN_PROGRESS','COMPLETED','BLOCKED']), plannedTime:z.number().min(0), actualTime:z.number().min(0), deliverable:z.string() });
const nextTask = z.object({ name:z.string().trim().min(1), description:z.string().optional().default(''), priority:z.enum(['LOW','MEDIUM','HIGH']) });
const blocker = z.object({ title:z.string().trim().min(1), description:z.string().min(1), isKeyIssue:z.boolean().default(false), status:z.enum(['OPEN','RESOLVED']).default('OPEN') });
const achievement = z.object({ title:z.string().trim().min(1), description:z.string().min(1), isKeyAchievement:z.boolean().default(false) });
const hours = z.object({ workType:z.string().trim().min(1), hours:z.number().min(0).max(168) });
export const reportSchema = z.object({
  projectId:z.string().min(1), weekStartDate:z.coerce.date(), weekEndDate:z.coerce.date(), notes:z.string().optional().nullable(), links:z.array(z.string().url()).default([]),
  tasks:z.array(task).default([]), nextWeekTasks:z.array(nextTask).default([]), blockers:z.array(blocker).default([]), achievements:z.array(achievement).default([]), workHours:z.array(hours).default([])
}).refine(v=>v.weekEndDate >= v.weekStartDate,{message:'Week end must be after week start',path:['weekEndDate']})
  .refine(v=>v.blockers.filter(x=>x.isKeyIssue).length<=1,{message:'Only one key issue is allowed',path:['blockers']})
  .refine(v=>v.achievements.filter(x=>x.isKeyAchievement).length<=1,{message:'Only one key achievement is allowed',path:['achievements']});
export const projectSchema = z.object({ name:z.string().trim().min(2), description:z.string().optional().nullable(), isActive:z.boolean().optional() });
