// src/pages/dashboard/PaymentProcessingPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../../firebase/config';
import {
  collection, query, where, getDocs, doc, updateDoc, getDoc,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import Select from 'react-select';
import {
  FiDollarSign, FiUsers, FiCalendar, FiCheck, FiX, FiLoader,
  FiAlertCircle, FiCheckCircle, FiPrinter,
  FiCheckSquare, FiThumbsUp, FiEdit, FiList, FiFileText 
} from 'react-icons/fi';
import jsPDF from 'jspdf';

// --- Constantes ---
const FALLBACK_LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAABVJREFUOE9jZKAQMFIwCFMFDAwAAHoAAcs30HZuAAAAAElFTkSuQmCC";

const STORE_INFO = {
  name: "Renatto's Almacenes",
  slogan: "COMODIDAD PARA TU HOGAR",
  address: "San Gerardo-Girón-Azuay",
  phone: "+593 97 988 1804",
  ruc: "0106338114001",
  email: "info@renattos.com",
  website: "www.renattos.com",
  defaultBranch: "SAN GERARDO" 
};

const PDF_COLORS = {
  black: '#000000',
  darkGray: '#333333', // For main text
  mediumGray: '#666666', // For labels, secondary text
  lightGray: '#A9A9A9', // For borders, subtle lines
  lighterGray: '#EEEEEE', // For very light backgrounds
  white: '#FFFFFF',
  yellowAccent: '#FFC107', // Renatto's Yellow
  greenText: '#28a745', 
  redText: '#dc3545',
};

const DEFAULT_PENALTY_AMOUNT = 10; 
const GRACE_PERIOD_DAYS = 5;

// Helper to draw a divider line in PDF
const drawDividerLine = (doc, y, margin, pageWidth, color = PDF_COLORS.lightGray, thickness = 0.2) => {
    doc.setDrawColor(color);
    doc.setLineWidth(thickness);
    doc.line(margin, y, pageWidth - margin, y);
    return y + thickness; 
};

const PaymentProcessingPage = () => {
  const currentUser = auth.currentUser;

  const [logoBase64, setLogoBase64] = useState(null);
  const [logoErrorMsg, setLogoErrorMsg] = useState(null);
  const [logoLoaded, setLogoLoaded] = useState(false);

  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSalesForSelection, setClientSalesForSelection] = useState([]); 
  const [selectedSale, setSelectedSale] = useState(null);
  const [currentFactorPlazoDoc, setCurrentFactorPlazoDoc] = useState(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [currentInstallment, setCurrentInstallment] = useState(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentReference, setPaymentReference] = useState('');

  const [isPenaltyApplicable, setIsPenaltyApplicable] = useState(false); 
  const [inputAppliedPenalty, setInputAppliedPenalty] = useState('0.00'); 
  const [isInstallmentFreeNow, setIsInstallmentFreeNow] = useState(false);
  const [installmentBalanceDue, setInstallmentBalanceDue] = useState(0); 
  const [paymentAmountInput, setPaymentAmountInput] = useState(''); 

  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingSales, setLoadingSales] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [loadingFactorPlazo, setLoadingFactorPlazo] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = '/logo.png'; 

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_LOGO_DIM_PDF = 200;
      const scale = Math.min(MAX_LOGO_DIM_PDF / img.naturalWidth, MAX_LOGO_DIM_PDF / img.naturalHeight, 1);
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      try {
        const base64 = canvas.toDataURL('image/png');
        setLogoBase64(base64);
      } catch (e) {
        console.error("Error converting image to Base64:", e);
        setLogoErrorMsg("Error al procesar el logo.");
        setLogoBase64(FALLBACK_LOGO_BASE64);
      } finally {
        setLogoLoaded(true);
      }
    };
    img.onerror = () => {
      console.error("Error loading logo image from /public/logo.png. Using fallback.");
      setLogoErrorMsg("No se pudo cargar el logo. Usando logo de respaldo.");
      setLogoBase64(FALLBACK_LOGO_BASE64);
      setLogoLoaded(true);
    };
  }, []);

  const inputBaseClasses = "w-full px-3 py-2 border rounded-md focus:outline-none transition-all duration-150 text-text-dark dark:text-text-light placeholder-text-muted-light dark:placeholder-text-muted-dark";
  const inputLightMode = "border-ui-border-light focus:ring-2 focus:ring-secondary focus:border-secondary bg-background-light";
  const inputDarkMode = "dark:border-ui-border-dark dark:focus:ring-secondary dark:focus:border-secondary dark:bg-primary-light/10";

  const clearMessages = useCallback(() => { setError(''); setSuccess(''); }, []);

  useEffect(() => {
    if (error || success || logoErrorMsg) {
      const timer = setTimeout(() => {
        clearMessages();
        setLogoErrorMsg(''); 
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [error, success, logoErrorMsg, clearMessages]);

  useEffect(() => {
    setLoadingClients(true);
    const q = query(collection(db, "clients"), orderBy("nombres"));
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        setClients(snapshot.docs.map(docSnap => ({ value: docSnap.id, label: `${docSnap.data().nombres} ${docSnap.data().apellidos} (${docSnap.data().identificacion})`, ...docSnap.data() })));
        setLoadingClients(false);
      },
      (err) => {
        console.error("Error cargando clientes: ", err);
        setError("Error al cargar clientes.");
        setLoadingClients(false);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedClient?.value) {
      setLoadingSales(true);
      setSelectedSale(null);
      setCurrentFactorPlazoDoc(null);
      setClientSalesForSelection([]);

      const salesQuery = query(
        collection(db, "sales"),
        where("clienteId", "==", selectedClient.value),
        where("tipoPago", "==", "financiado"),
        orderBy("fechaVenta", "desc")
      );
      getDocs(salesQuery).then(snapshot => {
        const allSalesData = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        // For active credits list, filter those with pending payments
        setClientSalesForSelection(allSalesData.filter(s => s.tablaPagos?.some(p => p.estado !== 'pagada'))); 
        // For detailed history, we might pass the selectedSale directly later
        setLoadingSales(false);
      }).catch(err => {
        console.error("Error cargando ventas del cliente: ", err);
        setError("Error al cargar las ventas del cliente.");
        setLoadingSales(false);
      });
    } else {
      setClientSalesForSelection([]);
      setSelectedSale(null);
      setCurrentFactorPlazoDoc(null);
    }
  }, [selectedClient]);

  useEffect(() => {
    if (selectedSale?.factorPlazoSeleccionado?.factorPlazoId) {
      setLoadingFactorPlazo(true);
      const factorPlazoRef = doc(db, "factorPlazos", selectedSale.factorPlazoSeleccionado.factorPlazoId);
      getDoc(factorPlazoRef)
        .then(docSnap => {
          if (docSnap.exists()) {
            setCurrentFactorPlazoDoc({ id: docSnap.id, ...docSnap.data() });
          } else {
            setCurrentFactorPlazoDoc(null); 
            console.warn("FactorPlazo document not found for ID:", selectedSale.factorPlazoSeleccionado.factorPlazoId)
          }
        })
        .catch(err => {
          console.error("Error cargando factorPlazo:", err);
          setCurrentFactorPlazoDoc(null);
        })
        .finally(() => setLoadingFactorPlazo(false));
    } else {
      setCurrentFactorPlazoDoc(null);
    }
  }, [selectedSale]);

  const normalizeDate = (dateInput) => {
    if (!dateInput) return null;
    let d = dateInput;
    if (dateInput.toDate) d = dateInput.toDate(); 
    else if (!(dateInput instanceof Date)) d = new Date(dateInput); 

    if (d && !isNaN(d.getTime())) {
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    }
    console.warn("normalizeDate recibió fecha inválida:", dateInput);
    return null;
  };

  const formatDate = (dateInput, options = { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) => {
    const d = normalizeDate(dateInput);
    if (d) {
      return d.toLocaleDateString('es-EC', options);
    }
    return 'Fecha Inv.';
  };
  
  const calculateModalPaymentDetails = useCallback(() => {
    if (!currentInstallment || !selectedSale) return;
  
    const installmentOriginalValue = parseFloat(currentInstallment.valorCuota) || 0;
    const paidSoFarForThisInstallment = parseFloat(currentInstallment.montoAcumuladoPagado) || 0;
    
    let valueToConsiderForPayment = Math.max(0, installmentOriginalValue - paidSoFarForThisInstallment);
    let isFreeNow = false;
    let penaltyConditionMet = false;
    let defaultPenaltyIfApplicable = 0;
  
    const isLastInstallment = currentInstallment.cuotaNumero === selectedSale.tablaPagos?.length;
  
    if (isLastInstallment && currentFactorPlazoDoc?.ultimaCuotaGratis && !currentInstallment.fueCuotaGratisAplicada && valueToConsiderForPayment > 0) {
      let allPreviousPunctual = true;
      for (let i = 0; i < selectedSale.tablaPagos.length - 1; i++) {
        const prevInst = selectedSale.tablaPagos[i];
        if (prevInst.estado !== 'pagada') { allPreviousPunctual = false; break; }
        const lastPaymentOfPrevInst = prevInst.pagos && prevInst.pagos.length > 0 ? prevInst.pagos[prevInst.pagos.length - 1] : null;
        if (lastPaymentOfPrevInst) {
            const prevDueDate = normalizeDate(prevInst.fechaVencimiento);
            const prevPaymentDate = normalizeDate(lastPaymentOfPrevInst.fechaPago);
            if (!prevDueDate || !prevPaymentDate) { allPreviousPunctual = false; break; }
            const daysDiff = (prevPaymentDate.getTime() - prevDueDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysDiff > GRACE_PERIOD_DAYS) { allPreviousPunctual = false; break; }
        } else { allPreviousPunctual = false; break; }
      }
      if (allPreviousPunctual) {
        isFreeNow = true;
        valueToConsiderForPayment = 0; 
      }
    }
    
    const dueDate = normalizeDate(currentInstallment.fechaVencimiento);
    const actualPaymentD = normalizeDate(paymentDate); 

    if (dueDate && actualPaymentD && valueToConsiderForPayment > 0) { 
      const daysDifference = (actualPaymentD.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDifference > GRACE_PERIOD_DAYS) {
        penaltyConditionMet = true;
        defaultPenaltyIfApplicable = DEFAULT_PENALTY_AMOUNT;
      }
    }
    
    setIsPenaltyApplicable(penaltyConditionMet);
    setInputAppliedPenalty(penaltyConditionMet ? defaultPenaltyIfApplicable.toFixed(2) : '0.00');
    setIsInstallmentFreeNow(isFreeNow);
    
  }, [currentInstallment, selectedSale, currentFactorPlazoDoc, paymentDate]);
  
  useEffect(() => {
    if (isPaymentModalOpen && currentInstallment) {
      const installmentOriginalValue = parseFloat(currentInstallment.valorCuota) || 0;
      const paidSoFarForThisInstallment = parseFloat(currentInstallment.montoAcumuladoPagado) || 0;
      let valueToConsiderForPayment = Math.max(0, installmentOriginalValue - paidSoFarForThisInstallment);
      if(isInstallmentFreeNow) valueToConsiderForPayment = 0;

      const currentAppliedPenaltyNum = parseFloat(inputAppliedPenalty) || 0;
      const totalDue = valueToConsiderForPayment + currentAppliedPenaltyNum;
      
      setInstallmentBalanceDue(totalDue);
      setPaymentAmountInput(totalDue > 0 ? totalDue.toFixed(2) : '0.00');
    }
  }, [isPaymentModalOpen, currentInstallment, isInstallmentFreeNow, inputAppliedPenalty]);


  useEffect(() => {
    if (isPaymentModalOpen && currentInstallment && selectedSale) { 
      calculateModalPaymentDetails(); 
    }
  }, [isPaymentModalOpen, paymentDate, currentInstallment, selectedSale, currentFactorPlazoDoc, calculateModalPaymentDetails]);


  const handleOpenPaymentModal = (sale, installment) => {
    setSelectedSale(sale); 
    setCurrentInstallment(installment); 
    const todayStr = new Date().toISOString().split('T')[0];
    setPaymentDate(todayStr);
    setPaymentReference('');
    setInputAppliedPenalty('0.00'); 
    setError(''); setSuccess('');
    setIsPaymentModalOpen(true); 
  };
  
  const generatePaymentReceiptPdf = (receiptData) => {
    const { 
        sale, paidInstallmentInfo, client, cashierEmail, 
        amountPaidThisTx, penaltyPaidThisTx, isFreeThisTx, 
        balanceBeforeThisTxOnInst, balanceAfterThisTxOnInst 
    } = receiptData;

    if (!logoLoaded) { setError("Logo no cargado. Intente reimprimir."); return; }
    const logoToUse = logoBase64 || FALLBACK_LOGO_BASE64;

    // A4 dimensions: 210 x 297 mm. We'll use full width, and about 140mm height.
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const pageHeight = 145; // Target height for the receipt content on A4
    const margin = 10; 
    let y = margin;
    const contentWidth = pageWidth - (margin * 2);
    const lineSpacing = 4.5; 
    const smallLineSpacing = 3.5;
    const sectionGap = 6;
    const fieldLabelX = margin;
    const fieldValueX = margin + 45; // X position for values 
    const fieldValueMaxWidth = contentWidth - 45 - 2;

    // --- Header ---
    const headerRectHeight = 20;
    doc.setFillColor(PDF_COLORS.black); // Black header bar
    doc.rect(0, 0, pageWidth, headerRectHeight, 'F'); 
    
    const receiptLogoWidth = 35; 
    let receiptLogoHeight = 15; 
    try {
        const img = new Image(); 
        img.src = logoToUse;
        if (img.width > 0 && img.height > 0) { 
            receiptLogoHeight = (receiptLogoWidth * img.height) / img.width;
            if (receiptLogoHeight > headerRectHeight - 4) { // Ensure logo fits in header
                receiptLogoHeight = headerRectHeight - 4;
                // receiptLogoWidth = (receiptLogoHeight * img.width) / img.height; // Adjust width if height is capped
            }
        } else if (logoToUse === FALLBACK_LOGO_BASE64) { 
           receiptLogoHeight = Math.min(receiptLogoWidth, headerRectHeight - 4); 
        } 
        if(logoToUse) doc.addImage(logoToUse, 'PNG', margin, (headerRectHeight - receiptLogoHeight) / 2, receiptLogoWidth, receiptLogoHeight);
    } catch(e) { console.error("Error adding logo to PDF:", e); }
    
    const storeInfoStartX = margin + receiptLogoWidth + 8;
    const storeInfoMaxWidth = pageWidth - storeInfoStartX - margin;
    doc.setFontSize(16); 
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PDF_COLORS.yellowAccent); // Yellow for store name
    doc.text(STORE_INFO.name.toUpperCase(), storeInfoStartX, margin - 2, {maxWidth: storeInfoMaxWidth, align: 'left'});
    doc.setFontSize(7); 
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PDF_COLORS.white);
    doc.text(STORE_INFO.slogan, storeInfoStartX, margin + 2, {maxWidth: storeInfoMaxWidth, align: 'left'});
    doc.text(`RUC: ${STORE_INFO.ruc}`, storeInfoStartX, margin + 2 + smallLineSpacing, {maxWidth: storeInfoMaxWidth, align: 'left'});
    y = headerRectHeight + sectionGap; 

    // --- Receipt Title & Info ---
    doc.setFontSize(14); 
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PDF_COLORS.darkGray);
    const transactionIdForReceipt = paidInstallmentInfo.pagos && paidInstallmentInfo.pagos.length > 0 
                                  ? paidInstallmentInfo.pagos[paidInstallmentInfo.pagos.length - 1].transactionId || `TX-${Date.now().toString().slice(-5)}`
                                  : `TX-${Date.now().toString().slice(-5)}`;
    const receiptNumber = `CP-${sale.id.slice(-4)}-${paidInstallmentInfo.cuotaNumero}-${transactionIdForReceipt.slice(-4)}`;
    doc.text(`COMPROBANTE DE PAGO N° ${receiptNumber}`, margin, y);
    y += lineSpacing * 1.5;

    doc.setFontSize(8); 
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PDF_COLORS.mediumGray);
    
    let dateText = `${STORE_INFO.defaultBranch}, ${formatDate(new Date(), {day:'numeric', month:'long', year:'numeric'})}`;
    doc.text(dateText, pageWidth - margin, y, { align: 'right' });
    y += lineSpacing;

    doc.text(`Cajero: ${cashierEmail || 'N/A'}`, pageWidth - margin, y, { align: 'right' });
    y += sectionGap;
    y = drawDividerLine(doc, y, margin, pageWidth, PDF_COLORS.lightGray, 0.3) + sectionGap / 2;
    
    // --- Client Details ---
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(PDF_COLORS.darkGray);
    doc.text("CLIENTE:", margin, y);
    y += lineSpacing;
    
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(PDF_COLORS.mediumGray);
    const clientValueXAdjusted = margin + 28;
    doc.text("Nombre/Razón Social:", margin, y); 
    doc.setFont('helvetica', 'bold'); doc.setTextColor(PDF_COLORS.darkGray);
    doc.text(`${client?.label ? client.label.substring(0, client.label.lastIndexOf('(') -1).trim() : 'N/A'}`, clientValueXAdjusted, y, {maxWidth: contentWidth - 28});
    y += lineSpacing;

    doc.setFont('helvetica', 'normal'); doc.setTextColor(PDF_COLORS.mediumGray);
    doc.text("Cédula / RUC:", margin, y); 
    doc.setFont('helvetica', 'bold'); doc.setTextColor(PDF_COLORS.darkGray);
    doc.text(`${client?.identificacion || 'N/A'}`, clientValueXAdjusted, y);
    y += lineSpacing;

    doc.setFont('helvetica', 'normal'); doc.setTextColor(PDF_COLORS.mediumGray);
    doc.text("Teléfono:", margin, y); 
    doc.setFont('helvetica', 'bold'); doc.setTextColor(PDF_COLORS.darkGray);
    doc.text(`${client?.celular || client?.telefono || 'N/A'}`, clientValueXAdjusted, y);
    y += sectionGap;
    y = drawDividerLine(doc, y, margin, pageWidth, PDF_COLORS.lightGray, 0.3) + sectionGap / 2;

    // --- Payment Details ---
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(PDF_COLORS.darkGray);
    doc.text("CONCEPTO:", margin, y);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(PDF_COLORS.darkGray);
    doc.text(`Abono a Cuota N° ${paidInstallmentInfo.cuotaNumero} de ${sale.factorPlazoSeleccionado?.cantidadMes || sale.tablaPagos.length}, Venta ID: ${sale.id}`, margin + 25, y, {maxWidth: contentWidth - 25});
    y += lineSpacing * 1.5;

    // Table-like structure for amounts
    const detailCol1X = margin;
    const detailCol2X = contentWidth / 2 + margin - 20; // Start of second column (value)
    const detailCol2Width = contentWidth / 2 + 20;


    const renderAmountItem = (label, value, isTotal = false) => {
        doc.setFontSize(8);
        doc.setFont('helvetica', isTotal ? 'bold' : 'normal'); 
        doc.setTextColor(isTotal ? PDF_COLORS.black : PDF_COLORS.mediumGray);
        doc.text(label, detailCol1X, y, { align: 'left' });
        doc.setFont('helvetica', 'bold'); 
        doc.setTextColor(isTotal ? PDF_COLORS.black : PDF_COLORS.darkGray);
        doc.text(`$${value.toFixed(2)}`, pageWidth - margin, y, { align: 'right'});
        y += isTotal ? lineSpacing * 1.2 : lineSpacing;
    }

    renderAmountItem("Valor Original Cuota (Capital):", parseFloat(paidInstallmentInfo.valorCuota) || 0);
    renderAmountItem("Saldo Anterior esta Cuota:", balanceBeforeThisTxOnInst);
    if (penaltyPaidThisTx > 0) {
      doc.setTextColor(PDF_COLORS.redText);
      renderAmountItem("Multa Aplicada:", penaltyPaidThisTx);
      doc.setTextColor(PDF_COLORS.darkGray); // Reset color
    }
    if (isFreeThisTx) {
      doc.setTextColor(PDF_COLORS.greenText);
      renderAmountItem("Aplicada como GRATIS:", 0);
      doc.setTextColor(PDF_COLORS.darkGray); // Reset color
    }
    
    y = drawDividerLine(doc, y, detailCol1X, pageWidth - margin, PDF_COLORS.mediumGray, 0.1) + 1;
    renderAmountItem("TOTAL ABONADO:", amountPaidThisTx, true);
    y += 1;
    renderAmountItem("Nuevo Saldo esta Cuota:", balanceAfterThisTxOnInst);
    
    if (paidInstallmentInfo.pagos && paidInstallmentInfo.pagos.length > 0) {
        const lastPaymentRef = paidInstallmentInfo.pagos[paidInstallmentInfo.pagos.length -1].referencia;
        if (lastPaymentRef) {
            doc.setFontSize(7); doc.setFont('helvetica','italic'); doc.setTextColor(PDF_COLORS.mediumGray);
            doc.text(`Ref. Pago: ${lastPaymentRef}`, margin, y, {maxWidth: contentWidth});
            y += lineSpacing;
        }
    }
    y += sectionGap / 2;
    y = drawDividerLine(doc, y, margin, pageWidth, PDF_COLORS.lightGray, 0.3) + sectionGap/2;


    // --- Overall Sale Balance ---
    let saldoPendienteVenta = 0; 
    sale.tablaPagos.forEach(c => { 
        if (c.estado !== 'pagada') {
            saldoPendienteVenta += Math.max(0, (parseFloat(c.valorCuota) || 0) - (parseFloat(c.montoAcumuladoPagado) || 0));
        }
    });
 

    // --- Motivational Phrases ---
    const phraseStartY = Math.min(y, pageHeight - 38); // Position phrases towards bottom, but flow if content is long
    y = phraseStartY;
    
    doc.setFontSize(7);
    doc.setTextColor(PDF_COLORS.greenText); 
    doc.setFont('helvetica', 'bold');
    let phraseText = "EL PAGO PUNTUAL";
    doc.text(phraseText, margin, y);
    let currentTextWidth = doc.getTextWidth(phraseText + " ");
    doc.setFont('helvetica', 'normal'); doc.setTextColor(PDF_COLORS.darkGray);
    doc.text("de tu credito te permite:", margin + currentTextWidth, y, {maxWidth: contentWidth - currentTextWidth});
    y += smallLineSpacing;

    doc.setFontSize(6.5);
    const benefitsText = "Mantener un buen historial crediticio, Acceder a proximos creditos, Evitar recargos por mora.";
    const splitBenefits = doc.splitTextToSize(benefitsText, contentWidth);
    doc.text(splitBenefits, margin, y);
    y += (splitBenefits.length * 2.5) + smallLineSpacing;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(PDF_COLORS.darkGray); // Changed from blue
    phraseText = "TU COMPROMISO Y RESPONSABILIDAD";
    doc.text(phraseText, margin, y);
    currentTextWidth = doc.getTextWidth(phraseText + " ");
    doc.setFont('helvetica', 'normal'); doc.setTextColor(PDF_COLORS.darkGray);
    doc.text("nos permite apoyar a mas personas.", margin + currentTextWidth, y, {maxWidth: contentWidth - currentTextWidth});
    y += sectionGap;
    
    // --- Signatures ---
    const signatureYPos = pageHeight - 22; // Fixed position from bottom of the 145mm content area
    y = signatureYPos;

    doc.setFontSize(8); doc.setTextColor(PDF_COLORS.darkGray);
    const signatureLine = "____________________________________"; // Longer line
    const sigLineWidth = doc.getTextWidth(signatureLine);
    
    const clientSigX = margin + contentWidth / 4; 
    doc.text(signatureLine, clientSigX - (sigLineWidth/2), y);
    doc.text("Firma Cliente", clientSigX, y + lineSpacing, {align: 'center'});

    const cashierSigX = margin + (contentWidth * 3 / 4); 
    doc.text(signatureLine, cashierSigX - (sigLineWidth/2), y);
    doc.text("Recibido Por", cashierSigX, y + lineSpacing, {align: 'center'});
    
    // --- Footer on A4 page (outside the 145mm content block) ---
    // This part will print at the bottom of the A4 page, if needed for fixed footer.
    // Or, keep it within the 145mm area. For now, keep it within.
    y = pageHeight - margin + 2; 
    doc.setFontSize(6.5); doc.setTextColor(PDF_COLORS.mediumGray);
    drawDividerLine(doc, pageHeight - 7, margin, pageWidth, PDF_COLORS.lightGray, 0.1);
    doc.text(`${STORE_INFO.address} | Tel: ${STORE_INFO.phone} | Email: ${STORE_INFO.email}`, pageWidth/2, pageHeight - 4, {align: 'center', maxWidth: contentWidth});
    
    doc.autoPrint({variant: 'non-conform'});
    window.open(doc.output('bloburl'), '_blank');
  };
  
  const handleRegisterInstallmentPayment = async (e) => {
    e.preventDefault();
    const amountToPayNum = parseFloat(paymentAmountInput);
    const appliedPenaltyNum = parseFloat(inputAppliedPenalty) || 0;

    if (!selectedSale || !currentInstallment) { setError("Selección inválida."); return; }
    if (!logoLoaded) { setError("Logo está cargando, por favor espere."); return; }
    if (isNaN(amountToPayNum)) { setError("Monto a pagar es inválido."); return; }
    
    if (installmentBalanceDue > 0 && amountToPayNum <= 0) { 
        setError("Monto a pagar debe ser mayor a cero si hay saldo."); return;
    }
    if (amountToPayNum > installmentBalanceDue + 0.001 && installmentBalanceDue > 0) { 
      setError(`Monto (${amountToPayNum.toFixed(2)}) excede saldo de cuota + multa (${installmentBalanceDue.toFixed(2)}).`);
      return;
    }
    if (installmentBalanceDue <= 0 && amountToPayNum > 0) {
      setError("Esta cuota ya no tiene saldo pendiente o es gratis. Solo se puede registrar pago de $0.");
      return;
    }

    setLoadingPayment(true); setError(''); setSuccess('');

    const saleRef = doc(db, "sales", selectedSale.id);
    try {
      const saleDocSnap = await getDoc(saleRef);
      if (!saleDocSnap.exists()) throw new Error("La venta no fue encontrada.");
      
      const currentSaleDataFromDB = saleDocSnap.data();
      const targetInstallmentFromDB = currentSaleDataFromDB.tablaPagos.find(p => p.cuotaNumero === currentInstallment.cuotaNumero);
      if (!targetInstallmentFromDB) throw new Error("Cuota no encontrada en datos de la venta.");

      const paidSoFar_beforeTx = parseFloat(targetInstallmentFromDB.montoAcumuladoPagado) || 0;
      const installmentOriginalVal = parseFloat(targetInstallmentFromDB.valorCuota) || 0;
      
      const isFreeInThisTx = isInstallmentFreeNow;
      const capitalPaidThisTx = Math.max(0, amountToPayNum - appliedPenaltyNum);

      let newMontoAcumuladoCapital = paidSoFar_beforeTx + capitalPaidThisTx;
      let newEstadoCuota = targetInstallmentFromDB.estado;
      
      const effectiveCapitalValueOfInstallment = isFreeInThisTx ? 0 : installmentOriginalVal;

      if (newMontoAcumuladoCapital >= effectiveCapitalValueOfInstallment - 0.001) { 
          newEstadoCuota = 'pagada';
          newMontoAcumuladoCapital = effectiveCapitalValueOfInstallment; 
      } else if (newMontoAcumuladoCapital > 0) {
          newEstadoCuota = 'parcialmente_pagada';
      } else if (newMontoAcumuladoCapital <= 0 && effectiveCapitalValueOfInstallment <=0 ) {
          newEstadoCuota = 'pagada'; 
      }

      const paymentTransaction = {
          transactionId: `TXN-${Date.now()}`, 
          fechaPago: normalizeDate(paymentDate),
          montoPagadoTransaccion: amountToPayNum, 
          multaPagadaEnTransaccion: appliedPenaltyNum, 
          capitalAbonadoEnTransaccion: capitalPaidThisTx, 
          referencia: paymentReference || null,
          fueCuotaGratisAplicadaEnTx: isFreeInThisTx,
          cajero: currentUser?.email || 'Sistema'
      };

      const updatedInstallmentData = {
        ...targetInstallmentFromDB,
        estado: newEstadoCuota,
        montoAcumuladoPagado: newMontoAcumuladoCapital, 
        pagos: [...(targetInstallmentFromDB.pagos || []), paymentTransaction],
        ...(isFreeInThisTx && { fueCuotaGratisAplicada: true }), 
      };
      
      const updatedTablaPagos = currentSaleDataFromDB.tablaPagos.map(p =>
        p.cuotaNumero === currentInstallment.cuotaNumero ? updatedInstallmentData : p
      );

      await updateDoc(saleRef, { tablaPagos: updatedTablaPagos });
      
      const balanceCapitalBeforeTx = installmentOriginalVal - paidSoFar_beforeTx;
      const balanceBeforeOnInstForReceipt = balanceCapitalBeforeTx + (isPenaltyApplicable && !isInstallmentFreeNow ? appliedPenaltyNum : 0); 

      const receiptData = {
        sale: { ...currentSaleDataFromDB, id: selectedSale.id, tablaPagos: updatedTablaPagos },
        paidInstallmentInfo: updatedInstallmentData, 
        client: selectedClient,
        cashierEmail: currentUser?.email,
        amountPaidThisTx: amountToPayNum, 
        penaltyPaidThisTx: appliedPenaltyNum, 
        isFreeThisTx: isFreeInThisTx,
        balanceBeforeThisTxOnInst: balanceBeforeOnInstForReceipt,
        balanceAfterThisTxOnInst: Math.max(0, balanceBeforeOnInstForReceipt - amountToPayNum) 
      };
      generatePaymentReceiptPdf(receiptData);

      setSuccess(`Pago de $${amountToPayNum.toFixed(2)} a cuota Nº ${currentInstallment.cuotaNumero} registrado! Comprobante generado.`);
      setIsPaymentModalOpen(false);
      
      const updatedSaleForUI = { ...currentSaleDataFromDB, id: selectedSale.id, tablaPagos: updatedTablaPagos };
      setSelectedSale(updatedSaleForUI); 
      setClientSalesForSelection(prev => prev.map(s => s.id === selectedSale.id ? updatedSaleForUI : s)
                                  .filter(s => s.tablaPagos?.some(p => p.estado !== 'pagada')));

    } catch (err) {
      console.error("Error registrando pago:", err);
      setError(`Error al registrar el pago: ${err.message}`);
    } finally {
      setLoadingPayment(false);
    }
  };
  
  const ClientSaleDetailedHistory = ({ sale }) => {
    if (!sale) return null; 
  
    return (
      <div className="mt-6 p-4 border border-ui-border-light dark:border-ui-border-dark rounded-md bg-form-bg-light dark:bg-form-bg-dark">
        <h3 className="text-lg font-semibold mb-3 text-text-dark dark:text-text-light flex items-center gap-2">
          <FiFileText /> Historial Detallado - Venta ID: <span className="font-mono text-sm">{sale.id}</span>
        </h3>
        
        {sale.tablaPagos && sale.tablaPagos.length > 0 ? (
          <div className="space-y-3">
            {sale.tablaPagos.map(inst => (
              <div key={inst.cuotaNumero} className="p-2.5 border border-ui-border-light/70 dark:border-ui-border-dark/70 rounded-md bg-neutral-50 dark:bg-primary-light/5">
                <div className="flex justify-between items-center mb-1.5">
                  <p className="text-sm font-semibold">
                    Cuota {inst.cuotaNumero}: ${inst.valorCuota.toFixed(2)} 
                    <span className="text-xs text-text-muted-light dark:text-text-muted-dark ml-2">(Vence: {formatDate(inst.fechaVencimiento)})</span>
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                    inst.estado === 'pagada' ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300' :
                    inst.estado === 'parcialmente_pagada' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300' :
                    'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300'
                  }`}>
                    {inst.estado?.replace('_', ' ')} {inst.fueCuotaGratisAplicada ? '(Gratis)' : ''}
                  </span>
                </div>
                <p className="text-xs text-text-muted-light dark:text-text-muted-dark mb-1">
                  Pagado Capital: <span className="font-semibold text-green-600 dark:text-green-400">${(inst.montoAcumuladoPagado || 0).toFixed(2)}</span>
                </p>
                {inst.pagos && inst.pagos.length > 0 ? (
                  <ul className="text-xs list-disc list-inside pl-2 space-y-0.5 max-h-32 overflow-y-auto">
                    {inst.pagos.map(pago => (
                      <li key={pago.transactionId} className="text-text-muted-light dark:text-text-muted-dark">
                        {formatDate(pago.fechaPago)}: Abono ${pago.montoPagadoTransaccion.toFixed(2)} 
                        {pago.multaPagadaEnTransaccion > 0 ? ` (incl. multa $${pago.multaPagadaEnTransaccion.toFixed(2)})` : ''}.
                        {pago.referencia ? ` Ref: ${pago.referencia}` : ''}
                        {pago.fueCuotaGratisAplicadaEnTx ? ` (Aplicada Gratis)` : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs italic text-text-muted-light dark:text-text-muted-dark">Sin transacciones de pago registradas para esta cuota.</p>
                )}
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-text-muted-light dark:text-text-muted-dark">No hay plan de pagos detallado para esta venta.</p>}
      </div>
    );
  };

  const PaymentScheduleForSale = ({ sale }) => {
    if (!sale || !sale.tablaPagos) return <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Seleccione una venta para ver el cronograma.</p>;
    const allInstallmentsPaid = sale.tablaPagos.every(p => p.estado === 'pagada');

    return (
      <div className="mt-4 p-4 border border-ui-border-light dark:border-ui-border-dark rounded-md">
        <h4 className="text-md font-semibold mb-1">Cronograma Resumido - Venta ID: <span className="font-mono text-xs">{sale.id}</span></h4>
        {loadingFactorPlazo && <p className="text-xs text-blue-500">Cargando info de financiación...</p>}
        {allInstallmentsPaid && sale.tablaPagos.length > 0 && <p className="text-green-600 dark:text-green-400 my-2 text-sm"><FiThumbsUp className="inline mr-1"/>¡Todas las cuotas de este crédito han sido canceladas!</p>}
        {sale.tablaPagos.length === 0 && <p className="my-2 text-text-muted-light dark:text-text-muted-dark text-sm">No hay plan de pagos para esta venta.</p>}

        {sale.tablaPagos.length > 0 && (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-xs">
              <thead className="bg-neutral-100 dark:bg-primary-light/10 uppercase">
                <tr>
                  <th className="px-2 py-2 text-center">Nº</th>
                  <th className="px-2 py-2 text-left">Vencimiento</th>
                  <th className="px-2 py-2 text-right">Valor Orig.</th>
                  <th className="px-2 py-2 text-right">Total Pagado (Capital)</th>
                  <th className="px-2 py-2 text-right">Saldo Capital</th>
                  <th className="px-2 py-2 text-center">Estado</th>
                  <th className="px-2 py-2 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="text-text-dark dark:text-text-light">
                {sale.tablaPagos.map(inst => {
                  const originalCuotaVal = parseFloat(inst.valorCuota) || 0;
                  const acumuladoPagadoInst = parseFloat(inst.montoAcumuladoPagado) || 0;
                  const saldoCapitalInst = Math.max(0, originalCuotaVal - acumuladoPagadoInst);
                  return (
                  <tr key={inst.cuotaNumero} className={`border-b border-ui-border-light dark:border-ui-border-dark ${inst.estado === 'pagada' ? 'bg-green-50 dark:bg-green-800/20 opacity-80' : inst.estado === 'parcialmente_pagada' ? 'bg-yellow-50 dark:bg-yellow-700/20' : 'hover:bg-neutral-50 dark:hover:bg-primary-light/5'}`}>
                    <td className="px-2 py-1.5 text-center">{inst.cuotaNumero}</td>
                    <td className="px-2 py-1.5">{formatDate(inst.fechaVencimiento)}</td>
                    <td className="px-2 py-1.5 text-right">${originalCuotaVal.toFixed(0)}</td>
                    <td className="px-2 py-1.5 text-right text-green-600 dark:text-green-400">${acumuladoPagadoInst.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-right font-semibold text-red-600 dark:text-red-400">${saldoCapitalInst.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-center capitalize">
                      <span className={`px-2 py-0.5 text-[10px] rounded-full ${inst.estado === 'pagada' ? 'bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-100' : inst.estado === 'parcialmente_pagada' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-100' : 'bg-red-200 text-red-800 dark:bg-red-600 dark:text-red-100'}`}>
                        {inst.estado?.replace('_', ' ') || 'pendiente'} {inst.fueCuotaGratisAplicada ? '(Gratis Aplicada)' : ''}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      {inst.estado !== 'pagada' && (
                        <button
                          onClick={() => handleOpenPaymentModal(sale, inst)}
                          className="px-2 py-1 text-xs bg-secondary text-renatto-dark font-medium rounded hover:bg-secondary-dark transition-colors disabled:opacity-50"
                          disabled={loadingPayment || loadingFactorPlazo || !logoLoaded}
                        >
                          { !logoLoaded ? "Cargando..." : "Abonar"}
                        </button>
                      )}
                        {inst.pagos?.length > 0 && logoLoaded && (
                            <button
                                onClick={() => {
                                    const lastTx = inst.pagos[inst.pagos.length - 1];
                                    const amountPaidInLastTx = lastTx.montoPagadoTransaccion;
                                    const penaltyInLastTx = lastTx.multaPagadaEnTransaccion;
                                    const isFreeInLastTx = lastTx.fueCuotaGratisAplicadaEnTx;
                                    const capitalPaidInLastTx = lastTx.capitalAbonadoEnTransaccion !== undefined 
                                                                ? lastTx.capitalAbonadoEnTransaccion 
                                                                : (amountPaidInLastTx - penaltyInLastTx);

                                    const capitalPaidBeforeLastTx = (inst.montoAcumuladoPagado || 0) - capitalPaidInLastTx;
                                    const balanceCapitalBeforeLastTx = originalCuotaVal - capitalPaidBeforeLastTx;
                                    
                                    const balanceDueForLastTx = balanceCapitalBeforeLastTx + penaltyInLastTx;
                                    
                                    const receiptDataReprint = {
                                        sale: { ...sale, id: sale.id, tablaPagos: sale.tablaPagos }, 
                                        paidInstallmentInfo: { ...inst, pagos: inst.pagos }, 
                                        client: selectedClient,
                                        cashierEmail: lastTx.cajero || currentUser?.email,
                                        amountPaidThisTx: amountPaidInLastTx,
                                        penaltyPaidThisTx: penaltyInLastTx,
                                        isFreeThisTx: isFreeInLastTx,
                                        balanceBeforeThisTxOnInst: balanceDueForLastTx, 
                                        balanceAfterThisTxOnInst: Math.max(0, balanceDueForLastTx - amountPaidInLastTx)
                                    };
                                    generatePaymentReceiptPdf(receiptDataReprint);
                                }}
                                className="ml-1 p-1 text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Reimprimir Último Comprobante de esta Cuota"
                            > <FiPrinter size={12}/> </button>
                        )}
                    </td>
                  </tr>
                )})} 
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="animate-fade-in p-0 md:p-2">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-semibold text-text-dark dark:text-text-light flex items-center gap-3">
          <FiCheckSquare className="text-secondary" /> Procesar Pagos y Abonos
        </h2>
      </div>

      {(error || logoErrorMsg) && <div className="mb-4 p-3.5 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700/50 rounded-lg flex items-center gap-3 text-sm text-red-700 dark:text-red-300 animate-fade-in"><FiAlertCircle size={18} /> <span>{error || logoErrorMsg}</span></div>}
      {success && <div className="mb-4 p-3.5 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700/50 rounded-lg flex items-center gap-3 text-sm text-green-700 dark:text-green-300 animate-fade-in"><FiCheckCircle size={18} /> <span>{success}</span></div>}

      <div className="mb-6 p-4 bg-form-bg-light dark:bg-form-bg-dark rounded-lg shadow border border-ui-border-light dark:border-ui-border-dark">
        <label htmlFor="client-payment-select" className="block text-sm font-medium text-text-dark dark:text-text-light mb-1.5 flex items-center gap-2">
          <FiUsers /> Seleccionar Cliente
        </label>
        <Select
          options={clients}
          value={selectedClient}
          onChange={(client) => { setSelectedClient(client); setSelectedSale(null); }}
          placeholder={loadingClients ? "Cargando clientes..." : "Buscar cliente por nombre o identificación..."}
          isClearable
          isLoading={loadingClients}
          isDisabled={loadingClients}
          classNamePrefix="react-select"
        />
      </div>

      {selectedClient && loadingSales && <div className="flex justify-center items-center py-6"><FiLoader className="animate-spin text-2xl text-secondary" /> <p className="ml-2 text-text-muted-light dark:text-text-muted-dark">Cargando créditos...</p></div>}
      
      {selectedClient && !loadingSales && clientSalesForSelection.length === 0 && (
         <p className="text-center text-green-600 dark:text-green-400 py-4">¡Este cliente no tiene créditos con cuotas pendientes!</p>
      )}
       {selectedClient && !loadingSales && !clientSalesForSelection.length && !selectedSale && (
         <p className="text-center text-text-muted-light dark:text-text-muted-dark py-4">Seleccione un crédito activo (si existe) o revise el historial detallado si es necesario.</p>
      )}


      {selectedClient && !loadingSales && clientSalesForSelection.length > 0 && (
        <div className="mb-6 p-4 bg-form-bg-light dark:bg-form-bg-dark rounded-lg shadow border border-ui-border-light dark:border-ui-border-dark">
          <h3 className="text-lg font-semibold mb-3 text-text-dark dark:text-text-light">Créditos Activos de {selectedClient.label.substring(0, selectedClient.label.lastIndexOf('(') - 1).trim()} (Con Saldo Pendiente)</h3>
          <ul className="space-y-2">
            {clientSalesForSelection.map(s => (
              <li
                key={s.id}
                className={`p-3 rounded-md border cursor-pointer transition-all 
                            ${selectedSale?.id === s.id
                                ? 'bg-secondary/20 border-secondary dark:bg-secondary/30 shadow-md'
                                : 'bg-neutral-50 dark:bg-primary-light/5 border-ui-border-light dark:border-ui-border-dark hover:border-secondary/70 dark:hover:border-secondary/70'}`}
                onClick={() => setSelectedSale(s)}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Venta ID: <span className="font-mono text-xs">{s.id}</span></span>
                  <span className="text-xs text-text-muted-light dark:text-text-muted-dark">Fecha Venta: {formatDate(s.fechaVenta, { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                </div>
                <div className="text-xs mt-1">Total Crédito: ${s.totalVenta?.toFixed(2)} | Cuotas: {s.factorPlazoSeleccionado?.cantidadMes} de ~$${s.valorCuota?.toFixed(0)}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedSale && <PaymentScheduleForSale sale={selectedSale} />}
      {selectedSale && <ClientSaleDetailedHistory sale={selectedSale} /> }


      {isPaymentModalOpen && selectedSale && currentInstallment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <form onSubmit={handleRegisterInstallmentPayment} className="bg-form-bg-light dark:bg-form-bg-dark p-5 sm:p-6 rounded-lg shadow-2xl w-full max-w-lg space-y-3 border border-ui-border-light dark:border-ui-border-dark">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold text-text-dark dark:text-text-light">Abono a Cuota Nº {currentInstallment.cuotaNumero}</h4>
              <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="p-1 text-text-muted-light dark:text-text-muted-dark hover:text-secondary"><FiX size={20} /></button>
            </div>
            <p className="text-xs sm:text-sm">Venta ID: <span className="font-mono">{selectedSale.id}</span></p>
            <p className="text-xs sm:text-sm">Cliente: {selectedSale.clienteNombre}</p>
            <p className="text-xs sm:text-sm">Vencimiento Original Cuota: {formatDate(currentInstallment.fechaVencimiento)}</p>
            
            <div className="mt-3 pt-3 border-t border-ui-border-light dark:border-ui-border-dark space-y-1 text-sm">
                <p>Valor Original Total Cuota: <span className="font-semibold">${(parseFloat(currentInstallment.valorCuota) || 0).toFixed(2)}</span></p>
                <p>Pagado Anteriormente en esta Cuota (Capital): <span className="font-semibold">${(parseFloat(currentInstallment.montoAcumuladoPagado) || 0).toFixed(2)}</span></p>
                {isInstallmentFreeNow && <p className="text-green-600 dark:text-green-400 font-semibold"><FiThumbsUp className="inline mr-1"/>¡Saldo de esta cuota es GRATIS por puntualidad!</p>}
                
                {isPenaltyApplicable && !isInstallmentFreeNow && (
                    <div>
                        <label htmlFor="inputAppliedPenalty" className="block text-xs font-medium text-red-500 dark:text-red-400">Multa por Atraso (Editable):</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500 sm:text-sm">$</span>
                            <input 
                                type="number" id="inputAppliedPenalty" 
                                value={inputAppliedPenalty} 
                                onChange={(e) => setInputAppliedPenalty(e.target.value)}
                                step="0.01" min="0"
                                className={`${inputBaseClasses} pl-7 ${inputLightMode} ${inputDarkMode} text-red-600 dark:text-red-400`} />
                        </div>
                    </div>
                )}
                <p className="text-md font-bold mt-1">SALDO TOTAL A PAGAR HOY (Capital + Multa): <span className="text-secondary">${installmentBalanceDue.toFixed(2)}</span></p>
            </div>
            
            <div>
              <label htmlFor="paymentAmountInput" className="block text-sm font-medium mb-1">Monto a Pagar Hoy*</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500 sm:text-sm">$</span>
                <input 
                    type="number" id="paymentAmountInput" 
                    value={paymentAmountInput} 
                    onChange={(e) => setPaymentAmountInput(e.target.value)}
                    min={installmentBalanceDue > 0 ? "0.01" : "0.00"}
                    step="0.01" 
                    max={installmentBalanceDue > 0 ? installmentBalanceDue.toFixed(2) : "0.00"}
                    required={installmentBalanceDue > 0} 
                    disabled={installmentBalanceDue <= 0 && paymentAmountInput !== "0.00"} 
                    className={`${inputBaseClasses} pl-7 ${inputLightMode} ${inputDarkMode}`} />
              </div>
            </div>
            <div>
                <label htmlFor="paymentDateModal" className="block text-sm font-medium mb-1">Fecha de Pago*</label>
                <input type="date" id="paymentDateModal" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required className={`${inputBaseClasses} ${inputLightMode} ${inputDarkMode}`} />
            </div>
            <div>
                <label htmlFor="paymentReferenceModal" className="block text-sm font-medium mb-1">Referencia (Opcional)</label>
                <input type="text" id="paymentReferenceModal" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} className={`${inputBaseClasses} ${inputLightMode} ${inputDarkMode}`} placeholder="Ej: Depósito #456, Abono Caja"/>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setIsPaymentModalOpen(false)} disabled={loadingPayment} className="px-4 py-2 text-sm rounded-md text-text-muted-light dark:text-text-muted-dark hover:bg-neutral-100 dark:hover:bg-primary-light/20">Cancelar</button>
              <button 
                type="submit" 
                disabled={loadingPayment || !logoLoaded || (installmentBalanceDue <= 0 && paymentAmountInput !== "0.00" && paymentAmountInput !== "0")} 
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 shadow hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loadingPayment ? <FiLoader className="animate-spin" /> : <FiCheck />}
                {!logoLoaded ? "Cargando..." : (installmentBalanceDue <= 0 && parseFloat(paymentAmountInput) === 0 ? "Confirmar (Gratis/Saldado)" : "Confirmar Pago")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PaymentProcessingPage;