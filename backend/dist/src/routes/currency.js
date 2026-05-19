"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
let cache = null;
router.get('/rates', async (req, res) => {
    try {
        const base = String(req.query.base || 'USD').toUpperCase();
        if (cache && cache.base === base && Date.now() - cache.lastUpdated < CACHE_TTL_MS) {
            return res.json({
                success: true,
                data: {
                    base,
                    rates: cache.rates,
                    cached: true,
                    lastUpdated: cache.lastUpdated,
                },
            });
        }
        const apiKey = process.env.EXCHANGE_RATE_API_KEY || process.env.CURRENCY_API_KEY;
        if (!apiKey) {
            return res.status(500).json({
                success: false,
                message: 'Currency API key is not configured',
            });
        }
        const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Currency API request failed with status ${response.status}`);
        }
        const json = await response.json();
        if (json?.result !== 'success' || !json?.conversion_rates) {
            throw new Error(json?.['error-type'] || 'Invalid response from currency API');
        }
        const rates = json.conversion_rates;
        cache = {
            base,
            rates,
            lastUpdated: Date.now(),
        };
        res.json({
            success: true,
            data: {
                base,
                rates,
                cached: false,
                lastUpdated: cache.lastUpdated,
            },
        });
    }
    catch (error) {
        if (cache) {
            return res.json({
                success: true,
                data: {
                    base: cache.base,
                    rates: cache.rates,
                    cached: true,
                    lastUpdated: cache.lastUpdated,
                    stale: true,
                },
            });
        }
        res.status(500).json({
            success: false,
            message: error?.message || 'Failed to fetch currency rates',
        });
    }
});
exports.default = router;
//# sourceMappingURL=currency.js.map