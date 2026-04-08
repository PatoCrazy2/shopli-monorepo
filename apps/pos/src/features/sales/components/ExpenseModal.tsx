import { useState } from 'react';
import { X, DollarSign, FileText, AlertCircle } from 'lucide-react';
import { useExpenses } from '../hooks/useExpenses';

interface ExpenseModalProps {
    onClose: () => void;
}

export default function ExpenseModal({ onClose }: ExpenseModalProps) {
    const { addCajaChicaGasto } = useExpenses();
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setError('Por favor ingrese un monto válido.');
            return;
        }

        if (description.trim().length < 3) {
            setError('La descripción es demasiado corta.');
            return;
        }

        setIsSaving(true);
        try {
            await addCajaChicaGasto(parsedAmount, description);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al guardar el gasto.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-xl font-bold">Gasto de Caja Chica</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-2 text-sm font-medium">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Monto del Gasto</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <DollarSign className="w-5 h-5 text-gray-400" />
                            </div>
                            <input
                                autoFocus
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="block w-full pl-10 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-black focus:outline-none text-2xl font-black transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Motivo / Descripción</label>
                        <div className="relative">
                            <div className="absolute top-4 left-4 pointer-events-none">
                                <FileText className="w-5 h-5 text-gray-400" />
                            </div>
                            <textarea
                                rows={3}
                                placeholder="Ej: Pago de garrafón de agua, limpieza, etc."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="block w-full pl-10 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-black focus:outline-none font-medium resize-none transition-all"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving || !amount || !description}
                        className="w-full py-4 bg-black text-white rounded-2xl font-bold text-lg hover:bg-zinc-800 disabled:bg-gray-200 disabled:text-gray-400 transition-all active:scale-[0.98]"
                    >
                        {isSaving ? 'Guardando...' : 'Registrar Gasto'}
                    </button>
                </form>
            </div>
        </div>
    );
}
