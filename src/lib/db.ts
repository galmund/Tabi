import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and point it at your Neon database."
  );
}

const createClient = () =>
  new PrismaClient({
    log: process.env.LOG_QUERIES === "1" ? ["query"] : [],
    adapter: new PrismaPg({
      connectionString,
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    }),
  });

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createClient>;
  prismaClass?: typeof PrismaClient;
};

// After `prisma generate` the dev server hot-reloads a new PrismaClient class; a client cached from the old one lacks new models.
const cached = globalForPrisma.prismaClass === PrismaClient ? globalForPrisma.prisma : undefined;
if (globalForPrisma.prisma && !cached) void globalForPrisma.prisma.$disconnect();

export const prisma = cached ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaClass = PrismaClient;
}
