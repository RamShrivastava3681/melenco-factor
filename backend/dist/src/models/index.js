"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenInvoiceStatus = exports.LedgerEntryType = exports.UserRole = exports.AlertSeverity = exports.ReserveStatus = exports.DisbursementStatus = exports.LimitType = exports.FeeType = exports.TransactionStatus = void 0;
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "pending";
    TransactionStatus["APPROVED"] = "approved";
    TransactionStatus["REJECTED"] = "rejected";
    TransactionStatus["DISBURSED"] = "disbursed";
    TransactionStatus["SETTLED"] = "settled";
    TransactionStatus["OVERDUE"] = "overdue";
    TransactionStatus["CLOSED"] = "closed";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
var FeeType;
(function (FeeType) {
    FeeType["FLAT"] = "flat";
    FeeType["PERCENTAGE"] = "percentage";
    FeeType["TIERED"] = "tiered";
})(FeeType || (exports.FeeType = FeeType = {}));
var LimitType;
(function (LimitType) {
    LimitType["BUYER_CREDIT"] = "buyer_credit";
    LimitType["SUPPLIER_CONCENTRATION"] = "supplier_concentration";
    LimitType["TRANSACTION_VALUE"] = "transaction_value";
    LimitType["DAILY"] = "daily";
    LimitType["MONTHLY"] = "monthly";
})(LimitType || (exports.LimitType = LimitType = {}));
var DisbursementStatus;
(function (DisbursementStatus) {
    DisbursementStatus["PENDING"] = "pending";
    DisbursementStatus["PROCESSING"] = "processing";
    DisbursementStatus["PAID"] = "paid";
    DisbursementStatus["FAILED"] = "failed";
    DisbursementStatus["REVERSED"] = "reversed";
})(DisbursementStatus || (exports.DisbursementStatus = DisbursementStatus = {}));
var ReserveStatus;
(function (ReserveStatus) {
    ReserveStatus["HELD"] = "held";
    ReserveStatus["RELEASED"] = "released";
    ReserveStatus["PARTIALLY_RELEASED"] = "partially_released";
})(ReserveStatus || (exports.ReserveStatus = ReserveStatus = {}));
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["INFO"] = "info";
    AlertSeverity["WARNING"] = "warning";
    AlertSeverity["CRITICAL"] = "critical";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["OPERATIONS"] = "operations";
    UserRole["TREASURY"] = "treasury";
    UserRole["AUDIT"] = "audit";
})(UserRole || (exports.UserRole = UserRole = {}));
var LedgerEntryType;
(function (LedgerEntryType) {
    LedgerEntryType["DISBURSEMENT"] = "disbursement";
    LedgerEntryType["RESERVE_HOLD"] = "reserve_hold";
    LedgerEntryType["RESERVE_RELEASE"] = "reserve_release";
    LedgerEntryType["FEE_COLLECTION"] = "fee_collection";
    LedgerEntryType["REVERSAL"] = "reversal";
})(LedgerEntryType || (exports.LedgerEntryType = LedgerEntryType = {}));
var OpenInvoiceStatus;
(function (OpenInvoiceStatus) {
    OpenInvoiceStatus["PENDING"] = "pending";
    OpenInvoiceStatus["PARTIALLY_PAID"] = "partially_paid";
    OpenInvoiceStatus["PAID"] = "paid";
    OpenInvoiceStatus["OVERDUE"] = "overdue";
    OpenInvoiceStatus["CLOSED"] = "closed";
    OpenInvoiceStatus["EXPIRED"] = "expired";
})(OpenInvoiceStatus || (exports.OpenInvoiceStatus = OpenInvoiceStatus = {}));
//# sourceMappingURL=index.js.map