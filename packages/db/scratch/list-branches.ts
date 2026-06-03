// @ts-nocheck
import { PrismaClient } from "@prisma/client";
import process from "process";

process.env.DATABASE_URL = "postgresql://neondb_owner:npg_NYuiSr50bBpk@ep-billowing-flower-am06kg3o-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const prisma = new PrismaClient();
async function main() {
  const branches = await prisma.sucursal.findMany();
  console.log("Branches in DB:", branches);
}
main().catch(console.error).finally(() => prisma.$disconnect());
