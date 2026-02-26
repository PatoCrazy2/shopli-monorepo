import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

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
    login: (pin: string) => void;
    logout: () => void;
    openShift: (initialAmount: number) => void;
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

    const login = (pin: string) => {
        // MOCK LOGIN: Allows any PIN for now.
        console.log('Login attempt with PIN:', pin);
        // We set a mock user
        const mockUser: User = {
            id: 'usr_12345',
            name: 'Cajero Demo',
            role: 'CAJERO',
            branchId: 'br_999',
            branchName: 'Sucursal Principal',
        };

        setUser(mockUser);
        setActiveShift(null);
        localStorage.setItem('mock_user', JSON.stringify(mockUser));
        localStorage.removeItem('mock_shift');
    };

    const logout = () => {
        setUser(null);
        setActiveShift(null);
        localStorage.removeItem('mock_user');
        localStorage.removeItem('mock_shift');
    };

    const openShift = (initialAmount: number) => {
        if (!user) return;

        const newShift: Shift = {
            id: crypto.randomUUID(),
            userId: user.id,
            branchId: user.branchId,
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
