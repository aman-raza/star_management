import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { UserCreateInput } from "@/lib/validations";
import type { Role } from "@/generated/prisma/client";

/**
 * Get all users (admin only). Returns safe user objects (no password hashes).
 */
export async function getUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get all members (for assignment dropdowns).
 */
export async function getMembers() {
  return prisma.user.findMany({
    where: { role: "member" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
    orderBy: { name: "asc" },
  });
}

/**
 * Create a new user with hashed password.
 */
export async function createUser(data: UserCreateInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("A user with this email already exists");
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  return prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      role: data.role as Role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });
}
