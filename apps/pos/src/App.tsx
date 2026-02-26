import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginForm } from './features/auth/LoginForm';
import MainLayout from './components/layout/MainLayout';
import SalesScreen from './features/sales/SalesScreen';
import OpenRegisterScreen from './features/sales/OpenRegisterScreen';
import CloseRegisterScreen from './features/sales/CloseRegisterScreen';
import SalesHistoryScreen from './features/sales/SalesHistoryScreen';
import InventoryScreen from './features/inventory/InventoryScreen';
import InventoryAuditWizard from './features/inventory/InventoryAuditWizard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

// Componente para proteger rutas que requieren autenticación PERO no necesariamente turno abierto
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Componente para proteger la pantalla de ventas: REQUIERE turno abierto
function RequireOpenShift({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasActiveShift } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!hasActiveShift) return <Navigate to="/abrir-caja" replace />;

  return <>{children}</>;
}

// Componente para evitar que usuarios con turno abierto entren a "abrir caja"
function RequireNoOpenShift({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasActiveShift } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (hasActiveShift) return <Navigate to="/" replace />; // Ya tiene turno, va a ventas

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, login, logout } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          !isAuthenticated ? (
            <LoginForm onLogin={login} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/abrir-caja"
        element={
          <RequireNoOpenShift>
            <OpenRegisterScreen />
          </RequireNoOpenShift>
        }
      />

      <Route
        path="/"
        element={
          <RequireOpenShift>
            <MainLayout onLogout={logout} />
          </RequireOpenShift>
        }
      >
        <Route index element={<SalesScreen />} />
        <Route path="corte-caja" element={<CloseRegisterScreen />} />
        <Route path="historial-ventas" element={<SalesHistoryScreen />} />
        <Route path="inventario" element={<InventoryScreen />} />
        <Route path="auditoria-cierre" element={<InventoryAuditWizard />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
