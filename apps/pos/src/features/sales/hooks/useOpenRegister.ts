import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

export function useOpenRegister() {
    const { user, openShift } = useAuth();
    const navigate = useNavigate();

    const [initialAmount, setInitialAmount] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const amount = parseFloat(initialAmount);

        if (isNaN(amount) || amount < 0) {
            setError('El monto inicial deber ser un valor numérico mayor o igual a 0.');
            return;
        }

        openShift(amount);
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
        handleAmountChange,
        handleBlur,
        handleSubmit,
    };
}
