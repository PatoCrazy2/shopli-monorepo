import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { db } from '../lib/db';
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

interface AuthContextType {
    user: User | null;
    activeShift: Shift | null;
    isAuthenticated: boolean;
    hasActiveShift: boolean;
    login: (pin: string, email?: string) => Promise<boolean>;
    logout: () => void;
    openShift: (initialAmount: number, branchId: string) => Promise<void>;
    closeShift: (physicalAmount: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('auth_user');
        return saved ? JSON.parse(saved) : null;
    });

    const [activeShift, setActiveShift] = useState<Shift | null>(() => {
        const saved = localStorage.getItem('pos_shift');
        return saved ? JSON.parse(saved) : null;
    });

    const login = async (pin: string, email?: string): Promise<boolean> => {
        let localUser = null;
        let recoveredShift: Shift | null = null;

        if (email) {
            // Login inicial online para configurar la empresa del dispositivo
            if (!navigator.onLine) {
                console.warn('Se requiere conexión a internet para el login inicial.');
                return false;
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
                
                // Guardar empresaId en db.meta antes del pull
                await db.meta.put({ key: 'empresaId', value: data.empresa_id });

                // Hacemos el pull para descargar el catálogo de esa empresa
                await pullFromCloud();

                // Ahora buscamos al usuario localmente ya guardado en IndexedDB
                localUser = await db.users.get(data.id);

                // Si viene un turno activo desde el servidor, lo guardamos localmente
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
            } catch (error) {
                console.error('Error durante el login online inicial:', error);
                return false;
            }
        } else {
            // Login offline-first regular por PIN
            if (navigator.onLine) {
                console.log("Intentando pull de base de datos desde la nube local first...");
                try {
                    await pullFromCloud();
                } catch (e) {
                    console.warn('Error silencioso al jalar catálogo durante el login:', e);
                }
            }

            // Obtenemos todos los usuarios con rol de POS y comparamos el PIN con bcrypt
            const allUsers = await db.users
                .where('role').anyOf(['CAJERO', 'ENCARGADO'])
                .toArray();

            // En un entorno local-first offline el PIN debe haber sido guardado previemente como un hash bcrypt (via pullFromCloud).
            for (const u of allUsers) {
                if (u.pin && await bcrypt.compare(pin, u.pin)) {
                    localUser = u;
                    break;
                }
            }
        }

        if (!localUser) {
            console.warn('PIN Incorrecto o usuario no encontrado en base de datos local');
            return false;
        }

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
        return true;
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
