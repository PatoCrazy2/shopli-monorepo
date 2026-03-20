import { db } from "@shopli/db";

export async function getUsers() {
  return await db.user.findMany({
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
