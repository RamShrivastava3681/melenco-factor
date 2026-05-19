"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutRecordModel = exports.NOAModel = exports.TransactionModel = exports.EntityModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const EntitySchema = new mongoose_1.Schema({
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
const TransactionSchema = new mongoose_1.Schema({
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
const NOASchema = new mongoose_1.Schema({
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
EntitySchema.index({ entityId: 1 });
EntitySchema.index({ type: 1 });
EntitySchema.index({ status: 1 });
TransactionSchema.index({ transactionId: 1 });
TransactionSchema.index({ supplierId: 1 });
TransactionSchema.index({ buyerId: 1 });
TransactionSchema.index({ status: 1 });
NOASchema.index({ noaId: 1 });
NOASchema.index({ transactionId: 1 });
const PayoutRecordSchema = new mongoose_1.Schema({
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
        ifscCode: { type: String, default: '' },
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
PayoutRecordSchema.index({ payoutId: 1 });
PayoutRecordSchema.index({ supplierId: 1 });
PayoutRecordSchema.index({ status: 1 });
exports.EntityModel = mongoose_1.default.model('Entity', EntitySchema);
exports.TransactionModel = mongoose_1.default.model('Transaction', TransactionSchema);
exports.NOAModel = mongoose_1.default.model('NOA', NOASchema);
exports.PayoutRecordModel = mongoose_1.default.model('PayoutRecord', PayoutRecordSchema);
//# sourceMappingURL=schemas.js.map