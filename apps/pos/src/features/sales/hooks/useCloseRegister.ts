import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../lib/db';

export function useCloseRegister() {
    const { activeShift } = useAuth();
    const navigate = useNavigate();

    const [physicalCount, setPhysicalCount] = useState<string>('');
    const [isClosing, setIsClosing] = useState<boolean>(false);

    // Calcular el total de ventas del turno actual desde Dexie
    const salesInShift = useLiveQuery(
        () => activeShift ? db.sales.where('turno_id').equals(activeShift.id).toArray() : [],
        [activeShift?.id]
    );

    const calculatedTotalSales = salesInShift 
        ? salesInShift.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0)
        : 0;

    // Fallbacks to 0 in case the guard renders it before redirect
    const initialAmount = activeShift?.initialAmount || 0;
    const totalSales = calculatedTotalSales;
    const expectedAmount = initialAmount + totalSales;

    const parsedCount = parseFloat(physicalCount) || 0;
    const difference = parsedCount - expectedAmount;

    const handleCloseShift = () => {
        if (physicalCount === '') return;
        setIsClosing(true);

        // Sin delay artificial: Velocidad Absoluta en POS
        setIsClosing(false);
        navigate('/auditoria-cierre', { state: { physicalCount: parsedCount } });
    };

    return {
        activeShift,
        physicalCount,
        setPhysicalCount,
        isClosing,
        initialAmount,
        totalSales,
        expectedAmount,
        difference,
        handleCloseShift,
    };
}
