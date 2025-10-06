// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Inspirado en el logo de Renatto's Almacenes
        'renatto-dark': '#2D2D2D',
        'renatto-yellow': '#FBC02D',
        'renatto-beige': '#D7CCC8',
        'renatto-white': '#FFFFFF',
        
        // Paleta semántica para la aplicación
        primary: {
          DEFAULT: 'var(--color-renatto-dark)',
          light: '#4A4A4A', 
        },
        secondary: { // Amarillo
          DEFAULT: 'var(--color-renatto-yellow)',
          dark: '#F9A825', // Más oscuro para hover/variaciones
          light: '#FEF3C7',  // <--- NUEVO: Amarillo más claro (Tailwind amber-200)
          lighter: '#FFFBEB',// <--- NUEVO: Amarillo aún más claro (Tailwind amber-100)
          lightest: '#FFFCE5',// <--- NUEVO: Amarillo pálido (Tailwind amber-50)
        },
        accent: { // Beige
          DEFAULT: 'var(--color-renatto-beige)',
          dark: '#BCAAA4', 
          light: '#EFEBE9',  // <--- NUEVO: Beige más claro (Tailwind stone-100)
          lighter: '#F5F5F5',// <--- NUEVO: Beige aún más claro (Tailwind neutral-100)
        },
        
        // Fondos y Texto
        'background-light': 'var(--color-renatto-white)',
        'background-dark': '#1A1A1A', // Ajustado para ser ligeramente diferente de primary
        'text-light': 'var(--color-renatto-white)',
        'text-dark': 'var(--color-renatto-dark)',
        'text-muted-light': '#5E5E5E',
        'text-muted-dark': '#A0A0A0',

        // Colores para UI específica si es necesario
        'ui-border-light': '#E0E0E0', // Un gris neutro claro
        'ui-border-dark': '#424242',  // Un gris neutro oscuro
        'form-bg-light': 'var(--color-renatto-white)',
        'form-bg-dark': 'var(--color-renatto-dark)', 
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 7s ease-in-out infinite',
        'float-reverse': 'float-reverse 9s ease-in-out infinite',
        'subtle-pulse': 'subtle-pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in-up': 'slideInUp 0.6s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        float: { /* ... (sin cambios) ... */
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-25px) rotate(5deg)' },
        },
        'float-reverse': { /* ... (sin cambios) ... */
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(25px) rotate(-5deg)' },
        },
        'subtle-pulse': { /* ... (sin cambios) ... */
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '.8', transform: 'scale(1.03)' },
        },
        slideInUp: { /* ... (sin cambios) ... */
          'from': { transform: 'translateY(20px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: { /* ... (sin cambios) ... */
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        }
      },
      boxShadow: {
        'yellow-glow': '0 0 25px -5px rgba(251, 192, 45, 0.3), 0 0 15px -5px rgba(251, 192, 45, 0.2)',
        'dark-glow': '0 0 20px -5px rgba(45, 45, 45, 0.2)',
      },
      // --- NUEVAS ADICIONES ---
      animationDelay: { // Para clases como 'animation-delay-1000'
        '100': '100ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
        '600': '600ms',
        '700': '700ms',
        '1000': '1000ms',
        '2000': '2000ms', // Usado previamente
        '4000': '4000ms', // Usado previamente
      },
      textShadow: { // Para clases como 'text-shadow-sm', 'text-shadow-md'
        'sm': '0 1px 2px var(--tw-shadow-color, rgba(0,0,0,0.05))',
        'DEFAULT': '0 2px 4px var(--tw-shadow-color, rgba(0,0,0,0.1))',
        'md': '0 4px 8px var(--tw-shadow-color, rgba(0,0,0,0.15))',
        'lg': '0 10px 20px var(--tw-shadow-color, rgba(0,0,0,0.2))',
        'none': 'none',
      },
    },
  },
  plugins: [
    // --- PLUGIN PARA FORMULARIOS ---
    require('@tailwindcss/forms'), // <--- AÑADIR ESTA LÍNEA
    // --- Plugin para variables CSS de colores base ---
    function({ addBase, theme }) {
      addBase({
        ':root': {
          '--color-renatto-dark': theme('colors.renatto-dark'),
          '--color-renatto-yellow': theme('colors.renatto-yellow'),
          '--color-renatto-beige': theme('colors.renatto-beige'),
          '--color-renatto-white': theme('colors.renatto-white'),
          // Variables para los tonos claros de secondary (amarillo)
          '--color-renatto-yellow-light': theme('colors.secondary.light'),
          '--color-renatto-yellow-lighter': theme('colors.secondary.lighter'),
          '--color-renatto-yellow-lightest': theme('colors.secondary.lightest'),
          // Variables para los tonos claros de accent (beige)
          '--color-accent-light': theme('colors.accent.light'),
          '--color-accent-lighter': theme('colors.accent.lighter'),
        }
      })
    },
    // --- Plugin para text-shadow (opcional, si prefieres clases de utilidad) ---
    function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          'text-shadow': (value) => ({
            textShadow: value,
          }),
        },
        { values: theme('textShadow') }
      )
    },
  ],
}