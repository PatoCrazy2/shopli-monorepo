import { db } from "@shopli/db";
import { auth } from "@/lib/auth";

export type UserStatusFilter = "active" | "inactive" | "all";

export interface GetUsersOptions {
  status?: UserStatusFilter;
  search?: string;
  limit?: number;
}

export async function getUsers(options: GetUsersOptions = {}) {
  const session = await auth();
  if (!session?.user?.empresa_id) {
    throw new Error("No autorizado");
  }

  const { status = "active", search = "", limit = 100 } = options;

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
    take: limit,
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

  // 1 sola consulta con groupBy para reducir consumo de conexiones simultáneas en Neon
  const counts = await db.user.groupBy({
    by: ["active"],
    where: { empresa_id },
    _count: {
      _all: true,
    },
  });

  let active = 0;
  let inactive = 0;

  for (const group of counts) {
    if (group.active) {
      active = group._count._all;
    } else {
      inactive = group._count._all;
    }
  }

  const total = active + inactive;

  return { active, inactive, total };
}
