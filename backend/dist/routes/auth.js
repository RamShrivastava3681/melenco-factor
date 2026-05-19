"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
const getRequiredEnv = (key) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
};
const getJwtSecret = () => getRequiredEnv('JWT_SECRET');
const getDemoUser = () => ({
    email: getRequiredEnv('ADMIN_EMAIL'),
    password: getRequiredEnv('ADMIN_PASSWORD'),
    name: 'Sankalp',
    role: 'admin',
    id: '1'
});
router.post('/login', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        const { email, password } = req.body;
        const demoUser = getDemoUser();
        if (email !== demoUser.email || password !== demoUser.password) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        const token = jsonwebtoken_1.default.sign({
            id: demoUser.id,
            email: demoUser.email,
            name: demoUser.name,
            role: demoUser.role
        }, getJwtSecret(), { expiresIn: '24h' });
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: demoUser.id,
                    email: demoUser.email,
                    name: demoUser.name,
                    role: demoUser.role
                }
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, getJwtSecret());
        res.json({
            success: true,
            message: 'Token is valid',
            data: {
                user: {
                    id: decoded.id,
                    email: decoded.email,
                    name: decoded.name,
                    role: decoded.role
                }
            }
        });
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map