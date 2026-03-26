import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seed: Iniciando limpieza y siembra...");

  // Limpiar tablas (en orden inverso de relaciones)
  await prisma.detalle_Venta.deleteMany();
  await prisma.venta.deleteMany();
  await prisma.auditItem.deleteMany();
  await prisma.inventoryAudit.deleteMany();
  await prisma.turno.deleteMany();
  await prisma.inventario_Sucursal.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.sucursal.deleteMany();
  await prisma.user.deleteMany();

  console.log("Seed: Tablas limpias.");

  // 1. Crear Sucursales
  const s1 = await prisma.sucursal.create({
    data: {
      nombre: "Sucursal 1",
      direccion: "Centro Histórico, Local 45",
    },
  });

  const s2 = await prisma.sucursal.create({
    data: {
      nombre: "Sucursal 2",
      direccion: "Centro Comercial Norte, Local 12",
    },
  });

  console.log(`Seed: Sucursales creadas (${s1.nombre}, ${s2.nombre}).`);

  // 2. Crear Usuarios
  // PIN 1234 para cajero
  const pinHash = await bcrypt.hash("1234", 10);
  
  const cajero = await prisma.user.create({
    data: {
      email: "cajero@shopli.com",
      name: "Cajero Principal",
      role: Role.CAJERO,
      pin_hash: pinHash,
    },
  });

  // Password para dueño (para el Admin Dashboard)
  const passwordHash = await bcrypt.hash("admin123", 10);

  const dueno = await prisma.user.create({
    data: {
      email: "dueno@shopli.com",
      name: "Dueño ShopLI",
      role: Role.DUENO,
      pin_hash: passwordHash, // Usamos el mismo campo o asumimos que Auth.js usará este para password
    },
  });

  console.log(`Seed: Usuarios creados (${cajero.email}, ${dueno.email}).`);

  // 3. Crear Productos
  const p1 = await prisma.producto.create({
    data: {
      nombre: "Pulsera",
      codigo_interno: "PUL-001",
      costo: 25.50,
      precio_publico: 50.00,
      categoria: "Accesorios",
    },
  });

  const p2 = await prisma.producto.create({
    data: {
      nombre: "Imán",
      codigo_interno: "IMA-001",
      costo: 10.00,
      precio_publico: 25.00,
      categoria: "Souvenirs",
    },
  });

  console.log(`Seed: Productos creados (${p1.nombre}, ${p2.nombre}).`);

  // 4. Asignar Stock
  // Pulsera: 100 en Sucursal 1
  await prisma.inventario_Sucursal.create({
    data: {
      sucursal_id: s1.id,
      producto_id: p1.id,
      cantidad: 100,
    },
  });

  // Imán: 50 en Sucursal 1
  await prisma.inventario_Sucursal.create({
    data: {
      sucursal_id: s1.id,
      producto_id: p2.id,
      cantidad: 50,
    },
  });

  console.log("Seed: Inventario inicial asignado a Sucursal 1.");

  console.log("Seed: ¡Siembra completada con éxito!");
}

main()
  .catch((e) => {
    console.error("Seed: Error durante la siembra:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
