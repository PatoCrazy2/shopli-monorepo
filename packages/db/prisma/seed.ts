import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seed: Iniciando limpieza para producción...");

  // Aunque migrate reset limpia las tablas, nos aseguramos por integridad
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Detalle_Venta" CASCADE;`);
  await prisma.movimientoInventario.deleteMany();
  await prisma.venta.deleteMany();
  await prisma.auditItem.deleteMany();
  await prisma.inventoryAudit.deleteMany();
  await prisma.dynamicAuditItem.deleteMany();
  await prisma.dynamicAudit.deleteMany();
  await prisma.turno.deleteMany();
  await prisma.inventario_Sucursal.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.sucursal.deleteMany();
  await prisma.user.deleteMany();
  await prisma.empresa.deleteMany();

  console.log("Seed: Tablas vaciadas.");

  // 0. Crear Empresa por defecto
  const empresa = await prisma.empresa.create({
    data: {
      nombre: "Empresa ShopLI Demo",
    },
  });

  // 1. Configuración de Usuario Dueño (Admin Maestro)
  // Usamos variables de entorno para seguridad en producción
  const adminEmail = process.env.ADMIN_EMAIL || "admin@shopli.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const dueno = await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Administrador Maestro",
      role: Role.DUENO,
      pin_hash: passwordHash, // Auth.js usará este campo para la contraseña
      empresa_id: empresa.id,
    },
  });

  console.log("Seed: Usuario administrativo maestro configurado correctamente.");
  console.log("Seed: ¡Base de datos lista para producción!");
}

main()
  .catch((e) => {
    console.error("Seed: Error durante la siembra:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
