import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../lib/db';
import { useAuth } from '../../../contexts/AuthContext';

export function useExpenses() {
    const { activeShift, user } = useAuth();

    const expensesInShift = useLiveQuery(
        () => activeShift ? db.gastos.where('turno_id').equals(activeShift.id).toArray() : [],
        [activeShift?.id]
    );

    const totalExpenses = expensesInShift
        ? expensesInShift.reduce((sum, g) => sum + (Number(g.monto) || 0), 0)
        : 0;

    const addCajaChicaGasto = async (monto: number, descripcion: string) => {
        if (!activeShift || !user) {
            throw new Error('No hay un turno activo o usuario autenticado');
        }

        const id = crypto.randomUUID();
        await db.gastos.add({
            id,
            turno_id: activeShift.id,
            sucursal_id: user.branchId,
            categoria: 'CAJA_CHICA',
            monto,
            descripcion,
            fecha: new Date().toISOString(),
            proveedor_id: null,
            sync_status: 'PENDING'
        });

        return id;
    };

    return {
        expensesInShift,
        totalExpenses,
        addCajaChicaGasto,
    };
}
