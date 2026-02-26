import type { CartItem } from "./cart.types";

export interface Sale {
    id: string; // UUID
    branchId: string;
    userId: string;
    shiftId: string;
    items: CartItem[];
    totalAmount: number;
    totalItems: number;
    createdAt: string; // ISO string
}
