import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";

const publicUser = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;
export async function register(input: {
  name: string;
  email: string;
  password: string;
}) {
  const exists = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });
  if (exists) throw new AppError(409, "Email already registered");
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash: await bcrypt.hash(input.password, 12),
    },
    select: publicUser,
  });
}
export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    throw new AppError(401, "Invalid email or password");
  if (!user.isActive) throw new AppError(403, "Account is inactive");
  const token = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: "8h",
  });
  const { passwordHash: _, ...safeUser } = user;
  return { token, user: safeUser };
}
export const getMe = (id: string) =>
  prisma.user.findUnique({ where: { id }, select: publicUser });
