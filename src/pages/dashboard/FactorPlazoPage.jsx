// src/pages/dashboard/FactorPlazoPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db, auth } from '../../firebase/config'; // Ajusta la ruta si es necesario
import { 
  collection, addDoc, query, onSnapshot, doc, updateDoc, deleteDoc,
  orderBy, serverTimestamp, where, getDocs
} from "firebase/firestore";
import { 
  FiClock, FiPlusCircle, FiEdit3, FiTrash2, FiLoader, FiCheckCircle, 
  FiAlertCircle, FiX, FiSave, FiCalendar, FiPercent, FiTrendingUp, FiGift // Icono para "última cuota gratis"
} from 'react-icons/fi';

// --- Componente FactorPlazoForm ---
const FactorPlazoForm = ({ onSubmit, initialData, isLoading, onCancel }) => {
  const [formData, setFormData] = useState({
    cantidadMes: '',
    factorPlazo: '',
    factorTasa: '',
    ultimaCuotaGratis: false // Nuevo campo
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        cantidadMes: initialData.cantidadMes || '',
        factorPlazo: initialData.factorPlazo || '',
        factorTasa: initialData.factorTasa || '',
        ultimaCuotaGratis: initialData.ultimaCuotaGratis || false // Cargar dato existente
      });
    } else {
      setFormData({ cantidadMes: '', factorPlazo: '', factorTasa: '', ultimaCuotaGratis: false });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = value;

    if (type === "checkbox") { // Manejar el checkbox
        processedValue = checked;
    } else if (name === "cantidadMes") {
        processedValue = value.replace(/[^0-9]/g, ''); 
    } else { // factorPlazo y factorTasa
        processedValue = value.replace(/[^0-9.]/g, '');
        const parts = processedValue.split('.');
        if (parts.length > 2) {
            processedValue = parts[0] + '.' + parts.slice(1).join('');
        }
    }
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };
  
  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (value.trim() !== '' && name !== "cantidadMes" && name !== "ultimaCuotaGratis") { 
        setFormData(prev => ({...prev, [name]: value })); 
    } else if (name === "cantidadMes" && value.trim() !== ''){
         setFormData(prev => ({...prev, [name]: value }));
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { cantidadMes, factorPlazo, factorTasa, ultimaCuotaGratis } = formData; // Incluir nuevo campo

    if (String(cantidadMes).trim() === '' || String(factorPlazo).trim() === '' || String(factorTasa).trim() === '') {
      alert("Los campos Cantidad de Meses, Factor Plazo y Factor Tasa son obligatorios.");
      return;
    }

    const numCantidadMes = parseInt(cantidadMes, 10);
    const numFactorPlazo = parseFloat(factorPlazo);
    const numFactorTasa = parseFloat(factorTasa);

    if (isNaN(numCantidadMes) || numCantidadMes <= 0 || 
        isNaN(numFactorPlazo) || numFactorPlazo < 0 || 
        isNaN(numFactorTasa) || numFactorTasa < 0) {
        alert("Por favor, ingresa números válidos. Cantidad de meses debe ser mayor a 0. Factores no pueden ser negativos.");
        return;
    }
    
    await onSubmit({ 
        cantidadMes: numCantidadMes, 
        factorPlazo: numFactorPlazo, 
        factorTasa: numFactorTasa,
        ultimaCuotaGratis: ultimaCuotaGratis // Enviar nuevo campo
    });

    if (!initialData) { // Resetear solo si es un nuevo factor
        setFormData({ cantidadMes: '', factorPlazo: '', factorTasa: '', ultimaCuotaGratis: false });
    }
  };
  
  const inputBaseClasses = "w-full px-3 py-2 border rounded-md focus:outline-none transition-all duration-150 text-text-dark dark:text-text-light placeholder-text-muted-light dark:placeholder-text-muted-dark";
  const inputLightMode = "border-ui-border-light focus:ring-2 focus:ring-secondary focus:border-secondary bg-background-light";
  const inputDarkMode = "dark:border-ui-border-dark dark:focus:ring-secondary dark:focus:border-secondary dark:bg-primary-light/10";

  return (
    <form onSubmit={handleSubmit} className="p-4 mb-6 bg-neutral-50 dark:bg-primary-light/10 rounded-lg shadow-md border border-ui-border-light dark:border-ui-border-dark space-y-4 animate-slide-in-up">
      <h4 className="text-md font-semibold text-text-dark dark:text-text-light">
        {initialData ? '✏️ Editar Factor Plazo' : '➕ Nuevo Factor Plazo'}
      </h4>
      <div>
        <label htmlFor="cantidadMes" className="block text-xs font-medium text-text-muted-light dark:text-text-muted-dark mb-1">Cantidad de Meses*</label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiCalendar className="text-text-muted-light dark:text-text-muted-dark"/></div>
            <input type="text" inputMode="numeric" name="cantidadMes" id="cantidadMes" value={formData.cantidadMes} onChange={handleChange} onBlur={handleBlur} required className={`${inputBaseClasses} ${inputLightMode} ${inputDarkMode} pl-9`} placeholder="Ej: 12"/>
        </div>
      </div>
      <div>
        <label htmlFor="factorPlazo" className="block text-xs font-medium text-text-muted-light dark:text-text-muted-dark mb-1">Factor Plazo* (Ej: 0.15 o 1.25432)</label>
         <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiTrendingUp className="text-text-muted-light dark:text-text-muted-dark"/></div>
            <input type="text" inputMode="decimal" name="factorPlazo" id="factorPlazo" value={formData.factorPlazo} onChange={handleChange} onBlur={handleBlur} required className={`${inputBaseClasses} ${inputLightMode} ${inputDarkMode} pl-9`} placeholder="Ej: 1.25"/>
        </div>
      </div>
      <div>
        <label htmlFor="factorTasa" className="block text-xs font-medium text-text-muted-light dark:text-text-muted-dark mb-1">Factor Tasa* (Ej: 0.025 o 0.00123)</label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiPercent className="text-text-muted-light dark:text-text-muted-dark"/></div>
            <input type="text" inputMode="decimal" name="factorTasa" id="factorTasa" value={formData.factorTasa} onChange={handleChange} onBlur={handleBlur} required className={`${inputBaseClasses} ${inputLightMode} ${inputDarkMode} pl-9`} placeholder="Ej: 0.05"/>
        </div>
      </div>

      {/* Nuevo campo para "Última Cuota Gratis" */}
      <div className="flex items-center gap-2 pt-1">
        <input 
            type="checkbox" 
            name="ultimaCuotaGratis" 
            id="ultimaCuotaGratis" 
            checked={formData.ultimaCuotaGratis} 
            onChange={handleChange} 
            className="h-4 w-4 text-accent rounded border-gray-300 focus:ring-accent"
        />
        <label htmlFor="ultimaCuotaGratis" className="text-xs font-medium text-text-muted-light dark:text-text-muted-dark">
            ¿Última cuota es gratis? <FiGift className="inline mb-0.5"/>
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
            <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs rounded-md text-text-muted-light dark:text-text-muted-dark hover:bg-neutral-200 dark:hover:bg-primary-light/20 transition-colors" disabled={isLoading}>
                Cancelar
            </button>
        )}
        <button type="submit" disabled={isLoading} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-accent text-primary font-semibold rounded-md hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent dark:focus:ring-offset-form-bg-dark transition-colors disabled:opacity-70">
          {isLoading ? <FiLoader className="animate-spin" /> : (initialData ? <FiSave /> : <FiPlusCircle />)}
          {initialData ? 'Guardar' : 'Agregar'}
        </button>
      </div>
    </form>
  );
};

// --- Componente Principal de la Página ---
const FactorPlazoPage = () => {
  const currentUser = auth.currentUser;
  const [factores, setFactores] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingFactor, setEditingFactor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const factoresCollectionRef = useMemo(() => collection(db, "factorPlazos"), []);

  const clearMessages = useCallback(() => { setError(''); setSuccess(''); }, []);
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(clearMessages, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, success, clearMessages]);

  useEffect(() => {
    setLoading(true);
    const q = query(factoresCollectionRef, orderBy("cantidadMes", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setFactores(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setLoading(false);
    }, (err) => {
      console.error("Error cargando factores:", err);
      setError("No se pudieron cargar los factores de plazo.");
      setLoading(false);
    });
    return () => unsubscribe();
  }, [factoresCollectionRef]);

  const handleSaveFactor = async (factorData) => { // factorData ya incluye ultimaCuotaGratis
    clearMessages(); setLoading(true);
    
    const q = query(factoresCollectionRef, where("cantidadMes", "==", factorData.cantidadMes));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty && (!editingFactor || querySnapshot.docs[0].id !== editingFactor.id)) {
        setError(`Ya existe un factor para ${factorData.cantidadMes} mes(es).`);
        setLoading(false); return;
    }

    try {
      if (editingFactor) {
        await updateDoc(doc(db, "factorPlazos", editingFactor.id), { 
          ...factorData, // factorData ya tiene todos los campos, incluido ultimaCuotaGratis
          updatedAt: serverTimestamp() 
        });
        setSuccess("Factor Plazo actualizado.");
      } else {
        await addDoc(factoresCollectionRef, { 
          ...factorData, // factorData ya tiene todos los campos
          createdAt: serverTimestamp(), 
          userId: currentUser.uid 
        });
        setSuccess("Factor Plazo agregado.");
      }
      setIsFormVisible(false); setEditingFactor(null);
    } catch (err) {
      console.error("Error guardando factor:", err);
      setError("Error al guardar el Factor Plazo.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFactor = async (factorId, factorMeses) => {
    clearMessages();
    if (window.confirm(`¿Eliminar factor para ${factorMeses} mes(es)?`)) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, "factorPlazos", factorId));
        setSuccess("Factor Plazo eliminado.");
      } catch (err) {
        console.error("Error eliminando factor:", err);
        setError("Error al eliminar el Factor Plazo.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-semibold text-text-dark dark:text-text-light flex items-center gap-3">
          <FiClock className="text-accent" /> Gestión de Factor Plazo
        </h2>
        <button
          onClick={() => { 
            setEditingFactor(null); 
            // Al abrir para nuevo, asegurarse que el form se resetee a valores por defecto (incluyendo ultimaCuotaGratis: false)
            // El useEffect en FactorPlazoForm maneja esto cuando initialData es null.
            setIsFormVisible(!isFormVisible); 
            clearMessages();
          }}
          className="mt-3 sm:mt-0 flex items-center gap-1.5 px-4 py-2 text-sm bg-secondary text-renatto-dark font-semibold rounded-md hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-secondary dark:focus:ring-offset-background-dark transition-all shadow hover:shadow-md"
        >
          {isFormVisible && !editingFactor ? <FiX /> : <FiPlusCircle />}
          {isFormVisible && !editingFactor ? 'Cerrar Formulario' : 'Nuevo Factor'}
        </button>
      </div>

      {error && <div className="my-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700/50 rounded-md flex items-center gap-2 text-sm text-red-700 dark:text-red-300"><FiAlertCircle /> <span>{error}</span></div>}
      {success && <div className="my-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700/50 rounded-md flex items-center gap-2 text-sm text-green-700 dark:text-green-300"><FiCheckCircle /> <span>{success}</span></div>}

      {isFormVisible && !editingFactor && (
        <FactorPlazoForm onSubmit={handleSaveFactor} isLoading={loading} onCancel={() => setIsFormVisible(false)} />
      )}
      {editingFactor && (
        <FactorPlazoForm onSubmit={handleSaveFactor} initialData={editingFactor} isLoading={loading} onCancel={() => { setEditingFactor(null); setIsFormVisible(false); }} />
      )}

      <div className="bg-form-bg-light dark:bg-form-bg-dark p-4 sm:p-6 rounded-xl shadow-lg border border-ui-border-light dark:border-ui-border-dark mt-6">
        {loading && factores.length === 0 && <div className="text-center py-4"><FiLoader className="animate-spin text-2xl text-secondary mx-auto" /></div>}
        {!loading && factores.length === 0 && (
            <div className="text-center py-6 text-text-muted-light dark:text-text-muted-dark">
                <FiClock size={36} className="mx-auto mb-2 opacity-50"/>
              <p>No hay factores de plazo registrados.</p>
            </div>
        )}
        
        {factores.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm text-left">
              <thead className="text-xs uppercase bg-neutral-100 dark:bg-primary-light/20 text-text-muted-light dark:text-text-muted-dark">
                <tr>
                  <th scope="col" className="px-4 py-3 text-center">Meses</th>
                  <th scope="col" className="px-4 py-3 text-right">Factor Plazo</th>
                  <th scope="col" className="px-4 py-3 text-right">Factor Tasa</th>
                  <th scope="col" className="px-4 py-3 text-center">Última Cuota Gratis</th> {/* Nueva columna */}
                  <th scope="col" className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-text-dark dark:text-text-light">
                {factores.map(f => (
                  <tr key={f.id} className="border-b border-ui-border-light dark:border-ui-border-dark hover:bg-neutral-50 dark:hover:bg-primary-light/5 transition-colors">
                    <td className="px-4 py-3 font-medium text-center">{f.cantidadMes}</td>
                    <td className="px-4 py-3 text-right">
                      {(typeof f.factorPlazo === 'number' ? f.factorPlazo : 0).toLocaleString(undefined, { 
                        minimumFractionDigits: 0, 
                        maximumFractionDigits: 5  
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(typeof f.factorTasa === 'number' ? f.factorTasa : 0).toLocaleString(undefined, { 
                        minimumFractionDigits: 0, 
                        maximumFractionDigits: 5 
                      })}
                    </td>
                    <td className="px-4 py-3 text-center"> {/* Mostrar valor del nuevo campo */}
                      {f.ultimaCuotaGratis ? <FiGift className="text-green-500 mx-auto" title="Sí"/> : <span className="text-text-muted-light dark:text-text-muted-dark">-</span>}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button onClick={() => { setEditingFactor(f); setIsFormVisible(true); clearMessages(); window.scrollTo({ top: 0, behavior: 'smooth' });}} className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md mr-1.5 transition-colors" title="Editar Factor" disabled={loading}><FiEdit3 size={16}/></button>
                      <button onClick={() => handleDeleteFactor(f.id, f.cantidadMes)} className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors" title="Eliminar Factor" disabled={loading}><FiTrash2 size={16}/></button>
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

export default FactorPlazoPage;