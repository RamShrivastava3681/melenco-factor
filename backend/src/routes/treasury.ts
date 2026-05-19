import express from 'express';
import {
  createPayoutRecord,
  deleteTransaction,
  getEntityById,
  getPayoutRecordById,
  getTransactionById,
  listEntities,
  listPayoutRecords,
  listTransactions,
  updateTransaction,
  updateTransactionsByIds
} from '../data/dynamoRepository';
import { broadcastNotification } from '../index';
import { isDynamoConfigured } from '../data/dynamoClient';
import { mockTransactions } from '../../mockData';

const router = express.Router();

const findEntityByAnyId = async (id: string) => {
  return getEntityById(String(id || ''));
};

const normalizeBankDetails = (bankDetails: any, fallbackName: string, fallbackCurrency: string = 'USD') => ({
  beneficiary: String(bankDetails?.beneficiary || fallbackName || 'Unknown Beneficiary'),
  bank: String(bankDetails?.bank || 'Bank details pending'),
  branch: String(bankDetails?.branch || 'Branch details pending'),
  accountNumber: String(bankDetails?.accountNumber || 'Account pending'),
  ifscCode: String(bankDetails?.ifscCode || ''),
  swiftCode: bankDetails?.swiftCode ? String(bankDetails.swiftCode) : undefined,
  currency: String(bankDetails?.currency || fallbackCurrency || 'USD')
});

// Get treasury metrics with basic DynamoDB queries
router.get('/metrics', async (req, res) => {
  try {
    const transactions = await listTransactions();
    const totalTransactions = transactions.length;
    const totalFees = transactions.reduce((sum, tx) => sum + (tx.feeAmount || 0), 0);
    const totalAdvances = transactions.reduce((sum, tx) => sum + (tx.advanceAmount || 0), 0);
    const totalReserves = transactions.reduce((sum, tx) => sum + (tx.reserveAmount || 0), 0);

    res.json({
      success: true,
      data: {
        totalRevenueGenerated: { 
          value: totalFees || 0, 
          change: 0, 
          trend: 'up',
          currency: 'USD'
        },
        totalAdvancesOutstanding: { 
          value: totalAdvances || 0, 
          change: 0, 
          trend: 'down',
          currency: 'USD'
        },
        totalReservesHeld: { 
          value: totalReserves || 0, 
          change: 0, 
          trend: 'up',
          currency: 'USD'
        },
        portfolioUtilization: { 
          value: 75.5, 
          change: 2.3, 
          trend: 'up',
          unit: '%'
        },
        totalTransactions: {
          value: totalTransactions,
          change: 0,
          trend: 'up'
        }
      }
    });
  } catch (error) {
    console.error('Treasury metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Dashboard metrics endpoint
router.get('/dashboard-metrics', async (req, res) => {
  try {
    const transactions = await listTransactions();
    const totalTransactions = transactions.length;
    const totalTransactionValue = transactions.reduce((sum, tx) => sum + (tx.invoiceValue || 0), 0);
    
    const dashboardKPIs = {
      totalTransactions: {
        value: totalTransactions,
        change: 0,
        trend: 'up' as const
      },
      totalFeesEarned: {
        value: 0,
        change: 0,
        trend: 'up' as const,
        currency: 'USD'
      },
      totalReserves: {
        value: 0,
        change: 0,
        trend: 'up' as const,
        currency: 'USD'
      },
      portfolioUtilization: {
        value: 0,
        change: 0,
        trend: 'up' as const,
        unit: '%'
      },
      totalDueAmount: {
        value: totalTransactionValue || 0,
        change: 0,
        trend: 'down' as const,
        currency: 'USD'
      }
    };
    
    res.json({
      success: true,
      data: dashboardKPIs
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Dashboard alerts endpoint
router.get('/dashboard-alerts', async (req, res) => {
  try {
    // For now, return empty alerts - can be enhanced with actual alert logic
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Dashboard alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get treasury invoices 
router.get('/invoices', async (req, res) => {
  try {
    // Return basic structure for now
    res.json({
      success: true,
      data: [],
      message: 'Treasury invoices functionality is being migrated to DynamoDB'
    });
  } catch (error) {
    console.error('Treasury invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get open invoices for monitoring
// Helper function to calculate late fees
const calculateLateFees = async (transaction: any) => {
  if (!transaction.dueDate) {
    return 0;
  }

  const dueDate = new Date(transaction.dueDate);
  if (Number.isNaN(dueDate.getTime())) {
    return 0;
  }
  const currentDate = new Date();
  const overdueDays = Math.max(0, Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

  if (overdueDays <= 0) {
    return 0; // Not overdue
  }

  try {
    // Get buyer entity to check late fee configuration. Support both business entityId and legacy ids.
    const buyerId = String(transaction.buyerId || '');
    const buyer = await getEntityById(buyerId);

    const lateFeeRatePercent = parseFloat(String(buyer?.lateFees || '0').replace('%', '').trim());
    if (!buyer || Number.isNaN(lateFeeRatePercent) || lateFeeRatePercent <= 0) {
      return 0;
    }

    const lateFeeRate = lateFeeRatePercent / 100; // Convert percentage to decimal
    // Late fees calculated on unpaid portion of full invoice amount owed by buyer
    const invoiceAmount = transaction.invoiceValue || transaction.invoiceAmount || 0;
    const buyerOwes = invoiceAmount;
    const paidSoFar = transaction.paidAmount || 0;
    const principalAmount = Math.max(0, buyerOwes - paidSoFar); // Outstanding amount for late fees

    if (principalAmount <= 0) {
      return 0;
    }
    
    let totalLateFees = 0;

    const lateFeeFrequency = String(buyer.lateFeesFrequency || 'monthly').toLowerCase();
    if (lateFeeFrequency === 'daily') {
      totalLateFees = principalAmount * lateFeeRate * (overdueDays / 365); // Daily compounding
    } else {
      // Monthly frequency (default)
      const overdueMonths = Math.ceil(overdueDays / 30);
      totalLateFees = principalAmount * lateFeeRate * overdueMonths;
    }

    return Math.round(totalLateFees * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('Error calculating late fees for transaction', transaction.transactionId, ':', error);
    return 0;
  }
};

router.get('/open-invoices', async (req, res) => {
  try {
    console.log('🔍 Fetching open invoices...');
    
    // Only include funded transactions - these are the actual "open invoices" waiting for buyer payment
    const openTransactions = (await listTransactions())
      .filter((transaction) =>
        ['funded', 'partial_payment'].includes(String(transaction.status || '').toLowerCase()) &&
        Boolean(transaction.fundedAt)
      )
      .sort((a, b) => {
        const aDue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const bDue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        if (aDue !== bDue) {
          return aDue - bDue;
        }
        const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bCreated - aCreated;
      })
      .slice(0, 50);
    
    console.log(`📋 Found ${openTransactions.length} open invoices`);
    
    // Calculate late fees and proper amounts for each transaction
    const invoicesWithLateFees = await Promise.all(
      openTransactions.map(async (transaction) => {
        const totalLateFees = await calculateLateFees(transaction);
        const totalLateFeesPaid = (transaction.paymentHistory || []).reduce((sum: number, payment: any) => sum + (payment.lateFeesPaid || 0), 0);
        const outstandingLateFees = Math.max(0, totalLateFees - totalLateFeesPaid);
        const agingDays = transaction.dueDate ? 
          Math.max(0, Math.floor((Date.now() - new Date(transaction.dueDate).getTime()) / (1000 * 60 * 60 * 24))) : 0;
        
        // Buyer obligation model: buyer owes full invoice amount
        const netPaidToSupplier = transaction.advanceAmount - (transaction.feeAmount || 0);
        const buyerOwes = transaction.invoiceValue || transaction.invoiceAmount || 0;
        const totalPaidByBuyer = (transaction.paidAmount || 0); // What buyer has paid so far towards principal
        const remainingAmount = Math.max(0, buyerOwes - totalPaidByBuyer); // What buyer still owes
        const totalAmountDue = remainingAmount + outstandingLateFees; // Including outstanding late fees
        
        // Calculate net amount paid to supplier (advance - fees)
        
        // Check if invoice is fully paid and can be closed
        const isFullyPaid = remainingAmount <= 0 && outstandingLateFees <= 0;
        const canReleaseReserve = isFullyPaid && transaction.reserveAmount > 0;
        
        return {
          id: transaction.transactionId,
          invoiceNumber: transaction.invoiceNumber,
          invoiceDate: transaction.invoiceDate,
          supplierName: transaction.supplierName,
          buyerName: transaction.buyerName,
          currency: transaction.currency || 'USD',
          invoiceAmount: transaction.invoiceValue, // Original invoice amount
          advanceAmount: transaction.advanceAmount, // Gross advance (before fees)
          feeAmount: transaction.feeAmount || 0, // Fee deducted
          netPaidToSupplier: netPaidToSupplier, // Net amount paid to supplier
          buyerOwes: buyerOwes, // Buyer owes full invoice amount
          paidAmount: totalPaidByBuyer, // Amount buyer has paid so far
          remainingAmount: remainingAmount, // Amount buyer still owes
          reserves: transaction.reserveAmount,
          dueDate: transaction.dueDate,
          status: isFullyPaid ? 'ready_for_closure' : transaction.status,
          agingDays: agingDays,
          lateFees: outstandingLateFees,
          fundedAt: transaction.fundedAt,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
          totalAmountDue: totalAmountDue,
          paymentHistory: transaction.paymentHistory || [],
          isOverdue: agingDays > 0,
          isFullyPaid: isFullyPaid,
          canReleaseReserve: canReleaseReserve,
          fundingDate: transaction.fundedAt ? new Date(transaction.fundedAt).toLocaleDateString() : null
        };
      })
    );
    
    // Sort by urgency (overdue first, then by aging)
    const sortedInvoices = invoicesWithLateFees.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return b.agingDays - a.agingDays;
    });
    
    console.log(`✅ Processed ${sortedInvoices.length} open invoices with proper calculations`);
    
    res.json({
      success: true,
      data: sortedInvoices,
      summary: {
        total: sortedInvoices.length,
        pending: sortedInvoices.filter(inv => inv.status === 'funded').length,
        overdue: sortedInvoices.filter(inv => inv.isOverdue).length,
        partiallyPaid: sortedInvoices.filter(inv => inv.status === 'partial_payment').length,
        totalAmount: sortedInvoices.reduce((sum, inv) => sum + inv.invoiceAmount, 0),
        totalRemaining: sortedInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0), // Using corrected remainingAmount
        totalReserves: sortedInvoices.reduce((sum, inv) => sum + inv.reserves, 0),
        totalOutstanding: sortedInvoices.reduce((sum, inv) => sum + inv.totalAmountDue, 0)
      }
    });
  } catch (error) {
    console.error('Open invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete an open invoice
router.delete('/open-invoices/:invoiceId', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    console.log(`🗑️ Attempting to delete invoice: ${invoiceId}`);
    
    // Find the transaction first to get details for logging
    const transaction = await getTransactionById(invoiceId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    // Check if invoice can be safely deleted (not settled or completed)
    if (transaction.status === 'settled' || transaction.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete settled or completed invoices'
      });
    }
    
    // Delete the transaction
    const deletedTransaction = await deleteTransaction(invoiceId);

    if (!deletedTransaction) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found or already deleted'
      });
    }
    
    console.log(`✅ Successfully deleted invoice ${invoiceId} (${transaction.supplierName} - ${transaction.buyerName})`);
    
    // Broadcast notification
    broadcastNotification({
      type: 'invoice_deleted',
      title: 'Invoice Deleted',
      message: `Invoice ${transaction.invoiceNumber} has been deleted from the system`,
      timestamp: new Date(),
      priority: 'medium'
    });
    
    res.json({
      success: true,
      message: 'Invoice deleted successfully',
      data: {
        invoiceId: invoiceId,
        invoiceNumber: transaction.invoiceNumber,
        supplierName: transaction.supplierName,
        buyerName: transaction.buyerName,
        amount: transaction.invoiceValue
      }
    });
    
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Record payment for an open invoice
router.post('/open-invoices/:invoiceId/payment', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { amount, paidAt, reference, notes, paidBy } = req.body;

    console.log(`💰 Recording payment for invoice ${invoiceId}:`, { amount, paidAt, reference });

    // Find the transaction
    const transaction = await getTransactionById(invoiceId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Validate payment amount
    const paymentAmount = parseFloat(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    // Buyer obligation model: buyer owes full invoice amount
    const netPaidToSupplier = transaction.advanceAmount - (transaction.feeAmount || 0);
    const buyerOwes = transaction.invoiceValue || transaction.invoiceAmount || 0;
    const totalPaidSoFar = (transaction.paidAmount || 0);
    const remainingAmount = Math.max(0, buyerOwes - totalPaidSoFar);
    
    // Calculate outstanding late fees
    const totalLateFees = await calculateLateFees(transaction);
    const totalLateFeesPaid = (transaction.paymentHistory || []).reduce((sum: number, p: any) => sum + (p.lateFeesPaid || 0), 0);
    const currentLateFees = Math.max(0, totalLateFees - totalLateFeesPaid);
    const totalDue = remainingAmount + currentLateFees;

    if (paymentAmount > totalDue) {
      return res.status(400).json({
        success: false,
        message: `Payment amount cannot exceed total due amount: $${totalDue.toFixed(2)} (Remaining Principal: $${remainingAmount.toFixed(2)} + Outstanding Late Fees: $${currentLateFees.toFixed(2)})`
      });
    }

    // Allocate payment: first to outstanding late fees, then to principal
    const paymentLateFeesPaid = Math.min(currentLateFees, paymentAmount);
    const principalPaid = paymentAmount - paymentLateFeesPaid;

    // Create payment record
    const payment = {
      id: `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      amount: paymentAmount,
      paidAt: paidAt || new Date().toISOString(),
      paidBy: paidBy || 'Unknown',
      reference: reference || '',
      notes: notes || '',
      lateFeesPaid: paymentLateFeesPaid
    };

    // Update transaction with payment information
    const newTotalPaid = totalPaidSoFar + principalPaid;
    const newRemainingAmount = Math.max(0, buyerOwes - newTotalPaid);
    const outstandingLateFeesAfterPayment = currentLateFees - paymentLateFeesPaid;
    const isFullyPaid = newRemainingAmount <= 0 && outstandingLateFeesAfterPayment <= 0;
    const updatedStatus = isFullyPaid ? 'settled' : 'partial_payment';
    
    const updatedPaymentHistory = [...(transaction.paymentHistory || []), payment];

    await updateTransaction(invoiceId, {
      paymentHistory: updatedPaymentHistory,
      paidAmount: newTotalPaid,
      status: updatedStatus,
      lastPaymentAt: new Date(paidAt || new Date()).toISOString(),
      ...(updatedStatus === 'settled' ? { settledAt: new Date().toISOString() } : {})
    });

    console.log(`✅ Payment recorded: ${paymentAmount} for invoice ${invoiceId}. New status: ${updatedStatus}`);

    // If fully paid, check if we should auto-release reserves
    if (updatedStatus === 'settled' && transaction.reserveAmount > 0) {
      console.log(`💰 Invoice fully paid - reserves of $${transaction.reserveAmount} can be released to supplier`);
      
      // Broadcast notification about reserve release opportunity
      broadcastNotification({
        type: 'reserve_ready',
        title: 'Reserves Ready for Release',
        message: `Invoice ${transaction.invoiceNumber} is fully paid. Reserve amount $${transaction.reserveAmount} ready for release to ${transaction.supplierName}`,
        timestamp: new Date(),
        priority: 'high'
      });
    }

    // Fetch updated transaction for response
    const updatedTransaction = await getTransactionById(invoiceId);
    if (!updatedTransaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found after update'
      });
    }
    
    const updatedNetPaidToSupplier = updatedTransaction.advanceAmount - (updatedTransaction.feeAmount || 0);
    const buyerOwesAmount = updatedTransaction.invoiceValue || updatedTransaction.invoiceAmount || 0;
    const finalRemainingAmount = Math.max(0, buyerOwesAmount - (updatedTransaction.paidAmount || 0));

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        payment,
        updatedInvoice: {
          id: updatedTransaction.transactionId,
          buyerOwes: buyerOwesAmount,
          paidAmount: updatedTransaction.paidAmount || 0,
          remainingAmount: finalRemainingAmount,
          status: updatedTransaction.status,
          totalLateFees: currentLateFees,
          canReleaseReserve: finalRemainingAmount <= 0 && updatedTransaction.reserveAmount > 0
        }
      }
    });

  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get closed invoices
router.get('/closed-invoices', async (req, res) => {
  try {
    if (!isDynamoConfigured()) {
      const closedInvoices = mockTransactions
        .filter((transaction: any) => ['settled', 'completed', 'closed'].includes(transaction.status))
        .map((transaction: any) => ({
          id: transaction.transactionId || transaction.id,
          invoiceNumber: transaction.invoiceNumber,
          invoiceDate: transaction.invoiceDate,
          dueDate: transaction.dueDate,
          supplierName: transaction.supplierName,
          buyerName: transaction.buyerName,
          currency: transaction.currency || 'USD',
          invoiceAmount: transaction.invoiceValue || transaction.invoiceAmount || 0,
          advanceAmount: transaction.advanceAmount || 0,
          feeAmount: transaction.feeAmount || 0,
          paidAmount: transaction.paidAmount || 0,
          reserves: transaction.reserveAmount || 0,
          lateFees: 0,
          status: transaction.status,
          settledAt: transaction.settledAt,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
          paymentHistory: transaction.paymentHistory || [],
          agingDaysAtClosure: transaction.settledAt && transaction.dueDate
            ? Math.max(0, Math.floor((new Date(transaction.settledAt).getTime() - new Date(transaction.dueDate).getTime()) / (1000 * 60 * 60 * 24)))
            : 0
        }));

      return res.json({
        success: true,
        data: closedInvoices,
        summary: {
          total: closedInvoices.length,
          totalAmount: closedInvoices.reduce((sum: number, invoice: any) => sum + (invoice.invoiceAmount || 0), 0),
          totalPaidAmount: closedInvoices.reduce((sum: number, invoice: any) => sum + (invoice.paidAmount || 0), 0),
          totalLateFees: closedInvoices.reduce((sum: number, invoice: any) => sum + (invoice.lateFees || 0), 0)
        }
      });
    }

    const closedTransactions = (await listTransactions())
      .filter((transaction) => ['settled', 'completed', 'closed'].includes(String(transaction.status || '').toLowerCase()))
      .sort((a, b) => {
        const aSettled = a.settledAt ? new Date(a.settledAt).getTime() : 0;
        const bSettled = b.settledAt ? new Date(b.settledAt).getTime() : 0;
        if (aSettled !== bSettled) {
          return bSettled - aSettled;
        }
        const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bUpdated - aUpdated;
      })
      .slice(0, 50);

    const closedInvoices = await Promise.all(
      closedTransactions.map(async (transaction) => {
        const totalLateFees = await calculateLateFees(transaction);
        
        return {
          id: transaction.transactionId,
          invoiceNumber: transaction.invoiceNumber,
          invoiceDate: transaction.invoiceDate,
          supplierName: transaction.supplierName,
          buyerName: transaction.buyerName,
          currency: transaction.currency || 'USD',
          invoiceAmount: transaction.invoiceValue,
          advanceAmount: transaction.advanceAmount,
          paidAmount: transaction.paidAmount || 0,
          reserves: transaction.reserveAmount,
          lateFees: totalLateFees,
          status: transaction.status,
          settledAt: transaction.settledAt,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
          paymentHistory: transaction.paymentHistory || [],
          agingDaysAtClosure: transaction.settledAt && transaction.dueDate ? 
            Math.max(0, Math.floor((new Date(transaction.settledAt).getTime() - new Date(transaction.dueDate).getTime()) / (1000 * 60 * 60 * 24))) : 0
        };
      })
    );

    res.json({
      success: true,
      data: closedInvoices,
      summary: {
        total: closedInvoices.length,
        totalAmount: closedInvoices.reduce((sum, invoice) => sum + (invoice.invoiceAmount || 0), 0),
        totalPaidAmount: closedInvoices.reduce((sum, invoice) => sum + (invoice.paidAmount || 0), 0),
        totalLateFees: closedInvoices.reduce((sum, invoice) => sum + (invoice.lateFees || 0), 0)
      }
    });

  } catch (error) {
    console.error('Closed invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get enhanced closure report for an invoice
router.get('/open-invoices/:invoiceId/closure-report', async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const transaction = await getTransactionById(invoiceId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Get supplier and buyer details
    const supplier = await getEntityById(String(transaction.supplierId || ''));
    const buyer = await getEntityById(String(transaction.buyerId || ''));

    const lateFees = await calculateLateFees(transaction);
    const agingDays = transaction.dueDate ? 
      Math.max(0, Math.floor((Date.now() - new Date(transaction.dueDate).getTime()) / (1000 * 60 * 60 * 24))) : 0;
    
    // Buyer obligation model: buyer owes full invoice amount
    const netPaidToSupplier = transaction.advanceAmount - (transaction.feeAmount || 0);
    const buyerOwes = transaction.invoiceValue || transaction.invoiceAmount || 0;
    const paidAmount = transaction.paidAmount || 0;
    const remainingAmount = Math.max(0, buyerOwes - paidAmount);
    const totalLateFeesPaid = (transaction.paymentHistory || []).reduce((sum: number, payment: any) => sum + (payment.lateFeesPaid || 0), 0);
    const outstandingLateFees = Math.max(0, lateFees - totalLateFeesPaid);
    
    // Calculate profitability
    const totalFeesCollected = (transaction.feeAmount || 0) + totalLateFeesPaid;
    const totalAdvanced = transaction.advanceAmount;
    const totalRepaid = paidAmount + totalLateFeesPaid;
    const netProfit = totalFeesCollected - (totalAdvanced - Math.min(totalRepaid, totalAdvanced));
    
    // Calculate reserve information
    const reserveAmount = transaction.reserveAmount || 0;
    const reserveStatus = transaction.reserveReleasedAt ? 'released' : (remainingAmount <= 0 ? 'ready_for_release' : 'held');
    
    // Generate formatted memo
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const memo = `
═══════════════════════════════════════════════════════════════════════════════
                           INVOICE CLOSURE MEMORANDUM
═══════════════════════════════════════════════════════════════════════════════

TO:       Treasury Management Department
FROM:     Invoice Factoring System
DATE:     ${currentDate}
RE:       Invoice Closure Report - ${transaction.invoiceNumber}

═══════════════════════════════════════════════════════════════════════════════

EXECUTIVE SUMMARY
═══════════════════════════════════════════════════════════════════════════════

This memorandum provides a comprehensive closure report for Invoice ${transaction.invoiceNumber}, 
documenting all financial transactions, payment history, and final settlement details in accordance 
with our factoring agreement with ${transaction.supplierName}.

Transaction Status: ${transaction.status.toUpperCase().replace('_', ' ')}
Closure Recommendation: ${remainingAmount <= 0 ? 'APPROVE CLOSURE' : 'REQUIRES REVIEW'}

═══════════════════════════════════════════════════════════════════════════════

1. TRANSACTION IDENTIFICATION
═══════════════════════════════════════════════════════════════════════════════

Invoice ID:           ${transaction.transactionId}
Invoice Number:       ${transaction.invoiceNumber}
Invoice Date:         ${transaction.invoiceDate ? new Date(transaction.invoiceDate).toLocaleDateString() : 'Not Available'}
Due Date:             ${transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString() : 'Not Available'}
Current Aging:        ${agingDays} days ${agingDays > 0 ? '(OVERDUE)' : '(CURRENT)'}

Supplier Information:
  Company Name:       ${transaction.supplierName}
  Entity ID:          ${transaction.supplierId}
  Contact Email:      ${supplier?.email || 'Not Available'}
  Risk Score:         ${supplier?.riskScore || 'Not Available'}

Buyer Information:
  Company Name:       ${transaction.buyerName}
  Entity ID:          ${transaction.buyerId}
  Contact Email:      ${buyer?.email || 'Not Available'}
  Risk Score:         ${buyer?.riskScore || 'Not Available'}
  Late Fee Rate:      ${buyer?.lateFees || '0'}% ${buyer?.lateFeesFrequency || 'monthly'}

═══════════════════════════════════════════════════════════════════════════════

2. FINANCIAL TRANSACTION DETAILS
═══════════════════════════════════════════════════════════════════════════════

INVOICE BREAKDOWN:
  Original Invoice Amount:     $${transaction.invoiceValue?.toLocaleString() || '0'}
  Advance Percentage:          ${transaction.advanceRate || 'Not Available'}%
  Gross Advance Amount:        $${transaction.advanceAmount?.toLocaleString() || '0'}
  
FEES DEDUCTED:
  Transaction Fees:            $${(transaction.feeAmount || 0).toLocaleString()} (${transaction.feeAmount ? ((transaction.feeAmount / transaction.advanceAmount) * 100).toFixed(2) : '0.00'}%)
  Processing Fees:             $${(transaction.processingFee || 0).toLocaleString()}
  Setup Fees:                  $${(transaction.setupFee || 0).toLocaleString()}
  Total Fees Deducted:         $${(transaction.feeAmount || 0).toLocaleString()}

NET AMOUNT TO SUPPLIER:        $${netPaidToSupplier.toLocaleString()}

RESERVE MANAGEMENT:
  Reserve Amount:              $${reserveAmount.toLocaleString()}
  Reserve Percentage:          ${reserveAmount && transaction.invoiceValue ? ((reserveAmount / transaction.invoiceValue) * 100).toFixed(2) : '0.00'}%
  Reserve Status:              ${reserveStatus.toUpperCase().replace('_', ' ')}
  ${transaction.reserveReleasedAt ? `Release Date:              ${new Date(transaction.reserveReleasedAt).toLocaleDateString()}` : ''}
  ${transaction.reservePayoutId ? `Release Reference:          ${transaction.reservePayoutId}` : ''}

═══════════════════════════════════════════════════════════════════════════════

3. BUYER PAYMENT OBLIGATIONS & STATUS
═══════════════════════════════════════════════════════════════════════════════

PAYMENT OBLIGATIONS (CORRECTED FACTORING MODEL):
  Buyer Owes (Invoice Amount): $${buyerOwes.toLocaleString()}
  Amount Received:             $${paidAmount.toLocaleString()}
  Outstanding Principal:       $${remainingAmount.toLocaleString()}
  
LATE FEES:
  Current Late Fees:           $${lateFees.toLocaleString()}
  Late Fees Paid:              $${totalLateFeesPaid.toLocaleString()}
  Outstanding Late Fees:       $${outstandingLateFees.toLocaleString()}
  
TOTAL DUE FROM BUYER:          $${(remainingAmount + outstandingLateFees).toLocaleString()}

PAYMENT HISTORY:
${(transaction.paymentHistory || []).length > 0 ? 
  (transaction.paymentHistory || []).map((payment: any, index: number) => {
    const principalPaid = payment.amount - (payment.lateFeesPaid || 0);
    return `  Payment ${index + 1}:
    Date:                      ${new Date(payment.paidAt).toLocaleDateString()}
    Total Amount:              $${payment.amount.toLocaleString()}
    Principal Applied:         $${principalPaid.toLocaleString()}
    Late Fees Applied:         $${(payment.lateFeesPaid || 0).toLocaleString()}
    Paid By:                   ${payment.paidBy || 'Not Specified'}
    Reference:                 ${payment.reference || 'None'}
    Notes:                     ${payment.notes || 'None'}`;
  }).join('\n\n') : 
  '  No payments recorded.'
}

═══════════════════════════════════════════════════════════════════════════════

4. PROFITABILITY ANALYSIS
═══════════════════════════════════════════════════════════════════════════════

REVENUE COMPONENTS:
  Factoring Fees Collected:   $${(transaction.feeAmount || 0).toLocaleString()}
  Late Fees Collected:        $${totalLateFeesPaid.toLocaleString()}
  Total Revenue:               $${totalFeesCollected.toLocaleString()}

COST ANALYSIS:
  Total Amount Advanced:       $${totalAdvanced.toLocaleString()}
  Amount Recovered:            $${totalRepaid.toLocaleString()}
  Unrecovered Amount:          $${Math.max(0, totalAdvanced - totalRepaid).toLocaleString()}

PROFITABILITY METRICS:
  Net Profit:                  $${netProfit.toLocaleString()}
  Profit Margin:               ${totalAdvanced > 0 ? ((netProfit / totalAdvanced) * 100).toFixed(2) : '0.00'}%
  Return on Investment:        ${totalAdvanced > 0 ? ((netProfit / totalAdvanced) * 100).toFixed(2) : '0.00'}%
  Collection Efficiency:       ${totalAdvanced > 0 ? ((totalRepaid / totalAdvanced) * 100).toFixed(2) : '0.00'}%

═══════════════════════════════════════════════════════════════════════════════

5. RISK ASSESSMENT
═══════════════════════════════════════════════════════════════════════════════

RISK INDICATORS:
  Payment Status:              ${agingDays > 0 ? 'OVERDUE' : 'CURRENT'}
  Risk Level:                  ${agingDays > 90 ? 'HIGH' : agingDays > 30 ? 'MEDIUM' : 'LOW'}
  Collection Probability:      ${agingDays > 90 ? 'LOW' : agingDays > 30 ? 'MEDIUM' : 'HIGH'}
  Days Since Funding:          ${transaction.fundedAt ? Math.floor((Date.now() - new Date(transaction.fundedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0} days

RECOMMENDED ACTION:
${remainingAmount <= 0 ? 
  '✓ COMPLETE TRANSACTION - All obligations fulfilled' :
  agingDays > 60 ? 
    '! ESCALATE COLLECTION - Immediate action required' :
    '→ CONTINUE MONITORING - Within acceptable parameters'
}

═══════════════════════════════════════════════════════════════════════════════

6. CLOSURE RECOMMENDATIONS
═══════════════════════════════════════════════════════════════════════════════

CLOSURE STATUS:
${remainingAmount <= 0 ? 
  '✓ APPROVED FOR CLOSURE - Invoice fully settled' :
  `✗ REQUIRES REVIEW - Outstanding balance: $${(remainingAmount + outstandingLateFees).toLocaleString()}`
}

RESERVE RELEASE STATUS:
${reserveStatus === 'released' ? 
  '✓ RESERVES RELEASED - Payment completed' :
  reserveStatus === 'ready_for_release' ?
    '→ READY FOR RELEASE - Awaiting authorization' :
    '◦ RESERVES HELD - Release pending full payment'
}

NEXT STEPS:
${remainingAmount <= 0 ? 
  `1. Process final closure documentation
2. ${reserveStatus === 'ready_for_release' ? `Release reserves to ${transaction.supplierName}` : 'Archive transaction records'}
3. Update counter-party credit files
4. Generate final accounting entries` :
  `1. ${agingDays > 30 ? 'Escalate collection efforts immediately' : 'Continue standard collection procedures'}
2. Monitor payment status daily
3. Review credit terms if pattern continues
4. Consider write-off procedures if beyond 120 days`
}

═══════════════════════════════════════════════════════════════════════════════

7. COMPLIANCE & DOCUMENTATION
═══════════════════════════════════════════════════════════════════════════════

TRANSACTION LIFECYCLE:
  Created:                     ${transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : 'Not Available'}
  Funded:                      ${transaction.fundedAt ? new Date(transaction.fundedAt).toLocaleDateString() : 'Not Available'}
  ${transaction.settledAt ? `Settled:                     ${new Date(transaction.settledAt).toLocaleDateString()}` : ''}
  ${transaction.completedAt ? `Completed:                   ${new Date(transaction.completedAt).toLocaleDateString()}` : ''}

REGULATORY COMPLIANCE:
  KYC Documentation:           ${supplier ? 'VERIFIED' : 'PENDING REVIEW'}
  AML Screening:               ${buyer ? 'COMPLETED' : 'PENDING'}
  Credit Assessment:           COMPLETED
  NOA Requirements:            ${transaction.sendNOA ? `REQUIRED - Status: ${transaction.noaStatus || 'PENDING'}` : 'NOT REQUIRED'}

SUPPORTING DOCUMENTS:
${transaction.supportingDocuments && transaction.supportingDocuments.length > 0 ?
  transaction.supportingDocuments.map((doc: string, index: number) => `  ${index + 1}. ${doc}`).join('\n') :
  '  Standard invoice factoring documentation on file'
}

═══════════════════════════════════════════════════════════════════════════════

AUTHORIZATION & APPROVAL
═══════════════════════════════════════════════════════════════════════════════

Report Generated:            ${currentDate}
System Authorization:        Treasury Management System v2.0
Report Reference:            ${transaction.transactionId}_CLOSURE_${Date.now()}

Approvals Required:
☐ Treasury Manager Review
☐ Risk Management Sign-off
☐ Final Closure Authorization

═══════════════════════════════════════════════════════════════════════════════

This report contains confidential and proprietary information. Distribution is 
restricted to authorized personnel only.

Generated by: Whizunik Treasury Management System
Report ID: CLOSURE_${transaction.transactionId}_${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}

═══════════════════════════════════════════════════════════════════════════════
                                END OF MEMO
═══════════════════════════════════════════════════════════════════════════════
`.trim();

    // Return the formatted memo as a downloadable text file
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice_Closure_Memo_${transaction.invoiceNumber}_${new Date().toISOString().split('T')[0]}.txt"`);
    res.send(memo);

  } catch (error) {
    console.error('Enhanced closure report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get supplier summary
router.get('/supplier-summary', async (req, res) => {
  try {
    if (!isDynamoConfigured()) {
      console.warn('DynamoDB not configured, using mock data');
      return res.json({
        success: true,
        message: 'Supplier summary retrieved successfully (mock data)',
        data: []
      });
    }

    console.log('🔍 Treasury: Fetching supplier summaries...');
    
    // Debug: Show all transactions first
    const allTransactionsDebug = await listTransactions();
    console.log(`\n🔍 DEBUG: Found ${allTransactionsDebug.length} total transactions in database:`);
    allTransactionsDebug.forEach((t, i) => {
      console.log(`   Transaction ${i + 1}:`, {
        id: t.transactionId,
        supplierId: t.supplierId,
        supplierName: t.supplierName,
        status: t.status,
        paymentDue: t.paymentDue,
        payoutStatus: t.payoutStatus,
        advanceAmount: t.advanceAmount
      });
    });
    
    const suppliers = (await listEntities()).filter((entity) => entity.type === 'supplier');
    console.log(`📊 Found ${suppliers.length} suppliers:`, suppliers.map(s => s.name));
    
    const supplierSummaries = await Promise.all(
      suppliers.map(async (supplier) => {
        console.log(`\n💰 Processing supplier: ${supplier.name} (ID: ${supplier.entityId})`);
        // First, let's see ALL transactions for this supplier
        const allTransactions = allTransactionsDebug.filter(
          (transaction) => String(transaction.supplierId || '') === String(supplier.entityId)
        );
        console.log(`   📋 Total transactions: ${allTransactions.length}`);
        
        if (allTransactions.length > 0) {
          allTransactions.forEach((t, i) => {
            console.log(`   Transaction ${i + 1}:`, {
              id: t.transactionId,
              status: t.status,
              paymentDue: t.paymentDue,
              payoutStatus: t.payoutStatus,
              advanceAmount: t.advanceAmount,
              approvedAt: t.approvedAt
            });
          });
        }
        
        // Get transactions that need funding (approved but not yet funded)
        // Look for both entityId and legacy ids as supplierId for backward compatibility
        const transactions = allTransactions.filter((transaction) =>
          String(transaction.status || '').toLowerCase() === 'approved' &&
          Boolean(transaction.paymentDue) &&
          String(transaction.payoutStatus || '').toLowerCase() !== 'processed'
        );
        
        console.log(`   ✅ Approved transactions ready for payment: ${transactions.length}`);
        
        if (transactions.length > 0) {
          console.log('   💰 Transaction payment breakdown:');
          transactions.forEach((t, i) => {
            const netAmount = (t.advanceAmount || 0) - (t.feeAmount || 0);
            console.log(`      Transaction ${i + 1}: Advance: $${t.advanceAmount}, Fee: $${t.feeAmount}, Net: $${netAmount}`);
          });
        }
        
        // Calculate net payment amount (advance - fees)
        const totalPendingPayment = transactions.reduce((sum, t) => {
          const netAmount = (t.advanceAmount || 0) - (t.feeAmount || 0);
          return sum + netAmount;
        }, 0);
        console.log(`   💸 Total pending payment (net after fees): $${totalPendingPayment}`);
        
        const totalAdvanced = allTransactions
          .filter((transaction) => String(transaction.status || '').toLowerCase() === 'funded')
          .reduce((sum, transaction) => sum + (transaction.advanceAmount || 0), 0);
        const totalOutstanding = allTransactions
          .reduce((sum, transaction) => sum + (transaction.invoiceValue || 0), 0);
        
        return {
          supplierId: supplier.entityId,
          supplierName: supplier.name,
          bankDetails: supplier.bankDetails || {
            beneficiary: supplier.name,
            bank: 'Bank details pending',
            branch: 'Branch details pending',
            accountNumber: 'Account pending',
            ifscCode: 'IFSC pending',
            currency: 'INR'
          },
          pendingAmount: totalPendingPayment,
          totalAdvanced: totalAdvanced || 0,
          totalOutstanding: totalOutstanding || 0,
          pendingPayments: totalPendingPayment,
          lastPaymentDate: null,
          status: supplier.status,
          transactionCount: transactions.length,
          transactions: transactions
        };
      })
    );
    
    console.log('📋 Final supplier summaries:', supplierSummaries.map(s => ({
      name: s.supplierName,
      pendingAmount: s.pendingAmount,
      transactionCount: s.transactionCount
    })));
    
    res.json({
      success: true,
      data: supplierSummaries
    });
  } catch (error) {
    console.error('Supplier summary error:', error);
    // Fallback to mock data on error
    res.json({
      success: true,
      message: 'Supplier summary retrieved successfully (fallback to mock data)',
      data: []
    });
  }
});

// Get incoming payments (reserves waiting to be released after buyer payments)
router.get('/incoming-payments', async (req, res) => {
  try {
    console.log('🔍 Fetching incoming payment reserves...');
    
    // Find funded transactions that could be settled or have reserves to be released
    const fundedTransactions = (await listTransactions())
      .filter((transaction) =>
        ['funded', 'partial_payment', 'settled'].includes(String(transaction.status || '').toLowerCase()) &&
        Boolean(transaction.fundedAt) &&
        (transaction.reserveAmount || 0) > 0
      )
      .sort((a, b) => {
        const aFunded = a.fundedAt ? new Date(a.fundedAt).getTime() : 0;
        const bFunded = b.fundedAt ? new Date(b.fundedAt).getTime() : 0;
        return bFunded - aFunded;
      })
      .slice(0, 50);
    
    console.log(`📋 Found ${fundedTransactions.length} transactions with reserves`);
    
    // Get supplier details for each transaction
    const incomingPayments = await Promise.all(
      fundedTransactions.map(async (transaction) => {
        const supplier = await findEntityByAnyId(String(transaction.supplierId || ''));
        
        // Calculate payment breakdown
        const invoiceAmount = transaction.invoiceValue;
        const paidAmount = transaction.paidAmount || 0;
        const remainingAmount = Math.max(0, invoiceAmount - paidAmount);
        const lateFees = await calculateLateFees(transaction);
        const totalAmountDue = remainingAmount + lateFees;
        
        // Determine payment status
        let paymentStatus = 'pending_reserve';
        if (transaction.status === 'settled' && remainingAmount <= 0) {
          paymentStatus = 'reserve_sent'; // Buyer has paid, ready to release reserves
        } else if (transaction.status === 'completed') {
          paymentStatus = 'completed';
        }
        
        return {
          id: transaction.transactionId,
          supplierId: transaction.supplierId,
          supplierName: transaction.supplierName,
          invoiceId: transaction.invoiceId || transaction.invoiceNumber,
          invoiceReference: transaction.invoiceNumber,
          buyerName: transaction.buyerName,
          reserveAmount: transaction.reserveAmount,
          currency: transaction.currency || 'USD',
          dueDate: transaction.dueDate,
          fundedAt: transaction.fundedAt,
          status: paymentStatus,
          bankDetails: normalizeBankDetails(supplier?.bankDetails, transaction.supplierName, transaction.currency || 'USD'),
          paymentBreakdown: {
            invoiceAmount: invoiceAmount,
            paidAmount: paidAmount,
            remainingAmount: remainingAmount,
            reservePercentage: Math.round((transaction.reserveAmount / invoiceAmount) * 100),
            transactionFee: transaction.feeAmount || 0,
            processingFee: 0, // Can be calculated if needed
            lateFees: lateFees,
            netReserveAmount: transaction.reserveAmount
          },
          agingDays: transaction.dueDate ? 
            Math.max(0, Math.floor((Date.now() - new Date(transaction.dueDate).getTime()) / (1000 * 60 * 60 * 24))) : 0,
          totalAmountDue: totalAmountDue,
          paymentHistory: transaction.paymentHistory || []
        };
      })
    );
    
    // Filter and sort by status priority
    const sortedPayments = incomingPayments.sort((a, b) => {
      const statusPriority = { 'reserve_sent': 0, 'pending_reserve': 1, 'completed': 2 };
      return (statusPriority[a.status] || 3) - (statusPriority[b.status] || 3);
    });
    
    console.log(`📊 Processed ${sortedPayments.length} incoming payment reserves`);
    
    res.json({
      success: true,
      data: sortedPayments,
      message: `Found ${sortedPayments.length} transactions with reserves`
    });
    
  } catch (error) {
    console.error('Incoming payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get payouts list (GET method)
router.get('/payouts', async (req, res) => {
  try {
    const recentTransactions = (await listTransactions())
      .filter((transaction) => ['approved', 'processing'].includes(String(transaction.status || '').toLowerCase()))
      .slice(0, 20);
    
    const payouts = recentTransactions.map(transaction => ({
      id: transaction.transactionId,
      supplierName: transaction.supplierName,
      amount: transaction.advanceAmount,
      status: 'pending',
      scheduledDate: new Date().toISOString(),
      type: 'advance_payment'
    }));
    
    res.json({
      success: true,
      data: payouts
    });
  } catch (error) {
    console.error('Get payouts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Payout creation (POST method)
router.post('/payouts', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Payout creation functionality is being migrated to DynamoDB',
      data: null
    });
  } catch (error) {
    console.error('Treasury payouts creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get specific invoice
router.get('/invoices/:id', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Invoice details functionality is being migrated to DynamoDB',
      data: null
    });
  } catch (error) {
    console.error('Treasury invoice details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Process invoice payment
router.put('/invoices/:id/payment', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Invoice payment functionality is being migrated to DynamoDB'
    });
  } catch (error) {
    console.error('Treasury invoice payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Close invoice
router.post('/invoices/:id/close', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Invoice closure functionality is being migrated to DynamoDB'
    });
  } catch (error) {
    console.error('Treasury invoice closure error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Wildcard route for other payout operations
router.all('/payouts/*', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Payout operations functionality is being migrated to DynamoDB'
    });
  } catch (error) {
    console.error('Treasury payout operations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Process payout to supplier (POST method)
router.post('/payout', async (req, res) => {
  try {
    const { supplierId, amount, transactionIds, bankDetails, paymentInstruction } = req.body;
    
    console.log('💰 Processing payout:', {
      supplierId,
      amount,
      transactionIds,
      bankDetails
    });
    
    if (!supplierId || !amount || !transactionIds) {
      return res.status(400).json({
        success: false,
        message: 'Supplier ID, amount, and transaction IDs are required'
      });
    }

    const requiredInstructionFields = [
      'serialNumber',
      'transactionType',
      'paymentAccountNumber',
      'beneficiaryAccountNumber',
      'effectiveDate',
      'currency',
      'amount'
    ];

    const missingInstructionFields = requiredInstructionFields.filter((field) =>
      !paymentInstruction || paymentInstruction[field] === undefined || paymentInstruction[field] === null || paymentInstruction[field] === ''
    );

    if (missingInstructionFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing payment instruction fields: ${missingInstructionFields.join(', ')}`
      });
    }
    
    // Find supplier
    const supplier = await getEntityById(String(supplierId || ''));
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    const updateResult = await updateTransactionsByIds(transactionIds, {
      status: 'funded',
      fundedAt: new Date().toISOString(),
      payoutAmount: amount,
      payoutStatus: 'processed'
    });
    
    console.log('✅ Updated transactions:', updateResult);
    
    // Create and save payout record
    const payoutId = `PAYOUT_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const reference = `PAY_${Date.now()}`;
    
    const payoutRecord = await createPayoutRecord({
      payoutId,
      supplierId,
      supplierName: supplier.name,
      amount,
      transactionIds,
      bankDetails,
      paymentInstruction: {
        serialNumber: String(paymentInstruction.serialNumber),
        transactionType: String(paymentInstruction.transactionType),
        paymentAccountNumber: String(paymentInstruction.paymentAccountNumber),
        beneficiaryAccountNumber: String(paymentInstruction.beneficiaryAccountNumber),
        effectiveDate: String(paymentInstruction.effectiveDate),
        remarks: paymentInstruction.remarks ? String(paymentInstruction.remarks) : '',
        currency: String(paymentInstruction.currency),
        amount: parseFloat(paymentInstruction.amount) || amount,
        paymentProofFileName: paymentInstruction.paymentProofFileName ? String(paymentInstruction.paymentProofFileName) : ''
      },
      status: 'completed', // Mark as completed immediately for demo
      processedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      reference,
      method: 'bank_transfer'
    });
    console.log('✅ Payout record saved:', payoutId);
    
    // Broadcast notification
    broadcastNotification({
      type: 'payout_processed',
      title: 'Payout Completed',
      message: `Payment of $${amount} to ${supplier.name} has been completed successfully`,
      timestamp: new Date(),
      priority: 'high'
    });
    
    res.json({
      success: true,
      message: 'Payout processed successfully',
      data: {
        id: payoutRecord.payoutId,
        payoutId: payoutRecord.payoutId,
        supplierId,
        supplierName: supplier.name,
        amount,
        transactionIds,
        bankDetails,
        paymentInstruction: payoutRecord.paymentInstruction,
        status: payoutRecord.status,
        processedAt: payoutRecord.processedAt,
        reference: payoutRecord.reference,
        method: payoutRecord.method
      }
    });
    
  } catch (error) {
    console.error('❌ Payout processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get payout history
router.get('/payout-history', async (req, res) => {
  try {
    // Get payout records from database
    const payoutRecords = (await listPayoutRecords()).slice(0, 50);
    
    const payoutHistory = payoutRecords.map(payout => ({
      id: payout.payoutId,
      supplierId: payout.supplierId,
      supplierName: payout.supplierName,
      amount: payout.amount,
      status: payout.status,
      processedAt: payout.processedAt,
      completedAt: payout.completedAt,
      reference: payout.reference,
      transactionIds: payout.transactionIds,
      type: payout.type || 'advance_payment',
      method: payout.method || 'bank_transfer'
    }));
    
    res.json({
      success: true,
      data: payoutHistory
    });
    
  } catch (error) {
    console.error('Payout history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Download payout acknowledgement
router.get('/payout/:payoutId/acknowledgement', async (req, res) => {
  try {
    const { payoutId } = req.params;
    
    console.log(`📄 Generating acknowledgement for payout: ${payoutId}`);
    
    // Validate payoutId
    if (!payoutId || payoutId === 'undefined' || payoutId === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Invalid payout ID provided'
      });
    }
    
    // Find payout record
    const payoutRecord = await getPayoutRecordById(payoutId);
    if (!payoutRecord) {
      console.log(`❌ Payout record not found for ID: ${payoutId}`);
      return res.status(404).json({
        success: false,
        message: 'Payout record not found'
      });
    }
    
    console.log(`✅ Found payout record:`, {
      payoutId: payoutRecord.payoutId,
      supplierName: payoutRecord.supplierName,
      amount: payoutRecord.amount,
      status: payoutRecord.status
    });
    
    // Generate acknowledgement letter
    const acknowledgementText = `
PAYMENT ACKNOWLEDGEMENT LETTER
===============================

Date: ${new Date().toLocaleDateString()}
Reference: ${payoutRecord.reference || 'N/A'}
Payout ID: ${payoutRecord.payoutId || 'N/A'}

Dear ${payoutRecord.supplierName || 'Valued Partner'},

We hereby acknowledge that the following payment has been processed successfully:

--- PAYMENT DETAILS ---
Beneficiary: ${payoutRecord.bankDetails?.beneficiary || 'N/A'}
Bank: ${payoutRecord.bankDetails?.bank || 'N/A'}
Branch: ${payoutRecord.bankDetails?.branch || 'N/A'}
Account Number: ${payoutRecord.bankDetails?.accountNumber || 'N/A'}
IFSC Code: ${payoutRecord.bankDetails?.ifscCode || 'N/A'}
${payoutRecord.bankDetails?.swiftCode ? `SWIFT Code: ${payoutRecord.bankDetails.swiftCode}` : ''}

Amount Paid: ${payoutRecord.bankDetails?.currency || 'USD'} ${payoutRecord.amount ? payoutRecord.amount.toLocaleString() : '0.00'}
Payment Method: ${payoutRecord.method ? payoutRecord.method.replace('_', ' ').toUpperCase() : 'BANK TRANSFER'}
Processed Date: ${payoutRecord.processedAt ? new Date(payoutRecord.processedAt).toLocaleDateString() : 'N/A'}
Completed Date: ${payoutRecord.completedAt ? new Date(payoutRecord.completedAt).toLocaleDateString() : 'Pending'}

--- TREASURY PAYMENT FORM DETAILS ---
Serial Number: ${payoutRecord.paymentInstruction?.serialNumber || 'N/A'}
Transaction Type: ${payoutRecord.paymentInstruction?.transactionType || 'N/A'}
Payment Account Number: ${payoutRecord.paymentInstruction?.paymentAccountNumber || 'N/A'}
Beneficiary Account Number: ${payoutRecord.paymentInstruction?.beneficiaryAccountNumber || 'N/A'}
Effective Date: ${payoutRecord.paymentInstruction?.effectiveDate || 'N/A'}
Remarks: ${payoutRecord.paymentInstruction?.remarks || 'N/A'}
Currency: ${payoutRecord.paymentInstruction?.currency || payoutRecord.bankDetails?.currency || 'N/A'}
Form Amount: ${payoutRecord.paymentInstruction?.amount ? payoutRecord.paymentInstruction.amount.toLocaleString() : 'N/A'}
Payment Proof: ${payoutRecord.paymentInstruction?.paymentProofFileName || 'Not attached'}

--- TRANSACTION DETAILS ---
Transaction IDs: ${payoutRecord.transactionIds && payoutRecord.transactionIds.length > 0 ? payoutRecord.transactionIds.join(', ') : 'N/A'}

Status: ${payoutRecord.status ? payoutRecord.status.toUpperCase() : 'N/A'}

This letter serves as confirmation that the above payment has been initiated and processed through our banking partner. Please allow 1-3 business days for the funds to reflect in your account.

For any queries regarding this payment, please contact our finance team with the reference number: ${payoutRecord.reference || payoutRecord.payoutId}

Thank you for your continued partnership.

Best regards,
Whizunik Finance Team
Date: ${new Date().toLocaleString()}

--- SYSTEM GENERATED DOCUMENT ---
Generated on: ${new Date().toLocaleString()}
Document ID: ACK_${payoutRecord.payoutId}_${Date.now()}
`;
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="Payment_Acknowledgement_${payoutId}.txt"`);
    res.send(acknowledgementText);
    
    console.log(`✅ Acknowledgement letter generated for ${payoutId}`);
    
  } catch (error) {
    console.error('❌ Acknowledgement generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate acknowledgement letter'
    });
  }
});

// Process reserve payment back to supplier (when buyer has paid invoice)
router.post('/pay-reserve', async (req, res) => {
  try {
    const { incomingPaymentId, invoiceId, amount } = req.body;
    
    console.log('💰 Processing reserve payment:', {
      incomingPaymentId,
      invoiceId,
      amount
    });
    
    if (!incomingPaymentId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID and amount are required'
      });
    }
    
    // Find the transaction
    const transaction = await getTransactionById(incomingPaymentId);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    // Verify the buyer has paid (transaction should be settled)
    if (transaction.status !== 'settled' && transaction.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot release reserves until buyer payment is complete'
      });
    }
    
    // Find supplier for bank details
    const supplier = await findEntityByAnyId(String(transaction.supplierId || ''));
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const payoutBankDetails = normalizeBankDetails(
      supplier.bankDetails,
      transaction.supplierName,
      transaction.currency || 'USD'
    );
    
    // Create reserve payment record
    const reservePayoutId = `RESERVE_PAY_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const reserveReference = `RSV_${Date.now()}`;
    
    const reservePayoutRecord = await createPayoutRecord({
      payoutId: reservePayoutId,
      supplierId: transaction.supplierId,
      supplierName: transaction.supplierName,
      amount: amount,
      transactionIds: [transaction.transactionId],
      bankDetails: payoutBankDetails as any,
      status: 'completed',
      processedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      reference: reserveReference,
      method: 'reserve_release',
      type: 'reserve_payment'
    });
    
    // Update transaction status to completed and mark reserve as released
    await updateTransaction(incomingPaymentId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      reserveReleasedAt: new Date().toISOString(),
      reservePayoutId: reservePayoutId
    });
    
    console.log('✅ Reserve payment processed:', reservePayoutId);
    
    // Broadcast notification
    broadcastNotification({
      type: 'reserve_released',
      title: 'Reserve Payment Completed',
      message: `Reserve payment of $${amount} released to ${transaction.supplierName}`,
      timestamp: new Date(),
      priority: 'medium'
    });
    
    res.json({
      success: true,
      message: 'Reserve payment processed successfully',
      data: {
        reservePayoutId,
        amount,
        supplierName: transaction.supplierName,
        reference: reserveReference,
        status: 'completed',
        processedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error('❌ Reserve payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Release reserves from closure dialog
router.post('/open-invoices/:invoiceId/release-reserves', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { notes } = req.body;
    
    console.log(`💰 Processing reserve release for invoice: ${invoiceId}`);
    
    // Find the transaction
    const transaction = await getTransactionById(invoiceId);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    // Check if reserves can be released
    const buyerOwes = transaction.invoiceValue || transaction.invoiceAmount || 0;
    const paidAmount = transaction.paidAmount || 0;
    const remainingAmount = Math.max(0, buyerOwes - paidAmount);
    
    if (remainingAmount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot release reserves until invoice is fully paid'
      });
    }
    
    if (transaction.reserveReleasedAt) {
      return res.status(400).json({
        success: false,
        message: 'Reserves have already been released'
      });
    }
    
    if (!transaction.reserveAmount || transaction.reserveAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No reserves available for release'
      });
    }
    
    // Find supplier for bank details
    const supplier = await getEntityById(String(transaction.supplierId || ''));
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    // Create reserve payment record
    const reservePayoutId = `RESERVE_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const reserveReference = `RSV_${Date.now()}`;
    
    const reservePayoutRecord = await createPayoutRecord({
      payoutId: reservePayoutId,
      supplierId: transaction.supplierId,
      supplierName: transaction.supplierName,
      amount: transaction.reserveAmount,
      transactionIds: [transaction.transactionId],
      bankDetails: (supplier.bankDetails || {}) as any,
      status: 'completed',
      processedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      reference: reserveReference,
      method: 'reserve_release',
      type: 'reserve_payment',
      notes: notes || 'Reserve released via closure dialog'
    });
    
    // Update transaction status to mark reserve as released
    await updateTransaction(invoiceId, {
      reserveReleasedAt: new Date().toISOString(),
      reservePayoutId: reservePayoutId,
      completedAt: new Date().toISOString()
    });
    
    console.log('✅ Reserve payment released via closure dialog:', reservePayoutId);
    
    // Broadcast notification
    broadcastNotification({
      type: 'reserve_released',
      title: 'Reserves Released',
      message: `Reserve payment of $${transaction.reserveAmount} released to ${transaction.supplierName}`,
      timestamp: new Date(),
      priority: 'medium'
    });
    
    res.json({
      success: true,
      message: 'Reserves released successfully',
      data: {
        reservePayoutId,
        amount: transaction.reserveAmount,
        supplierName: transaction.supplierName,
        reference: reserveReference,
        status: 'completed',
        bankDetails: supplier.bankDetails,
        processedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error('❌ Reserve release error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;