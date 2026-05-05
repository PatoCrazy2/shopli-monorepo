const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.turno.count();
  console.log('Total Turnos:', count);
  
  if (count > 0) {
    const sample = await prisma.turno.findFirst({
      include: { sucursal: true }
    });
    console.log('Sample Turno:', JSON.stringify(sample, null, 2));
  } else {
    const sucursales = await prisma.sucursal.findMany();
    console.log('Sucursales available:', JSON.stringify(sucursales, null, 2));
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
