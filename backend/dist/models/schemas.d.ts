import mongoose, { Document } from 'mongoose';
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
export declare const EntityModel: mongoose.Model<IEntity, {}, {}, {}, mongoose.Document<unknown, {}, IEntity, {}, mongoose.DefaultSchemaOptions> & IEntity & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IEntity>;
export declare const TransactionModel: mongoose.Model<ITransaction, {}, {}, {}, mongoose.Document<unknown, {}, ITransaction, {}, mongoose.DefaultSchemaOptions> & ITransaction & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ITransaction>;
export declare const NOAModel: mongoose.Model<INOA, {}, {}, {}, mongoose.Document<unknown, {}, INOA, {}, mongoose.DefaultSchemaOptions> & INOA & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, INOA>;
export declare const PayoutRecordModel: mongoose.Model<IPayoutRecord, {}, {}, {}, mongoose.Document<unknown, {}, IPayoutRecord, {}, mongoose.DefaultSchemaOptions> & IPayoutRecord & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IPayoutRecord>;
//# sourceMappingURL=schemas.d.ts.map