// src/pages/dashboard/SalesPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db, auth } from '../../firebase/config';
import {
  collection, query, onSnapshot, doc, getDoc,
  addDoc, writeBatch, serverTimestamp,
  orderBy
} from "firebase/firestore";
import {
  FiDollarSign, FiUsers, FiPackage, FiSearch, FiPlus, FiTrash2, FiX,
  FiCreditCard, FiShoppingCart, FiPrinter, FiLoader, FiAlertCircle, FiCheckCircle,
  FiChevronsRight, FiCalendar, FiEdit2
} from 'react-icons/fi';
import Select from 'react-select';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const FALLBACK_LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAABVJREFUOE9jZKAQMFIwCFMFDAwAAHoAAcs30HZuAAAAAElFTkSuQmCC";

const STORE_INFO = {
  name: "Renatto's Almacenes",
  slogan: "COMODIDAD PARA TU HOGAR",
  address: "San Gerardo-Giron-Azuay",
  phone: "+593 97 988 1804",
  ruc: "0106338114001",
  email: "info@renattos.com",
  website: "www.renattos.com",
  defaultBranch: "SAN GERARDO"
};

const PDF_COLORS = {
  primary: '#1A237E', 
  secondary: '#FFC107', 
  textPrimary: '#1C1C1C', 
  textSecondary: '#555555', 
  textOnPrimary: '#FFFFFF', 
  textOnSecondary: '#1C1C1C', 
  white: '#FFFFFF',
  lightGray: '#F8F9FA', 
  mediumGray: '#ADB5BD', 
  darkGray: '#343A40', 
  danger: '#D32F2F', 
};


// --- Sub-Componentes ---
const SaleHeader = () => ( 
  <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-3 border-b border-ui-border-light dark:border-ui-border-dark">
    <h2 className="text-2xl sm:text-3xl font-semibold text-text-dark dark:text-text-light flex items-center gap-3">
      <FiShoppingCart className="text-secondary" /> Nueva Venta
    </h2>
  </div>
);

const NotificationMessages = ({ error, success }) => (
  <>
    {error && 
      <div className="mb-4 p-3.5 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700/50 rounded-lg flex items-center gap-3 text-sm text-red-700 dark:text-red-300 animate-fade-in">
        <FiAlertCircle size={18}/> <span>{error}</span>
      </div>
    }
    {success && 
      <div className="mb-4 p-3.5 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700/50 rounded-lg flex items-center gap-3 text-sm text-green-700 dark:text-green-300 animate-fade-in">
        <FiCheckCircle size={18}/> <span>{success}</span>
      </div>
    }
  </>
);

const ClientInfoSection = ({ clients, selectedClient, setSelectedClient, paymentType, setPaymentType, setSelectedFactorPlazoData, setEntrada }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-5 bg-form-bg-light dark:bg-form-bg-dark rounded-lg shadow border border-ui-border-light dark:border-ui-border-dark">
    <div>
      <label htmlFor="client-select" className="block text-sm font-medium text-text-dark dark:text-text-light mb-1.5 flex items-center gap-2">
        <FiUsers/>Cliente*
      </label>
      <Select 
        options={clients} 
        value={selectedClient} 
        onChange={(client) => { setSelectedClient(client); }} 
        placeholder="Buscar cliente..." 
        isClearable 
        classNamePrefix="react-select"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-text-dark dark:text-text-light mb-2.5">Tipo de Pago*</label>
      <div className="flex gap-x-6 items-center h-[42px]"> {/* Increased gap */}
        <label className="flex items-center gap-1.5 cursor-pointer text-sm">
          <input 
            type="radio" 
            name="paymentType" 
            value="contado" 
            checked={paymentType === 'contado'} 
            onChange={(e) => { setPaymentType(e.target.value); setSelectedFactorPlazoData(null); setEntrada(0); }} 
            className="form-radio h-4 w-4 text-secondary focus:ring-secondary accent-secondary dark:accent-secondary"
          /> Contado
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer text-sm">
          <input 
            type="radio" 
            name="paymentType" 
            value="financiado" 
            checked={paymentType === 'financiado'} 
            onChange={(e) => setPaymentType(e.target.value)} 
            className="form-radio h-4 w-4 text-secondary focus:ring-secondary accent-secondary dark:accent-secondary"
          /> Financiado
        </label>
      </div>
    </div>
  </div>
);

const ProductSearch = ({ productSearchTerm, setProductSearchTerm, productSearchResults, handleOpenItemModal, inputBaseClasses, inputLightMode, inputDarkMode }) => (
  <div className="mb-6 p-5 bg-form-bg-light dark:bg-form-bg-dark rounded-lg shadow border border-ui-border-light dark:border-ui-border-dark">
    <label htmlFor="product-search" className="block text-sm font-medium text-text-dark dark:text-text-light mb-1.5 flex items-center gap-2">
      <FiSearch/>Añadir Producto al Carrito
    </label>
    <input 
      type="text" 
      id="product-search" 
      placeholder="Buscar por código o descripción..." 
      value={productSearchTerm} 
      onChange={(e) => setProductSearchTerm(e.target.value)} 
      className={`${inputBaseClasses} ${inputLightMode} ${inputDarkMode}`}
    />
    {productSearchResults.length > 0 && (
      <ul className="mt-2 border border-ui-border-light dark:border-ui-border-dark rounded-md max-h-48 overflow-y-auto bg-background-light dark:bg-form-bg-dark shadow-lg z-20 relative">
        {productSearchResults.map(p => (
          <li 
            key={p.id} 
            onClick={() => handleOpenItemModal(p)} 
            className="p-2.5 hover:bg-secondary/20 dark:hover:bg-secondary/30 cursor-pointer border-b border-ui-border-light dark:border-ui-border-dark last:border-b-0 text-sm"
          >
            {p.descripcion} <span className="text-xs text-text-muted-light dark:text-text-muted-dark">({p.codigo}) | Stock: {p.stock}</span><br/>
            <span className="text-xs text-green-600 dark:text-green-400">Contado: ${p.precioContadoCalculado !== undefined ? p.precioContadoCalculado.toFixed(2) : 'N/A'}</span>
            <span className="text-xs text-blue-600 dark:text-blue-400 ml-2">Financiado: ${p.precioFinanciadoCalculado !== undefined ? p.precioFinanciadoCalculado.toFixed(2) : 'N/A'}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const SaleItemModal = ({ isOpen, item, onClose, onSave, quantity, setQuantity, price, setPrice, paymentType, inputBaseClasses, inputLightMode, inputDarkMode, products}) => { 
  if (!isOpen || !item) return null; 
  const productMasterInfo = products.find(p => p.id === (item.id || item.productoId)); 
  const availableStock = item.stock !== undefined ? item.stock : (productMasterInfo?.stock || 0); 
  return ( 
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <form onSubmit={onSave} className="bg-form-bg-light dark:bg-form-bg-dark p-6 rounded-lg shadow-2xl w-full max-w-md space-y-4 border border-ui-border-light dark:border-ui-border-dark">
        <div className="flex justify-between items-center">
          <h4 className="text-lg font-semibold text-text-dark dark:text-text-light">{item.isEditing ? 'Editar Item:' : 'Añadir al Carrito:'} {item.descripcion}</h4>
          <button type="button" onClick={onClose} className="p-1 text-text-muted-light dark:text-text-muted-dark hover:text-secondary"><FiX size={20}/></button>
        </div>
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Stock Disponible Total: {availableStock}</p>
        <div>
          <label htmlFor="itemModalQuantity" className="block text-sm font-medium mb-1">Cantidad*</label>
          <input type="number" id="itemModalQuantity" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} min="1" required className={`${inputBaseClasses} ${inputLightMode} ${inputDarkMode}`}/>
        </div>
        <div>
          <label htmlFor="itemModalPrice" className="block text-sm font-medium mb-1">Precio Unitario Venta*</label>
          <input type="number" id="itemModalPrice" value={price} onChange={(e) => setPrice(e.target.value)} step="0.01" min="0" required className={`${inputBaseClasses} ${inputLightMode} ${inputDarkMode}`}/>
          <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">Sugerido ({paymentType}): ${item.precioUnitarioOriginal !== undefined ? item.precioUnitarioOriginal.toFixed(2) : 'N/A'}</p>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md text-text-muted-light dark:text-text-muted-dark hover:bg-neutral-100 dark:hover:bg-primary-light/20">Cancelar</button>
          <button type="submit" className="px-4 py-2 text-sm bg-secondary text-renatto-dark font-semibold rounded-md hover:bg-secondary-dark shadow hover:shadow-md">{item.isEditing ? 'Actualizar Item' : 'Añadir al Carrito'}</button>
        </div>
      </form>
    </div>
  );
};

const SaleCartView = ({ items, onEdit, onRemove, subtotalGeneral }) => (
  <div className="mb-6 p-5 bg-form-bg-light dark:bg-form-bg-dark rounded-lg shadow border border-ui-border-light dark:border-ui-border-dark">
    <h4 className="text-lg font-semibold text-text-dark dark:text-text-light mb-3 flex items-center gap-2">
      <FiShoppingCart/>Ítems en la Venta ({items.length})
    </h4>
    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
      {items.map((item, index) => ( 
        <div key={item.productoId + '-' + index} className="flex items-start justify-between p-2.5 bg-neutral-50 dark:bg-primary-light/10 rounded-md border border-ui-border-light dark:border-ui-border-dark text-sm">
          <div>
            <p className="font-medium text-text-dark dark:text-text-light">{item.descripcion}</p>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
              Cant: {item.cantidad} x ${item.precioUnitarioVenta.toFixed(2)} 
              {item.precioUnitarioVenta.toFixed(2) !== item.precioUnitarioOriginal.toFixed(2) && 
                <span className="line-through ml-1 text-red-500/70">${item.precioUnitarioOriginal.toFixed(2)}</span>
              }
            </p>
          </div>
          <div className="text-right flex items-center gap-2 shrink-0">
            <p className="font-semibold text-text-dark dark:text-text-light min-w-[70px]">${item.subtotalItem.toFixed(2)}</p>
            <button onClick={() => onEdit(item, index)} className="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" title="Editar item"><FiEdit2 size={14}/></button>
            <button onClick={() => onRemove(index)} className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" title="Quitar item"><FiTrash2 size={14}/></button>
          </div>
        </div>
      ))}
    </div>
    <div className="border-t border-ui-border-light dark:border-ui-border-dark mt-3 pt-3 flex justify-end">
      <div className="text-right">
        <span className="text-sm text-text-muted-light dark:text-text-muted-dark">Subtotal General: </span>
        <span className="text-xl font-bold text-text-dark dark:text-text-light">${subtotalGeneral.toFixed(2)}</span>
      </div>
    </div>
  </div>
);

const FinancingDetailsForm = ({ entrada, setEntrada, subtotalGeneral, factorPlazos, selectedFactorPlazoData, setSelectedFactorPlazoData, paymentStartDate, setPaymentStartDate, saldoAFinanciar, inputBaseClasses, inputLightMode, inputDarkMode }) => (
  <div className="mb-6 p-5 bg-form-bg-light dark:bg-form-bg-dark rounded-lg shadow border border-ui-border-light dark:border-ui-border-dark space-y-4">
    <h4 className="text-lg font-semibold text-text-dark dark:text-text-light flex items-center gap-2"><FiCreditCard />Detalles de Financiación</h4>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"> {/* items-end to align labels better if some inputs are taller */}
      <div>
        <label htmlFor="entrada" className="block text-sm font-medium mb-1">Entrada ($)</label>
        <input type="number" id="entrada" value={entrada} onChange={(e) => setEntrada(parseFloat(e.target.value) || 0)} min="0" step="0.01" max={subtotalGeneral} className={`${inputBaseClasses} ${inputLightMode} ${inputDarkMode}`} />
      </div>
      <div>
        <label htmlFor="factor-plazo-select" className="block text-sm font-medium mb-1">Plazo (Meses)*</label>
        <Select 
            options={factorPlazos} 
            value={selectedFactorPlazoData ? factorPlazos.find(f => f.value === selectedFactorPlazoData.value) : null} 
            onChange={(selectedOption) => setSelectedFactorPlazoData(selectedOption)} 
            placeholder="Seleccionar plazo..." 
            isClearable 
            classNamePrefix="react-select"
        />
      </div>
      <div> 
        <label htmlFor="paymentStartDate" className="block text-sm font-medium mb-1">Fecha Inicio Pagos*</label>
        <input type="date" id="paymentStartDate" value={paymentStartDate} onChange={(e) => setPaymentStartDate(e.target.value)} required={saldoAFinanciar > 0} className={`${inputBaseClasses} ${inputLightMode} ${inputDarkMode}`} />
      </div>
    </div>
  </div>
);

const FinancingSummary = ({ subtotalGeneral, entrada, saldoAFinanciar, selectedFactorPlazoData, valorCuotaFinal, totalPagadoFinanciado }) => (
  selectedFactorPlazoData && saldoAFinanciar >= 0 && ( 
    <div className="mb-6 p-5 bg-neutral-50 dark:bg-primary-light/5 rounded-lg shadow border border-ui-border-light dark:border-ui-border-dark space-y-1.5 text-sm"> {/* Increased padding and space-y */}
      <h5 className="text-md font-semibold mb-2 text-text-dark dark:text-text-light">Resumen de Financiación:</h5>
      <p><strong>Subtotal General:</strong> <span className="font-semibold">${subtotalGeneral.toFixed(2)}</span></p>
      <p><strong>Entrada:</strong> <span className="font-semibold">${(parseFloat(entrada) || 0).toFixed(2)}</span></p>
      <p><strong>Saldo a Financiar:</strong> <span className="font-semibold text-secondary">${saldoAFinanciar.toFixed(2)}</span></p>
      <p><strong>Factor Plazo Seleccionado:</strong> {selectedFactorPlazoData.factorPlazo}</p>
      <p><strong>Factor Tasa Seleccionado:</strong> {selectedFactorPlazoData.factorTasa}</p>
      <p className="text-lg mt-1"><strong>Valor Cuota Mensual:</strong> <span className="font-bold text-secondary">${valorCuotaFinal.toFixed(0)}</span> (redondeado al mayor)</p>
      <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Total Pagado en Cuotas: ${(valorCuotaFinal * selectedFactorPlazoData.cantidadMes).toFixed(2)}</p>
      <p className="text-sm font-semibold mt-1">Total General Financiado: <span className="text-secondary">${totalPagadoFinanciado.toFixed(2)}</span></p>
    </div>
  )
);

const PaymentScheduleTable = ({ schedule }) => ( 
  <div className="mb-6 p-5 bg-form-bg-light dark:bg-form-bg-dark rounded-lg shadow border border-ui-border-light dark:border-ui-border-dark">
    <h4 className="text-md font-semibold text-text-dark dark:text-text-light mb-3">Cronograma de Pagos Estimado</h4>
    <div className="overflow-x-auto max-h-60 rounded-md border border-ui-border-light dark:border-ui-border-dark">
      <table className="min-w-full text-xs text-left divide-y divide-ui-border-light dark:divide-ui-border-dark">
        <thead className="bg-neutral-100 dark:bg-primary-light/20 sticky top-0 z-10">
          <tr>
            <th className="px-3 py-2.5 text-center font-medium uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark">Nº</th>
            <th className="px-3 py-2.5 font-medium uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark">Fecha Estimada Venc.</th>
            <th className="px-3 py-2.5 text-right font-medium uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark">Valor Cuota</th>
          </tr>
        </thead>
        <tbody className="bg-background-light dark:bg-form-bg-dark divide-y divide-ui-border-light dark:divide-ui-border-dark">
          {schedule.map(cuota => ( 
            <tr key={cuota.cuotaNumero} className="hover:bg-neutral-50 dark:hover:bg-primary-light/10">
              <td className="px-3 py-2 whitespace-nowrap text-center text-text-dark dark:text-text-light">{cuota.cuotaNumero}</td>
              <td className="px-3 py-2 whitespace-nowrap text-text-dark dark:text-text-light">{cuota.fechaVencimientoDisplay}</td>
              <td className="px-3 py-2 whitespace-nowrap text-right font-semibold text-secondary">${cuota.valorCuota.toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const ActionButtons = ({ onRegister, loadingSale, paymentType, saldoAFinanciar, selectedFactorPlazoData, paymentStartDate, entrada, logoLoaded, logoError }) => ( 
  <div className="mt-8 py-4 text-center border-t border-ui-border-light dark:border-ui-border-dark">
    <button 
      onClick={onRegister} 
      disabled={!logoLoaded || logoError || loadingSale || (paymentType === 'financiado' && saldoAFinanciar > 0 && (!selectedFactorPlazoData || !paymentStartDate) ) || (paymentType === 'financiado' && saldoAFinanciar < 0 && (parseFloat(entrada) || 0) > 0) } 
      className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-3 bg-green-600 hover:bg-green-700 text-white text-base font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-form-bg-dark transition-all shadow-xl hover:shadow-green-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loadingSale ? <FiLoader className="animate-spin text-xl"/> : <FiCheckCircle className="text-xl"/>} 
      { !logoLoaded && !logoError ? "Cargando logo..." : (logoError ? "Error de logo" : "Registrar Venta y Generar Documentos")}
    </button>
  </div>
);

// --- Main Component ---
const SalesPage = () => {
  const currentUser = auth.currentUser;

  const [logoBase64, setLogoBase64] = useState(null);
  const [logoError, setLogoError] = useState(null);
  const [logoLoaded, setLogoLoaded] = useState(false);

  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [factorPlazos, setFactorPlazos] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [paymentType, setPaymentType] = useState('contado');
  const [saleItems, setSaleItems] = useState([]);
  const [entrada, setEntrada] = useState(0);
  const [selectedFactorPlazoData, setSelectedFactorPlazoData] = useState(null);
  const [paymentStartDate, setPaymentStartDate] = useState(() => {
    const today = new Date();
    // Default to next month, but user can change it.
    // If it's e.g. Jan 31, next month Feb, it will auto-adjust to Feb 28/29.
    today.setMonth(today.getMonth() + 1); 
    return today.toISOString().split('T')[0];
  });
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productSearchResults, setProductSearchResults] = useState([]);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [currentItemForModal, setCurrentItemForModal] = useState(null);
  const [itemModalQuantity, setItemModalQuantity] = useState(1);
  const [itemModalPrice, setItemModalPrice] = useState('');

  const [loadingSale, setLoadingSale] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = '/logo.png'; 

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH_LOGO = 300; 
      const scaleFactor = Math.min(1, MAX_WIDTH_LOGO / img.naturalWidth);
      canvas.width = img.naturalWidth * scaleFactor;
      canvas.height = img.naturalHeight * scaleFactor;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      try {
        const base64 = canvas.toDataURL('image/png', 0.9); 
        setLogoBase64(base64);
      } catch (e) {
        console.error("Error converting image to Base64:", e);
        setLogoError("Error al procesar el logo.");
        setLogoBase64(FALLBACK_LOGO_BASE64);
      } finally {
        setLogoLoaded(true);
      }
    };
    img.onerror = () => {
      console.error("Error loading logo image from /public/logo.png. Using fallback.");
      setLogoError("No se pudo cargar el logo. Verifique que '/logo.png' exista en la carpeta /public.");
      setLogoBase64(FALLBACK_LOGO_BASE64);
      setLogoLoaded(true);
    };
  }, []);

  const inputBaseClasses = "w-full px-3 py-2 border rounded-md focus:outline-none transition-all duration-150 text-text-dark dark:text-text-light placeholder-text-muted-light dark:placeholder-text-muted-dark";
  const inputLightMode = "border-ui-border-light focus:ring-2 focus:ring-secondary focus:border-secondary bg-background-light";
  const inputDarkMode = "dark:border-ui-border-dark dark:focus:ring-secondary dark:focus:border-secondary dark:bg-primary-light/10";

  const clearMessages = useCallback(() => { setError(''); setSuccess(''); }, []);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(clearMessages, 7000);
      return () => clearTimeout(timer);
    }
  }, [error, success, clearMessages]);

  useEffect(() => {
    if (!logoLoaded) {
        setPageLoading(true);
        return;
    }
    setPageLoading(true);
    let loadedCount = 0;
    const totalToLoad = 3;
    let allFirestoreListenersFiredOrErrored = false;

    const checkAllDataLoaded = () => {
      if(allFirestoreListenersFiredOrErrored) return;
      loadedCount++;
      if (loadedCount === totalToLoad) {
        allFirestoreListenersFiredOrErrored = true;
        setPageLoading(false);
      }
    };
    
    const handleError = (collectionName, err) => {
      console.error(`Error cargando ${collectionName}:`, err);
      setError(`Error al cargar ${collectionName}.`);
      if (!allFirestoreListenersFiredOrErrored) checkAllDataLoaded(); 
    };

    const unsubscribers = [
      onSnapshot(query(collection(db, "clients"), orderBy("nombres")), (snapshot) => { setClients(snapshot.docs.map(doc => ({ value: doc.id, label: `${doc.data().nombres} ${doc.data().apellidos} (${doc.data().identificacion})`, ...doc.data() }))); if (!allFirestoreListenersFiredOrErrored) checkAllDataLoaded(); }, (err) => handleError("clientes", err)),
      onSnapshot(query(collection(db, "products"), orderBy("descripcion")), (snapshot) => { setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); if (!allFirestoreListenersFiredOrErrored) checkAllDataLoaded(); }, (err) => handleError("productos", err)),
      onSnapshot(query(collection(db, "factorPlazos"), orderBy("cantidadMes")), (snapshot) => { setFactorPlazos(snapshot.docs.map(doc => ({ value: doc.id, label: `${doc.data().cantidadMes} Meses (FP: ${doc.data().factorPlazo}, FT: ${doc.data().factorTasa})`, ...doc.data() }))); if (!allFirestoreListenersFiredOrErrored) checkAllDataLoaded(); }, (err) => handleError("factores de plazo", err))
    ];
    
    const fallbackTimer = setTimeout(() => {
        if (pageLoading && !allFirestoreListenersFiredOrErrored) { 
            setPageLoading(false);
            console.warn("Fallback: Carga de datos maestros incompleta o tardía. Mostrando página con datos posiblemente incompletos.");
            if (loadedCount < totalToLoad) {
                setError("Algunos datos maestros no pudieron cargarse. Funcionalidad limitada.");
            }
        }
    }, 7000); 

    return () => {
      unsubscribers.forEach(unsub => unsub());
      clearTimeout(fallbackTimer);
    };
  }, [logoLoaded]); 

  useEffect(() => {
    if (productSearchTerm.length > 1) {
      setProductSearchResults(
        products.filter(p =>
          p.descripcion.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
          (p.codigo && p.codigo.toLowerCase().includes(productSearchTerm.toLowerCase()))
        ).slice(0, 5)
      );
    } else {
      setProductSearchResults([]);
    }
  }, [productSearchTerm, products]);

  const handleOpenItemModal = (product) => {
    clearMessages();
    const priceKey = paymentType === 'contado' ? 'precioContadoCalculado' : 'precioFinanciadoCalculado';
    const initialPrice = product[priceKey] !== undefined ? product[priceKey] : (product.precioNeto || 0);
    setCurrentItemForModal({ ...product, isEditing: false, precioUnitarioOriginal: initialPrice });
    setItemModalQuantity(1);
    setItemModalPrice(initialPrice.toFixed(2));
    setIsItemModalOpen(true);
    setProductSearchTerm('');
    setProductSearchResults([]);
  };

  const handleEditItemInCart = (itemToEdit, index) => {
    clearMessages();
    setCurrentItemForModal({ ...itemToEdit, index, isEditing: true });
    setItemModalQuantity(itemToEdit.cantidad);
    setItemModalPrice(itemToEdit.precioUnitarioVenta.toFixed(2));
    setIsItemModalOpen(true);
  };
  
  const handleSaveItemToSale = (e) => {
    e.preventDefault();
    if (!currentItemForModal || itemModalQuantity <= 0) {
      setError("Datos de producto inválidos."); return;
    }
    const productMasterInfo = products.find(p => p.id === (currentItemForModal.id || currentItemForModal.productoId));
    const stockDisponibleProducto = productMasterInfo?.stock || 0;
    let cantidadActualEnCarritoDelMismoProducto = 0;
    if (currentItemForModal.isEditing) {
      cantidadActualEnCarritoDelMismoProducto = saleItems
        .filter((item, idx) => item.productoId === currentItemForModal.productoId && idx !== currentItemForModal.index)
        .reduce((sum, item) => sum + item.cantidad, 0);
    } else {
      cantidadActualEnCarritoDelMismoProducto = saleItems
        .filter(item => item.productoId === (currentItemForModal.id || currentItemForModal.productoId))
        .reduce((sum, item) => sum + item.cantidad, 0);
    }
    if ((parseInt(itemModalQuantity, 10) + cantidadActualEnCarritoDelMismoProducto) > stockDisponibleProducto) {
      const puedeAnadir = stockDisponibleProducto - cantidadActualEnCarritoDelMismoProducto;
      setError(`Stock insuficiente para ${currentItemForModal.descripcion}. Stock total: ${stockDisponibleProducto}. Ya en carrito: ${cantidadActualEnCarritoDelMismoProducto}. Puedes añadir/tener hasta ${Math.max(0, puedeAnadir)}.`);
      return;
    }
    const precioVenta = parseFloat(itemModalPrice) || currentItemForModal.precioUnitarioOriginal;
    const saleItemData = {
      productoId: currentItemForModal.id || currentItemForModal.productoId,
      codigo: currentItemForModal.codigo,
      descripcion: currentItemForModal.descripcion,
      stockAlMomentoDeAnadir: stockDisponibleProducto,
      cantidad: parseInt(itemModalQuantity, 10),
      precioUnitarioOriginal: currentItemForModal.precioUnitarioOriginal,
      precioUnitarioVenta: parseFloat(precioVenta.toFixed(2)),
      subtotalItem: parseFloat((parseInt(itemModalQuantity, 10) * precioVenta).toFixed(2)),
      categoriaNombre: currentItemForModal.categoriaNombre || productMasterInfo?.categoriaNombre || '',
    };
    let updatedItems;
    if (currentItemForModal.isEditing) {
        updatedItems = saleItems.map((item, idx) => idx === currentItemForModal.index ? saleItemData : item);
    } else {
        const existingItemIndex = saleItems.findIndex(item => item.productoId === saleItemData.productoId);
        if(existingItemIndex > -1) {
            updatedItems = [...saleItems];
            const existingItem = updatedItems[existingItemIndex];
            existingItem.cantidad += saleItemData.cantidad;
            existingItem.precioUnitarioVenta = saleItemData.precioUnitarioVenta; 
            existingItem.subtotalItem = parseFloat((existingItem.cantidad * existingItem.precioUnitarioVenta).toFixed(2));
        } else {
            updatedItems = [...saleItems, saleItemData];
        }
    }
    setSaleItems(updatedItems);
    setIsItemModalOpen(false);
  };
  
  const handleRemoveItemFromSale = (index) => { setSaleItems(prevItems => prevItems.filter((_, i) => i !== index));};

  const subtotalGeneral = useMemo(() => saleItems.reduce((sum, item) => sum + item.subtotalItem, 0), [saleItems]);
  const totalVenta = useMemo(() => subtotalGeneral, [subtotalGeneral]);
  const saldoAFinanciar = useMemo(() => { const entradaNum = parseFloat(entrada) || 0; const saldo = subtotalGeneral - entradaNum; return saldo < 0 ? 0 : saldo; }, [subtotalGeneral, entrada]);
  const valorCuotaFinal = useMemo(() => { if (paymentType === 'financiado' && selectedFactorPlazoData && saldoAFinanciar > 0) { const { factorPlazo, factorTasa } = selectedFactorPlazoData; const cuotaBase = saldoAFinanciar * factorPlazo * factorTasa; return Math.ceil(cuotaBase); } return 0; }, [paymentType, selectedFactorPlazoData, saldoAFinanciar]);
  
  // --- MODIFIED Payment Start Date Logic ---
  const paymentScheduleData = useMemo(() => { 
    if (paymentType === 'financiado' && selectedFactorPlazoData && valorCuotaFinal > 0 && saldoAFinanciar >= 0 && paymentStartDate) { 
      const schedule = []; 
      const { cantidadMes } = selectedFactorPlazoData; 
      const startDateParts = paymentStartDate.split('-'); 
      // Ensure startDate is treated as UTC to avoid timezone shifts when only date is relevant
      const startDate = new Date(Date.UTC(parseInt(startDateParts[0]), parseInt(startDateParts[1]) - 1, parseInt(startDateParts[2]))); 
      
      for (let i = 0; i < cantidadMes; i++) { 
        let fechaVencimiento = new Date(startDate.getTime()); 
        // The first payment (i=0) is on startDate, second (i=1) is startDate + 1 month, etc.
        fechaVencimiento.setUTCMonth(startDate.getUTCMonth() + i); 
        
        // Handle cases like Jan 31 -> Feb 28/29
        // If setting the month caused the day to change (e.g., Jan 31 + 1 month might become Mar 2/3 if not careful)
        // or if original day doesn't exist in target month (e.g. Jan 31 to Feb)
        if (fechaVencimiento.getUTCDate() !== startDate.getUTCDate() && startDate.getUTCDate() > 28) {
          // Check if the month correctly advanced or if it skipped.
          // Target month should be (startDate.getUTCMonth() + i)
          // If fechaVencimiento.getUTCMonth() is not (startDate.getUTCMonth() + i) % 12, it means
          // setting the day (which was too high for the target month) pushed it to the *next* month.
          // Example: startDate = Jan 31. i=1 (for Feb). setUTCMonth(Jan + 1) = setUTCMonth(Feb).
          // If it becomes Mar 2 (because Feb doesn't have 31), then getUTCMonth() would be 2 (Mar),
          // but target (startDate.getUTCMonth() + i) % 12 = (0+1)%12 = 1 (Feb).
          // In this case, set to last day of the *target* month.
          if (fechaVencimiento.getUTCMonth() !== (startDate.getUTCMonth() + i) % 12 ) {
            fechaVencimiento = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + i + 1, 0));
          }
        }
        schedule.push({ 
          cuotaNumero: i + 1, 
          fechaVencimiento: fechaVencimiento, 
          valorCuota: valorCuotaFinal, 
          estado: 'pendiente' 
        }); 
      } 
      return schedule; 
    } 
    return []; 
  }, [paymentType, selectedFactorPlazoData, valorCuotaFinal, saldoAFinanciar, paymentStartDate]);

  const formattedPaymentScheduleForUI = useMemo(() => { return paymentScheduleData.map(p => ({ ...p, fechaVencimientoDisplay: p.fechaVencimiento.toLocaleDateString('es-EC', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' }) })); }, [paymentScheduleData]);
  const totalPagadoFinanciado = useMemo(() => { if (paymentType === 'financiado' && selectedFactorPlazoData) { const cuota = valorCuotaFinal || 0; const meses = selectedFactorPlazoData.cantidadMes || 0; return (parseFloat(entrada) || 0) + (cuota * meses); } return totalVenta; }, [paymentType, entrada, valorCuotaFinal, selectedFactorPlazoData, totalVenta]);
  
  const formatDateForPdf = (dateInput, options = {day:'2-digit',month:'2-digit',year:'numeric'}) => {
    if (!dateInput) return 'N/A';
    let d;
    if (dateInput instanceof Date) {
      d = dateInput;
    } else if (dateInput && typeof dateInput.toDate === 'function') { 
      d = dateInput.toDate();
    } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
      d = new Date(dateInput);
      if (typeof dateInput === 'string' && !dateInput.includes('T') && !dateInput.includes('Z')) {
          const parts = dateInput.split(/[-/]/);
          if (parts.length === 3) {
            d = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
          }
      }
    } else {
      return 'Fecha Inv.';
    }
  
    if (d && !isNaN(d.getTime())) {
      const defaultTimeZone = 'America/Guayaquil'; 
      let timeZoneToUse = defaultTimeZone;
      if (options.timeZone === 'UTC' || (dateInput instanceof Date && dateInput.toISOString().endsWith('Z') && !options.timeZone) ) {
          timeZoneToUse = 'UTC';
      }
      if (options && (options.timeStyle || options.hour)) { 
        return d.toLocaleString('es-EC', { ...options, timeZone: timeZoneToUse });
      }
      return d.toLocaleDateString('es-EC', { ...options, timeZone: timeZoneToUse });
    }
    return 'Fecha Inv.';
  };

  const generateA4SaleVoucherPdf = (saleDataForPdf) => {
    if (!logoBase64 && !logoError) { setError("El logo aún no ha cargado. Por favor espere."); return; }
    const currentLogoToUse = logoError ? FALLBACK_LOGO_BASE64 : logoBase64;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);
    let y = margin; 

    const logoWidth = 40; 
    const logoHeight = 15; 
    try {
        if(currentLogoToUse) doc.addImage(currentLogoToUse, 'PNG', margin, y, logoWidth, logoHeight);
    } catch(e) { console.error("Error adding logo to voucher:", e); }

    const storeInfoX = margin + logoWidth + 5;
    const storeInfoWidth = contentWidth - logoWidth - 5;
    doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(PDF_COLORS.primary);
    doc.text(STORE_INFO.name.toUpperCase(), storeInfoX, y + 5, { maxWidth: storeInfoWidth });
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(PDF_COLORS.textSecondary);
    doc.text(`RUC: ${STORE_INFO.ruc}`, storeInfoX, y + 9, { maxWidth: storeInfoWidth });
    doc.text(STORE_INFO.slogan, storeInfoX, y + 12, { maxWidth: storeInfoWidth });
    y += Math.max(logoHeight, 15) + 5; 

    doc.setDrawColor(PDF_COLORS.mediumGray);
    doc.line(margin, y, pageWidth - margin, y); 
    y += 6;

    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(PDF_COLORS.textPrimary);
    doc.text("COMPROBANTE DE VENTA", pageWidth / 2, y, { align: 'center' });
    y += 6;

    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(PDF_COLORS.textSecondary);
    const ventaNoText = `No. Venta: ${saleDataForPdf.id || 'PENDIENTE'}`;
    const fechaVentaPDF = formatDateForPdf(saleDataForPdf.fechaVenta, {day:'2-digit',month:'long',year:'numeric', hour:'2-digit', minute:'2-digit'});
    const fechaText = `Fecha: ${fechaVentaPDF}`;
    doc.text(ventaNoText, margin, y);
    doc.text(fechaText, pageWidth - margin, y, { align: 'right' });
    y += 5;
    doc.text(`Vendedor: ${saleDataForPdf.vendedorEmail || 'N/A'}`, margin, y);
    doc.text(`Forma de Pago: ${saleDataForPdf.tipoPago.toUpperCase()}`, pageWidth - margin, y, { align: 'right' });
    y += 7;

    doc.setFillColor(PDF_COLORS.lightGray);
    doc.rect(margin, y - 2, contentWidth, 7, 'F'); 
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(PDF_COLORS.primary);
    doc.text("DATOS DEL CLIENTE", margin + 2, y + 2.5);
    y += 8;

    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(PDF_COLORS.textSecondary);
    const clientFieldStartY = y;
    doc.setFont('helvetica', 'bold'); doc.text("Nombre:", margin, y);
    doc.setFont('helvetica', 'normal'); doc.text(saleDataForPdf.clienteNombre || 'N/A', margin + 25, y, {maxWidth: contentWidth - 95});
    doc.setFont('helvetica', 'bold'); doc.text("RUC/CI:", pageWidth - margin - 50, y, {align: 'left'});
    doc.setFont('helvetica', 'normal'); doc.text(saleDataForPdf.clienteIdentificacion || 'N/A', pageWidth - margin - 30, y, {align: 'left'});
    y += 5;
    if(saleDataForPdf.clienteDireccion) {
        doc.setFont('helvetica', 'bold'); doc.text("Dirección:", margin, y);
        doc.setFont('helvetica', 'normal'); doc.text(saleDataForPdf.clienteDireccion, margin + 25, y, {maxWidth: contentWidth - 25});
        y += 5;
    }
    if(saleDataForPdf.clienteCelular) {
        doc.setFont('helvetica', 'bold'); doc.text("Teléfono:", margin, y);
        doc.setFont('helvetica', 'normal'); doc.text(saleDataForPdf.clienteCelular, margin + 25, y, {maxWidth: contentWidth - 95});
        y += 5;
    }
    y = Math.max(y, clientFieldStartY + 12); 
    y += 3; 

    const itemsTableStartY = y;
    const itemsHead = [['Cant.', 'Código', 'Descripción del Producto', 'P. Unitario', 'Subtotal']];
    const itemsBody = saleDataForPdf.items.map(item => [
        item.cantidad,
        item.codigo || 'N/A',
        item.descripcion,
        `$${(item.precioUnitarioVenta || 0).toFixed(2)}`,
        `$${(item.subtotalItem || 0).toFixed(2)}`
    ]);

    const gapAfterTable = 7;
    const totalsHeight = (2 * 5); 
    const gapBeforeFooterLine = 10;
    const footerLineAndGapAfter = 7; 
    const signaturesBlockHeight = 22; 
    const storeAddressBlockHeight = (3 * 3.5) + 4 ; 
    const thanksMessageHeight = 4;
    const bottomPageMargin = margin;

    const heightOfContentBelowTable = gapAfterTable + totalsHeight + gapBeforeFooterLine + footerLineAndGapAfter +
                                   signaturesBlockHeight + storeAddressBlockHeight + thanksMessageHeight;
    
    const maxTableHeight = pageHeight - itemsTableStartY - heightOfContentBelowTable - bottomPageMargin;

    autoTable(doc, {
        head: itemsHead,
        body: itemsBody,
        startY: itemsTableStartY,
        theme: 'striped', 
        styles: { fontSize: 8, cellPadding: {top: 1.5, right: 1.5, bottom: 1.5, left: 1.5}, textColor: PDF_COLORS.textPrimary, lineColor: PDF_COLORS.mediumGray, lineWidth: 0.1 },
        headStyles: { fillColor: PDF_COLORS.primary, textColor: PDF_COLORS.textOnPrimary, fontStyle: 'bold', halign: 'center', fontSize: 8.5, lineWidth: 0.1, lineColor: PDF_COLORS.primary },
        alternateRowStyles: { fillColor: PDF_COLORS.lightGray },
        columnStyles: { 0: { halign: 'center', cellWidth: 12 }, 1: { halign: 'left', cellWidth: 25 }, 2: { halign: 'left', cellWidth: 'auto'}, 3: { halign: 'right', cellWidth: 22 }, 4: { halign: 'right', cellWidth: 22 } },
        margin: { left: margin, right: margin },
        pageBreak: 'avoid', 
        maxHeight: maxTableHeight > 0 ? maxTableHeight : 10, 
        didDrawPage: (data) => { y = data.cursor.y; } 
    });
    y = doc.lastAutoTable.finalY || y; 
    y += gapAfterTable; 

    const totalsXLabel = pageWidth - margin - 50; 
    const totalsXValue = pageWidth - margin;       
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(PDF_COLORS.textSecondary);
    doc.text("Subtotal:", totalsXLabel, y, { align: 'right' });
    doc.text(`$${(saleDataForPdf.subtotalGeneral || 0).toFixed(2)}`, totalsXValue, y, { align: 'right' });
    y += 5;
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(PDF_COLORS.primary);
    doc.text("TOTAL VENTA:", totalsXLabel, y, { align: 'right' });
    doc.text(`$${(saleDataForPdf.totalVenta || 0).toFixed(2)}`, totalsXValue, y, { align: 'right' });
    y += gapBeforeFooterLine;

    doc.setDrawColor(PDF_COLORS.mediumGray);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += footerLineAndGapAfter;

    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(PDF_COLORS.textSecondary);
    const signatureLineTextVoucher = "_______________________";
    const signatureLineWidthVoucher = doc.getTextWidth(signatureLineTextVoucher);
    
    const firmaClienteXCenter = margin + (contentWidth / 4);
    const firmaVendedorXCenter = pageWidth - margin - (contentWidth / 4);
    const signatureTextYBase = y + 8; 
    
    doc.text(signatureLineTextVoucher, firmaClienteXCenter - (signatureLineWidthVoucher / 2), signatureTextYBase);
    doc.text("Firma Cliente", firmaClienteXCenter, signatureTextYBase + 5, {align: 'center'});
    doc.text("(Recibí Conforme)", firmaClienteXCenter, signatureTextYBase + 9, {align: 'center'});

    doc.text(signatureLineTextVoucher, firmaVendedorXCenter - (signatureLineWidthVoucher / 2), signatureTextYBase);
    doc.text("Firma Vendedor", firmaVendedorXCenter, signatureTextYBase + 5, {align: 'center'});
    doc.text(`(${STORE_INFO.name})`, firmaVendedorXCenter, signatureTextYBase + 9, {align: 'center'});
    y += signaturesBlockHeight; 

    doc.setFontSize(7); doc.setTextColor(PDF_COLORS.mediumGray);
    doc.text(STORE_INFO.address, pageWidth / 2, y, { align: 'center', maxWidth: contentWidth - 20 });
    y += 3.5; 
    doc.text(`Teléfonos: ${STORE_INFO.phone} | Email: ${STORE_INFO.email}`, pageWidth / 2, y, { align: 'center' });
    y += 3.5;
    doc.text(`Website: ${STORE_INFO.website}`, pageWidth / 2, y, { align: 'center' });
    y += 4;

    doc.setFontSize(7.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(PDF_COLORS.textSecondary);
    doc.text("¡Gracias por su compra! Esperamos verlo pronto.", pageWidth / 2, y, { align: 'center' });

    if (y > pageHeight - margin) {
        console.warn("Voucher content might be slightly overflowing. Review spacing or font sizes.");
    }

    doc.autoPrint({variant: 'non-conform'});
    window.open(doc.output('bloburl'), '_blank');
  };

  const drawCommonPdfHeader = (doc, saleDataForPdf, title, branch = STORE_INFO.defaultBranch) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 12;
    const contentWidth = pageWidth - (margin * 2);
    let y = margin;
    const currentLogoToUse = logoError ? FALLBACK_LOGO_BASE64 : logoBase64;

    const logoWidth = 45; 
    const logoHeight = (logoWidth * 46) / 188; 
    
    try {
        if(currentLogoToUse) doc.addImage(currentLogoToUse, 'PNG', margin, y, logoWidth, logoHeight);
    } catch(e) { console.error("Error adding logo to PDF:", e); }

    const storeInfoX = margin + logoWidth + 7;
    const storeInfoWidth = contentWidth - logoWidth - 7;

    doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(PDF_COLORS.primary);
    doc.text(STORE_INFO.name.toUpperCase(), storeInfoX, y + 6, { maxWidth: storeInfoWidth });
    
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(PDF_COLORS.textSecondary);
    doc.text(`RUC: ${STORE_INFO.ruc}`, storeInfoX, y + 11, { maxWidth: storeInfoWidth });
    
    const branchText = branch;
    const currentDateText = formatDateForPdf(new Date(), { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(PDF_COLORS.textPrimary);
    doc.text(branchText.toUpperCase(), pageWidth - margin, y + 6, { align: 'right' });
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(PDF_COLORS.textSecondary);
    doc.text(currentDateText, pageWidth - margin, y + 11, { align: 'right' });

    y += Math.max(logoHeight, 15) + 7; 
    
    doc.setFillColor(PDF_COLORS.secondary); 
    doc.rect(margin, y, contentWidth, 10, 'F');
    doc.setFontSize(15); doc.setFont('helvetica', 'bold'); doc.setTextColor(PDF_COLORS.textOnSecondary);
    doc.text(title, pageWidth / 2, y + 7, { align: 'center' });
    y += 10 + 5; 

    return y; 
  };

  const drawClientInfoForFinancing = (doc, saleDataForPdf, startY) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 12;
    let y = startY;

    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(PDF_COLORS.textSecondary);
    const labelX = margin + 2;
    const valueX = margin + 35;
    const col2LabelX = pageWidth / 2 + 5;
    const col2ValueX = pageWidth / 2 + 30;
    const itemMaxWidth = (pageWidth / 2) - margin - 35; 

    doc.setFont('helvetica', 'bold'); doc.text("Cliente:", labelX, y);
    doc.setFont('helvetica', 'normal'); doc.text(`${saleDataForPdf.clienteNombre || 'N/A'}`, valueX, y, { maxWidth: itemMaxWidth });
    
    doc.setFont('helvetica', 'bold'); doc.text("Cédula / RUC:", col2LabelX, y);
    doc.setFont('helvetica', 'normal'); doc.text(`${saleDataForPdf.clienteIdentificacion || 'N/A'}`, col2ValueX, y, { maxWidth: itemMaxWidth });
    y += 5;

    doc.setFont('helvetica', 'bold'); doc.text("Dirección:", labelX, y);
    doc.setFont('helvetica', 'normal'); doc.text(`${saleDataForPdf.clienteDireccion || 'N/A'}`, valueX, y, { maxWidth: itemMaxWidth });

    doc.setFont('helvetica', 'bold'); doc.text("Celular:", col2LabelX, y);
    doc.setFont('helvetica', 'normal'); doc.text(`${saleDataForPdf.clienteCelular || 'N/A'}`, col2ValueX, y, { maxWidth: itemMaxWidth });
    y += 5;
    
    doc.setFont('helvetica', 'bold'); doc.text("Producto(s):", labelX, y);
    doc.setFont('helvetica', 'normal');
    const productoPrincipal = saleDataForPdf.items.length > 1
        ? saleDataForPdf.items[0].descripcion.substring(0,30) + "... y otros."
        : (saleDataForPdf.items[0]?.descripcion.substring(0,40) || "N/A");
    doc.text(productoPrincipal, valueX, y, { maxWidth: pageWidth - margin - valueX }); 
    y += 7;
    
    doc.setDrawColor(PDF_COLORS.mediumGray);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y); 
    y += 5;

    return y;
  };

  const drawPaymentSchedulePageContent = (doc, saleDataForPdf, start_y = 10) => {
    let y_coord = drawCommonPdfHeader(doc, saleDataForPdf, "CRONOGRAMA DE PAGOS", saleDataForPdf.branch || STORE_INFO.defaultBranch);
    y_coord = drawClientInfoForFinancing(doc, saleDataForPdf, y_coord);

    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12; 
    const marginBottom = 15; 
    
    const headSchedule = [['Nº CUOTA', 'FECHA DE VENCIMIENTO', 'VALOR CUOTA ($)']];
    const bodySchedule = saleDataForPdf.tablaPagos.map(cuota => [
        cuota.cuotaNumero,
        formatDateForPdf(cuota.fechaVencimiento, {day:'2-digit',month:'long',year:'numeric', timeZone: 'UTC'}),
        `$${(cuota.valorCuota || 0).toFixed(2)}`,
    ]);
    
    let tableFontSize = 8.5;
    let cellPaddingVertical = 3; 
    let minRowHeightSchedule = 12; 

    if (bodySchedule.length > 20) {
        tableFontSize = 7.5;
        cellPaddingVertical = 2;
        minRowHeightSchedule = 10;
    } else if (bodySchedule.length > 15) {
        tableFontSize = 8;
        cellPaddingVertical = 2.5;
        minRowHeightSchedule = 11;
    }
    
    const estimatedFooterHeightSchedule = 85; 
    const availableHeightForTable = pageHeight - y_coord - marginBottom - estimatedFooterHeightSchedule;

    autoTable(doc, { 
        head: headSchedule, 
        body: bodySchedule, 
        startY: y_coord, 
        theme: 'striped', 
        styles: { 
            fontSize: tableFontSize, 
            cellPadding: {top: cellPaddingVertical, right: 2, bottom: cellPaddingVertical, left: 2}, 
            textColor: PDF_COLORS.textPrimary, 
            lineColor: PDF_COLORS.mediumGray, 
            lineWidth: 0.1, 
            valign: 'middle' 
        }, 
        headStyles: { 
            fillColor: PDF_COLORS.primary, 
            textColor: PDF_COLORS.textOnPrimary, 
            fontStyle: 'bold', 
            halign: 'center', 
            fontSize: tableFontSize + 0.5, 
            lineWidth: 0.1, 
            lineColor: PDF_COLORS.primary, 
            valign: 'middle' 
        }, 
        bodyStyles: { 
            minCellHeight: minRowHeightSchedule, 
            lineWidth: 0.1, 
            lineColor: PDF_COLORS.mediumGray,
            valign: 'middle' 
        },
        alternateRowStyles: { fillColor: PDF_COLORS.lightGray },
        columnStyles: { 
            0: {halign: 'center', cellWidth: 25}, 
            1: {halign: 'left', cellWidth: 80},  
            2: {halign: 'right', cellWidth: 45}  
        },
        margin: { left: margin + 5, right: margin + 5 }, 
        tableWidth: 'auto', 
        maxHeight: availableHeightForTable > 0 ? availableHeightForTable : 10, 
        pageBreak: 'auto', 
        didDrawPage: (data) => { y_coord = data.cursor.y; }
    });
    y_coord = (doc).lastAutoTable.finalY + 8; 

    drawScheduleFooter(doc, y_coord, saleDataForPdf, pageHeight, margin, marginBottom); 
  };

  const drawScheduleFooter = (currentDoc, startY, saleDataForPdf, pageHeight, margin, marginBottom) => {
    let localY = startY;
    const contentWidthForFooter = currentDoc.internal.pageSize.getWidth() - (margin * 2);

    currentDoc.setFontSize(9); currentDoc.setTextColor(PDF_COLORS.textPrimary); currentDoc.setFont('helvetica', 'bold');
    currentDoc.text(`ENTRADA PAGADA: `, margin, localY); 
    currentDoc.setFont('helvetica', 'normal'); currentDoc.text(`$${(saleDataForPdf.entrada || 0).toFixed(2)}`, margin + 40, localY); 
    localY += 6;

    currentDoc.setFontSize(7); currentDoc.setFont('helvetica', 'normal'); currentDoc.setTextColor(PDF_COLORS.textSecondary);
    const clientNoticeLines = [ 
        "ESTIMADO CLIENTE, le recomendamos que a partir de la fecha establecida de pago Ud cuenta con 5 dias de gracia para realizar el pago sin recargo de INTERES",
        "POR MORA. En caso de no Cumplir con el pago en las fechas establecidas incluyendo los 5 dias de gracia Ud debera cancelar $10 por el cobro de recargos de ",
        `cobranza por pago tardio de cuotas. Los pagos puede realizarlos a traves de DEPOSITOS o TRANSFERENCIAS ala CTA privada del Almacen o Acercarse directamente al Local ${STORE_INFO.name.toUpperCase()}.`
    ];
    
    clientNoticeLines.forEach(line => {
        const splitLines = currentDoc.splitTextToSize(line, contentWidthForFooter);
        currentDoc.text(splitLines, margin, localY);
        localY += (splitLines.length * 3.5); 
    });
    localY += 5; 

    currentDoc.setFontSize(8.5); currentDoc.setTextColor(PDF_COLORS.textPrimary);
    const signatureLineTextSchedule = "_____________________________"; 
    const signatureLineWidthSchedule = currentDoc.getTextWidth(signatureLineTextSchedule);
    
    const firstSignatureCenterX = margin + (contentWidthForFooter / 4);
    const secondSignatureCenterX = margin + (contentWidthForFooter * 3 / 4);
    const signatureTextYBaseSchedule = localY + 8;

    currentDoc.text(signatureLineTextSchedule, firstSignatureCenterX - (signatureLineWidthSchedule / 2), signatureTextYBaseSchedule);
    currentDoc.setFont('helvetica', 'bold');
    currentDoc.text("FIRMA CLIENTE", firstSignatureCenterX, signatureTextYBaseSchedule + 5, {align: 'center'});
    currentDoc.setFont('helvetica', 'normal');
    currentDoc.text(`C.I.: ${saleDataForPdf.clienteIdentificacion || '________________'}`, firstSignatureCenterX, signatureTextYBaseSchedule + 10, {align: 'center'});
    
    currentDoc.text(signatureLineTextSchedule, secondSignatureCenterX - (signatureLineWidthSchedule / 2), signatureTextYBaseSchedule);
    currentDoc.setFont('helvetica', 'bold');
    currentDoc.text("JEFE DE TIENDA/AUTORIZADO", secondSignatureCenterX, signatureTextYBaseSchedule + 5, {align: 'center'});
    currentDoc.setFont('helvetica', 'normal');
    currentDoc.text(`${STORE_INFO.name}`, secondSignatureCenterX, signatureTextYBaseSchedule + 10, {align: 'center'});
    localY = signatureTextYBaseSchedule + 15; 
  };


  const drawPaymentPlanPageContent = (doc, saleDataForPdf, start_y = 10) => {
    let y_coord = drawCommonPdfHeader(doc, saleDataForPdf, "PLAN DE PAGOS DETALLADO", "GIRON"); 
    y_coord = drawClientInfoForFinancing(doc, saleDataForPdf, y_coord);

    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    const tablePageMargin = margin; 
    const contentWidth = doc.internal.pageSize.getWidth() - (tablePageMargin * 2); 
    const marginBottom = 15;
    
    const headPlan = [['Nº', 'FECHA PAGO', 'VALOR CUOTA ($)', 'FIRMA DE ABONO', 'OBSERVACIONES']];
    const bodyPlan = saleDataForPdf.tablaPagos.map(cuota => [ 
        cuota.cuotaNumero, 
        formatDateForPdf(cuota.fechaVencimiento, {day:'2-digit',month:'short',year:'2-digit', timeZone: 'UTC'}), 
        `$${(cuota.valorCuota || 0).toFixed(2)}`, 
        '', 
        ''  
    ]);
    
    let tableFontSizePlan = 8; 
    let minRowHeightPlan = 15; 
    let cellPaddingVerticalPlan = 2.5; 

    if (bodyPlan.length > 15) { 
        tableFontSizePlan = 7.5;
        minRowHeightPlan = 12;
        cellPaddingVerticalPlan = 2;
    } else if (bodyPlan.length > 10) { 
        tableFontSizePlan = 8;
        minRowHeightPlan = 14;
        cellPaddingVerticalPlan = 2.2;
    }

    const colWidths = {
        num: 12,    
        fecha: 30,  
        valor: 25,  
        firma: 40,  
        obs: 0 
    };
    colWidths.obs = contentWidth - (colWidths.num + colWidths.fecha + colWidths.valor + colWidths.firma);
    
    const estimatedFooterHeightPlan = 35; 
    const availableHeightForTablePlan = pageHeight - y_coord - marginBottom - estimatedFooterHeightPlan;
    
    autoTable(doc, { 
        head: headPlan, 
        body: bodyPlan, 
        startY: y_coord, 
        theme: 'grid', 
        styles: { 
            fontSize: tableFontSizePlan, 
            cellPadding: {top: cellPaddingVerticalPlan, right: 1.5, bottom: cellPaddingVerticalPlan, left: 1.5}, 
            textColor: PDF_COLORS.textPrimary, 
            lineColor: PDF_COLORS.mediumGray, 
            lineWidth: 0.1,
            valign: 'middle', 
        }, 
        headStyles: { 
            fillColor: PDF_COLORS.darkGray, 
            textColor: PDF_COLORS.white, 
            fontStyle: 'bold', 
            halign: 'center', 
            fontSize: tableFontSizePlan + 0.5,
            lineWidth: 0.1, 
            lineColor: PDF_COLORS.darkGray,
            valign: 'middle',
        }, 
        bodyStyles: {
            minCellHeight: minRowHeightPlan, 
            lineWidth: 0.1,
            lineColor: PDF_COLORS.mediumGray,
            valign: 'middle',
        },
        columnStyles: { 
            0: {halign: 'center', cellWidth: colWidths.num},     
            1: {halign: 'center', cellWidth: colWidths.fecha},   
            2: {halign: 'right', cellWidth: colWidths.valor},    
            3: {halign: 'center', cellWidth: colWidths.firma},   
            4: {halign: 'left', cellWidth: colWidths.obs}        
        },
        tableLineWidth: 0.1, 
        tableLineColor: PDF_COLORS.darkGray,
        margin: { left: tablePageMargin, right: tablePageMargin }, 
        maxHeight: availableHeightForTablePlan > 0 ? availableHeightForTablePlan : 10,
        pageBreak: 'auto',
        didDrawPage: (data) => { y_coord = data.cursor.y; }
    });
    y_coord = (doc).lastAutoTable.finalY + 10;

    const signatureBlockHeight = 35; 
    if ( (pageHeight - y_coord - marginBottom) < signatureBlockHeight ) {
        doc.addPage();
        y_coord = margin + 10; 
    }
    
    doc.setFontSize(8.5); doc.setTextColor(PDF_COLORS.textPrimary);
    const signatureLineTextPlan = "_____________________________";
    const signatureLineWidthPlan = doc.getTextWidth(signatureLineTextPlan);

    const firstSignatureCenterXPlan = tablePageMargin + (contentWidth / 4);
    const secondSignatureCenterXPlan = tablePageMargin + (contentWidth * 3 / 4);
    const signatureTextYBasePlan = y_coord + 8;

    doc.text(signatureLineTextPlan, firstSignatureCenterXPlan - (signatureLineWidthPlan / 2), signatureTextYBasePlan);
    doc.setFont('helvetica', 'bold');
    doc.text("FIRMA CLIENTE", firstSignatureCenterXPlan, signatureTextYBasePlan + 5, {align: 'center'});
    
    doc.text(signatureLineTextPlan, secondSignatureCenterXPlan - (signatureLineWidthPlan / 2), signatureTextYBasePlan);
    doc.text("RESPONSABLE COBROS", secondSignatureCenterXPlan, signatureTextYBasePlan + 5, {align: 'center'});
    doc.setFont('helvetica', 'normal');
    doc.text(`(${STORE_INFO.name} - Girón)`, secondSignatureCenterXPlan, signatureTextYBasePlan + 9, {align: 'center'});
  };
  
  const generateCombinedFinancedPdf = (saleDataForPdf) => {
    if (!logoBase64 && !logoError) { setError("El logo aún no ha cargado."); return; }
    if (saleDataForPdf.tipoPago !== 'financiado' || !saleDataForPdf.tablaPagos?.length) { 
        setError("No hay datos de financiación válidos para generar el PDF combinado."); 
        return; 
    }
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const margin = 12; 

    drawPaymentSchedulePageContent(doc, saleDataForPdf);
    doc.addPage();
    drawPaymentPlanPageContent(doc, saleDataForPdf);
    
    const totalPages = doc.getNumberOfPages ? doc.getNumberOfPages() : doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(PDF_COLORS.mediumGray);
      const pageText = `Página ${i} de ${totalPages}`;
      const textWidth = doc.getTextWidth(pageText);
      doc.text(pageText, doc.internal.pageSize.getWidth() - margin - textWidth, doc.internal.pageSize.getHeight() - 7);
      doc.setFontSize(7);
      doc.text(STORE_INFO.name, margin, doc.internal.pageSize.getHeight() - 7);
    }

    doc.autoPrint({variant: 'non-conform'}); 
    window.open(doc.output('bloburl'), '_blank');
  };

  const handleRegisterSale = async () => {
    clearMessages();
    if (!logoLoaded && !logoError) { setError("El logo está cargando, por favor espere un momento."); return; }
    if (logoError && !logoBase64.startsWith(FALLBACK_LOGO_BASE64.substring(0,50))) { 
        setError(`Error al cargar el logo principal (${logoError}). Se usará un logo de respaldo para los PDFs.`);
    }
    if (!selectedClient) { setError("Selecciona un cliente."); return; }
    if (saleItems.length === 0) { setError("Agrega productos a la venta."); return; }
    const entradaNum = parseFloat(entrada) || 0;
    if (paymentType === 'financiado' && saldoAFinanciar > 0 && !selectedFactorPlazoData) { setError("Selecciona un plazo de financiación."); return; }
    if (paymentType === 'financiado' && !paymentStartDate && saldoAFinanciar > 0) { setError("Selecciona una fecha de inicio de pagos."); return; }
    if (paymentType === 'financiado' && entradaNum > subtotalGeneral) { setError("La entrada no puede ser mayor al subtotal."); return; }
    if (paymentType === 'financiado' && saldoAFinanciar < 0 && entradaNum > 0 ) { setError("El saldo a financiar es negativo, revisa la entrada. La entrada no puede exceder el total si no hay saldo a financiar."); return;}

    setLoadingSale(true);
    const batch = writeBatch(db);
    const saleDataToSave = {
      clienteId: selectedClient.value,
      clienteNombre: selectedClient.label.substring(0, selectedClient.label.lastIndexOf('(') -1).trim(),
      clienteIdentificacion: selectedClient.identificacion,
      clienteDireccion: selectedClient.direccion || '',
      clienteCelular: selectedClient?.celular || selectedClient?.telefono || '',
      fechaVenta: serverTimestamp(),
      tipoPago: paymentType,
      items: saleItems.map(item => ({
        productoId: item.productoId,
        codigo: item.codigo,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precioUnitarioOriginal: item.precioUnitarioOriginal,
        precioUnitarioVenta: item.precioUnitarioVenta,
        subtotalItem: item.subtotalItem,
        categoriaNombre: item.categoriaNombre
      })),
      subtotalGeneral: parseFloat(subtotalGeneral.toFixed(2)),
      entrada: paymentType === 'financiado' ? entradaNum : 0,
      saldoFinanciado: paymentType === 'financiado' ? parseFloat(saldoAFinanciar.toFixed(2)) : 0,
      totalVenta: parseFloat(totalVenta.toFixed(2)),
      estadoVenta: "completada",
      vendedorId: currentUser.uid,
      vendedorEmail: currentUser.email,
      branch: STORE_INFO.defaultBranch, 
    };

    if (paymentType === 'financiado' && selectedFactorPlazoData) {
      saleDataToSave.factorPlazoSeleccionado = {
        factorPlazoId: selectedFactorPlazoData.value,
        cantidadMes: selectedFactorPlazoData.cantidadMes,
        factorPlazo: selectedFactorPlazoData.factorPlazo,
        factorTasa: selectedFactorPlazoData.factorTasa,
      };
      saleDataToSave.valorCuota = valorCuotaFinal;
      saleDataToSave.totalPagadoFinanciado = parseFloat(totalPagadoFinanciado.toFixed(2));
      const startDateParts = paymentStartDate.split('-');
      saleDataToSave.fechaInicioPagos = new Date(Date.UTC(parseInt(startDateParts[0]), parseInt(startDateParts[1]) - 1, parseInt(startDateParts[2])));
      saleDataToSave.tablaPagos = paymentScheduleData.map(p => ({
        ...p,
        fechaVencimiento: p.fechaVencimiento instanceof Date ? p.fechaVencimiento : new Date(p.fechaVencimiento) 
      }));
    }

    const saleDocRef = doc(collection(db, "sales"));
    batch.set(saleDocRef, saleDataToSave);

    const productStockUpdates = [];
    for (const item of saleItems) {
      const productRef = doc(db, "products", item.productoId);
      productStockUpdates.push(
        getDoc(productRef).then(productSnap => {
          if (!productSnap.exists()) throw new Error(`Producto ${item.descripcion} (ID: ${item.productoId}) no encontrado en la base de datos.`);
          const currentStock = productSnap.data().stock;
          if (currentStock < item.cantidad) throw new Error(`Stock de ${item.descripcion} insuficiente (Disponible: ${currentStock}, Solicitado: ${item.cantidad}).`);
          batch.update(productRef, { stock: currentStock - item.cantidad });
        })
      );
    }

    try {
      await Promise.all(productStockUpdates);
      await batch.commit();
      
      const dataForPdf = {
        ...saleDataToSave,
        id: saleDocRef.id, 
        fechaVenta: new Date(), 
        fechaInicioPagos: saleDataToSave.fechaInicioPagos instanceof Date ? saleDataToSave.fechaInicioPagos : (saleDataToSave.fechaInicioPagos?.toDate ? saleDataToSave.fechaInicioPagos.toDate() : null),
        tablaPagos: saleDataToSave.tablaPagos?.map(p => ({
            ...p,
            fechaVencimiento: p.fechaVencimiento instanceof Date ? p.fechaVencimiento : (p.fechaVencimiento?.toDate ? p.fechaVencimiento.toDate() : new Date(p.fechaVencimiento))
        })) || []
      };
      
      if (dataForPdf.tipoPago === 'contado') {
        generateA4SaleVoucherPdf(dataForPdf);
        setSuccess("¡Venta (Contado) registrada! Comprobante generado.");
      } else if (dataForPdf.tipoPago === 'financiado') {
        if (dataForPdf.tablaPagos && dataForPdf.tablaPagos.length > 0 && saldoAFinanciar > 0) { 
            generateCombinedFinancedPdf(dataForPdf);
            setSuccess("¡Venta (Financiada) registrada! Documentos generados.");
        } else { 
            generateA4SaleVoucherPdf(dataForPdf); 
            setSuccess("Venta (Financiada con entrada completa o sin cuotas) registrada. Comprobante de venta generado.");
        }
      }
      
      setSelectedClient(null);
      setPaymentType('contado');
      setSaleItems([]);
      setEntrada(0);
      setSelectedFactorPlazoData(null);
      const today = new Date();
      today.setMonth(today.getMonth() + 1);
      setPaymentStartDate(today.toISOString().split('T')[0]);

    } catch (e) {
      console.error("Error al registrar venta o generar PDF: ", e);
      setError(`Error: ${e.message}. La venta no se completó.`);
    } finally {
      setLoadingSale(false);
    }
  };

  if (pageLoading) { 
    return <div className="flex justify-center items-center h-screen"><FiLoader className="animate-spin text-4xl text-secondary" /><p className="ml-3 text-lg text-text-muted-light dark:text-text-muted-dark">Cargando datos y recursos...</p></div>;
  }

  return (
    <div className="animate-fade-in p-4 md:p-6 space-y-6"> {/* Added more padding and space between sections */}
      <SaleHeader />
      <NotificationMessages error={error || (logoError && !logoBase64.startsWith(FALLBACK_LOGO_BASE64.substring(0,50)) ? logoError : '')} success={success} /> 
      
      <ClientInfoSection 
        clients={clients}
        selectedClient={selectedClient}
        setSelectedClient={setSelectedClient}
        paymentType={paymentType}
        setPaymentType={setPaymentType}
        setSelectedFactorPlazoData={setSelectedFactorPlazoData}
        setEntrada={setEntrada}
      />

      {selectedClient && paymentType && (
        <ProductSearch 
          productSearchTerm={productSearchTerm}
          setProductSearchTerm={setProductSearchTerm}
          productSearchResults={productSearchResults}
          handleOpenItemModal={handleOpenItemModal}
          inputBaseClasses={inputBaseClasses}
          inputLightMode={inputLightMode}
          inputDarkMode={inputDarkMode}
          products={products}
        />
      )}

      <SaleItemModal 
        isOpen={isItemModalOpen}
        item={currentItemForModal}
        onClose={() => setIsItemModalOpen(false)}
        onSave={handleSaveItemToSale}
        quantity={itemModalQuantity}
        setQuantity={setItemModalQuantity}
        price={itemModalPrice}
        setPrice={setItemModalPrice}
        paymentType={paymentType}
        inputBaseClasses={inputBaseClasses}
        inputLightMode={inputLightMode}
        inputDarkMode={inputDarkMode}
        products={products}
      />

      {saleItems.length > 0 && (
        <SaleCartView 
          items={saleItems}
          onEdit={handleEditItemInCart}
          onRemove={handleRemoveItemFromSale}
          subtotalGeneral={subtotalGeneral}
        />
      )}

      {paymentType === 'financiado' && saleItems.length > 0 && (
        <>
          <FinancingDetailsForm
            entrada={entrada}
            setEntrada={setEntrada}
            subtotalGeneral={subtotalGeneral}
            factorPlazos={factorPlazos}
            selectedFactorPlazoData={selectedFactorPlazoData}
            setSelectedFactorPlazoData={setSelectedFactorPlazoData}
            paymentStartDate={paymentStartDate}
            setPaymentStartDate={setPaymentStartDate}
            saldoAFinanciar={saldoAFinanciar}
            inputBaseClasses={inputBaseClasses}
            inputLightMode={inputLightMode}
            inputDarkMode={inputDarkMode}
          />
          <FinancingSummary 
            subtotalGeneral={subtotalGeneral}
            entrada={entrada}
            saldoAFinanciar={saldoAFinanciar}
            selectedFactorPlazoData={selectedFactorPlazoData}
            valorCuotaFinal={valorCuotaFinal}
            totalPagadoFinanciado={totalPagadoFinanciado}
          />
        </>
      )}
      
      {paymentType === 'financiado' && paymentScheduleData.length > 0 && saldoAFinanciar > 0 && (
        <PaymentScheduleTable schedule={formattedPaymentScheduleForUI} />
      )}

      {saleItems.length > 0 && selectedClient && (
        <ActionButtons 
          onRegister={handleRegisterSale}
          loadingSale={loadingSale}
          paymentType={paymentType}
          saldoAFinanciar={saldoAFinanciar}
          selectedFactorPlazoData={selectedFactorPlazoData}
          paymentStartDate={paymentStartDate}
          entrada={entrada}
          logoLoaded={logoLoaded} 
          logoError={logoError && !logoBase64.startsWith(FALLBACK_LOGO_BASE64.substring(0,50)) ? logoError : null}
        />
      )}
    </div>
  );
};

export default SalesPage;