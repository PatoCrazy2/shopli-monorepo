"use server";

import { db } from "@shopli/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const productSchema = z.object({
  id: z.string().optional().or(z.literal("new")),
  codigo_interno: z.string().optional().nullable(),
  nombre: z.string().min(1, "El nombre es requerido"),
  precio_publico: z.coerce.number().min(0.01, "El precio debe ser mayor a 0"),
  costo: z.coerce.number().min(0, "El costo no puede ser negativo"),
  stock: z.coerce.number().min(0, "El stock no puede ser negativo").optional(),
});

export async function upsertProduct(formData: FormData) {
  const parseResult = productSchema.safeParse({
    id: formData.get("id"),
    codigo_interno: formData.get("codigo_interno"),
    nombre: formData.get("nombre"),
    precio_publico: formData.get("precio_publico"),
    costo: formData.get("costo"),
    stock: formData.get("stock"),
  });

  if (!parseResult.success) {
    return { error: "Datos inválidos", details: parseResult.error.flatten() };
  }

  const data = parseResult.data;

  try {
    if (data.id && data.id !== "new") {
      // Editar
      await db.producto.update({
        where: { id: data.id },
        data: {
          nombre: data.nombre,
          codigo_interno: data.codigo_interno || null,
          precio_publico: data.precio_publico,
          costo: data.costo,
          updatedAt: new Date(),
        },
      });

      // Actualizar stock si es necesario - simplificado (asume primera sucursal)
      // En una versión más madura recibiríamos sucursal_id o habría un componente global de sucursal
      if (data.stock !== undefined) {
         const firstSucursal = await db.sucursal.findFirst();
         if (firstSucursal) {
             const existingInv = await db.inventario_Sucursal.findFirst({
                 where: {
                     sucursal_id: firstSucursal.id,
                     producto_id: data.id
                 }
             });
             if (existingInv) {
                 await db.inventario_Sucursal.update({
                     where: { id: existingInv.id },
                     data: { cantidad: data.stock, updatedAt: new Date() }
                 });
             } else {
                 await db.inventario_Sucursal.create({
                     data: {
                         sucursal_id: firstSucursal.id,
                         producto_id: data.id,
                         cantidad: data.stock
                     }
                 });
             }
         }
      }

    } else {
      // Crear
      const newProduct = await db.producto.create({
        data: {
          nombre: data.nombre,
          codigo_interno: data.codigo_interno || null,
          precio_publico: data.precio_publico,
          costo: data.costo,
          // UpdatedAt is automatically set by Prisma, but we force it just in case
          updatedAt: new Date(),
        },
      });

      if (data.stock !== undefined) {
         const firstSucursal = await db.sucursal.findFirst();
         if (firstSucursal) {
             await db.inventario_Sucursal.create({
                 data: {
                     sucursal_id: firstSucursal.id,
                     producto_id: newProduct.id,
                     cantidad: data.stock,
                 }
             });
         }
      }
    }

    revalidatePath("/dashboard/catalog");
    return { success: true };
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { error: "⚠️ El SKU (código interno) ya existe" };
    }
    return { error: "Error al guardar el servidor" };
  }
}

export async function toggleProduct(id: string, currentState: boolean) {
  try {
    // Usamos $executeRaw para evitar el error de tipo en el Prisma Client en caché
    // (isActive ya está en el schema, pero el cliente generado quedó obsoleto)
    await db.$executeRaw`
      UPDATE "Producto"
      SET "isActive" = ${!currentState}, "updatedAt" = NOW()
      WHERE "id" = ${id}
    `;
    revalidatePath("/dashboard/catalog");
    return { success: true };
  } catch (error) {
    return { error: "No se pudo cambiar el estado del producto" };
  }
}
