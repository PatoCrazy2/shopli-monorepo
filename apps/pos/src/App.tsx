import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginForm } from './features/auth/LoginForm';
import MainLayout from './components/layout/MainLayout';
import SalesScreen from './features/sales/SalesScreen';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = (pin: string) => {
    // Aquí implementaremos la validación del PIN con la BD local de RxDB/PowerSync en el futuro.
    // Por ahora, cualquier PIN nos da acceso a modo de demostración.
    console.log('Login attempt with PIN:', pin);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          !isAuthenticated ? (
            <LoginForm onLogin={handleLogin} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/"
        element={
          isAuthenticated ? (
            <MainLayout onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        {/* Rutas anidadas dentro del MainLayout */}
        <Route index element={<SalesScreen />} />
        {/* Otras rutas como inventario, reportes se pueden agregar aquí */}
      </Route>
    </Routes>
  );
}

export default App;
