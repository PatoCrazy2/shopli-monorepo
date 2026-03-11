import React, { useState } from 'react';

export function LoginForm({ onLogin }: { onLogin: (pin: string) => Promise<boolean> | void }) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    const handleKeyPress = (key: string) => {
        if (pin.length < 4) { // Max PIN length = 4
            setError(false);
            setPin((prev) => prev + key);
        }
    };

    const handleBackspace = () => {
        setError(false);
        setPin((prev) => prev.slice(0, -1));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pin.length > 0) {
            const success = await onLogin(pin);
            if (success === false) {
                setError(true);
                setPin('');
            }
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 selection:bg-black selection:text-white font-sans">
            <div className="w-full max-w-sm">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold tracking-tight text-black mb-2">ShopLI <sub>POS</sub></h1>
                    {error ? (
                        <p className="text-red-500 font-semibold text-lg animate-pulse">PIN incorrecto, intenta de nuevo</p>
                    ) : (
                        <p className="text-zinc-500 text-lg">Ingresa tu PIN para continuar</p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                    {/* PIN Display */}
                    <div className="flex justify-center gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className={`w-14 h-16 rounded-lg border-2 flex items-center justify-center text-3xl font-bold transition-colors ${
                                    error ? 'border-red-500 text-red-500 bg-red-50' :
                                    pin.length > i ? 'border-black text-black bg-white' : 'border-zinc-200 text-transparent bg-white'
                                }`}
                            >
                                {pin.length > i ? '•' : ''}
                            </div>
                        ))}
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => handleKeyPress(num.toString())}
                                className="h-16 rounded-lg bg-white border border-zinc-200 text-black text-2xl font-bold active:bg-zinc-100 touch-manipulation"
                            >
                                {num}
                            </button>
                        ))}
                        <div className="col-start-2">
                            <button
                                type="button"
                                onClick={() => handleKeyPress('0')}
                                className="w-full h-16 rounded-lg bg-white border border-zinc-200 text-black text-2xl font-bold active:bg-zinc-100 touch-manipulation"
                            >
                                0
                            </button>
                        </div>
                        <div className="col-start-3">
                            <button
                                type="button"
                                onClick={handleBackspace}
                                className="w-full h-16 rounded-lg bg-zinc-100 text-black text-xl font-bold active:bg-zinc-200 flex items-center justify-center touch-manipulation"
                            >
                                ⌫
                            </button>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        type="submit"
                        disabled={pin.length === 0}
                        className="w-full h-16 bg-black text-white text-xl font-bold rounded-lg disabled:opacity-50 disabled:bg-zinc-400 touch-manipulation"
                    >
                        Acceder
                    </button>
                </form>
            </div>
        </div>
    );
}
