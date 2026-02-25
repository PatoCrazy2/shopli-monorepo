import { useState } from 'react';
import { LoginForm } from './features/auth/LoginForm';
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

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // Placeholder para el Dashboard del POS
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 font-sans text-black">
      <h1 className="text-4xl font-bold mb-4">Módulo de Ventas Activo</h1>
      <p className="text-xl text-zinc-600 mb-8">El modo Offline-First está listo para usarse.</p>
      <button
        onClick={handleLogout}
        className="h-16 px-8 bg-black text-white text-xl font-bold rounded-lg touch-manipulation active:bg-neutral-800"
      >
        Cerrar Sesión
      </button>
    </div>
  );
}

export default App;
