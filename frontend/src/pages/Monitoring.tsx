import React, { useState, useEffect } from 'react';
import { AlertTriangle, Activity, TrendingUp, Eye, Bell, CheckCircle, XCircle, DollarSign, Calendar, Clock, RefreshCw, FileText, Download, Banknote } from 'lucide-react';
import { mockAlerts, mockTransactions } from '@/data/demoData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import InvoicePaymentDialog from '@/components/forms/InvoicePaymentDialog';
import InvoiceClosureDialog from '@/components/forms/InvoiceClosureDialog';
import { createApiUrl, getApiHeaders } from '@/config/api';
import { formatDate } from '@/lib/utils';

interface TransactionMonitoring {
  id: string;
  transactionId: string;
  healthStatus: 'healthy' | 'warning' | 'critical';
  agingDays: number;
  agingBucket: '0-30' | '31-60' | '61-90' | '90+';
  isOverdue: boolean;
  overdueBy?: number;
  riskScore?: number;
  lastUpdated: string;
}

interface SystemAlert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  entityId?: string;
  entityType?: 'transaction' | 'buyer' | 'supplier';
  transactionId?: string;
  isRead: boolean;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
  expiresAt?: string;
}

interface RiskIndicator {
  id: string;
  entityId: string;
  entityType: 'buyer' | 'supplier';
  indicatorType: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  value: number;
  threshold: number;
  isActive: boolean;
  detectedAt: string;
  lastUpdated: string;
}

interface OpenInvoice {
  id: string;
  transactionId?: string;
  invoiceNumber?: string;
  payoutId: string;
  supplierId: string;
  supplierName: string;
  buyerName?: string;
  invoiceAmount: number;
  advanceAmount?: number;
  feeAmount?: number;
  paidAmount: number;
  remainingAmount: number;
  invoiceDate?: string;
  dueDate: string;
  status: 'pending' | 'partially_paid' | 'paid' | 'overdue' | 'closed' | 'expired' | 'pending_reserves';
  agingDays: number;
  lateFees?: number;
  reserves?: number;
  paymentHistory: Array<{
    id: string;
    amount: number;
    paidAt: string;
    paidBy: string;
    reference?: string;
    notes?: string;
  }>;
  alerts: Array<{
    id: string;
    alertType: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
    isRead: boolean;
    isResolved: boolean;
    createdAt: string;
  }>;
  reference: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  closedAt?: string;
  closedBy?: string;
  closureNotes?: string;
}

interface MonitoringDashboard {
  healthSummary: {
    total: number;
    healthy: number;
    warning: number;
    critical: number;
    overdue: number;
  };
  recentAlerts: SystemAlert[];
  activeRisks: RiskIndicator[];
  highRiskTransactions: TransactionMonitoring[];
  agingAnalysis: {
    '0-30': number;
    '31-60': number;
    '61-90': number;
    '90+': number;
  };
  lastUpdated: string;
}

interface SignedNOARecord {
  _id: string;
  noaId: string;
  transactionId: string;
  supplierName: string;
  buyerName: string;
  invoiceNumber: string;
  invoiceValue: number;
  dueDate?: string;
  acknowledgedAt?: string;
  updatedAt?: string;
  buyerEmail?: string;
  signatoryData?: {
    fullName?: string;
    position?: string;
    ipAddress?: string;
    userAgent?: string;
    signatureDataUrl?: string;
    photoDataUrl?: string;
    location?: {
      city?: string;
      country?: string;
      latitude?: number;
      longitude?: number;
    };
  };
}

interface FeesSummary {
  totalCollected: number;
  feesThisMonth: number;
  transactionFees: number;
  processingFees: number;
  factoringFees: number;
  setupFees: number;
  generalFees: number;
  lateFees: number;
  serviceFees: number;
}

interface FeeBreakdownItem {
  type: string;
  amount: number;
  percentage: number;
}

interface FeeMonthlyTrendItem {
  label: string;
  total: number;
}

interface FeeTransactionRow {
  transactionId: string;
  supplierName: string;
  buyerName: string;
  invoiceNumber: string;
  currency: string;
  status: string;
  collectedDate: string;
  transactionFee: number;
  processingFee: number;
  factoringFee: number;
  setupFee: number;
  generalFeeAmount: number;
  lateFees: number;
  totalFees: number;
}

export default function Monitoring() {
  const [dashboard, setDashboard] = useState<MonitoringDashboard | null>(null);
  const [transactionMonitoring, setTransactionMonitoring] = useState<TransactionMonitoring[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [riskIndicators, setRiskIndicators] = useState<RiskIndicator[]>([]);
  const [openInvoices, setOpenInvoices] = useState<OpenInvoice[]>([]);
  const [closedInvoices, setClosedInvoices] = useState<OpenInvoice[]>([]);
  const [invoiceSummary, setInvoiceSummary] = useState({
    total: 0,
    pending: 0,
    overdue: 0,
    partiallyPaid: 0,
    totalAmount: 0,
    totalRemaining: 0,
    totalReserves: 0
  });
  const [closedInvoiceSummary, setClosedInvoiceSummary] = useState({
    total: 0,
    totalAmount: 0,
    totalPaidAmount: 0,
    totalLateFees: 0
  });
  const [loading, setLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [feesLoading, setFeesLoading] = useState(false);
  const [feesSummary, setFeesSummary] = useState<FeesSummary>({
    totalCollected: 0,
    feesThisMonth: 0,
    transactionFees: 0,
    processingFees: 0,
    factoringFees: 0,
    setupFees: 0,
    generalFees: 0,
    lateFees: 0,
    serviceFees: 0
  });
  const [feesBreakdown, setFeesBreakdown] = useState<FeeBreakdownItem[]>([]);
  const [feesMonthlyTrend, setFeesMonthlyTrend] = useState<FeeMonthlyTrendItem[]>([]);
  const [feeTransactions, setFeeTransactions] = useState<FeeTransactionRow[]>([]);
  const [signedNoasLoading, setSignedNoasLoading] = useState(false);
  const [signedNoas, setSignedNoas] = useState<SignedNOARecord[]>([]);
  const [activeTab, setActiveTab] = useState('open-invoices');
  
  // Dialog states
  const [selectedAlert, setSelectedAlert] = useState<SystemAlert | null>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [bulkResolveDialogOpen, setBulkResolveDialogOpen] = useState(false);
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [downloadingInvoices, setDownloadingInvoices] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadMonitoringData().catch(console.error);
    loadOpenInvoices();
  }, []);

  useEffect(() => {
    if (activeTab === 'open-invoices') {
      loadOpenInvoices();
    } else if (activeTab === 'closed-invoices') {
      loadClosedInvoices();
    } else if (activeTab === 'fees') {
      loadFeesData();
    } else if (activeTab === 'noa-signed') {
      loadSignedNoas();
    }
  }, [activeTab]);

  const loadFeesData = async () => {
    setFeesLoading(true);
    try {
      const response = await fetch(createApiUrl('/monitoring/fees/summary'), {
        headers: getApiHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        setFeesSummary(result?.data?.summary || {
          totalCollected: 0,
          feesThisMonth: 0,
          transactionFees: 0,
          processingFees: 0,
          factoringFees: 0,
          setupFees: 0,
          generalFees: 0,
          lateFees: 0,
          serviceFees: 0
        });
        setFeesBreakdown(result?.data?.breakdown || []);
        setFeesMonthlyTrend(result?.data?.monthlyTrend || []);
        setFeeTransactions(result?.data?.transactions || []);
      } else {
        setFeesSummary({
          totalCollected: 0,
          feesThisMonth: 0,
          transactionFees: 0,
          processingFees: 0,
          factoringFees: 0,
          setupFees: 0,
          generalFees: 0,
          lateFees: 0,
          serviceFees: 0
        });
        setFeesBreakdown([]);
        setFeesMonthlyTrend([]);
        setFeeTransactions([]);
      }
    } catch (error) {
      console.error('Failed to load fees data:', error);
      setFeesSummary({
        totalCollected: 0,
        feesThisMonth: 0,
        transactionFees: 0,
        processingFees: 0,
        factoringFees: 0,
        setupFees: 0,
        generalFees: 0,
        lateFees: 0,
        serviceFees: 0
      });
      setFeesBreakdown([]);
      setFeesMonthlyTrend([]);
      setFeeTransactions([]);
    } finally {
      setFeesLoading(false);
    }
  };

  const loadSignedNoas = async () => {
    setSignedNoasLoading(true);
    try {
      const response = await fetch(createApiUrl('/noa/signed'), {
        headers: getApiHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        setSignedNoas(result.data || []);
      } else {
        setSignedNoas([]);
      }
    } catch (error) {
      console.error('Failed to load signed NOAs:', error);
      setSignedNoas([]);
    } finally {
      setSignedNoasLoading(false);
    }
  };

  const loadClosedInvoices = async () => {
    setInvoicesLoading(true);
    try {
      const response = await fetch(createApiUrl('/treasury/closed-invoices'), {
        headers: getApiHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        setClosedInvoices(result.data || []);
        setClosedInvoiceSummary(result.summary || {
          total: 0,
          totalAmount: 0,
          totalPaidAmount: 0,
          totalLateFees: 0
        });
      }
    } catch (error) {
      console.error('Failed to load closed invoices:', error);
    } finally {
      setInvoicesLoading(false);
    }
  };

  // Download closure report for closed invoice
  const downloadClosureReport = async (invoiceId: string) => {
    setDownloadingInvoices(prev => new Set([...prev, invoiceId]));
    try {
      console.log(`Attempting to download closure report for invoice: ${invoiceId}`);
      
      const response = await fetch(createApiUrl(`/treasury/open-invoices/${invoiceId}/closure-report`), {
        headers: getApiHeaders()
      });
      
      console.log(`Response status: ${response.status}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Invoice_Closure_Report_${invoiceId}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: "Invoice closure report downloaded successfully!",
        });
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Download failed with response:', errorData);
        throw new Error(errorData.message || 'Failed to download closure report');
      }
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: `Failed to download closure report: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setDownloadingInvoices(prev => {
        const newSet = new Set(prev);
        newSet.delete(invoiceId);
        return newSet;
      });
    }
  };

  const loadOpenInvoices = async () => {
    setInvoicesLoading(true);
    try {
      const response = await fetch(createApiUrl('/treasury/open-invoices'), {
        headers: getApiHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        const openInvoiceData = result.data || [];
        const invoiceAmountBasedOutstanding = openInvoiceData.reduce(
          (sum: number, invoice: any) => sum + Math.max(0, (invoice.invoiceAmount || 0) - (invoice.paidAmount || 0)),
          0
        );

        setOpenInvoices(openInvoiceData);
        setInvoiceSummary({
          ...(result.summary || {
            total: 0,
            pending: 0,
            overdue: 0,
            partiallyPaid: 0,
            totalAmount: 0,
            totalRemaining: 0,
            totalReserves: 0
          }),
          totalRemaining: invoiceAmountBasedOutstanding
        });
      } else {
        setOpenInvoices([]);
        setInvoiceSummary({
          total: 0,
          pending: 0,
          overdue: 0,
          partiallyPaid: 0,
          totalAmount: 0,
          totalRemaining: 0,
          totalReserves: 0
        });
      }
    } catch (error) {
      console.error('Failed to load open invoices:', error);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const handlePaymentRecorded = (updatedInvoice: OpenInvoice | null | undefined, payment: any) => {
    if (!updatedInvoice || (!updatedInvoice.id && !updatedInvoice.invoiceNumber && !updatedInvoice.transactionId)) {
      loadOpenInvoices();
      return;
    }

    setOpenInvoices((prev) =>
      prev
        .filter((invoice) => invoice && (invoice.id || invoice.invoiceNumber || invoice.transactionId))
        .map((invoice) => {
          const invoiceKey = invoice.id || invoice.invoiceNumber || invoice.transactionId;
          const updatedKey = updatedInvoice.id || updatedInvoice.invoiceNumber || updatedInvoice.transactionId;
          return invoiceKey === updatedKey ? { ...invoice, ...updatedInvoice } : invoice;
        })
    );
    loadOpenInvoices();
  };

  const handleInvoiceClosed = (closedInvoice: OpenInvoice) => {
    // Force immediate state update with closed status
    setOpenInvoices(prev => 
      prev.filter(invoice => invoice && invoice.id).map(invoice => 
        invoice.id === closedInvoice.id ? { ...invoice, ...closedInvoice, status: 'closed' } : invoice
      )
    );
    
    // Refresh data after a brief delay
    setTimeout(() => {
      loadOpenInvoices();
    }, 500);
  };

  const handleSendToTreasury = async (invoice: OpenInvoice) => {
    try {
      const response = await fetch(createApiUrl('/monitoring/send-to-treasury'), {
        method: 'POST',
        headers: {
          ...getApiHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
          supplierId: invoice.supplierId,
          supplierName: invoice.supplierName,
          reserveAmount: invoice.reserves || 0,
          reference: invoice.reference,
          dueDate: invoice.dueDate
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: "Success",
          description: `Reserve details for ${invoice.supplierName} sent to treasury successfully.`,
        });
        
        // Update invoice status to indicate reserves have been sent
        setOpenInvoices(prev => 
          prev.filter(inv => inv && inv.id).map(inv => 
            inv.id === invoice.id 
              ? { ...inv, status: 'pending_reserves' as any } // This will indicate reserves are pending payment
              : inv
          )
        );
        
        // Refresh data to get the latest status
        loadOpenInvoices();
      } else {
        throw new Error('Failed to send to treasury');
      }
    } catch (error) {
      console.error('Error sending to treasury:', error);
      toast({
        title: "Error",
        description: "Failed to send reserve details to treasury. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getInvoiceStatusBadge = (status: string) => {
    const config = {
      pending: { className: 'bg-blue-100 text-blue-800', icon: Clock },
      pending_reserves: { className: 'bg-purple-100 text-purple-800', icon: Clock },
      partially_paid: { className: 'bg-yellow-100 text-yellow-800', icon: DollarSign },
      paid: { className: 'bg-green-100 text-green-800', icon: CheckCircle },
      overdue: { className: 'bg-red-100 text-red-800', icon: AlertTriangle },
      closed: { className: 'bg-gray-100 text-gray-800', icon: XCircle },
      expired: { className: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const statusConfig = config[status as keyof typeof config] || config.pending;
    const Icon = statusConfig.icon;
    
    const displayStatus = status === 'pending_reserves' ? 'PENDING RESERVES' : status.replace('_', ' ').toUpperCase();
    
    return (
      <Badge className={statusConfig.className}>
        <Icon className="h-3 w-3 mr-1" />
        {displayStatus}
      </Badge>
    );
  };

  const getInvoiceAgeDays = (invoice: OpenInvoice) => {
    const baseDate = invoice.invoiceDate || invoice.createdAt || invoice.updatedAt;
    if (!baseDate) return 0;
    const parsedDate = new Date(baseDate);
    if (isNaN(parsedDate.getTime())) return 0;
    return Math.max(0, Math.floor((Date.now() - parsedDate.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const getAdvancePercentage = (invoice: OpenInvoice) => {
    if (!invoice.invoiceAmount || invoice.invoiceAmount <= 0) return 0;
    const advanceAmount = invoice.advanceAmount || 0;
    return (advanceAmount / invoice.invoiceAmount) * 100;
  };

  const loadMonitoringData = async () => {
    setLoading(true);
    
    try {
      // Fetch real transactions data from backend
      const transactionsResponse = await fetch(createApiUrl('/transactions'), {
        headers: getApiHeaders()
      });

      let transactions = [];
      if (transactionsResponse.ok) {
        const transactionsResult = await transactionsResponse.json();
        transactions = transactionsResult.data || [];
      }

      // Fetch alerts data (you can replace with real API call)
      setAlerts(mockAlerts);
      
      // Create transaction monitoring data from real transactions
      const transactionMonitoringData = transactions.map((txn: any) => {
        const createdDate = new Date(txn.createdAt);
        const today = new Date();
        const agingDays = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        const getAgingBucket = (days: number) => {
          if (days <= 30) return '0-30' as const;
          if (days <= 60) return '31-60' as const;
          if (days <= 90) return '61-90' as const;
          return '90+' as const;
        };

        const getHealthStatus = (status: string, aging: number) => {
          if (status === 'overdue' || aging > 60) return 'critical' as const;
          if (status === 'pending_approval' || aging > 30) return 'warning' as const;
          return 'healthy' as const;
        };

        return {
          id: `MON-${txn.id}`,
          transactionId: txn.id,
          healthStatus: getHealthStatus(txn.status, agingDays),
          agingDays,
          agingBucket: getAgingBucket(agingDays),
          isOverdue: txn.status === 'overdue' || agingDays > 45,
          overdueBy: txn.status === 'overdue' ? agingDays - 30 : undefined,
          riskScore: txn.riskLevel === 'high' ? 85 : txn.riskLevel === 'medium' ? 65 : 35,
          lastUpdated: txn.updatedAt || txn.createdAt
        };
      });
      
      setTransactionMonitoring(transactionMonitoringData);
      
      // Create risk indicators
      const riskIndicatorsData = [
      {
        id: 'RISK-001',
        entityId: 'BYR-003',
        entityType: 'buyer' as const,
        indicatorType: 'credit_utilization',
        description: 'High credit utilization detected',
        severity: 'warning' as const,
        value: 85,
        threshold: 80,
        isActive: true,
        detectedAt: '2026-01-04T10:30:00Z',
        lastUpdated: '2026-01-05T08:00:00Z'
      },
      {
        id: 'RISK-002',
        entityId: 'BYR-005',
        entityType: 'buyer' as const,
        indicatorType: 'payment_delay',
        description: 'Payment consistently delayed',
        severity: 'critical' as const,
        value: 15,
        threshold: 10,
        isActive: true,
        detectedAt: '2026-01-01T14:20:00Z',
        lastUpdated: '2026-01-05T09:15:00Z'
      }
    ];
    
    setRiskIndicators(riskIndicatorsData);
    
    // Set dashboard summary
    const criticalAlerts = mockAlerts.filter(a => a.severity === 'critical').length;
    const warningAlerts = mockAlerts.filter(a => a.severity === 'warning').length;
    const overdueTransactions = transactionMonitoringData.filter(t => t.isOverdue).length;
    
    setDashboard({
      healthSummary: {
        total: transactionMonitoringData.length,
        healthy: transactionMonitoringData.filter(t => t.healthStatus === 'healthy').length,
        warning: transactionMonitoringData.filter(t => t.healthStatus === 'warning').length,
        critical: transactionMonitoringData.filter(t => t.healthStatus === 'critical').length,
        overdue: overdueTransactions
      },
      recentAlerts: mockAlerts,
      activeRisks: riskIndicatorsData,
      highRiskTransactions: transactionMonitoringData.filter(t => (t.riskScore || 0) > 70),
      agingAnalysis: {
        '0-30': transactionMonitoringData.filter(t => t.agingBucket === '0-30').length,
        '31-60': transactionMonitoringData.filter(t => t.agingBucket === '31-60').length,
        '61-90': transactionMonitoringData.filter(t => t.agingBucket === '61-90').length,
        '90+': transactionMonitoringData.filter(t => t.agingBucket === '90+').length
      },
      lastUpdated: new Date().toISOString()
    });
    
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
      // Fallback to mock data on error
      setAlerts(mockAlerts);
      setTransactionMonitoring([]);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const handleResolveAlert = () => {
    if (!selectedAlert) return;
    
    // Update the alert in local state
    setAlerts(prevAlerts => 
      prevAlerts.map(alert => 
        alert.id === selectedAlert.id 
          ? { ...alert, isResolved: true, resolvedBy: 'current-user', resolvedAt: new Date().toISOString(), resolutionNotes }
          : alert
      )
    );
    
    setResolveDialogOpen(false);
    setSelectedAlert(null);
    setResolutionNotes('');
  };

  const handleBulkResolve = async () => {
    try {
      const response = await fetch(createApiUrl('/monitoring/alerts/bulk-resolve'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertIds: selectedAlerts,
          resolvedBy: 'current-user',
          resolutionNotes: 'Bulk resolved'
        })
      });
      
      if (response.ok) {
        fetchMonitoringData();
        setBulkResolveDialogOpen(false);
        setSelectedAlerts([]);
      }
    } catch (error) {
      console.error('Error bulk resolving alerts:', error);
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      const response = await fetch(createApiUrl(`/monitoring/alerts/${alertId}/read`), {
        method: 'PUT'
      });
      
      if (response.ok) {
        fetchMonitoringData();
      }
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const getHealthStatusBadge = (status: string) => {
    const config = {
      healthy: { variant: 'default' as const, label: 'Healthy', color: 'text-green-600' },
      warning: { variant: 'secondary' as const, label: 'Warning', color: 'text-yellow-600' },
      critical: { variant: 'destructive' as const, label: 'Critical', color: 'text-red-600' }
    };
    
    return config[status as keyof typeof config] || config.warning;
  };

  const getSeverityBadge = (severity: string) => {
    const config = {
      info: { variant: 'outline' as const, label: 'Info' },
      warning: { variant: 'secondary' as const, label: 'Warning' },
      critical: { variant: 'destructive' as const, label: 'Critical' }
    };
    
    return config[severity as keyof typeof config] || config.info;
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-pulse text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Risk Monitoring & Oversight</h1>
          <p className="text-sm text-muted-foreground">Real-time transaction health and risk indicators</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="open-invoices">Open Invoices</TabsTrigger>
          <TabsTrigger value="due-invoices">Due Invoices</TabsTrigger>
          <TabsTrigger value="closed-invoices">Closed Invoices</TabsTrigger>
          <TabsTrigger value="noa-signed">NOA Signed</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="noa-signed" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Signed NOAs</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{signedNoas.length}</div>
                <p className="text-xs text-muted-foreground">Total acknowledged records</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">With Selfie</CardTitle>
                <Eye className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {signedNoas.filter((item) => !!item.signatoryData?.photoDataUrl).length}
                </div>
                <p className="text-xs text-muted-foreground">Photo captured records</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">With Location</CardTitle>
                <Activity className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {signedNoas.filter((item) => !!item.signatoryData?.location?.city && !!item.signatoryData?.location?.country).length}
                </div>
                <p className="text-xs text-muted-foreground">City/Country captured</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Signed NOA Records</CardTitle>
              <CardDescription>All acknowledged NOAs with signatory, selfie, signature, and location details</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Buyer / Supplier</TableHead>
                    <TableHead>Signatory</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Signed At</TableHead>
                    <TableHead>Proof</TableHead>
                    <TableHead>NOA Document</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signedNoasLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        Loading signed NOAs...
                      </TableCell>
                    </TableRow>
                  ) : signedNoas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No signed NOAs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    signedNoas.map((record) => (
                      <TableRow key={record._id || record.noaId}>
                        <TableCell>
                          <div className="font-medium">{record.transactionId}</div>
                          <div className="text-xs text-muted-foreground">Invoice: {record.invoiceNumber}</div>
                        </TableCell>
                        <TableCell>
                          <div>{record.buyerName}</div>
                          <div className="text-xs text-muted-foreground">Supplier: {record.supplierName}</div>
                        </TableCell>
                        <TableCell>
                          <div>{record.signatoryData?.fullName || '-'}</div>
                          <div className="text-xs text-muted-foreground">{record.signatoryData?.position || '-'}</div>
                        </TableCell>
                        <TableCell>
                          <div>{record.signatoryData?.location?.city || '-'}</div>
                          <div className="text-xs text-muted-foreground">{record.signatoryData?.location?.country || '-'}</div>
                        </TableCell>
                        <TableCell>
                          {formatDate(record.acknowledgedAt || record.updatedAt || '')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {record.signatoryData?.photoDataUrl ? (
                              <img
                                src={record.signatoryData.photoDataUrl}
                                alt="Selfie"
                                className="h-10 w-10 rounded-md object-cover border"
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">No selfie</span>
                            )}
                            {record.signatoryData?.signatureDataUrl ? (
                              <img
                                src={record.signatoryData.signatureDataUrl}
                                alt="Signature"
                                className="h-10 w-16 rounded-md object-contain border bg-white"
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">No signature</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(createApiUrl(`/noa/${record.noaId}/pdf`), '_blank')}
                          >
                            Download PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="due-invoices" className="space-y-6">
          {/* Due Invoices Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
                <Calendar className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">-</div>
                <p className="text-xs text-muted-foreground">
                  Payments expected
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Due This Month</CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">-</div>
                <p className="text-xs text-muted-foreground">
                  Expected receivables
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$0</div>
                <p className="text-xs text-muted-foreground">
                  Expected receivables
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">-</div>
                <p className="text-xs text-muted-foreground">
                  Late receivables
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Due Invoices Table */}
          <Card>
            <CardHeader>
              <CardTitle>Due Invoices</CardTitle>
              <CardDescription>Invoices due for payment from customers (receivables)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Until Due</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No due invoices at this time
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees" className="space-y-6">
          {/* Fee Management Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Fees Collected</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(feesSummary.totalCollected)}</div>
                <p className="text-xs text-muted-foreground">
                  All-time collected
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Late Fees</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(feesSummary.lateFees)}</div>
                <p className="text-xs text-muted-foreground">
                  Penalty charges
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transaction Fees</CardTitle>
                <Activity className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(feesSummary.transactionFees)}</div>
                <p className="text-xs text-muted-foreground">
                  Transaction fee component
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Service Fees</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{formatCurrency(feesSummary.serviceFees)}</div>
                <p className="text-xs text-muted-foreground">
                  Additional services
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Fee Collection Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fee Type Breakdown</CardTitle>
                <CardDescription>Distribution of collected fees by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feesLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading fee breakdown...</div>
                  ) : feesBreakdown.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No fee breakdown available</div>
                  ) : (
                    feesBreakdown.map((item) => (
                      <div key={item.type} className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="font-medium">{item.type}</span>
                          <Progress value={Math.max(0, Math.min(100, item.percentage))} className="flex-1 max-w-xs" />
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(item.amount)}</div>
                          <div className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Fee Trend</CardTitle>
                <CardDescription>Fee collection over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feesLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading monthly trend...</div>
                  ) : feesMonthlyTrend.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No historical fee data available</div>
                  ) : (
                    feesMonthlyTrend.map((item) => (
                      <div key={item.label} className="flex justify-between items-center">
                        <span className="text-sm">{item.label}</span>
                        <span className="font-medium">{formatCurrency(item.total)}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fee Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Fee Collection Details</CardTitle>
              <CardDescription>Detailed breakdown of fees collected</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Fee Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Collected Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feesLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        Loading fee collection data...
                      </TableCell>
                    </TableRow>
                  ) : feeTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No fee collection data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    feeTransactions.map((row) => (
                      <TableRow key={`${row.transactionId}-${row.invoiceNumber}`}>
                        <TableCell className="font-mono">{row.transactionId}</TableCell>
                        <TableCell>
                          <div>{row.supplierName || '-'}</div>
                          <div className="text-xs text-muted-foreground">Buyer: {row.buyerName || '-'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-xs">
                            <div>Transaction: {formatCurrency(row.transactionFee)}</div>
                            <div>Processing: {formatCurrency(row.processingFee)}</div>
                            <div>Factoring: {formatCurrency(row.factoringFee)}</div>
                            <div>Setup: {formatCurrency(row.setupFee)}</div>
                            <div>General: {formatCurrency(row.generalFeeAmount)}</div>
                            <div>Late: {formatCurrency(row.lateFees)}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">{formatCurrency(row.totalFees)}</TableCell>
                        <TableCell>{formatDate(row.collectedDate)}</TableCell>
                        <TableCell>
                          <Badge variant={['closed', 'paid', 'completed', 'settled'].includes((row.status || '').toLowerCase()) ? 'default' : 'secondary'}>
                            {['closed', 'paid', 'completed', 'settled'].includes((row.status || '').toLowerCase()) ? 'Collected' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" disabled>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Health Monitoring</CardTitle>
              <CardDescription>Real-time health status of all transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Health Status</TableHead>
                    <TableHead>Aging</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Overdue</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionMonitoring.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono">{transaction.transactionId}</TableCell>
                      <TableCell>
                        <Badge variant={getHealthStatusBadge(transaction.healthStatus).variant}>
                          {getHealthStatusBadge(transaction.healthStatus).label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.agingDays} days</div>
                          <div className="text-xs text-muted-foreground">{transaction.agingBucket} bucket</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold ${getRiskScoreColor(transaction.riskScore || 0)}`}>
                          {transaction.riskScore || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        {transaction.isOverdue ? (
                          <div className="text-red-600 font-medium">
                            Yes ({transaction.overdueBy}d)
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(transaction.lastUpdated)}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="open-invoices" className="space-y-6">
          {/* Open Invoices Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{invoiceSummary.total}</div>
                <p className="text-xs text-muted-foreground">
                  Open invoices
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{invoiceSummary.pending}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting payment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{invoiceSummary.overdue}</div>
                <p className="text-xs text-muted-foreground">
                  Past due date
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Partial Payments</CardTitle>
                <DollarSign className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{invoiceSummary.partiallyPaid}</div>
                <p className="text-xs text-muted-foreground">
                  Partially paid
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(invoiceSummary.totalAmount || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Invoice value
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                <DollarSign className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ${(invoiceSummary.totalRemaining || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Remaining amount
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reserves Held</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  ${(invoiceSummary.totalReserves || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  20% reserves
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Open Invoices Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Open Invoices Tracking</CardTitle>
                <CardDescription>
                  Monitor payment status and aging of open invoices
                </CardDescription>
              </div>
              <Button 
                onClick={loadOpenInvoices} 
                variant="outline" 
                size="sm"
                disabled={invoicesLoading}
              >
                {invoicesLoading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Invoice Number</TableHead>
                      <TableHead>Buyer Name</TableHead>
                      <TableHead>Supplier Name</TableHead>
                      <TableHead>Invoice Amount</TableHead>
                      <TableHead>Invoice Date</TableHead>
                      <TableHead>Invoice Due Date</TableHead>
                      <TableHead>Advance Percentage</TableHead>
                      <TableHead>Advance Amount</TableHead>
                      <TableHead>Reserves Held</TableHead>
                      <TableHead>Fee deducted</TableHead>
                      <TableHead>Invoice Age</TableHead>
                      <TableHead>Amount Received</TableHead>
                      <TableHead>Date Received</TableHead>
                      <TableHead>Late Days</TableHead>
                      <TableHead>Late Fees</TableHead>
                      <TableHead>Reserves Paid</TableHead>
                      <TableHead>Total Fees</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {openInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={19} className="text-center py-8 text-muted-foreground">
                          No open invoices found
                        </TableCell>
                      </TableRow>
                    ) : (
                      openInvoices.filter(invoice => invoice && invoice.id).map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            <div className="font-mono text-sm">{invoice.id || 'N/A'}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{invoice.invoiceNumber || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">Buyer: {invoice.buyerName || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">Supplier: {invoice.supplierName || 'N/A'}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{invoice.buyerName || 'N/A'}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{invoice.supplierName || 'N/A'}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">${(invoice.invoiceAmount || 0).toLocaleString()}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{formatDate(invoice.invoiceDate || invoice.createdAt)}</div>
                          </TableCell>
                          <TableCell>
                            <div className={`text-sm font-medium ${invoice.agingDays > 0 ? 'text-red-600' : ''}`}>
                              {formatDate(invoice.dueDate)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{getAdvancePercentage(invoice).toFixed(2)}%</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-green-600 font-medium">${(invoice.advanceAmount || 0).toLocaleString()}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-purple-600 font-medium">
                              ${(invoice.reserves || 0).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">${(invoice.feeAmount || 0).toLocaleString()}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {getInvoiceAgeDays(invoice)} day(s)
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-blue-600 font-medium">
                              ${(invoice.paidAmount || 0).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {invoice.paymentHistory && invoice.paymentHistory.length > 0 
                                ? formatDate(invoice.paymentHistory[invoice.paymentHistory.length - 1].paidAt)
                                : formatDate(invoice.createdAt)
                              }
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {invoice.agingDays > 0 ? (
                                <div className="text-red-600 font-medium">
                                  {invoice.agingDays} days
                                </div>
                              ) : (
                                <span className="text-gray-400">0 days</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {(invoice.lateFees || 0) > 0 ? (
                                <div className="font-medium text-red-600">${(invoice.lateFees || 0).toLocaleString()}</div>
                              ) : (
                                <span className="text-gray-400">$0</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">$0</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              ${((invoice.feeAmount || 0) + (invoice.lateFees || 0)).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              {invoice.status !== 'closed' && (
                                <InvoicePaymentDialog
                                  invoice={invoice}
                                  onPaymentRecorded={handlePaymentRecorded}
                                />
                              )}
                              
                              {(invoice.status === 'paid' || invoice.status === 'partially_paid' || invoice.status === 'overdue') && (
                                <InvoiceClosureDialog
                                  invoice={invoice}
                                  onInvoiceClosed={handleInvoiceClosed}
                                />
                              )}

                              {/* Send to Treasury Button - only show if there are reserves and not already sent */}
                              {(invoice.reserves && invoice.reserves > 0 && invoice.status !== 'pending_reserves' && invoice.status !== 'closed') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                                  onClick={() => handleSendToTreasury(invoice)}
                                >
                                  <Banknote className="h-3 w-3 mr-1" />
                                  Send to Treasury
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() => {
                                  const latestPayment = invoice.paymentHistory && invoice.paymentHistory.length > 0
                                    ? invoice.paymentHistory[invoice.paymentHistory.length - 1]
                                    : null;
                                  const feeDeducted = invoice.feeAmount || 0;
                                  const lateFees = invoice.lateFees || 0;
                                  const totalFees = feeDeducted + lateFees;
                                  const reservePaid = ['closed', 'settled', 'completed'].includes(invoice.status)
                                    ? (invoice.reserves || 0)
                                    : 0;
                                  const invoiceAgeDays = getInvoiceAgeDays(invoice);

                                  const details = [
                                    `Transaction ID: ${invoice.id || 'N/A'}`,
                                    `Invoice Number: ${invoice.invoiceNumber || 'N/A'}`,
                                    `Buyer Name: ${invoice.buyerName || 'N/A'}`,
                                    `Supplier Name: ${invoice.supplierName || 'N/A'}`,
                                    `Invoice Amount: $${invoice.invoiceAmount?.toLocaleString() || 'N/A'}`,
                                    `Invoice Date: ${formatDate(invoice.invoiceDate || invoice.createdAt)}`,
                                    `Invoice Due Date: ${formatDate(invoice.dueDate)}`,
                                    `Advance Percentage: ${getAdvancePercentage(invoice).toFixed(2)}%`,
                                    `Advance Amount: $${(invoice.advanceAmount || 0).toLocaleString()}`,
                                    `Reserves Held: $${(invoice.reserves || 0).toLocaleString()}`,
                                    `Fee deducted: $${feeDeducted.toLocaleString()}`,
                                    `Invoice Age: ${invoiceAgeDays} day(s)`,
                                    `Amount Received: $${(invoice.paidAmount || 0).toLocaleString()}`,
                                    `Date Received: ${latestPayment ? formatDate(latestPayment.paidAt) : 'N/A'}`,
                                    `Late Days: ${invoice.agingDays || 0}`,
                                    `Late Fees: $${lateFees.toLocaleString()}`,
                                    `Reserves Paid: $${reservePaid.toLocaleString()}`,
                                    `Total Fees: $${totalFees.toLocaleString()}`
                                  ].filter(Boolean).join('\n');
                                  
                                  alert(details);
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Details
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="closed-invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Closed Invoices</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadClosedInvoices}
                  disabled={invoicesLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${invoicesLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              
              {/* Closed Invoices Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{closedInvoiceSummary.total}</div>
                  <div className="text-sm text-muted-foreground">Total Closed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">${closedInvoiceSummary.totalAmount?.toLocaleString() || '0'}</div>
                  <div className="text-sm text-muted-foreground">Total Amount</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">${closedInvoiceSummary.totalPaidAmount?.toLocaleString() || '0'}</div>
                  <div className="text-sm text-muted-foreground">Total Paid</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">${closedInvoiceSummary.totalLateFees?.toLocaleString() || '0'}</div>
                  <div className="text-sm text-muted-foreground">Late Fees</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Activity className="w-6 h-6 animate-pulse text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Invoice Number</TableHead>
                      <TableHead>Buyer Name</TableHead>
                      <TableHead>Supplier Name</TableHead>
                      <TableHead>Invoice Amount</TableHead>
                      <TableHead>Invoice Date</TableHead>
                      <TableHead>Invoice Due Date</TableHead>
                      <TableHead>Advance Percentage</TableHead>
                      <TableHead>Advance Amount</TableHead>
                      <TableHead>Reserves Held</TableHead>
                      <TableHead>Fee deducted</TableHead>
                      <TableHead>Invoice Age</TableHead>
                      <TableHead>Amount Received</TableHead>
                      <TableHead>Date Received</TableHead>
                      <TableHead>Late Days</TableHead>
                      <TableHead>Late Fees</TableHead>
                      <TableHead>Reserves Paid</TableHead>
                      <TableHead>Total Fees</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {closedInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={19} className="text-center py-8">
                          <div className="text-muted-foreground">
                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            No closed invoices found
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      closedInvoices.filter(invoice => invoice && invoice.id).map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            <div className="font-mono text-sm">{invoice.id || 'N/A'}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{invoice.invoiceNumber || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">Buyer: {invoice.buyerName || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">Supplier: {invoice.supplierName || 'N/A'}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{invoice.buyerName || 'N/A'}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{invoice.supplierName || 'N/A'}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">${(invoice.invoiceAmount || 0).toLocaleString()}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{formatDate(invoice.invoiceDate || invoice.createdAt)}</div>
                          </TableCell>
                          <TableCell>
                            <div className={`text-sm font-medium ${invoice.agingDaysAtClosure > 0 ? 'text-red-600' : ''}`}>
                              {formatDate(invoice.dueDate)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{getAdvancePercentage(invoice).toFixed(2)}%</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-green-600 font-medium">${(invoice.advanceAmount || 0).toLocaleString()}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-purple-600 font-medium">${(invoice.reserves || 0).toLocaleString()}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">${(invoice.feeAmount || 0).toLocaleString()}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{getInvoiceAgeDays(invoice)} day(s)</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-blue-600 font-medium">${(invoice.paidAmount || 0).toLocaleString()}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {invoice.paymentHistory && invoice.paymentHistory.length > 0
                                ? formatDate(invoice.paymentHistory[invoice.paymentHistory.length - 1].paidAt)
                                : formatDate(invoice.closedAt || invoice.settledAt || invoice.updatedAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {(invoice.agingDaysAtClosure || 0) > 0 ? (
                                <div className="text-red-600 font-medium">{invoice.agingDaysAtClosure} days</div>
                              ) : (
                                <span className="text-gray-400">0 days</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {(invoice.lateFees || 0) > 0 ? (
                                <div className="font-medium text-red-600">${(invoice.lateFees || 0).toLocaleString()}</div>
                              ) : (
                                <span className="text-gray-400">$0</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">${(invoice.reserves || 0).toLocaleString()}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">${((invoice.feeAmount || 0) + (invoice.lateFees || 0)).toLocaleString()}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() => {
                                  const latestPayment = invoice.paymentHistory && invoice.paymentHistory.length > 0
                                    ? invoice.paymentHistory[invoice.paymentHistory.length - 1]
                                    : null;
                                  const feeDeducted = invoice.feeAmount || 0;
                                  const lateFees = invoice.lateFees || 0;
                                  const totalFees = feeDeducted + lateFees;
                                  const reservePaid = (invoice.reserves || 0);
                                  const invoiceAgeDays = getInvoiceAgeDays(invoice);

                                  const details = [
                                    `Transaction ID: ${invoice.id || 'N/A'}`,
                                    `Invoice Number: ${invoice.invoiceNumber || 'N/A'}`,
                                    `Buyer Name: ${invoice.buyerName || 'N/A'}`,
                                    `Supplier Name: ${invoice.supplierName || 'N/A'}`,
                                    `Invoice Amount: $${invoice.invoiceAmount?.toLocaleString() || 'N/A'}`,
                                    `Invoice Date: ${formatDate(invoice.invoiceDate || invoice.createdAt)}`,
                                    `Invoice Due Date: ${formatDate(invoice.dueDate)}`,
                                    `Advance Percentage: ${getAdvancePercentage(invoice).toFixed(2)}%`,
                                    `Advance Amount: $${(invoice.advanceAmount || 0).toLocaleString()}`,
                                    `Reserves Held: $${(invoice.reserves || 0).toLocaleString()}`,
                                    `Fee deducted: $${feeDeducted.toLocaleString()}`,
                                    `Invoice Age: ${invoiceAgeDays} day(s)`,
                                    `Amount Received: $${(invoice.paidAmount || 0).toLocaleString()}`,
                                    `Date Received: ${latestPayment ? formatDate(latestPayment.paidAt) : 'N/A'}`,
                                    `Late Days: ${invoice.agingDaysAtClosure || invoice.agingDays || 0}`,
                                    `Late Fees: $${lateFees.toLocaleString()}`,
                                    `Reserves Paid: $${reservePaid.toLocaleString()}`,
                                    `Total Fees: $${totalFees.toLocaleString()}`
                                  ].filter(Boolean).join('\\n');
                                  
                                  alert(details);
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Details
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() => downloadClosureReport(invoice.id)}
                                disabled={downloadingInvoices.has(invoice.id)}
                              >
                                <Download className={`h-3 w-3 mr-1 ${downloadingInvoices.has(invoice.id) ? 'animate-spin' : ''}`} />
                                {downloadingInvoices.has(invoice.id) ? 'Downloading...' : 'Download'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
