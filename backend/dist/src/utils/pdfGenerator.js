"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFrameworkAgreementPDF = generateFrameworkAgreementPDF;
const jsx_runtime_1 = require("react/jsx-runtime");
const renderer_1 = require("@react-pdf/renderer");
const frameworkAgreement_1 = __importDefault(require("../documents/frameworkAgreement"));
async function generateFrameworkAgreementPDF(data) {
    try {
        const buffer = await (0, renderer_1.renderToBuffer)((0, jsx_runtime_1.jsx)(frameworkAgreement_1.default, { data: data }));
        return buffer;
    }
    catch (error) {
        console.error('Error generating React PDF:', error);
        throw error;
    }
}
//# sourceMappingURL=pdfGenerator.js.map