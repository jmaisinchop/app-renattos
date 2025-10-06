// src/layouts/DashboardLayout.jsx
import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom'; // Outlet para renderizar rutas anidadas
import SidebarNav from '../components/dashboard/SidebarNav';
import DashboardHeader from '../components/dashboard/DashboardHeader'; // Opcional
import { FiMenu, FiX } from 'react-icons/fi';

const DashboardLayout = ({ user }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />; // Doble seguridad
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Sidebar */}
      <SidebarNav user={user} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Área de Contenido */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header del Dashboard (opcional, podrías incluir el ToggleThemeButton aquí también) */}
        <DashboardHeader user={user} toggleSidebar={() => setSidebarOpen(prev => !prev)} sidebarOpen={sidebarOpen} />
        
        {/* Contenido Principal del Módulo */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 md:p-8">
          <Outlet /> {/* Aquí se renderizarán los componentes de las rutas anidadas (ClientsPage, ProductsPage, etc.) */}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;