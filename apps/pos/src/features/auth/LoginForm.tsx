import { useState, useEffect, type FormEvent } from 'react';
import { Loader2, Settings, User as UserIcon, ArrowLeft, ShieldAlert, Clock } from 'lucide-react';
import { db, type LocalUser } from '../../lib/db';
import { PWASettingsModal } from '../../components/PWASettingsModal';
import type { LoginResult } from '../../contexts/AuthContext';

export function LoginForm({
    onLogin,
}: {
    onLogin: (pin: string, email?: string, userId?: string) => Promise<LoginResult | boolean> | void;
}) {
    const [pin, setPin] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isConfigured, setIsConfigured] = useState(true);
    const [email, setEmail] = useState('');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const [availableUsers, setAvailableUsers] = useState<LocalUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<LocalUser | null>(null);
    const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
    const [deviceLockoutRemaining, setDeviceLockoutRemaining] = useState<number>(0);
    const [isPermanentLock, setIsPermanentLock] = useState(false);

    // Cargar configuración inicial y usuarios locales
    const loadState = async () => {
        const empresa = await db.meta.get('empresaId');
        const configured = !!empresa?.value;
        setIsConfigured(configured);

        if (configured) {
            const users = await db.users.where('role').anyOf(['CAJERO', 'ENCARGADO']).toArray();
            setAvailableUsers(users);
        }

        // Revisar si la terminal tiene bloqueo global activo
        const devLock = await db.meta.get('device_locked_until');
        const devUntil = devLock?.value ? Number(devLock.value) : 0;
        if (devUntil > Date.now()) {
            setDeviceLockoutRemaining(Math.ceil((devUntil - Date.now()) / 1000));
        } else {
            setDeviceLockoutRemaining(0);
        }
    };

    useEffect(() => {
        loadState();
    }, []);

    // Timer para cuenta regresiva de bloqueo por usuario o de terminal
    useEffect(() => {
        if (lockoutRemaining <= 0 && deviceLockoutRemaining <= 0) return;

        const interval = setInterval(() => {
            setLockoutRemaining((prev) => (prev > 0 ? prev - 1 : 0));
            setDeviceLockoutRemaining((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(interval);
    }, [lockoutRemaining, deviceLockoutRemaining]);

    // Al seleccionar un usuario, verificar si tiene penalización activa
    const handleSelectUser = async (u: LocalUser) => {
        setSelectedUser(u);
        setPin('');
        setErrorMessage(null);
        setIsPermanentLock(false);

        const lockRecord = await db.meta.get(`lockout_${u.id}`);
        if (lockRecord?.value) {
            const { failedAttempts = 0, lockedUntil = null } = lockRecord.value;
            if (failedAttempts >= 10) {
                setIsPermanentLock(true);
            } else if (lockedUntil && Number(lockedUntil) > Date.now()) {
                setLockoutRemaining(Math.ceil((Number(lockedUntil) - Date.now()) / 1000));
            } else {
                setLockoutRemaining(0);
            }
        } else {
            setLockoutRemaining(0);
        }
    };

    const handleKeyPress = (key: string) => {
        if (lockoutRemaining > 0 || deviceLockoutRemaining > 0 || isPermanentLock) return;
        if (pin.length < 6) {
            setErrorMessage(null);
            const newPin = pin + key;
            setPin(newPin);
            // Auto-submit opcional al llegar a 6 dígitos
            if (newPin.length === 6 && selectedUser) {
                executeLogin(newPin, undefined, selectedUser.id);
            }
        }
    };

    const handleBackspace = () => {
        if (lockoutRemaining > 0 || deviceLockoutRemaining > 0 || isPermanentLock) return;
        setErrorMessage(null);
        setPin((prev) => prev.slice(0, -1));
    };

    const executeLogin = async (pinToSubmit: string, emailToSubmit?: string, userIdToSubmit?: string) => {
        if (pinToSubmit.length < 4) return;

        setIsSyncing(true);
        setErrorMessage(null);

        try {
            const result = await onLogin(pinToSubmit, emailToSubmit, userIdToSubmit);
            setIsSyncing(false);

            if (typeof result === 'object' && result !== null) {
                if (!result.success) {
                    setErrorMessage(result.error || 'PIN incorrecto');
                    setPin('');

                    if (result.isDeviceLocked && result.lockedUntil) {
                        setDeviceLockoutRemaining(Math.ceil((result.lockedUntil - Date.now()) / 1000));
                    } else if (result.lockedUntil) {
                        setLockoutRemaining(Math.ceil((result.lockedUntil - Date.now()) / 1000));
                    } else if (result.isPermanentLock) {
                        setIsPermanentLock(true);
                    }
                } else if (result.success && !isConfigured) {
                    setIsConfigured(true);
                    await loadState();
                }
            } else if (result === false) {
                setErrorMessage('Credenciales inválidas, intente de nuevo.');
                setPin('');
            } else if (result === true && !isConfigured) {
                setIsConfigured(true);
                await loadState();
            }
        } catch (err: any) {
            setIsSyncing(false);
            setErrorMessage(err?.message || 'Error durante el inicio de sesión');
            setPin('');
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!isConfigured) {
            if (!email || pin.length < 4) {
                setErrorMessage('Ingrese correo y PIN de acceso');
                return;
            }
            await executeLogin(pin, email);
        } else if (selectedUser) {
            await executeLogin(pin, undefined, selectedUser.id);
        }
    };

    const isInputBlocked = lockoutRemaining > 0 || deviceLockoutRemaining > 0 || isPermanentLock;

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 selection:bg-black selection:text-white font-sans">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black tracking-tight text-black mb-1">
                        ShopLI <span className="text-sm font-semibold text-zinc-500 uppercase tracking-widest">POS</span>
                    </h1>
                    <p className="text-zinc-500 text-sm">
                        {!isConfigured
                            ? 'Configura el dispositivo con tu Email y PIN'
                            : selectedUser
                            ? `Ingresa el PIN de ${selectedUser.name}`
                            : 'Selecciona tu usuario para ingresar'}
                    </p>
                </div>

                {/* Banner de Bloqueo Global de Dispositivo */}
                {deviceLockoutRemaining > 0 && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 animate-pulse">
                        <ShieldAlert className="w-6 h-6 flex-shrink-0 text-red-600" />
                        <div className="text-sm">
                            <p className="font-bold">Terminal bloqueada temporalmente</p>
                            <p>Demasiados intentos fallidos. Intente de nuevo en <span className="font-mono font-bold text-red-800">{deviceLockoutRemaining}s</span>.</p>
                        </div>
                    </div>
                )}

                {/* Banner de Error */}
                {errorMessage && (
                    <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center font-medium">
                        {errorMessage}
                    </div>
                )}

                {/* CASO 1: Dispositivo no configurado (Formulario inicial Email + PIN) */}
                {!isConfigured ? (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-zinc-700 text-left" htmlFor="email">
                                Correo Electrónico
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ejemplo@shopli.com"
                                required
                                className="w-full h-12 px-4 rounded-lg border border-zinc-200 focus:outline-none focus:border-black text-black bg-white"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-zinc-700 text-left" htmlFor="pin">
                                PIN de Acceso (4 a 6 dígitos)
                            </label>
                            <input
                                id="pin"
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="******"
                                maxLength={6}
                                required
                                className="w-full h-12 px-4 rounded-lg border border-zinc-200 focus:outline-none focus:border-black text-black bg-white tracking-widest text-center text-xl font-bold"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSyncing || !email || pin.length < 4}
                            className="w-full h-12 bg-black text-white font-bold rounded-lg disabled:opacity-50 disabled:bg-zinc-400 flex items-center justify-center transition-all"
                        >
                            {isSyncing ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" size={20} />
                                    Configurando empresa...
                                </>
                            ) : (
                                'Configurar Dispositivo'
                            )}
                        </button>
                    </form>
                ) : !selectedUser ? (
                    /* CASO 2: Dispositivo configurado - Selector Visual de Cajeros */
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto p-1">
                            {availableUsers.map((u) => (
                                <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => handleSelectUser(u)}
                                    className="flex items-center gap-3.5 p-4 rounded-xl bg-white border border-zinc-200 hover:border-black hover:shadow-md transition-all active:scale-[0.98] text-left group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-zinc-100 group-hover:bg-zinc-900 group-hover:text-white text-zinc-700 flex items-center justify-center font-bold text-lg transition-colors flex-shrink-0">
                                        {u.name ? u.name.charAt(0).toUpperCase() : <UserIcon size={20} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-zinc-900 truncate text-base">{u.name || 'Sin nombre'}</h3>
                                        <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 uppercase tracking-wider mt-0.5">
                                            {u.role}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {availableUsers.length === 0 && (
                            <div className="text-center p-8 bg-white rounded-xl border border-zinc-200">
                                <p className="text-zinc-500 text-sm mb-3">No hay usuarios locales sincronizados.</p>
                                <button
                                    type="button"
                                    onClick={() => setIsConfigured(false)}
                                    className="text-xs font-bold text-black underline"
                                >
                                    Reconfigurar dispositivo con correo
                                </button>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="button"
                                onClick={() => setIsSettingsOpen(true)}
                                className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-black py-2"
                            >
                                <Settings size={16} /> Ajustes del Sistema
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsConfigured(false)}
                                className="text-xs font-semibold text-zinc-500 hover:text-black py-2"
                            >
                                Iniciar con otro correo
                            </button>
                        </div>
                    </div>
                ) : (
                    /* CASO 3: Teclado Numérico de 6 Dígitos para el Usuario Seleccionado */
                    <div className="flex flex-col gap-6">
                        {/* Tarjeta del Usuario Seleccionado */}
                        <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-zinc-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-base">
                                    {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : <UserIcon size={18} />}
                                </div>
                                <div>
                                    <h2 className="font-bold text-zinc-900 text-sm">{selectedUser.name}</h2>
                                    <span className="text-xs text-zinc-500 font-medium">{selectedUser.role}</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedUser(null);
                                    setPin('');
                                    setErrorMessage(null);
                                }}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-black px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
                            >
                                <ArrowLeft size={14} /> Cambiar
                            </button>
                        </div>

                        {/* Banner de Bloqueo por Usuario */}
                        {isPermanentLock ? (
                            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
                                <ShieldAlert className="w-6 h-6 flex-shrink-0 text-red-600" />
                                <p className="text-xs font-medium">
                                    Usuario bloqueado por superar 10 intentos fallidos. Conéctese a internet o solicite asistencia de un Encargado.
                                </p>
                            </div>
                        ) : lockoutRemaining > 0 ? (
                            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-3 animate-pulse">
                                <Clock className="w-6 h-6 flex-shrink-0 text-amber-600" />
                                <div className="text-xs font-medium">
                                    <p className="font-bold">Usuario bloqueado temporalmente</p>
                                    <p>Intente de nuevo en <span className="font-mono font-bold text-amber-950">{lockoutRemaining}s</span>.</p>
                                </div>
                            </div>
                        ) : null}

                        {/* Display de PIN (6 slots de puntos) */}
                        <div className="flex justify-center gap-3">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-11 h-14 rounded-xl border-2 flex items-center justify-center text-3xl font-bold transition-all ${
                                        errorMessage
                                            ? 'border-red-500 text-red-500 bg-red-50'
                                            : pin.length > i
                                            ? 'border-black text-black bg-white shadow-sm scale-105'
                                            : 'border-zinc-200 text-transparent bg-white'
                                    }`}
                                >
                                    {pin.length > i ? '•' : ''}
                                </div>
                            ))}
                        </div>

                        {/* Teclado Numérico */}
                        <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    disabled={isInputBlocked || isSyncing}
                                    onClick={() => handleKeyPress(num.toString())}
                                    className="h-14 rounded-xl bg-white border border-zinc-200 text-black text-2xl font-bold active:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation shadow-sm transition-transform active:scale-95"
                                >
                                    {num}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setIsSettingsOpen(true)}
                                className="h-14 rounded-xl bg-zinc-100 text-zinc-700 hover:text-black text-xl font-bold active:bg-zinc-200 flex items-center justify-center touch-manipulation transition-transform active:scale-95"
                                title="Ajustes del Sistema"
                            >
                                <Settings size={22} />
                            </button>
                            <button
                                type="button"
                                disabled={isInputBlocked || isSyncing}
                                onClick={() => handleKeyPress('0')}
                                className="h-14 rounded-xl bg-white border border-zinc-200 text-black text-2xl font-bold active:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation shadow-sm transition-transform active:scale-95"
                            >
                                0
                            </button>
                            <button
                                type="button"
                                disabled={isInputBlocked || isSyncing}
                                onClick={handleBackspace}
                                className="h-14 rounded-xl bg-zinc-100 text-zinc-700 hover:text-black text-xl font-bold active:bg-zinc-200 flex items-center justify-center touch-manipulation transition-transform active:scale-95"
                            >
                                ⌫
                            </button>
                        </div>

                        {/* Botón de Entrada */}
                        <button
                            type="button"
                            onClick={() => executeLogin(pin, undefined, selectedUser.id)}
                            disabled={pin.length < 4 || isInputBlocked || isSyncing}
                            className="w-full h-14 bg-black text-white text-lg font-bold rounded-xl disabled:opacity-40 disabled:bg-zinc-400 touch-manipulation flex items-center justify-center transition-all shadow-md active:scale-98"
                        >
                            {isSyncing ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" size={20} />
                                    Verificando PIN...
                                </>
                            ) : (
                                'Acceder'
                            )}
                        </button>
                    </div>
                )}
            </div>
            <PWASettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
}
