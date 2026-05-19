import express from 'express';
import multer from 'multer';
import { broadcastNotification } from '../index';
import { IEntity } from '../models/schemas';
import { uploadDocumentToS3 } from '../utils/s3';
import {
  createEntity,
  deleteEntity,
  getEntityById,
  listEntities,
  listEntitiesByType,
  updateEntity
} from '../data/dynamoRepository';
import { isDynamoConfigured } from '../data/dynamoClient';

// Mock data as fallback
import { mockBuyers, mockSuppliers } from '../../mockData';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
});

// Combine mock buyers and suppliers as entities
const mockEntities = [...mockBuyers, ...mockSuppliers];

// Get all entities
router.get('/', async (req, res) => {
  try {
    if (!isDynamoConfigured()) {
      console.warn('DynamoDB not configured, using mock data');
      return res.json({
        success: true,
        message: 'Entities retrieved successfully (mock data)',
        data: mockEntities
      });
    }

    const entities = await listEntities();
    res.json({
      success: true,
      message: 'Entities retrieved successfully',
      data: entities
    });
  } catch (error) {
    console.error('Get entities error:', error);
    // Fallback to mock data on error
    res.json({
      success: true,
      message: 'Entities retrieved successfully (fallback to mock data)',
      data: mockEntities
    });
  }
});

// Get specific entity by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const entity = await getEntityById(id);
    
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
  } catch (error) {
    console.error('Get entity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get buyers only
router.get('/buyers/list', async (req, res) => {
  try {
    if (!isDynamoConfigured()) {
      console.warn('DynamoDB not configured, using mock buyer data');
      return res.json({
        success: true,
        message: 'Buyers retrieved successfully (mock data)',
        data: mockBuyers
      });
    }

    const buyers = await listEntitiesByType('buyer');
    
    // If no buyers found in database, fallback to mock data
    if (!buyers || buyers.length === 0) {
      console.warn('No buyers found in database, using mock data');
      return res.json({
        success: true,
        message: 'Buyers retrieved successfully (fallback to mock data)',
        data: mockBuyers
      });
    }
    
    res.json({
      success: true,
      message: 'Buyers retrieved successfully',
      data: buyers
    });
  } catch (error) {
    console.error('Get buyers error:', error);
    // Fallback to mock data on error
    res.json({
      success: true,
      message: 'Buyers retrieved successfully (fallback to mock data)',
      data: mockBuyers
    });
  }
});

// Get suppliers only
router.get('/suppliers/list', async (req, res) => {
  try {
    if (!isDynamoConfigured()) {
      console.warn('DynamoDB not configured, using mock supplier data');
      return res.json({
        success: true,
        message: 'Suppliers retrieved successfully (mock data)',
        data: mockSuppliers
      });
    }

    const suppliers = await listEntitiesByType('supplier');
    
    // If no suppliers found in database, fallback to mock data
    if (!suppliers || suppliers.length === 0) {
      console.warn('No suppliers found in database, using mock data');
      return res.json({
        success: true,
        message: 'Suppliers retrieved successfully (fallback to mock data)',
        data: mockSuppliers
      });
    }
    
    res.json({
      success: true,
      message: 'Suppliers retrieved successfully',
      data: suppliers
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    // Fallback to mock data on error
    res.json({
      success: true,
      message: 'Suppliers retrieved successfully (fallback to mock data)',
      data: mockSuppliers
    });
  }
});

// Get specific supplier by ID
router.get('/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await getEntityById(id);

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
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new entity
router.post('/', upload.single('agreementFrameworkDocument'), async (req, res) => {
  try {
    const entityData = typeof req.body.payload === 'string'
      ? JSON.parse(req.body.payload)
      : req.body;
    const currency = String(entityData.currency || entityData?.bankDetails?.currency || 'USD').toUpperCase();
    const allowedCurrencies = ['USD', 'EUR', 'GBP'] as const;

    if (!allowedCurrencies.includes(currency as typeof allowedCurrencies[number])) {
      return res.status(400).json({
        success: false,
        message: 'Invalid currency. Allowed values are USD, EUR, GBP.'
      });
    }

    const normalizedCurrency = currency as typeof allowedCurrencies[number];
    
    // Calculate total credit limit from supplier limits (for buyers)
    let totalCreditLimit = 0;
    if (entityData.type === 'buyer' && entityData.supplierLimits && Array.isArray(entityData.supplierLimits)) {
      totalCreditLimit = entityData.supplierLimits.reduce((sum, sl) => {
        return sum + (typeof sl.transactionLimit === 'number' ? sl.transactionLimit : parseFloat(sl.transactionLimit) || 0);
      }, 0);
    }
    
    // Create new entity with generated ID and timestamps
    const generatedEntityId = `${entityData.type?.toUpperCase() || 'ENT'}-${Date.now().toString().slice(-6)}`;
    let agreementFrameworkDocumentKey: string | undefined;
    let agreementFrameworkDocumentName: string | undefined;

    if (req.file) {
      const uploaded = await uploadDocumentToS3({
        folder: `entities/${generatedEntityId}`,
        fileName: req.file.originalname,
        contentType: req.file.mimetype || 'application/octet-stream',
        body: req.file.buffer
      });
      agreementFrameworkDocumentKey = uploaded.key;
      agreementFrameworkDocumentName = req.file.originalname;
    }

    const newEntity: IEntity = {
      entityId: generatedEntityId,
      name: entityData.name,
      currency: normalizedCurrency,
      type: entityData.type, // 'supplier' or 'buyer'
      status: 'active',
      riskCategory: 'medium', 
      riskScore: Math.floor(Math.random() * 40) + 60, // Random score between 60-100
      
      // Contact information
      contactEmail: entityData.email,
      phone: entityData.phone,
      address: entityData.address,
      city: entityData.city,
      state: entityData.state,
      country: entityData.country,
      pincode: entityData.pincode,
      
      // Contact person
      contactPersonName: entityData.contactPersonName,
      contactPersonDesignation: entityData.contactPersonDesignation,
      contactPersonEmail: entityData.contactPersonEmail,
      contactPersonPhone: entityData.contactPersonPhone,
      
      // Financial information
      creditLimit: totalCreditLimit || entityData.totalLimitSanctioned || entityData.creditLimit || 0,
      totalLimitSanctioned: totalCreditLimit || entityData.totalLimitSanctioned || 0,
      usedLimit: 0, // For suppliers
      usedCredit: 0, // For buyers
      utilizedLimit: 0,
      availableLimit: totalCreditLimit || entityData.totalLimitSanctioned || entityData.creditLimit || 0,
      
      // Advance and fee configuration (for suppliers)
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
      
      // Fee structure from supplier form
      processingFees: parseFloat(entityData.processingFees) || 0,
      factoringFees: parseFloat(entityData.factoringFees) || 0,
      setupFee: parseFloat(entityData.setupFee) || 0,
      setupFeePaymentMethod: entityData.setupFeePaymentMethod || 'one_time',
      lateFees: entityData.lateFees || '1',
      lateFeesFrequency: entityData.lateFeesFrequency || 'monthly',
      
      // Supplier relationships (for buyers)
      supplierLimits: entityData.supplierLimits || [],
      
      // Bank details
      bankDetails: {
        beneficiary: entityData.beneficiary,
        bank: entityData.bank,
        branch: entityData.branch,
        accountNumber: entityData.accountNumber,
        ifscCode: entityData.ifscCode,
        swiftCode: entityData.swiftCode,
        currency
      },
      
      // Additional fields from forms
      industry: entityData.industry,
      taxId: entityData.taxId,
      notes: entityData.notes,
      email: entityData.email,
      ...(agreementFrameworkDocumentKey ? { agreementFrameworkDocumentKey } : {}),
      ...(agreementFrameworkDocumentName ? { agreementFrameworkDocumentName } : {})
    };

    const savedEntity = await createEntity(newEntity);

    console.log('Entity created:', savedEntity);

    // Send real-time notification about new entity
    broadcastNotification({
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
  } catch (error) {
    console.error('Create entity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update entity
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedEntity = await updateEntity(id, { ...updateData });
    
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
  } catch (error) {
    console.error('Update entity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Adjust entity limits (specific endpoint for limit adjustments)
router.put('/:id/limits', async (req, res) => {
  try {
    const { id } = req.params;
    const { newLimit, reason, adjustedBy } = req.body;
    
    const entity = await getEntityById(id);
    
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

    // Validation
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

    // Update limit fields based on entity type
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

    // Update entity
    const updatedEntity = await updateEntity(id, limitUpdates);
    
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
  } catch (error) {
    console.error('Adjust limits error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete entity
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedEntity = await deleteEntity(id);
    
    if (!deletedEntity) {
      return res.status(404).json({
        success: false,
        message: 'Entity not found'
      });
    }
    
    console.log('Entity deleted:', deletedEntity.name, deletedEntity.entityId);
    
    // Send notification about deleted entity
    broadcastNotification({
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
  } catch (error) {
    console.error('Delete entity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

export default router;