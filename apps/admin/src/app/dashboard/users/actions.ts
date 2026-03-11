"use server";

import { revalidatePath } from "next/cache";
import { db, Role } from "@shopli/db";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Validaciones con Zod
const CreateUserSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
    email: z.string().email("Correo electrónico inválido."),
    role: z.enum([Role.CAJERO, Role.ENCARGADO] as [string, ...string[]], {
        message: "Rol inválido, debe ser CAJERO o ENCARGADO.",
    }),
    pin: z.string().length(4, "El PIN debe tener exactamente 4 dígitos.").regex(/^\d+$/, "El PIN debe estar conformado únicamente por números."),
});

const UpdateUserSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").optional(),
    role: z.enum([Role.CAJERO, Role.ENCARGADO] as [string, ...string[]], {
        message: "Rol inválido.",
    }).optional(),
});

const ResetPinSchema = z.object({
    pin: z.string().length(4, "El PIN debe tener exactamente 4 dígitos.").regex(/^\d+$/, "El PIN debe estar conformado únicamente por números."),
});

// Helper de seguridad centralizado según las reglas del Admin Dashboard
async function verifyOwnerStatus() {
    const session = await auth();
    if (!session?.user || session.user.role !== Role.DUENO) {
        throw new Error("Acceso denegado. Solo los DUEÑOS pueden gestionar usuarios.");
    }
    return session.user;
}

/**
 * Crea un nuevo Cajero o Encargado en la base de datos PostgreSQL.
 */
export async function createUser(formData: unknown) {
    try {
        await verifyOwnerStatus();

        // Validar datos de entrada
        const data = CreateUserSchema.parse(formData);

        // Validar unicidad del correo
        const existingUser = await db.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            return { success: false, error: "Ya existe un usuario con este correo electrónico." };
        }

        // Hashear el PIN tal como requieren las Reglas Críticas
        const pin_hash = await bcrypt.hash(data.pin, 10);

        // Guardar a través de Prisma
        await db.user.create({
            data: {
                name: data.name,
                email: data.email,
                role: data.role as Role,
                pin_hash,
            },
        });

        revalidatePath("/dashboard/users");
        return { success: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0]?.message || "Datos de usuario inválidos." };
        }
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: "Ocurrió un error inesperado al intentar crear al usuario." };
    }
}

/**
 * Actualiza el perfil de un usuario existente (Nombre o Rol) excluyendo PIN.
 */
export async function updateUser(id: string, formData: unknown) {
    try {
        await verifyOwnerStatus();

        const data = UpdateUserSchema.parse(formData);

        // Validaciones previas a mutación
        const userToUpdate = await db.user.findUnique({ where: { id } });
        if (!userToUpdate) {
            return { success: false, error: "Usuario no encontrado." };
        }

        if (userToUpdate.role === Role.DUENO) {
            return { success: false, error: "No es posible degradar o modificar a un perfil nivel DUEÑO." };
        }

        await db.user.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.role && { role: data.role as Role }),
            },
        });

        revalidatePath("/dashboard/users");
        return { success: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0]?.message || "Datos de actualización inválidos." };
        }
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: "Ocurrió un error inesperado al actualizar al usuario." };
    }
}

/**
 * Elimina una cuenta del sistema, aplicando barreras de protección.
 */
export async function deleteUser(id: string) {
    try {
        const ownerSession = await verifyOwnerStatus();

        // Evitar auto-eliminación
        if (ownerSession.id === id) {
            return { success: false, error: "No puedes eliminar tu propia cuenta de propietario." };
        }

        const userToDelete = await db.user.findUnique({ where: { id } });
        if (!userToDelete) {
            return { success: false, error: "Cuenta de usuario no encontrada." };
        }

        await db.user.delete({
            where: { id },
        });

        revalidatePath("/dashboard/users");
        return { success: true };
    } catch (error) {
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: "Ocurrió un error al intentar eliminar la cuenta." };
    }
}

/**
 * Genera un nuevo hash de acceso y reemplaza el PIN anterior de un Cajero/Encargado.
 */
export async function resetPin(id: string, formData: unknown) {
    try {
        await verifyOwnerStatus();

        const data = ResetPinSchema.parse(formData);

        const targetUser = await db.user.findUnique({ where: { id } });
        if (!targetUser) {
            return { success: false, error: "Usuario no encontrado en el sistema." };
        }

        const pin_hash = await bcrypt.hash(data.pin, 10);

        await db.user.update({
            where: { id },
            data: { pin_hash },
        });

        revalidatePath("/dashboard/users");
        return { success: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0]?.message || "El formato del nuevo PIN es inválido." };
        }
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: "Ocurrió un error inesperado al restablecer el PIN." };
    }
}
