"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const schemas_1 = require("../models/schemas");
const router = express_1.default.Router();
router.get('/kpis', async (req, res) => {
    try {
        const totalTransactions = await schemas_1.TransactionModel.countDocuments();
        const totalFeesEarned = await schemas_1.TransactionModel.aggregate([
            { $group: { _id: null, total: { $sum: '$feeAmount' } } }
        ]);
        const totalReserves = await schemas_1.TransactionModel.aggregate([
            { $group: { _id: null, total: { $sum: '$reserveAmount' } } }
        ]);
        const totalSuppliersCount = await schemas_1.EntityModel.countDocuments({ type: 'supplier' });
        const totalCreditLimit = await schemas_1.EntityModel.aggregate([
            { $match: { type: 'supplier' } },
            { $group: { _id: null, total: { $sum: '$creditLimit' } } }
        ]);
        const totalUsedLimit = await schemas_1.EntityModel.aggregate([
            { $match: { type: 'supplier' } },
            { $group: { _id: null, total: { $sum: '$usedLimit' } } }
        ]);
        const feesEarned = totalFeesEarned[0]?.total || 0;
        const reserves = totalReserves[0]?.total || 0;
        const creditLimit = totalCreditLimit[0]?.total || 1;
        const usedLimit = totalUsedLimit[0]?.total || 0;
        const portfolioUtilization = creditLimit > 0 ? (usedLimit / creditLimit) * 100 : 0;
        const kpis = {
            totalTransactions: {
                value: totalTransactions,
                change: 0,
                trend: 'up'
            },
            totalFeesEarned: {
                value: feesEarned,
                change: 0,
                trend: 'up',
                currency: 'USD'
            },
            totalReserves: {
                value: reserves,
                change: 0,
                trend: 'up',
                currency: 'USD'
            },
            portfolioUtilization: {
                value: Math.round(portfolioUtilization * 100) / 100,
                change: 0,
                trend: 'up',
                unit: '%'
            }
        };
        res.json({
            success: true,
            data: kpis,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Dashboard KPI error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard KPIs',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});
router.get('/charts', async (req, res) => {
    try {
        const chartsData = {
            buyerExposure: [
                { name: 'Tech Innovations Inc', value: 12500000, percentage: 35.2 },
                { name: 'Global Manufacturing Ltd', value: 9200000, percentage: 25.9 },
                { name: 'Retail Solutions Corp', value: 7800000, percentage: 22.0 },
                { name: 'Energy Systems LLC', value: 4300000, percentage: 12.1 },
                { name: 'Healthcare Partners', value: 1700000, percentage: 4.8 }
            ],
            supplierVolume: [
                { month: 'Jan', value: 18500000 },
                { month: 'Feb', value: 22100000 },
                { month: 'Mar', value: 19800000 },
                { month: 'Apr', value: 25600000 },
                { month: 'May', value: 21900000 },
                { month: 'Jun', value: 28400000 }
            ],
            openInvoices: [
                { status: 'Current (0-30 days)', count: 156, amount: 18750000 },
                { status: 'Past Due (31-60 days)', count: 43, amount: 5200000 },
                { status: 'Overdue (60+ days)', count: 21, amount: 2800000 }
            ],
            overdueInvoices: [
                { supplier: 'Premium Textiles Ltd', amount: 850000, daysOverdue: 67 },
                { supplier: 'Advanced Components Inc', amount: 620000, daysOverdue: 45 },
                { supplier: 'Quality Materials Co', amount: 480000, daysOverdue: 78 },
                { supplier: 'Industrial Solutions', amount: 320000, daysOverdue: 52 }
            ]
        };
        res.json({
            success: true,
            data: chartsData,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Dashboard charts error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard charts data',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.js.map