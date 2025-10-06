// src/pages/dashboard/SettingsPage.jsx
import React from 'react';
import { FiSettings } from 'react-icons/fi';

const SettingsPage = () => {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-semibold text-text-dark dark:text-text-light mb-6 flex items-center gap-2">
        <FiSettings /> Configuración
      </h2>
      <div className="bg-form-bg-light dark:bg-form-bg-dark p-8 rounded-lg shadow-lg border border-ui-border-light dark:border-ui-border-dark">
        <p className="text-text-muted-light dark:text-text-muted-dark">
          Opciones de configuración de la aplicación y perfil de usuario.
          (Funcionalidad por implementar)
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;