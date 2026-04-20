import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { createApiUrl, getApiHeaders } from '@/config/api';
import { formatDate } from '@/lib/utils';

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TransactionFormData {
  supplierId: string;
  buyerId: string;
  supplierName: string;
  buyerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  blDate: string;
  dueDate: string;
  useInvoiceDateForCalculation: boolean;
  useBLDateForCalculation: boolean;
  tenureDays: number | string;
  invoiceAmount: number | string;
  currency: string;
  advancePercentage: number;
  advanceAmount: number | string;
  feePercentage: number | string;
  feeAmount: number | string;
  reserveAmount: number | string;
  // Fee breakdown for tracking
  transactionFee?: number;
  processingFee?: number;
  factoringFee?: number;
  setupFee?: number;
  supplierPaymentTerms: string;
  description: string;
  status: string;
  transactionType: string;
  supportingDocuments: File[];
  // NOA related fields
  buyerEmail: string;
  sendNOA: boolean;
}

export function AddTransactionDialog({ open, onOpenChange }: AddTransactionDialogProps) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [filteredBuyers, setFilteredBuyers] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [selectedBuyer, setSelectedBuyer] = useState<any>(null);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [availablePaymentTerms, setAvailablePaymentTerms] = useState<any[]>([]);
  const [supplierFees, setSupplierFees] = useState<any>(null);

  const getEntityCurrency = (entity: any) => String(entity?.currency || entity?.bankDetails?.currency || 'USD').toUpperCase();

  // Helper function to get payment terms from supplier's transaction fees
  const getSupplierPaymentTerms = (transactionFees: any) => {
    console.log('Processing transaction fees:', transactionFees);
    console.log('Transaction fees type:', typeof transactionFees);
    
    if (!transactionFees) {
      console.log('No transaction fees provided');
      return [];
    }
    
    const terms = [];
    
    // Handle different possible data structures
    const fees = transactionFees.transactionFees || transactionFees;
    console.log('Using fees object:', fees);
    
    // Check each fee range and include if it has any value (not empty string or zero)
    if (fees.days0to30 && fees.days0to30 !== '' && parseFloat(fees.days0to30.toString()) >= 0) {
      terms.push({
        label: `0-30 days (${fees.days0to30}% fee)`,
        value: '0-30',
        feeRate: parseFloat(fees.days0to30.toString())
      });
      console.log('Added 0-30 days term:', fees.days0to30);
    }
    
    if (fees.days31to60 && fees.days31to60 !== '' && parseFloat(fees.days31to60.toString()) >= 0) {
      terms.push({
        label: `31-60 days (${fees.days31to60}% fee)`,
        value: '31-60',
        feeRate: parseFloat(fees.days31to60.toString())
      });
      console.log('Added 31-60 days term:', fees.days31to60);
    }
    
    if (fees.days61to90 && fees.days61to90 !== '' && parseFloat(fees.days61to90.toString()) >= 0) {
      terms.push({
        label: `61-90 days (${fees.days61to90}% fee)`,
        value: '61-90',
        feeRate: parseFloat(fees.days61to90.toString())
      });
      console.log('Added 61-90 days term:', fees.days61to90);
    }
    
    if (fees.days91to120 && fees.days91to120 !== '' && parseFloat(fees.days91to120.toString()) >= 0) {
      terms.push({
        label: `91-120 days (${fees.days91to120}% fee)`,
        value: '91-120',
        feeRate: parseFloat(fees.days91to120.toString())
      });
      console.log('Added 91-120 days term:', fees.days91to120);
    }
    
    if (fees.days121to150 && fees.days121to150 !== '' && parseFloat(fees.days121to150.toString()) >= 0) {
      terms.push({
        label: `121-150 days (${fees.days121to150}% fee)`,
        value: '121-150',
        feeRate: parseFloat(fees.days121to150.toString())
      });
      console.log('Added 121-150 days term:', fees.days121to150);
    }
    
    console.log('Final generated payment terms:', terms);
    return terms;
  };
  
  // Helper function to get the base date for calculations based on user preference
  const getBaseDateForCalculation = (invoiceDate: string, blDate: string, useInvoiceDate: boolean, useBLDate: boolean) => {
    if (useBLDate && blDate) {
      return blDate;
    }
    if (useInvoiceDate && invoiceDate) {
      return invoiceDate;
    }
    // Fallback: prefer invoice date, then BL date
    return invoiceDate || blDate;
  };

  // Helper function to calculate due date based on tenure (preferred method)
  const calculateDueDateFromTenure = (invoiceDate: string, blDate: string, tenureDays: number | string, useInvoiceDate: boolean = true, useBLDate: boolean = false) => {
    const days = parseInt(tenureDays.toString());
    if (!days || days <= 0) {
      console.log('No valid tenure days provided for due date calculation');
      return '';
    }
    
    const baseDate = getBaseDateForCalculation(invoiceDate, blDate, useInvoiceDate, useBLDate);
    if (!baseDate) {
      console.log('No base date available for due date calculation');
      return '';
    }
    
    const baseDateObj = new Date(baseDate);
    const dateType = useBLDate && blDate ? 'BL Date' : 'Invoice Date';
    
    console.log(`Calculating due date from tenure: baseDate=${baseDate}, tenureDays=${days}, using=${dateType}`);
    
    // Due date = base date + tenure days
    const finalDate = new Date(baseDateObj);
    finalDate.setDate(finalDate.getDate() + days);
    
    const calculatedDate = finalDate.toISOString().split('T')[0];
    console.log(`Calculated due date from tenure: ${calculatedDate} (base date: ${baseDate} + ${days} tenure days)`);
    return calculatedDate;
  };
  
  // Helper function to calculate due date based on payment terms (fallback method)
  const calculateDueDate = (invoiceDate: string, blDate: string, paymentTerm: string, useInvoiceDate: boolean = true, useBLDate: boolean = false) => {
    if (!paymentTerm) {
      console.log('No payment term provided for due date calculation');
      return '';
    }
    
    const baseDate = getBaseDateForCalculation(invoiceDate, blDate, useInvoiceDate, useBLDate);
    if (!baseDate) {
      console.log('No base date available for due date calculation');
      return '';
    }
    
    const baseDateObj = new Date(baseDate);
    const dateType = useBLDate && blDate ? 'BL Date' : 'Invoice Date';
    
    console.log(`Calculating due date: baseDate=${baseDate}, paymentTerm=${paymentTerm}, using=${dateType}`);
    
    let paymentTermDays = 0;
    
    // Extract maximum days from payment term range
    switch (paymentTerm) {
      case '0-30':
        paymentTermDays = 30;
        break;
      case '31-60':
        paymentTermDays = 60;
        break;
      case '61-90':
        paymentTermDays = 90;
        break;
      case '91-120':
        paymentTermDays = 120;
        break;
      case '121-150':
        paymentTermDays = 150;
        break;
      default:
        console.log(`Unknown payment term: ${paymentTerm}`);
        return '';
    }
    
    // Due date = base date + payment term days
    const finalDate = new Date(baseDateObj);
    finalDate.setDate(finalDate.getDate() + paymentTermDays);
    
    const calculatedDate = finalDate.toISOString().split('T')[0];
    console.log(`Calculated due date: ${calculatedDate} (base date: ${baseDate} + ${paymentTermDays} payment term days)`);
    return calculatedDate; // Return YYYY-MM-DD format
  };
  
  const [formData, setFormData] = useState<TransactionFormData>({
    supplierId: '',
    buyerId: '',
    supplierName: '',
    buyerName: '',
    invoiceNumber: '',
    invoiceDate: '',
    blDate: '',
    dueDate: '',
    useInvoiceDateForCalculation: true,
    useBLDateForCalculation: false,
    tenureDays: '',
    invoiceAmount: '',
    currency: 'USD',
    advancePercentage: 80,
    advanceAmount: '',
    feePercentage: '',
    feeAmount: '',
    reserveAmount: '',
    // Fee breakdown
    transactionFee: 0,
    processingFee: 0,
    factoringFee: 0,
    setupFee: 0,
    supplierPaymentTerms: '',
    description: '',
    status: 'pending',
    transactionType: 'factoring',
    supportingDocuments: [],
    // NOA related fields
    buyerEmail: '',
    sendNOA: false
  });

  // Fetch suppliers and buyers from entities API
  const fetchEntities = async () => {
    try {
      setLoadingEntities(true);
      const response = await fetch(createApiUrl('/entities'), {
        headers: getApiHeaders()
      });
      
      if (response.ok) {
        const result = await response.json();
        const entities = result.data || [];
        
        // Separate suppliers and buyers
        const supplierList = entities.filter((entity: any) => entity.type === 'supplier');
        const buyerList = entities.filter((entity: any) => entity.type === 'buyer');
        
        setSuppliers(supplierList);
        setBuyers(buyerList);
      } else {
        console.error('Failed to fetch entities:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching entities:', error);
    } finally {
      setLoadingEntities(false);
    }
  };

  // Load entities when dialog opens
  useEffect(() => {
    if (open) {
      fetchEntities();
    }
  }, [open]);

  // Auto-calculate due date when relevant fields change
  useEffect(() => {
    let calculatedDueDate = '';
    
    // Priority 1: Use tenure days if provided
    if (formData.tenureDays && (formData.invoiceDate || formData.blDate)) {
      calculatedDueDate = calculateDueDateFromTenure(
        formData.invoiceDate, 
        formData.blDate, 
        formData.tenureDays,
        formData.useInvoiceDateForCalculation,
        formData.useBLDateForCalculation
      );
      if (calculatedDueDate) {
        console.log(`Auto-recalculating due date from tenure: ${calculatedDueDate}`);
      }
    }
    
    // Priority 2: Fallback to payment terms if tenure not provided
    if (!calculatedDueDate && formData.supplierPaymentTerms && (formData.invoiceDate || formData.blDate)) {
      calculatedDueDate = calculateDueDate(
        formData.invoiceDate, 
        formData.blDate, 
        formData.supplierPaymentTerms,
        formData.useInvoiceDateForCalculation,
        formData.useBLDateForCalculation
      );
      if (calculatedDueDate) {
        console.log(`Auto-recalculating due date from payment terms: ${calculatedDueDate}`);
      }
    }
    
    // Update due date if calculated and different from current
    if (calculatedDueDate && calculatedDueDate !== formData.dueDate) {
      setFormData(prev => ({ ...prev, dueDate: calculatedDueDate }));
    }
  }, [formData.tenureDays, formData.supplierPaymentTerms, formData.invoiceDate, formData.blDate, formData.useInvoiceDateForCalculation, formData.useBLDateForCalculation]);

  // Additional useEffect to handle checkbox changes and trigger recalculation
  useEffect(() => {
    console.log(`Checkbox states changed - Invoice: ${formData.useInvoiceDateForCalculation}, BL: ${formData.useBLDateForCalculation}`);
  }, [formData.useInvoiceDateForCalculation, formData.useBLDateForCalculation]);

  // Recalculate fees when supplier fees are loaded/changed
  useEffect(() => {
    if (supplierFees && formData.invoiceAmount && parseFloat(formData.invoiceAmount.toString()) > 0) {
      const invoiceAmount = parseFloat(formData.invoiceAmount.toString()) || 0;
      const feePercentage = parseFloat(formData.feePercentage.toString()) || 0;
      const tenureDays = parseFloat(formData.tenureDays.toString()) || 0;
      const advanceAmount = parseFloat(formData.advanceAmount.toString()) || 0;
      const feeCalculation = calculateTotalFees(invoiceAmount, feePercentage, true, tenureDays, advanceAmount);
      
      if (feeCalculation.totalFees !== parseFloat(formData.feeAmount.toString()) || 
          feeCalculation.reserveAmount !== parseFloat(formData.reserveAmount.toString())) {
        setFormData(prev => ({ 
          ...prev, 
          feeAmount: feeCalculation.totalFees,
          reserveAmount: feeCalculation.reserveAmount,
          transactionFee: feeCalculation.breakdown.transactionFee,
          processingFee: feeCalculation.breakdown.processingFee,
          factoringFee: feeCalculation.breakdown.factoringFee,
          setupFee: feeCalculation.breakdown.setupFee
        }));
        console.log(`Fees recalculated due to supplier fees change: $${feeCalculation.totalFees}, Reserve: $${feeCalculation.reserveAmount}`);
      }
    }
  }, [supplierFees]);

  // Helper function to calculate total fees including all supplier fees
  const calculateTotalFees = (invoiceAmount: number, transactionFeePercentage: number = 0, updateBreakdown: boolean = true, tenureDays: number = 0, advanceAmount: number = 0) => {
    console.log('=== FEE CALCULATION STARTED ===');
    console.log('Invoice Amount:', invoiceAmount);
    console.log('Transaction Fee Percentage:', transactionFeePercentage);
    console.log('Supplier Fees Object:', supplierFees);
    
    if (invoiceAmount <= 0) {
      console.log('Invalid invoice amount, returning zero fees');
      return { totalFees: 0, reserveAmount: 0, breakdown: { transactionFee: 0, processingFee: 0, factoringFee: 0, setupFee: 0 } };
    }

    let totalFees = 0;
    const breakdown = {
      transactionFee: 0,
      processingFee: 0,
      factoringFee: 0,
      setupFee: 0
    };
    
    // 1. Transaction fee based on payment terms/tenure
    if (transactionFeePercentage > 0) {
      breakdown.transactionFee = (invoiceAmount * parseFloat(transactionFeePercentage)) / 100;
      totalFees += breakdown.transactionFee;
      console.log(`Transaction fee: ${transactionFeePercentage}% = $${breakdown.transactionFee}`);
    }
    
    // 2. Processing fees
    console.log('Checking processing fees - supplierFees?.processingFees:', supplierFees?.processingFees);
    if (supplierFees?.processingFees > 0) {
      breakdown.processingFee = parseFloat(supplierFees.processingFees.toString());
      totalFees += breakdown.processingFee;
      console.log(`Processing fee: $${supplierFees.processingFees} = $${breakdown.processingFee}`);
    } else {
      console.log('Processing fee skipped - not greater than 0');
    }
    
    // 3. Factoring fees
    console.log('Checking factoring fees - supplierFees?.factoringFees:', supplierFees?.factoringFees);
    if (supplierFees?.factoringFees > 0) {
      breakdown.factoringFee = (invoiceAmount * parseFloat(supplierFees.factoringFees.toString())) / 100;
      totalFees += breakdown.factoringFee;
      console.log(`Factoring fee: ${supplierFees.factoringFees}% = $${breakdown.factoringFee}`);
    } else {
      console.log('Factoring fee skipped - not greater than 0');
    }
    
    // 4. Setup fee (handling different payment methods)
    if (supplierFees?.setupFee > 0) {
      if (supplierFees.setupFeePaymentMethod === 'one_time') {
        // Setup fee is a percentage of credit limit (applied once)
        breakdown.setupFee = (parseFloat(supplierFees.creditLimit) || 0) * (parseFloat(supplierFees.setupFee) / 100);
      } else {
        // Setup fee is a percentage of invoice amount (applied per transaction)
        breakdown.setupFee = (invoiceAmount * parseFloat(supplierFees.setupFee)) / 100;
      }
      totalFees += breakdown.setupFee;
      console.log(`Setup fee (${supplierFees.setupFeePaymentMethod}): ${supplierFees.setupFee}% = $${breakdown.setupFee}`);
    }

    // 5. Calculate reserve fee as 20% of invoice amount
    const reserveAmount = invoiceAmount * 0.20;
    
    console.log('=== FEE CALCULATION COMPLETE ===');
    console.log('Final breakdown:', breakdown);
    console.log('Total fees:', totalFees);
    console.log('Reserve amount:', reserveAmount);
    console.log(`Total calculated fees: $${totalFees}, Reserve amount: $${reserveAmount}`);
    return { totalFees, reserveAmount, breakdown };
  };

  const handleInputChange = (field: keyof TransactionFormData, value: string | number | boolean) => {
    const updatedData = { ...formData, [field]: value };
    
    // Handle supplier selection
    if (field === 'supplierId') {
      const selectedSupplier = suppliers.find(s => (s.id || s._id) === value);
      setSelectedSupplier(selectedSupplier || null);
      updatedData.supplierName = selectedSupplier ? selectedSupplier.name : '';

      const supplierCurrency = selectedSupplier ? getEntityCurrency(selectedSupplier) : 'USD';
      updatedData.currency = supplierCurrency;
      
      console.log('Selected Supplier Full Object:', selectedSupplier);
      
      if (selectedSupplier) {
        // Filter buyers to show only those linked to this supplier
        const linkedBuyers = buyers.filter(buyer => 
          buyer.supplierLimits && 
          buyer.supplierLimits.some((sl: any) => sl.supplierId === (selectedSupplier.id || selectedSupplier._id))
        );
        const sameCurrencyBuyers = linkedBuyers.filter((buyer) => getEntityCurrency(buyer) === supplierCurrency);
        setFilteredBuyers(sameCurrencyBuyers);
        console.log('Filtered buyers for supplier:', linkedBuyers);
        
        // Store all supplier fee information
        console.log('Setting supplier fees for selected supplier:', selectedSupplier);
        setSupplierFees({
          processingFees: selectedSupplier.processingFees || 0,
          factoringFees: selectedSupplier.factoringFees || 0,
          setupFee: selectedSupplier.setupFee || 0,
          setupFeePaymentMethod: selectedSupplier.setupFeePaymentMethod || 'one_time',
          lateFees: selectedSupplier.lateFees || 0,
          advanceRate: selectedSupplier.advanceRate || 80,
          creditLimit: selectedSupplier.totalLimitSanctioned || selectedSupplier.creditLimit || 0
        });
        
        console.log('Supplier fees set:', {
          processingFees: selectedSupplier.processingFees || 0,
          factoringFees: selectedSupplier.factoringFees || 0,
          setupFee: selectedSupplier.setupFee || 0
        });
        
        // Update available payment terms based on selected supplier
        console.log('Transaction Fees Found:', selectedSupplier.transactionFees);
        
        // Try both nested and flat structures
        let transactionFeesData = selectedSupplier.transactionFees;
        
        // If nested structure doesn't exist, try flat structure
        if (!transactionFeesData) {
          if (selectedSupplier.days0to30 || selectedSupplier.days31to60 || selectedSupplier.days61to90 || 
              selectedSupplier.days91to120 || selectedSupplier.days121to150) {
            transactionFeesData = {
              days0to30: selectedSupplier.days0to30,
              days31to60: selectedSupplier.days31to60,
              days61to90: selectedSupplier.days61to90,
              days91to120: selectedSupplier.days91to120,
              days121to150: selectedSupplier.days121to150,
            };
            console.log('Using flat structure transaction fees:', transactionFeesData);
          }
        }
        
        if (transactionFeesData) {
          console.log('Final transaction fees data:', transactionFeesData);
          const paymentTerms = getSupplierPaymentTerms(transactionFeesData);
          setAvailablePaymentTerms(paymentTerms);
          console.log('Available Payment Terms Set:', paymentTerms);
        } else {
          console.log('No transaction fees found in any structure');
          setAvailablePaymentTerms([]);
        }
        
        // Set advance percentage from supplier settings
        updatedData.advancePercentage = selectedSupplier.advanceRate || 80;
      } else {
        console.log('No supplier selected');
        setFilteredBuyers([]);
        setSupplierFees(null);
        setAvailablePaymentTerms([]);
      }
      
      // Reset selected payment term and buyer when supplier changes
      updatedData.supplierPaymentTerms = '';
      updatedData.feePercentage = 0;
      updatedData.buyerId = '';
      updatedData.buyerName = '';
      setSelectedBuyer(null);
    }
    
    // Handle buyer selection
    if (field === 'buyerId') {
      const selectedBuyer = buyers.find(b => (b.id || b._id) === value);

       if (selectedBuyer && selectedSupplier) {
        const supplierCurrency = getEntityCurrency(selectedSupplier);
        const buyerCurrency = getEntityCurrency(selectedBuyer);
        if (supplierCurrency !== buyerCurrency) {
          toast.error(`Buyer currency (${buyerCurrency}) must match supplier currency (${supplierCurrency})`);
          return;
        }
        updatedData.currency = supplierCurrency;
      }

      setSelectedBuyer(selectedBuyer || null);
      updatedData.buyerName = selectedBuyer ? selectedBuyer.name : '';
      updatedData.buyerEmail = selectedBuyer ? (selectedBuyer.email || selectedBuyer.contactEmail || '') : '';
      console.log('Selected Buyer:', selectedBuyer);
      console.log('Buyer Email set to:', updatedData.buyerEmail);
    }
    
    // Handle payment terms selection - update fee percentage and due date (only if tenure not provided)
    if (field === 'supplierPaymentTerms') {
      const selectedTerm = availablePaymentTerms.find(term => term.value === value);
      if (selectedTerm) {
        updatedData.feePercentage = selectedTerm.feeRate;
        console.log(`Payment term selected: ${value}, fee rate: ${selectedTerm.feeRate}`);
      } else {
        // Handle fallback terms (when no terms configured)
        updatedData.feePercentage = 0; // Default fee for fallback terms
        console.log(`Fallback payment term selected: ${value}`);
      }
      
      // Auto-calculate due date only if tenure is not provided (tenure takes priority)
      if (!updatedData.tenureDays && (updatedData.invoiceDate || updatedData.blDate)) {
        const calculatedDueDate = calculateDueDate(
          updatedData.invoiceDate, 
          updatedData.blDate, 
          value as string,
          updatedData.useInvoiceDateForCalculation,
          updatedData.useBLDateForCalculation
        );
        if (calculatedDueDate) {
          updatedData.dueDate = calculatedDueDate;
          console.log(`Due date calculated from payment terms: ${calculatedDueDate}`);
        }
      } else if (updatedData.tenureDays) {
        console.log('Tenure is provided, skipping due date calculation from payment terms');
      } else {
        console.log('No invoice date or BL date available for due date calculation');
      }
    }
    
    // Handle invoice date change - recalculate due date prioritizing tenure over payment terms
    if (field === 'invoiceDate') {
      console.log(`Invoice date changed to: ${value}`);
      let calculatedDueDate = '';
      
      // Priority 1: Use tenure if provided
      if (updatedData.tenureDays) {
        calculatedDueDate = calculateDueDateFromTenure(
          value as string, 
          updatedData.blDate, 
          updatedData.tenureDays,
          updatedData.useInvoiceDateForCalculation,
          updatedData.useBLDateForCalculation
        );
        console.log(`Due date recalculated from invoice date + tenure: ${calculatedDueDate}`);
      }
      // Priority 2: Fallback to payment terms
      else if (updatedData.supplierPaymentTerms) {
        calculatedDueDate = calculateDueDate(
          value as string, 
          updatedData.blDate, 
          updatedData.supplierPaymentTerms,
          updatedData.useInvoiceDateForCalculation,
          updatedData.useBLDateForCalculation
        );
        console.log(`Due date recalculated from invoice date + payment terms: ${calculatedDueDate}`);
      }
      
      if (calculatedDueDate) {
        updatedData.dueDate = calculatedDueDate;
      }
    }
    
    // Handle BL date change - recalculate due date prioritizing tenure over payment terms
    if (field === 'blDate') {
      console.log(`BL date changed to: ${value}`);
      let calculatedDueDate = '';
      
      // Priority 1: Use tenure if provided
      if (updatedData.tenureDays) {
        calculatedDueDate = calculateDueDateFromTenure(
          updatedData.invoiceDate, 
          value as string, 
          updatedData.tenureDays,
          updatedData.useInvoiceDateForCalculation,
          updatedData.useBLDateForCalculation
        );
        console.log(`Due date recalculated from BL date + tenure: ${calculatedDueDate}`);
      }
      // Priority 2: Fallback to payment terms
      else if (updatedData.supplierPaymentTerms) {
        calculatedDueDate = calculateDueDate(
          updatedData.invoiceDate, 
          value as string, 
          updatedData.supplierPaymentTerms,
          updatedData.useInvoiceDateForCalculation,
          updatedData.useBLDateForCalculation
        );
        console.log(`Due date recalculated from BL date + payment terms: ${calculatedDueDate}`);
      }
      
      if (calculatedDueDate) {
        updatedData.dueDate = calculatedDueDate;
      }
    }
    
    // Handle tenure change - recalculate due date using tenure
    if (field === 'tenureDays') {
      console.log(`Tenure changed to: ${value} days`);
      if (updatedData.invoiceDate || updatedData.blDate) {
        const calculatedDueDate = calculateDueDateFromTenure(
          updatedData.invoiceDate, 
          updatedData.blDate, 
          value as number,
          updatedData.useInvoiceDateForCalculation,
          updatedData.useBLDateForCalculation
        );
        if (calculatedDueDate) {
          updatedData.dueDate = calculatedDueDate;
          console.log(`Due date recalculated from tenure: ${calculatedDueDate}`);
        }
      }
    }
    
    // Auto-calculate advance amount and fee amount when relevant fields change
    if (field === 'invoiceAmount' || field === 'advancePercentage') {
      const invoiceAmount = parseFloat(updatedData.invoiceAmount.toString()) || 0;
      
      // Calculate reserve amount first (always 20% of invoice amount)
      const reserveAmount = invoiceAmount * 0.20;
      
      // Available for advance is invoice minus reserve
      const availableForAdvance = invoiceAmount - reserveAmount;
      
      // Advance amount should not exceed available amount after reserve
      updatedData.advanceAmount = availableForAdvance;
      updatedData.reserveAmount = reserveAmount;
      
      // Validate against supplier and buyer limits
      if (selectedSupplier && invoiceAmount > 0) {
        const supplierAvailable = (selectedSupplier.totalLimitSanctioned || 0) - (selectedSupplier.usedLimit || 0);
        if (invoiceAmount > supplierAvailable) {
          toast.error(`Invoice amount exceeds supplier available limit of $${supplierAvailable.toLocaleString()}`);
        }
      }
      
      if (selectedBuyer && invoiceAmount > 0) {
        const buyerAvailable = (selectedBuyer.creditLimit || 0) - (selectedBuyer.usedCredit || 0);
        if (invoiceAmount > buyerAvailable) {
          toast.error(`Invoice amount exceeds buyer available credit of $${buyerAvailable.toLocaleString()}`);
        }
      }
    }
    
    // Recalculate fees when invoice amount, fee percentage, or payment terms change
    if (field === 'invoiceAmount' || field === 'feePercentage' || field === 'supplierPaymentTerms' || field === 'tenureDays' || field === 'advanceAmount') {
      const invoiceAmount = parseFloat(updatedData.invoiceAmount.toString()) || 0;
      const feePercentage = parseFloat(updatedData.feePercentage.toString()) || 0;
      const tenureDays = parseFloat(updatedData.tenureDays.toString()) || 0;
      const advanceAmount = parseFloat(updatedData.advanceAmount.toString()) || 0;
      const feeCalculation = calculateTotalFees(invoiceAmount, feePercentage, true, tenureDays, advanceAmount);
      updatedData.feeAmount = feeCalculation.totalFees;
      updatedData.reserveAmount = feeCalculation.reserveAmount;
      updatedData.transactionFee = feeCalculation.breakdown.transactionFee;
      updatedData.processingFee = feeCalculation.breakdown.processingFee;
      updatedData.factoringFee = feeCalculation.breakdown.factoringFee;
      updatedData.setupFee = feeCalculation.breakdown.setupFee;
    }
    
    // Also recalculate fees when supplier is selected (to apply supplier-specific fees)
    if (field === 'supplierId' && selectedSupplier) {
      const invoiceAmount = parseFloat(updatedData.invoiceAmount.toString()) || 0;
      const feePercentage = parseFloat(updatedData.feePercentage.toString()) || 0;
      const tenureDays = parseFloat(updatedData.tenureDays.toString()) || 0;
      const advanceAmount = parseFloat(updatedData.advanceAmount.toString()) || 0;
      if (invoiceAmount > 0) {
        const feeCalculation = calculateTotalFees(invoiceAmount, feePercentage, true, tenureDays, advanceAmount);
        updatedData.feeAmount = feeCalculation.totalFees;
        updatedData.reserveAmount = feeCalculation.reserveAmount;
        updatedData.transactionFee = feeCalculation.breakdown.transactionFee;
        updatedData.processingFee = feeCalculation.breakdown.processingFee;
        updatedData.factoringFee = feeCalculation.breakdown.factoringFee;
        updatedData.setupFee = feeCalculation.breakdown.setupFee;
      }
    }
    
    setFormData(updatedData);
  };
  

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      supportingDocuments: [...prev.supportingDocuments, ...files]
    }));
  };
  
  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      supportingDocuments: prev.supportingDocuments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const invoiceAmount = parseFloat(formData.invoiceAmount.toString()) || 0;
    
    // Validate limits
    if (selectedSupplier) {
      const supplierAvailable = (selectedSupplier.totalLimitSanctioned || 0) - (selectedSupplier.usedLimit || 0);
      if (invoiceAmount > supplierAvailable) {
        toast.error('Transaction exceeds supplier limit', {
          description: `Available supplier limit: $${supplierAvailable.toLocaleString()}`
        });
        return;
      }
    }
    
    if (selectedBuyer) {
      const buyerAvailable = (selectedBuyer.creditLimit || 0) - (selectedBuyer.usedCredit || 0);
      if (invoiceAmount > buyerAvailable) {
        toast.error('Transaction exceeds buyer credit limit', {
          description: `Available buyer credit: $${buyerAvailable.toLocaleString()}`
        });
        return;
      }
    }
    
    // Validate that supplier and buyer are selected
    if (!formData.supplierId || !formData.buyerId) {
      toast.error('Please select both supplier and buyer', {
        description: 'Both supplier and buyer are required to create a transaction.'
      });
      return;
    }

    const allowedCurrencies = ['USD', 'EUR', 'GBP'];
    const transactionCurrency = String(formData.currency || 'USD').toUpperCase();
    if (!allowedCurrencies.includes(transactionCurrency)) {
      toast.error('Invalid currency', {
        description: 'Allowed currencies are USD, EUR, GBP.'
      });
      return;
    }

    const supplierCurrency = getEntityCurrency(selectedSupplier);
    const buyerCurrency = getEntityCurrency(selectedBuyer);
    if (supplierCurrency !== buyerCurrency || transactionCurrency !== supplierCurrency) {
      toast.error('Currency mismatch', {
        description: `Supplier (${supplierCurrency}), Buyer (${buyerCurrency}), and Transaction (${transactionCurrency}) currencies must match.`
      });
      return;
    }
    
    try {
      console.log('=== TRANSACTION SUBMISSION DEBUG ===');
      console.log('Form data being sent:', JSON.stringify(formData, null, 2));
      console.log('Selected Supplier:', selectedSupplier);
      console.log('Selected Buyer:', selectedBuyer);

      const requestFormData = new FormData();
      const { supportingDocuments, ...payload } = formData;
      requestFormData.append('payload', JSON.stringify(payload));
      supportingDocuments.forEach((file) => {
        requestFormData.append('supportingDocuments', file);
      });
      
      // Send the data to the backend API
      const response = await fetch(createApiUrl('/transactions'), {
        method: 'POST',
        headers: { 
          ...getApiHeaders({ json: false })
        },
        body: requestFormData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Transaction creation failed:', response.status, errorData);
        throw new Error(errorData.message || 'Failed to create transaction');
      }
      
      const result = await response.json();
      const createdTransaction = result.data;
      
      toast.success('Transaction created successfully!', {
        description: `Transaction ID: ${createdTransaction.transactionId || 'N/A'} | Invoice ID: ${createdTransaction.invoiceId || 'N/A'}`
      });

      // Send NOA if requested
      if (formData.sendNOA && formData.buyerEmail) {
        try {
          const noaResponse = await fetch(createApiUrl('/noa/send'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify({
              transactionId: createdTransaction.transactionId,
              buyerEmail: formData.buyerEmail
            })
          });

          if (noaResponse.ok) {
            const noaResult = await noaResponse.json();
            toast.success('NOA sent successfully!', {
              description: `Notice of Assignment sent to ${formData.buyerEmail}`
            });
          } else {
            toast.warning('Transaction created but NOA failed to send', {
              description: 'You can manually send the NOA from the transaction details'
            });
          }
        } catch (noaError) {
          console.error('NOA send error:', noaError);
          toast.warning('Transaction created but NOA failed to send', {
            description: 'You can manually send the NOA from the transaction details'
          });
        }
      }
      
      // Trigger a refresh of the transactions list and entities
      window.dispatchEvent(new CustomEvent('refreshTransactions'));
      window.dispatchEvent(new CustomEvent('refreshEntities'));
      
      // Refresh entities data to get updated balances
      await fetchEntities();
      
      // Reset form
      setFormData({
        supplierId: '',
        buyerId: '',
        supplierName: '',
        buyerName: '',
        invoiceNumber: '',
        invoiceDate: '',
        blDate: '',
        dueDate: '',
        useInvoiceDateForCalculation: true,
        useBLDateForCalculation: false,
        tenureDays: '',
        invoiceAmount: '',
        currency: 'USD',
        advancePercentage: 80,
        advanceAmount: '',
        feePercentage: '',
        feeAmount: '',
        reserveAmount: '',
        // Fee breakdown
        transactionFee: 0,
        processingFee: 0,
        factoringFee: 0,
        setupFee: 0,
        supplierPaymentTerms: '',
        description: '',
        status: 'pending',
        transactionType: 'factoring',
        supportingDocuments: [],
        // NOA related fields
        buyerEmail: '',
        sendNOA: false
      });
      setSelectedSupplier(null);
      setSelectedBuyer(null);
      setAvailablePaymentTerms([]);
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error('Failed to create transaction', {
        description: 'Please check your data and try again.'
      });
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-financial-navy">
            Create New Transaction
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transaction Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="transactionType">Transaction Type *</Label>
                  <Select
                    value={formData.transactionType}
                    onValueChange={(value) => handleInputChange('transactionType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select transaction type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="factoring">Invoice Factoring</SelectItem>
                      <SelectItem value="discounting">Invoice Discounting</SelectItem>
                      <SelectItem value="financing">Trade Financing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Status Info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Automatic Status Management</p>
                      <p className="text-sm text-blue-700">
                        Transaction will start as <strong>Pending</strong> and automatically become <strong>Approved</strong> when buyer accepts the NOA
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Party Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Party Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplierId">Supplier *</Label>
                  <Select
                    value={formData.supplierId}
                    onValueChange={(value) => handleInputChange('supplierId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingEntities ? "Loading suppliers..." : "Select supplier"} />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.length === 0 && !loadingEntities ? (
                        <SelectItem value="no-suppliers" disabled>
                          No suppliers available
                        </SelectItem>
                      ) : (
                        suppliers.map((supplier) => {
                          const available = (supplier.totalLimitSanctioned || 0) - (supplier.usedLimit || 0);
                          const supplierId = supplier.id || supplier._id;
                          
                          if (!supplierId) {
                            console.error('Supplier missing ID:', supplier);
                            return null;
                          }
                          
                          return (
                            <SelectItem key={supplierId} value={supplierId}>
                              {supplier.name} - Available: ${available.toLocaleString()}
                            </SelectItem>
                          );
                        }).filter(Boolean)
                      )}
                      {suppliers.length === 0 && !loadingEntities && (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No suppliers available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {selectedSupplier && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Total Limit: ${(selectedSupplier.totalLimitSanctioned || 0).toLocaleString()} | 
                      Used: ${(selectedSupplier.usedLimit || 0).toLocaleString()} | 
                      Available: ${((selectedSupplier.totalLimitSanctioned || 0) - (selectedSupplier.usedLimit || 0)).toLocaleString()}
                    </div>
                  )}
                  {suppliers.length === 0 && !loadingEntities && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Add suppliers in the Entities section first
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="buyerId">Buyer *</Label>
                  <Select
                    value={formData.buyerId}
                    onValueChange={(value) => handleInputChange('buyerId', value)}
                    disabled={!formData.supplierId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !formData.supplierId ? "Select supplier first" :
                        loadingEntities ? "Loading buyers..." : 
                        filteredBuyers.length === 0 ? "No linked buyers" :
                        "Select buyer"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {!formData.supplierId ? (
                        <SelectItem value="select-supplier-first" disabled>
                          Select a supplier first
                        </SelectItem>
                      ) : filteredBuyers.length === 0 ? (
                        <SelectItem value="no-linked-buyers" disabled>
                          No buyers linked to this supplier
                        </SelectItem>
                      ) : (
                        filteredBuyers.map((buyer) => {
                          // Find the transaction limit for this supplier-buyer relationship
                          const supplierLimit = buyer.supplierLimits?.find((sl: any) => sl.supplierId === formData.supplierId);
                          const transactionLimit = supplierLimit?.transactionLimit || 0;
                          const available = transactionLimit; // Since usedAmount is 0
                          const buyerId = buyer.id || buyer._id;
                          
                          if (!buyerId) {
                            console.error('Buyer missing ID:', buyer);
                            return null;
                          }
                          
                          return (
                            <SelectItem key={buyerId} value={buyerId}>
                              {buyer.name} - Limit: ${available.toLocaleString()}
                            </SelectItem>
                          );
                        }).filter(Boolean)
                      )}
                      {!formData.supplierId && (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Please select a supplier first
                        </div>
                      )}
                      {formData.supplierId && filteredBuyers.length === 0 && !loadingEntities && (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No buyers linked to this supplier
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {selectedBuyer && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Credit Limit: ${(selectedBuyer.creditLimit || 0).toLocaleString()} | 
                      Used: ${(selectedBuyer.usedCredit || 0).toLocaleString()} | 
                      Available: ${((selectedBuyer.creditLimit || 0) - (selectedBuyer.usedCredit || 0)).toLocaleString()}
                    </div>
                  )}
                  {buyers.length === 0 && !loadingEntities && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Add buyers in the Entities section first
                    </p>
                  )}
                </div>

                {/* NOA (Notice of Assignment) Section */}
                <div className="col-span-2 mt-4 p-4 border rounded-lg bg-blue-50/30">
                  <Label className="text-sm font-medium mb-3 block">
                    Notice of Assignment (NOA) Settings
                  </Label>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sendNOA"
                        checked={formData.sendNOA}
                        onCheckedChange={(checked) => handleInputChange('sendNOA', checked)}
                      />
                      <Label htmlFor="sendNOA" className="text-sm">
                        Send NOA to buyer for digital verification
                      </Label>
                    </div>
                    
                    {formData.sendNOA && (
                      <div>
                        <Label htmlFor="buyerEmail">Buyer Email Address *</Label>
                        <Input
                          id="buyerEmail"
                          type="email"
                          value={formData.buyerEmail}
                          onChange={(e) => handleInputChange('buyerEmail', e.target.value)}
                          placeholder="buyer@company.com"
                          className="mt-1"
                          required={formData.sendNOA}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          The NOA will be sent to this email for digital signing
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NOA Status Display */}
          {formData.sendNOA && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notice of Assignment Process</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertDescription>
                    After creating this transaction, a Notice of Assignment will be sent to {formData.buyerEmail}. 
                    The buyer will need to digitally sign the NOA before the transaction can proceed to funding.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Invoice Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                  <Input
                    id="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                    placeholder="INV-001"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="invoiceDate">Invoice Date *</Label>
                  <Input
                    id="invoiceDate"
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="blDate">BL Date (Optional)</Label>
                  <Input
                    id="blDate"
                    type="date"
                    value={formData.blDate}
                    onChange={(e) => handleInputChange('blDate', e.target.value)}
                    placeholder="Bill of Lading date"
                  />
                </div>
              </div>
              
              {/* Date Selection Preference */}
              <div className="border rounded-lg p-4 bg-blue-50/30">
                <Label className="text-sm font-medium mb-3 block">
                  Select Base Date for Calculations
                </Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useInvoiceDateForCalculation"
                      checked={formData.useInvoiceDateForCalculation}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            useInvoiceDateForCalculation: true,
                            useBLDateForCalculation: false
                          }));
                        }
                      }}
                      disabled={!formData.invoiceDate}
                    />
                    <Label htmlFor="useInvoiceDateForCalculation" className="text-sm">
                      Use Invoice Date for calculations
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useBLDateForCalculation"
                      checked={formData.useBLDateForCalculation}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            useBLDateForCalculation: true,
                            useInvoiceDateForCalculation: false
                          }));
                        }
                      }}
                      disabled={!formData.blDate}
                    />
                    <Label htmlFor="useBLDateForCalculation" className="text-sm">
                      Use BL Date for calculations
                    </Label>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {formData.useBLDateForCalculation && formData.blDate
                    ? `BL Date (${formatDate(formData.blDate)}) will be used as base date for calculations`
                    : formData.useInvoiceDateForCalculation && formData.invoiceDate
                    ? `Invoice Date (${formatDate(formData.invoiceDate)}) will be used as base date for calculations`
                    : 'Select dates above to enable calculation preferences'
                  }
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tenureDays">Financing Tenure (Days) *</Label>
                  <Input
                    id="tenureDays"
                    type="number"
                    min="1"
                    max="180"
                    value={formData.tenureDays}
                    onChange={(e) => handleInputChange('tenureDays', e.target.value)}
                    placeholder="30"
                    required
                  />
                  <small className="text-gray-500 text-xs mt-1 block">Number of days for financing</small>
                </div>
                
                <div>
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                    placeholder="Auto-calculated from tenure"
                  />
                  <small className="text-gray-500 text-xs mt-1 block">
                    Calculated as: Base Date + Tenure Days
                  </small>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoiceAmount">Invoice Amount *</Label>
                  <Input
                    id="invoiceAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.invoiceAmount}
                    onChange={(e) => handleInputChange('invoiceAmount', e.target.value)}
                    placeholder="Enter invoice amount"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => handleInputChange('currency', value)}
                  >
                    <SelectTrigger disabled>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                  <small className="text-gray-500 text-xs mt-1 block">Auto-set from selected supplier/buyer currency</small>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Financial Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Supplier's Payment Terms */}
              <div>
                <Label htmlFor="supplierPaymentTerms">Supplier's Payment Terms</Label>
                <Select
                  value={formData.supplierPaymentTerms}
                  onValueChange={(value) => handleInputChange('supplierPaymentTerms', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.supplierId ? "Select payment terms" : "Select a supplier first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePaymentTerms.map((term) => (
                      <SelectItem key={term.value} value={term.value}>
                        {term.label}
                      </SelectItem>
                    ))}
                    {/* Fallback options if no terms are configured */}
                    {availablePaymentTerms.length === 0 && formData.supplierId && (
                      <>
                        <SelectItem value="0-30">0-30 days (Default)</SelectItem>
                        <SelectItem value="31-60">31-60 days (Default)</SelectItem>
                        <SelectItem value="61-90">61-90 days (Default)</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                {availablePaymentTerms.length === 0 && formData.supplierId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No payment terms configured for this supplier. Using default options.
                  </p>
                )}
                {selectedSupplier && selectedSupplier.transactionFees && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Debug: {JSON.stringify(selectedSupplier.transactionFees)}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="advancePercentage">Advance Percentage (%)</Label>
                  <Input
                    id="advancePercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.advancePercentage}
                    onChange={(e) => handleInputChange('advancePercentage', parseFloat(e.target.value) || 0)}
                    placeholder="80"
                  />
                </div>
                
                <div>
                  <Label htmlFor="advanceAmount">Available for Advance ({formData.currency})</Label>
                  <Input
                    id="advanceAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.advanceAmount}
                    onChange={(e) => handleInputChange('advanceAmount', parseFloat(e.target.value) || 0)}
                    placeholder="Calculated automatically"
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                
                <div>
                  <Label htmlFor="feePercentage">Fee Percentage (%)</Label>
                  <Input
                    id="feePercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.feePercentage}
                    readOnly
                    className="bg-muted"
                    placeholder="Auto-calculated from payment terms"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Automatically set based on selected payment terms
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="feeAmount">Fee Amount ({formData.currency})</Label>
                  <Input
                    id="feeAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.feeAmount}
                    onChange={(e) => handleInputChange('feeAmount', parseFloat(e.target.value) || 0)}
                    placeholder="2500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="reserveAmount">Reserve Amount ({formData.currency})</Label>
                  <Input
                    id="reserveAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.reserveAmount}
                    readOnly
                    placeholder="Auto-calculated as 20% of invoice amount"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Reserve amount is calculated as exactly 20% of the invoice amount
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fee Breakdown - Only show when supplier is selected */}
          {supplierFees && formData.invoiceAmount && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fee Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Invoice Amount:</span>
                        <span className="font-medium">${parseFloat(formData.invoiceAmount.toString()).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Advance Rate:</span>
                        <span className="font-medium">{supplierFees.advanceRate}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Available for Advance:</span>
                        <span className="font-medium text-green-600">
                          ${(parseFloat(formData.invoiceAmount.toString()) - (parseFloat(formData.invoiceAmount.toString()) * 0.20)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Transaction Fee:</span>
                        <span className="font-medium text-orange-600">
                          ${(formData.transactionFee || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Processing Fee:</span>
                        <span className="font-medium text-red-600">
                          ${(formData.processingFee || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Factoring Fee:</span>
                        <span className="font-medium text-purple-600">
                          ${(formData.factoringFee || 0).toLocaleString()}
                        </span>
                      </div>
                      {(formData.setupFee || 0) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Setup Fee:</span>
                          <span className="font-medium text-yellow-600">
                            ${(formData.setupFee || 0).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {(parseFloat(formData.reserveAmount?.toString() || '0') || 0) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Reserve Amount:</span>
                          <span className="font-medium text-blue-600">
                            ${(parseFloat(formData.reserveAmount?.toString() || '0') || 0).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-blue-300 mt-4 pt-4">
                    <div className="flex justify-between text-base font-semibold">
                      <span>Total Fees:</span>
                      <span className="text-red-700">
                        ${(parseFloat(formData.feeAmount.toString()) || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-semibold text-green-700 mt-2">
                      <span>Net Amount to Supplier:</span>
                      <span>
                        ${(
                          (parseFloat(formData.invoiceAmount.toString()) || 0) - 
                          (parseFloat(formData.reserveAmount?.toString() || '0') || 0) -
                          (parseFloat(formData.feeAmount.toString()) || 0)
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="description">Description / Notes</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Additional notes about this transaction..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Supporting Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Supporting Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="documents" className="block mb-2">Attach Documents (Optional)</Label>
                <Input
                  id="documents"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <small className="text-gray-500 block mt-1">
                  Supported formats: PDF, DOC, DOCX, JPG, PNG, XLSX, XLS (Max 10MB per file)
                </small>
              </div>
              
              {formData.supportingDocuments.length > 0 && (
                <div>
                  <Label className="block mb-2">Attached Files:</Label>
                  <div className="space-y-2">
                    {formData.supportingDocuments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">📎</span>
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" className="btn-financial">
              Create Transaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}