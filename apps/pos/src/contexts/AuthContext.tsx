import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { db } from '../lib/db';
import bcrypt from 'bcryptjs';
import { pullFromCloud } from '../lib/sync';


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
    login: (pin: string) => Promise<boolean>;
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

    const login = async (pin: string): Promise<boolean> => {
        // Enforce online pull to get freshest users and branches
        if (navigator.onLine) {
            console.log("Intentando pull de base de datos desde la nube local first...");
            await pullFromCloud();
        }

        // Obtenemos todos los usuarios con rol de POS y comparamos el PIN con bcrypt
        const allUsers = await db.users
            .where('role').anyOf(['CAJERO', 'ENCARGADO'])
            .toArray();

        // En un entorno local-first offline el PIN debe haber sido guardado previemente como un hash bcrypt (via pullFromCloud).
        let localUser = null;
        for (const u of allUsers) {
            if (u.pin && await bcrypt.compare(pin, u.pin)) {
                localUser = u;
                break;
            }
        }

        if (!localUser) {
            console.warn('PIN Incorrecto o usuario no encontrado en base de datos local');
            return false;
        }

        const branch = await db.branches.toCollection().first();

        const authUser: User = {
            id: localUser.id,
            name: localUser.name || 'Usuario',
            role: localUser.role,
            branchId: branch?.id || '',
            branchName: branch?.nombre || 'Sucursal Desconocida',
        };

        setUser(authUser);
        setActiveShift(null);
        localStorage.setItem('auth_user', JSON.stringify(authUser));
        localStorage.removeItem('pos_shift');
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

        setActiveShift(newShift);
        localStorage.setItem('pos_shift', JSON.stringify(newShift));
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
