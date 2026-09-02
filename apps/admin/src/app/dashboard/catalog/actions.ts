"use server";

import { db } from "@shopli/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { canAddProduct } from "@/lib/check-plan-limits";

const productSchema = z.object({
  id: z.string().optional().or(z.literal("new")),
  codigo_interno: z.string().optional().nullable(),
  nombre: z.string().min(1, "El nombre es requerido"),
  precio_publico: z.coerce.number().min(0.01, "El precio debe ser mayor a 0"),
  costo: z.coerce.number().min(0, "El costo no puede ser negativo"),
  precio_mayoreo: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.coerce.number().min(0.01, "El precio de mayoreo debe ser mayor a 0").nullable().optional()
  ),
  min_cantidad_mayoreo: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.coerce.number().int().min(2, "La cantidad mínima debe ser al menos 2").nullable().optional()
  ),
});

export async function generateUniqueSKU(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const slProducts = await db.producto.findMany({
      where: {
        codigo_interno: {
          startsWith: "SL-",
        },
      },
      select: {
        codigo_interno: true,
      },
    });

    let maxNumber = 0;
    for (const p of slProducts) {
      if (p.codigo_interno) {
        const match = p.codigo_interno.match(/^SL-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    }

    const nextSku = `SL-${String(maxNumber + 1).padStart(6, "0")}`;

    const exists = await db.producto.findUnique({
      where: { codigo_interno: nextSku },
      select: { id: true },
    });

    if (!exists) {
      return nextSku;
    }
    attempts++;
  }
  throw new Error("No se pudo generar un SKU único después de varios intentos");
}

export async function upsertProduct(formData: FormData) {
  const parseResult = productSchema.safeParse({
    id: formData.get("id"),
    codigo_interno: formData.get("codigo_interno"),
    nombre: formData.get("nombre"),
    precio_publico: formData.get("precio_publico"),
    costo: formData.get("costo"),
    precio_mayoreo: formData.get("precio_mayoreo"),
    min_cantidad_mayoreo: formData.get("min_cantidad_mayoreo"),
  });

  if (!parseResult.success) {
    return { error: "Datos inválidos", details: parseResult.error.flatten() };
  }

  const data = parseResult.data;
  const variantsRaw = formData.get("variants") as string | null;
  let variants: any[] = [];
  if (variantsRaw) {
    try {
      const parsed = JSON.parse(variantsRaw);
      if (Array.isArray(parsed)) {
        variants = parsed;
      }
    } catch (e) {
      return { error: "Formato de variantes inválido" };
    }
  }

  try {
    const session = await auth();
    if (!session?.user?.empresa_id) throw new Error("No autorizado");
    const empresaId = session.user.empresa_id;

    let parentId = data.id;

    if (data.id && data.id !== "new") {
      // Editar Padre
      const product = await db.producto.findUnique({
        where: { id: data.id },
        select: { empresa_id: true, codigo_interno: true }
      });
      if (!product || product.empresa_id !== empresaId) {
        throw new Error("No autorizado");
      }

      let parentSku = data.codigo_interno?.trim() || null;
      if (!parentSku) {
        parentSku = product.codigo_interno || (await generateUniqueSKU());
      }

      await db.producto.update({
        where: { id: data.id },
        data: {
          nombre: data.nombre,
          codigo_interno: parentSku,
          precio_publico: data.precio_publico,
          costo: data.costo,
          precio_mayoreo: data.precio_mayoreo ?? null,
          min_cantidad_mayoreo: data.min_cantidad_mayoreo ?? null,
          updatedAt: new Date(),
        },
      });

      // Obtener variantes actuales
      const existingVariants = await db.producto.findMany({
        where: { parent_id: data.id },
        select: { id: true }
      });
      const existingIds = existingVariants.map(v => v.id);
      const receivedIds = variants.map(v => v.id).filter(Boolean) as string[];

      // Desactivar variantes obsoletas
      const idsToDeactivate = existingIds.filter(id => !receivedIds.includes(id));
      if (idsToDeactivate.length > 0) {
        await db.producto.updateMany({
          where: { id: { in: idsToDeactivate } },
          data: { isActive: false }
        });
      }

      // Procesar variantes
      for (const v of variants) {
        const variantFullName = `${data.nombre} (${v.variante_nombre})`;
        let varSku = v.codigo_interno?.trim() || null;
        if (v.id) {
          const existingVar = await db.producto.findUnique({
            where: { id: v.id },
            select: { codigo_interno: true }
          });
          if (!varSku) {
            varSku = existingVar?.codigo_interno || (await generateUniqueSKU());
          }
          await db.producto.update({
            where: { id: v.id },
            data: {
              nombre: variantFullName,
              codigo_interno: varSku,
              costo: data.costo,
              precio_publico: data.precio_publico,
              precio_mayoreo: data.precio_mayoreo ?? null,
              min_cantidad_mayoreo: data.min_cantidad_mayoreo ?? null,
              variante_nombre: v.variante_nombre,
              isActive: v.isActive !== false,
              updatedAt: new Date(),
            }
          });
        } else {
          const newVarSku = varSku || (await generateUniqueSKU());
          const newVar = await db.producto.create({
            data: {
              nombre: variantFullName,
              codigo_interno: newVarSku,
              costo: data.costo,
              precio_publico: data.precio_publico,
              precio_mayoreo: data.precio_mayoreo ?? null,
              min_cantidad_mayoreo: data.min_cantidad_mayoreo ?? null,
              variante_nombre: v.variante_nombre,
              parent_id: data.id,
              empresa_id: empresaId,
              isActive: true,
              updatedAt: new Date(),
            }
          });

          const sucursales = await db.sucursal.findMany({ where: { activo: true, empresa_id: empresaId } });
          if (sucursales.length > 0) {
            await db.inventario_Sucursal.createMany({
              data: sucursales.map(s => ({
                sucursal_id: s.id,
                producto_id: newVar.id,
                cantidad: 0
              }))
            });
          }
        }
      }
    } else {
      // Validar candado de plan de suscripción antes de crear un nuevo producto
      const checkLimit = await canAddProduct(empresaId);
      if (!checkLimit.allowed) {
        return { error: checkLimit.reason };
      }

      // Crear Padre
      const parentSku = data.codigo_interno?.trim() || (await generateUniqueSKU());
      const newProduct = await db.producto.create({
        data: {
          nombre: data.nombre,
          codigo_interno: parentSku,
          precio_publico: data.precio_publico,
          costo: data.costo,
          precio_mayoreo: data.precio_mayoreo ?? null,
          min_cantidad_mayoreo: data.min_cantidad_mayoreo ?? null,
          empresa_id: empresaId,
          updatedAt: new Date(),
        },
      });

      parentId = newProduct.id;

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

      // Crear variantes de este nuevo producto
      for (const v of variants) {
        const variantFullName = `${data.nombre} (${v.variante_nombre})`;
        const varSku = v.codigo_interno?.trim() || (await generateUniqueSKU());
        const newVar = await db.producto.create({
          data: {
            nombre: variantFullName,
            codigo_interno: varSku,
            costo: data.costo,
            precio_publico: data.precio_publico,
            precio_mayoreo: data.precio_mayoreo ?? null,
            min_cantidad_mayoreo: data.min_cantidad_mayoreo ?? null,
            variante_nombre: v.variante_nombre,
            parent_id: parentId,
            empresa_id: empresaId,
            isActive: true,
            updatedAt: new Date(),
          }
        });

        if (sucursales.length > 0) {
          await db.inventario_Sucursal.createMany({
            data: sucursales.map(s => ({
              sucursal_id: s.id,
              producto_id: newVar.id,
              cantidad: 0
            }))
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

    await db.$executeRaw`
      UPDATE "Producto"
      SET "isActive" = ${!currentState}, "updatedAt" = NOW()
      WHERE "id" = ${id} OR "parent_id" = ${id}
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
        let sku = item.codigo_interno?.trim() || null;
        if (!sku) {
          sku = await generateUniqueSKU();
        }

        const existing = await db.producto.findUnique({
          where: { codigo_interno: sku }
        });

        if (existing) {
          if (existing.empresa_id !== empresaId) {
            throw new Error(`El producto con SKU ${sku} pertenece a otra empresa.`);
          }
          await db.producto.update({
            where: { id: existing.id },
            data: productData
          });
          results.updated++;
        } else {
          // Validar candado de plan antes de dar de alta nuevo producto
          const checkLimit = await canAddProduct(empresaId);
          if (!checkLimit.allowed) {
            throw new Error(checkLimit.reason || "Límite de productos alcanzado.");
          }

          const newProduct = await db.producto.create({
            data: {
              ...productData,
              codigo_interno: sku
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
