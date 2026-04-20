import mongoose, { Document, Schema } from 'mongoose';

// Entity Interface
export interface IEntity extends Document {
  entityId: string;
  name: string;
  currency: 'USD' | 'EUR' | 'GBP';
  type: 'supplier' | 'buyer';
  status: 'active' | 'inactive' | 'suspended';
  riskCategory: 'low' | 'medium' | 'high';
  riskScore: number;
  contactEmail: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  contactPersonName: string;
  contactPersonDesignation: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  creditLimit: number;
  totalLimitSanctioned: number;
  usedLimit: number;
  usedCredit: number;
  utilizedLimit: number;
  availableLimit: number;
  email: string;
  agreementFrameworkDocumentKey?: string;
  agreementFrameworkDocumentName?: string;
  advanceRate: string;
  gracePeriod: string;
  transactionFees: {
    days0to30: string;
    days31to60: string;
    days61to90: string;
    days91to120: string;
    days121to150: string;
  };
  feeDeductionMethod: string;
  feeChargeMethod: string;
  feeTimingMethod: string;
  noaRequired: boolean;
  collateralTaken: boolean;
  lateFees: string;
  lateFeesFrequency: string;
  processingFees?: number;
  factoringFees?: number;
  setupFee?: number;
  setupFeePaymentMethod?: string;
  bankDetails?: {
    beneficiary: string;
    bank: string;
    branch: string;
    accountNumber: string;
    ifscCode: string;
    swiftCode?: string;
    currency: string;
  };
  supplierLimits?: {
    supplierId: string;
    supplierName: string;
    transactionLimit: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// Transaction Interface  
export interface ITransaction extends Document {
  transactionId: string;
  invoiceId?: string;
  supplierId: string;
  supplierName: string;
  buyerId: string;
  buyerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceValue: number;
  invoiceAmount: number;
  currency: string;
  advanceRate: number;
  advanceAmount: number;
  feeAmount: number;
  reserveAmount: number;
  transactionFee: number;
  processingFee: number;
  factoringFee: number;
  setupFee: number;
  supplierPaymentTerms: string;
  description: string;
  status: string;
  transactionType: string;
  supportingDocuments: string[];
  supportingDocumentNames?: string[];
  buyerEmail: string;
  sendNOA: boolean;
  netAmount: number;
  dueDate?: string;
  tenureDays?: number;
  blDate?: string;
  noaStatus?: string;
  noaSentAt?: Date;
  noaToken?: string;
  paymentDue?: boolean;
  approvedAt?: Date;
  fundedAt?: Date;
  payoutAmount?: number;
  payoutStatus?: string;
  paidAmount?: number;
  lastPaymentAt?: Date;
  settledAt?: Date;
  paymentHistory?: Array<{
    id: string;
    amount: number;
    paidAt: string;
    paidBy: string;
    reference?: string;
    notes?: string;
    lateFeesPaid?: number;
  }>;
  completedAt?: Date;
  reserveReleasedAt?: Date;
  reservePayoutId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// NOA Interface
export interface INOA extends Document {
  noaId: string;
  transactionId: string;
  buyerEmail: string;
  supplierId: string;
  supplierName: string;
  buyerId: string;
  buyerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceValue: number;
  advanceAmount: number;
  feeAmount: number;
  netAmount: number;
  dueDate: string;
  expiresAt?: Date;
  status: 'sent' | 'delivered' | 'opened' | 'acknowledged' | 'disputed';
  emailSent: boolean;
  emailSentAt?: Date;
  lastAccessedAt?: Date;
  accessCount: number;
  acknowledgedAt?: Date;
  signatoryData?: {
    fullName: string;
    position: string;
    ipAddress: string;
    userAgent: string;
    signatureDataUrl: string;
    photoDataUrl: string;
    location: {
      city: string;
      country: string;
      latitude: number;
      longitude: number;
      accuracy?: number;
      capturedAt?: Date;
    };
  };
  signedDocumentKey?: string;
  signedDocumentFileName?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Entity Schema
const EntitySchema = new Schema({
  entityId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  currency: { type: String, enum: ['USD', 'EUR', 'GBP'], default: 'USD' },
  type: { type: String, enum: ['supplier', 'buyer'], required: true },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  riskCategory: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  riskScore: { type: Number, min: 0, max: 100, default: 50 },
  contactEmail: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  pincode: { type: String, required: true },
  contactPersonName: { type: String, required: true },
  contactPersonDesignation: { type: String, required: true },
  contactPersonEmail: { type: String, required: true },
  contactPersonPhone: { type: String, required: true },
  creditLimit: { type: Number, default: 0 },
  totalLimitSanctioned: { type: Number, default: 0 },
  usedLimit: { type: Number, default: 0 },
  usedCredit: { type: Number, default: 0 },
  utilizedLimit: { type: Number, default: 0 },
  availableLimit: { type: Number, default: 0 },
  email: { type: String, required: true },
  agreementFrameworkDocumentKey: { type: String },
  agreementFrameworkDocumentName: { type: String },
  advanceRate: { type: String, default: '80' },
  gracePeriod: { type: String, default: '5' },
  transactionFees: {
    days0to30: { type: String, default: '2.5' },
    days31to60: { type: String, default: '3.0' },
    days61to90: { type: String, default: '3.5' },
    days91to120: { type: String, default: '4.0' },
    days121to150: { type: String, default: '4.5' }
  },
  feeDeductionMethod: { type: String, default: 'from_advance' },
  feeChargeMethod: { type: String, default: 'face_value' },
  feeTimingMethod: { type: String, default: 'prorated_advance' },
  noaRequired: { type: Boolean, default: false },
  collateralTaken: { type: Boolean, default: false },
  lateFees: { type: String, default: '1' },
  lateFeesFrequency: { type: String, default: 'monthly' },
  processingFees: { type: Number, default: 0 },
  factoringFees: { type: Number, default: 0 },
  setupFee: { type: Number, default: 0 },
  setupFeePaymentMethod: { type: String, default: 'one_time' },
  bankDetails: {
    beneficiary: { type: String },
    bank: { type: String },
    branch: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    swiftCode: { type: String },
    currency: { type: String, default: 'INR' }
  },
  supplierLimits: [{
    supplierId: { type: String },
    supplierName: { type: String },
    transactionLimit: { type: Number }
  }]
}, {
  timestamps: true
});

// Transaction Schema
const TransactionSchema = new Schema({
  transactionId: { type: String, required: true, unique: true },
  invoiceId: { type: String },
  supplierId: { type: String, required: true },
  supplierName: { type: String, required: true },
  buyerId: { type: String, required: true },
  buyerName: { type: String, required: true },
  invoiceNumber: { type: String, required: true },
  invoiceDate: { type: String, required: true },
  invoiceValue: { type: Number, required: true },
  invoiceAmount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  advanceRate: { type: Number, required: true },
  advanceAmount: { type: Number, required: true },
  feeAmount: { type: Number, required: true },
  reserveAmount: { type: Number, required: true },
  transactionFee: { type: Number, default: 0 },
  processingFee: { type: Number, default: 0 },
  factoringFee: { type: Number, default: 0 },
  setupFee: { type: Number, default: 0 },
  supplierPaymentTerms: { type: String, default: '' },
  description: { type: String, default: '' },
  status: { type: String, default: 'pending' },
  transactionType: { type: String, default: 'factoring' },
  supportingDocuments: [{ type: String }],
  supportingDocumentNames: [{ type: String }],
  buyerEmail: { type: String, required: true },
  sendNOA: { type: Boolean, default: false },
  netAmount: { type: Number, required: true },
  dueDate: { type: String },
  tenureDays: { type: Number },
  blDate: { type: String },
  noaStatus: { type: String },
  noaSentAt: { type: Date },
  noaToken: { type: String },
  paymentDue: { type: Boolean, default: false },
  approvedAt: { type: Date },
  fundedAt: { type: Date },
  payoutAmount: { type: Number },
  payoutStatus: { type: String, default: 'pending' },
  paidAmount: { type: Number, default: 0 },
  lastPaymentAt: { type: Date },
  settledAt: { type: Date },
  paymentHistory: [{
    id: { type: String },
    amount: { type: Number },
    paidAt: { type: String },
    paidBy: { type: String },
    reference: { type: String },
    notes: { type: String },
    lateFeesPaid: { type: Number, default: 0 }
  }],
  completedAt: { type: Date },
  reserveReleasedAt: { type: Date },
  reservePayoutId: { type: String }
}, {
  timestamps: true
});

// NOA Schema
const NOASchema = new Schema({
  noaId: { type: String, required: true, unique: true },
  transactionId: { type: String, required: true },
  buyerEmail: { type: String, required: true },
  supplierId: { type: String, required: true },
  supplierName: { type: String, required: true },
  buyerId: { type: String, required: true },
  buyerName: { type: String, required: true },
  invoiceNumber: { type: String, required: true },
  invoiceDate: { type: String, required: true },
  invoiceValue: { type: Number, required: true },
  advanceAmount: { type: Number, required: true },
  feeAmount: { type: Number, required: true },
  netAmount: { type: Number, required: true },
  dueDate: { type: String, required: true },
  expiresAt: { type: Date },
  status: { type: String, enum: ['sent', 'delivered', 'opened', 'acknowledged', 'disputed'], default: 'sent' },
  emailSent: { type: Boolean, default: false },
  emailSentAt: { type: Date },
  lastAccessedAt: { type: Date },
  accessCount: { type: Number, default: 0 },
  acknowledgedAt: { type: Date },
  signatoryData: {
    fullName: { type: String },
    position: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
    signatureDataUrl: { type: String },
    photoDataUrl: { type: String },
    location: {
      city: { type: String },
      country: { type: String },
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number },
      capturedAt: { type: Date }
    }
  },
  signedDocumentKey: { type: String },
  signedDocumentFileName: { type: String }
}, {
  timestamps: true
});

// Create indexes for performance
EntitySchema.index({ entityId: 1 });
EntitySchema.index({ type: 1 });
EntitySchema.index({ status: 1 });

TransactionSchema.index({ transactionId: 1 });
TransactionSchema.index({ supplierId: 1 });
TransactionSchema.index({ buyerId: 1 });
TransactionSchema.index({ status: 1 });

NOASchema.index({ noaId: 1 });
NOASchema.index({ transactionId: 1 });

// Payout Record Schema
const PayoutRecordSchema = new Schema({
  payoutId: { type: String, required: true, unique: true },
  supplierId: { type: String, required: true },
  supplierName: { type: String, required: true },
  amount: { type: Number, required: true },
  transactionIds: [{ type: String, required: true }],
  bankDetails: {
    beneficiary: { type: String, required: true },
    bank: { type: String, required: true },
    branch: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifscCode: { type: String, default: '' },  // Made optional with default
    swiftCode: { type: String },
    currency: { type: String, default: 'INR' }
  },
  status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'processing' },
  processedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  reference: { type: String, required: true },
  method: { type: String, default: 'bank_transfer' },
  type: { type: String, enum: ['advance_payment', 'reserve_payment'], default: 'advance_payment' },
  notes: { type: String },
  paymentInstruction: {
    serialNumber: { type: String },
    transactionType: { type: String },
    paymentAccountNumber: { type: String },
    beneficiaryAccountNumber: { type: String },
    effectiveDate: { type: String },
    remarks: { type: String },
    currency: { type: String },
    amount: { type: Number },
    paymentProofFileName: { type: String }
  }
}, {
  timestamps: true
});

// Payout Record Interface
export interface IPayoutRecord extends Document {
  payoutId: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  transactionIds: string[];
  bankDetails: {
    beneficiary: string;
    bank: string;
    branch: string;
    accountNumber: string;
    ifscCode: string;
    swiftCode?: string;
    currency: string;
  };
  status: 'processing' | 'completed' | 'failed';
  processedAt: Date;
  completedAt?: Date;
  reference: string;
  method: string;
  type?: 'advance_payment' | 'reserve_payment';
  notes?: string;
  paymentInstruction?: {
    serialNumber?: string;
    transactionType?: string;
    paymentAccountNumber?: string;
    beneficiaryAccountNumber?: string;
    effectiveDate?: string;
    remarks?: string;
    currency?: string;
    amount?: number;
    paymentProofFileName?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

PayoutRecordSchema.index({ payoutId: 1 });
PayoutRecordSchema.index({ supplierId: 1 });
PayoutRecordSchema.index({ status: 1 });

// Export models
export const EntityModel = mongoose.model<IEntity>('Entity', EntitySchema);
export const TransactionModel = mongoose.model<ITransaction>('Transaction', TransactionSchema);
export const NOAModel = mongoose.model<INOA>('NOA', NOASchema);
export const PayoutRecordModel = mongoose.model<IPayoutRecord>('PayoutRecord', PayoutRecordSchema);