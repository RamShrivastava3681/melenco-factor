"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastNotification = void 0;
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const winston_1 = __importDefault(require("winston"));
const http_1 = require("http");
const ws_1 = require("ws");
const auth_1 = __importDefault(require("./routes/auth"));
const entities_1 = __importDefault(require("./routes/entities"));
const transactions_1 = __importDefault(require("./routes/transactions"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const treasury_1 = __importDefault(require("./routes/treasury"));
const fee_limits_1 = __importDefault(require("./routes/fee-limits"));
const monitoring_1 = __importDefault(require("./routes/monitoring"));
const reports_1 = __importDefault(require("./routes/reports"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const noa_1 = __importDefault(require("./routes/noa"));
const currency_1 = __importDefault(require("./routes/currency"));
const documents_1 = __importDefault(require("./routes/documents"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const PORT = process.env.PORT || 6767;
const wss = new ws_1.WebSocketServer({
    server,
    path: '/notifications'
});
const notificationClients = new Set();
wss.on('connection', (ws) => {
    console.log('New notification client connected');
    notificationClients.add(ws);
    ws.on('close', () => {
        console.log('Notification client disconnected');
        notificationClients.delete(ws);
    });
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        notificationClients.delete(ws);
    });
});
const broadcastNotification = (notification) => {
    const message = JSON.stringify(notification);
    notificationClients.forEach((client) => {
        if (client.readyState === 1) {
            try {
                client.send(message);
            }
            catch (error) {
                console.error('Error sending notification:', error);
                notificationClients.delete(client);
            }
        }
    });
};
exports.broadcastNotification = broadcastNotification;
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    defaultMeta: { service: 'whizunik-factoring-backend' },
    transports: [
        new winston_1.default.transports.File({ filename: '../logs/error.log', level: 'error' }),
        new winston_1.default.transports.File({ filename: '../logs/combined.log' }),
        new winston_1.default.transports.Console({
            format: winston_1.default.format.simple()
        })
    ],
});
app.use((0, helmet_1.default)({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
const configuredOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
const allowedOrigins = new Set([
    ...configuredOrigins,
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://factor.whizunikhub.com'
]);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path} - ${req.ip}`);
    next();
});
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Whizunik Factoring Backend is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
    });
});
app.use('/api/auth', auth_1.default);
app.use('/api/entities', entities_1.default);
app.use('/api/transactions', transactions_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.use('/api/treasury', treasury_1.default);
app.use('/api/fee-limits', fee_limits_1.default);
app.use('/api/monitoring', monitoring_1.default);
app.use('/api/reports', reports_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/noa', noa_1.default);
app.use('/api/currency', currency_1.default);
app.use('/api/documents', documents_1.default);
app.use((error, req, res, next) => {
    logger.error('Unhandled error:', error);
    res.status(error.status || 500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        timestamp: new Date().toISOString(),
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested endpoint does not exist',
        timestamp: new Date().toISOString(),
    });
});
const connectDB = async () => {
    try {
        mongoose_1.default.set('strictQuery', false);
        mongoose_1.default.connection.on('connected', () => {
            logger.info('🟢 Connected to MongoDB Atlas successfully');
        });
        mongoose_1.default.connection.on('error', (err) => {
            logger.warn('🔴 MongoDB connection error - using mock data');
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger.warn('🟡 Disconnected from MongoDB - using mock data');
        });
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whizunik-factoring';
        await Promise.race([
            mongoose_1.default.connect(mongoURI, {
                family: 4,
                serverSelectionTimeoutMS: 15000,
                connectTimeoutMS: 15000,
                maxPoolSize: 10,
                socketTimeoutMS: 10000,
                bufferCommands: true,
                retryWrites: true,
                retryReads: true
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 15000))
        ]);
        logger.info('✅ MongoDB Atlas connected successfully');
        logger.info(`📊 Database: ${mongoose_1.default.connection.name || 'whizunik'}`);
        return true;
    }
    catch (error) {
        logger.warn('⚠️ MongoDB unavailable - continuing with mock data mode');
        logger.info('💡 All features work normally with mock data');
        return false;
    }
};
process.on('SIGINT', async () => {
    logger.info('🔄 Shutting down gracefully...');
    try {
        if (mongoose_1.default.connection.readyState !== 0) {
            await mongoose_1.default.connection.close();
            logger.info('🔴 MongoDB connection closed');
        }
    }
    catch (e) {
        logger.warn('Warning: Error closing MongoDB connection');
    }
    process.exit(0);
});
const startServer = async () => {
    try {
        const isMongoConnected = await connectDB();
        if (isMongoConnected) {
            logger.info('✅ MongoDB connection established - Data will be persisted');
        }
        else {
            logger.info('📊 Running in development mode - Using mock data');
        }
        server.listen(PORT, () => {
            logger.info(`🚀 Whizunik Factoring Backend running on port ${PORT}`);
            logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
            logger.info(`📡 WebSocket notifications: ws://localhost:${PORT}/notifications`);
            if (process.env.NODE_ENV === 'development') {
                logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:8080'}`);
            }
        });
    }
    catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await mongoose_1.default.disconnect();
    process.exit(0);
});
startServer();
exports.default = app;
//# sourceMappingURL=index.js.map