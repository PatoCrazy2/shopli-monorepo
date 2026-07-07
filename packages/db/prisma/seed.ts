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

  // 0. Crear Empresas por defecto
  const empresaA = await prisma.empresa.create({
    data: {
      nombre: "Empresa Coca-Cola",
    },
  });

  const empresaB = await prisma.empresa.create({
    data: {
      nombre: "Empresa Pepsi",
    },
  });

  // 1. Configuración de Usuario Dueño (Admin Maestro) de Empresa A
  const adminEmail = process.env.ADMIN_EMAIL || "admin@shopli.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const dueno = await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Administrador Maestro",
      role: Role.DUENO,
      pin_hash: passwordHash,
      empresa_id: empresaA.id,
    },
  });

  // 2. Sucursales de prueba
  const sucursalA = await prisma.sucursal.create({
    data: {
      nombre: "Sucursal Centro A",
      direccion: "Calle Coca-Cola 123",
      empresa_id: empresaA.id,
    },
  });

  const sucursalB = await prisma.sucursal.create({
    data: {
      nombre: "Sucursal Centro B",
      direccion: "Calle Pepsi 456",
      empresa_id: empresaB.id,
    },
  });

  // 3. Cajeros de prueba (PIN: 1111 y 2222)
  const pinHashA = await bcrypt.hash("1111", 10);
  const cajeroA = await prisma.user.create({
    data: {
      email: "cajeroa@shopli.com",
      name: "Cajero Coca-Cola",
      role: Role.CAJERO,
      pin_hash: pinHashA,
      empresa_id: empresaA.id,
    },
  });

  const pinHashB = await bcrypt.hash("2222", 10);
  const cajeroB = await prisma.user.create({
    data: {
      email: "cajerob@shopli.com",
      name: "Cajero Pepsi",
      role: Role.CAJERO,
      pin_hash: pinHashB,
      empresa_id: empresaB.id,
    },
  });

  // 4. Productos de prueba
  // Empresa A (Coca-Cola)
  const prodA1 = await prisma.producto.create({
    data: {
      nombre: "Coca-Cola Original 600ml",
      codigo_interno: "COCA600",
      costo: 15.00,
      precio_publico: 20.00,
      categoria: "Refrescos",
      empresa_id: empresaA.id,
    },
  });

  const prodA2 = await prisma.producto.create({
    data: {
      nombre: "Sprite 600ml",
      codigo_interno: "SPRITE600",
      costo: 14.00,
      precio_publico: 18.00,
      categoria: "Refrescos",
      empresa_id: empresaA.id,
    },
  });

  // Empresa B (Pepsi)
  const prodB1 = await prisma.producto.create({
    data: {
      nombre: "Pepsi Black 600ml",
      codigo_interno: "PEPSI600",
      costo: 13.00,
      precio_publico: 19.00,
      categoria: "Refrescos",
      empresa_id: empresaB.id,
    },
  });

  const prodB2 = await prisma.producto.create({
    data: {
      nombre: "Mirinda 600ml",
      codigo_interno: "MIRINDA600",
      costo: 12.00,
      precio_publico: 17.00,
      categoria: "Refrescos",
      empresa_id: empresaB.id,
    },
  });

  // 5. Inventario en Sucursales
  await prisma.inventario_Sucursal.createMany({
    data: [
      { sucursal_id: sucursalA.id, producto_id: prodA1.id, cantidad: 50 },
      { sucursal_id: sucursalA.id, producto_id: prodA2.id, cantidad: 30 },
      { sucursal_id: sucursalB.id, producto_id: prodB1.id, cantidad: 45 },
      { sucursal_id: sucursalB.id, producto_id: prodB2.id, cantidad: 25 },
    ],
  });

  console.log("Seed: Empresas, Sucursales, Cajeros y Productos con inventario configurados correctamente.");
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
