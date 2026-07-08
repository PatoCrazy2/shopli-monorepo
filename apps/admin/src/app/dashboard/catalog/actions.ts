"use server";

import { db } from "@shopli/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";

const productSchema = z.object({
  id: z.string().optional().or(z.literal("new")),
  codigo_interno: z.string().optional().nullable(),
  nombre: z.string().min(1, "El nombre es requerido"),
  precio_publico: z.coerce.number().min(0.01, "El precio debe ser mayor a 0"),
  costo: z.coerce.number().min(0, "El costo no puede ser negativo"),
});

export async function upsertProduct(formData: FormData) {
  const parseResult = productSchema.safeParse({
    id: formData.get("id"),
    codigo_interno: formData.get("codigo_interno"),
    nombre: formData.get("nombre"),
    precio_publico: formData.get("precio_publico"),
    costo: formData.get("costo"),
  });

  if (!parseResult.success) {
    return { error: "Datos inválidos", details: parseResult.error.flatten() };
  }

  const data = parseResult.data;

  try {
    const session = await auth();
    if (!session?.user?.empresa_id) throw new Error("No autorizado");
    const empresaId = session.user.empresa_id;

    if (data.id && data.id !== "new") {
      // Editar
      const product = await db.producto.findUnique({
        where: { id: data.id },
        select: { empresa_id: true }
      });
      if (!product || product.empresa_id !== empresaId) {
        throw new Error("No autorizado");
      }

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

      // Ya no actualizamos el stock desde aquí porque se maneja en Inventario
    } else {
      // Crear
      const newProduct = await db.producto.create({
        data: {
          nombre: data.nombre,
          codigo_interno: data.codigo_interno || null,
          precio_publico: data.precio_publico,
          costo: data.costo,
          empresa_id: empresaId,
          // UpdatedAt is automatically set by Prisma, but we force it just in case
          updatedAt: new Date(),
        },
      });

      const sucursales = await db.sucursal.findMany({ where: { activo: true, empresa_id: empresaId } });
      if (sucursales.length > 0) {
        await db.inventario_Sucursal.createMany({
          data: sucursales.map(s => ({
            sucursal_id: s.id,
            producto_id: newProduct.id,
            cantidad: 0
          }))
        });
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
    const session = await auth();
    if (!session?.user?.empresa_id) throw new Error("No autorizado");
    const empresaId = session.user.empresa_id;

    const product = await db.producto.findUnique({
      where: { id },
      select: { empresa_id: true }
    });
    if (!product || product.empresa_id !== empresaId) {
      throw new Error("No autorizado");
    }

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

export async function searchProducts(query: string) {
  try {
    const session = await auth();
    if (!session?.user?.empresa_id) throw new Error("No autorizado");
    const empresaId = session.user.empresa_id;

    return await db.producto.findMany({
      where: {
        empresa_id: empresaId,
        nombre: {
          contains: query,
          mode: "insensitive",
        },
      },
      include: {
        inventario: true,
      },
      orderBy: {
        nombre: "asc",
      },
    });
  } catch (error) {
    console.error("Error searching products:", error);
    return [];
  }
}
export async function importCatalogAction(products: any[]) {
  try {
    const results = {
      created: 0,
      updated: 0,
      errors: 0,
    };

    const session = await auth();
    if (!session?.user?.empresa_id) throw new Error("No autorizado");
    const empresaId = session.user.empresa_id;

    // Usamos una transacción para asegurar integridad, 
    // pero procesamos uno por uno para manejar errores individuales si es necesario
    // o simplemente usamos un bucle.
    for (const item of products) {
      try {
        let proveedor_id = null;

        // 1. Manejar Proveedor
        if (item.proveedor) {
          const provName = item.proveedor.trim();
          let prov = await db.proveedor.findUnique({
            where: { nombre: provName }
          });

          if (!prov) {
            prov = await db.proveedor.create({
              data: { 
                nombre: provName,
                empresa_id: empresaId
              }
            });
          } else if (prov.empresa_id !== empresaId) {
            throw new Error(`El proveedor ${provName} pertenece a otra empresa.`);
          }
          proveedor_id = prov.id;
        }

        // 2. Preparar datos
        const productData = {
          nombre: item.nombre,
          precio_publico: parseFloat(item.precio_publico) || 0,
          costo: parseFloat(item.costo) || 0,
          categoria: item.categoria || null,
          proveedor_id,
          isActive: true,
          updatedAt: new Date(),
          empresa_id: empresaId,
        };

        const initialStock = parseInt(item.stock, 10) || 0;

        // 3. Upsert por codigo_interno
        if (item.codigo_interno) {
          const existing = await db.producto.findUnique({
            where: { codigo_interno: item.codigo_interno }
          });

          if (existing) {
            if (existing.empresa_id !== empresaId) {
              throw new Error(`El producto con SKU ${item.codigo_interno} pertenece a otra empresa.`);
            }
            await db.producto.update({
              where: { id: existing.id },
              data: productData
            });
            results.updated++;
          } else {
            const newProduct = await db.producto.create({
              data: {
                ...productData,
                codigo_interno: item.codigo_interno
              }
            });
            
            // Si hay stock inicial, lo creamos para todas las sucursales (opcional)
            if (initialStock > 0) {
              const sucursales = await db.sucursal.findMany({ where: { activo: true, empresa_id: empresaId } });
              await db.inventario_Sucursal.createMany({
                data: sucursales.map(s => ({
                  sucursal_id: s.id,
                  producto_id: newProduct.id,
                  cantidad: initialStock
                }))
              });
            }
            
            results.created++;
          }
        } else {
          // Si no hay código interno, creamos uno nuevo siempre
          const newProduct = await db.producto.create({
            data: productData
          });

          if (initialStock > 0) {
            const sucursales = await db.sucursal.findMany({ where: { activo: true, empresa_id: empresaId } });
            await db.inventario_Sucursal.createMany({
              data: sucursales.map(s => ({
                sucursal_id: s.id,
                producto_id: newProduct.id,
                cantidad: initialStock
              }))
            });
          }

          results.created++;
        }
      } catch (e) {
        console.error("Error importing item:", item, e);
        results.errors++;
      }
    }

    revalidatePath("/dashboard/catalog");
    return { success: true, results };
  } catch (error) {
    console.error("Critical error in importCatalogAction:", error);
    return { error: "Error crítico durante la importación" };
  }
}
