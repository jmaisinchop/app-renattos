// src/components/ToggleThemeButton.jsx
import React from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';

const ToggleThemeButton = ({ darkMode, toggleDarkMode }) => {
  return (
    <button
      onClick={toggleDarkMode}
      aria-label={darkMode ? "Activar modo claro" : "Activar modo oscuro"}
      className={`
        fixed bottom-4 right-4 z-50
        w-14 h-14 sm:w-16 sm:h-16 
        flex items-center justify-center 
        rounded-full 
        shadow-xl hover:shadow-yellow-glow 
        transition-all duration-300 ease-in-out transform hover:scale-110
        focus:outline-none focus:ring-2 focus:ring-offset-2 
        dark:focus:ring-offset-background-dark focus:ring-secondary
        bg-opacity-80 dark:bg-opacity-70
        ${darkMode
          ? 'bg-primary-light hover:bg-primary text-secondary' // Botón oscuro, icono amarillo
          : 'bg-accent hover:bg-accent-dark text-primary' // Botón beige, icono carbón
        }
      `}
    >
      {darkMode ? (
        <FiSun className="w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-500 ease-out transform group-hover:rotate-90" />
      ) : (
        <FiMoon className="w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-500 ease-out transform group-hover:-rotate-45" />
      )}
    </button>
  );
};

export default ToggleThemeButton;