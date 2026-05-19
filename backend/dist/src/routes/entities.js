"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const index_1 = require("../index");
const s3_1 = require("../utils/s3");
const dynamoRepository_1 = require("../data/dynamoRepository");
const dynamoClient_1 = require("../data/dynamoClient");
const mockData_1 = require("../../mockData");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }
});
const mockEntities = [...mockData_1.mockBuyers, ...mockData_1.mockSuppliers];
router.get('/', async (req, res) => {
    try {
        if (!(0, dynamoClient_1.isDynamoConfigured)()) {
            console.warn('DynamoDB not configured, using mock data');
            return res.json({
                success: true,
                message: 'Entities retrieved successfully (mock data)',
                data: mockEntities
            });
        }
        const entities = await (0, dynamoRepository_1.listEntities)();
        res.json({
            success: true,
            message: 'Entities retrieved successfully',
            data: entities
        });
    }
    catch (error) {
        console.error('Get entities error:', error);
        res.json({
            success: true,
            message: 'Entities retrieved successfully (fallback to mock data)',
            data: mockEntities
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const entity = await (0, dynamoRepository_1.getEntityById)(id);
        if (!entity) {
            return res.status(404).json({
                success: false,
                message: 'Entity not found'
            });
        }
        res.json({
            success: true,
            message: 'Entity retrieved successfully',
            data: entity
        });
    }
    catch (error) {
        console.error('Get entity error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/buyers/list', async (req, res) => {
    try {
        if (!(0, dynamoClient_1.isDynamoConfigured)()) {
            console.warn('DynamoDB not configured, using mock buyer data');
            return res.json({
                success: true,
                message: 'Buyers retrieved successfully (mock data)',
                data: mockData_1.mockBuyers
            });
        }
        const buyers = await (0, dynamoRepository_1.listEntitiesByType)('buyer');
        if (!buyers || buyers.length === 0) {
            console.warn('No buyers found in database, using mock data');
            return res.json({
                success: true,
                message: 'Buyers retrieved successfully (fallback to mock data)',
                data: mockData_1.mockBuyers
            });
        }
        res.json({
            success: true,
            message: 'Buyers retrieved successfully',
            data: buyers
        });
    }
    catch (error) {
        console.error('Get buyers error:', error);
        res.json({
            success: true,
            message: 'Buyers retrieved successfully (fallback to mock data)',
            data: mockData_1.mockBuyers
        });
    }
});
router.get('/suppliers/list', async (req, res) => {
    try {
        if (!(0, dynamoClient_1.isDynamoConfigured)()) {
            console.warn('DynamoDB not configured, using mock supplier data');
            return res.json({
                success: true,
                message: 'Suppliers retrieved successfully (mock data)',
                data: mockData_1.mockSuppliers
            });
        }
        const suppliers = await (0, dynamoRepository_1.listEntitiesByType)('supplier');
        if (!suppliers || suppliers.length === 0) {
            console.warn('No suppliers found in database, using mock data');
            return res.json({
                success: true,
                message: 'Suppliers retrieved successfully (fallback to mock data)',
                data: mockData_1.mockSuppliers
            });
        }
        res.json({
            success: true,
            message: 'Suppliers retrieved successfully',
            data: suppliers
        });
    }
    catch (error) {
        console.error('Get suppliers error:', error);
        res.json({
            success: true,
            message: 'Suppliers retrieved successfully (fallback to mock data)',
            data: mockData_1.mockSuppliers
        });
    }
});
router.get('/suppliers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const supplier = await (0, dynamoRepository_1.getEntityById)(id);
        if (supplier && supplier.type !== 'supplier') {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found'
            });
        }
        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found'
            });
        }
        res.json({
            success: true,
            message: 'Supplier retrieved successfully',
            data: supplier
        });
    }
    catch (error) {
        console.error('Get supplier error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.post('/', upload.single('agreementFrameworkDocument'), async (req, res) => {
    try {
        const entityData = typeof req.body.payload === 'string'
            ? JSON.parse(req.body.payload)
            : req.body;
        const currency = String(entityData.currency || entityData?.bankDetails?.currency || 'USD').toUpperCase();
        const allowedCurrencies = ['USD', 'EUR', 'GBP'];
        if (!allowedCurrencies.includes(currency)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid currency. Allowed values are USD, EUR, GBP.'
            });
        }
        const normalizedCurrency = currency;
        let totalCreditLimit = 0;
        if (entityData.type === 'buyer' && entityData.supplierLimits && Array.isArray(entityData.supplierLimits)) {
            totalCreditLimit = entityData.supplierLimits.reduce((sum, sl) => {
                return sum + (typeof sl.transactionLimit === 'number' ? sl.transactionLimit : parseFloat(sl.transactionLimit) || 0);
            }, 0);
        }
        const generatedEntityId = `${entityData.type?.toUpperCase() || 'ENT'}-${Date.now().toString().slice(-6)}`;
        let agreementFrameworkDocumentKey;
        let agreementFrameworkDocumentName;
        if (req.file) {
            const uploaded = await (0, s3_1.uploadDocumentToS3)({
                folder: `entities/${generatedEntityId}`,
                fileName: req.file.originalname,
                contentType: req.file.mimetype || 'application/octet-stream',
                body: req.file.buffer
            });
            agreementFrameworkDocumentKey = uploaded.key;
            agreementFrameworkDocumentName = req.file.originalname;
        }
        const newEntity = {
            entityId: generatedEntityId,
            name: entityData.name,
            currency: normalizedCurrency,
            type: entityData.type,
            status: 'active',
            riskCategory: 'medium',
            riskScore: Math.floor(Math.random() * 40) + 60,
            contactEmail: entityData.email,
            phone: entityData.phone,
            address: entityData.address,
            city: entityData.city,
            state: entityData.state,
            country: entityData.country,
            pincode: entityData.pincode,
            contactPersonName: entityData.contactPersonName,
            contactPersonDesignation: entityData.contactPersonDesignation,
            contactPersonEmail: entityData.contactPersonEmail,
            contactPersonPhone: entityData.contactPersonPhone,
            creditLimit: totalCreditLimit || entityData.totalLimitSanctioned || entityData.creditLimit || 0,
            totalLimitSanctioned: totalCreditLimit || entityData.totalLimitSanctioned || 0,
            usedLimit: 0,
            usedCredit: 0,
            utilizedLimit: 0,
            availableLimit: totalCreditLimit || entityData.totalLimitSanctioned || entityData.creditLimit || 0,
            advanceRate: entityData.advanceRate || '80',
            gracePeriod: entityData.gracePeriod || '5',
            transactionFees: entityData.transactionFees || {
                days0to30: entityData.days0to30 || '2.5',
                days31to60: entityData.days31to60 || '3.0',
                days61to90: entityData.days61to90 || '3.5',
                days91to120: entityData.days91to120 || '4.0',
                days121to150: entityData.days121to150 || '4.5'
            },
            feeDeductionMethod: entityData.feeDeductionMethod || 'from_advance',
            feeChargeMethod: entityData.feeChargeMethod || 'face_value',
            feeTimingMethod: entityData.feeTimingMethod || 'prorated_advance',
            noaRequired: entityData.noaRequired || false,
            collateralTaken: entityData.collateralTaken || false,
            processingFees: parseFloat(entityData.processingFees) || 0,
            factoringFees: parseFloat(entityData.factoringFees) || 0,
            setupFee: parseFloat(entityData.setupFee) || 0,
            setupFeePaymentMethod: entityData.setupFeePaymentMethod || 'one_time',
            lateFees: entityData.lateFees || '1',
            lateFeesFrequency: entityData.lateFeesFrequency || 'monthly',
            supplierLimits: entityData.supplierLimits || [],
            bankDetails: {
                beneficiary: entityData.beneficiary,
                bank: entityData.bank,
                branch: entityData.branch,
                accountNumber: entityData.accountNumber,
                ifscCode: entityData.ifscCode,
                swiftCode: entityData.swiftCode,
                currency
            },
            industry: entityData.industry,
            taxId: entityData.taxId,
            notes: entityData.notes,
            email: entityData.email,
            ...(agreementFrameworkDocumentKey ? { agreementFrameworkDocumentKey } : {}),
            ...(agreementFrameworkDocumentName ? { agreementFrameworkDocumentName } : {})
        };
        const savedEntity = await (0, dynamoRepository_1.createEntity)(newEntity);
        console.log('Entity created:', savedEntity);
        (0, index_1.broadcastNotification)({
            id: Date.now().toString(),
            title: `New ${savedEntity.type.charAt(0).toUpperCase() + savedEntity.type.slice(1)} Added`,
            message: `${savedEntity.name} has been successfully added to the system`,
            type: 'success',
            timestamp: new Date().toISOString(),
            actionUrl: '/entities'
        });
        res.status(201).json({
            success: true,
            message: 'Entity created successfully',
            data: savedEntity
        });
    }
    catch (error) {
        console.error('Create entity error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const updatedEntity = await (0, dynamoRepository_1.updateEntity)(id, { ...updateData });
        if (!updatedEntity) {
            return res.status(404).json({
                success: false,
                message: 'Entity not found'
            });
        }
        console.log('Entity updated:', updatedEntity);
        res.json({
            success: true,
            message: 'Entity updated successfully',
            data: updatedEntity
        });
    }
    catch (error) {
        console.error('Update entity error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.put('/:id/limits', async (req, res) => {
    try {
        const { id } = req.params;
        const { newLimit, reason, adjustedBy } = req.body;
        const entity = await (0, dynamoRepository_1.getEntityById)(id);
        if (!entity) {
            return res.status(404).json({
                success: false,
                message: 'Entity not found'
            });
        }
        const currentLimit = entity.type === 'supplier'
            ? (entity.totalLimitSanctioned || entity.creditLimit || 0)
            : (entity.creditLimit || 0);
        const usedLimit = entity.usedLimit || entity.usedCredit || 0;
        if (newLimit < 0) {
            return res.status(400).json({
                success: false,
                message: 'New limit cannot be negative'
            });
        }
        if (newLimit < usedLimit) {
            return res.status(400).json({
                success: false,
                message: 'New limit cannot be less than currently used limit',
                data: { usedLimit, newLimit }
            });
        }
        const limitUpdates = entity.type === 'supplier'
            ? {
                totalLimitSanctioned: newLimit,
                creditLimit: newLimit,
                availableLimit: newLimit - usedLimit
            }
            : {
                creditLimit: newLimit,
                availableLimit: newLimit - usedLimit
            };
        const updatedEntity = await (0, dynamoRepository_1.updateEntity)(id, limitUpdates);
        console.log(`Limit adjusted for ${entity.name}: ${currentLimit} -> ${newLimit} (${reason})`);
        res.json({
            success: true,
            message: 'Limits adjusted successfully',
            data: {
                entity: updatedEntity,
                previousLimit: currentLimit,
                newLimit,
                change: newLimit - currentLimit,
                availableLimit: newLimit - usedLimit
            }
        });
    }
    catch (error) {
        console.error('Adjust limits error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedEntity = await (0, dynamoRepository_1.deleteEntity)(id);
        if (!deletedEntity) {
            return res.status(404).json({
                success: false,
                message: 'Entity not found'
            });
        }
        console.log('Entity deleted:', deletedEntity.name, deletedEntity.entityId);
        (0, index_1.broadcastNotification)({
            id: Date.now().toString(),
            title: `${deletedEntity.type.charAt(0).toUpperCase() + deletedEntity.type.slice(1)} Deleted`,
            message: `${deletedEntity.name} has been removed from the system`,
            type: 'warning',
            timestamp: new Date().toISOString(),
            actionUrl: '/entities'
        });
        res.json({
            success: true,
            message: 'Entity deleted successfully',
            data: deletedEntity
        });
    }
    catch (error) {
        console.error('Delete entity error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
        });
    }
});
exports.default = router;
//# sourceMappingURL=entities.js.map