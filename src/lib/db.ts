import { PrismaClient } from "@prisma/client";

// Connection pool size derived from env or safe defaults for a single-instance Next.js deployment.
// For multi-instance deploys (e.g., Kubernetes), set DATABASE_POOL_SIZE per-pod to avoid exhausting MySQL's max_connections.
const POOL_SIZE = parseInt(process.env.DATABASE_POOL_SIZE ?? "10", 10);

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
          ? `${process.env.DATABASE_URL}${process.env.DATABASE_URL.includes("?") ? "&" : "?"}connection_limit=${POOL_SIZE}&pool_timeout=20`
          : undefined,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
