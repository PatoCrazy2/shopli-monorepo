import { db } from "@shopli/db";
import { auth } from "@/lib/auth";

export type UserStatusFilter = "active" | "inactive" | "all";

export interface GetUsersOptions {
  status?: UserStatusFilter;
  search?: string;
}

export async function getUsers(options: GetUsersOptions = {}) {
  const session = await auth();
  if (!session?.user?.empresa_id) {
    throw new Error("No autorizado");
  }

  const { status = "active", search = "" } = options;

  const where: any = {
    empresa_id: session.user.empresa_id,
  };

  if (status === "active") {
    where.active = true;
  } else if (status === "inactive") {
    where.active = false;
  }

  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    where.AND = [
      {
        OR: [
          { name: { contains: trimmedSearch, mode: "insensitive" } },
          { email: { contains: trimmedSearch, mode: "insensitive" } },
          { numero_tel: { contains: trimmedSearch, mode: "insensitive" } },
        ],
      },
    ];
  }

  return await db.user.findMany({
    where,
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

export async function getUserCounts() {
  const session = await auth();
  if (!session?.user?.empresa_id) {
    throw new Error("No autorizado");
  }

  const empresa_id = session.user.empresa_id;

  const [active, inactive, total] = await Promise.all([
    db.user.count({ where: { empresa_id, active: true } }),
    db.user.count({ where: { empresa_id, active: false } }),
    db.user.count({ where: { empresa_id } }),
  ]);

  return { active, inactive, total };
}
