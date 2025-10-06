// src/layouts/MainLayout.jsx
import React from 'react';
import ToggleThemeButton from '../components/ToggleThemeButton';

const MainLayout = ({ children, darkMode, toggleDarkMode }) => {
  return (
    // La clase 'font-sans' ahora se puede aplicar directamente en tailwind.config.js o en index.css
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-dark dark:text-text-light transition-colors duration-300 font-sans">
      <ToggleThemeButton darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <main>{children}</main>
    </div>
  );
};

export default MainLayout;