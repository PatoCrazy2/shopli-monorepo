import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  db,
  type ShopLIPOSDatabase,
  type LocalProduct,
  type LocalDynamicAuditItem,
} from "../../../lib/db";
import { pushToCloud } from "../../../lib/sync-push";
import { useAuth } from "../../../contexts/AuthContext";

/**
 * Filtra los productos padre (aquellos que tienen variantes asociadas)
 * para auditar únicamente productos simples y variantes hojas.
 */
export function filterAuditableProducts(allProds: LocalProduct[]): LocalProduct[] {
  const parentIds = new Set<string>();
  allProds.forEach((p) => {
    if (p.parent_id) {
      parentIds.add(p.parent_id);
    }
  });
  return allProds.filter((p) => !parentIds.has(p.id));
}

/**
 * Inicia una sesión de auditoría dinámica en Dexie y bloquea la consulta de inventario local.
 */
export async function startDynamicAuditSession({
  branchId,
  userId = null,
  database = db,
}: {
  branchId: string;
  userId?: string | null;
  database?: ShopLIPOSDatabase;
}): Promise<{ auditId: string; products: LocalProduct[] }> {
  const allProducts = await database.products.toArray();
  const auditableProducts = filterAuditableProducts(allProducts);
  if (auditableProducts.length === 0) {
    return { auditId: "", products: [] };
  }

  const newAuditId = crypto.randomUUID();
  const startedAt = new Date().toISOString();

  await database.transaction("rw", database.meta, database.dynamicAudits, async () => {
    await database.dynamicAudits.add({
      id: newAuditId,
      branchId,
      startedAt,
      finishedAt: null,
      status: "OPEN",
      iniciadaPorId: userId ?? null,
      finalizadaPorId: null,
      sync_status: "PENDING",
    });
    await database.meta.put({ key: "active_audit_id", value: newAuditId });
  });

  return { auditId: newAuditId, products: auditableProducts };
}

/**
 * Obtiene el conteo registrado de un producto dentro de una auditoría usando el índice compuesto [auditId+productId].
 */
export async function getAuditItemCount(
  auditId: string,
  productId: string,
  database: ShopLIPOSDatabase = db
): Promise<LocalDynamicAuditItem | undefined> {
  return database.dynamicAuditItems
    .where("[auditId+productId]")
    .equals([auditId, productId])
    .first();
}

/**
 * Registra o actualiza el conteo físico de un producto dentro de una auditoría dinámica.
 * Usa el índice compuesto [auditId+productId] para garantizar unicidad y guarda quién contó.
 */
export async function recordAuditItemCount({
  auditId,
  productId,
  countedQuantity,
  userId = null,
  database = db,
}: {
  auditId: string;
  productId: string;
  countedQuantity: number;
  userId?: string | null;
  database?: ShopLIPOSDatabase;
}): Promise<LocalDynamicAuditItem> {
  const currentTime = new Date().toISOString();
  const existing = await getAuditItemCount(auditId, productId, database);

  if (existing) {
    const updated: LocalDynamicAuditItem = {
      ...existing,
      countedQuantity,
      countedAt: currentTime,
      contadoPorId: userId ?? null,
      sync_status: "PENDING",
    };
    await database.dynamicAuditItems.update(existing.id, {
      countedQuantity,
      countedAt: currentTime,
      contadoPorId: userId ?? null,
      sync_status: "PENDING",
    });
    return updated;
  }

  const newItem: LocalDynamicAuditItem = {
    id: crypto.randomUUID(),
    auditId,
    productId,
    countedQuantity,
    countedAt: currentTime,
    contadoPorId: userId ?? null,
    sync_status: "PENDING",
  };
  await database.dynamicAuditItems.add(newItem);
  return newItem;
}

/**
 * Finaliza la auditoría dinámica: marca la cabecera como FINISHED con finishedAt,
 * registra quién la finalizó, la re-encola como PENDING para el cierre en servidor,
 * limpia active_audit_id y dispara pushToCloud() sin bloquear si está offline.
 */
export async function finishDynamicAuditSession({
  auditId,
  userId = null,
  database = db,
  triggerSync = pushToCloud,
}: {
  auditId: string;
  userId?: string | null;
  database?: ShopLIPOSDatabase;
  triggerSync?: () => Promise<unknown>;
}): Promise<void> {
  const finishedAt = new Date().toISOString();

  await database.transaction("rw", database.meta, database.dynamicAudits, async () => {
    await database.dynamicAudits.update(auditId, {
      status: "FINISHED",
      finishedAt,
      finalizadaPorId: userId ?? null,
      sync_status: "PENDING",
    });
    await database.meta.delete("active_audit_id");
  });

  try {
    await triggerSync();
  } catch {
    // Offline-first: si falla el push inmediato, la cabecera y los ítems quedan en PENDING
    // y el sincronizador en background los enviará al recuperar red.
  }
}

export function useDynamicAudit() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countedAmount, setCountedAmount] = useState<string>("");
  const [auditId, setAuditId] = useState<string>("");
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    const checkExisting = async () => {
      try {
        const [activeId, allProducts] = await Promise.all([
          db.meta.get("active_audit_id"),
          db.products.toArray(),
        ]);
        if (!mounted) return;
        setProducts(filterAuditableProducts(allProducts));
        if (activeId?.value) {
          setAuditId(activeId.value);
          setIsStarted(true);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    checkExisting();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchCurrentCount = async () => {
      if (products.length === 0 || !auditId) return;
      const currentProduct = products[currentIndex];
      const existing = await getAuditItemCount(auditId, currentProduct.id);
      if (!mounted) return;

      if (existing && existing.countedQuantity !== null) {
        setCountedAmount(existing.countedQuantity.toString());
      } else {
        setCountedAmount("");
      }

      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    fetchCurrentCount();
    return () => {
      mounted = false;
    };
  }, [currentIndex, products, auditId]);

  const handleStartAudit = async () => {
    if (!user?.branchId) {
      alert("No se pudo determinar la sucursal activa. Por favor reinicia sesión.");
      return;
    }

    const result = await startDynamicAuditSession({
      branchId: user.branchId,
      userId: user.id,
    });
    if (!result.auditId || result.products.length === 0) return;

    setProducts(result.products);
    setAuditId(result.auditId);
    setIsStarted(true);
  };

  const handleNext = async () => {
    if (countedAmount === "" || isNaN(Number(countedAmount))) return;

    const currentProduct = products[currentIndex];
    await recordAuditItemCount({
      auditId,
      productId: currentProduct.id,
      countedQuantity: Number(countedAmount),
      userId: user?.id ?? null,
    });

    if (currentIndex < products.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      await finishDynamicAuditSession({
        auditId,
        userId: user?.id ?? null,
      });
      setIsFinished(true);
    }
  };

  const handleDismissSuccess = () => {
    navigate("/inventario");
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || /^\d+$/.test(val)) {
      setCountedAmount(val);
    }
  };

  const handleIncrement = () => {
    const current = countedAmount === "" ? 0 : parseInt(countedAmount, 10);
    setCountedAmount(String((isNaN(current) ? 0 : current) + 1));
  };

  const handleDecrement = () => {
    const current = countedAmount === "" ? 0 : parseInt(countedAmount, 10);
    const next = Math.max(0, (isNaN(current) ? 0 : current) - 1);
    setCountedAmount(String(next));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && countedAmount !== "") {
      e.preventDefault();
      handleNext();
    }
  };

  const currentProduct = products[currentIndex];
  const progressPercent =
    products.length > 0 ? Math.round(((currentIndex + 1) / products.length) * 100) : 0;
  const isLastProduct = products.length > 0 && currentIndex === products.length - 1;
  const canDecrement = countedAmount !== "" && Number(countedAmount) > 0;

  return {
    products,
    currentIndex,
    currentProduct,
    countedAmount,
    isStarted,
    isFinished,
    isLoading,
    progressPercent,
    isLastProduct,
    canDecrement,
    inputRef,
    handleStartAudit,
    handleNext,
    handlePrev,
    handleAmountChange,
    handleIncrement,
    handleDecrement,
    handleKeyDown,
    handleDismissSuccess,
  };
}
