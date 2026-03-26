import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { db } from '../lib/db';
import bcrypt from 'bcryptjs';
import { pullFromCloud } from '../lib/sync';

// Mock types for user and shift state.
// In the future this will be mapped to the PowerSync/RxDB models.
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
    openShift: (initialAmount: number, branchId: string) => void;
    closeShift: (physicalAmount: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('mock_user');
        return saved ? JSON.parse(saved) : null;
    });

    const [activeShift, setActiveShift] = useState<Shift | null>(() => {
        const saved = localStorage.getItem('mock_shift');
        return saved ? JSON.parse(saved) : null;
    });

    const login = async (pin: string): Promise<boolean> => {
        // Si no hay usuarios guardados, intentamos sincronizar desde el servidor primero
        const count = await db.users.count();
        if (count === 0 && navigator.onLine) {
            console.log("No hay usuarios locales, intentando pull inicial...");
            await pullFromCloud();
        }

        // Obtenemos todos los usuarios con rol de POS y comparamos el PIN con bcrypt
        const allUsers = await db.users
            .where('role').anyOf(['CAJERO', 'ENCARGADO'])
            .toArray();

        let localUser = null;
        for (const u of allUsers) {
            if (u.pin && await bcrypt.compare(pin, u.pin)) {
                localUser = u;
                break;
            }
        }

        if (!localUser) {
            console.warn('PIN Incorrecto o usuario no encontrado');
            return false;
        }

        const mockUser: User = {
            id: localUser.id,
            name: localUser.name || 'Usuario',
            role: localUser.role,
            branchId: 'branch-1', // Default inicial. En OpenRegisterScreen se asigna el real al Turno
            branchName: 'Sucursal Principal',
        };

        setUser(mockUser);
        setActiveShift(null);
        localStorage.setItem('mock_user', JSON.stringify(mockUser));
        localStorage.removeItem('mock_shift');
        return true;
    };

    const logout = () => {
        setUser(null);
        setActiveShift(null);
        localStorage.removeItem('mock_user');
        localStorage.removeItem('mock_shift');
    };

    const openShift = (initialAmount: number, branchId: string) => {
        if (!user) return;

        const newShift: Shift = {
            id: crypto.randomUUID(),
            userId: user.id,
            branchId: branchId, // Use the selected branch
            status: 'ABIERTO',
            initialAmount,
            totalSales: 0,
            openedAt: new Date(),
        };

        setActiveShift(newShift);
        localStorage.setItem('mock_shift', JSON.stringify(newShift));
    };

    const closeShift = (physicalAmount: number) => {
        if (!activeShift) return;

        // Mock updating the shift to CERRADO
        const closedShift = {
            ...activeShift,
            status: 'CERRADO' as const,
            closedAt: new Date(),
            // Optionally, we could store the physicalAmount on the model but for now we just change status
        };

        // In a real app we would save the closed shift to a "shifts history" list.
        // For local state we clear the *active* shift.
        setActiveShift(null);
        localStorage.removeItem('mock_shift');
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
