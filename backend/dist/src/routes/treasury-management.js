"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const index_1 = require("../models/index");
const router = express_1.default.Router();
let disbursementQueue = [];
let reserveManagement = [];
let ledgerEntries = [];
const accountBalances = new Map([
    ['treasury-main', 1000000],
    ['reserve-account', 500000],
    ['fee-collection', 250000]
]);
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const createLedgerEntry = (transactionId, entryType, amount, debitAccount, creditAccount, description, createdBy, reference) => {
    const entry = {
        id: generateId('ledger'),
        transactionId,
        entryType,
        amount,
        debitAccount,
        creditAccount,
        description,
        ...(reference && { reference }),
        createdAt: new Date(),
        createdBy
    };
    ledgerEntries.push(entry);
    const debitBalance = accountBalances.get(debitAccount) || 0;
    const creditBalance = accountBalances.get(creditAccount) || 0;
    accountBalances.set(debitAccount, debitBalance - amount);
    accountBalances.set(creditAccount, creditBalance + amount);
    return entry;
};
router.get('/disbursements', (req, res) => {
    try {
        const { status, limit = '50', offset = '0' } = req.query;
        let filteredDisbursements = disbursementQueue;
        if (status) {
            filteredDisbursements = disbursementQueue.filter(d => d.status === status);
        }
        filteredDisbursements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const limitNum = parseInt(limit);
        const offsetNum = parseInt(offset);
        const paginatedResults = filteredDisbursements.slice(offsetNum, offsetNum + limitNum);
        const response = {
            success: true,
            message: 'Disbursements retrieved successfully',
            data: paginatedResults,
            timestamp: new Date()
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get disbursements error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            timestamp: new Date()
        });
    }
});
router.get('/disbursements/:id', (req, res) => {
    try {
        const { id } = req.params;
        const disbursement = disbursementQueue.find(d => d.id === id);
        if (!disbursement) {
            return res.status(404).json({
                success: false,
                message: 'Disbursement not found',
                timestamp: new Date()
            });
        }
        const response = {
            success: true,
            message: 'Disbursement retrieved successfully',
            data: disbursement,
            timestamp: new Date()
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get disbursement error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            timestamp: new Date()
        });
    }
});
router.post('/disbursements', (req, res) => {
    try {
        const { transactionId, amount, recipientDetails, scheduledDate, createdBy = 'system' } = req.body;
        if (!transactionId || !amount || !recipientDetails) {
            return res.status(400).json({
                success: false,
                message: 'Transaction ID, amount, and recipient details are required',
                timestamp: new Date()
            });
        }
        const disbursement = {
            id: generateId('disb'),
            transactionId,
            amount,
            recipientDetails,
            status: index_1.DisbursementStatus.PENDING,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...(scheduledDate && { scheduledDate: new Date(scheduledDate) })
        };
        disbursementQueue.push(disbursement);
        createLedgerEntry(transactionId, index_1.LedgerEntryType.DISBURSEMENT, amount, 'treasury-main', 'disbursement-queue', `Disbursement queued for ${recipientDetails.name}`, createdBy, disbursement.id);
        const response = {
            success: true,
            message: 'Disbursement created successfully',
            data: disbursement,
            timestamp: new Date()
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Create disbursement error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            timestamp: new Date()
        });
    }
});
router.put('/disbursements/:id/process', (req, res) => {
    try {
        const { id } = req.params;
        const { status, processedBy, failureReason, reference } = req.body;
        const disbursementIndex = disbursementQueue.findIndex(d => d.id === id);
        if (disbursementIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Disbursement not found',
                timestamp: new Date()
            });
        }
        const disbursement = disbursementQueue[disbursementIndex];
        if (!disbursement) {
            return res.status(404).json({
                success: false,
                message: 'Disbursement not found',
                timestamp: new Date()
            });
        }
        if (disbursement.status !== index_1.DisbursementStatus.PENDING &&
            disbursement.status !== index_1.DisbursementStatus.PROCESSING) {
            return res.status(400).json({
                success: false,
                message: 'Disbursement cannot be processed in current status',
                timestamp: new Date()
            });
        }
        const updatedDisbursement = {
            ...disbursement,
            status,
            processedAt: new Date(),
            processedBy,
            failureReason: status === index_1.DisbursementStatus.FAILED ? failureReason : undefined,
            reference,
            updatedAt: new Date()
        };
        disbursementQueue[disbursementIndex] = updatedDisbursement;
        if (status === index_1.DisbursementStatus.PAID && disbursement) {
            createLedgerEntry(disbursement.transactionId, index_1.LedgerEntryType.DISBURSEMENT, disbursement.amount, 'disbursement-queue', disbursement.recipientDetails.accountNumber, `Payment processed to ${disbursement.recipientDetails.name}`, processedBy, reference);
        }
        else if (status === index_1.DisbursementStatus.FAILED && disbursement) {
            createLedgerEntry(disbursement.transactionId, index_1.LedgerEntryType.REVERSAL, disbursement.amount, 'disbursement-queue', 'treasury-main', `Failed disbursement reversed: ${failureReason}`, processedBy, reference);
        }
        const response = {
            success: true,
            message: 'Disbursement processed successfully',
            data: updatedDisbursement,
            timestamp: new Date()
        };
        res.json(response);
    }
    catch (error) {
        console.error('Process disbursement error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            timestamp: new Date()
        });
    }
});
router.get('/reserves', (req, res) => {
    try {
        const { status, transactionId } = req.query;
        let filteredReserves = reserveManagement;
        if (status) {
            filteredReserves = reserveManagement.filter(r => r.status === status);
        }
        if (transactionId) {
            filteredReserves = filteredReserves.filter(r => r.transactionId === transactionId);
        }
        filteredReserves.sort((a, b) => b.heldDate.getTime() - a.heldDate.getTime());
        const response = {
            success: true,
            message: 'Reserves retrieved successfully',
            data: filteredReserves,
            timestamp: new Date()
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get reserves error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            timestamp: new Date()
        });
    }
});
router.post('/reserves', (req, res) => {
    try {
        const { transactionId, reserveAmount, reservePercentage, releaseDate, createdBy } = req.body;
        if (!transactionId || (!reserveAmount && !reservePercentage)) {
            return res.status(400).json({
                success: false,
                message: 'Transaction ID and reserve amount/percentage are required',
                timestamp: new Date()
            });
        }
        const reserve = {
            id: generateId('reserve'),
            transactionId,
            reserveAmount: reserveAmount || 0,
            reservePercentage: reservePercentage || 0,
            heldDate: new Date(),
            status: index_1.ReserveStatus.HELD,
            releasedAmount: 0,
            createdBy,
            ...(releaseDate && { releaseDate: new Date(releaseDate) })
        };
        reserveManagement.push(reserve);
        createLedgerEntry(transactionId, index_1.LedgerEntryType.RESERVE_HOLD, reserve.reserveAmount, 'treasury-main', 'reserve-account', `Reserve held for transaction ${transactionId}`, createdBy, reserve.id);
        const response = {
            success: true,
            message: 'Reserve created successfully',
            data: reserve,
            timestamp: new Date()
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Create reserve error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            timestamp: new Date()
        });
    }
});
router.put('/reserves/:id/release', (req, res) => {
    try {
        const { id } = req.params;
        const { releaseAmount, releaseReason, releasedBy } = req.body;
        const reserveIndex = reserveManagement.findIndex(r => r.id === id);
        if (reserveIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Reserve not found',
                timestamp: new Date()
            });
        }
        const reserve = reserveManagement[reserveIndex];
        if (!reserve) {
            return res.status(404).json({
                success: false,
                message: 'Reserve not found',
                timestamp: new Date()
            });
        }
        if (reserve.status === index_1.ReserveStatus.RELEASED) {
            return res.status(400).json({
                success: false,
                message: 'Reserve is already fully released',
                timestamp: new Date()
            });
        }
        const remainingAmount = reserve.reserveAmount - reserve.releasedAmount;
        const amountToRelease = releaseAmount || remainingAmount;
        if (amountToRelease > remainingAmount) {
            return res.status(400).json({
                success: false,
                message: 'Release amount exceeds remaining reserve amount',
                timestamp: new Date()
            });
        }
        const newReleasedAmount = reserve.releasedAmount + amountToRelease;
        const newStatus = newReleasedAmount >= reserve.reserveAmount
            ? index_1.ReserveStatus.RELEASED
            : index_1.ReserveStatus.PARTIALLY_RELEASED;
        const updatedReserve = {
            ...reserve,
            releasedAmount: newReleasedAmount,
            status: newStatus,
            actualReleaseDate: new Date(),
            releaseReason,
            releasedBy
        };
        reserveManagement[reserveIndex] = updatedReserve;
        if (reserve) {
            createLedgerEntry(reserve.transactionId, index_1.LedgerEntryType.RESERVE_RELEASE, amountToRelease, 'reserve-account', 'treasury-main', `Reserve released: ${releaseReason || 'Manual release'}`, releasedBy, reserve.id);
        }
        const response = {
            success: true,
            message: 'Reserve released successfully',
            data: updatedReserve,
            timestamp: new Date()
        };
        res.json(response);
    }
    catch (error) {
        console.error('Release reserve error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            timestamp: new Date()
        });
    }
});
router.get('/ledger', (req, res) => {
    try {
        const { transactionId, entryType, limit = '100', offset = '0' } = req.query;
        let filteredEntries = ledgerEntries;
        if (transactionId) {
            filteredEntries = filteredEntries.filter(entry => entry.transactionId === transactionId);
        }
        if (entryType) {
            filteredEntries = filteredEntries.filter(entry => entry.entryType === entryType);
        }
        filteredEntries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const limitNum = parseInt(limit);
        const offsetNum = parseInt(offset);
        const paginatedResults = filteredEntries.slice(offsetNum, offsetNum + limitNum);
        const response = {
            success: true,
            message: 'Ledger entries retrieved successfully',
            data: paginatedResults,
            timestamp: new Date()
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get ledger entries error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            timestamp: new Date()
        });
    }
});
router.get('/balances', (req, res) => {
    try {
        const balances = Object.fromEntries(accountBalances);
        const totalReserved = reserveManagement
            .filter(r => r.status === index_1.ReserveStatus.HELD || r.status === index_1.ReserveStatus.PARTIALLY_RELEASED)
            .reduce((sum, r) => sum + (r.reserveAmount - r.releasedAmount), 0);
        const pendingDisbursements = disbursementQueue
            .filter(d => d.status === index_1.DisbursementStatus.PENDING || d.status === index_1.DisbursementStatus.PROCESSING)
            .reduce((sum, d) => sum + d.amount, 0);
        const summary = {
            accounts: balances,
            metrics: {
                totalReserved,
                pendingDisbursements,
                availableLiquidity: (balances['treasury-main'] || 0) - pendingDisbursements
            },
            lastUpdated: new Date()
        };
        const response = {
            success: true,
            message: 'Account balances retrieved successfully',
            data: summary,
            timestamp: new Date()
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get balances error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            timestamp: new Date()
        });
    }
});
router.get('/dashboard', (req, res) => {
    try {
        const totalDisbursements = disbursementQueue.length;
        const pendingDisbursements = disbursementQueue.filter(d => d.status === index_1.DisbursementStatus.PENDING || d.status === index_1.DisbursementStatus.PROCESSING).length;
        const totalReserves = reserveManagement.length;
        const activeReserves = reserveManagement.filter(r => r.status === index_1.ReserveStatus.HELD || r.status === index_1.ReserveStatus.PARTIALLY_RELEASED).length;
        const totalReservedAmount = reserveManagement
            .filter(r => r.status === index_1.ReserveStatus.HELD || r.status === index_1.ReserveStatus.PARTIALLY_RELEASED)
            .reduce((sum, r) => sum + (r.reserveAmount - r.releasedAmount), 0);
        const totalPendingAmount = disbursementQueue
            .filter(d => d.status === index_1.DisbursementStatus.PENDING || d.status === index_1.DisbursementStatus.PROCESSING)
            .reduce((sum, d) => sum + d.amount, 0);
        const recentLedgerEntries = ledgerEntries
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 10);
        const dashboard = {
            summary: {
                totalDisbursements,
                pendingDisbursements,
                totalReserves,
                activeReserves,
                totalReservedAmount,
                totalPendingAmount,
                availableLiquidity: (accountBalances.get('treasury-main') || 0) - totalPendingAmount
            },
            recentActivity: recentLedgerEntries,
            accountBalances: Object.fromEntries(accountBalances)
        };
        const response = {
            success: true,
            message: 'Treasury dashboard data retrieved successfully',
            data: dashboard,
            timestamp: new Date()
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get treasury dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            timestamp: new Date()
        });
    }
});
router.post('/disbursements/bulk-process', (req, res) => {
    try {
        const { disbursementIds, action, processedBy, reason } = req.body;
        if (!disbursementIds || !Array.isArray(disbursementIds) || disbursementIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Disbursement IDs array is required',
                timestamp: new Date()
            });
        }
        const results = [];
        const errors = [];
        for (const id of disbursementIds) {
            try {
                const disbursementIndex = disbursementQueue.findIndex(d => d.id === id);
                if (disbursementIndex === -1) {
                    errors.push({ id, error: 'Disbursement not found' });
                    continue;
                }
                const disbursement = disbursementQueue[disbursementIndex];
                if (!disbursement) {
                    errors.push({ id, error: 'Disbursement not found' });
                    continue;
                }
                if (disbursement.status !== index_1.DisbursementStatus.PENDING &&
                    disbursement.status !== index_1.DisbursementStatus.PROCESSING) {
                    errors.push({ id, error: 'Invalid status for processing' });
                    continue;
                }
                const updatedDisbursement = {
                    ...disbursement,
                    status: action,
                    processedAt: new Date(),
                    processedBy,
                    failureReason: action === index_1.DisbursementStatus.FAILED ? reason : undefined,
                    reference: `bulk-${Date.now()}`,
                    updatedAt: new Date()
                };
                disbursementQueue[disbursementIndex] = updatedDisbursement;
                if (action === index_1.DisbursementStatus.PAID && disbursement) {
                    createLedgerEntry(disbursement.transactionId, index_1.LedgerEntryType.DISBURSEMENT, disbursement.amount, 'disbursement-queue', disbursement.recipientDetails.accountNumber, `Bulk payment processed to ${disbursement.recipientDetails.name}`, processedBy, updatedDisbursement.reference || undefined);
                }
                results.push({ id, status: 'success', data: updatedDisbursement });
            }
            catch (error) {
                errors.push({ id, error: 'Processing error' });
            }
        }
        const response = {
            success: true,
            message: `Bulk operation completed. ${results.length} successful, ${errors.length} errors.`,
            data: { results, errors },
            timestamp: new Date()
        };
        res.json(response);
    }
    catch (error) {
        console.error('Bulk process disbursements error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            timestamp: new Date()
        });
    }
});
exports.default = router;
//# sourceMappingURL=treasury-management.js.map