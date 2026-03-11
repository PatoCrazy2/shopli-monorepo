import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { db, type LocalBranch } from '../../../lib/db';

export function useOpenRegister() {
    const { user, openShift, hasActiveShift } = useAuth();
    const navigate = useNavigate();

    const [initialAmount, setInitialAmount] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [branches, setBranches] = useState<LocalBranch[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string>('');
    const [isLoadingBranches, setIsLoadingBranches] = useState(true);

    useEffect(() => {
        // Redirigir si ya hay un turno abierto
        if (hasActiveShift) {
            navigate('/', { replace: true });
            return;
        }

        const fetchBranches = async () => {
            try {
                const fetchedBranches = await db.branches.toArray();
                setBranches(fetchedBranches);
                if (fetchedBranches.length > 0) {
                    // Seleccionar por defecto la del usuario o la primera
                    const userBranch = fetchedBranches.find(b => b.id === user?.branchId);
                    if (userBranch) {
                        setSelectedBranchId(userBranch.id);
                    } else {
                        setSelectedBranchId(fetchedBranches[0].id);
                    }
                }
            } catch (err) {
                console.error('Error fetching branches', err);
                setError('Error al cargar las sucursales.');
            } finally {
                setIsLoadingBranches(false);
            }
        };

        fetchBranches();
    }, [hasActiveShift, navigate, user?.branchId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (hasActiveShift) {
            setError('Ya hay un turno abierto.');
            return;
        }

        if (!selectedBranchId) {
            setError('Debes seleccionar una sucursal.');
            return;
        }

        const amount = parseFloat(initialAmount);

        if (isNaN(amount) || amount < 0) {
            setError('El monto inicial deber ser un valor numérico mayor o igual a 0.');
            return;
        }

        openShift(amount, selectedBranchId);
        navigate('/', { replace: true });
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Solo permite números y un punto decimal
        if (val === '' || /^\d*\.?\d*$/.test(val)) {
            setInitialAmount(val);
        }
    };

    const handleBlur = () => {
        if (initialAmount) {
            const num = parseFloat(initialAmount);
            if (!isNaN(num)) {
                setInitialAmount(num.toFixed(2));
            }
        }
    };

    return {
        user,
        initialAmount,
        error,
        branches,
        selectedBranchId,
        setSelectedBranchId,
        isLoadingBranches,
        handleAmountChange,
        handleBlur,
        handleSubmit,
    };
}
