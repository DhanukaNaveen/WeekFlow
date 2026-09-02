import { Prisma, ReportStatus, Role } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/errors.js';

export const reportInclude = { user:{select:{id:true,name:true,email:true}}, project:true, tasks:true, nextWeekTasks:true, blockers:true, achievements:true, workHours:true, reviews:{include:{reviewer:{select:{id:true,name:true}},version:{select:{versionNumber:true}},},orderBy:{createdAt:'desc' as const}}, versions:{select:{id:true,versionNumber:true,submittedAt:true,snapshot:true},orderBy:{versionNumber:'desc' as const}} };
type ReportInput={projectId:string;weekStartDate:Date;weekEndDate:Date;notes?:string|null;links:string[];tasks:any[];nextWeekTasks:any[];blockers:any[];achievements:any[];workHours:any[]};
const children=(input:ReportInput)=>({tasks:{create:input.tasks},nextWeekTasks:{create:input.nextWeekTasks},blockers:{create:input.blockers},achievements:{create:input.achievements},workHours:{create:input.workHours}});

export async function createReport(userId:string,input:ReportInput){
  const project=await prisma.project.findUnique({where:{id:input.projectId}}); if(!project?.isActive) throw new AppError(400,'Select an active project');
  return prisma.report.create({data:{userId,projectId:input.projectId,weekStartDate:input.weekStartDate,weekEndDate:input.weekEndDate,notes:input.notes,links:input.links,...children(input)},include:reportInclude});
}
export async function updateReport(userId:string,id:string,input:ReportInput){
  const report=await prisma.report.findUnique({where:{id}}); if(!report) throw new AppError(404,'Report not found');
  if(report.userId!==userId) throw new AppError(403,'You can only edit your own reports');
  if(!['DRAFT','NEEDS_CORRECTION'].includes(report.status)) throw new AppError(409,'This report is read-only in its current status');
  return prisma.$transaction(async tx=>{
    await Promise.all([tx.reportTask.deleteMany({where:{reportId:id}}),tx.nextWeekTask.deleteMany({where:{reportId:id}}),tx.blocker.deleteMany({where:{reportId:id}}),tx.achievement.deleteMany({where:{reportId:id}}),tx.workHour.deleteMany({where:{reportId:id}})]);
    return tx.report.update({where:{id},data:{projectId:input.projectId,weekStartDate:input.weekStartDate,weekEndDate:input.weekEndDate,notes:input.notes,links:input.links,...children(input)},include:reportInclude});
  });
}
export async function getReport(user:{userId:string;role:Role},id:string){
  const report=await prisma.report.findUnique({where:{id},include:reportInclude}); if(!report) throw new AppError(404,'Report not found');
  if(user.role==='TEAM_MEMBER'&&report.userId!==user.userId) throw new AppError(403,'You cannot access another member’s report'); return report;
}
export async function submitReport(userId:string,id:string){
  const report=await prisma.report.findUnique({where:{id},include:{tasks:true,nextWeekTasks:true,blockers:true,achievements:true,workHours:true}}); if(!report) throw new AppError(404,'Report not found');
  if(report.userId!==userId) throw new AppError(403,'You can only submit your own reports'); if(!['DRAFT','NEEDS_CORRECTION'].includes(report.status)) throw new AppError(409,'Only draft or corrected reports can be submitted');
  if(!report.tasks.length) throw new AppError(400,'At least one completed-task entry is required');
  return prisma.$transaction(async tx=>{
    const count=await tx.reportVersion.count({where:{reportId:id}}); const submittedAt=new Date();
    const snapshot={projectId:report.projectId,weekStartDate:report.weekStartDate,weekEndDate:report.weekEndDate,notes:report.notes,links:report.links,tasks:report.tasks,nextWeekTasks:report.nextWeekTasks,blockers:report.blockers,achievements:report.achievements,workHours:report.workHours};
    await tx.reportVersion.create({data:{reportId:id,versionNumber:count+1,snapshot: snapshot as Prisma.InputJsonValue,submittedAt}});
    const updated=await tx.report.update({where:{id},data:{status:'SUBMITTED',submittedAt},include:reportInclude});
    await tx.activityLog.create({data:{actorId:userId,action:count?'REPORT_RESUBMITTED':'REPORT_SUBMITTED',description:`${count?'Resubmitted':'Submitted'} report for ${report.weekStartDate.toISOString().slice(0,10)}`}}); return updated;
  });
}
export async function reviewReport(reviewerId:string,id:string,action:'APPROVED'|'CHANGES_REQUESTED',comment?:string){
  const report=await prisma.report.findUnique({where:{id},include:{versions:{orderBy:{versionNumber:'desc'},take:1}}}); if(!report) throw new AppError(404,'Report not found');
  if(report.status!=='SUBMITTED') throw new AppError(409,'Only submitted reports can be reviewed'); if(action==='CHANGES_REQUESTED'&&!comment?.trim()) throw new AppError(400,'A correction comment is required');
  const version=report.versions[0]; if(!version) throw new AppError(409,'Submitted version is missing'); const status:ReportStatus=action==='APPROVED'?'APPROVED':'NEEDS_CORRECTION';
  return prisma.$transaction(async tx=>{await tx.review.create({data:{reportId:id,reviewerId,versionId:version.id,action,comment:comment?.trim()}});await tx.report.update({where:{id},data:{status,approvedAt:action==='APPROVED'?new Date():null}});await tx.activityLog.create({data:{actorId:reviewerId,action,description:`${action==='APPROVED'?'Approved':'Requested changes to'} report ${id}`}});return tx.report.findUnique({where:{id},include:reportInclude});});
}
export async function listReports(user:{userId:string;role:Role},q:Record<string,string|undefined>,own=false){
  const page=Math.max(1,Number(q.page)||1),limit=Math.min(100,Math.max(1,Number(q.limit)||10));
  if(!own&&user.role!=='TEAM_MEMBER'&&q.status==='NOT_STARTED'){
    if(!q.startDate) throw new AppError(400,'A week start date is required for NOT_STARTED');
    const week=new Date(q.startDate);const members=await prisma.user.findMany({where:{role:'TEAM_MEMBER',isActive:true,...(q.userId?{id:q.userId}:{})},select:{id:true,name:true,email:true},orderBy:{name:'asc'}});
    const started=await prisma.report.findMany({where:{weekStartDate:week,userId:{in:members.map(m=>m.id)}},select:{userId:true}});const ids=new Set(started.map(r=>r.userId));const missing=members.filter(m=>!ids.has(m.id));
    return {items:missing.slice((page-1)*limit,page*limit).map(m=>({id:`not-started-${m.id}`,userId:m.id,weekStartDate:week,weekEndDate:new Date(week.getTime()+4*86400000),status:'NOT_STARTED',updatedAt:week,user:m,project:{id:'',name:'—',isActive:true}})),pagination:{page,limit,total:missing.length,pages:Math.ceil(missing.length/limit)}};
  }
  const where:Prisma.ReportWhereInput={...(own||user.role==='TEAM_MEMBER'?{userId:user.userId}:{}),...(q.userId?{userId:q.userId}:{}),...(q.projectId?{projectId:q.projectId}:{}),...(q.status?{status:q.status as ReportStatus}:{}),...(q.startDate||q.endDate?{weekStartDate:{...(q.startDate?{gte:new Date(q.startDate)}:{}),...(q.endDate?{lte:new Date(q.endDate)}:{})}}:{})};
  const [items,total]=await prisma.$transaction([prisma.report.findMany({where,include:{user:{select:{id:true,name:true,email:true}},project:true,_count:{select:{tasks:true,blockers:true}},reviews:{orderBy:{createdAt:'desc'},take:1}},orderBy:{weekStartDate:'desc'},skip:(page-1)*limit,take:limit}),prisma.report.count({where})]);
  return {items,pagination:{page,limit,total,pages:Math.ceil(total/limit)}};
}
