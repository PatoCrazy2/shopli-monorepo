export interface Product {
    id: string; // UUID
    nombre: string;
    codigo_interno?: string;
    descripcion?: string;
    costo: number;
    precio_publico: number;
    categoria?: string;
    proveedor_id?: string;
    isCritical: boolean;
    stock: number; // Virtual field for frontend mock
    updatedAt: string;
}

export interface InventoryAudit {
    id: string;
    shiftId: string;
    userId: string;
    branchId: string;
    createdAt: string;
    items: AuditItem[];
}

export interface AuditItem {
    id: string;
    auditId: string;
    productId: string;
    expectedStock: number;
    countedStock: number;
    discrepancy: number;
    reason?: 'Daño' | 'Error de registro' | 'Faltante/Robo' | string;
    comments?: string;
    productName?: string; // Virtual field for UI
}
