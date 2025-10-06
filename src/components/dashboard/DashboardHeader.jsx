// src/components/dashboard/DashboardHeader.jsx
import React from 'react';
import { FiMenu, FiUser } from 'react-icons/fi';

const DashboardHeader = ({ user, toggleSidebar, sidebarOpen }) => {
  return (
    <header className="sticky top-0 z-20 bg-background-light dark:bg-form-bg-dark shadow-md border-b border-ui-border-light dark:border-ui-border-dark">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Botón para abrir/cerrar sidebar en móvil */}
        <button 
          onClick={toggleSidebar}
          className="lg:hidden text-text-muted-light dark:text-text-muted-dark hover:text-primary dark:hover:text-renatto-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
          aria-controls="sidebar"
          aria-expanded={sidebarOpen}
        >
          <span className="sr-only">Abrir sidebar</span>
          <FiMenu size={24} />
        </button>

        {/* Espaciador para centrar el contenido si el botón de menú está oculto en desktop */}
        <div className="hidden lg:block w-8"></div>


        <div className="flex items-center gap-3">
          {/* Aquí podrías poner un buscador, notificaciones, etc. */}
          <div className="flex items-center gap-2 text-sm text-text-muted-light dark:text-text-muted-dark">
            <FiUser/>
            <span>{user?.email}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;