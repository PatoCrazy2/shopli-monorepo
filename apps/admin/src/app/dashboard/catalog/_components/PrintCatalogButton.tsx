"use client";

import { useState } from "react";
import { PrintLabelsModal, CatalogProduct } from "./PrintLabelsModal";

interface PrintCatalogButtonProps {
  products: CatalogProduct[];
}

export function PrintCatalogButton({ products }: PrintCatalogButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black px-6 text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 shadow-sm active:scale-95 transition-all"
        title="Imprimir planillas de códigos QR para productos de tu catálogo"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mr-2 h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        Imprimir Etiquetas
      </button>

      <PrintLabelsModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        products={products}
      />
    </>
  );
}
