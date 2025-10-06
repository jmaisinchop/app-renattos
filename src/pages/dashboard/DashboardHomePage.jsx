// src/pages/dashboard/DashboardHomePage.jsx
import React from 'react';
import { FiBarChart2, FiUsers, FiPackage } from 'react-icons/fi';

const DashboardHomePage = ({ user }) => {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl sm:text-3xl font-semibold text-text-dark dark:text-text-light mb-2">
        Panel Principal
      </h2>
      <p className="text-text-muted-light dark:text-text-muted-dark mb-8">
        Bienvenido de nuevo, <span className="font-semibold text-secondary">{user?.email}</span>.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Ejemplo de tarjetas de resumen */}
        <div className="bg-form-bg-light dark:bg-form-bg-dark p-6 rounded-lg shadow-lg border border-ui-border-light dark:border-ui-border-dark hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-text-dark dark:text-text-light">Clientes Activos</h3>
            <FiUsers className="w-8 h-8 text-secondary" />
          </div>
          <p className="text-3xl font-bold text-primary dark:text-renatto-white">125</p> {/* Dato de ejemplo */}
          <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">+5 esta semana</p>
        </div>
        
        <div className="bg-form-bg-light dark:bg-form-bg-dark p-6 rounded-lg shadow-lg border border-ui-border-light dark:border-ui-border-dark hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-text-dark dark:text-text-light">Productos en Stock</h3>
            <FiPackage className="w-8 h-8 text-accent dark:text-accent" />
          </div>
          <p className="text-3xl font-bold text-primary dark:text-renatto-white">860</p> {/* Dato de ejemplo */}
           <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">30 bajos en stock</p>
        </div>

        <div className="bg-form-bg-light dark:bg-form-bg-dark p-6 rounded-lg shadow-lg border border-ui-border-light dark:border-ui-border-dark hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-text-dark dark:text-text-light">Ventas del Mes</h3>
             <FiBarChart2 className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-primary dark:text-renatto-white">$12,450</p> {/* Dato de ejemplo */}
          <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">+15% vs mes anterior</p>
        </div>
      </div>
      {/* Más contenido del dashboard home aquí */}
    </div>
  );
};
export default DashboardHomePage;