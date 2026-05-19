import React, { useState, useEffect } from 'react';
import { Banknote, Building, CheckCircle, Clock, DollarSign, Download, Eye, AlertCircle, CreditCard, ArrowUpCircle, ArrowDownCircle, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { createApiUrl, getApiHeaders } from '@/config/api';
import { formatDate, getDaysDifference } from '@/lib/utils';

interface SupplierPayment {
  supplierId: string;
  supplierName: string;
  bankDetails: {
    beneficiary: string;
    bank: string;
    branch: string;
    accountNumber: string;
    ifscCode: string;
    swiftCode?: string;
    currency: string;
  };
  pendingAmount: number;
  transactionCount: number;
  lastTransactionDate: string;
  status: 'pending' | 'ready' | 'processing';
  transactions: any[];
  setupFeeAmount?: number;
}

interface PayoutHistory {
  id: string;
  supplierId: string;
  supplierName?: string;
  amount: number;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
  processedAt?: string;
  reference: string;
  transactionIds?: string[];
  type?: 'advance_payment' | 'reserve_payment';
  method?: string;
}

interface IncomingPayment {
  id: string;
  supplierId: string;
  supplierName: string;
  reserveAmount: number;
  currency: string;
  invoiceId: string;
  invoiceReference: string;
  dueDate: string;
  status: 'pending_reserve' | 'reserve_sent' | 'completed';
  bankDetails: {
    beneficiary: string;
    bank: string;
    branch: string;
    accountNumber: string;
    ifscCode: string;
    swiftCode?: string;
    currency: string;
  };
  paymentBreakdown?: {
    invoiceAmount: number;
    paidAmount: number;
    remainingAmount: number;
    reservePercentage: number;
    transactionFee: number;
    processingFee: number;
    lateFees: number;
    netReserveAmount: number;
  };
  sentAt?: string;
  completedAt?: string;
  notes?: string;
}

interface OpenInvoice {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  buyerName: string;
  invoiceAmount: number;
  advanceAmount: number;
  feeAmount?: number;
  netPaidToSupplier?: number;
  buyerOwes?: number;
  paidAmount: number;
  remainingAmount: number;
  reserves: number;
  dueDate: string;
  status: string;
  agingDays: number;
  lateFees: number;
  fundedAt: string;
  totalAmountDue: number;
  paymentHistory: any[];
  isOverdue: boolean;
  isFullyPaid?: boolean;
  canReleaseReserve?: boolean;
  fundingDate: string;
}

interface TreasuryPaymentForm {
  serialNumber: string;
  transactionType: string;
  paymentAccountNumber: string;
  beneficiaryAccountNumber: string;
  effectiveDate: string;
  remarks: string;
  currency: string;
  amount: string;
  paymentProofFileName: string;
}

export default function Treasury() {
  const [activeTab, setActiveTab] = useState('open-invoices');
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [incomingPayments, setIncomingPayments] = useState<IncomingPayment[]>([]);
  const [openInvoices, setOpenInvoices] = useState<OpenInvoice[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<PayoutHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [incomingLoading, setIncomingLoading] = useState(false);
  const [openInvoicesLoading, setOpenInvoicesLoading] = useState(false);
  const [totalPendingAmount, setTotalPendingAmount] = useState(0);
  const [totalReserveAmount, setTotalReserveAmount] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState<SupplierPayment | null>(null);
  const [selectedIncomingPayment, setSelectedIncomingPayment] = useState<IncomingPayment | null>(null);
  const [payoutDetailsOpen, setPayoutDetailsOpen] = useState(false);
  const [reserveDetailsOpen, setReserveDetailsOpen] = useState(false);
  const [reserveConfirmationOpen, setReserveConfirmationOpen] = useState(false);
  const [bankConfirmationOpen, setBankConfirmationOpen] = useState(false);
  const [paymentCompletionOpen, setPaymentCompletionOpen] = useState(false);
  const [completedPayout, setCompletedPayout] = useState<any>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [treasuryPaymentForm, setTreasuryPaymentForm] = useState<TreasuryPaymentForm>({
    serialNumber: '',
    transactionType: 'bank_transfer',
    paymentAccountNumber: '',
    beneficiaryAccountNumber: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    remarks: '',
    currency: 'USD',
    amount: '',
    paymentProofFileName: ''
  });

  useEffect(() => {
    fetchSupplierPayments();
    fetchPayoutHistory();
    fetchIncomingPayments();
    fetchOpenInvoices();
    
    // Listen for payment due notifications to refresh treasury data
    const handlePaymentDueNotification = () => {
      console.log('💰 Payment due notification received, refreshing treasury data...');
      fetchSupplierPayments();
      fetchIncomingPayments();
      fetchOpenInvoices();
    };
    
    // Listen for custom events from notifications
    window.addEventListener('payment_due_notification', handlePaymentDueNotification);
    window.addEventListener('transaction_approved', handlePaymentDueNotification);
    window.addEventListener('transaction_funded', handlePaymentDueNotification);
    
    // Cleanup
    return () => {
      window.removeEventListener('payment_due_notification', handlePaymentDueNotification);
      window.removeEventListener('transaction_approved', handlePaymentDueNotification);
      window.removeEventListener('transaction_funded', handlePaymentDueNotification);
    };
  }, []);

  const fetchPayoutHistory = async () => {
    try {
      const response = await fetch(createApiUrl('/treasury/payout-history'), {
        headers: getApiHeaders()
      });
      
      if (response.ok) {
        const result = await response.json();
        setPayoutHistory(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching payout history:', error);
    }
  };

  const fetchIncomingPayments = async () => {
    try {
      setIncomingLoading(true);
      
      const response = await fetch(createApiUrl('/treasury/incoming-payments'), {
        headers: getApiHeaders()
      });
      
      if (response.ok) {
        const result = await response.json();
        setIncomingPayments(result.data || []);
        setTotalReserveAmount(result.data?.reduce((sum: number, payment: any) => sum + payment.reserveAmount, 0) || 0);
      } else {
        console.error('Failed to fetch incoming payments:', response.status, response.statusText);
        setIncomingPayments([]);
        setTotalReserveAmount(0);
      }
    } catch (error) {
      console.error('Error fetching incoming payments:', error);
      setIncomingPayments([]);
      setTotalReserveAmount(0);
    } finally {
      setIncomingLoading(false);
    }
  };

  const fetchSupplierPayments = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Fetching supplier payments from backend...');
      const response = await fetch(createApiUrl('/treasury/supplier-summary'), {
        headers: getApiHeaders()
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('📊 Supplier payments data:', result.data);
        
        setSupplierPayments(result.data || []);
        setTotalPendingAmount(result.data?.reduce((sum: number, payment: any) => sum + payment.pendingAmount, 0) || 0);
      } else {
        console.error('Failed to fetch supplier payments:', response.status, response.statusText);
        // Fallback to empty data
        setSupplierPayments([]);
        setTotalPendingAmount(0);
      }
    } catch (error) {
      console.error('Error fetching supplier payments:', error);
      // Fallback to empty data
      setSupplierPayments([]);
      setTotalPendingAmount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchOpenInvoices = async () => {
    try {
      setOpenInvoicesLoading(true);
      
      console.log('🔍 Fetching open invoices from backend...');
      const response = await fetch(createApiUrl('/treasury/open-invoices'), {
        headers: getApiHeaders()
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('📊 Open invoices data:', result.data);
        
        setOpenInvoices(result.data || []);
      } else {
        console.error('Failed to fetch open invoices:', response.status, response.statusText);
        setOpenInvoices([]);
      }
    } catch (error) {
      console.error('Error fetching open invoices:', error);
      setOpenInvoices([]);
    } finally {
      setOpenInvoicesLoading(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }

    try {
      setProcessing(invoiceId);
      
      const response = await fetch(createApiUrl(`/treasury/open-invoices/${invoiceId}`), {
        method: 'DELETE',
        headers: getApiHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        
        toast.success('Invoice deleted successfully!', {
          description: `Invoice ${result.data?.invoiceNumber} has been removed from the system.`
        });
        
        // Refresh open invoices list
        await fetchOpenInvoices();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete invoice');
      }
    } catch (error) {
      console.error('Delete invoice error:', error);
      toast.error('Failed to delete invoice', {
        description: error instanceof Error ? error.message : 'Please try again or contact support.'
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleProcessPayout = async (payment: SupplierPayment) => {
    setSelectedPayment(payment);
    setTreasuryPaymentForm({
      serialNumber: '',
      transactionType: 'bank_transfer',
      paymentAccountNumber: '',
      beneficiaryAccountNumber: payment.bankDetails?.accountNumber || '',
      effectiveDate: new Date().toISOString().split('T')[0],
      remarks: '',
      currency: payment.bankDetails?.currency || 'USD',
      amount: String(payment.pendingAmount || ''),
      paymentProofFileName: ''
    });
    setBankConfirmationOpen(true);
  };

  const validateTreasuryPaymentForm = () => {
    const requiredFields: Array<keyof TreasuryPaymentForm> = [
      'serialNumber',
      'transactionType',
      'paymentAccountNumber',
      'beneficiaryAccountNumber',
      'effectiveDate',
      'currency',
      'amount'
    ];

    const missing = requiredFields.filter((field) => !treasuryPaymentForm[field] || String(treasuryPaymentForm[field]).trim() === '');
    if (missing.length > 0) {
      toast.error(`Please fill required fields: ${missing.join(', ')}`);
      return false;
    }

    const parsedAmount = parseFloat(treasuryPaymentForm.amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('Amount must be greater than 0');
      return false;
    }

    return true;
  };

  const confirmAndProcessPayout = async () => {
    if (!selectedPayment) return;

    if (!validateTreasuryPaymentForm()) {
      return;
    }

    try {
      setProcessing(selectedPayment.supplierId);
      setBankConfirmationOpen(false);
      
      const payoutData = {
        supplierId: selectedPayment.supplierId,
        amount: selectedPayment.pendingAmount,
        transactionIds: selectedPayment.transactions.map(t => t.transactionId || t.id),
        bankDetails: selectedPayment.bankDetails,
        paymentInstruction: {
          serialNumber: treasuryPaymentForm.serialNumber,
          transactionType: treasuryPaymentForm.transactionType,
          paymentAccountNumber: treasuryPaymentForm.paymentAccountNumber,
          beneficiaryAccountNumber: treasuryPaymentForm.beneficiaryAccountNumber,
          effectiveDate: treasuryPaymentForm.effectiveDate,
          remarks: treasuryPaymentForm.remarks,
          currency: treasuryPaymentForm.currency,
          amount: parseFloat(treasuryPaymentForm.amount),
          paymentProofFileName: treasuryPaymentForm.paymentProofFileName
        }
      };
      
      console.log('Sending payout data:', payoutData);
      console.log('Selected payment:', selectedPayment);
      
      const response = await fetch(createApiUrl('/treasury/payout'), {
        method: 'POST',
        headers: {
          ...getApiHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payoutData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Payout response:', result);
        console.log('result.data:', result.data);
        
        setCompletedPayout({
          ...result.data, // Use result.data directly since it contains the payout info
          supplierName: selectedPayment.supplierName,
          status: result.data?.status || 'completed'
        });
        
        toast.success('Payout initiated successfully!', {
          description: `Payment of ${formatCurrency(selectedPayment.pendingAmount)} to ${selectedPayment.supplierName} is being processed.`
        });
        
        // Show completion popup
        setPaymentCompletionOpen(true);
        
        // Refresh data
        await fetchSupplierPayments();
        await fetchPayoutHistory();
      } else {
        throw new Error('Failed to process payout');
      }
    } catch (error) {
      console.error('Payout error:', error);
      toast.error('Failed to process payout', {
        description: 'Please try again or contact support.'
      });
    } finally {
      setProcessing(null);
    }
  };

  const downloadAcknowledgement = async (payoutId: string) => {
    try {
      console.log(`Attempting to download acknowledgement for payout: ${payoutId}`);
      console.log('completedPayout object:', completedPayout);
      console.log('completedPayout.id:', completedPayout?.id);
      console.log('completedPayout.payoutId:', completedPayout?.payoutId);
      
      // Use the provided payoutId parameter, or fallback to completedPayout.id or payoutId
      const actualPayoutId = payoutId || completedPayout?.id || completedPayout?.payoutId;
      
      if (!actualPayoutId || actualPayoutId === 'undefined') {
        toast.error('Payout ID is missing. Please try initiating the payout again.');
        return;
      }
      
      console.log(`Using payout ID: ${actualPayoutId}`);
      
      const response = await fetch(createApiUrl(`/treasury/payout/${actualPayoutId}/acknowledgement`), {
        headers: getApiHeaders()
      });
      
      console.log(`Response status: ${response.status}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Payment_Acknowledgement_${actualPayoutId}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success('Acknowledgement letter downloaded successfully!');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Download failed with response:', errorData);
        throw new Error(errorData.message || 'Failed to download acknowledgement');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download acknowledgement letter: ${error.message}`);
    }
  };

  const handleViewDetails = (payment: SupplierPayment) => {
    setSelectedPayment(payment);
    setPayoutDetailsOpen(true);
  };

  const handlePayReserve = async (incomingPayment: IncomingPayment) => {
    if (incomingPayment.status !== 'reserve_sent') {
      toast.info('Reserve payment is not ready yet', {
        description: 'Reserve can be released only after buyer payment is fully completed.'
      });
      return;
    }

    setSelectedIncomingPayment(incomingPayment);
    setReserveDetailsOpen(true);
  };

  const confirmReservePayment = () => {
    if (selectedIncomingPayment) {
      setReserveDetailsOpen(false);
      setReserveConfirmationOpen(true);
    }
  };

  const processReservePayment = async () => {
    if (!selectedIncomingPayment) return;

    try {
      setProcessing(selectedIncomingPayment.id);
      setReserveConfirmationOpen(false);
      
      const response = await fetch(createApiUrl('/treasury/pay-reserve'), {
        method: 'POST',
        headers: {
          ...getApiHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          incomingPaymentId: selectedIncomingPayment.id,
          invoiceId: selectedIncomingPayment.invoiceId,
          amount: selectedIncomingPayment.reserveAmount
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        toast.success('Reserve payment processed successfully!', {
          description: `Reserve payment of ${formatCurrency(selectedIncomingPayment.reserveAmount)} completed. Invoice has been closed.`
        });
        
        // Refresh data
        await fetchIncomingPayments();
        await fetchPayoutHistory();
        setSelectedIncomingPayment(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to process reserve payment');
      }
    } catch (error) {
      console.error('Reserve payment error:', error);
      toast.error('Failed to process reserve payment', {
        description: error instanceof Error ? error.message : 'Please try again or contact support.'
      });
    } finally {
      setProcessing(null);
    }
  };
  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-gray-100 text-gray-700 border-gray-300',
      ready: 'bg-green-100 text-green-700 border-green-300',
      processing: 'bg-blue-100 text-blue-700 border-blue-300'
    };
    return variants[status] || variants.pending;
  };

  const reservePaymentHistory = payoutHistory
    .filter((payout) => payout.type === 'reserve_payment' || payout.method === 'reserve_release')
    .slice(0, 10);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-financial-navy">Treasury Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage outgoing payments to suppliers and incoming reserve payments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Payments
          </Button>
          <Button className="btn-financial">
            <Banknote className="w-4 h-4 mr-2" />
            Process Payments
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="open-invoices" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Open Invoices
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="flex items-center gap-2">
            <ArrowUpCircle className="w-4 h-4" />
            Advance Payments
          </TabsTrigger>
          <TabsTrigger value="incoming" className="flex items-center gap-2">
            <ArrowDownCircle className="w-4 h-4" />
            Reserve Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open-invoices" className="space-y-6">
          {/* Open Invoices Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="financial-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Outstanding</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-financial-navy">
                      {formatCurrency(openInvoices.reduce((sum, inv) => sum + inv.totalAmountDue, 0))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Across {openInvoices.length} invoices
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="financial-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-financial-navy">
                      {openInvoices.filter(inv => inv.isOverdue).length}
                    </div>
                    <p className="text-xs text-red-600">Require attention</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="financial-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Late Fees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-financial-navy">
                      {formatCurrency(openInvoices.reduce((sum, inv) => sum + inv.lateFees, 0))}
                    </div>
                    <p className="text-xs text-muted-foreground">Total accumulated</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Open Invoices Table */}
          <Card className="financial-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-financial-navy flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Open Invoices - Awaiting Buyer Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="font-semibold">Invoice Details</TableHead>
                    <TableHead className="font-semibold">Buyer</TableHead>
                    <TableHead className="font-semibold">Amounts</TableHead>
                    <TableHead className="font-semibold">Due Date</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openInvoicesLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="space-y-3">
                          <Clock className="w-8 h-8 mx-auto text-muted-foreground animate-spin" />
                          <p className="text-muted-foreground">Loading open invoices...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : openInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="space-y-3">
                          <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
                          <p className="text-muted-foreground text-lg">No open invoices</p>
                          <p className="text-sm text-muted-foreground">
                            Funded invoices awaiting buyer payment will appear here
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    openInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="border-border hover:bg-muted/30">
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-financial-navy">{invoice.invoiceNumber}</p>
                            <p className="text-xs text-muted-foreground">ID: {invoice.id}</p>
                            <p className="text-xs text-blue-600">From: {invoice.supplierName}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{invoice.buyerName}</p>
                            {invoice.agingDays > 0 && (
                              <p className="text-xs text-red-600">
                                {invoice.agingDays} days overdue
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm">
                              <span className="text-muted-foreground">Invoice: </span>
                              <span className="font-medium">{formatCurrency(invoice.invoiceAmount)}</span>
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Advance: </span>
                              <span className="text-blue-600">{formatCurrency(invoice.advanceAmount)}</span>
                              {invoice.feeAmount && (
                                <span className="text-xs text-orange-600"> (-${formatCurrency(invoice.feeAmount, 'USD').replace('$', '')} fee)</span>
                              )}
                            </p>
                            {invoice.netPaidToSupplier && (
                              <p className="text-sm">
                                <span className="text-muted-foreground">Net paid: </span>
                                <span className="font-medium text-green-600">{formatCurrency(invoice.netPaidToSupplier)}</span>
                              </p>
                            )}
                            <p className="text-sm border-t pt-1">
                              <span className="text-muted-foreground">Buyer owes: </span>
                              <span className="font-medium">{formatCurrency(invoice.invoiceAmount)}</span>
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Paid: </span>
                              <span className="font-medium text-green-600">{formatCurrency(invoice.paidAmount)}</span>
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Outstanding: </span>
                              <span className="font-bold text-red-600">{formatCurrency(invoice.totalAmountDue)}</span>
                            </p>
                            {invoice.lateFees > 0 && (
                              <p className="text-xs text-orange-600">
                                + Late fees: {formatCurrency(invoice.lateFees)}
                              </p>
                            )}
                            {invoice.canReleaseReserve && (
                              <p className="text-xs text-green-600">
                                ✓ Ready to release reserves: {formatCurrency(invoice.reserves)}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">
                              {formatDate(invoice.dueDate)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Funded: {invoice.fundingDate}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge className={
                              invoice.isFullyPaid && invoice.canReleaseReserve
                                ? 'bg-green-100 text-green-700 border-green-300'
                                : invoice.isOverdue 
                                ? 'bg-red-100 text-red-700 border-red-300'
                                : invoice.status === 'funded'
                                ? 'bg-blue-100 text-blue-700 border-blue-300'
                                : invoice.status === 'settled'
                                ? 'bg-green-100 text-green-700 border-green-300'
                                : 'bg-gray-100 text-gray-700 border-gray-300'
                            }>
                              {invoice.isFullyPaid && invoice.canReleaseReserve
                                ? 'Ready to Close'
                                : invoice.isOverdue 
                                ? 'Overdue'
                                : invoice.status === 'settled'
                                ? 'Fully Paid'
                                : invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </Badge>
                            {invoice.isFullyPaid && (
                              <p className="text-xs text-green-600">✓ Paid in full</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteInvoice(invoice.id)}
                              disabled={processing === invoice.id}
                            >
                              {processing === invoice.id ? (
                                <Clock className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                // Future: Add view/edit functionality
                                toast.info('Invoice details coming soon!');
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outgoing" className="space-y-6">{/* Outgoing Payments - Current Implementation */}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="financial-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-financial-navy">
                  {formatCurrency(totalPendingAmount)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across {supplierPayments.length} suppliers
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="financial-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ready for Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-financial-navy">
                  {supplierPayments.filter(p => p.status === 'ready').length}
                </div>
                <p className="text-xs text-success">Suppliers ready</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="financial-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-financial-navy">
                  {supplierPayments.reduce((sum, p) => sum + p.transactionCount, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Processed transactions</p>
              </div>
              <Building className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Payments Table */}
      <Card className="financial-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-financial-navy">
            Supplier Payment Queue
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="font-semibold">Supplier Details</TableHead>
                <TableHead className="font-semibold">Bank Account</TableHead>
                <TableHead className="font-semibold">Payment Amount</TableHead>
                <TableHead className="font-semibold">Transactions</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="space-y-3">
                      <Clock className="w-8 h-8 mx-auto text-muted-foreground animate-spin" />
                      <p className="text-muted-foreground">Loading supplier payments...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : supplierPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="space-y-3">
                      <Banknote className="w-12 h-12 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground text-lg">No pending payments</p>
                      <p className="text-sm text-muted-foreground">
                        Supplier payments will appear here after transactions are processed
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                supplierPayments.map((payment) => (
                  <TableRow key={payment.supplierId} className="border-border hover:bg-muted/30">
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-financial-navy">{payment.supplierName}</p>
                        <p className="text-xs text-muted-foreground">{payment.supplierId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{payment.bankDetails?.beneficiary || 'Bank details pending'}</p>
                        <p className="text-xs text-muted-foreground">{payment.bankDetails?.bank || 'Bank not specified'}</p>
                        <p className="text-xs text-muted-foreground">
                          {payment.bankDetails?.accountNumber ? `${payment.bankDetails.accountNumber} • ${payment.bankDetails.ifscCode}` : 'Account details pending'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-lg font-bold text-success">
                          {formatCurrency(payment.pendingAmount, payment.bankDetails?.currency || 'INR')}
                        </p>
                        <p className="text-xs text-muted-foreground">Net after fees</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{payment.transactionCount} transactions</p>
                        {payment.lastTransactionDate && (
                          <p className="text-xs text-muted-foreground">
                            Last: {formatDate(payment.lastTransactionDate)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(payment.status)}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewDetails(payment)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          className="btn-financial"
                          onClick={() => handleProcessPayout(payment)}
                          disabled={processing === payment.supplierId}
                        >
                          {processing === payment.supplierId ? (
                            <Clock className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4 mr-1" />
                              Pay
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payout History Card */}
      {payoutHistory.length > 0 && (
        <Card className="financial-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-financial-navy flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Recent Payouts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="font-semibold">Reference</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Processed Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoutHistory.slice(0, 5).map((payout) => (
                  <TableRow key={payout.id} className="border-border">
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-financial-navy">{payout.reference}</p>
                        <p className="text-xs text-muted-foreground">{payout.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-success">
                        {formatCurrency(payout.amount)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(payout.status)}>
                        {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {payout.processedAt 
                          ? new Date(payout.processedAt).toLocaleDateString()
                          : 'Processing...'
                        }
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

        </TabsContent>

        <TabsContent value="incoming" className="space-y-6">
          {/* Incoming Payments - Reserves Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="financial-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Reserve Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-financial-navy">
                      {formatCurrency(totalReserveAmount)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Across {incomingPayments.length} invoices
                    </p>
                  </div>
                  <ArrowDownCircle className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="financial-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reserves</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-financial-navy">
                      {incomingPayments.filter(p => p.status === 'pending_reserve').length}
                    </div>
                    <p className="text-xs text-orange-600">Awaiting payment</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="financial-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-financial-navy">
                      {incomingPayments.length}
                    </div>
                    <p className="text-xs text-muted-foreground">With pending reserves</p>
                  </div>
                  <Building className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Incoming Payments Table */}
          <Card className="financial-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-financial-navy">
                Reserve Payment Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="font-semibold">Supplier & Invoice</TableHead>
                    <TableHead className="font-semibold">Bank Details</TableHead>
                    <TableHead className="font-semibold">Reserve Amount</TableHead>
                    <TableHead className="font-semibold">Due Date</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomingLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="space-y-3">
                          <Clock className="w-8 h-8 mx-auto text-muted-foreground animate-spin" />
                          <p className="text-muted-foreground">Loading incoming payments...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : incomingPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="space-y-3">
                          <ArrowDownCircle className="w-12 h-12 mx-auto text-muted-foreground" />
                          <p className="text-muted-foreground text-lg">No pending reserve payments</p>
                          <p className="text-sm text-muted-foreground">
                            Reserve payment requests will appear here when sent from monitoring
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    incomingPayments.map((payment) => (
                      <TableRow key={payment.id} className="border-border hover:bg-muted/30">
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-financial-navy">{payment.supplierName}</p>
                            <p className="text-xs text-muted-foreground">ID: {payment.supplierId}</p>
                            <p className="text-xs text-blue-600">Invoice: {payment.invoiceReference}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-sm">{payment.bankDetails?.beneficiary || 'Bank details pending'}</p>
                            <p className="text-xs text-muted-foreground">{payment.bankDetails?.bank || 'Bank not specified'}</p>
                            <p className="text-xs text-muted-foreground">
                              {payment.bankDetails?.accountNumber ? `${payment.bankDetails.accountNumber} • ${payment.bankDetails.ifscCode}` : 'Account details pending'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-lg font-bold text-blue-600">
                              {formatCurrency(payment.reserveAmount, payment.currency)}
                            </p>
                            <p className="text-xs text-muted-foreground">Reserve amount</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">
                              {formatDate(payment.dueDate)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getDaysDifference(payment.dueDate)} days
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            payment.status === 'pending_reserve' 
                              ? 'bg-orange-100 text-orange-700 border-orange-300'
                              : payment.status === 'reserve_sent'
                              ? 'bg-blue-100 text-blue-700 border-blue-300'
                              : 'bg-green-100 text-green-700 border-green-300'
                          }>
                            {payment.status.replace('_', ' ').charAt(0).toUpperCase() + payment.status.replace('_', ' ').slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedIncomingPayment(payment);
                                setReserveDetailsOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              className="btn-financial"
                              onClick={() => handlePayReserve(payment)}
                              disabled={processing === payment.id || payment.status === 'completed'}
                            >
                              {processing === payment.id ? (
                                <Clock className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <CreditCard className="w-4 h-4 mr-1" />
                                  {payment.status === 'reserve_sent' ? 'Pay Reserve' : 'Check Reserve'}
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="financial-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-financial-navy flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Reserve Payment History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="font-semibold">Reference</TableHead>
                    <TableHead className="font-semibold">Supplier</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Processed Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservePaymentHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No reserve payment history yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    reservePaymentHistory.map((payout) => (
                      <TableRow key={payout.id} className="border-border">
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-financial-navy">{payout.reference}</p>
                            <p className="text-xs text-muted-foreground">{payout.id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{payout.supplierName || payout.supplierId}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-success">{formatCurrency(payout.amount)}</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(payout.status)}>
                            {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {payout.processedAt
                              ? new Date(payout.processedAt).toLocaleDateString()
                              : 'Processing...'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payout Details Dialog */}
      <Dialog open={payoutDetailsOpen} onOpenChange={setPayoutDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-financial-navy">
              Payout Details - {selectedPayment?.supplierName}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-6">
              {/* Bank Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Bank Account Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Beneficiary</p>
                      <p className="font-medium">{selectedPayment.bankDetails?.beneficiary || 'Bank details pending'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Bank</p>
                      <p className="font-medium">{selectedPayment.bankDetails?.bank || 'Bank not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Account Number</p>
                      <p className="font-medium">{selectedPayment.bankDetails?.accountNumber || 'Account pending'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">IFSC Code</p>
                      <p className="font-medium">{selectedPayment.bankDetails?.ifscCode || 'IFSC pending'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Transaction Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Invoice Amount</TableHead>
                        <TableHead>Advance</TableHead>
                        <TableHead>Fees</TableHead>
                        <TableHead>Net Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPayment.transactions.map((txn, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{txn.invoiceNumber}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(txn.invoiceDate)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(parseFloat(txn.invoiceAmount) || 0)}</TableCell>
                          <TableCell className="text-blue-600">
                            {formatCurrency(parseFloat(txn.advanceAmount) || 0)}
                          </TableCell>
                          <TableCell className="text-red-600">
                            -{formatCurrency(parseFloat(txn.perTransactionFees || txn.feeAmount) || 0)}
                          </TableCell>
                          <TableCell className="font-bold text-success">
                            {formatCurrency(parseFloat(txn.netAmount) || 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {selectedPayment.setupFeeAmount > 0 && (
                        <TableRow className="bg-amber-50">
                          <TableCell colSpan={3}>
                            <div>
                              <p className="font-medium text-sm">Setup Fee (One-time)</p>
                              <p className="text-xs text-muted-foreground">Applied to credit limit</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-red-600 font-medium">
                            -{formatCurrency(selectedPayment.setupFeeAmount)}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      )}
                      <TableRow className="border-t-2 font-bold">
                        <TableCell colSpan={4}>Total Payment Amount:</TableCell>
                        <TableCell className="text-lg text-success">
                          {formatCurrency(selectedPayment.pendingAmount)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setPayoutDetailsOpen(false)}
                >
                  Close
                </Button>
                <Button 
                  className="btn-financial"
                  onClick={() => {
                    setPayoutDetailsOpen(false);
                    handleProcessPayout(selectedPayment);
                  }}
                  disabled={processing === selectedPayment.supplierId}
                >
                  {processing === selectedPayment.supplierId ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Process Payment
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bank Account Confirmation Dialog */}
      <Dialog open={bankConfirmationOpen} onOpenChange={setBankConfirmationOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-financial-navy flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Confirm Payment Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-financial-navy mb-2">Payment Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Supplier:</span>
                    <span className="font-medium">{selectedPayment.supplierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Amount:</span>
                    <span className="font-bold text-success text-lg">
                      {formatCurrency(selectedPayment.pendingAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Transactions:</span>
                    <span className="font-medium">{selectedPayment.transactionCount}</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h3 className="font-semibold text-financial-navy mb-2 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Bank Account Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Beneficiary: </span>
                    <span className="font-medium">{selectedPayment.bankDetails?.beneficiary || 'Bank details pending'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Bank: </span>
                    <span className="font-medium">{selectedPayment.bankDetails?.bank || 'Bank not specified'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Branch: </span>
                    <span className="font-medium">{selectedPayment.bankDetails?.branch || 'Branch pending'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Account: </span>
                    <span className="font-medium">{selectedPayment.bankDetails?.accountNumber || 'Account pending'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">IFSC: </span>
                    <span className="font-medium">{selectedPayment.bankDetails?.ifscCode || 'IFSC pending'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold text-financial-navy mb-3">Treasury Payment Form</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label htmlFor="serialNumber">Serial Number *</Label>
                    <Input
                      id="serialNumber"
                      value={treasuryPaymentForm.serialNumber}
                      onChange={(e) => setTreasuryPaymentForm(prev => ({ ...prev, serialNumber: e.target.value }))}
                      placeholder="Enter serial number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="transactionType">Transaction Type *</Label>
                    <Input
                      id="transactionType"
                      value={treasuryPaymentForm.transactionType}
                      onChange={(e) => setTreasuryPaymentForm(prev => ({ ...prev, transactionType: e.target.value }))}
                      placeholder="e.g. bank_transfer"
                    />
                  </div>

                  <div>
                    <Label htmlFor="paymentAccountNumber">Payment Account Number *</Label>
                    <Input
                      id="paymentAccountNumber"
                      value={treasuryPaymentForm.paymentAccountNumber}
                      onChange={(e) => setTreasuryPaymentForm(prev => ({ ...prev, paymentAccountNumber: e.target.value }))}
                      placeholder="Enter payment account number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="beneficiaryAccountNumber">Beneficiary Account Number *</Label>
                    <Input
                      id="beneficiaryAccountNumber"
                      value={treasuryPaymentForm.beneficiaryAccountNumber}
                      onChange={(e) => setTreasuryPaymentForm(prev => ({ ...prev, beneficiaryAccountNumber: e.target.value }))}
                      placeholder="Enter beneficiary account number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="effectiveDate">Effective Date *</Label>
                    <Input
                      id="effectiveDate"
                      type="date"
                      value={treasuryPaymentForm.effectiveDate}
                      onChange={(e) => setTreasuryPaymentForm(prev => ({ ...prev, effectiveDate: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="currency">Currency *</Label>
                    <Input
                      id="currency"
                      value={treasuryPaymentForm.currency}
                      onChange={(e) => setTreasuryPaymentForm(prev => ({ ...prev, currency: e.target.value }))}
                      placeholder="USD"
                    />
                  </div>

                  <div>
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={treasuryPaymentForm.amount}
                      onChange={(e) => setTreasuryPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="Enter amount"
                    />
                  </div>

                  <div>
                    <Label htmlFor="remarks">Remarks</Label>
                    <Textarea
                      id="remarks"
                      value={treasuryPaymentForm.remarks}
                      onChange={(e) => setTreasuryPaymentForm(prev => ({ ...prev, remarks: e.target.value }))}
                      placeholder="Enter remarks"
                    />
                  </div>

                  <div>
                    <Label htmlFor="paymentProof">Attach Payment Proof</Label>
                    <Input
                      id="paymentProof"
                      type="file"
                      onChange={(e) => {
                        const fileName = e.target.files && e.target.files[0] ? e.target.files[0].name : '';
                        setTreasuryPaymentForm(prev => ({ ...prev, paymentProofFileName: fileName }));
                      }}
                    />
                    {treasuryPaymentForm.paymentProofFileName && (
                      <p className="text-xs text-muted-foreground mt-1">Attached: {treasuryPaymentForm.paymentProofFileName}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setBankConfirmationOpen(false)}
                  disabled={processing === selectedPayment.supplierId}
                >
                  Cancel
                </Button>
                <Button 
                  className="btn-financial"
                  onClick={confirmAndProcessPayout}
                  disabled={processing === selectedPayment.supplierId}
                >
                  {processing === selectedPayment.supplierId ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Confirm & Pay
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Completion Dialog */}
      <Dialog open={paymentCompletionOpen} onOpenChange={setPaymentCompletionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-success flex items-center gap-2">
              <CheckCircle className="w-6 h-6" />
              Payment Completed!
            </DialogTitle>
          </DialogHeader>
          
          {completedPayout && (
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-success" />
                </div>
                <h3 className="text-lg font-semibold text-financial-navy mb-2">
                  Payment Successfully Processed
                </h3>
                <p className="text-muted-foreground">
                  Your payment to {completedPayout.supplierName} has been initiated and is being processed.
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment ID:</span>
                    <span className="font-medium">{completedPayout.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference:</span>
                    <span className="font-medium">{completedPayout.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-bold text-success">
                      {formatCurrency(completedPayout.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className="bg-blue-100 text-blue-700">
                      {completedPayout.status ? 
                        completedPayout.status.charAt(0).toUpperCase() + completedPayout.status.slice(1) : 
                        'Completed'
                      }
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                  className="btn-financial w-full"
                  onClick={() => downloadAcknowledgement(completedPayout.id)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Acknowledgement Letter
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => setPaymentCompletionOpen(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reserve Payment Details Dialog */}
      <Dialog open={reserveDetailsOpen} onOpenChange={setReserveDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-financial-navy flex items-center gap-2">
              <ArrowDownCircle className="w-6 h-6" />
              Reserve Payment Details - {selectedIncomingPayment?.supplierName}
            </DialogTitle>
          </DialogHeader>
          
          {selectedIncomingPayment && (
            <div className="space-y-6">
              {/* Invoice Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-financial-navy">Invoice Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Invoice Reference</p>
                      <p className="font-medium">{selectedIncomingPayment.invoiceReference}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Invoice ID</p>
                      <p className="font-medium">{selectedIncomingPayment.invoiceId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Supplier</p>
                      <p className="font-medium">{selectedIncomingPayment.supplierName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Supplier ID</p>
                      <p className="font-medium">{selectedIncomingPayment.supplierId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Due Date</p>
                      <p className="font-medium">{formatDate(selectedIncomingPayment.dueDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                        {selectedIncomingPayment.status.replace('_', ' ').charAt(0).toUpperCase() + selectedIncomingPayment.status.replace('_', ' ').slice(1)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-financial-navy">Payment Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedIncomingPayment.paymentBreakdown ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Original Invoice Amount</span>
                            <span className="font-medium">{formatCurrency(selectedIncomingPayment.paymentBreakdown.invoiceAmount)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Amount Paid</span>
                            <span className="font-medium text-green-600">-{formatCurrency(selectedIncomingPayment.paymentBreakdown.paidAmount)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Remaining Amount</span>
                            <span className="font-medium">{formatCurrency(selectedIncomingPayment.paymentBreakdown.remainingAmount)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Late Fees</span>
                            <span className="font-medium text-red-600">{formatCurrency(selectedIncomingPayment.paymentBreakdown.lateFees)}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Reserve Percentage</span>
                            <span className="font-medium">{selectedIncomingPayment.paymentBreakdown.reservePercentage}%</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Transaction Fee (Already Paid)</span>
                            <span className="font-medium text-gray-500">{formatCurrency(selectedIncomingPayment.paymentBreakdown.transactionFee)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Processing Fee (Already Paid)</span>
                            <span className="font-medium text-gray-500">{formatCurrency(selectedIncomingPayment.paymentBreakdown.processingFee)}</span>
                          </div>
                          {selectedIncomingPayment.paymentBreakdown.lateFees > 0 && (
                            <div className="flex justify-between py-2 border-b">
                              <span className="text-muted-foreground">Late Fees (Added)</span>
                              <span className="font-medium text-red-600">+{formatCurrency(selectedIncomingPayment.paymentBreakdown.lateFees)}</span>
                            </div>
                          )}
                          <div className="flex justify-between py-2 border-t-2 border-financial-navy pt-3">
                            <span className="font-semibold text-financial-navy">Net Reserve Amount</span>
                            <span className="font-bold text-lg text-success">{formatCurrency(selectedIncomingPayment.paymentBreakdown.netReserveAmount)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Clarification Note */}
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-700">
                          <strong>Note:</strong> The reserve amount represents the full 20% held from the original invoice. 
                          Transaction and processing fees were already deducted when the invoice was processed. 
                          {selectedIncomingPayment.paymentBreakdown.lateFees > 0 
                            ? ' Late fees are added to the reserve amount due to overdue payments.' 
                            : ' No additional fees apply to this reserve payment.'
                          }
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-lg font-semibold text-success">Reserve Amount: {formatCurrency(selectedIncomingPayment.reserveAmount)}</p>
                      <p className="text-sm text-muted-foreground">20% of invoice amount held as reserve</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bank Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-financial-navy">Supplier Bank Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Beneficiary Name</p>
                      <p className="font-medium">{selectedIncomingPayment.bankDetails?.beneficiary || 'Bank details pending'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bank Name</p>
                      <p className="font-medium">{selectedIncomingPayment.bankDetails?.bank || 'Bank not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Branch</p>
                      <p className="font-medium">{selectedIncomingPayment.bankDetails?.branch || 'Branch pending'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Account Number</p>
                      <p className="font-mono font-medium">{selectedIncomingPayment.bankDetails?.accountNumber || 'Account pending'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">IFSC Code</p>
                      <p className="font-mono font-medium">{selectedIncomingPayment.bankDetails?.ifscCode || 'IFSC pending'}</p>
                    </div>
                    {selectedIncomingPayment.bankDetails?.swiftCode && (
                      <div>
                        <p className="text-sm text-muted-foreground">SWIFT Code</p>
                        <p className="font-mono font-medium">{selectedIncomingPayment.bankDetails.swiftCode}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Currency</p>
                      <p className="font-medium">{selectedIncomingPayment.bankDetails.currency}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setReserveDetailsOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="btn-financial"
                  onClick={confirmReservePayment}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Proceed to Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reserve Payment Confirmation Dialog */}
      <Dialog open={reserveConfirmationOpen} onOpenChange={setReserveConfirmationOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-orange-600 flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Confirm Reserve Payment
            </DialogTitle>
          </DialogHeader>
          
          {selectedIncomingPayment && (
            <div className="space-y-6">
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <p className="text-sm text-muted-foreground">You are about to process a reserve payment of:</p>
                <p className="text-2xl font-bold text-financial-navy">
                  {formatCurrency(selectedIncomingPayment.reserveAmount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  To: {selectedIncomingPayment.supplierName} ({selectedIncomingPayment.bankDetails.beneficiary})
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm font-medium text-yellow-800 mb-2">⚠️ Important Notice:</p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• This payment will be processed immediately</li>
                  <li>• The invoice will be automatically closed</li>
                  <li>• This action cannot be undone</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setReserveConfirmationOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={processReservePayment}
                  disabled={processing === selectedIncomingPayment?.id}
                >
                  {processing === selectedIncomingPayment?.id ? (
                    <Clock className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  Confirm & Pay Reserve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
