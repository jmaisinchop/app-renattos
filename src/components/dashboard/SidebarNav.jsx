// src/components/dashboard/SidebarNav.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/config'; // Ajusta la ruta si es necesario
import { signOut } from 'firebase/auth';
import {
    FiHome,
    FiUsers,
    FiPackage,
    FiShoppingCart,
    FiSettings,
    FiLogOut,
    FiChevronLeft,
    FiX,
    FiBox,
    FiArchive,
    FiTag,
    FiClock,
    FiDollarSign,
    FiCheckSquare
} from 'react-icons/fi';

const SidebarNav = ({ user, isOpen, setIsOpen }) => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login'); // Redirige al login después de cerrar sesión
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };

    const navLinkClasses = ({ isActive }) =>
        `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ease-in-out group
    ${isActive
            ? 'bg-secondary text-renatto-dark shadow-md'
            : 'text-text-muted-dark hover:bg-primary-light/20 hover:text-text-light'
        }`;
    // Nota: 'group' se añadió aquí para posibles efectos de hover en los íconos hijos si se desea.

    return (
        <>
            {/* Overlay para móvil */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                ></div>
            )}

            <aside className={`
        fixed inset-y-0 left-0 z-40 lg:static lg:z-auto
        flex flex-col w-64 shrink-0 
        bg-primary dark:bg-primary text-text-light 
        border-r border-primary-light/10 dark:border-black/20 shadow-2xl
        transform transition-transform duration-300 ease-in-out 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 
      `}>
                <div className="flex items-center justify-between h-20 px-4 border-b border-primary-light/30 dark:border-black/30">
                    <NavLink to="/dashboard" className="flex items-center gap-2.5" onClick={() => setIsOpen(false)}>
                        <div className="p-1.5 bg-secondary rounded-md shadow">
                            <FiBox className="w-7 h-7 text-renatto-dark" /> {/* FiBox se usa aquí */}
                        </div>
                        <span className="text-xl font-bold text-renatto-white tracking-tight">Renatto's</span>
                    </NavLink>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="lg:hidden p-1 text-text-muted-dark hover:text-renatto-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-secondary rounded-md"
                        aria-label="Cerrar menú de navegación"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
                    <NavLink to="/dashboard" end className={navLinkClasses} onClick={() => setIsOpen(false)}>
                        <FiHome className="mr-3 w-5 h-5 shrink-0" /> Inicio
                    </NavLink>
                    <NavLink to="/dashboard/clients" className={navLinkClasses} onClick={() => setIsOpen(false)}>
                        <FiUsers className="mr-3 w-5 h-5 shrink-0" /> Clientes
                    </NavLink>
                    <NavLink to="/dashboard/sales" className={navLinkClasses} onClick={() => setIsOpen(false)}>
                        <FiDollarSign className="mr-3 w-5 h-5 shrink-0" /> Ventas {/* <--- NUEVO ENLACE */}
                    </NavLink>
                    <NavLink to="/dashboard/process-payments" className={navLinkClasses} onClick={() => setIsOpen(false)}>
                        <FiCheckSquare className="mr-3 w-5 h-5 shrink-0" /> Procesar Pagos
                    </NavLink>
                    <div className="pt-3 pb-1">
                        <h5 className="px-4 mb-1 text-xs font-semibold uppercase text-text-muted-dark/50 dark:text-text-muted-dark/40 tracking-wider">
                            Inventario
                        </h5>
                        <NavLink to="/dashboard/categories" className={navLinkClasses} onClick={() => setIsOpen(false)}>
                            <FiTag className="mr-3 w-5 h-5 shrink-0" /> Categorías
                        </NavLink>
                        <NavLink to="/dashboard/products" className={navLinkClasses} onClick={() => setIsOpen(false)}>
                            <FiPackage className="mr-3 w-5 h-5 shrink-0" /> Productos
                        </NavLink>
                    </div>
                    {/* Sección de Configuración/Finanzas */}
                    <div className="pt-3 pb-1">
                        <h5 className="px-4 mb-1 text-xs font-semibold uppercase text-text-muted-dark/50 dark:text-text-muted-dark/40 tracking-wider">
                            Configuración
                        </h5>
                        <NavLink to="/dashboard/factor-plazo" className={navLinkClasses} onClick={() => setIsOpen(false)}>
                            <FiClock className="mr-3 w-5 h-5 shrink-0" /> Factor Plazo
                        </NavLink>

                    </div>
                    {/* Más enlaces de módulos aquí */}
                </nav>

                <div className="px-3 py-5 mt-auto border-t border-primary-light/30 dark:border-black/30">
                    {/* Quité Settings de aquí para simplificar, puedes volverlo a poner si tienes la ruta y el componente */}
                    {/* <NavLink to="/dashboard/settings" className={navLinkClasses} onClick={() => setIsOpen(false)}>
            <FiSettings className="mr-3 w-5 h-5 shrink-0" /> Configuración
          </NavLink> */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-3 mt-1 text-sm font-medium rounded-lg text-text-muted-dark hover:bg-secondary/20 hover:text-secondary transition-colors group"
                    >
                        <FiLogOut className="mr-3 w-5 h-5 shrink-0" /> Cerrar Sesión
                    </button>
                    <p className="text-xs text-center text-text-muted-dark/60 mt-5 px-2">
                        &copy; {new Date().getFullYear()} Renatto's Almacenes
                    </p>
                </div>
            </aside>
        </>
    );
};

export default SidebarNav;