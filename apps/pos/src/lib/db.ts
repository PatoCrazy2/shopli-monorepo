import Dexie, { type EntityTable } from 'dexie';

export interface LocalMeta {
  key: string;
  value: any;
}

export interface LocalUser {
  id: string; // UUID
  name: string | null;
  email: string;
  role: 'DUEÑO' | 'ENCARGADO' | 'CAJERO';
  pin: string | null;
}

export interface LocalBranch {
  id: string; // UUID
  nombre: string;
  direccion: string | null;
  updatedAt: string;
}

export interface LocalProduct {
  id: string; // UUID
  nombre: string;
  codigo_interno: string | null;
  descripcion: string | null;
  costo: number; // Using number for ease of local use, but Prisma uses Decimal(10,2)
  precio_publico: number;
  categoria: string | null;
  isCritical: boolean;
  isActive: boolean;
  updatedAt: string;
}

export interface LocalInventory {
  id: string; // UUID
  sucursal_id: string;
  producto_id: string;
  cantidad: number;
  updatedAt: string;
}

export interface LocalCartItem {
  id: string; // product id basically for uniqueness in cart
  producto_id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface LocalTurno {
  id: string; // UUID
  usuario_id: string;
  sucursal_id: string;
  estado: 'ABIERTO' | 'CERRADO';
  monto_inicial: number;
  monto_final: number | null;
  total_ventas: number;
  fecha_apertura: string;
  fecha_cierre: string | null;
  sync_status: 'PENDING' | 'SYNCED';
}

export interface LocalSaleDetail {
  id: string; // UUID
  venta_id: string; // Relación con Venta
  producto_id: string;
  nombre_producto: string; // Para mostrar en el ticket sin tener que hacer join constante
  cantidad: number;
  precio_unitario_historico: number;
}

export interface LocalSale {
  id: string; // UUID
  turno_id: string;
  sucursal_id: string;
  total: number;
  estado: 'COMPLETADA' | 'CANCELADA';
  sync_status: 'PENDING' | 'SYNCED';
  fecha: string; // ISO String
}

export interface LocalAudit {
  id: string; // UUID
  shiftId: string;
  userId: string;
  branchId: string;
  createdAt: string;
  items: Record<string, unknown>[]; // Store inner items embedded for local simplicity
  sync_status: 'PENDING' | 'SYNCED';
}

export class ShopLIPOSDatabase extends Dexie {
  users!: EntityTable<LocalUser, 'id'>;
  branches!: EntityTable<LocalBranch, 'id'>;
  products!: EntityTable<LocalProduct, 'id'>;
  turnos!: EntityTable<LocalTurno, 'id'>;
  cart!: EntityTable<LocalCartItem, 'id'>;
  sales!: EntityTable<LocalSale, 'id'>;
  sale_details!: EntityTable<LocalSaleDetail, 'id'>;
  inventory!: EntityTable<LocalInventory, 'id'>;
  audits!: EntityTable<LocalAudit, 'id'>;
  meta!: EntityTable<LocalMeta, 'key'>;

  constructor() {
    super('ShopLIPOS');
    this.version(8).stores({
      users: 'id, role, pin',
      branches: 'id',
      products: 'id, codigo_interno, categoria',
      turnos: 'id, usuario_id, sucursal_id, estado, sync_status',
      cart: 'id, producto_id',
      sales: 'id, turno_id, estado, sync_status, fecha',
      sale_details: 'id, venta_id, producto_id',
      inventory: 'id, sucursal_id, producto_id, [sucursal_id+producto_id]',
      audits: 'id, shiftId, sync_status',
      meta: 'key',
    });
  }
}

export const db = new ShopLIPOSDatabase();

/**
 * Limpia completamente la base de datos local.
 * Útil para forzar un pull fresco desde la nube.
 */
export async function clearLocalData(): Promise<void> {
  // Dexie's typed API accepts at most 6 tables per transaction.
  // We clear meta outside so the transaction stays within limits.
  await db.transaction('rw', db.users, db.branches, db.products, db.inventory, async () => {
    await db.users.clear();
    await db.branches.clear();
    await db.products.clear();
    await db.inventory.clear();
  });
  await db.meta.clear();
}
