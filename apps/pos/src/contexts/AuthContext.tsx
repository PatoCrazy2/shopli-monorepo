import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { db, purgeAllTenantData } from '../lib/db';
import bcrypt from 'bcryptjs';
import { pullFromCloud, pushToCloud } from '../lib/sync';
import { apiClient } from '../lib/api-client';


export interface User {
    id: string;
    name: string;
    role: 'DUEÑO' | 'ENCARGADO' | 'CAJERO';
    branchId: string;
    branchName: string;
}

export interface Shift {
    id: string;
    userId: string;
    branchId: string;
    status: 'ABIERTO' | 'CERRADO';
    initialAmount: number;
    totalSales: number;
    openedAt: Date;
    closedAt?: Date;
}

export interface LoginResult {
    success: boolean;
    error?: string;
    lockedUntil?: number;
    isDeviceLocked?: boolean;
    isPermanentLock?: boolean;
}

interface AuthContextType {
    user: User | null;
    activeShift: Shift | null;
    isAuthenticated: boolean;
    hasActiveShift: boolean;
    login: (pin: string, email?: string, userId?: string) => Promise<LoginResult>;
    logout: () => void;
    openShift: (initialAmount: number, branchId: string) => Promise<void>;
    closeShift: (physicalAmount: number) => Promise<void>;
    unlockUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Constantes de Seguridad Offline
const OFFLINE_TTL_MS = 72 * 60 * 60 * 1000; // 72 horas
const DEVICE_LOCKOUT_THRESHOLD = 10; // 10 fallos globales
const DEVICE_LOCKOUT_WINDOW_MS = 5 * 60 * 1000; // 5 minutos
const DEVICE_LOCKOUT_DURATION_MS = 2 * 60 * 1000; // 2 minutos

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('auth_user');
        return saved ? JSON.parse(saved) : null;
    });

    const [activeShift, setActiveShift] = useState<Shift | null>(() => {
        const saved = localStorage.getItem('pos_shift');
        return saved ? JSON.parse(saved) : null;
    });

    const unlockUser = async (userId: string) => {
        await db.meta.delete(`lockout_${userId}`);
    };

    const login = async (pin: string, email?: string, userId?: string): Promise<LoginResult> => {
        let localUser: any = null;
        let recoveredShift: Shift | null = null;

        // 1. Verificación de Bloqueo Global de Dispositivo (Nivel 2: Anti-Fuerza Bruta Horizontal)
        const deviceLockRecord = await db.meta.get('device_locked_until');
        const deviceLockedUntil = deviceLockRecord ? Number(deviceLockRecord.value) : 0;
        if (deviceLockedUntil && deviceLockedUntil > Date.now()) {
            return {
                success: false,
                isDeviceLocked: true,
                lockedUntil: deviceLockedUntil,
                error: 'Dispositivo temporalmente bloqueado por múltiples intentos fallidos. Espere 2 minutos.'
            };
        }

        // 2. Verificación de Bloqueo por Usuario (Nivel 1: Anti-DoS y Protección Individual)
        if (userId) {
            const userLockRecord = await db.meta.get(`lockout_${userId}`);
            if (userLockRecord?.value) {
                const { failedAttempts = 0, lockedUntil = null } = userLockRecord.value;
                if (failedAttempts >= 10) {
                    return {
                        success: false,
                        isPermanentLock: true,
                        error: 'Usuario bloqueado por superar 10 intentos fallidos. Requiere conexión online o asistencia de Encargado/Dueño.'
                    };
                }
                if (lockedUntil && lockedUntil > Date.now()) {
                    return {
                        success: false,
                        lockedUntil,
                        error: `Usuario bloqueado temporalmente. Intente nuevamente en unos instantes.`
                    };
                }
            }
        }

        if (email && !userId) {
            // Login inicial online para configurar la empresa del dispositivo
            if (!navigator.onLine) {
                console.warn('Se requiere conexión a internet para el login inicial.');
                return {
                    success: false,
                    error: 'Se requiere conexión a internet para el primer emparejamiento del dispositivo.'
                };
            }

            try {
                const data = await apiClient<{ 
                    id: string; 
                    empresa_id: string;
                    active_shift?: {
                        id: string;
                        sucursal_id: string;
                        monto_inicial: number;
                        fecha_apertura: string;
                        total_ventas: number;
                    } | null;
                }>('pos/auth', {
                    method: 'POST',
                    body: { email, pin }
                });
                
                // Blindaje Multi-Tenant: Si el dispositivo tenía datos de otra empresa, purgamos todo antes de registrar la nueva
                const existingEmpresaRecord = await db.meta.get('empresaId');
                if (existingEmpresaRecord?.value !== data.empresa_id) {
                    await purgeAllTenantData();
                }

                // Guardar empresaId y registrar verificación online
                await db.meta.put({ key: 'empresaId', value: data.empresa_id });
                await db.meta.put({ key: 'lastOnlineVerification', value: new Date().toISOString() });

                // Hacemos el pull limpio para descargar el catálogo de esa empresa
                await pullFromCloud();

                // Ahora buscamos al usuario localmente ya guardado en IndexedDB
                localUser = await db.users.get(data.id);

                if (data.active_shift) {
                    await db.turnos.put({
                        id: data.active_shift.id,
                        usuario_id: data.id,
                        sucursal_id: data.active_shift.sucursal_id,
                        estado: 'ABIERTO',
                        monto_inicial: data.active_shift.monto_inicial,
                        monto_final: null,
                        total_ventas: data.active_shift.total_ventas,
                        fecha_apertura: data.active_shift.fecha_apertura,
                        fecha_cierre: null,
                        sync_status: 'SYNCED'
                    });

                    recoveredShift = {
                        id: data.active_shift.id,
                        userId: data.id,
                        branchId: data.active_shift.sucursal_id,
                        status: 'ABIERTO',
                        initialAmount: data.active_shift.monto_inicial,
                        totalSales: data.active_shift.total_ventas,
                        openedAt: new Date(data.active_shift.fecha_apertura)
                    };
                }
            } catch (error: any) {
                console.error('Error durante el login online inicial:', error);
                return {
                    success: false,
                    error: error?.message || 'Error al conectar con el servidor para la autenticación inicial.'
                };
            }
        } else {
            // Login offline-first regular
            if (navigator.onLine) {
                try {
                    await pullFromCloud();
                } catch (e) {
                    console.warn('Error silencioso al jalar catálogo durante el login:', e);
                }
            } else {
                // 3. Verificación de TTL de Sesión Offline (Máximo 72 horas sin internet)
                const lastVerificationRecord = await db.meta.get('lastOnlineVerification');
                if (lastVerificationRecord?.value) {
                    const lastVerificationTime = new Date(lastVerificationRecord.value).getTime();
                    if (!isNaN(lastVerificationTime) && Date.now() - lastVerificationTime > OFFLINE_TTL_MS) {
                        return {
                            success: false,
                            error: 'Sesión offline expirada (límite de 72h sin conexión). Conecte el dispositivo a internet para renovar credenciales.'
                        };
                    }
                }
            }

            // Búsqueda del usuario local: Dirigida por userId si viene del selector
            if (userId) {
                localUser = await db.users.get(userId);
                if (!localUser || !localUser.pin || !(await bcrypt.compare(pin, localUser.pin))) {
                    localUser = null;
                }
            } else if (email) {
                const found = await db.users.where('email').equalsIgnoreCase(email).first();
                if (found && found.pin && (await bcrypt.compare(pin, found.pin))) {
                    localUser = found;
                }
            } else {
                // Fallback por PIN único (para compatibilidad)
                const allUsers = await db.users
                    .where('role').anyOf(['CAJERO', 'ENCARGADO'])
                    .toArray();

                for (const u of allUsers) {
                    if (u.pin && (await bcrypt.compare(pin, u.pin))) {
                        localUser = u;
                        break;
                    }
                }
            }
        }

        // Manejo de fallo de credenciales: registrar en lockout global y de usuario
        if (!localUser) {
            // A. Registrar en ventana deslizante de fallos globales del dispositivo
            const attemptsRecord = await db.meta.get('device_failed_attempts');
            const pastAttempts: number[] = Array.isArray(attemptsRecord?.value) ? attemptsRecord.value : [];
            const recentFailures = pastAttempts.filter(t => Date.now() - t < DEVICE_LOCKOUT_WINDOW_MS);
            recentFailures.push(Date.now());

            if (recentFailures.length >= DEVICE_LOCKOUT_THRESHOLD) {
                const globalLockedUntil = Date.now() + DEVICE_LOCKOUT_DURATION_MS;
                await db.meta.put({ key: 'device_locked_until', value: globalLockedUntil });
                await db.meta.put({ key: 'device_failed_attempts', value: [] });
                return {
                    success: false,
                    isDeviceLocked: true,
                    lockedUntil: globalLockedUntil,
                    error: 'Demasiados intentos fallidos en la terminal. Dispositivo bloqueado por 2 minutos.'
                };
            } else {
                await db.meta.put({ key: 'device_failed_attempts', value: recentFailures });
            }

            // B. Registrar en lockout individual del usuario si fue seleccionado
            const targetUserId = userId || (email ? (await db.users.where('email').equalsIgnoreCase(email).first())?.id : null);
            if (targetUserId) {
                const userLockRecord = await db.meta.get(`lockout_${targetUserId}`);
                const currentAttempts = (userLockRecord?.value?.failedAttempts || 0) + 1;
                let userLockedUntil: number | null = null;
                let isPermanent = false;

                if (currentAttempts >= 10) {
                    isPermanent = true;
                } else if (currentAttempts >= 5) {
                    userLockedUntil = Date.now() + 5 * 60 * 1000; // 5 min
                } else if (currentAttempts >= 3) {
                    userLockedUntil = Date.now() + 30 * 1000; // 30 seg
                }

                await db.meta.put({
                    key: `lockout_${targetUserId}`,
                    value: { failedAttempts: currentAttempts, lockedUntil: userLockedUntil }
                });

                if (isPermanent) {
                    return {
                        success: false,
                        isPermanentLock: true,
                        error: 'PIN incorrecto. Usuario bloqueado permanentemente por superar 10 intentos fallidos.'
                    };
                }
                if (userLockedUntil) {
                    return {
                        success: false,
                        lockedUntil: userLockedUntil,
                        error: `PIN incorrecto. Usuario temporalmente bloqueado.`
                    };
                }
            }

            return {
                success: false,
                error: 'PIN incorrecto. Verifique sus datos.'
            };
        }

        // Login Exitoso: Limpiar lockout del usuario autenticado
        await db.meta.delete(`lockout_${localUser.id}`);

        const branches = await db.branches.toArray();
        let branch = null;
        if (recoveredShift) {
            branch = branches.find(b => b.id === recoveredShift.branchId) || null;
        }
        if (!branch) {
            branch = branches.sort((a,b) => a.nombre.localeCompare(b.nombre))[0];
        }

        const authUser: User = {
            id: localUser.id,
            name: localUser.name || 'Usuario',
            role: localUser.role,
            branchId: branch?.id || '',
            branchName: branch?.nombre || 'Sucursal Desconocida',
        };

        setUser(authUser);
        if (recoveredShift) {
            setActiveShift(recoveredShift);
            localStorage.setItem('pos_shift', JSON.stringify(recoveredShift));
        } else {
            setActiveShift(null);
            localStorage.removeItem('pos_shift');
        }
        localStorage.setItem('auth_user', JSON.stringify(authUser));
        return { success: true };
    };

    const logout = () => {
        setUser(null);
        setActiveShift(null);
        localStorage.removeItem('auth_user');
        localStorage.removeItem('pos_shift');
    };

    const openShift = async (initialAmount: number, branchId: string) => {
        if (!user) return;

        const newShift: Shift = {
            id: crypto.randomUUID(),
            userId: user.id,
            branchId: branchId,
            status: 'ABIERTO',
            initialAmount,
            totalSales: 0,
            openedAt: new Date(),
        };

        await db.turnos.add({
            id: newShift.id,
            usuario_id: newShift.userId,
            sucursal_id: newShift.branchId,
            estado: 'ABIERTO',
            monto_inicial: newShift.initialAmount,
            monto_final: null,
            total_ventas: 0,
            fecha_apertura: newShift.openedAt.toISOString(),
            fecha_cierre: null,
            sync_status: 'PENDING'
        });

        const branch = await db.branches.get(branchId);
        const updatedUser: User = { 
            ...user, 
            branchId, 
            branchName: branch?.nombre || 'Sucursal Desconocida' 
        };

        setUser(updatedUser);
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        
        setActiveShift(newShift);
        localStorage.setItem('pos_shift', JSON.stringify(newShift));

        if (navigator.onLine) {
            pushToCloud().catch(err => console.error("Error pushing shift open immediately:", err));
        }
    };

    const closeShift = async (physicalAmount: number) => {
        if (!activeShift) return;

        const closedShift = {
            ...activeShift,
            status: 'CERRADO' as const,
            closedAt: new Date(),
        };

        await db.turnos.update(activeShift.id, {
            estado: 'CERRADO',
            fecha_cierre: new Date().toISOString(),
            monto_final: physicalAmount,
            sync_status: 'PENDING'
        });

        setActiveShift(null);
        localStorage.removeItem('pos_shift');
        console.log('Shift closed. Physical amount recorded:', physicalAmount, closedShift);

        if (navigator.onLine) {
            pushToCloud().catch(err => console.error("Error pushing shift close immediately:", err));
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                activeShift,
                isAuthenticated: !!user,
                hasActiveShift: !!activeShift && activeShift.status === 'ABIERTO',
                login,
                logout,
                openShift,
                closeShift,
                unlockUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
