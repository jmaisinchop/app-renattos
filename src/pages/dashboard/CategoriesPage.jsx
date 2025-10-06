// src/pages/dashboard/CategoriesPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db, auth } from '../../firebase/config'; // Ajusta la ruta
import { 
  collection, addDoc, query, onSnapshot, doc, updateDoc, deleteDoc,
  orderBy, serverTimestamp, where, getDocs
} from "firebase/firestore";
import { FiTag, FiPlusCircle, FiEdit3, FiTrash2, FiLoader, FiCheckCircle, FiAlertCircle, FiX, FiSave } from 'react-icons/fi';

// Componente de Formulario de Categoría (puede ser movido a components/dashboard si se reutiliza)
const CategoryForm = ({ onSubmit, initialData, isLoading, onCancel }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    setName(initialData ? initialData.name : '');
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("El nombre de la categoría no puede estar vacío.");
      return;
    }
    await onSubmit({ name: name.trim() });
    if (!initialData) setName('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 mb-6 bg-neutral-50 dark:bg-primary-light/10 rounded-lg shadow-md border border-ui-border-light dark:border-ui-border-dark space-y-3 animate-slide-in-up">
      <h4 className="text-md font-semibold text-text-dark dark:text-text-light">
        {initialData ? '✏️ Editar Categoría' : '➕ Nueva Categoría'}
      </h4>
      <div>
        <label htmlFor="categoryName" className="sr-only">Nombre de Categoría</label>
        <input
          type="text"
          id="categoryName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Línea Blanca, Electrónicos"
          required
          className="w-full px-3 py-2 border border-ui-border-light dark:border-ui-border-dark rounded-md focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary bg-background-light dark:bg-form-bg-dark text-text-dark dark:text-text-light"
        />
      </div>
      <div className="flex justify-end gap-2">
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

const CategoriesPage = () => {
  const currentUser = auth.currentUser;
  const [categories, setCategories] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(false); // Un solo 'loading' para todas las ops de categoría
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const categoriesCollectionRef = useMemo(() => collection(db, "categories"), []);

  const clearMessages = useCallback(() => {
    setError(''); setSuccess('');
  }, []);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(clearMessages, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, success, clearMessages]);

  useEffect(() => {
    setLoading(true);
    const q = query(categoriesCollectionRef, orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setCategories(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setLoading(false);
    }, (err) => {
      console.error("Error cargando categorías:", err);
      setError("No se pudieron cargar las categorías.");
      setLoading(false);
    });
    return () => unsubscribe();
  }, [categoriesCollectionRef]);

  const handleSaveCategory = async (categoryData) => {
    clearMessages(); setLoading(true);
    const categoryNameLower = categoryData.name.toLowerCase();
    const q = query(categoriesCollectionRef, where("nameLower", "==", categoryNameLower));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty && (!editingCategory || querySnapshot.docs[0].id !== editingCategory.id)) {
      setError(`La categoría "${categoryData.name}" ya existe.`);
      setLoading(false); return;
    }

    try {
      if (editingCategory) {
        await updateDoc(doc(db, "categories", editingCategory.id), { 
          name: categoryData.name, nameLower: categoryNameLower, updatedAt: serverTimestamp() 
        });
        setSuccess("Categoría actualizada.");
      } else {
        await addDoc(categoriesCollectionRef, { 
          name: categoryData.name, nameLower: categoryNameLower, createdAt: serverTimestamp(), userId: currentUser.uid 
        });
        setSuccess("Categoría agregada.");
      }
      setIsFormVisible(false); setEditingCategory(null);
    } catch (err) {
      console.error("Error guardando categoría:", err);
      setError("Error al guardar la categoría.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    clearMessages();
    if (window.confirm(`¿Eliminar categoría "${categoryName}"? Asegúrate de que no esté en uso.`)) {
      setLoading(true);
      try {
        const productsQuery = query(collection(db, "products"), where("categoriaId", "==", categoryId));
        const productsSnapshot = await getDocs(productsQuery);
        if (!productsSnapshot.empty) {
          setError(`"${categoryName}" está asignada a ${productsSnapshot.size} producto(s) y no puede eliminarse.`);
          setLoading(false); return;
        }
        await deleteDoc(doc(db, "categories", categoryId));
        setSuccess("Categoría eliminada.");
      } catch (err) {
        console.error("Error eliminando categoría:", err);
        setError("Error al eliminar la categoría.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-semibold text-text-dark dark:text-text-light flex items-center gap-3">
          <FiTag className="text-accent" /> Gestión de Categorías
        </h2>
        <button
          onClick={() => { 
            setEditingCategory(null); setIsFormVisible(!isFormVisible); clearMessages();
          }}
          className="mt-3 sm:mt-0 flex items-center gap-1.5 px-4 py-2 text-sm bg-secondary text-renatto-dark font-semibold rounded-md hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-secondary dark:focus:ring-offset-background-dark transition-all shadow hover:shadow-md"
        >
          {isFormVisible && !editingCategory ? <FiX /> : <FiPlusCircle />}
          {isFormVisible && !editingCategory ? 'Cerrar Formulario' : 'Nueva Categoría'}
        </button>
      </div>

      {error && (
        <div className="my-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700/50 rounded-md flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
          <FiAlertCircle /> <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="my-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700/50 rounded-md flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
          <FiCheckCircle /> <span>{success}</span>
        </div>
      )}

      {isFormVisible && !editingCategory && (
        <CategoryForm onSubmit={handleSaveCategory} isLoading={loading} onCancel={() => setIsFormVisible(false)} />
      )}
      {editingCategory && (
        <CategoryForm onSubmit={handleSaveCategory} initialData={editingCategory} isLoading={loading} onCancel={() => { setEditingCategory(null); setIsFormVisible(false); }} />
      )}

      <div className="bg-form-bg-light dark:bg-form-bg-dark p-4 sm:p-6 rounded-xl shadow-lg border border-ui-border-light dark:border-ui-border-dark mt-6">
        {loading && categories.length === 0 && <div className="text-center py-4"><FiLoader className="animate-spin text-2xl text-secondary mx-auto" /></div>}
        {!loading && categories.length === 0 && (
            <div className="text-center py-6 text-text-muted-light dark:text-text-muted-dark">
                 <FiTag size={36} className="mx-auto mb-2 opacity-50"/>
                <p>No hay categorías registradas.</p>
            </div>
        )}
        
        {categories.length > 0 && (
          <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {categories.map(cat => (
              <li key={cat.id} className="flex justify-between items-center p-3 bg-neutral-100 dark:bg-primary-light/10 rounded-lg text-sm hover:shadow-md transition-shadow">
                <span className="text-text-dark dark:text-text-light font-medium">{cat.name}</span>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingCategory(cat); setIsFormVisible(true); clearMessages(); window.scrollTo({ top: 0, behavior: 'smooth' });}} className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors" title="Editar" disabled={loading}><FiEdit3 size={16}/></button>
                  <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors" title="Eliminar" disabled={loading}><FiTrash2 size={16}/></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;