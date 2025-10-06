// src/components/LoginForm.jsx
import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from '../firebase/config';
import { FiMail, FiLock, FiLogIn, FiHelpCircle, FiLoader, FiCheckCircle, FiAlertTriangle, FiSend } from 'react-icons/fi';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    if (!email || !password) {
      setError("Ingresa tu correo y contraseña.");
      setLoading(false); return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      let friendlyMessage = 'Error al iniciar sesión.';
      if (['auth/user-not-found', 'auth/invalid-credential', 'auth/wrong-password'].includes(err.code)) {
        friendlyMessage = 'Correo o contraseña incorrectos.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Formato de correo no válido.';
      } else if (err.code === 'auth/too-many-requests') {
        friendlyMessage = 'Demasiados intentos. Intenta más tarde.';
      }
      console.error("Login Error:", err.code, err.message);
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    if (!resetEmail) {
      setError("Ingresa tu correo para restablecer la contraseña."); return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setMessage(`Enlace de restablecimiento enviado a ${resetEmail}. Revisa tu correo (incluyendo spam).`);
      setShowPasswordReset(false);
      setResetEmail('');
    } catch (err) {
      let friendlyMessage = 'No se pudo enviar el correo.';
      if (err.code === 'auth/user-not-found') {
        friendlyMessage = 'Correo no registrado.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Formato de correo no válido.';
      }
      console.error("Password Reset Error:", err.code, err.message);
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const commonInputClasses = "w-full pl-10 pr-4 py-3 border rounded-md focus:outline-none transition-all duration-150 text-text-dark dark:text-text-light placeholder-text-muted-light dark:placeholder-text-muted-dark";
  const lightModeInput = "border-ui-border-light focus:ring-2 focus:ring-secondary focus:border-secondary bg-background-light";
  const darkModeInput = "dark:border-ui-border-dark dark:focus:ring-secondary dark:focus:border-secondary dark:bg-primary-light/10";
  
  const buttonPrimaryClasses = "w-full flex justify-center items-center gap-2 bg-secondary text-renatto-dark font-semibold py-3 px-4 rounded-md hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary dark:focus:ring-offset-form-bg-dark transition-all duration-150 disabled:opacity-70 shadow-lg hover:shadow-yellow-glow";

  if (showPasswordReset) {
    return (
      <div className="bg-form-bg-light dark:bg-form-bg-dark p-8 rounded-xl shadow-2xl w-full max-w-md border border-ui-border-light dark:border-ui-border-dark animate-slide-in-up">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-br from-secondary to-accent p-3 rounded-full shadow-lg animate-subtle-pulse">
            <FiHelpCircle className="text-renatto-dark text-3xl" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-3 text-center text-text-dark dark:text-text-light">
          Recuperar Contraseña
        </h2>
        <p className="text-center text-text-muted-light dark:text-text-muted-dark mb-6 text-sm">
          Enviaremos un enlace a tu correo.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700/50 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
            <FiAlertTriangle /> <span className="text-sm">{error}</span>
          </div>
        )}
        {message && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700/50 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-300">
             <FiCheckCircle /> <span className="text-sm">{message}</span>
          </div>
        )}

        <form onSubmit={handlePasswordReset} noValidate>
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <FiMail className="text-text-muted-light dark:text-text-muted-dark" />
              </div>
              <input
                type="email" id="resetEmail" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
                className={`${commonInputClasses} ${lightModeInput} ${darkModeInput}`}
                placeholder="tu@correo.com" required autoComplete="email"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className={buttonPrimaryClasses}>
            {loading ? <FiLoader className="animate-spin text-xl" /> : <FiSend className="text-xl" /> }
            Enviar Enlace
          </button>
        </form>
        <div className="mt-6 text-center">
          <button
            onClick={() => { setShowPasswordReset(false); setError(''); setMessage(''); }}
            className="text-sm font-medium text-secondary hover:text-secondary-dark dark:text-secondary dark:hover:opacity-80 focus:outline-none transition-colors"
          >
            &larr; Volver a Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-form-bg-light dark:bg-form-bg-dark p-8 rounded-xl shadow-2xl w-full max-w-md border border-ui-border-light dark:border-ui-border-dark animate-slide-in-up">
      <div className="flex justify-center mb-6">
        <div className="bg-gradient-to-br from-secondary to-accent p-4 rounded-full shadow-lg animate-subtle-pulse">
          <FiLogIn className="text-renatto-dark text-3xl" />
        </div>
      </div>
      
      <h2 className="text-3xl font-bold mb-2 text-center text-text-dark dark:text-text-light">
        Bienvenido
      </h2>
      <p className="text-center text-text-muted-light dark:text-text-muted-dark mb-8">
        Ingresa tus credenciales.
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700/50 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
          <FiAlertTriangle /> <span className="text-sm">{error}</span>
        </div>
      )}
       {message && !error && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700/50 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-300">
             <FiCheckCircle /> <span className="text-sm">{message}</span>
          </div>
        )}

      <form onSubmit={handleLogin} noValidate>
        <div className="mb-6">
          <label htmlFor="email" className="block text-sm font-medium text-text-dark dark:text-text-light mb-1.5">Correo Electrónico</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <FiMail className="text-text-muted-light dark:text-text-muted-dark" />
            </div>
            <input
              type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className={`${commonInputClasses} ${lightModeInput} ${darkModeInput}`}
              placeholder="tu@correo.com" required autoComplete="email"
            />
          </div>
        </div>
        
        <div className="mb-4">
           <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-text-dark dark:text-text-light">Contraseña</label>
            <button
                type="button"
                onClick={() => { setShowPasswordReset(true); setError(''); setMessage(''); }}
                className="text-xs font-medium text-secondary hover:text-secondary-dark dark:text-secondary dark:hover:opacity-80 focus:outline-none transition-colors"
            >
                ¿Olvidaste tu contraseña?
            </button>
           </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <FiLock className="text-text-muted-light dark:text-text-muted-dark" />
            </div>
            <input
              type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className={`${commonInputClasses} ${lightModeInput} ${darkModeInput}`}
              placeholder="••••••••" required autoComplete="current-password"
            />
          </div>
        </div>

        <div className="mt-8">
          <button type="submit" disabled={loading} className={buttonPrimaryClasses}>
            {loading ? ( <><FiLoader className="animate-spin text-xl" /> Ingresando...</> ) : ( <><FiLogIn className="text-xl" /> Iniciar Sesión</> )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;