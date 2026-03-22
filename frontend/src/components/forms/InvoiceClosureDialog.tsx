import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { XCircle, AlertTriangle, CheckCircle, Clock, DollarSign, TrendingUp, AlertCircle, FileText, Users2 } from 'lucide-react';
import { toast } from 'sonner';
import { createApiUrl, getApiHeaders } from '@/config/api';
import { formatDate } from '@/lib/utils';
import { format } from 'date-fns';
import LateFeeHandlingDialog from './LateFeeHandlingDialog';

interface InvoiceClosureDialogProps {
  invoice: {
    id: string;
    supplierName: string;
    supplierId: string;
    invoiceAmount: number;
    paidAmount: number;
    remainingAmount: number;
    dueDate: string;
    expirationDate: string;
    status: string;
    agingDays: number;
    daysUntilExpiry: number;
    reference: string;
    lateFees?: number;
  };
  onInvoiceClosed?: (invoice: any) => void;
  onClose?: () => void;
}

export default function InvoiceClosureDialog({ invoice, onInvoiceClosed, onClose }: InvoiceClosureDialogProps) {
  const [open, setOpen] = useState(false);
  const [showLateFeeDialog, setShowLateFeeDialog] = useState(false);
  const [reserves, setReserves] = useState(0);
  const [closureReport, setClosureReport] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [releasingReserves, setReleasingReserves] = useState(false);
  const [formData, setFormData] = useState({
    closureNotes: '',
    forceClose: false,
    releaseReserves: false
  });
  const [loading, setLoading] = useState(false);

  const totalDue = (invoice.remainingAmount || 0) + (invoice.lateFees || 0);
  const hasLateFees = (invoice.lateFees || 0) > 0;
  const canClose = totalDue <= 0;

  // Fetch reserves and closure report when dialog opens
  useEffect(() => {
    if (open) {
      fetchReserves();
      fetchClosureReport();
    }
  }, [open]);

  const fetchClosureReport = async () => {
    setLoadingReport(true);
    try {
      const response = await fetch(createApiUrl(`/treasury/open-invoices/${invoice.id}/closure-report`), {
        headers: getApiHeaders()
      });
      const result = await response.json();
      if (result.success) {
        setClosureReport(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch closure report:', error);
      toast.error('Failed to load closure report');
    } finally {
      setLoadingReport(false);
    }
  };

  const handleReleaseReserves = async () => {
    if (!closureReport || !closureReport.canReleaseReserve) {
      toast.error('Reserves cannot be released at this time');
      return;
    }

    setReleasingReserves(true);
    try {
      const response = await fetch(createApiUrl(`/treasury/open-invoices/${invoice.id}/release-reserves`), {
        method: 'POST',
        headers: {
          ...getApiHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: formData.closureNotes || 'Reserves released via closure dialog'
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Reserves released successfully!', {
          description: `$${result.data.amount.toLocaleString()} sent to ${result.data.supplierName}`,
        });
        
        // Refresh closure report to update reserve status
        await fetchClosureReport();
        
        // Update form to reflect reserve release
        setFormData(prev => ({ ...prev, releaseReserves: false }));
      } else {
        toast.error(result.message || 'Failed to release reserves');
      }
    } catch (error) {
      console.error('Reserve release error:', error);
      toast.error('Failed to release reserves');
    } finally {
      setReleasingReserves(false);
    }
  };

  const fetchReserves = async () => {
    try {
      const response = await fetch(createApiUrl('/treasury/reserves'), {
        headers: getApiHeaders()
      });
      const result = await response.json();
      if (result.success) {
        setReserves(result.data?.balance || 0);
      }
    } catch (error) {
      console.error('Failed to fetch reserves:', error);
    }
  };

  const downloadClosureReport = async (invoiceId: string) => {
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
        
        toast.success('Invoice closure report downloaded successfully!');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Download failed with response:', errorData);
        throw new Error(errorData.message || 'Failed to download closure report');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download closure report: ${error.message}`);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partially_paid':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleLateFeeConfirm = async (option: 'add_to_invoice' | 'cut_from_reserves', returnReserves?: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(createApiUrl(`/treasury/open-invoices/${invoice.id}/close`), {
        method: 'POST',
        headers: {
          ...getApiHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          closureNotes: formData.closureNotes,
          forceClose: formData.forceClose,
          lateFeeOption: option,
          hasLateFees: true,
          returnReserves: returnReserves || false
        })
      });

      const result = await response.json();

      if (result.success) {
        const successMessage = `Invoice closed successfully. Late fees ${option === 'add_to_invoice' ? 'added to invoice amount' : 'deducted from reserves'}${returnReserves ? ' and remaining reserves initiated for return' : ''}`;
        toast.success(successMessage, {
          description: 'Click to download the invoice closure report',
          action: {
            label: 'Download Report',
            onClick: () => downloadClosureReport(invoice.id)
          }
        });
        onInvoiceClosed?.(result.data);
        setOpen(false);
        setShowLateFeeDialog(false);
        setFormData({
          closureNotes: '',
          forceClose: false,
          releaseReserves: false
        });
      } else {
        toast.error(result.message || 'Failed to close invoice');
      }
    } catch (error) {
      console.error('Close invoice error:', error);
      toast.error('Failed to close invoice');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If invoice has late fees, show the late fee handling dialog
    if (hasLateFees) {
      setShowLateFeeDialog(true);
      return;
    }

    // Otherwise, proceed with normal closure
    if (!canClose && !formData.forceClose) {
      toast.error('Cannot close invoice with outstanding balance unless force close is enabled');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(createApiUrl(`/treasury/open-invoices/${invoice.id}/close`), {
        method: 'POST',
        headers: {
          ...getApiHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          closureNotes: formData.closureNotes,
          forceClose: formData.forceClose,
          hasLateFees: false
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Invoice closed successfully', {
          description: 'Click to download the invoice closure report',
          action: {
            label: 'Download Report',
            onClick: () => downloadClosureReport(invoice.id)
          }
        });
        onInvoiceClosed?.(result.data);
        setOpen(false);
        setFormData({
          closureNotes: '',
          forceClose: false,
          releaseReserves: false
        });
      } else {
        toast.error(result.message || 'Failed to close invoice');
      }
    } catch (error) {
      console.error('Close invoice error:', error);
      toast.error('Failed to close invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            variant={canClose ? "default" : "destructive"} 
            size="sm"
            className={canClose ? "" : "hover:bg-red-600"}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Close Invoice
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Invoice Closure - {invoice.id}
            </DialogTitle>
            <DialogDescription>
              {hasLateFees
                ? "This invoice has late fees. Choose how to handle them before closing."
                : canClose 
                  ? "This invoice is ready to be closed as all payments have been received."
                  : "Warning: This invoice has an outstanding balance. Force close will mark it as closed despite the remaining amount."
              }
            </DialogDescription>
          </DialogHeader>

          {loadingReport ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading detailed report...</span>
            </div>
          ) : closureReport ? (
            <Tabs defaultValue="summary" className="space-y-4">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="reserves">Reserves</TabsTrigger>
                <TabsTrigger value="profitability">Profitability</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              {/* Summary Tab */}
              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Invoice #:</span>
                        <span className="font-mono">{closureReport.invoiceNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Reference:</span>
                        <span className="font-mono text-sm">{closureReport.reference || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <Badge className={getStatusColor(closureReport.status)}>
                          {getStatusIcon(closureReport.status)}
                          <span className="ml-1 capitalize">{closureReport.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Aging:</span>
                        <span className={closureReport.agingDays > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                          {closureReport.agingDays} days
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Risk Level:</span>
                        <Badge variant={closureReport.riskAssessment?.riskLevel === 'high' ? 'destructive' : closureReport.riskAssessment?.riskLevel === 'medium' ? 'secondary' : 'default'}>
                          {closureReport.riskAssessment?.riskLevel?.toUpperCase() || 'LOW'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users2 className="h-5 w-5" />
                        Parties
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="border rounded p-3">
                        <div className="font-medium text-sm text-blue-600 mb-1">Supplier</div>
                        <div className="font-medium">{closureReport.supplierName}</div>
                        {closureReport.supplierDetails && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Risk Score: {closureReport.supplierDetails.riskScore || 'N/A'}
                          </div>
                        )}
                      </div>
                      <div className="border rounded p-3">
                        <div className="font-medium text-sm text-green-600 mb-1">Buyer</div>
                        <div className="font-medium">{closureReport.buyerName}</div>
                        {closureReport.buyerDetails && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Risk Score: {closureReport.buyerDetails.riskScore || 'N/A'}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Outstanding</p>
                          <p className="text-lg font-bold text-red-600">
                            ${closureReport.totalDue?.toLocaleString() || '0'}
                          </p>
                        </div>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Reserves</p>
                          <p className="text-lg font-bold text-purple-600">
                            ${closureReport.reserveAmount?.toLocaleString() || '0'}
                          </p>
                        </div>
                        <DollarSign className="h-4 w-4 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Net Profit</p>
                          <p className="text-lg font-bold text-green-600">
                            ${closureReport.profitability?.netProfit?.toLocaleString() || '0'}
                          </p>
                        </div>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">ROI</p>
                          <p className="text-lg font-bold">
                            {closureReport.profitability?.roi || '0'}%
                          </p>
                        </div>
                        <TrendingUp className="h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Financial Tab */}
              <TabsContent value="financial" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Invoice Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Original Amount:</span>
                        <span className="font-medium">${closureReport.originalInvoiceAmount?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Advance Paid:</span>
                        <span className="font-medium text-blue-600">${closureReport.advanceAmount?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Fee Deducted:</span>
                        <span className="font-medium text-orange-600">
                          ${closureReport.feeAmount?.toLocaleString()} ({closureReport.feePercentage}%)
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span>Net Paid to Supplier:</span>
                        <span className="text-green-600">${closureReport.netPaidToSupplier?.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Buyer Owes:</span>
                        <span className="font-medium">${closureReport.buyerOwes?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Amount Paid:</span>
                        <span className="font-medium text-green-600">${closureReport.paidAmount?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Remaining:</span>
                        <span className={`font-medium ${closureReport.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ${closureReport.remainingAmount?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Late Fees:</span>
                        <span className="font-medium text-red-600">${closureReport.lateFees?.toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span>Total Due:</span>
                        <span className={closureReport.totalDue > 0 ? 'text-red-600' : 'text-green-600'}>
                          ${closureReport.totalDue?.toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Payment History */}
                {closureReport.paymentHistory && closureReport.paymentHistory.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {closureReport.paymentHistory.map((payment: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-2 border rounded">
                            <div>
                              <div className="font-medium">${payment.amount?.toLocaleString()}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatDate(payment.paidAt)} - {payment.paidBy || 'Unknown'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-green-600">
                                Principal: ${payment.principalPaid?.toLocaleString() || '0'}
                              </div>
                              {payment.lateFeesPaid > 0 && (
                                <div className="text-sm text-orange-600">
                                  Late Fees: ${payment.lateFeesPaid?.toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Reserves Tab */}
              <TabsContent value="reserves" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Reserve Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Reserve Amount:</span>
                          <span className="font-medium text-purple-600">
                            ${closureReport.reserveAmount?.toLocaleString() || '0'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Reserve %:</span>
                          <span>{closureReport.reservePercentage}% of invoice</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Status:</span>
                          <Badge variant={closureReport.reserveStatus === 'released' ? 'default' : closureReport.reserveStatus === 'ready_for_release' ? 'secondary' : 'outline'}>
                            {closureReport.reserveStatus?.replace('_', ' ')?.toUpperCase() || 'HELD'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {closureReport.reserveReleasedAt && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Released At:</span>
                              <span className="text-sm">
                                {formatDate(closureReport.reserveReleasedAt)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Payout ID:</span>
                              <span className="font-mono text-sm">{closureReport.reservePayoutId}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {closureReport.canReleaseReserve && (
                      <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-green-800">Ready for Reserve Release</span>
                        </div>
                        <p className="text-sm text-green-700 mb-3">
                          This invoice is fully paid and reserves can be released to the supplier.
                        </p>
                        <Button
                          onClick={handleReleaseReserves}
                          disabled={releasingReserves}
                          className="w-full"
                        >
                          {releasingReserves ? 'Releasing...' : `Release $${closureReport.reserveAmount?.toLocaleString()} to ${closureReport.supplierName}`}
                        </Button>
                      </div>
                    )}

                    {closureReport.reserveStatus === 'released' && (
                      <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                          <span className="font-medium text-blue-800">Reserves Released</span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          Reserves have been successfully released to {closureReport.supplierName}.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Profitability Tab */}
              <TabsContent value="profitability" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Profitability Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="font-medium text-green-600">Revenue</h4>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Fees Collected:</span>
                          <span className="font-medium">${closureReport.profitability?.totalFeesCollected?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Late Fees:</span>
                          <span className="font-medium">${closureReport.totalLateFeesPaid?.toLocaleString()}</span>
                        </div>
                        
                        <h4 className="font-medium text-red-600 mt-4">Costs</h4>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Amount Advanced:</span>
                          <span className="font-medium">${closureReport.profitability?.totalAdvanced?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Amount Repaid:</span>
                          <span className="font-medium text-green-600">${closureReport.profitability?.totalRepaid?.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-medium">Performance Metrics</h4>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Net Profit:</span>
                          <span className={`font-bold ${closureReport.profitability?.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${closureReport.profitability?.netProfit?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Profit Margin:</span>
                          <span className={`font-medium ${parseFloat(closureReport.profitability?.profitMargin) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {closureReport.profitability?.profitMargin}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">ROI:</span>
                          <span className={`font-medium ${parseFloat(closureReport.profitability?.roi) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {closureReport.profitability?.roi}%
                          </span>
                        </div>
                        
                        <div className="mt-4 p-3 bg-gray-50 rounded">
                          <div className="text-sm text-muted-foreground mb-1">Risk Assessment</div>
                          <div className="font-medium">{closureReport.riskAssessment?.recommendedAction?.replace('_', ' ')?.toUpperCase()}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Actions Tab */}
              <TabsContent value="actions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Closure Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Label htmlFor="closureNotes">Closure Notes</Label>
                      <Textarea
                        id="closureNotes"
                        placeholder="Add any notes about this invoice closure..."
                        value={formData.closureNotes}
                        onChange={(e) => setFormData({...formData, closureNotes: e.target.value})}
                        rows={3}
                      />
                    </div>

                    {!canClose && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="forceClose"
                            checked={formData.forceClose}
                            onCheckedChange={(checked) => setFormData({...formData, forceClose: !!checked})}
                          />
                          <Label htmlFor="forceClose" className="text-sm">
                            Force close (ignore outstanding balance)
                          </Label>
                        </div>
                        
                        {formData.forceClose && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              <span className="text-sm font-medium text-red-800">Warning</span>
                            </div>
                            <p className="text-sm text-red-700 mt-1">
                              Force closing will mark this invoice as closed despite having an outstanding balance of ${closureReport.totalDue?.toLocaleString()}.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button 
                        onClick={downloadClosureReport}
                        variant="outline"
                        className="flex-1"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Download Report
                      </Button>
                      
                      <Button
                        onClick={handleSubmit}
                        disabled={loading || (!canClose && !formData.forceClose)}
                        className="flex-1"
                      >
                        {loading ? 'Processing...' : 'Close Invoice'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Supplier:</span>
                  <span className="font-medium">{invoice.supplierName}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Reference:</span>
                  <span className="font-mono text-sm">{invoice.reference}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge className={getStatusColor(invoice.status)}>
                    {getStatusIcon(invoice.status)}
                    <span className="ml-1 capitalize">{invoice.status.replace('_', ' ')}</span>
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Invoice Amount:</span>
                    <span className="font-medium">${invoice.invoiceAmount.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Paid Amount:</span>
                    <span className="text-green-600 font-medium">${invoice.paidAmount.toLocaleString()}</span>
                  </div>
                  
                  {invoice.lateFees && invoice.lateFees > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Late Fees:</span>
                        <span className="text-red-600 font-medium">${invoice.lateFees.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-red-500 pl-4">
                        Applied due to {invoice.agingDays} days overdue
                      </div>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Due:</span>
                    <span className={((invoice.remainingAmount || 0) + (invoice.lateFees || 0)) > 0 ? "text-red-600 font-medium text-lg" : "text-green-600 font-medium text-lg"}>
                      ${((invoice.remainingAmount || 0) + (invoice.lateFees || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Due Date:</span>
                    <span className={invoice.agingDays > 0 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                      {formatDate(invoice.dueDate, format(new Date(invoice.dueDate), 'MMM dd, yyyy'))}
                    </span>
                  </div>
                  
                  {invoice.agingDays > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Overdue by:</span>
                      <span className="text-red-600 font-medium">{invoice.agingDays} day(s)</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <Label htmlFor="basic-notes">Closure Notes</Label>
                  <Textarea
                    id="basic-notes"
                    placeholder="Add notes about why this invoice is being closed"
                    value={formData.closureNotes}
                    onChange={(e) => setFormData({ ...formData, closureNotes: e.target.value })}
                    rows={3}
                    className="mt-1"
                  />
                </div>

                {!canClose && (
                  <div className="flex items-center space-x-2 mt-4">
                    <Checkbox
                      id="basic-forceClose"
                      checked={formData.forceClose}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, forceClose: checked === true })
                      }
                    />
                    <Label htmlFor="basic-forceClose" className="text-sm">
                      Force close (ignore outstanding balance)
                    </Label>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || (!canClose && !formData.forceClose)}
                  >
                    {loading ? 'Closing...' : 'Close Invoice'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </DialogContent>
      </Dialog>

      {/* Late Fee Handling Dialog */}
      <LateFeeHandlingDialog
        open={showLateFeeDialog}
        onOpenChange={setShowLateFeeDialog}
        invoice={invoice}
        reserves={reserves}
        onConfirm={handleLateFeeConfirm}
      />
    </>
  );
}