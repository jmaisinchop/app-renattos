// src/pages/dashboard/ClientsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { auth, db } from '../../firebase/config'; // Ajusta esta ruta si es necesario
import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  orderBy,
  serverTimestamp 
} from "firebase/firestore";
import { FiUserPlus, FiEdit, FiTrash2, FiUsers, FiCheckCircle, FiAlertCircle, FiLoader, FiSave, FiX } from 'react-icons/fi';

// Componente de Formulario de Cliente
const ClientForm = ({ onSubmit, initialData, isLoading, onCancel, formTitle, submitButtonText }) => {
  const [formData, setFormData] = useState({
    identificacion: '',
    nombres: '',
    apellidos: '',
    direccion: '',
    telefono: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        identificacion: initialData.identificacion || '',
        nombres: initialData.nombres || '',
        apellidos: initialData.apellidos || '',
        direccion: initialData.direccion || '',
        telefono: initialData.telefono || ''
      });
    } else {
      setFormData({ identificacion: '', nombres: '', apellidos: '', direccion: '', telefono: '' });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validación básica
    if (!formData.identificacion || !formData.nombres || !formData.apellidos) {
        // Podrías pasar una función setError al formulario para manejar errores de validación aquí
        alert("Identificación, Nombres y Apellidos son obligatorios.");
        return;
    }
    onSubmit(formData);
  };
  
  const inputBaseClasses = "w-full px-4 py-2.5 border rounded-md focus:outline-none transition-all duration-150 text-text-dark dark:text-text-light placeholder-text-muted-light dark:placeholder-text-muted-dark";
  const inputLightMode = "border-ui-border-light focus:ring-2 focus:ring-secondary focus:border-secondary bg-background-light";
  const inputDarkMode = "dark:border-ui-border-dark dark:focus:ring-secondary dark:focus:border-secondary dark:bg-primary-light/10";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-6 bg-form-bg-light dark:bg-form-bg-dark rounded-lg shadow-xl border border-ui-border-light dark:border-ui-border-dark">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-text-dark dark:text-text-light">{formTitle}</h3>
        {onCancel && (
            <button type="button" onClick={onCancel} className="p-1 text-text-muted-light dark:text-text-muted-dark hover:text-secondary dark:hover:text-secondary-dark">
                <FiX size={20}/>
            </button>
        )}
      </div>
      <div>
        <label htmlFor="identificacion" className="block text-sm font-medium text-text-dark dark:text-text-light mb-1">Identificación*</label>
        <input type="text" name="identificacion" id="identificacion" value={formData.identificacion} onChange={handleChange} required className={`${inputBaseClasses} ${inputLightMode} ${inputDarkMode}`} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="nombres" className="block text-sm font-medium text-text-dark dark:text-text-light mb-1">Nombres*</label>
          <input type="text" name="nombres" id="nombres" value={formData.nombres} onChange={handleChange} required className={`${inputBaseClasses} ${inputLightMode} ${inputDarkMode}`} />
        </div>
        <div>
          <label htmlFor="apellidos" className="block text-sm font-medium text-text-dark dark:text-text-light mb-1">Apellidos*</label>
          <input type="text" name="apellidos" id="apellidos" value={formData.apellidos} onChange={handleChange} required className={`${inputBaseClasses} ${inputLightMode} ${inputDarkMode}`} />
        </div>
      </div>
      <div>
        <label htmlFor="direccion" className="block text-sm font-medium text-text-dark dark:text-text-light mb-1">Dirección</label>
        <input type="text" name="direccion" id="direccion" value={formData.direccion} onChange={handleChange} className={`${inputBaseClasses} ${inputLightMode} ${inputDarkMode}`} />
      </div>
      <div>
        <label htmlFor="telefono" className="block text-sm font-medium text-text-dark dark:text-text-light mb-1">Teléfono</label>
        <input type="tel" name="telefono" id="telefono" value={formData.telefono} onChange={handleChange} className={`${inputBaseClasses} ${inputLightMode} ${inputDarkMode}`} />
      </div>
      <div className="flex items-center justify-end gap-4 pt-3">
        {onCancel && (
            <button type="button" onClick={onCancel} disabled={isLoading} className="px-5 py-2 rounded-md text-sm font-medium text-text-muted-light dark:text-text-muted-dark hover:bg-neutral-100 dark:hover:bg-primary-light/20 transition-colors">
                Cancelar
            </button>
        )}
        <button type="submit" disabled={isLoading} className="flex items-center justify-center gap-2 px-5 py-2 bg-secondary text-renatto-dark font-semibold rounded-md hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary dark:focus:ring-offset-form-bg-dark transition-all shadow-md hover:shadow-yellow-glow disabled:opacity-70">
          {isLoading ? <FiLoader className="animate-spin" /> : (initialData ? <FiSave/> : <FiUserPlus />)}
          {submitButtonText}
        </button>
      </div>
    </form>
  );
};


const ClientsPage = ({ user }) => {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Para carga de lista y operaciones
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const clientsCollectionRef = collection(db, "clients");

  useEffect(() => {
    setIsLoading(true);
    const q = query(clientsCollectionRef, orderBy("nombres", "asc")); 
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const clientsData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setClients(clientsData);
      setIsLoading(false);
    }, (err) => {
      console.error("Error al obtener clientes:", err);
      setError("No se pudieron cargar los clientes.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearMessages = useCallback(() => {
    setError('');
    setSuccessMessage('');
  }, []);

  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        clearMessages();
      }, 5000); // Los mensajes desaparecen después de 5 segundos
      return () => clearTimeout(timer);
    }
  }, [error, successMessage, clearMessages]);


  const handleSaveClient = async (clientData) => {
    clearMessages();
    setIsLoading(true);
    try {
      if (editingClient) {
        const clientDoc = doc(db, "clients", editingClient.id);
        await updateDoc(clientDoc, { ...clientData, updatedAt: serverTimestamp() });
        setSuccessMessage("Cliente actualizado con éxito.");
      } else {
        await addDoc(clientsCollectionRef, { ...clientData, createdAt: serverTimestamp(), userId: user.uid });
        setSuccessMessage("Cliente agregado con éxito.");
      }
      setIsFormVisible(false);
      setEditingClient(null);
    } catch (err) {
      console.error("Error guardando cliente:", err);
      setError(`Error al guardar el cliente: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClient = (client) => {
    clearMessages();
    setEditingClient(client);
    setIsFormVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll al formulario
  };

  const handleDeleteClient = async (clientId) => {
    clearMessages();
    if (window.confirm("¿Estás seguro de que quieres eliminar este cliente? Esta acción no se puede deshacer.")) {
      setIsLoading(true);
      try {
        const clientDoc = doc(db, "clients", clientId);
        await deleteDoc(clientDoc);
        setSuccessMessage("Cliente eliminado con éxito.");
      } catch (err) {
        console.error("Error eliminando cliente:", err);
        setError("Error al eliminar el cliente.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const openNewClientForm = () => {
    clearMessages();
    setEditingClient(null);
    setIsFormVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll al formulario
  };
  
  const closeClientForm = () => {
    setIsFormVisible(false);
    setEditingClient(null);
    clearMessages();
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-semibold text-text-dark dark:text-text-light flex items-center gap-3">
          <FiUsers className="text-secondary" /> Gestión de Clientes
        </h2>
        {!isFormVisible && (
            <button
                onClick={openNewClientForm}
                className="mt-4 sm:mt-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-secondary text-renatto-dark font-semibold rounded-md hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary dark:focus:ring-offset-background-dark transition-all shadow-lg hover:shadow-yellow-glow disabled:opacity-70"
            >
                <FiUserPlus size={18} /> Nuevo Cliente
            </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-3.5 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700/50 rounded-lg flex items-center gap-3 text-sm text-red-700 dark:text-red-300">
          <FiAlertCircle size={18} /> <span>{error}</span>
        </div>
      )}
      {successMessage && (
        <div className="mb-6 p-3.5 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700/50 rounded-lg flex items-center gap-3 text-sm text-green-700 dark:text-green-300">
          <FiCheckCircle size={18} /> <span>{successMessage}</span>
        </div>
      )}

      {isFormVisible && (
        <div className="mb-8 sm:mb-10 animate-slide-in-up">
          <ClientForm 
            onSubmit={handleSaveClient}
            initialData={editingClient}
            isLoading={isLoading}
            onCancel={closeClientForm}
            formTitle={editingClient ? "✏️ Editar Cliente" : "➕ Registrar Nuevo Cliente"}
            submitButtonText={editingClient ? "Guardar Cambios" : "Agregar Cliente"}
          />
        </div>
      )}

      <div className="bg-form-bg-light dark:bg-form-bg-dark p-4 sm:p-6 rounded-lg shadow-xl border border-ui-border-light dark:border-ui-border-dark">
        <h3 className="text-xl font-semibold mb-5 text-text-dark dark:text-text-light">
          Lista de Clientes ({clients.length})
        </h3>
        {(isLoading && clients.length === 0) && 
            <div className="flex flex-col items-center justify-center py-10 text-text-muted-light dark:text-text-muted-dark">
                <FiLoader className="animate-spin text-3xl sm:text-4xl text-secondary mb-3" /> 
                <p>Cargando clientes...</p>
            </div>
        }
        {(!isLoading && clients.length === 0) && 
            <div className="text-center py-10 text-text-muted-light dark:text-text-muted-dark">
                <FiUsers size={40} className="mx-auto mb-3"/>
                <p>No hay clientes registrados todavía.</p>
                <p className="text-sm">Utiliza el botón "Nuevo Cliente" para agregar el primero.</p>
            </div>
        }
        
        {clients.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[768px] text-sm text-left text-text-dark dark:text-text-light">
              <thead className="text-xs uppercase bg-neutral-100 dark:bg-primary-light/20 text-text-muted-light dark:text-text-muted-dark">
                <tr>
                  <th scope="col" className="px-4 py-3">Identificación</th>
                  <th scope="col" className="px-4 py-3">Nombre Completo</th>
                  <th scope="col" className="px-4 py-3 hidden md:table-cell">Dirección</th>
                  <th scope="col" className="px-4 py-3 hidden sm:table-cell">Teléfono</th>
                  <th scope="col" className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(client => (
                  <tr key={client.id} className="border-b border-ui-border-light dark:border-ui-border-dark hover:bg-neutral-50 dark:hover:bg-primary-light/5 transition-colors">
                    <td className="px-4 py-3 font-medium">{client.identificacion}</td>
                    <td className="px-4 py-3">{client.nombres} {client.apellidos}</td>
                    <td className="px-4 py-3 hidden md:table-cell max-w-xs truncate" title={client.direccion}>{client.direccion || '-'}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{client.telefono || '-'}</td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button 
                        onClick={() => handleEditClient(client)} 
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-md mr-1.5 transition-colors" 
                        title="Editar Cliente"
                        disabled={isLoading}
                      >
                        <FiEdit size={16}/>
                      </button>
                      <button 
                        onClick={() => handleDeleteClient(client.id)} 
                        className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-md transition-colors" 
                        title="Eliminar Cliente"
                        disabled={isLoading}
                      >
                        <FiTrash2 size={16}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientsPage;