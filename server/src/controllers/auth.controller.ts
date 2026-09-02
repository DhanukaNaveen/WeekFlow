import type { Request,Response } from 'express';
import * as auth from '../services/auth.service.js';
import { loginSchema,registerSchema } from '../validators/schemas.js';
export const register=async(req:Request,res:Response)=>res.status(201).json(await auth.register(registerSchema.parse(req.body)));
export const login=async(req:Request,res:Response)=>{const b=loginSchema.parse(req.body);res.json(await auth.login(b.email,b.password));};
export const me=async(req:Request,res:Response)=>res.json(await auth.getMe(req.user!.userId));
export const logout=async(_req:Request,res:Response)=>res.status(204).send();
