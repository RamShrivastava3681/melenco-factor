import express from 'express';
import mongoose from 'mongoose';
import { broadcastNotification } from '../index';
import { TransactionModel, ITransaction, EntityModel } from '../models/schemas';

// Mock data as fallback
import { mockTransactions } from '../../mockData';

const router = express.Router();

// Get all transactions - now returns stored transactions
router.get('/', async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.warn('MongoDB not connected, using mock data');
      return res.json({
        success: true,
        message: 'Transactions retrieved successfully (mock data)',
        data: mockTransactions
      });
    }

    const transactions = await TransactionModel.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      message: 'Transactions retrieved successfully',
      data: transactions
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    // Fallback to mock data on error
    res.json({
      success: true,
      message: 'Transactions retrieved successfully (fallback to mock data)',
      data: mockTransactions
    });
  }
});

// Get recent transactions for dashboard
router.get('/recent', async (req, res) => {
  try {
    // Return recent transactions from database
    const recentTransactions = await TransactionModel.find()
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: recentTransactions
    });
  } catch (error) {
    console.error('Get recent transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper function to calculate due date based on financing tenure + BL or invoice date
const calculateDueDate = (invoiceDate: string, blDate: string, tenureDays: number, useInvoiceDate: boolean = true, useBLDate: boolean = false): string => {
  // Determine base date for calculation (prefer BL date if specified, otherwise invoice date)
  let baseDate: string | undefined;
  if (useBLDate && blDate) {
    baseDate = blDate;
  } else if (useInvoiceDate && invoiceDate) {
    baseDate = invoiceDate;
  } else {
    // Fallback: prefer invoice date, then BL date
    baseDate = invoiceDate || blDate;
  }

  if (!baseDate || !tenureDays || tenureDays <= 0) {
    console.log('Cannot calculate due date: missing base date or invalid tenure days');
    return '';
  }

  // Calculate due date = base date + financing tenure
  const baseDateObj = new Date(baseDate);
  const dueDate = new Date(baseDateObj);
  dueDate.setDate(dueDate.getDate() + tenureDays);

  const isoString = dueDate.toISOString();
  const datePart = isoString.substring(0, 10); // Get first 10 characters (YYYY-MM-DD)
  console.log(`Calculated due date: ${datePart} (base date: ${baseDate} + ${tenureDays} tenure days)`);
  
  return datePart;
};

// Create new transaction (maintains demo data)
router.post('/', async (req, res) => {
  try {
    const transactionData = req.body;
    console.log('=== TRANSACTION CREATION DEBUG ===');
    console.log('Received transaction data:', JSON.stringify(transactionData, null, 2));
    
    // Calculate due date based on financing tenure + BL or invoice date
    let calculatedDueDate = transactionData.dueDate;
    
    if (transactionData.tenureDays && (transactionData.invoiceDate || transactionData.blDate)) {
      calculatedDueDate = calculateDueDate(
        transactionData.invoiceDate,
        transactionData.blDate,
        parseInt(transactionData.tenureDays),
        transactionData.useInvoiceDateForCalculation !== false, // default to true
        transactionData.useBLDateForCalculation === true // default to false
      );
      
      if (calculatedDueDate) {
        console.log(`Due date calculated from tenure: ${calculatedDueDate}`);
      } else {
        console.log('Failed to calculate due date from tenure, using provided due date');
        calculatedDueDate = transactionData.dueDate;
      }
    }
    
    // Calculate net amount (advance amount - fees)
    const invoiceAmount = parseFloat(transactionData.invoiceAmount) || 0;
    const advanceAmount = parseFloat(transactionData.advanceAmount) || 0;
    const feeAmount = parseFloat(transactionData.feeAmount) || 0;
    const netAmount = advanceAmount - feeAmount;
    
    // Generate unique IDs
    const timestamp = Date.now();
    const transactionId = `TXN-${timestamp.toString().slice(-6)}`;
    const invoiceId = `INV-${timestamp.toString().slice(-6)}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
    
    // Ensure required fields are present
    const requiredFields = {
      supplierId: transactionData.supplierId,
      supplierName: transactionData.supplierName,
      buyerId: transactionData.buyerId,
      buyerName: transactionData.buyerName,
      invoiceNumber: transactionData.invoiceNumber,
      invoiceDate: transactionData.invoiceDate,
      buyerEmail: transactionData.buyerEmail,
      invoiceValue: invoiceAmount,
      invoiceAmount: invoiceAmount,
      advanceRate: parseFloat(transactionData.advancePercentage) || 80,
      advanceAmount: advanceAmount,
      feeAmount: feeAmount,
      reserveAmount: parseFloat(transactionData.reserveAmount) || 0,
      netAmount: netAmount
    };
    
    console.log('Required fields check:', requiredFields);

    const allowedCurrencies = ['USD', 'EUR', 'GBP'];
    const requestedCurrency = String(transactionData.currency || 'USD').toUpperCase();
    if (!allowedCurrencies.includes(requestedCurrency)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction currency. Allowed values are USD, EUR, GBP.'
      });
    }
    
    // Check for missing required fields
    const missingFields = Object.entries(requiredFields).filter(([key, value]) => 
      value === undefined || value === null || value === ''
    );
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields: missingFields.map(([key]) => key)
      });
    }

    const supplierEntity = await EntityModel.findOne({
      $or: [
        { entityId: transactionData.supplierId },
        { _id: mongoose.Types.ObjectId.isValid(transactionData.supplierId) ? transactionData.supplierId : null }
      ]
    });

    const buyerEntity = await EntityModel.findOne({
      $or: [
        { entityId: transactionData.buyerId },
        { _id: mongoose.Types.ObjectId.isValid(transactionData.buyerId) ? transactionData.buyerId : null }
      ]
    });

    const supplierCurrency = String(supplierEntity?.currency || supplierEntity?.bankDetails?.currency || 'USD').toUpperCase();
    const buyerCurrency = String(buyerEntity?.currency || buyerEntity?.bankDetails?.currency || 'USD').toUpperCase();

    if (supplierCurrency !== buyerCurrency) {
      return res.status(400).json({
        success: false,
        message: `Supplier (${supplierCurrency}) and buyer (${buyerCurrency}) currencies must match.`
      });
    }

    if (requestedCurrency !== supplierCurrency) {
      return res.status(400).json({
        success: false,
        message: `Transaction currency (${requestedCurrency}) must match supplier/buyer currency (${supplierCurrency}).`
      });
    }
    
    // Create new transaction document
    const newTransaction = new TransactionModel({
      transactionId,
      invoiceId,
      ...transactionData,
      ...requiredFields,
      dueDate: calculatedDueDate,
      status: transactionData.status || 'pending',
      currency: requestedCurrency,
      transactionType: transactionData.transactionType || 'factoring'
    });
    
    console.log('Transaction document to save:', JSON.stringify(newTransaction.toObject(), null, 2));

    // Save to MongoDB
    const savedTransaction = await newTransaction.save();
    console.log(`✅ Transaction saved to MongoDB: ${savedTransaction.transactionId}, Invoice ID: ${savedTransaction.invoiceId}`);

    // Send real-time notification
    broadcastNotification({
      id: Date.now().toString(),
      title: 'New Transaction Created',
      message: `Transaction ${savedTransaction.transactionId} has been created for ${savedTransaction.supplierName}`,
      type: 'success',
      timestamp: new Date().toISOString(),
      actionUrl: '/transactions'
    });

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: savedTransaction
    });
  } catch (error: any) {
    console.error('❌ Create transaction error:', error);
    console.error('Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    });
    
    // Check if it's a validation error
    if (error?.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors || {}).map(key => ({
        field: key,
        message: error.errors[key]?.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error?.message : 'Something went wrong'
    });
  }
});

// Delete transaction
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ Delete transaction request:', { id });
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database not connected - cannot delete transaction'
      });
    }
    
    // Find and delete the transaction
    const deletedTransaction = await TransactionModel.findOneAndDelete({
      $or: [
        { transactionId: id },
        { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }
      ]
    });
    
    if (!deletedTransaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    console.log('✅ Transaction deleted successfully:', {
      id: deletedTransaction._id,
      transactionId: deletedTransaction.transactionId
    });
    
    // Broadcast notification about transaction deletion
    broadcastNotification({
      type: 'transaction_deleted',
      title: 'Transaction Deleted',
      message: `Transaction ${deletedTransaction.transactionId} has been deleted`,
      timestamp: new Date(),
      priority: 'normal'
    });
    
    res.json({
      success: true,
      message: 'Transaction deleted successfully',
      data: {
        id: deletedTransaction._id,
        transactionId: deletedTransaction.transactionId
      }
    });
  } catch (error: any) {
    console.error('❌ Delete transaction error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error?.message : 'Something went wrong'
    });
  }
});

export default router;