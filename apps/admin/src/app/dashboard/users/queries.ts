import { db } from "@shopli/db";
import { auth } from "@/lib/auth";

export async function getUsers() {
  const session = await auth();
  if (!session?.user?.empresa_id) {
    throw new Error("No autorizado");
  }

  return await db.user.findMany({
    where: {
      empresa_id: session.user.empresa_id
    },
    select: {
      id: true,
      name: true,
      email: true,
      // @ts-ignore - 'numero_tel' exist in db
      numero_tel: true,
      role: true,
      // @ts-ignore - 'active' está en el schema de la bd real
      active: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
