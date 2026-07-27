import express from 'express';
import multer from 'multer';
import { broadcastNotification } from '../index';
import { ITransaction } from '../models/schemas';
import { uploadDocumentToS3 } from '../utils/s3';
import {
  createTransaction,
  deleteTransaction,
  getEntityById,
  getTransactionById,
  listTransactions,
  updateEntity
} from '../data/dynamoRepository';
import { isDynamoConfigured } from '../data/dynamoClient';


const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
});

const parseLimitValue = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : parseFloat(String(value ?? 0));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const resolveEntityIdentity = (entity: any): string[] => {
  if (!entity) {
    return [];
  }

  return [entity.entityId, entity.id]
    .filter(Boolean)
    .map((value) => String(value));
};

const getPairUtilizedAmount = async (buyerEntity: any, supplierEntity: any): Promise<number> => {
  const buyerIds = resolveEntityIdentity(buyerEntity);
  const supplierIds = resolveEntityIdentity(supplierEntity);

  if (!buyerIds.length || !supplierIds.length) {
    return 0;
  }

  const transactions = await listTransactions();
  const total = transactions
    .filter((transaction) => buyerIds.includes(String(transaction.buyerId)) && supplierIds.includes(String(transaction.supplierId)))
    .reduce((sum, transaction) => {
      const amount = transaction.invoiceAmount ?? transaction.invoiceValue ?? 0;
      return sum + parseLimitValue(amount);
    }, 0);

  return parseLimitValue(total);
};

// Get all transactions - now returns stored transactions
router.get('/', async (req, res) => {
  try {
    if (!isDynamoConfigured()) {
      console.warn('DynamoDB not configured, returning empty transactions list');
      return res.json({
        success: true,
        message: 'Transactions retrieved successfully',
        data: []
      });
    }

    const transactions = await listTransactions();
    res.json({
      success: true,
      message: 'Transactions retrieved successfully',
      data: transactions
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.json({
      success: true,
      message: 'Transactions retrieved successfully',
      data: []
    });
  }
});

// Get recent transactions for dashboard
router.get('/recent', async (req, res) => {
  try {
    // Return recent transactions from database
    const recentTransactions = (await listTransactions()).slice(0, 10);

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
router.post('/', upload.array('supportingDocuments', 20), async (req, res) => {
  try {
    const transactionData = typeof req.body.payload === 'string'
      ? JSON.parse(req.body.payload)
      : req.body;
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

    const uploadedFiles = (req.files as Express.Multer.File[] | undefined) || [];
    const supportingDocumentKeys: string[] = [];
    const supportingDocumentNames: string[] = [];

    for (const file of uploadedFiles) {
      const uploaded = await uploadDocumentToS3({
        folder: `transactions/${transactionId}`,
        fileName: file.originalname,
        contentType: file.mimetype || 'application/octet-stream',
        body: file.buffer
      });
      supportingDocumentKeys.push(uploaded.key);
      supportingDocumentNames.push(file.originalname);
    }
    
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
    const missingFields = Object.entries(requiredFields).filter(([key, value]) => {
      // If it's a receivable invoice, standard invoiceNumber and invoiceDate are not strictly required here
      // since we use the buyer/supplier specific fields
      if (transactionData.isReceivableInvoice && (key === 'invoiceNumber' || key === 'invoiceDate')) {
        return false;
      }
      return value === undefined || value === null || value === '';
    });
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields: missingFields.map(([key]) => key)
      });
    }

    const supplierEntity = await getEntityById(String(transactionData.supplierId || ''));
    const buyerEntity = await getEntityById(String(transactionData.buyerId || ''));

    if (!supplierEntity || !buyerEntity) {
      return res.status(400).json({
        success: false,
        message: 'Supplier or buyer entity not found.'
      });
    }

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

    const supplierLimit = parseLimitValue(
      supplierEntity?.totalLimitSanctioned ?? supplierEntity?.creditLimit ?? 0
    );

    const supplierIds = resolveEntityIdentity(supplierEntity);
    const buyerSupplierLimit = (buyerEntity?.supplierLimits || []).find((limit: any) => {
      const configuredSupplierId = String(limit?.supplierId || '');
      return configuredSupplierId && supplierIds.includes(configuredSupplierId);
    });

    const buyerLimit = buyerSupplierLimit
      ? parseLimitValue(buyerSupplierLimit.transactionLimit)
      : parseLimitValue(buyerEntity?.creditLimit ?? 0);

    const supplierUsed = parseLimitValue(supplierEntity?.usedLimit ?? 0);
    const supplierAvailable = Math.max(0, supplierLimit - supplierUsed);

    const buyerGlobalLimit = parseLimitValue(buyerEntity?.creditLimit ?? 0);
    const buyerGlobalUsed = parseLimitValue(buyerEntity?.usedCredit ?? 0);
    const buyerGlobalAvailable = Math.max(0, buyerGlobalLimit - buyerGlobalUsed);

    const buyerSupplierUsed = buyerSupplierLimit
      ? await getPairUtilizedAmount(buyerEntity, supplierEntity)
      : buyerGlobalUsed;
    const buyerAvailable = Math.max(0, buyerLimit - buyerSupplierUsed);

    if (invoiceAmount > supplierLimit) {
      return res.status(400).json({
        success: false,
        message: `Invoice amount (${invoiceAmount}) cannot exceed supplier limit (${supplierLimit}).`
      });
    }

    if (invoiceAmount > supplierAvailable) {
      return res.status(400).json({
        success: false,
        message: `Invoice amount (${invoiceAmount}) exceeds supplier available limit (${supplierAvailable}).`
      });
    }

    if (invoiceAmount > buyerLimit) {
      return res.status(400).json({
        success: false,
        message: `Invoice amount (${invoiceAmount}) cannot exceed buyer limit (${buyerLimit}).`
      });
    }

    if (invoiceAmount > buyerAvailable) {
      return res.status(400).json({
        success: false,
        message: `Invoice amount (${invoiceAmount}) exceeds buyer available limit (${buyerAvailable}).`
      });
    }

    if (invoiceAmount > buyerGlobalAvailable) {
      return res.status(400).json({
        success: false,
        message: `Invoice amount (${invoiceAmount}) exceeds buyer remaining total credit (${buyerGlobalAvailable}).`
      });
    }
    
    // Update real entity limits
    const supplierNewUsed = supplierUsed + invoiceAmount;
    const supplierNewAvailable = Math.max(0, supplierLimit - supplierNewUsed);
    await updateEntity(supplierEntity.entityId, {
      usedLimit: supplierNewUsed,
      utilizedLimit: supplierNewUsed,
      availableLimit: supplierNewAvailable
    });

    const buyerNewUsed = buyerGlobalUsed + invoiceAmount;
    const buyerNewAvailable = Math.max(0, buyerGlobalLimit - buyerNewUsed);
    await updateEntity(buyerEntity.entityId, {
      usedCredit: buyerNewUsed,
      utilizedLimit: buyerNewUsed,
      availableLimit: buyerNewAvailable
    });
    
    const isReceivableInvoice = Boolean(transactionData.isReceivableInvoice);

    const baseTransaction: ITransaction = {
      transactionId,
      invoiceId,
      ...transactionData,
      dueDate: calculatedDueDate,
      invoiceValue: invoiceAmount,
      invoiceAmount: invoiceAmount,
      advanceRate: parseFloat(transactionData.advancePercentage) || 80,
      advanceAmount: advanceAmount,
      feeAmount: feeAmount,
      reserveAmount: parseFloat(transactionData.reserveAmount) || 0,
      netAmount: netAmount,
      status: 'pending', // Default status
      supportingDocuments: supportingDocumentKeys,
      supportingDocumentNames: supportingDocumentNames,
      currency: requestedCurrency,
      isReceivableInvoice: isReceivableInvoice,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isReceivableInvoice) {
      // Create two transactions: one for buyer, one for supplier
      const buyerTransaction: ITransaction = {
        ...baseTransaction,
        transactionId: `TXN-B-${timestamp.toString().slice(-6)}`,
        invoiceId: `INV-B-${timestamp.toString().slice(-6)}`,
        invoiceNumber: baseTransaction.buyerInvoice?.number || baseTransaction.invoiceNumber,
        invoiceDate: baseTransaction.buyerInvoice?.date || baseTransaction.invoiceDate,
        blDate: baseTransaction.buyerInvoice?.blDate || baseTransaction.blDate || '',
        invoiceAmount: parseFloat(baseTransaction.buyerInvoice?.amount as string) || invoiceAmount,
        dueDate: baseTransaction.buyerInvoice?.dueDate || baseTransaction.dueDate || '',
        status: 'monitoring', // Buyer transaction goes directly to monitoring
        relatedTransactionId: `TXN-S-${timestamp.toString().slice(-6)}` // Link to supplier transaction
      };

      const supplierTransaction: ITransaction = {
        ...baseTransaction,
        transactionId: `TXN-S-${timestamp.toString().slice(-6)}`,
        invoiceId: `INV-S-${timestamp.toString().slice(-6)}`,
        invoiceNumber: baseTransaction.supplierInvoice?.number || baseTransaction.invoiceNumber,
        invoiceDate: baseTransaction.supplierInvoice?.date || baseTransaction.invoiceDate,
        blDate: baseTransaction.supplierInvoice?.blDate || baseTransaction.blDate || '',
        invoiceAmount: parseFloat(baseTransaction.supplierInvoice?.amount as string) || invoiceAmount,
        dueDate: baseTransaction.supplierInvoice?.dueDate || baseTransaction.dueDate || '',
        status: 'pending', // Supplier transaction goes to treasury for funding
        relatedTransactionId: `TXN-B-${timestamp.toString().slice(-6)}` // Link to buyer transaction
      };

      const [savedBuyerTransaction, savedSupplierTransaction] = await Promise.all([
        createTransaction(buyerTransaction),
        createTransaction(supplierTransaction)
      ]);

      console.log(`✅ Receivable-side transactions saved to DynamoDB: Buyer-${savedBuyerTransaction.transactionId}, Supplier-${savedSupplierTransaction.transactionId}`);
      
      // Update entity limits based on the full invoice amount
      const supplierNewUsed = supplierUsed + invoiceAmount;
      const supplierNewAvailable = Math.max(0, supplierLimit - supplierNewUsed);
      await updateEntity(supplierEntity.entityId, {
        usedLimit: supplierNewUsed,
        utilizedLimit: supplierNewUsed,
        availableLimit: supplierNewAvailable
      });

      const buyerNewUsed = buyerGlobalUsed + invoiceAmount;
      const buyerNewAvailable = Math.max(0, buyerGlobalLimit - buyerNewUsed);
      await updateEntity(buyerEntity.entityId, {
        usedCredit: buyerNewUsed,
        utilizedLimit: buyerNewUsed,
        availableLimit: buyerNewAvailable
      });

      // Send notifications for both transactions
      broadcastNotification({
        id: Date.now().toString() + '-B',
        title: 'New Buyer Transaction Created',
        message: `Transaction ${savedBuyerTransaction.transactionId} is now being monitored.`,
        type: 'success',
        timestamp: new Date().toISOString(),
        actionUrl: '/transactions'
      });

      broadcastNotification({
        id: Date.now().toString() + '-S',
        title: 'New Supplier Transaction Created',
        message: `Transaction ${savedSupplierTransaction.transactionId} is pending funding.`,
        type: 'info',
        timestamp: new Date().toISOString(),
        actionUrl: '/treasury'
      });

      res.status(201).json({
        success: true,
        message: 'Receivable-side transactions created successfully',
        data: {
          buyerTransaction: savedBuyerTransaction,
          supplierTransaction: savedSupplierTransaction
        }
      });

    } else {
      // Standard single transaction creation
      const savedTransaction = await createTransaction(baseTransaction);
      console.log(`✅ Transaction saved to DynamoDB: ${savedTransaction.transactionId}, Invoice ID: ${savedTransaction.invoiceId}`);

      const supplierNewUsed = supplierUsed + invoiceAmount;
      const supplierNewAvailable = Math.max(0, supplierLimit - supplierNewUsed);
      await updateEntity(supplierEntity.entityId, {
        usedLimit: supplierNewUsed,
        utilizedLimit: supplierNewUsed,
        availableLimit: supplierNewAvailable
      });

      const buyerNewUsed = buyerGlobalUsed + invoiceAmount;
      const buyerNewAvailable = Math.max(0, buyerGlobalLimit - buyerNewUsed);
      await updateEntity(buyerEntity.entityId, {
        usedCredit: buyerNewUsed,
        utilizedLimit: buyerNewUsed,
        availableLimit: buyerNewAvailable
      });

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
    }
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
    
    const transactionToDelete = await getTransactionById(id);

    if (!transactionToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    const deletedTransaction = await deleteTransaction(transactionToDelete.transactionId);

    if (!deletedTransaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    const utilizedAmount = parseLimitValue(deletedTransaction?.invoiceAmount ?? deletedTransaction?.invoiceValue ?? 0);

    const supplierEntity = await getEntityById(String(transactionToDelete.supplierId || ''));
    const buyerEntity = await getEntityById(String(transactionToDelete.buyerId || ''));

    if (supplierEntity && utilizedAmount > 0) {
      const supplierLimit = parseLimitValue(supplierEntity.totalLimitSanctioned ?? supplierEntity.creditLimit ?? 0);
      const supplierUsed = parseLimitValue(supplierEntity.usedLimit ?? 0);
      const supplierNewUsed = Math.max(0, supplierUsed - utilizedAmount);
      const supplierNewAvailable = Math.max(0, supplierLimit - supplierNewUsed);

      await updateEntity(supplierEntity.entityId, {
        usedLimit: supplierNewUsed,
        utilizedLimit: supplierNewUsed,
        availableLimit: supplierNewAvailable
      });
    }

    if (buyerEntity && utilizedAmount > 0) {
      const buyerLimit = parseLimitValue(buyerEntity.creditLimit ?? 0);
      const buyerUsed = parseLimitValue(buyerEntity.usedCredit ?? 0);
      const buyerNewUsed = Math.max(0, buyerUsed - utilizedAmount);
      const buyerNewAvailable = Math.max(0, buyerLimit - buyerNewUsed);

      await updateEntity(buyerEntity.entityId, {
        usedCredit: buyerNewUsed,
        utilizedLimit: buyerNewUsed,
        availableLimit: buyerNewAvailable
      });
    }
    
    console.log('✅ Transaction deleted successfully:', {
      id: transactionToDelete.transactionId,
      transactionId: transactionToDelete.transactionId
    });
    
    // Broadcast notification about transaction deletion
    broadcastNotification({
      type: 'transaction_deleted',
      title: 'Transaction Deleted',
      message: `Transaction ${transactionToDelete.transactionId} has been deleted`,
      timestamp: new Date(),
      priority: 'normal'
    });
    
    res.json({
      success: true,
      message: 'Transaction deleted successfully',
      data: {
        id: transactionToDelete.transactionId,
        transactionId: transactionToDelete.transactionId
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