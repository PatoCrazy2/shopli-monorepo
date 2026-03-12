import { db } from "@shopli/db";
import { ProductForm } from "./ProductForm";
import Link from "next/link";
import { notFound } from "next/navigation";

// RSC
export default async function ProductPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    let initialData = undefined;

    if (id !== "new") {
        const product = await db.producto.findUnique({
            where: { id },
            include: { inventario: true },
        });

        if (!product) {
            return notFound();
        }

        const stockTotal = product.inventario.reduce(
            (acc, inv) => acc + inv.cantidad,
            0
        );

        initialData = {
            id: product.id,
            nombre: product.nombre,
            codigo_interno: product.codigo_interno,
            precio_publico: Number(product.precio_publico),
            costo: Number(product.costo),
            stock: stockTotal,
        };
    }

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <Link
                    href="/dashboard/catalog"
                    className="group inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="m15 18-6-6 6-6"></path>
                    </svg>
                    Volver al Catálogo
                </Link>
            </div>

            <ProductForm initialData={initialData} />
        </div>
    );
}
