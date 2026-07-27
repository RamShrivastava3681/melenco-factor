// Core data models for the application

// Enums for various statuses and types
export enum TransactionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DISBURSED = 'disbursed',
  SETTLED = 'settled',
  OVERDUE = 'overdue',
  CLOSED = 'closed'
}

export enum FeeType {
  FLAT = 'flat',
  PERCENTAGE = 'percentage',
  TIERED = 'tiered'
}

export enum LimitType {
  BUYER_CREDIT = 'buyer_credit',
  SUPPLIER_CONCENTRATION = 'supplier_concentration',
  TRANSACTION_VALUE = 'transaction_value',
  DAILY = 'daily',
  MONTHLY = 'monthly'
}

export enum DisbursementStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PAID = 'paid',
  FAILED = 'failed',
  REVERSED = 'reversed'
}

export enum ReserveStatus {
  HELD = 'held',
  RELEASED = 'released',
  PARTIALLY_RELEASED = 'partially_released'
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

export enum UserRole {
  ADMIN = 'admin',
  OPERATIONS = 'operations',
  TREASURY = 'treasury',
  AUDIT = 'audit'
}

export enum LedgerEntryType {
  DISBURSEMENT = 'disbursement',
  RESERVE_HOLD = 'reserve_hold',
  RESERVE_RELEASE = 'reserve_release',
  FEE_COLLECTION = 'fee_collection',
  REVERSAL = 'reversal'
}

// Base interfaces
export interface Entity {
  id: string;
  name: string;
  type: 'buyer' | 'supplier';
  email: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  limitAdjustmentHistory?: LimitAdjustment[];
}

export interface LimitAdjustment {
  date: string;
  previousLimit: number;
  newLimit: number;
  reason: string;
  adjustedBy: string;
  change: number;
  changePercentage: number;
}

export interface Buyer extends Entity {
  type: 'buyer';
  creditLimit: number;
  usedCredit: number;
  availableLimit: number;
  riskRating?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface Supplier extends Entity {
  type: 'supplier';
  totalLimitSanctioned: number;
  usedLimit: number;
  availableLimit: number;
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    branchCode: string;
    ifscCode: string;
  };
}

export interface Transaction {
  id: string;
  supplierId: string;
  buyerId: string;
  invoiceNumber: string;
  invoiceDate?: string;
  blDate?: string;
  tenureDays?: number;
  useInvoiceDateForCalculation?: boolean;
  useBLDateForCalculation?: boolean;
  invoiceAmount: number;
  fundingAmount: number;
  dueDate: Date;
  status: TransactionStatus;
  fees: TransactionFee[];
  totalFees: number;
  netAmount: number;
  reserveAmount?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  relatedTransactionId?: string; // To link buyer and supplier transactions
}

export interface TransactionFee {
  id: string;
  transactionId: string;
  feeConfigId: string;
  feeType: FeeType;
  description: string;
  amount: number;
  percentage?: number;
  calculatedAt: Date;
}

// Fee & Limits Models
export interface FeeConfiguration {
  id: string;
  name: string;
  description: string;
  type: FeeType;
  isActive: boolean;
  
  // For flat fees
  flatAmount?: number;
  
  // For percentage fees
  percentage?: number;
  minAmount?: number;
  maxAmount?: number;
  
  // For tiered fees
  tiers?: FeeTier[];
  
  // Applicability rules
  applicableTo: {
    buyers?: string[];
    suppliers?: string[];
    transactionCategories?: string[];
  };
  
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface FeeTier {
  fromAmount: number;
  toAmount?: number;
  percentage?: number;
  flatAmount?: number;
}

export interface LimitConfiguration {
  id: string;
  name: string;
  description: string;
  type: LimitType;
  isActive: boolean;
  
  // Limit values
  maxValue: number;
  warningThreshold?: number; // Percentage at which to warn
  
  // Period-based limits
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  
  // Entity-specific limits
  entityId?: string;
  entityType?: 'buyer' | 'supplier';
  
  // Actions on breach
  blockOnBreach: boolean;
  requireManualApproval: boolean;
  
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Treasury Models
export interface DisbursementQueue {
  id: string;
  transactionId: string;
  amount: number;
  recipientDetails: {
    name: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
  };
  status: DisbursementStatus;
  scheduledDate?: Date;
  processedAt?: Date;
  processedBy?: string;
  failureReason?: string;
  reference?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum OpenInvoiceStatus {
  PENDING = 'pending',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CLOSED = 'closed',
  EXPIRED = 'expired'
}

export interface OpenInvoice {
  id: string;
  transactionId?: string;
  payoutId: string;
  supplierId: string;
  supplierName: string;
  invoiceAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: Date;
  expirationDate: Date;
  status: OpenInvoiceStatus;
  agingDays: number;
  daysUntilExpiry: number;
  paymentHistory: InvoicePayment[];
  alerts: InvoiceAlert[];
  reference: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  closedAt?: Date;
  closedBy?: string;
  closureNotes?: string;
}

export interface InvoicePayment {
  id: string;
  amount: number;
  paidAt: Date;
  paidBy: string;
  reference?: string;
  notes?: string;
  createdAt: Date;
}

export interface InvoiceAlert {
  id: string;
  alertType: 'DUE_SOON' | 'OVERDUE' | 'EXPIRING_SOON' | 'EXPIRED' | 'PARTIAL_PAYMENT';
  message: string;
  severity: AlertSeverity;
  isRead: boolean;
  isResolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface ReserveManagement {
  id: string;
  transactionId: string;
  reserveAmount: number;
  reservePercentage: number;
  heldDate: Date;
  releaseDate?: Date;
  actualReleaseDate?: Date;
  status: ReserveStatus;
  releasedAmount: number;
  releaseReason?: string;
  createdBy: string;
  releasedBy?: string;
}

export interface LedgerEntry {
  id: string;
  transactionId: string;
  entryType: LedgerEntryType;
  amount: number;
  debitAccount: string;
  creditAccount: string;
  description: string;
  reference?: string;
  createdAt: Date;
  createdBy: string;
}

// Monitoring Models
export interface TransactionMonitoring {
  id: string;
  transactionId: string;
  healthStatus: 'healthy' | 'warning' | 'critical';
  agingDays: number;
  agingBucket: '0-30' | '31-60' | '61-90' | '90+';
  isOverdue: boolean;
  overdueBy?: number;
  riskScore?: number;
  lastUpdated: Date;
}

export interface SystemAlert {
  id: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  entityId?: string;
  entityType?: 'transaction' | 'buyer' | 'supplier';
  transactionId?: string;
  isRead: boolean;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface RiskIndicator {
  id: string;
  entityId: string;
  entityType: 'buyer' | 'supplier';
  indicatorType: string;
  description: string;
  severity: AlertSeverity;
  value: number;
  threshold: number;
  isActive: boolean;
  detectedAt: Date;
  lastUpdated: Date;
}

// Reports Models
export interface ReportConfiguration {
  id: string;
  name: string;
  description: string;
  category: 'operational' | 'financial' | 'risk' | 'compliance';
  reportType: string;
  parameters: Record<string, any>;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time?: string;
    recipients?: string[];
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ReportExecution {
  id: string;
  reportConfigId: string;
  status: 'running' | 'completed' | 'failed';
  parameters: Record<string, any>;
  generatedAt: Date;
  completedAt?: Date;
  filePath?: string;
  fileFormat: 'pdf' | 'excel' | 'csv';
  executedBy: string;
  errorMessage?: string;
}

// Audit Models
export interface AuditLog {
  id: string;
  userId: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  sessionId?: string;
}

export interface UserSession {
  id: string;
  userId: string;
  username: string;
  role: UserRole;
  permissions: string[];
  loginAt: Date;
  lastActivityAt: Date;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard Types
export interface KPIMetric {
  label: string;
  value: number | string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
  };
  format?: 'currency' | 'percentage' | 'number' | 'days';
}

export interface ChartDataPoint {
  label: string;
  value: number;
  category?: string;
  date?: string;
}