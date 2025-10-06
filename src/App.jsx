// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase/config';
import { onAuthStateChanged } from "firebase/auth";

import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';

// Páginas del Dashboard (Módulos)
import DashboardHomePage from './pages/dashboard/DashboardHomePage';
import ClientsPage from './pages/dashboard/ClientsPage';
import ProductsPage from './pages/dashboard/ProductsPage';
import CategoriesPage from './pages/dashboard/CategoriesPage';
import FactorPlazoPage from './pages/dashboard/FactorPlazoPage';
import SalesPage from './pages/dashboard/SalesPage';
import PaymentProcessingPage from './pages/dashboard/PaymentProcessingPage'; // NUEVO

const App = () => {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('theme');
    return savedMode === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  if (loadingAuth) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-background-dark' : 'bg-background-light'}`}>
        <div className="text-2xl text-text-dark dark:text-text-light font-semibold">Cargando Renatto's Almacenes...</div>
      </div>
    );
  }

  // Componente para Rutas Protegidas
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Router>
      <MainLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

          <Route
            path="/dashboard/*" // Ruta base para todo el dashboard
            element={
              <ProtectedRoute>
                <DashboardLayout user={user} />
              </ProtectedRoute>
            }
          >
            {/* Rutas anidadas dentro de DashboardLayout */}
            <Route index element={<DashboardHomePage user={user} />} /> {/* /dashboard */}
            <Route path="clients" element={<ClientsPage user={user} />} /> {/* /dashboard/clients */}
            <Route path="categories" element={<CategoriesPage />} /> {/* /dashboard/categories --- NUEVO */}
            <Route path="products" element={<ProductsPage />} /> {/* /dashboard/products */}
            <Route path="factor-plazo" element={<FactorPlazoPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="process-payments" element={<PaymentProcessingPage />} />

            {/* Más rutas de módulos aquí */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} /> {/* Fallback para rutas no encontradas en dashboard */}
          </Route>

          <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} /> {/* Fallback general */}
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;