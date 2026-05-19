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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_dns_1 = __importDefault(require("node:dns"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const XLSX = __importStar(require("xlsx"));
const schemas_1 = require("./src/models/schemas");
const { PDFParse } = require('pdf-parse');
dotenv_1.default.config();
node_dns_1.default.setServers(['8.8.8.8', '1.1.1.1']);
const consigneeOverrideByFile = {
    'Captain Corsaire Invoice.pdf': 'CAPTAIN CORSAIRE',
    'COMPASS TEX LIMITED Invoice.pdf': 'NITZSCHE FASHION GMBH & CO KG',
    'Diesel SPA - Canada Invoice.pdf': 'Sample Buyer Corp',
    'Inv XL 33.xls': 'MANOR AG BASEL',
    'INV-53-655-2025 REVISED.pdf': 'MARINA RETAILS CORPORATION',
    'INVOICE  PL - DREX0045.pdf': 'TO THE ORDER',
    'JOE BROWNS LIMITED Invoice.pdf': 'REVOLVER INC LTD',
    'Mossy Oak Invoice.pdf': 'M/S ASSET APPAREL FZ-LLC',
    'REVOLVER INC LTD Invoice.pdf': 'REVOLVER INC LTD',
    'STAR DESIGN GROUP INC Invoice.pdf': 'STARS DESIGN GROUP, INC',
    'TBS Technisynthese Invoice.pdf': 'TBS TECHNISYNTHESE',
    'The Sting Sourcing & Productions Holding B.V.pdf': 'The Sting Sourcing & Productions Holding B.V.',
    'UNITCOTTON APS Invoice.pdf': 'UNITCOTTON APS',
    'VOIA FASHION Invoice.pdf': 'VOIA FASHION C/O IDP EXPRESS S.'
};
const normalizeLine = (value) => value.replace(/\s+/g, ' ').trim();
const cleanConsigneeName = (raw) => {
    let line = normalizeLine(raw)
        .replace(/^consignee\s*[:\-]?\s*/i, '')
        .replace(/^buyer\s*[:\-]?\s*/i, '')
        .replace(/^name\s*[:\-]?\s*/i, '')
        .trim();
    if (!line) {
        return '';
    }
    line = line.replace(/[|]+/g, ' ').trim();
    return line;
};
const isTemplateLabel = (value) => {
    const v = value.toLowerCase();
    return (v.length < 3 ||
        /delivery\s*address/.test(v) ||
        /deliver\s*address/.test(v) ||
        /buyer\s*name/.test(v) ||
        /if\s*other\s*than\s*consignee/.test(v) ||
        /notify/.test(v) ||
        /^address$/.test(v) ||
        /^consignee$/.test(v) ||
        /^to\s*the\s*order$/.test(v) ||
        /^[-]+$/.test(v));
};
const bestColumnValue = (line) => {
    const parts = line.split(/\s{2,}/).map((p) => cleanConsigneeName(p)).filter(Boolean);
    if (parts.length === 0) {
        return '';
    }
    const firstGood = parts.find((p) => !isTemplateLabel(p));
    return firstGood || '';
};
const findConsigneeInText = (text) => {
    const lines = text
        .split(/\r?\n/)
        .map((line) => normalizeLine(line))
        .filter((line) => line.length > 0);
    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i] ?? '';
        if (/^consignee\b/i.test(line)) {
            const inlineMatch = line.match(/^consignee\s*[:\-]?\s*(.+)$/i);
            if (inlineMatch && inlineMatch[1]) {
                const cleaned = bestColumnValue(inlineMatch[1]);
                if (cleaned) {
                    return cleaned;
                }
            }
            for (let j = i + 1; j < Math.min(i + 6, lines.length); j += 1) {
                const candidate = bestColumnValue(lines[j] ?? '');
                if (candidate && !isTemplateLabel(candidate) && !/^(address|city|country|phone|email|tax|gst|vat|postcode|pincode)\b/i.test(candidate)) {
                    return candidate;
                }
            }
        }
    }
    const blockMatch = text.match(/consignee\s*[:\-]?\s*([^\n\r]+)/i);
    return blockMatch?.[1] ? cleanConsigneeName(blockMatch[1]) : '';
};
const extractConsigneeFromPdf = async (filePath) => {
    const buffer = node_fs_1.default.readFileSync(filePath);
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    await parser.destroy();
    return findConsigneeInText(parsed?.text || '');
};
const extractConsigneeFromXls = (filePath) => {
    const workbook = XLSX.readFile(filePath, { cellText: true, cellDates: false });
    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
            continue;
        }
        const rows = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            blankrows: false,
            raw: false
        });
        for (let r = 0; r < rows.length; r += 1) {
            const row = rows[r] || [];
            for (let c = 0; c < row.length; c += 1) {
                const cell = normalizeLine(String(row[c] ?? ''));
                if (!/consignee/i.test(cell)) {
                    continue;
                }
                const inline = cell.match(/consignee\s*[:\-]?\s*(.+)$/i);
                if (inline && inline[1]) {
                    const cleaned = cleanConsigneeName(inline[1]);
                    if (cleaned) {
                        return cleaned;
                    }
                }
                const rightCell = row[c + 1];
                if (rightCell) {
                    const cleaned = cleanConsigneeName(String(rightCell));
                    if (cleaned) {
                        return cleaned;
                    }
                }
                const nextRow = rows[r + 1] || [];
                const below = nextRow[c] || nextRow[c + 1];
                if (below) {
                    const cleaned = cleanConsigneeName(String(below));
                    if (cleaned) {
                        return cleaned;
                    }
                }
            }
        }
    }
    return '';
};
const extractConsignee = async (filePath) => {
    if (/\.pdf$/i.test(filePath)) {
        return extractConsigneeFromPdf(filePath);
    }
    if (/\.xls$/i.test(filePath) || /\.xlsx$/i.test(filePath)) {
        return extractConsigneeFromXls(filePath);
    }
    return '';
};
const makeEntityId = (prefix, name) => {
    const hash = node_crypto_1.default.createHash('sha1').update(name.toLowerCase().trim()).digest('hex').slice(0, 10).toUpperCase();
    return `${prefix}-${hash}`;
};
const makeFallbackEmail = (prefix, entityId) => {
    return `${prefix}.${entityId.toLowerCase()}@imported.local`;
};
const makeEntityPayload = (type, name, entityId) => {
    const email = makeFallbackEmail(type, entityId);
    return {
        entityId,
        name,
        currency: 'USD',
        type,
        status: 'active',
        riskCategory: 'medium',
        riskScore: 70,
        contactEmail: email,
        phone: '+10000000000',
        address: 'Imported from invoice records',
        city: 'Unknown',
        state: 'Unknown',
        country: 'Unknown',
        pincode: '000000',
        contactPersonName: name,
        contactPersonDesignation: type === 'buyer' ? 'Consignee' : 'Supplier',
        contactPersonEmail: email,
        contactPersonPhone: '+10000000000',
        creditLimit: type === 'buyer' ? 500000 : 0,
        totalLimitSanctioned: type === 'supplier' ? 500000 : 0,
        usedLimit: 0,
        usedCredit: 0,
        utilizedLimit: 0,
        availableLimit: 500000,
        email,
        advanceRate: '80',
        gracePeriod: '5',
        transactionFees: {
            days0to30: '2.5',
            days31to60: '3.0',
            days61to90: '3.5',
            days91to120: '4.0',
            days121to150: '4.5'
        },
        feeDeductionMethod: 'from_advance',
        feeChargeMethod: 'face_value',
        feeTimingMethod: 'prorated_advance',
        noaRequired: false,
        collateralTaken: false,
        lateFees: '1',
        lateFeesFrequency: 'monthly'
    };
};
const connectMongo = async () => {
    const mongoCandidates = [
        process.env.MONGODB_URI,
        'mongodb://127.0.0.1:27017/whizunik-factoring',
        'mongodb://localhost:27017/whizunik-factoring'
    ].filter((uri) => Boolean(uri));
    let lastError;
    for (const mongoUri of mongoCandidates) {
        try {
            await mongoose_1.default.connect(mongoUri, {
                family: 4,
                serverSelectionTimeoutMS: 15000,
                connectTimeoutMS: 15000
            });
            return;
        }
        catch (error) {
            lastError = error;
            if (mongoose_1.default.connection.readyState !== 0) {
                await mongoose_1.default.disconnect();
            }
        }
    }
    throw lastError;
};
const syncInvoiceParties = async () => {
    const invoicesDir = node_path_1.default.resolve(__dirname, '../invoices');
    if (!node_fs_1.default.existsSync(invoicesDir)) {
        throw new Error(`Invoices directory not found: ${invoicesDir}`);
    }
    const invoiceFiles = node_fs_1.default
        .readdirSync(invoicesDir)
        .filter((name) => /\.(pdf|xls|xlsx)$/i.test(name))
        .sort((a, b) => a.localeCompare(b));
    await connectMongo();
    console.log(`Connected to MongoDB: ${mongoose_1.default.connection.name}`);
    const buyerIdByName = new Map();
    const supplierIdByName = new Map();
    const usedBuyerIds = new Set();
    const usedSupplierIds = new Set();
    let txUpdated = 0;
    for (const fileName of invoiceFiles) {
        const filePath = node_path_1.default.join(invoicesDir, fileName);
        const transaction = await schemas_1.TransactionModel.findOne({ invoiceNumber: fileName });
        if (!transaction) {
            console.log(`Skipped ${fileName}: no matching transaction found.`);
            continue;
        }
        const extractedBuyerName = await extractConsignee(filePath);
        const buyerName = consigneeOverrideByFile[fileName] || extractedBuyerName || transaction.buyerName || 'Unknown Consignee';
        const supplierName = transaction.supplierName || fileName.replace(/\.(pdf|xls|xlsx)$/i, '');
        const buyerId = makeEntityId('BUYER', buyerName);
        const supplierId = makeEntityId('SUPPLIER', supplierName);
        usedBuyerIds.add(buyerId);
        usedSupplierIds.add(supplierId);
        buyerIdByName.set(buyerName, buyerId);
        supplierIdByName.set(supplierName, supplierId);
        await schemas_1.EntityModel.updateOne({ entityId: buyerId }, { $setOnInsert: makeEntityPayload('buyer', buyerName, buyerId) }, { upsert: true });
        await schemas_1.EntityModel.updateOne({ entityId: supplierId }, { $setOnInsert: makeEntityPayload('supplier', supplierName, supplierId) }, { upsert: true });
        await schemas_1.TransactionModel.updateOne({ _id: transaction._id }, {
            $set: {
                buyerId,
                buyerName,
                buyerEmail: makeFallbackEmail('buyer', buyerId),
                supplierId,
                supplierName
            }
        });
        txUpdated += 1;
        console.log(`Updated ${fileName} -> Consignee: ${buyerName}`);
    }
    const buyerCount = await schemas_1.EntityModel.countDocuments({ type: 'buyer' });
    const supplierCount = await schemas_1.EntityModel.countDocuments({ type: 'supplier' });
    await schemas_1.EntityModel.deleteMany({
        type: 'buyer',
        entityId: { $regex: /^BUYER-/, $nin: Array.from(usedBuyerIds) },
        email: { $regex: /@imported\.local$/ }
    });
    await schemas_1.EntityModel.deleteMany({
        type: 'supplier',
        entityId: { $regex: /^SUPPLIER-/, $nin: Array.from(usedSupplierIds) },
        email: { $regex: /@imported\.local$/ }
    });
    const buyerCountAfterCleanup = await schemas_1.EntityModel.countDocuments({ type: 'buyer' });
    const supplierCountAfterCleanup = await schemas_1.EntityModel.countDocuments({ type: 'supplier' });
    console.log(`Party sync complete. Transactions updated: ${txUpdated}`);
    console.log(`Buyers in DB: ${buyerCount}, Suppliers in DB: ${supplierCount}`);
    console.log(`After cleanup -> Buyers in DB: ${buyerCountAfterCleanup}, Suppliers in DB: ${supplierCountAfterCleanup}`);
};
if (require.main === module) {
    syncInvoiceParties()
        .catch((error) => {
        console.error('Invoice party sync failed:', error);
        process.exitCode = 1;
    })
        .finally(async () => {
        if (mongoose_1.default.connection.readyState !== 0) {
            await mongoose_1.default.disconnect();
        }
    });
}
exports.default = syncInvoiceParties;
//# sourceMappingURL=sync-invoice-parties.js.map