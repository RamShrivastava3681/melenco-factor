import { createApiUrl, getApiHeaders } from '@/config/api';
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, DollarSign, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface InvoicePaymentDialogProps {
  invoice: {
    id: string;
    supplierName: string;
    invoiceAmount: number;
    paidAmount: number;
    remainingAmount: number;
    dueDate: string;
    expirationDate: string;
    status: string;
    agingDays: number;
    daysUntilExpiry: number;
    lateFees?: number;
    totalAmountDue?: number;
    paymentHistory: Array<{
      id: string;
      amount: number;
      paidAt: string;
      paidBy: string;
      reference?: string;
      notes?: string;
      lateFeesPaid?: number;
    }>;
    reference: string;
  };
  onPaymentRecorded?: (invoice: any, payment: any) => void;
  onClose?: () => void;
}

export default function InvoicePaymentDialog({ invoice, onPaymentRecorded, onClose }: InvoicePaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    paidAt: new Date().toISOString().split('T')[0],
    reference: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const limit = invoice.totalAmountDue ?? invoice.remainingAmount;
    
    if (!formData.amount) {
      newErrors.amount = 'Payment amount is required';
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Payment amount must be greater than 0';
    } else if (parseFloat(formData.amount) > limit) {
      newErrors.amount = `Payment amount cannot exceed total outstanding amount of $${limit.toLocaleString()}`;
    }
    
    if (!formData.paidAt) {
      newErrors.paidAt = 'Payment date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(createApiUrl(`/treasury/open-invoices/${invoice.id}/payment`), {
        method: 'POST',
        headers: {
          ...getApiHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          paidAt: new Date(formData.paidAt).toISOString(),
          reference: formData.reference,
          notes: formData.notes
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Payment recorded successfully');
        onPaymentRecorded?.(result.data.invoice, result.data.payment);
        setOpen(false);
        setFormData({
          amount: '',
          paidAt: new Date().toISOString().split('T')[0],
          reference: '',
          notes: ''
        });
      } else {
        toast.error(result.message || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Record payment error:', error);
      toast.error('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <DollarSign className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Record Payment - Invoice {invoice.id}
          </DialogTitle>
          <DialogDescription>
            Record a payment received for this open invoice
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Details</CardTitle>
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
                  <span className="text-sm text-gray-600">Paid Amount (Principal):</span>
                  <span className="text-green-600 font-medium">${invoice.paidAmount.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Remaining Principal:</span>
                  <span className="text-gray-900 font-medium">${invoice.remainingAmount.toLocaleString()}</span>
                </div>

                {invoice.lateFees !== undefined && invoice.lateFees > 0 && (
                  <div className="flex justify-between text-orange-600 font-medium">
                    <span className="text-sm">Outstanding Late Fees:</span>
                    <span>${invoice.lateFees.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-gray-800">Total Outstanding Due:</span>
                  <span className="text-red-600 font-bold">${(invoice.totalAmountDue ?? invoice.remainingAmount).toLocaleString()}</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Due Date:</span>
                  <span className={invoice.agingDays > 0 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                    {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                  </span>
                </div>
                
                {invoice.agingDays > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Overdue by:</span>
                    <span className="text-red-600 font-medium">{invoice.agingDays} day(s)</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Record New Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="amount">Payment Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={invoice.totalAmountDue ?? invoice.remainingAmount}
                    placeholder="Enter amount received"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className={errors.amount ? 'border-red-500' : ''}
                  />
                  {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
                </div>

                <div>
                  <Label htmlFor="paidAt">Payment Date *</Label>
                  <Input
                    id="paidAt"
                    type="date"
                    value={formData.paidAt}
                    onChange={(e) => setFormData({ ...formData, paidAt: e.target.value })}
                    className={errors.paidAt ? 'border-red-500' : ''}
                  />
                  {errors.paidAt && <p className="text-red-500 text-sm mt-1">{errors.paidAt}</p>}
                </div>

                <div>
                  <Label htmlFor="reference">Payment Reference</Label>
                  <Input
                    id="reference"
                    placeholder="e.g., Bank transfer ref, Check number"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any additional notes about this payment"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Recording...' : 'Record Payment'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Payment History */}
        {invoice.paymentHistory && invoice.paymentHistory.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoice.paymentHistory.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">${payment.amount.toLocaleString()}</span>
                        {payment.reference && (
                          <Badge variant="secondary" className="text-xs">
                            {payment.reference}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        Paid on {(() => {
                          try {
                            return payment.paidAt ? format(new Date(payment.paidAt), 'MMM dd, yyyy') : 'Unknown date';
                          } catch (error) {
                            return payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : 'Unknown date';
                          }
                        })()} by {payment.paidBy}
                        {payment.lateFeesPaid !== undefined && payment.lateFeesPaid > 0 && (
                          <span className="text-orange-600 font-medium ml-2">
                            (incl. ${payment.lateFeesPaid.toLocaleString()} late fees)
                          </span>
                        )}
                      </div>
                      {payment.notes && (
                        <div className="text-sm text-gray-500 mt-1">{payment.notes}</div>
                      )}
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}