import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

export function useCloseRegister() {
    const { activeShift, closeShift } = useAuth();
    const navigate = useNavigate();

    const [physicalCount, setPhysicalCount] = useState<string>('');
    const [isClosing, setIsClosing] = useState<boolean>(false);

    // Fallbacks to 0 in case the guard renders it before redirect
    const initialAmount = activeShift?.initialAmount || 0;
    const totalSales = activeShift?.totalSales || 0;
    const expectedAmount = initialAmount + totalSales;

    const parsedCount = parseFloat(physicalCount) || 0;
    const difference = parsedCount - expectedAmount;

    const handleCloseShift = () => {
        if (physicalCount === '') return;
        setIsClosing(true);

        setTimeout(() => {
            closeShift(parsedCount);
            setIsClosing(false);
            // It will be handled conditionally by AuthContext / RequireNoOpenShift
            // but explicitly returning to /abrir-caja ensures proper routing state
            navigate('/abrir-caja', { replace: true });
        }, 800); // UI micro-interaction simulated delay
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
