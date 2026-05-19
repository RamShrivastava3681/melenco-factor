import { useState, useEffect } from 'react';
import { FileText, Plus, Search, Filter, DollarSign, Calendar, User, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddTransactionDialog } from '@/components/forms/AddTransactionDialog';
import { mockTransactions } from '@/data/demoData';
import { createApiUrl, getApiHeaders } from '@/config/api';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Transactions() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Delete transaction function
  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      setDeleteLoading(transactionId);
      
      const response = await fetch(createApiUrl(`/transactions/${transactionId}`), {
        method: 'DELETE',
        headers: getApiHeaders()
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success",
          description: "Transaction deleted successfully",
          variant: "default"
        });
        
        // Refresh transactions list
        await fetchTransactions();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete transaction');
      }
    } catch (error) {
      console.error('Delete transaction error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete transaction',
        variant: "destructive"
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  // Load transactions from API
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(createApiUrl('/transactions'), {
        headers: getApiHeaders()
      });
      
      if (response.ok) {
        const result = await response.json();
        const apiTransactions = result.data || [];
        
        // Transform API data to match expected format
        const transformedTransactions = apiTransactions.map((txn: any) => ({
          ...txn,
          invoiceNumber: txn.invoiceNumber || txn.id,
          transactionId: txn.transactionId || txn.id,
          supplierName: txn.supplierName,
          buyerName: txn.buyerName,
          amount: txn.invoiceAmount || txn.amount || 0,
          currency: txn.currency || 'USD',
          status: txn.status || 'pending'
        }));
        
        setTransactions(transformedTransactions);
        console.log('Fetched transactions from API:', transformedTransactions);
      } else {
        console.error('Failed to fetch transactions from API');
        // Fallback to mock data if API fails
        const transformedTransactions = mockTransactions.map(txn => ({
          ...txn,
          invoiceNumber: txn.id,
          transactionId: txn.id,
          supplierName: txn.supplierName,
          buyerName: txn.buyerName,
          status: txn.status === 'active' ? 'approved' : 
                  txn.status === 'completed' ? 'settled' :
                  txn.status === 'pending_approval' ? 'pending' :
                  txn.status === 'overdue' ? 'rejected' : txn.status
        }));
        setTransactions(transformedTransactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // Fallback to mock data on error
      const transformedTransactions = mockTransactions.map(txn => ({
        ...txn,
        invoiceNumber: txn.id,
        transactionId: txn.id,
        supplierName: txn.supplierName,
        buyerName: txn.buyerName,
        status: txn.status === 'active' ? 'approved' : 
                txn.status === 'completed' ? 'settled' :
                txn.status === 'pending_approval' ? 'pending' :
                txn.status === 'overdue' ? 'rejected' : txn.status
      }));
      setTransactions(transformedTransactions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    
    // Listen for refresh events from transaction creation
    const handleRefresh = () => {
      console.log('Refreshing transactions due to new transaction...');
      fetchTransactions();
    };
    
    window.addEventListener('refreshTransactions', handleRefresh);
    
    return () => {
      window.removeEventListener('refreshTransactions', handleRefresh);
    };
  }, []);

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(transaction =>
    transaction.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.buyerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.invoiceId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-warning/10 text-warning border-warning/20',
      approved: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      funded: 'bg-success/10 text-success border-success/20',
      settled: 'bg-muted text-muted-foreground',
      rejected: 'bg-destructive/10 text-destructive border-destructive/20'
    };
    return variants[status] || variants.pending;
  };

  const downloadDocument = (key: string, fileName?: string) => {
    const query = new URLSearchParams({ key });
    if (fileName) {
      query.set('fileName', fileName);
    }
    window.open(createApiUrl(`/documents/download?${query.toString()}`), '_blank');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-financial-navy">Transactions & Documents</h1>
          <p className="text-sm text-muted-foreground">Manage trade finance transactions and documents</p>
        </div>
        <Button 
          className="btn-financial gap-2"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          New Transaction
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search transactions..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="financial-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-financial-navy">
                  {transactions.length}
                </div>
                <p className="text-xs text-muted-foreground">Active transactions</p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="financial-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-financial-navy">
                  {formatCurrency(transactions.reduce((sum, t) => sum + (t.invoiceAmount || 0), 0))}
                </div>
                <p className="text-xs text-success">Invoice value</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="financial-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-financial-navy">
                  {transactions.filter(t => t.status === 'pending').length}
                </div>
                <p className="text-xs text-warning">Awaiting review</p>
              </div>
              <Calendar className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="financial-card">
        <CardHeader>
          <CardTitle className="text-lg">
            Transaction History ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>Parties</TableHead>
                <TableHead>Invoice Details</TableHead>
                <TableHead>Financial</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading transactions...
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="space-y-3">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
                      <div>
                        <p className="text-muted-foreground text-lg">No transactions available</p>
                        <p className="text-sm text-muted-foreground">
                          {transactions.length === 0 
                            ? "Create your first transaction to get started."
                            : "No transactions match your search criteria."
                          }
                        </p>
                      </div>
                      <Button 
                        className="btn-financial mt-4"
                        onClick={() => setIsAddDialogOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Transaction
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction, index) => (
                  <TableRow key={transaction.transactionId || transaction.id || index} className="border-border hover:bg-muted/30">
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-financial-navy">{transaction.transactionId}</p>
                        {transaction.invoiceId && (
                          <p className="text-xs text-blue-600">Invoice: {transaction.invoiceId}</p>
                        )}
                        <p className="text-xs text-muted-foreground capitalize">{transaction.transactionType}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">S: {transaction.supplierName}</p>
                        <p className="text-xs text-muted-foreground">B: {transaction.buyerName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{transaction.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          Due: {formatDate(transaction.dueDate)}
                        </p>
                        {transaction.tenureDays && (
                          <p className="text-xs text-blue-600">
                            Tenure: {transaction.tenureDays} days
                          </p>
                        )}
                        {Array.isArray(transaction.supportingDocuments) && transaction.supportingDocuments.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {transaction.supportingDocuments.map((docKey: string, idx: number) => (
                              <Button
                                key={`${transaction.transactionId}-doc-${idx}`}
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs"
                                onClick={() =>
                                  downloadDocument(
                                    docKey,
                                    transaction.supportingDocumentNames?.[idx] || `transaction-doc-${idx + 1}`
                                  )
                                }
                              >
                                Doc {idx + 1}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {formatCurrency(parseFloat(transaction.invoiceAmount) || 0, transaction.currency)}
                        </p>
                        <p className="text-xs text-success">
                          Advance: {formatCurrency(parseFloat(transaction.advanceAmount) || 0, transaction.currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Fee: {formatCurrency(parseFloat(transaction.feeAmount) || 0, transaction.currency)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(transaction.createdAt)}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            disabled={deleteLoading === (transaction.transactionId || transaction.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete transaction {transaction.transactionId || transaction.id}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTransaction(transaction.transactionId || transaction.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              {deleteLoading === (transaction.transactionId || transaction.id) ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddTransactionDialog 
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
}
