// src/pages/dashboard/ProductsPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db, auth } from '../../firebase/config'; // Ajusta la ruta
import { 
  collection, addDoc, query, onSnapshot, doc, updateDoc, deleteDoc,
  orderBy, serverTimestamp 
} from "firebase/firestore";
import { 
  FiPackage, FiPlusCircle, FiEdit3, FiTrash2, FiLoader, FiCheckCircle, 
  FiAlertCircle, FiX, FiSave, FiDollarSign, FiArchive, FiPercent, FiTag,
  FiList // <--- AÑADE FiList AQUÍ
} from 'react-icons/fi';

// --- Componente ProductForm ---
const ProductForm = ({ onSubmit, initialData, isLoading, onCancel, categories }) => {
  const initialFormState = {
    codigo: '',
    descripcion: '',
    stock: 0,
    precioNeto: 0,
    porcentajeContado: 0, // Porcentaje, no el valor calculado
    porcentajeFinanciado: 0, // Porcentaje
    categoriaId: '',
    // Los precios calculados no son parte del estado directo del form, se calculan
  };
  const [formData, setFormData] = useState(initialFormState);
  const [precioContadoCalculado, setPrecioContadoCalculado] = useState(0);
  const [precioFinanciadoCalculado, setPrecioFinanciadoCalculado] = useState(0);

  useEffect(() => {
    if (initialData) {
      setFormData({
        codigo: initialData.codigo || '',
        descripcion: initialData.descripcion || '',
        stock: initialData.stock || 0,
        precioNeto: initialData.precioNeto || 0,
        porcentajeContado: initialData.porcentajeContado || 0,
        porcentajeFinanciado: initialData.porcentajeFinanciado || 0,
        categoriaId: initialData.categoriaId || '',
      });
    } else {
      setFormData(initialFormState);
    }
  }, [initialData]);

  // Efecto para calcular precios cuando cambian los valores base
  useEffect(() => {
    const neto = parseFloat(formData.precioNeto) || 0;
    const porcContado = parseFloat(formData.porcentajeContado) || 0;
    const porcFinanciado = parseFloat(formData.porcentajeFinanciado) || 0;

    setPrecioContadoCalculado(neto + (neto * porcContado / 100));
    setPrecioFinanciadoCalculado(neto + (neto * porcFinanciado / 100));
  }, [formData.precioNeto, formData.porcentajeContado, formData.porcentajeFinanciado]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'number' ? parseFloat(value) || 0 : value 
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.codigo || !formData.descripcion || !formData.categoriaId || formData.precioNeto <= 0) {
      alert("Código, Descripción, Categoría y Precio Neto (mayor a 0) son obligatorios.");
      return;
    }
    // Pasar los datos del formulario Y los precios calculados
    onSubmit({ 
      ...formData, 
      precioContadoCalculado: parseFloat(precioContadoCalculado.toFixed(2)), 
      precioFinanciadoCalculado: parseFloat(precioFinanciadoCalculado.toFixed(2))
    });
  };
  
  const inputBaseClasses = "w-full px-3 py-2 border rounded-md focus:outline-none transition-all duration-150 text-text-dark dark:text-text-light placeholder-text-muted-light dark:placeholder-text-muted-dark";
  const inputLightMode = "border-ui-border-light focus:ring-2 focus:ring-secondary focus:border-secondary bg-background-light";
  const inputDarkMode = "dark:border-ui-border-dark dark:focus:ring-secondary dark:focus:border-secondary dark:bg-primary-light/10";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6 bg-form-bg-light dark:bg-form-bg-dark rounded-lg shadow-xl border border-ui-border-light dark:border-ui-border-dark animate-slide-in-up">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-text-dark dark:text-text-light">
          {initialData ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
        </h3>
        {onCancel && (
            <button type="button" onClick={onCancel} className="p-1 text-text-muted-light dark:text-text-muted-dark hover:text-secondary dark:hover:text-secondary-dark">
                <FiX size={20}/>
            </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="codigo" className="block text-sm font-medium mb-1">Código*</label>
          <input type="text" name="codigo" id="codigo" value={formData.codigo} onChange={handleChange} required className={`${inputBaseClasses} ${inputLightMode} ${inputDarkMode}`} />
        </div>
        <div>
          <label htmlFor="categoriaId" className="block text-sm font-medium mb-1">Categoría*</label>
          <select name="categoriaId" id="categoriaId" value={formData.categoriaId} onChange={handleChange} required className={`${inputBaseClasses} ${inputLightMode} ${inputDarkMode}`}>
            <option value="" disabled>Seleccione una categoría</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium mb-1">Descripción*</label>
        <textarea name="descripcion" id="descripcion" value={formData.descripcion} onChange={handleChange} rows="3" required className={`${inputBaseClasses} ${inputLightMode} ${inputDarkMode}`}></textarea>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label htmlFor="stock" className="block text-sm font-medium mb-1">Stock*</label>
          <input type="number" name="stock" id="stock" value={formData.stock} onChange={handleChange} required min="0" className={`${inputBaseClasses} ${inputLightMode} ${inputDarkMode}`} />
        </div>
        <div>
          <label htmlFor="precioNeto" className="block text-sm font-medium mb-1">Precio Neto ($)*</label>
          <input type="number" name="precioNeto" id="precioNeto" value={formData.precioNeto} onChange={handleChange} required min="0.01" step="0.01" className={`${inputBaseClasses} ${inputLightMode} ${inputDarkMode}`} />
        </div>
      </div>

      <div className="border-t border-ui-border-light dark:border-ui-border-dark pt-5 mt-3 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
            <div>
                <label htmlFor="porcentajeContado" className="block text-sm font-medium mb-1">Porcentaje Contado (%)</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiPercent className="text-text-muted-light dark:text-text-muted-dark"/></div>
                    <input type="number" name="porcentajeContado" id="porcentajeContado" value={formData.porcentajeContado} onChange={handleChange} min="0" step="0.01" className={`${inputBaseClasses} ${inputLightMode} ${inputDarkMode} pl-9`} />
                </div>
            </div>
            <div className="p-2.5 bg-neutral-100 dark:bg-primary-light/5 rounded-md">
                <span className="text-xs block text-text-muted-light dark:text-text-muted-dark">Precio Contado Calculado:</span>
                <span className="text-lg font-semibold text-secondary">${precioContadoCalculado.toFixed(2)}</span>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
            <div>
                <label htmlFor="porcentajeFinanciado" className="block text-sm font-medium mb-1">Porcentaje Financiado (%)</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiPercent className="text-text-muted-light dark:text-text-muted-dark"/></div>
                    <input type="number" name="porcentajeFinanciado" id="porcentajeFinanciado" value={formData.porcentajeFinanciado} onChange={handleChange} min="0" step="0.01" className={`${inputBaseClasses} ${inputLightMode} ${inputDarkMode} pl-9`} />
                </div>
            </div>
             <div className="p-2.5 bg-neutral-100 dark:bg-primary-light/5 rounded-md">
                <span className="text-xs block text-text-muted-light dark:text-text-muted-dark">Precio Financiado Calculado:</span>
                <span className="text-lg font-semibold text-secondary">${precioFinanciadoCalculado.toFixed(2)}</span>
            </div>
        </div>
      </div>
      
      <div className="flex items-center justify-end gap-4 pt-3">
        {onCancel && (
            <button type="button" onClick={onCancel} disabled={isLoading} className="px-5 py-2 rounded-md text-sm font-medium text-text-muted-light dark:text-text-muted-dark hover:bg-neutral-100 dark:hover:bg-primary-light/20 transition-colors">
                Cancelar
            </button>
        )}
        <button type="submit" disabled={isLoading} className="flex items-center justify-center gap-2 px-5 py-2 bg-secondary text-renatto-dark font-semibold rounded-md hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary dark:focus:ring-offset-form-bg-dark transition-all shadow-md hover:shadow-yellow-glow disabled:opacity-70">
          {isLoading ? <FiLoader className="animate-spin" /> : (initialData ? <FiSave/> : <FiPlusCircle />)}
          {initialData ? 'Guardar Cambios' : 'Agregar Producto'}
        </button>
      </div>
    </form>
  );
};

// --- Componente Principal de la Página de Productos ---
const ProductsPage = () => {
  const currentUser = auth.currentUser;
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // Para el selector en el ProductForm
  const [isLoading, setIsLoading] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const productsCollectionRef = useMemo(() => collection(db, "products"), []);
  const categoriesCollectionRef = useMemo(() => collection(db, "categories"), []);


  const clearMessages = useCallback(() => { setError(''); setSuccess(''); }, []);
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(clearMessages, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, success, clearMessages]);

  // Cargar Categorías para el selector del formulario
  useEffect(() => {
    const q = query(categoriesCollectionRef, orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setCategories(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (err) => console.error("Error cargando categorías para el form:", err));
    return () => unsubscribe();
  }, [categoriesCollectionRef]);

  // Cargar Productos
  useEffect(() => {
    setIsLoading(true);
    const q = query(productsCollectionRef, orderBy("descripcion", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setProducts(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setIsLoading(false);
    }, (err) => {
      console.error("Error cargando productos:", err);
      setError("No se pudieron cargar los productos.");
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [productsCollectionRef]);

  const handleSaveProduct = async (productData) => {
    clearMessages(); setIsLoading(true);
    const selectedCategory = categories.find(cat => cat.id === productData.categoriaId);

    try {
      const dataToSave = {
        ...productData,
        categoriaNombre: selectedCategory ? selectedCategory.name : 'Desconocida', // Guardar nombre de categoría
        userId: currentUser.uid,
      };

      if (editingProduct) {
        dataToSave.updatedAt = serverTimestamp();
        await updateDoc(doc(db, "products", editingProduct.id), dataToSave);
        setSuccess("Producto actualizado.");
      } else {
        dataToSave.createdAt = serverTimestamp();
        await addDoc(productsCollectionRef, dataToSave);
        setSuccess("Producto agregado.");
      }
      setIsFormVisible(false); setEditingProduct(null);
    } catch (err) {
      console.error("Error guardando producto:", err);
      setError(`Error al guardar producto: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProduct = (product) => {
    clearMessages(); setEditingProduct(product); setIsFormVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (productId) => {
    clearMessages();
    if (window.confirm("¿Eliminar este producto? Esta acción es irreversible.")) {
      setIsLoading(true);
      try {
        await deleteDoc(doc(db, "products", productId));
        setSuccess("Producto eliminado.");
      } catch (err) {
        console.error("Error eliminando producto:", err);
        setError("Error al eliminar producto.");
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const openNewProductForm = () => {
    clearMessages(); setEditingProduct(null); setIsFormVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const closeProductForm = () => {
    setIsFormVisible(false); setEditingProduct(null); clearMessages();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-semibold text-text-dark dark:text-text-light flex items-center gap-3">
          <FiPackage className="text-secondary" /> Gestión de Productos
        </h2>
        {!isFormVisible && (
            <button onClick={openNewProductForm} className="mt-3 sm:mt-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-secondary text-renatto-dark font-semibold rounded-md hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary dark:focus:ring-offset-background-dark transition-all shadow-lg hover:shadow-yellow-glow disabled:opacity-70">
                <FiPlusCircle size={18}/> Nuevo Producto
            </button>
        )}
      </div>

      {error && <div className="mb-6 p-3.5 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700/50 rounded-lg flex items-center gap-3 text-sm text-red-700 dark:text-red-300"><FiAlertCircle size={18}/> <span>{error}</span></div>}
      {success && <div className="mb-6 p-3.5 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700/50 rounded-lg flex items-center gap-3 text-sm text-green-700 dark:text-green-300"><FiCheckCircle size={18}/> <span>{success}</span></div>}

      {isFormVisible && (
        <div className="mb-8 sm:mb-10">
          <ProductForm 
            onSubmit={handleSaveProduct}
            initialData={editingProduct}
            isLoading={isLoading}
            onCancel={closeProductForm}
            categories={categories}
          />
        </div>
      )}

      <div className="bg-form-bg-light dark:bg-form-bg-dark p-4 sm:p-6 rounded-xl shadow-xl border border-ui-border-light dark:border-ui-border-dark">
        <h3 className="text-xl font-semibold mb-5 text-text-dark dark:text-text-light flex items-center gap-2">
          <FiList /> Lista de Productos ({products.length})
        </h3>
        {(isLoading && products.length === 0) && <div className="flex flex-col items-center justify-center py-10 text-text-muted-light dark:text-text-muted-dark"><FiLoader className="animate-spin text-3xl sm:text-4xl text-secondary mb-3"/> <p>Cargando productos...</p></div>}
        {(!isLoading && products.length === 0 && !isFormVisible) && <div className="text-center py-10 text-text-muted-light dark:text-text-muted-dark"><FiPackage size={40} className="mx-auto mb-3 opacity-50"/><p>No hay productos registrados.</p><p className="text-sm">Agrega productos usando el botón "Nuevo Producto".</p></div>}
        
        {products.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm text-left">
              <thead className="text-xs uppercase bg-neutral-100 dark:bg-primary-light/20 text-text-muted-light dark:text-text-muted-dark">
                <tr>
                  <th scope="col" className="px-3 py-3">Código</th>
                  <th scope="col" className="px-3 py-3">Descripción</th>
                  <th scope="col" className="px-3 py-3 text-center">Stock</th>
                  <th scope="col" className="px-3 py-3 text-right">P. Neto</th>
                  <th scope="col" className="px-3 py-3 text-right">P. Contado</th>
                  <th scope="col" className="px-3 py-3 text-right">P. Financiado</th>
                  <th scope="col" className="px-3 py-3 hidden lg:table-cell">Categoría</th>
                  <th scope="col" className="px-3 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-text-dark dark:text-text-light">
                {products.map(prod => (
                  <tr key={prod.id} className="border-b border-ui-border-light dark:border-ui-border-dark hover:bg-neutral-50 dark:hover:bg-primary-light/5 transition-colors">
                    <td className="px-3 py-3 font-medium">{prod.codigo}</td>
                    <td className="px-3 py-3 max-w-xs truncate" title={prod.descripcion}>{prod.descripcion}</td>
                    <td className="px-3 py-3 text-center">{prod.stock}</td>
                    <td className="px-3 py-3 text-right">${(prod.precioNeto || 0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-right text-green-600 dark:text-green-400 font-semibold">${(prod.precioContadoCalculado || 0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-right text-blue-600 dark:text-blue-400 font-semibold">${(prod.precioFinanciadoCalculado || 0).toFixed(2)}</td>
                    <td className="px-3 py-3 hidden lg:table-cell">{prod.categoriaNombre || 'N/A'}</td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <button onClick={() => handleEditProduct(prod)} className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-md mr-1.5 transition-colors" title="Editar Producto" disabled={isLoading}><FiEdit3 size={16}/></button>
                      <button onClick={() => handleDeleteProduct(prod.id)} className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-md transition-colors" title="Eliminar Producto" disabled={isLoading}><FiTrash2 size={16}/></button>
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

export default ProductsPage;