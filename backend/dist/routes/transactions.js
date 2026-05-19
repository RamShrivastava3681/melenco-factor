"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const multer_1 = __importDefault(require("multer"));
const index_1 = require("../index");
const schemas_1 = require("../models/schemas");
const s3_1 = require("../utils/s3");
const mockData_1 = require("../../mockData");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }
});
const parseLimitValue = (value) => {
    const parsed = typeof value === 'number' ? value : parseFloat(String(value ?? 0));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};
const resolveEntityIdentity = (entity) => {
    if (!entity) {
        return [];
    }
    return [entity._id, entity.id, entity.entityId]
        .filter(Boolean)
        .map((value) => String(value));
};
const getPairUtilizedAmount = async (buyerEntity, supplierEntity) => {
    const buyerIds = resolveEntityIdentity(buyerEntity);
    const supplierIds = resolveEntityIdentity(supplierEntity);
    if (!buyerIds.length || !supplierIds.length) {
        return 0;
    }
    const usage = await schemas_1.TransactionModel.aggregate([
        {
            $match: {
                buyerId: { $in: buyerIds },
                supplierId: { $in: supplierIds }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: { $ifNull: ['$invoiceAmount', '$invoiceValue'] } }
            }
        }
    ]);
    return parseLimitValue(usage?.[0]?.total || 0);
};
router.get('/', async (req, res) => {
    try {
        if (mongoose_1.default.connection.readyState !== 1) {
            console.warn('MongoDB not connected, using mock data');
            return res.json({
                success: true,
                message: 'Transactions retrieved successfully (mock data)',
                data: mockData_1.mockTransactions
            });
        }
        const transactions = await schemas_1.TransactionModel.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            message: 'Transactions retrieved successfully',
            data: transactions
        });
    }
    catch (error) {
        console.error('Get transactions error:', error);
        res.json({
            success: true,
            message: 'Transactions retrieved successfully (fallback to mock data)',
            data: mockData_1.mockTransactions
        });
    }
});
router.get('/recent', async (req, res) => {
    try {
        const recentTransactions = await schemas_1.TransactionModel.find()
            .sort({ createdAt: -1 })
            .limit(10);
        res.json({
            success: true,
            data: recentTransactions
        });
    }
    catch (error) {
        console.error('Get recent transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
const calculateDueDate = (invoiceDate, blDate, tenureDays, useInvoiceDate = true, useBLDate = false) => {
    let baseDate;
    if (useBLDate && blDate) {
        baseDate = blDate;
    }
    else if (useInvoiceDate && invoiceDate) {
        baseDate = invoiceDate;
    }
    else {
        baseDate = invoiceDate || blDate;
    }
    if (!baseDate || !tenureDays || tenureDays <= 0) {
        console.log('Cannot calculate due date: missing base date or invalid tenure days');
        return '';
    }
    const baseDateObj = new Date(baseDate);
    const dueDate = new Date(baseDateObj);
    dueDate.setDate(dueDate.getDate() + tenureDays);
    const isoString = dueDate.toISOString();
    const datePart = isoString.substring(0, 10);
    console.log(`Calculated due date: ${datePart} (base date: ${baseDate} + ${tenureDays} tenure days)`);
    return datePart;
};
router.post('/', upload.array('supportingDocuments', 20), async (req, res) => {
    try {
        const transactionData = typeof req.body.payload === 'string'
            ? JSON.parse(req.body.payload)
            : req.body;
        console.log('=== TRANSACTION CREATION DEBUG ===');
        console.log('Received transaction data:', JSON.stringify(transactionData, null, 2));
        let calculatedDueDate = transactionData.dueDate;
        if (transactionData.tenureDays && (transactionData.invoiceDate || transactionData.blDate)) {
            calculatedDueDate = calculateDueDate(transactionData.invoiceDate, transactionData.blDate, parseInt(transactionData.tenureDays), transactionData.useInvoiceDateForCalculation !== false, transactionData.useBLDateForCalculation === true);
            if (calculatedDueDate) {
                console.log(`Due date calculated from tenure: ${calculatedDueDate}`);
            }
            else {
                console.log('Failed to calculate due date from tenure, using provided due date');
                calculatedDueDate = transactionData.dueDate;
            }
        }
        const invoiceAmount = parseFloat(transactionData.invoiceAmount) || 0;
        const advanceAmount = parseFloat(transactionData.advanceAmount) || 0;
        const feeAmount = parseFloat(transactionData.feeAmount) || 0;
        const netAmount = advanceAmount - feeAmount;
        const timestamp = Date.now();
        const transactionId = `TXN-${timestamp.toString().slice(-6)}`;
        const invoiceId = `INV-${timestamp.toString().slice(-6)}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
        const uploadedFiles = req.files || [];
        const supportingDocumentKeys = [];
        const supportingDocumentNames = [];
        for (const file of uploadedFiles) {
            const uploaded = await (0, s3_1.uploadDocumentToS3)({
                folder: `transactions/${transactionId}`,
                fileName: file.originalname,
                contentType: file.mimetype || 'application/octet-stream',
                body: file.buffer
            });
            supportingDocumentKeys.push(uploaded.key);
            supportingDocumentNames.push(file.originalname);
        }
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
        const missingFields = Object.entries(requiredFields).filter(([key, value]) => value === undefined || value === null || value === '');
        if (missingFields.length > 0) {
            console.error('Missing required fields:', missingFields);
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                missingFields: missingFields.map(([key]) => key)
            });
        }
        const supplierEntity = await schemas_1.EntityModel.findOne({
            $or: [
                { entityId: transactionData.supplierId },
                { _id: mongoose_1.default.Types.ObjectId.isValid(transactionData.supplierId) ? transactionData.supplierId : null }
            ]
        });
        const buyerEntity = await schemas_1.EntityModel.findOne({
            $or: [
                { entityId: transactionData.buyerId },
                { _id: mongoose_1.default.Types.ObjectId.isValid(transactionData.buyerId) ? transactionData.buyerId : null }
            ]
        });
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
        const supplierLimit = parseLimitValue(supplierEntity?.totalLimitSanctioned ?? supplierEntity?.creditLimit ?? 0);
        const supplierIds = resolveEntityIdentity(supplierEntity);
        const buyerSupplierLimit = (buyerEntity?.supplierLimits || []).find((limit) => {
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
        const newTransaction = new schemas_1.TransactionModel({
            transactionId,
            invoiceId,
            ...transactionData,
            ...requiredFields,
            supportingDocuments: supportingDocumentKeys,
            supportingDocumentNames,
            dueDate: calculatedDueDate,
            status: transactionData.status || 'pending',
            currency: requestedCurrency,
            transactionType: transactionData.transactionType || 'factoring'
        });
        console.log('Transaction document to save:', JSON.stringify(newTransaction.toObject(), null, 2));
        const savedTransaction = await newTransaction.save();
        console.log(`✅ Transaction saved to MongoDB: ${savedTransaction.transactionId}, Invoice ID: ${savedTransaction.invoiceId}`);
        const supplierNewUsed = supplierUsed + invoiceAmount;
        const supplierNewAvailable = Math.max(0, supplierLimit - supplierNewUsed);
        await schemas_1.EntityModel.updateOne({ _id: supplierEntity._id }, {
            $set: {
                usedLimit: supplierNewUsed,
                utilizedLimit: supplierNewUsed,
                availableLimit: supplierNewAvailable
            }
        });
        const buyerNewUsed = buyerGlobalUsed + invoiceAmount;
        const buyerNewAvailable = Math.max(0, buyerGlobalLimit - buyerNewUsed);
        await schemas_1.EntityModel.updateOne({ _id: buyerEntity._id }, {
            $set: {
                usedCredit: buyerNewUsed,
                utilizedLimit: buyerNewUsed,
                availableLimit: buyerNewAvailable
            }
        });
        (0, index_1.broadcastNotification)({
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
    catch (error) {
        console.error('❌ Create transaction error:', error);
        console.error('Error details:', {
            name: error?.name,
            message: error?.message,
            stack: error?.stack
        });
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
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Delete transaction request:', { id });
        if (mongoose_1.default.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                message: 'Database not connected - cannot delete transaction'
            });
        }
        const transactionToDelete = await schemas_1.TransactionModel.findOne({
            $or: [
                { transactionId: id },
                { _id: mongoose_1.default.Types.ObjectId.isValid(id) ? id : null }
            ]
        });
        if (!transactionToDelete) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }
        const deletedTransaction = await schemas_1.TransactionModel.findByIdAndDelete(transactionToDelete._id);
        if (!deletedTransaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }
        const utilizedAmount = parseLimitValue(deletedTransaction?.invoiceAmount ?? deletedTransaction?.invoiceValue ?? 0);
        const supplierEntity = await schemas_1.EntityModel.findOne({
            $or: [
                { entityId: transactionToDelete.supplierId },
                { _id: mongoose_1.default.Types.ObjectId.isValid(String(transactionToDelete.supplierId)) ? transactionToDelete.supplierId : null }
            ]
        });
        const buyerEntity = await schemas_1.EntityModel.findOne({
            $or: [
                { entityId: transactionToDelete.buyerId },
                { _id: mongoose_1.default.Types.ObjectId.isValid(String(transactionToDelete.buyerId)) ? transactionToDelete.buyerId : null }
            ]
        });
        if (supplierEntity && utilizedAmount > 0) {
            const supplierLimit = parseLimitValue(supplierEntity.totalLimitSanctioned ?? supplierEntity.creditLimit ?? 0);
            const supplierUsed = parseLimitValue(supplierEntity.usedLimit ?? 0);
            const supplierNewUsed = Math.max(0, supplierUsed - utilizedAmount);
            const supplierNewAvailable = Math.max(0, supplierLimit - supplierNewUsed);
            await schemas_1.EntityModel.updateOne({ _id: supplierEntity._id }, {
                $set: {
                    usedLimit: supplierNewUsed,
                    utilizedLimit: supplierNewUsed,
                    availableLimit: supplierNewAvailable
                }
            });
        }
        if (buyerEntity && utilizedAmount > 0) {
            const buyerLimit = parseLimitValue(buyerEntity.creditLimit ?? 0);
            const buyerUsed = parseLimitValue(buyerEntity.usedCredit ?? 0);
            const buyerNewUsed = Math.max(0, buyerUsed - utilizedAmount);
            const buyerNewAvailable = Math.max(0, buyerLimit - buyerNewUsed);
            await schemas_1.EntityModel.updateOne({ _id: buyerEntity._id }, {
                $set: {
                    usedCredit: buyerNewUsed,
                    utilizedLimit: buyerNewUsed,
                    availableLimit: buyerNewAvailable
                }
            });
        }
        console.log('✅ Transaction deleted successfully:', {
            id: transactionToDelete._id,
            transactionId: transactionToDelete.transactionId
        });
        (0, index_1.broadcastNotification)({
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
                id: transactionToDelete._id,
                transactionId: transactionToDelete.transactionId
            }
        });
    }
    catch (error) {
        console.error('❌ Delete transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : 'Something went wrong'
        });
    }
});
exports.default = router;
//# sourceMappingURL=transactions.js.map