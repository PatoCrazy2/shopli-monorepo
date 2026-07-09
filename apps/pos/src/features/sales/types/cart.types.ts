export interface CartItem {
    id: string; // Updated to match DB UUID
    producto_id: string;
    name: string;
    price: number;
    precio_mayoreo: number | null;
    min_cantidad_mayoreo: number | null;
    quantity: number;
    descuento_manual: number;
    nota_descuento: string;
    parent_id: string | null;
    variante_nombre: string | null;
}
