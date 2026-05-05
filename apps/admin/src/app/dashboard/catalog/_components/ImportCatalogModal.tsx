"use client";

import { useState, useRef } from "react";
import { importCatalogAction } from "../actions";

type ImportResult = { created: number; updated: number; errors: number };

export function ImportCatalogModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"idle" | "preview" | "uploading" | "finished">("idle");
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [results, setResults] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setIsOpen(false);
    setStep("idle");
    setPreviewData([]);
    setResults(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const products = parseCSV(text);
      
      if (products.length > 0) {
        setPreviewData(products);
        setStep("preview");
      } else {
        alert("No se encontraron datos válidos en el archivo.");
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    // 1. Limpiar BOM y normalizar saltos de línea
    const cleanText = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
    const lines = cleanText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    
    if (lines.length < 2) return [];

    // 2. Encontrar encabezados (la línea con más coincidencias de palabras clave)
    let headerIndex = -1;
    let maxMatches = 0;
    const keywords = ["nombr", "product", "preci", "cost", "sku", "codig", "categ", "proveed", "stock"];

    for (let i = 0; i < lines.length; i++) {
      const lowerLine = lines[i].toLowerCase();
      let matches = 0;
      keywords.forEach(k => {
        if (lowerLine.includes(k)) matches++;
      });

      if (matches > maxMatches) {
        maxMatches = matches;
        headerIndex = i;
      }
    }

    if (headerIndex === -1 || maxMatches < 2) return [];

    // 3. Detectar separador (, o ;)
    const headerLine = lines[headerIndex];
    const separator = headerLine.includes(";") ? ";" : ",";

    // Función para dividir respetando comillas
    const splitLine = (line: string) => {
      const result = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === separator && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = splitLine(headerLine).map(h => h.toLowerCase().replace(/^"|"$/g, ""));
    const data = [];

    for (let i = headerIndex + 1; i < lines.length; i++) {
      const values = splitLine(lines[i]);
      if (values.length < 2) continue;

      const item: any = {};
      headers.forEach((header, index) => {
        const val = values[index]?.replace(/^"|"$/g, "") || "";
        const cleanNumeric = (v: string) => v.replace(/[$,]/g, "");

        if (header.includes("nombr") || header.includes("product")) item.nombre = val;
        if (header.includes("codig") || header.includes("sku")) item.codigo_interno = val;
        if (header.includes("preci")) item.precio_publico = cleanNumeric(val);
        if (header.includes("cost")) item.costo = cleanNumeric(val);
        if (header.includes("categ")) item.categoria = val;
        if (header.includes("proveed")) item.proveedor = val;
        if (header.includes("stock")) item.stock = cleanNumeric(val);
      });

      if (item.nombre && item.nombre.toLowerCase() !== "nombre del producto") {
        data.push(item);
      }
    }
    return data;
  };

  const confirmImport = async () => {
    setStep("uploading");
    const res = await importCatalogAction(previewData);
    if (res.success) {
      setResults(res.results);
      setStep("finished");
    } else {
      alert(res.error || "Error al importar");
      setStep("preview");
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-100 px-6 text-sm font-bold text-zinc-900 transition-all hover:bg-zinc-200 active:scale-95 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        Importar
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`w-full ${step === "preview" ? "max-w-4xl" : "max-w-md"} rounded-3xl bg-white p-8 shadow-2xl dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 transition-all duration-300 animate-in zoom-in-95`}>
            
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
                  {step === "preview" ? "Confirmar Importación" : "Importar Catálogo"}
                </h2>
                {step === "preview" && (
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">
                    Vista previa de {previewData.length} productos detectados
                  </p>
                )}
              </div>
              <button 
                onClick={reset}
                className="rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {step === "idle" && (
              <div className="space-y-6">
                <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-10 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv"
                    className="hidden"
                  />
                  <div className="flex flex-col items-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-black text-white shadow-lg dark:bg-white dark:text-black">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>
                    </div>
                    <p className="mb-1 text-sm font-black text-zinc-900 dark:text-white">Selecciona tu archivo CSV</p>
                    <p className="text-xs font-medium text-zinc-500">O arrastra y suelta aquí</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-black px-6 text-xs font-bold text-white hover:bg-zinc-800 transition-all shadow-md dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                    >
                      Explorar Archivos
                    </button>
                  </div>
                </div>

                <div className="rounded-xl bg-amber-50 p-4 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30">
                  <p className="text-[11px] font-bold text-amber-800 dark:text-amber-400 leading-relaxed uppercase tracking-wider mb-2">Instrucciones</p>
                  <ul className="text-[11px] text-amber-700 dark:text-amber-500 space-y-1 font-medium list-disc ml-4">
                    <li>Columnas: <b>Nombre, Codigo, Precio, Costo, Categoria, Proveedor, Stock.</b></li>
                    <li>Si el código ya existe, el producto se actualizará (Upsert).</li>
                    <li>El <b>Stock</b> se cargará en todas las sucursales.</li>
                  </ul>
                </div>
              </div>
            )}

            {step === "preview" && (
              <div className="space-y-6">
                <div className="max-h-[400px] overflow-auto rounded-2xl border border-zinc-100 dark:border-zinc-900">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900 font-black text-[10px] uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                      <tr>
                        <th className="px-4 py-3">Nombre</th>
                        <th className="px-4 py-3">Código/SKU</th>
                        <th className="px-4 py-3 text-right">Precio</th>
                        <th className="px-4 py-3 text-right">Costo</th>
                        <th className="px-4 py-3">Proveedor</th>
                        <th className="px-4 py-3 text-center">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 dark:divide-zinc-900">
                      {previewData.slice(0, 50).map((item, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                          <td className="px-4 py-3 font-bold text-zinc-900 dark:text-white">{item.nombre}</td>
                          <td className="px-4 py-3 font-mono text-xs text-zinc-500">{item.codigo_interno || "-"}</td>
                          <td className="px-4 py-3 text-right font-bold text-zinc-900 dark:text-white">${item.precio_publico}</td>
                          <td className="px-4 py-3 text-right text-zinc-400">${item.costo}</td>
                          <td className="px-4 py-3 text-zinc-500 text-xs">{item.proveedor || "-"}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 font-black text-[10px]">
                              {item.stock || 0}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {previewData.length > 50 && (
                  <p className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                    ... y {previewData.length - 50} productos más
                  </p>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep("idle")}
                    className="flex-1 h-12 rounded-2xl bg-zinc-100 text-zinc-600 font-black text-sm uppercase tracking-widest hover:bg-zinc-200 transition-all dark:bg-zinc-900"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmImport}
                    className="flex-[2] h-12 rounded-2xl bg-black text-white font-black text-sm uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl active:scale-95 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                  >
                    Iniciar Importación
                  </button>
                </div>
              </div>
            )}

            {step === "uploading" && (
              <div className="py-20 text-center space-y-6">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-black border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] dark:border-white" />
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white">Procesando catálogo...</h3>
                  <p className="text-xs font-medium text-zinc-500 mt-2">Por favor no cierres esta ventana.</p>
                </div>
              </div>
            )}

            {step === "finished" && results && (
              <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto dark:bg-emerald-900/30">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">Importación Completada</h3>
                  <p className="text-sm font-medium text-zinc-500 mt-1">El proceso ha terminado con éxito.</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 py-4 border-y border-zinc-100 dark:border-zinc-800">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-zinc-900 dark:text-white">{results.created}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Creados</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-blue-600">{results.updated}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Actualizados</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-rose-500">{results.errors}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Errores</span>
                  </div>
                </div>

                <button
                  onClick={reset}
                  className="w-full h-12 rounded-2xl bg-black text-white font-black text-sm uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg active:scale-95 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  Continuar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
