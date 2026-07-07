import { db } from "@shopli/db";
import { auth } from "@/lib/auth";

export async function getSucursales() {
  const session = await auth();
  if (!session?.user?.empresa_id) {
    throw new Error("No autorizado");
  }

  return await db.sucursal.findMany({
    where: { 
      activo: true, 
      empresa_id: session.user.empresa_id 
    },
    orderBy: { nombre: "asc" },
  });
}
