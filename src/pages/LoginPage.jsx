// src/pages/LoginPage.jsx
import React from 'react';
import LoginForm from '../components/LoginForm';
import { FiBox, FiShield, FiZap } from 'react-icons/fi'; // Iconos para tarjetas

const LoginPage = () => {
  // Simulación de un logo con los colores de Renatto's (puedes reemplazarlo con tu SVG/imagen real)
  const RenattosLogoPlaceholder = () => (
    <div className="relative w-48 h-24 sm:w-60 sm:h-32 mb-8 animate-fade-in animation-delay-400">
      <div className="absolute inset-0 bg-renatto-dark transform -skew-y-3 shadow-2xl"></div>
      <div className="absolute -top-2 -left-2 w-full h-full bg-renatto-beige transform -skew-y-3 opacity-80"></div>
      <div className="absolute -bottom-3 -right-3 w-3/4 h-1/2 bg-renatto-yellow transform -skew-y-3"></div>
      <div className="relative flex items-center justify-center w-full h-full">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-renatto-white tracking-tight">
          Renatto's
        </h1>
      </div>
    </div>
  );


  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans bg-background-light dark:bg-background-dark">
      {/* Columna de Branding/Imagen */}
      <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-16 bg-primary dark:bg-primary text-text-light relative overflow-hidden">
        {/* Formas geométricas inspiradas en el logo */}
        <div className="absolute -top-1/4 -left-1/4 w-3/5 h-3/5 bg-secondary/20 dark:bg-secondary/10 rounded-full filter blur-3xl animate-float opacity-70"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-accent/20 dark:bg-accent/10 rounded-lg filter blur-2xl animate-float-reverse opacity-60 transform rotate-45"></div>
        <div className="absolute top-10 left-10 w-20 h-20 bg-renatto-white/10 rounded-full animate-subtle-pulse"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 border-4 border-dashed border-renatto-yellow/30 rounded-lg animate-spin-slow transform rotate-12"></div>


        <div className="relative z-10 text-center max-w-xl flex flex-col items-center animate-fade-in">
          <RenattosLogoPlaceholder />
          <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight animate-slide-in-up animation-delay-200">
            Bienvenido a <span className="text-secondary">Almacenes Renatto's</span>
          </h2>
          <p className="text-lg text-text-light/80 dark:text-text-light/70 mb-10 animate-slide-in-up animation-delay-400">
            Tu solución confiable en productos de calidad y servicio excepcional.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left w-full animate-slide-in-up animation-delay-600">
            {[
              { icon: <FiBox className="w-8 h-8 text-secondary mb-2" />, title: "Variedad", desc: "Amplio stock" },
              { icon: <FiShield className="w-8 h-8 text-secondary mb-2" />, title: "Confianza", desc: "Calidad garantizada" },
              { icon: <FiZap className="w-8 h-8 text-secondary mb-2" />, title: "Eficiencia", desc: "Servicio ágil" },
            ].map((item, i) => (
              <div key={i} className="bg-primary-light/30 dark:bg-primary-light/20 p-4 rounded-xl backdrop-blur-sm border border-renatto-white/10 shadow-lg hover:shadow-yellow-glow transition-shadow duration-300">
                {item.icon}
                <h3 className="font-semibold text-text-light mb-1">{item.title}</h3>
                <p className="text-xs text-text-light/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Columna del Formulario */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex items-center justify-center p-6 sm:p-8 md:p-12 lg:p-16 bg-background-light dark:bg-form-bg-dark transition-colors duration-300">
        <div className="w-full max-w-md animate-fade-in">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;