import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns';
import dotenv from 'dotenv';
import { createTransaction } from './src/data/dynamoRepository';
import { isDynamoConfigured } from './src/data/dynamoClient';

dotenv.config();
dns.setServers(['8.8.8.8', '1.1.1.1']);

type InvoiceSeed = {
  supplierName: string;
  invoiceValue: number;
  invoiceDate: string;
  dueDate: string;
  settledAt: string;
};

const seededValuesByFileName: Record<string, InvoiceSeed> = {
  'Captain Corsaire Invoice.pdf': { supplierName: 'Captain Corsaire', invoiceValue: 18250, invoiceDate: '2026-01-05', dueDate: '2026-02-19', settledAt: '2026-02-15T10:00:00.000Z' },
  'COMPASS TEX LIMITED Invoice.pdf': { supplierName: 'COMPASS TEX LIMITED', invoiceValue: 24900, invoiceDate: '2026-01-07', dueDate: '2026-02-21', settledAt: '2026-02-19T10:00:00.000Z' },
  'Diesel SPA - Canada Invoice.pdf': { supplierName: 'Diesel SPA - Canada', invoiceValue: 31700, invoiceDate: '2026-01-09', dueDate: '2026-02-23', settledAt: '2026-02-20T10:00:00.000Z' },
  'Inv XL 33.xls': { supplierName: 'Inv XL 33', invoiceValue: 22600, invoiceDate: '2026-01-11', dueDate: '2026-02-25', settledAt: '2026-02-18T10:00:00.000Z' },
  'INV-53-655-2025 REVISED.pdf': { supplierName: 'INV-53-655-2025 REVISED', invoiceValue: 19840, invoiceDate: '2026-01-13', dueDate: '2026-02-27', settledAt: '2026-02-23T10:00:00.000Z' },
  'INVOICE  PL - DREX0045.pdf': { supplierName: 'PL - DREX0045', invoiceValue: 27450, invoiceDate: '2026-01-15', dueDate: '2026-03-01', settledAt: '2026-02-24T10:00:00.000Z' },
  'JOE BROWNS LIMITED Invoice.pdf': { supplierName: 'JOE BROWNS LIMITED', invoiceValue: 21375, invoiceDate: '2026-01-17', dueDate: '2026-03-03', settledAt: '2026-02-21T10:00:00.000Z' },
  'Mossy Oak Invoice.pdf': { supplierName: 'Mossy Oak', invoiceValue: 16890, invoiceDate: '2026-01-19', dueDate: '2026-03-05', settledAt: '2026-02-22T10:00:00.000Z' },
  'REVOLVER INC LTD Invoice.pdf': { supplierName: 'REVOLVER INC LTD', invoiceValue: 29500, invoiceDate: '2026-01-21', dueDate: '2026-03-07', settledAt: '2026-02-26T10:00:00.000Z' },
  'STAR DESIGN GROUP INC Invoice.pdf': { supplierName: 'STAR DESIGN GROUP INC', invoiceValue: 26120, invoiceDate: '2026-01-23', dueDate: '2026-03-09', settledAt: '2026-02-27T10:00:00.000Z' },
  'TBS Technisynthese Invoice.pdf': { supplierName: 'TBS Technisynthese', invoiceValue: 18430, invoiceDate: '2026-01-25', dueDate: '2026-03-11', settledAt: '2026-02-28T10:00:00.000Z' },
  'The Sting Sourcing & Productions Holding B.V.pdf': { supplierName: 'The Sting Sourcing & Productions Holding B.V', invoiceValue: 33880, invoiceDate: '2026-01-27', dueDate: '2026-03-13', settledAt: '2026-03-01T10:00:00.000Z' },
  'UNITCOTTON APS Invoice.pdf': { supplierName: 'UNITCOTTON APS', invoiceValue: 17220, invoiceDate: '2026-01-29', dueDate: '2026-03-15', settledAt: '2026-03-02T10:00:00.000Z' },
  'VOIA FASHION Invoice.pdf': { supplierName: 'VOIA FASHION', invoiceValue: 24110, invoiceDate: '2026-01-31', dueDate: '2026-03-17', settledAt: '2026-03-03T10:00:00.000Z' }
};

const toInvoiceDefaults = (fileName: string, index: number): InvoiceSeed => {
  const amount = 15000 + index * 1250;
  const invoiceDate = new Date(Date.UTC(2026, 0, 5 + index * 2)).toISOString().slice(0, 10);
  const dueDate = new Date(Date.UTC(2026, 1, 19 + index * 2)).toISOString().slice(0, 10);
  const settledAt = new Date(Date.UTC(2026, 2, 1 + index, 10, 0, 0)).toISOString();

  return {
    supplierName: fileName.replace(/\.(pdf|xls)$/i, '').trim(),
    invoiceValue: amount,
    invoiceDate,
    dueDate,
    settledAt
  };
};

const importInvoices = async () => {
  const invoicesDir = path.resolve(__dirname, '../invoices');

  if (!fs.existsSync(invoicesDir)) {
    throw new Error(`Invoices directory not found: ${invoicesDir}`);
  }

  const invoiceFiles = fs
    .readdirSync(invoicesDir)
    .filter((name) => /\.(pdf|xls)$/i.test(name))
    .sort((a, b) => a.localeCompare(b));

  if (invoiceFiles.length === 0) {
    throw new Error('No .pdf/.xls invoice files found in invoices directory.');
  }

  if (!isDynamoConfigured()) {
    throw new Error('DynamoDB is not configured. Set AWS_REGION and DYNAMODB_TABLE.');
  }

  console.log('Using DynamoDB for invoice import');
  console.log(`Importing ${invoiceFiles.length} invoice files...`);

  let upsertedCount = 0;

  for (const [i, fileName] of invoiceFiles.entries()) {
    const seed = seededValuesByFileName[fileName] || toInvoiceDefaults(fileName, i);
    const transactionId = `TXN-CLOSED-${String(i + 1).padStart(3, '0')}`;
    const invoiceId = `INV-CLOSED-${String(i + 1).padStart(3, '0')}`;

    const invoiceValue = seed.invoiceValue;
    const advanceAmount = Math.round(invoiceValue * 0.8);
    const feeAmount = Math.round(invoiceValue * 0.025);
    const reserveAmount = Math.max(0, invoiceValue - advanceAmount - feeAmount);

    const doc = {
      transactionId,
      invoiceId,
      supplierId: `supplier_invoice_${String(i + 1).padStart(3, '0')}`,
      supplierName: seed.supplierName,
      buyerId: 'BUYER-123456',
      buyerName: 'Sample Buyer Corp',
      invoiceNumber: fileName,
      invoiceDate: seed.invoiceDate,
      invoiceValue,
      invoiceAmount: invoiceValue,
      currency: 'USD',
      advanceRate: 80,
      advanceAmount,
      feeAmount,
      reserveAmount,
      transactionFee: 0,
      processingFee: 0,
      factoringFee: 0,
      setupFee: 0,
      supplierPaymentTerms: '45',
      description: 'Imported from invoices folder into DynamoDB',
      status: 'settled',
      transactionType: 'factoring',
      supportingDocuments: [fileName],
      buyerEmail: 'buyer@example.com',
      sendNOA: false,
      netAmount: Math.max(0, advanceAmount - feeAmount),
      dueDate: seed.dueDate,
      tenureDays: 45,
      paidAmount: invoiceValue,
      fundedAt: seed.settledAt,
      settledAt: seed.settledAt,
      paymentHistory: [
        {
          id: `PAY-CLOSED-${String(i + 1).padStart(3, '0')}`,
          amount: invoiceValue,
          paidAt: seed.settledAt.slice(0, 10),
          paidBy: 'Sample Buyer Corp',
          reference: `BANK-REF-${String(i + 1).padStart(3, '0')}`,
          notes: `Auto-imported from ${fileName}`,
          lateFeesPaid: 0
        }
      ]
    };

    await createTransaction(doc);

    upsertedCount += 1;
    console.log(`Upserted ${fileName} as ${transactionId}`);
  }

  console.log(`Import completed. Upserted ${upsertedCount} transactions.`);
};

if (require.main === module) {
  importInvoices()
    .catch((error) => {
      console.error('Invoice import failed:', error);
      process.exitCode = 1;
    })
    .finally(() => undefined);
}

export default importInvoices;