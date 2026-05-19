"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const react_1 = __importDefault(require("react"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const renderer_1 = require("@react-pdf/renderer");
const frameworkAgreement_1 = __importDefault(require("../documents/frameworkAgreement"));
const s3_1 = require("../utils/s3");
const router = express_1.default.Router();
const streamToBuffer = async (stream) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
};
const renderPdfBuffer = async (document) => {
    const instance = (0, renderer_1.pdf)(document);
    const stream = await instance.toBuffer();
    return streamToBuffer(stream);
};
const createEmailTransporter = () => {
    return nodemailer_1.default.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.SMTP_USER || 'your-email@example.com',
            pass: process.env.SMTP_PASS || 'your-app-password'
        }
    });
};
router.get('/download', async (req, res) => {
    try {
        const key = String(req.query.key || '').trim();
        const fileName = String(req.query.fileName || '').trim();
        if (!key) {
            return res.status(400).json({
                success: false,
                message: 'Document key is required'
            });
        }
        const { buffer, contentType } = await (0, s3_1.getDocumentFromS3)(key);
        const fallbackName = key.split('/').pop() || 'document';
        const downloadName = fileName || fallbackName;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
        res.send(buffer);
    }
    catch (error) {
        console.error('Download document error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch document from S3'
        });
    }
});
router.post('/framework-agreement', async (req, res) => {
    try {
        const payload = req.body || {};
        const document = react_1.default.createElement(frameworkAgreement_1.default, { data: payload });
        const buffer = await renderPdfBuffer(document);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="WHIZUNIK_Framework_Agreement.pdf"');
        res.send(buffer);
    }
    catch (error) {
        console.error('Generate framework agreement error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate framework agreement PDF'
        });
    }
});
router.post('/framework-agreement/email', async (req, res) => {
    try {
        const { recipientEmail, agreementData, subject } = req.body || {};
        if (!recipientEmail) {
            return res.status(400).json({
                success: false,
                message: 'Recipient email is required'
            });
        }
        const document = react_1.default.createElement(frameworkAgreement_1.default, { data: agreementData || {} });
        const buffer = await renderPdfBuffer(document);
        const transporter = createEmailTransporter();
        const resolvedSubject = subject || 'WHIZUNIK Framework Agreement';
        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@whizunik.com',
            to: recipientEmail,
            subject: resolvedSubject,
            text: 'Please find the framework agreement attached.',
            attachments: [
                {
                    filename: 'WHIZUNIK_Framework_Agreement.pdf',
                    content: buffer,
                    contentType: 'application/pdf'
                }
            ]
        });
        res.status(200).json({
            success: true,
            message: 'Framework agreement sent'
        });
    }
    catch (error) {
        console.error('Send framework agreement email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send framework agreement email'
        });
    }
});
exports.default = router;
//# sourceMappingURL=documents.js.map