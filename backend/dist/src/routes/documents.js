"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const uuid_1 = require("uuid");
const puppeteer_1 = __importDefault(require("puppeteer"));
const pdfGenerator_1 = require("../utils/pdfGenerator");
const dynamoRepository_1 = require("../data/dynamoRepository");
const s3_1 = require("../utils/s3");
const router = express_1.default.Router();
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
const getFrameworkFrontendBaseUrl = () => {
    return (process.env.FRONTEND_URL ||
        process.env.NOA_FRONTEND_URL ||
        process.env.LOCALHOST_FRONTEND_URL ||
        'https://factor.whizunikhub.com').replace(/\/+$/, '');
};
const generateFrameworkToken = () => {
    return `fa_${(0, uuid_1.v4)().replace(/-/g, '')}`;
};
const generateSignedFrameworkPdfHtml = (agreementData) => {
    const signedAt = agreementData.acknowledgedAt || agreementData.updatedAt;
    const signedDate = signedAt ? new Date(signedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
    const signedTime = signedAt ? new Date(signedAt).toLocaleTimeString() : '';
    const agreementPayload = agreementData.agreementData || {};
    const buyerName = agreementData.buyerName || agreementPayload?.buyer?.name || '-';
    const sellerName = agreementData.sellerName || agreementPayload?.seller?.name || '-';
    const buyerAddress = agreementPayload?.buyer?.address || '-';
    const sellerAddress = agreementPayload?.seller?.address || '-';
    const docRef = agreementPayload?.docRef || agreementData.agreementId || 'WHZ-FA-2026-05';
    const envelopeId = agreementPayload?.envelopeId || 'DS-8A3E-4F1C-9B2D-57A0';
    const sellerTaxId = agreementPayload?.sellerTaxId || '-';
    const sellerCorporateId = agreementPayload?.sellerCorporateId || '-';
    const sellerContact = agreementPayload?.sellerContactPerson || '-';
    const sellerEmail = agreementPayload?.sellerEmail || '-';
    const sellerPhone = agreementPayload?.sellerPhone || '-';
    const factoringFee = agreementPayload?.factoringFee || '-';
    const advanceRate = agreementPayload?.advanceRate || '-';
    const setupFee = agreementPayload?.setupFee || '-';
    const lateFee = agreementPayload?.lateFee || '-';
    const referenceRate = agreementPayload?.referenceRate || '-';
    const transactionFeeTiers = agreementPayload?.transactionFeeTiers || [];
    const paymentTerms = agreementPayload?.paymentTerms || [];
    const schedule1 = agreementPayload?.schedule1 || {};
    const primaryContacts = schedule1.primaryContacts || [];
    const bankAccounts = schedule1.bankAccounts || [];
    const signatoryData = agreementData.signatoryData || {};
    const signerName = signatoryData.fullName || '-';
    const signerPosition = signatoryData.position || '-';
    const signerCity = signatoryData.location?.city || '-';
    const signerCountry = signatoryData.location?.country || '-';
    const signerLatitude = signatoryData.location?.latitude || 'N/A';
    const signerLongitude = signatoryData.location?.longitude || 'N/A';
    const signerIp = signatoryData.ipAddress || 'unknown';
    const feeTableRows = transactionFeeTiers.map((tier) => `
    <tr>
      <td style="padding: 8px 10px; border-right: 1px solid #e5e7eb; text-align: left;">${tier.range || '-'}</td>
      <td style="padding: 8px 10px; border-right: 1px solid #e5e7eb; text-align: left;">${tier.fee || '-'}</td>
      <td style="padding: 8px 10px; border-right: 1px solid #e5e7eb; text-align: left;">${factoringFee}</td>
      <td style="padding: 8px 10px; text-align: left;">${advanceRate}</td>
    </tr>
  `).join('');
    const contactsTableRows = primaryContacts.map((contact) => `
    <tr>
      <td style="padding: 8px 10px; border-right: 1px solid #e5e7eb;">${contact.firstName || '-'}</td>
      <td style="padding: 8px 10px; border-right: 1px solid #e5e7eb;">${contact.lastName || '-'}</td>
      <td style="padding: 8px 10px; border-right: 1px solid #e5e7eb;">${contact.email || '-'}</td>
      <td style="padding: 8px 10px;">${contact.phone || '-'}</td>
    </tr>
  `).join('');
    const bankAccountsRows = bankAccounts.map((account) => `
    <tr>
      <td style="padding: 8px 10px; border-right: 1px solid #e5e7eb;">${account.currency || '-'}</td>
      <td style="padding: 8px 10px; border-right: 1px solid #e5e7eb;">${account.accountHolder || '-'}</td>
      <td style="padding: 8px 10px; border-right: 1px solid #e5e7eb; font-family: monospace; font-size: 10pt;">${account.accountNumber || '-'}</td>
      <td style="padding: 8px 10px;">${account.swiftCode || '-'}</td>
    </tr>
  `).join('');
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>WHIZUNIK Framework Agreement - Signed</title>
  <style>
    @page { 
      margin: 15mm;
      @bottom-center {
        content: "Page " counter(page) " of " counter(pages);
        font-size: 9pt;
        color: #999;
      }
    }
    * { margin: 0; padding: 0; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      color: #1f2937; 
      line-height: 1.6; 
      font-size: 11pt;
      background: #ffffff;
    }
    .watermark { 
      position: fixed; 
      top: 50%; 
      left: 50%; 
      transform: translate(-50%, -50%) rotate(-45deg); 
      font-size: 72pt; 
      color: rgba(15, 118, 110, 0.08); 
      z-index: -1;
      pointer-events: none;
    }
    .page { page-break-after: always; }
    .last-page { page-break-after: avoid; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 2px solid #0f766e;
    }
    .header-logo { font-size: 16pt; font-weight: bold; color: #0f766e; letter-spacing: 1px; }
    .header-title { font-size: 11pt; font-weight: bold; color: #0b1f3a; text-transform: uppercase; }
    .header-meta { font-size: 9pt; color: #6b7280; text-align: right; }
    .title { 
      text-align: center; 
      font-size: 24pt; 
      font-weight: bold; 
      color: #0b1f3a; 
      margin: 24px 0 12px 0;
      letter-spacing: 2px;
    }
    .subtitle { 
      text-align: center; 
      font-size: 12pt; 
      color: #64748b; 
      margin-bottom: 20px;
      letter-spacing: 0.5px;
    }
    .intro-block {
      background: #f8fafc;
      border-left: 3px solid #0f766e;
      padding: 12px;
      margin: 16px 0 22px 0;
      font-size: 10pt;
      line-height: 1.5;
    }
    .section-heading {
      font-size: 13pt;
      font-weight: bold;
      color: #0b1f3a;
      margin-top: 18px;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
      letter-spacing: 0.3px;
    }
    .subsection-heading {
      font-size: 11pt;
      font-weight: bold;
      color: #0b1f3a;
      margin-top: 12px;
      margin-bottom: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 10pt;
    }
    table thead tr {
      background: #f8fafc;
    }
    table th {
      padding: 9px 10px;
      border: 1px solid #e5e7eb;
      text-align: left;
      font-weight: bold;
      color: #0b1f3a;
      background: #f8fafc;
    }
    table td {
      padding: 9px 10px;
      border: 1px solid #e5e7eb;
      text-align: left;
    }
    table tr:nth-child(even) {
      background: #f9fafb;
    }
    .info-row { 
      margin: 5px 0; 
      font-size: 10pt;
    }
    .info-label { 
      font-weight: bold; 
      color: #0b1f3a;
      display: inline-block;
      min-width: 150px;
    }
    .divider {
      height: 1px;
      background: #e2e8f0;
      margin: 18px 0 12px 0;
    }
    .signature-section {
      margin-top: 30px;
      page-break-inside: avoid;
    }
    .signature-title {
      font-size: 13pt;
      font-weight: bold;
      color: #0b1f3a;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .signature-container {
      display: flex;
      gap: 20px;
      margin-top: 18px;
      page-break-inside: avoid;
    }
    .signature-block {
      flex: 1;
      border: 1px solid #d1d5db;
      padding: 16px;
      background: #fcfcfd;
      border-radius: 6px;
      min-height: 200px;
    }
    .signature-block-title {
      font-weight: bold;
      color: #0b1f3a;
      margin-bottom: 12px;
      font-size: 11pt;
    }
    .signature-image-box {
      border: 1px solid #d1d5db;
      padding: 8px;
      background: white;
      margin: 12px 0;
      min-height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .signature-image-box img {
      max-width: 100%;
      max-height: 100px;
      object-fit: contain;
    }
    .signature-line {
      border-bottom: 1px solid #1f2937;
      margin: 20px 0 8px 0;
      min-height: 50px;
    }
    .signature-detail {
      font-size: 9pt;
      margin: 6px 0;
      color: #1f2937;
    }
    .signature-detail-label {
      font-weight: bold;
      color: #0b1f3a;
    }
    .photo-verification {
      margin-top: 24px;
      page-break-inside: avoid;
    }
    .photo-verification-title {
      font-weight: bold;
      color: #0b1f3a;
      margin-bottom: 8px;
      font-size: 11pt;
    }
    .photo-box {
      border: 1px solid #d1d5db;
      padding: 8px;
      background: #f8fafc;
      display: inline-block;
    }
    .photo-box img {
      max-width: 200px;
      max-height: 200px;
      object-fit: contain;
      display: block;
    }
    .signed-badge {
      margin-top: 24px;
      padding: 12px;
      border: 2px solid #16a34a;
      background: #f0fdf4;
      color: #15803d;
      font-weight: bold;
      text-align: center;
      border-radius: 6px;
      page-break-inside: avoid;
    }
    .footer {
      margin-top: 24px;
      padding-top: 8px;
      border-top: 1px solid #d1d5db;
      font-size: 8pt;
      color: #6b7280;
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="watermark">SIGNED</div>

  <!-- PAGE 1: COVER PAGE WITH AGREEMENT DETAILS -->
  <div class="page">
    <div class="header">
      <span class="header-logo">WHIZUNIK</span>
      <span class="header-title">Framework Agreement</span>
      <div class="header-meta">
        <div>Ref: ${docRef}</div>
        <div>Envelope: ${envelopeId}</div>
      </div>
    </div>

    <div class="title">FRAMEWORK AGREEMENT</div>
    <div class="subtitle">Seller Financing Agreement - SIGNED</div>

    <div class="intro-block">
      <p style="margin: 0;">
        This Framework Agreement ("Agreement") is entered into between WHIZUNIK, a company engaged in international trade finance, 
        receivables financing, invoice factoring, export finance, and supply chain financing solutions, and the Seller identified below. 
        This agreement has been duly executed and acknowledged by authorized signatories.
      </p>
    </div>

    <div class="section-heading">Seller Identification</div>
    <table>
      <thead><tr><th style="width: 35%;">Field</th><th style="width: 65%;">Details</th></tr></thead>
      <tbody>
        <tr><td>Legal Entity Name</td><td>${sellerName}</td></tr>
        <tr><td>Registered Office</td><td>${sellerAddress}</td></tr>
        <tr><td>GST Number</td><td>${sellerTaxId}</td></tr>
        <tr><td>CIN</td><td>${sellerCorporateId}</td></tr>
        <tr><td>Contact Person</td><td>${sellerContact}</td></tr>
        <tr><td>Email Address</td><td>${sellerEmail}</td></tr>
        <tr><td>Telephone Number</td><td>${sellerPhone}</td></tr>
      </tbody>
    </table>

    <div class="divider"></div>

    <div class="section-heading">Buyer Information</div>
    <table>
      <thead><tr><th style="width: 35%;">Field</th><th style="width: 65%;">Details</th></tr></thead>
      <tbody>
        <tr><td>Buyer Name</td><td>${buyerName}</td></tr>
        <tr><td>Buyer Address</td><td>${buyerAddress}</td></tr>
      </tbody>
    </table>

    <div class="divider"></div>

    <div class="section-heading">Payment Terms and Fees</div>
    <table>
      <thead>
        <tr>
          <th style="width: 25%;">Payment Term</th>
          <th style="width: 25%;">Transaction Fee</th>
          <th style="width: 25%;">Factoring Fee</th>
          <th style="width: 25%;">Advance Rate</th>
        </tr>
      </thead>
      <tbody>
        ${feeTableRows || '<tr><td colspan="4" style="text-align: center; color: #999;">No transaction fees configured</td></tr>'}
      </tbody>
    </table>

    <div class="divider"></div>

    <div class="section-heading">Financial Terms</div>
    <div class="info-row">
      <span class="info-label">Setup Fee:</span> ${setupFee}
    </div>
    <div class="info-row">
      <span class="info-label">Late Fee (Monthly):</span> ${lateFee}
    </div>
    <div class="info-row">
      <span class="info-label">Reference Rate:</span> ${referenceRate}
    </div>
  </div>

  <!-- PAGE 2: SCHEDULE 1 & CONTACT DETAILS -->
  <div class="page">
    <div class="header">
      <span class="header-logo">WHIZUNIK</span>
      <span class="header-title">Schedule 1 - Contact & Banking</span>
      <div class="header-meta">
        <div>Ref: ${docRef}</div>
      </div>
    </div>

    <div class="section-heading">SCHEDULE 1 - Contact and Bank Account Details</div>

    <div class="subsection-heading">Primary Contact Persons</div>
    <table>
      <thead>
        <tr>
          <th style="width: 20%;">First Name</th>
          <th style="width: 20%;">Last Name</th>
          <th style="width: 35%;">Email</th>
          <th style="width: 25%;">Phone Number</th>
        </tr>
      </thead>
      <tbody>
        ${contactsTableRows || '<tr><td colspan="4" style="text-align: center; color: #999;">No contacts provided</td></tr>'}
      </tbody>
    </table>

    <div class="subsection-heading" style="margin-top: 24px;">Banking Information</div>
    <table>
      <thead>
        <tr>
          <th style="width: 15%;">Currency</th>
          <th style="width: 35%;">Bank / Account Holder</th>
          <th style="width: 30%;">Account Number</th>
          <th style="width: 20%;">SWIFT</th>
        </tr>
      </thead>
      <tbody>
        ${bankAccountsRows || '<tr><td colspan="4" style="text-align: center; color: #999;">No bank accounts provided</td></tr>'}
      </tbody>
    </table>

    <div class="divider"></div>
    <div class="section-heading">Execution Information</div>
    <div class="info-row">
      <span class="info-label">Agreement ID:</span> ${agreementData.agreementId}
    </div>
    <div class="info-row">
      <span class="info-label">Document Reference:</span> ${docRef}
    </div>
    <div class="info-row">
      <span class="info-label">Envelope ID:</span> ${envelopeId}
    </div>
    <div class="info-row">
      <span class="info-label">Signed Date:</span> ${signedDate}
    </div>
    <div class="info-row">
      <span class="info-label">Signed Time:</span> ${signedTime}
    </div>
  </div>

  <!-- PAGE 3: SIGNATURES & VERIFICATION -->
  <div class="last-page">
    <div class="header">
      <span class="header-logo">WHIZUNIK</span>
      <span class="header-title">Signature & Verification</span>
      <div class="header-meta">
        <div>Ref: ${docRef}</div>
      </div>
    </div>

    <div class="signature-section">
      <div class="signature-title">Digital Signatures & Execution</div>
      <p style="margin: 0 0 12px 0; font-size: 10pt; line-height: 1.5;">
        This Framework Agreement is executed electronically by duly authorized signatories. Digital signatures, platform audit records, 
        and verified location data constitute legally binding evidence of execution.
      </p>

      <div class="signature-container">
        <!-- WHIZUNIK SIGNATURE -->
        <div class="signature-block">
          <div class="signature-block-title">For and on behalf of WHIZUNIK</div>
          <div class="signature-line"></div>
          <div class="signature-detail">
            <span class="signature-detail-label">Authorized Signatory:</span>
          </div>
          <div class="signature-line"></div>
          <div class="signature-detail">
            <span class="signature-detail-label">Title:</span>
          </div>
          <div class="signature-line"></div>
          <div class="signature-detail">
            <span class="signature-detail-label">Date:</span>
          </div>
        </div>

        <!-- SELLER SIGNATURE -->
        <div class="signature-block">
          <div class="signature-block-title">For and on behalf of the Seller</div>
          <div class="signature-image-box">
            ${signatoryData.signatureDataUrl ? `<img src="${signatoryData.signatureDataUrl}" alt="Digital Signature"/>` : '<span style="color: #999;">Signature Image</span>'}
          </div>
          <div class="signature-detail">
            <span class="signature-detail-label">Signed By:</span> ${signerName}
          </div>
          <div class="signature-detail">
            <span class="signature-detail-label">Position:</span> ${signerPosition}
          </div>
          <div class="signature-detail">
            <span class="signature-detail-label">Signature Date:</span> ${signedDate}
          </div>
          <div class="signature-detail">
            <span class="signature-detail-label">Signature Time:</span> ${signedTime}
          </div>
        </div>
      </div>
    </div>

    <!-- SIGNER LOCATION & VERIFICATION -->
    <div class="signature-section">
      <div class="signature-title">Signer Location & Verification</div>
      <table>
        <tbody>
          <tr>
            <td style="width: 35%; font-weight: bold; border-right: 1px solid #e5e7eb;">City</td>
            <td>${signerCity}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border-right: 1px solid #e5e7eb;">Country</td>
            <td>${signerCountry}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border-right: 1px solid #e5e7eb;">Latitude</td>
            <td>${signerLatitude}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border-right: 1px solid #e5e7eb;">Longitude</td>
            <td>${signerLongitude}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border-right: 1px solid #e5e7eb;">IP Address</td>
            <td style="font-family: monospace; font-size: 9pt;">${signerIp}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PHOTO VERIFICATION -->
    ${signatoryData.photoDataUrl ? `
    <div class="photo-verification">
      <div class="signature-title">Signer Identity Verification</div>
      <p style="font-size: 10pt; margin-bottom: 12px;">
        The signer's identity has been verified via selfie/photo capture during the signing process at the location specified above.
      </p>
      <div class="photo-box">
        <img src="${signatoryData.photoDataUrl}" alt="Signer Verification Photo"/>
      </div>
      <div style="margin-top: 8px; font-size: 9pt; color: #6b7280;">
        Photo captured on: ${signedDate} at ${signedTime}
      </div>
    </div>
    ` : ''}

    <!-- SIGNED BADGE -->
    <div class="signed-badge">
      ✓ DIGITALLY SIGNED & VERIFIED<br/>
      Signed on: ${signedDate} at ${signedTime}<br/>
      Signer: ${signerName}<br/>
      Location: ${signerCity}, ${signerCountry}
    </div>

    <div class="footer">
      <div>WHIZUNIK Confidential | Document Ref: ${docRef} | Envelope: ${envelopeId}</div>
      <div>This is a digitally signed and verified agreement. All signature and verification data is encrypted and securely stored.</div>
    </div>
  </div>
</body>
</html>
  `;
};
const generateSignedFrameworkPdfBuffer = async (agreementData) => {
    const html = generateSignedFrameworkPdfHtml(agreementData);
    const browser = await puppeteer_1.default.launch({ headless: true });
    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '15mm', right: '12mm', bottom: '15mm', left: '12mm' }
        });
        return Buffer.from(pdfBuffer);
    }
    finally {
        await browser.close();
    }
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
        const buffer = await (0, pdfGenerator_1.generateFrameworkAgreementPDF)(payload);
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
        const { recipientEmail, subject, agreementData, sellerName, sellerEmail, buyerName } = req.body || {};
        if (!recipientEmail) {
            return res.status(400).json({
                success: false,
                message: 'Recipient email is required'
            });
        }
        const payload = agreementData || {};
        const resolvedSellerName = String(sellerName || payload?.seller?.name || 'Seller').trim();
        const resolvedBuyerName = String(buyerName || payload?.buyer?.name || 'Buyer').trim();
        const resolvedSellerEmail = String(sellerEmail || payload?.sellerEmail || payload?.seller?.email || recipientEmail).trim();
        const agreementId = generateFrameworkToken();
        const frontendBase = getFrameworkFrontendBaseUrl();
        const signUrl = `${frontendBase}/framework-agreement/sign/${agreementId}`;
        const buffer = await (0, pdfGenerator_1.generateFrameworkAgreementPDF)(payload);
        const frameworkAgreement = {
            agreementId,
            sellerId: `seller_${Date.now()}`,
            sellerName: resolvedSellerName,
            sellerEmail: resolvedSellerEmail,
            buyerName: resolvedBuyerName,
            recipientEmail,
            agreementData: payload,
            status: 'sent',
            emailSent: false,
            accessCount: 0
        };
        await (0, dynamoRepository_1.createFrameworkAgreement)(frameworkAgreement);
        const transporter = createEmailTransporter();
        const resolvedSubject = subject || 'WHIZUNIK Framework Agreement';
        const emailHtml = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Framework Agreement Signature Required</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; background:#f4f6f8; margin:0; padding:24px; color:#1f2937; }
    .card { max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; padding:24px; }
    .title { margin:0 0 10px 0; font-size:22px; color:#0f172a; }
    .muted { color:#6b7280; font-size:14px; }
    .panel { margin:18px 0; padding:14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; }
    .cta-wrap { text-align:center; margin:26px 0; }
    .cta {
      display:inline-block; background:#0f766e; color:#ffffff !important; text-decoration:none;
      padding:12px 20px; border-radius:8px; font-weight:700; letter-spacing:.2px;
    }
    .small { font-size:12px; color:#6b7280; line-height:1.5; word-break: break-all; }
    .divider { border-top:1px solid #e5e7eb; margin:18px 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1 class="title">Signature Required: Framework Agreement</h1>
    <p>Hello,</p>
    <p>Please review and digitally sign the framework agreement to proceed.</p>

    <div class="panel">
      <div><strong>Seller:</strong> ${resolvedSellerName || '-'}</div>
      <div><strong>Buyer:</strong> ${resolvedBuyerName || '-'}</div>
      <div><strong>Recipient:</strong> ${recipientEmail}</div>
      <div><strong>Reference:</strong> ${agreementId}</div>
    </div>

    <div class="cta-wrap">
      <a class="cta" href="${signUrl}" target="_blank" rel="noopener noreferrer">Review and Sign Agreement</a>
    </div>

    <p class="muted">If the button does not work, copy and paste this URL into your browser:</p>
    <p class="small">${signUrl}</p>

    <div class="divider"></div>
    <p class="small">
      This link is unique and should not be shared. If you did not expect this email, please ignore it.
    </p>
  </div>
</body>
</html>
    `;
        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@whizunik.com',
            to: recipientEmail,
            subject: resolvedSubject,
            html: emailHtml,
            text: `Please review and sign the framework agreement: ${signUrl}`,
            attachments: [
                {
                    filename: 'WHIZUNIK_Framework_Agreement.pdf',
                    content: buffer,
                    contentType: 'application/pdf'
                }
            ]
        });
        await (0, dynamoRepository_1.updateFrameworkAgreement)(agreementId, {
            emailSent: true,
            emailSentAt: new Date().toISOString()
        });
        res.status(200).json({
            success: true,
            message: 'Framework agreement sent',
            data: {
                agreementId,
                signUrl
            }
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
router.get('/framework-agreement', async (req, res) => {
    try {
        const agreements = await (0, dynamoRepository_1.listFrameworkAgreements)();
        res.json({
            success: true,
            message: 'Framework agreements retrieved successfully',
            data: agreements,
            summary: {
                total: agreements.length
            }
        });
    }
    catch (error) {
        console.error('Get all framework agreements error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/framework-agreement/signed', async (req, res) => {
    try {
        const { limit = '200' } = req.query;
        const limitNum = Math.max(1, Math.min(parseInt(limit, 10) || 200, 1000));
        const signedFrameworks = (await (0, dynamoRepository_1.listFrameworkAgreementsByStatus)('acknowledged')).slice(0, limitNum);
        res.json({
            success: true,
            message: 'Signed framework agreements retrieved successfully',
            data: signedFrameworks,
            summary: {
                total: signedFrameworks.length
            }
        });
    }
    catch (error) {
        console.error('Get signed framework agreements error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/framework-agreement/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const agreement = await (0, dynamoRepository_1.getFrameworkAgreementById)(token);
        if (!agreement) {
            return res.status(404).json({
                success: false,
                message: 'Framework agreement not found or invalid token'
            });
        }
        const updatedAgreement = await (0, dynamoRepository_1.updateFrameworkAgreement)(token, {
            accessCount: (agreement.accessCount || 0) + 1,
            lastAccessedAt: new Date().toISOString(),
            status: agreement.status === 'sent' ? 'delivered' : agreement.status
        });
        const effectiveAgreement = updatedAgreement || agreement;
        res.json({
            success: true,
            data: {
                agreement: effectiveAgreement,
                canSign: effectiveAgreement.status !== 'acknowledged'
            }
        });
    }
    catch (error) {
        console.error('Get framework agreement by token error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.post('/framework-agreement/:token/sign', async (req, res) => {
    try {
        const { token } = req.params;
        const { fullName, position, signatureDataUrl, photoDataUrl, location } = req.body || {};
        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.get('User-Agent') || 'unknown';
        if (!fullName || !position || !signatureDataUrl || !photoDataUrl) {
            return res.status(400).json({
                success: false,
                message: 'Full name, position, signature, and selfie photo are required'
            });
        }
        if (!location || typeof location.city !== 'string' || typeof location.country !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Valid city and country location are required before signing'
            });
        }
        const agreement = await (0, dynamoRepository_1.getFrameworkAgreementById)(token);
        if (!agreement) {
            return res.status(404).json({
                success: false,
                message: 'Framework agreement not found or invalid token'
            });
        }
        if (agreement.status === 'acknowledged') {
            return res.status(400).json({
                success: false,
                message: 'Framework agreement has already been acknowledged'
            });
        }
        const updatedAgreement = await (0, dynamoRepository_1.updateFrameworkAgreement)(token, {
            status: 'acknowledged',
            acknowledgedAt: new Date().toISOString(),
            signatoryData: {
                fullName,
                position,
                ipAddress,
                userAgent,
                signatureDataUrl,
                photoDataUrl,
                location: {
                    city: location.city,
                    country: location.country,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    accuracy: typeof location.accuracy === 'number' ? location.accuracy : undefined,
                    capturedAt: new Date().toISOString()
                }
            }
        });
        const effectiveAgreement = updatedAgreement || agreement;
        try {
            const signedPdfBuffer = await generateSignedFrameworkPdfBuffer(effectiveAgreement);
            const signedFileName = `FrameworkAgreement-${effectiveAgreement.agreementId}-signed.pdf`;
            const uploadedDoc = await (0, s3_1.uploadDocumentToS3)({
                folder: `framework-agreement/${effectiveAgreement.agreementId}`,
                fileName: signedFileName,
                contentType: 'application/pdf',
                body: signedPdfBuffer
            });
            await (0, dynamoRepository_1.updateFrameworkAgreement)(effectiveAgreement.agreementId, {
                signedDocumentKey: uploadedDoc.key,
                signedDocumentFileName: signedFileName
            });
        }
        catch (s3Error) {
            console.error('Failed to generate/upload signed framework agreement PDF to S3:', s3Error);
        }
        res.json({
            success: true,
            message: 'Framework agreement acknowledged successfully',
            data: {
                agreementId: effectiveAgreement.agreementId,
                status: effectiveAgreement.status,
                acknowledgedAt: effectiveAgreement.acknowledgedAt || effectiveAgreement.updatedAt,
                acknowledgedBy: fullName
            }
        });
    }
    catch (error) {
        console.error('Sign framework agreement error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/framework-agreement/:token/pdf', async (req, res) => {
    try {
        const { token } = req.params;
        const agreement = await (0, dynamoRepository_1.getFrameworkAgreementById)(token);
        if (!agreement) {
            return res.status(404).json({
                success: false,
                message: 'Framework agreement not found or invalid token'
            });
        }
        if (agreement.status !== 'acknowledged') {
            return res.status(400).json({
                success: false,
                message: 'Framework agreement must be acknowledged before generating PDF'
            });
        }
        let pdfBuffer;
        if (agreement.signedDocumentKey) {
            const fromS3 = await (0, s3_1.getDocumentFromS3)(agreement.signedDocumentKey);
            pdfBuffer = fromS3.buffer;
        }
        else {
            pdfBuffer = await generateSignedFrameworkPdfBuffer(agreement);
            try {
                const signedFileName = `FrameworkAgreement-${agreement.agreementId}-signed.pdf`;
                const uploadedDoc = await (0, s3_1.uploadDocumentToS3)({
                    folder: `framework-agreement/${agreement.agreementId}`,
                    fileName: signedFileName,
                    contentType: 'application/pdf',
                    body: pdfBuffer
                });
                await (0, dynamoRepository_1.updateFrameworkAgreement)(agreement.agreementId, {
                    signedDocumentKey: uploadedDoc.key,
                    signedDocumentFileName: signedFileName
                });
            }
            catch (uploadError) {
                console.error('Failed to upload on-demand framework PDF to S3:', uploadError);
            }
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${agreement.signedDocumentFileName || `FrameworkAgreement-${agreement.agreementId}-signed.pdf`}"`);
        res.send(pdfBuffer);
    }
    catch (error) {
        console.error('Generate framework agreement PDF error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating PDF'
        });
    }
});
exports.default = router;
//# sourceMappingURL=documents.js.map