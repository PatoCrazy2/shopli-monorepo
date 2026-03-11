export interface CartItem {
    id: string; // Updated to match DB UUID
    producto_id: string;
    name: string;
    price: number;
    quantity: number;
}
