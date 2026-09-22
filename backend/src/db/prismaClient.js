import { PrismaClient } from "@prisma/client";

// The one PrismaClient for the whole app — import this, never `new PrismaClient()`.
export const prisma = new PrismaClient();
