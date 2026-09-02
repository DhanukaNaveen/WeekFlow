export type Role='TEAM_MEMBER'|'MANAGER'|'ADMIN';export type Status='DRAFT'|'SUBMITTED'|'NEEDS_CORRECTION'|'APPROVED'|'NOT_STARTED';
export interface User{id:string;name:string;email:string;role:Role;isActive:boolean;createdAt:string;statistics?:Record<string,number>;reports?:Report[]}
export interface Project{id:string;name:string;description?:string;isActive:boolean}
export interface Report{id:string;userId:string;projectId:string;weekStartDate:string;weekEndDate:string;status:Status;notes?:string;links:string[];submittedAt?:string;updatedAt:string;user:Pick<User,'id'|'name'|'email'>;project:Project;tasks:any[];nextWeekTasks:any[];blockers:any[];achievements:any[];workHours:any[];reviews:any[];versions:any[];_count?:{tasks:number;blockers:number}}
