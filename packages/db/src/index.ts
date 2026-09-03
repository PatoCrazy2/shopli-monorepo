import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const db =
    globalForPrisma.prisma ??
    new PrismaClient({
        log:
            (globalThis as any).process?.env?.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });

if ((globalThis as any).process?.env?.NODE_ENV !== "production") globalForPrisma.prisma = db;

export { Role, EstadoTurno, EstadoVenta, SyncStatus, Prisma, GastoCategoria, AuditStatus, SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
export type * from "@prisma/client";
