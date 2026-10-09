import { useState, useEffect, type FormEvent } from 'react';
import { Loader2, Settings, ArrowLeft, ShieldAlert, Clock, Mail, Lock, Delete } from 'lucide-react';
import { db, type LocalUser } from '../../lib/db';
import { PWASettingsModal } from '../../components/PWASettingsModal';
import { PWAInstallPrompt } from '../../components/PWAInstallPrompt';
import type { LoginResult } from '../../contexts/AuthContext';

const AVATAR_PALETTES: readonly [string, string][] = [
    ['#18181b', '#52525b'], // Obsidian -> Zinc
    ['#0f172a', '#2563eb'], // Midnight -> Cobalt
    ['#064e3b', '#10b981'], // Forest -> Emerald
    ['#1e1b4b', '#7c3aed'], // Deep Indigo -> Violet
    ['#27272a', '#71717a'], // Graphite -> Slate
    ['#451a03', '#d97706'], // Espresso -> Amber
    ['#042f2e', '#0d9488'], // Abyss -> Teal
    ['#3b0764', '#db2777'], // Plum -> Rose
];

function getDeterministicHash(seed: string): number {
    let hash = 2166136261;
    for (let i = 0; i < seed.length; i++) {
        hash ^= seed.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash);
}

function UserAvatar({ id, name, size = 40 }: { id: string; name?: string | null; size?: number }) {
    const seed = `${id || ''}-${name || 'user'}`;
    const hash = getDeterministicHash(seed);
    const [colorStart, colorEnd] = AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
    const orbX = 10 + (hash % 22);
    const orbY = 8 + ((hash >> 4) % 22);
    const orbR = 12 + ((hash >> 8) % 8);
    const gradId = `avatar-grad-${hash}`;
    const initial = name ? name.trim().charAt(0).toUpperCase() : '•';

    return (
        <div
            style={{ width: size, height: size }}
            className="relative rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 select-none shadow-2xs"
        >
            <svg
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full absolute inset-0"
                aria-hidden="true"
            >
                <defs>
                    <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={colorStart} />
                        <stop offset="100%" stopColor={colorEnd} />
                    </linearGradient>
                </defs>
                <rect width="40" height="40" rx="20" fill={`url(#${gradId})`} />
                <circle cx={orbX} cy={orbY} r={orbR} fill="#ffffff" fillOpacity="0.16" />
            </svg>
            <span className="relative z-10 text-white font-semibold text-sm tracking-tight leading-none">
                {initial}
            </span>
        </div>
    );
}

export function LoginForm({
    onLogin,
}: {
    onLogin: (pin: string, email?: string, userId?: string, turnstileToken?: string | null) => Promise<LoginResult | boolean> | void;
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
            setAvailableUsers(users.filter(u => u.active !== false));
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

    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).onPosTurnstileCallback = (token: string) => {
                setTurnstileToken(token);
            };
        }
    }, []);

    // Soporte para teclado físico (0-9, Backspace, Enter) cuando hay un usuario seleccionado
    useEffect(() => {
        if (!selectedUser || !isConfigured || isSettingsOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key >= '0' && e.key <= '9') {
                handleKeyPress(e.key);
            } else if (e.key === 'Backspace') {
                handleBackspace();
            } else if (e.key === 'Enter') {
                if (pin.length === 6) {
                    executeLogin(pin, undefined, selectedUser.id);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedUser, isConfigured, isSettingsOpen, pin, lockoutRemaining, deviceLockoutRemaining, isPermanentLock]);

    const executeLogin = async (pinToSubmit: string, emailToSubmit?: string, userIdToSubmit?: string) => {
        if (pinToSubmit.length !== 6) return;

        setIsSyncing(true);
        setErrorMessage(null);

        try {
            const result = await onLogin(pinToSubmit, emailToSubmit, userIdToSubmit, turnstileToken);
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
            if (!email || pin.length !== 6) {
                setErrorMessage('Ingrese correo y el PIN de acceso de 6 dígitos');
                return;
            }
            await executeLogin(pin, email);
        } else if (selectedUser) {
            await executeLogin(pin, undefined, selectedUser.id);
        }
    };

    const isInputBlocked = lockoutRemaining > 0 || deviceLockoutRemaining > 0 || isPermanentLock;

    return (
        <div className="h-dvh w-full overflow-hidden bg-zinc-50 flex flex-col items-center justify-center p-4 selection:bg-black selection:text-white font-sans relative">
            {!isConfigured && <PWAInstallPrompt />}
            <div className="w-full max-w-sm">
                {/* Header: Icono óptico de 46x46, separación de 14px, ShopLI en 29px semibold y POS integrado en 16px medium */}
                <div className="flex items-center justify-center gap-3.5 mb-10">
                    <img
                        src="/shopli.svg"
                        alt="ShopLI Logo"
                        width={46}
                        height={46}
                        className="w-[46px] h-[46px] rounded-xl object-contain select-none pointer-events-none"
                    />
                    <div className="flex items-baseline gap-2">
                        <span className="text-[29px] font-semibold text-black tracking-[-0.02em] leading-none">
                            ShopLI
                        </span>
                        <span className="text-[16px] font-medium text-zinc-400 tracking-normal leading-none">
                            POS
                        </span>
                    </div>
                </div>

                {/* Banner de Bloqueo Global de Dispositivo */}
                {deviceLockoutRemaining > 0 && (
                    <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 animate-pulse">
                        <ShieldAlert className="w-6 h-6 flex-shrink-0 text-red-600" />
                        <div className="text-sm">
                            <p className="font-bold">Terminal bloqueada temporalmente</p>
                            <p>Demasiados intentos fallidos. Intente de nuevo en <span className="font-mono font-bold text-red-800">{deviceLockoutRemaining}s</span>.</p>
                        </div>
                    </div>
                )}

                {/* Banner de Error */}
                {errorMessage && (
                    <div className="mb-6 p-3.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-sm text-center font-medium">
                        {errorMessage}
                    </div>
                )}

                {/* CASO 1: Dispositivo no configurado (Moderno, sin card envolvente, inputs rounded-full) */}
                {!isConfigured ? (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                        {/* Input Correo */}
                        <div className="relative flex items-center">
                            <div className="absolute left-4 pointer-events-none text-zinc-400">
                                <Mail size={18} />
                            </div>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Correo electrónico"
                                required
                                className="w-full h-14 pl-11 pr-5 rounded-full border border-zinc-200 bg-white text-black text-sm placeholder:text-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black shadow-xs"
                            />
                        </div>

                        {/* Input PIN */}
                        <div className="relative flex items-center">
                            <div className="absolute left-4 pointer-events-none text-zinc-400">
                                <Lock size={18} />
                            </div>
                            <input
                                id="pin"
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                autoComplete="off"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="••••••"
                                maxLength={6}
                                required
                                className="w-full h-14 pl-11 pr-5 rounded-full border border-zinc-200 bg-white text-black text-center text-xl font-bold tracking-[0.35em] placeholder:tracking-[0.35em] placeholder:text-zinc-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black shadow-xs"
                            />
                        </div>

                        {import.meta.env.VITE_TURNSTILE_SITE_KEY && (
                            <div className="flex justify-center my-1">
                                <div
                                    className="cf-turnstile"
                                    data-sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                                    data-callback="onPosTurnstileCallback"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSyncing || !email || pin.length !== 6}
                            className="w-full h-14 mt-1 font-bold text-base rounded-full bg-black text-white hover:bg-zinc-900 active:scale-[0.98] disabled:bg-zinc-100 disabled:text-zinc-400 disabled:shadow-none disabled:active:scale-100 flex items-center justify-center transition-none shadow-sm cursor-pointer disabled:cursor-not-allowed"
                        >
                            {isSyncing ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" size={18} />
                                    Configurando...
                                </>
                            ) : (
                                'Configurar Dispositivo'
                            )}
                        </button>
                    </form>
                ) : !selectedUser ? (
                    /* CASO 2: Dispositivo configurado - Selector Visual de Cajeros (1 columna de píldoras rounded-full) */
                    <div className="flex flex-col gap-3.5">
                        <div className="flex flex-col gap-3 max-h-[340px] overflow-y-auto px-0.5 py-0.5">
                            {availableUsers.map((u) => (
                                <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => handleSelectUser(u)}
                                    className="w-full h-15 px-3.5 rounded-full bg-white border border-zinc-200 hover:border-black active:scale-[0.98] transition-none flex items-center justify-between gap-3 shadow-xs cursor-pointer text-left group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <UserAvatar id={u.id} name={u.name} size={40} />
                                        <span className="font-semibold text-zinc-900 truncate text-[15px]">
                                            {u.name || 'Sin nombre'}
                                        </span>
                                    </div>
                                    <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500 uppercase tracking-wider flex-shrink-0">
                                        {u.role}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {availableUsers.length === 0 && (
                            <div className="text-center p-7 bg-white rounded-3xl border border-zinc-200 shadow-xs">
                                <p className="text-zinc-600 text-sm font-medium mb-1">No hay usuarios sincronizados</p>
                                <p className="text-xs text-zinc-400">Abre Configuración del sistema para sincronizar.</p>
                            </div>
                        )}

                        <div className="flex justify-center pt-2">
                            <button
                                type="button"
                                onClick={() => setIsSettingsOpen(true)}
                                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-none py-2 cursor-pointer"
                            >
                                <Settings size={14} className="opacity-70" />
                                <span>Configuración del sistema</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    /* CASO 3: Teclado Numérico de 6 Dígitos para el Usuario Seleccionado */
                    <div className="flex flex-col gap-6">
                        {/* Píldora del Usuario Seleccionado */}
                        <div className="flex items-center justify-between bg-white h-15 px-3.5 rounded-full border border-zinc-200 shadow-xs">
                            <div className="flex items-center gap-3 min-w-0">
                                <UserAvatar id={selectedUser.id} name={selectedUser.name} size={38} />
                                <div className="min-w-0 text-left">
                                    <h2 className="font-semibold text-zinc-900 text-sm truncate leading-tight">
                                        {selectedUser.name}
                                    </h2>
                                    <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider block leading-tight mt-0.5">
                                        {selectedUser.role}
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedUser(null);
                                    setPin('');
                                    setErrorMessage(null);
                                }}
                                className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-black px-3 py-1.5 rounded-full hover:bg-zinc-100 transition-none cursor-pointer flex-shrink-0"
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

                        {/* Display de PIN: 6 puntos circulares minimalistas */}
                        <div
                            className={`flex items-center justify-center gap-4 py-2 ${
                                isSyncing ? 'animate-pulse' : ''
                            }`}
                        >
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-3.5 h-3.5 rounded-full transition-none select-none ${
                                        errorMessage
                                            ? 'bg-red-500'
                                            : pin.length > i
                                            ? 'bg-black'
                                            : 'bg-zinc-200'
                                    }`}
                                />
                            ))}
                        </div>

                        {/* Teclado Numérico (Opción 1: Píldoras/Círculos suaves en blanco) */}
                        <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    disabled={isInputBlocked || isSyncing}
                                    onClick={() => handleKeyPress(num.toString())}
                                    className="h-15 rounded-full bg-white border border-zinc-200/90 text-zinc-900 text-2xl font-semibold active:bg-black active:text-white active:border-black disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation shadow-2xs active:scale-[0.98] select-none transition-none cursor-pointer"
                                >
                                    {num}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setIsSettingsOpen(true)}
                                className="h-15 rounded-full bg-transparent text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 active:bg-zinc-200/70 flex items-center justify-center touch-manipulation active:scale-[0.98] select-none transition-none cursor-pointer"
                                title="Ajustes del Sistema"
                            >
                                <Settings size={21} />
                            </button>
                            <button
                                type="button"
                                disabled={isInputBlocked || isSyncing}
                                onClick={() => handleKeyPress('0')}
                                className="h-15 rounded-full bg-white border border-zinc-200/90 text-zinc-900 text-2xl font-semibold active:bg-black active:text-white active:border-black disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation shadow-2xs active:scale-[0.98] select-none transition-none cursor-pointer"
                            >
                                0
                            </button>
                            <button
                                type="button"
                                disabled={isInputBlocked || isSyncing || pin.length === 0}
                                onClick={handleBackspace}
                                className="h-15 rounded-full bg-transparent text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 active:bg-zinc-200/70 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed flex items-center justify-center touch-manipulation active:scale-[0.98] select-none transition-none cursor-pointer"
                                title="Borrar"
                            >
                                <Delete size={21} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <PWASettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
}
