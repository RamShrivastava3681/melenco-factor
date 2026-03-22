import express from 'express';
import puppeteer from 'puppeteer';
import { TransactionModel, EntityModel } from '../models/schemas';

const router = express.Router();

type ReportType = 'operational' | 'financial' | 'risk' | 'compliance';
type OutputFormat = 'pdf' | 'csv' | 'excel' | 'json';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  category: string;
  supportedFormats: OutputFormat[];
  isActive: boolean;
}

interface ReportConfiguration {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  templateId: string;
  templateName: string;
  parameters: Record<string, any>;
  filters: {
    dateRange?: { from: string; to: string };
    entities?: string[];
    currencies?: string[];
    status?: string[];
    customFilters?: Record<string, any>;
  };
  outputFormat: OutputFormat;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  lastRun?: string;
}

interface ReportExecution {
  id: string;
  reportId: string;
  reportName: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  duration?: number;
  fileSize?: number;
  downloadUrl?: string;
  errorMessage?: string;
  parameters: Record<string, any>;
  executedBy: string;
}

const reportTemplates: ReportTemplate[] = [
  {
    id: 'TPL-001',
    name: 'Transaction Summary Report',
    description: 'Comprehensive summary of transactions with status and volumes',
    type: 'operational',
    category: 'Transaction Reports',
    supportedFormats: ['pdf', 'excel', 'csv', 'json'],
    isActive: true
  },
  {
    id: 'TPL-002',
    name: 'Open and Closed Invoices Report',
    description: 'Detailed analysis of open and closed invoices',
    type: 'financial',
    category: 'Invoice Management',
    supportedFormats: ['pdf', 'excel', 'csv', 'json'],
    isActive: true
  },
  {
    id: 'TPL-003',
    name: 'Buyer & Supplier Credit Report',
    description: 'Credit profile report for buyers and suppliers',
    type: 'risk',
    category: 'Credit Management',
    supportedFormats: ['pdf', 'excel', 'csv', 'json'],
    isActive: true
  }
];

const reportConfigurations: ReportConfiguration[] = [];
const reportExecutions: ReportExecution[] = [];
const reportFiles = new Map<string, { fileName: string; mimeType: string; content: string | Buffer }>();

const parseDateRangeFilter = (dateRange?: { from?: string; to?: string }) => {
  const from = dateRange?.from ? new Date(dateRange.from) : null;
  const to = dateRange?.to ? new Date(dateRange.to) : null;
  return {
    from: from && !isNaN(from.getTime()) ? from : null,
    to: to && !isNaN(to.getTime()) ? to : null
  };
};

const inRange = (value: Date, from: Date | null, to: Date | null) => {
  if (from && value < from) return false;
  if (to && value > to) return false;
  return true;
};

const rowsToCsv = (rows: Record<string, any>[]) => {
  if (!rows.length) return 'No records found';
  const firstRow = rows[0];
  if (!firstRow) return 'No records found';
  const headers = Object.keys(firstRow);
  const escape = (v: any) => {
    const value = v == null ? '' : String(v);
    const safe = value.replace(/"/g, '""');
    return /[",\n]/.test(safe) ? `"${safe}"` : safe;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  return lines.join('\n');
};

const generatePdfBuffer = async (reportName: string, payload: any): Promise<Buffer> => {
  const rows = Array.isArray(payload?.rows) ? payload.rows : [];
  const summaryEntries = Object.entries(payload?.summary || {});

  const escapeHtml = (value: any) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const headers = rows.length ? Object.keys(rows[0] || {}) : [];
  const tableHeader = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('');
  const tableRows = rows
    .map((row: Record<string, any>) => `<tr>${headers.map((header) => `<td>${escapeHtml(row[header])}</td>`).join('')}</tr>`)
    .join('');

  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
          h1 { margin: 0 0 8px; font-size: 20px; }
          .meta { color: #6b7280; margin-bottom: 16px; font-size: 12px; }
          .summary { margin-bottom: 16px; }
          .summary-item { font-size: 13px; margin: 2px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { border: 1px solid #d1d5db; padding: 6px; text-align: left; }
          th { background: #f3f4f6; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(reportName)}</h1>
        <div class="meta">Generated at: ${escapeHtml(payload?.generatedAt || new Date().toISOString())}</div>
        <div class="summary">
          ${summaryEntries.map(([key, value]) => `<div class="summary-item"><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</div>`).join('')}
        </div>
        ${rows.length ? `<table><thead><tr>${tableHeader}</tr></thead><tbody>${tableRows}</tbody></table>` : '<div>No records found</div>'}
      </body>
    </html>
  `;

  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '12mm', bottom: '12mm', left: '8mm', right: '8mm' } });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
};

const buildDownloadFile = async (execution: ReportExecution, payload: any, format: OutputFormat) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const base = `${execution.reportName.replace(/\s+/g, '_')}_${timestamp}`;

  if (format === 'pdf') {
    const content = await generatePdfBuffer(execution.reportName, payload);
    return {
      fileName: `${base}.pdf`,
      mimeType: 'application/pdf',
      content
    };
  }

  if (format === 'csv' || format === 'excel') {
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    const content = rowsToCsv(rows);
    return {
      fileName: `${base}.${format === 'excel' ? 'csv' : 'csv'}`,
      mimeType: 'text/csv',
      content
    };
  }

  const content = JSON.stringify(payload, null, 2);
  return {
    fileName: `${base}.json`,
    mimeType: 'application/json',
    content
  };
};

const buildReportData = async (configuration: ReportConfiguration) => {
  const { from, to } = parseDateRangeFilter(configuration.filters?.dateRange);
  const transactions = await TransactionModel.find().sort({ createdAt: -1 }).lean();
  const entities = await EntityModel.find().sort({ createdAt: -1 }).lean();

  const txFiltered = transactions.filter((tx) => {
    const baseDate = tx.invoiceDate ? new Date(tx.invoiceDate) : new Date(tx.createdAt as any);
    if (isNaN(baseDate.getTime())) return true;
    return inRange(baseDate, from, to);
  });

  if (configuration.templateId === 'TPL-001') {
    const rows = txFiltered.map((tx) => ({
      transactionId: tx.transactionId,
      invoiceNumber: tx.invoiceNumber,
      buyerName: tx.buyerName,
      supplierName: tx.supplierName,
      status: tx.status,
      invoiceAmount: tx.invoiceValue || tx.invoiceAmount || 0,
      feeAmount: tx.feeAmount || 0,
      createdAt: tx.createdAt
    }));

    return {
      reportType: configuration.templateName,
      generatedAt: new Date().toISOString(),
      summary: {
        totalTransactions: rows.length,
        totalInvoiceAmount: rows.reduce((sum, row) => sum + (row.invoiceAmount || 0), 0),
        totalFees: rows.reduce((sum, row) => sum + (row.feeAmount || 0), 0)
      },
      rows
    };
  }

  if (configuration.templateId === 'TPL-002') {
    const rows = txFiltered.map((tx) => ({
      transactionId: tx.transactionId,
      invoiceNumber: tx.invoiceNumber,
      buyerName: tx.buyerName,
      supplierName: tx.supplierName,
      status: tx.status,
      invoiceAmount: tx.invoiceValue || tx.invoiceAmount || 0,
      paidAmount: tx.paidAmount || 0,
      dueDate: tx.dueDate || null,
      closedAt: tx.settledAt || tx.completedAt || null
    }));

    const openStatuses = new Set(['funded', 'partial_payment', 'pending', 'approved']);
    const closedStatuses = new Set(['settled', 'completed', 'closed']);

    return {
      reportType: configuration.templateName,
      generatedAt: new Date().toISOString(),
      summary: {
        totalInvoices: rows.length,
        openInvoices: rows.filter((r) => openStatuses.has(String(r.status))).length,
        closedInvoices: rows.filter((r) => closedStatuses.has(String(r.status))).length
      },
      rows
    };
  }

  const rows = entities.map((entity: any) => ({
    entityId: entity.entityId,
    entityName: entity.name,
    entityType: entity.type,
    creditLimit: entity.creditLimit || entity.totalLimitSanctioned || 0,
    utilized: entity.usedCredit || entity.usedLimit || 0,
    available: (entity.creditLimit || entity.totalLimitSanctioned || 0) - (entity.usedCredit || entity.usedLimit || 0)
  }));

  return {
    reportType: configuration.templateName,
    generatedAt: new Date().toISOString(),
    summary: {
      totalEntities: rows.length,
      totalBuyers: rows.filter((r) => r.entityType === 'buyer').length,
      totalSuppliers: rows.filter((r) => r.entityType === 'supplier').length
    },
    rows
  };
};

router.get('/templates', async (req, res) => {
  try {
    res.json({ success: true, data: reportTemplates });
  } catch (error) {
    console.error('Report templates error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/configurations', async (req, res) => {
  try {
    res.json({ success: true, data: reportConfigurations });
  } catch (error) {
    console.error('Report configurations error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/configurations', async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.templateId || !body.name) {
      return res.status(400).json({ success: false, message: 'templateId and name are required' });
    }

    const template = reportTemplates.find((t) => t.id === body.templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Report template not found' });
    }

    const configuration: ReportConfiguration = {
      id: `RPT-${Date.now()}`,
      name: body.name,
      description: body.description || '',
      type: body.type || template.type,
      templateId: template.id,
      templateName: template.name,
      parameters: body.parameters || {},
      filters: body.filters || {},
      outputFormat: body.outputFormat || 'pdf',
      isActive: body.isActive !== false,
      createdAt: new Date().toISOString(),
      createdBy: body.createdBy || 'current-user'
    };

    reportConfigurations.unshift(configuration);

    res.status(201).json({ success: true, data: configuration });
  } catch (error) {
    console.error('Create report configuration error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/executions', async (req, res) => {
  try {
    res.json({ success: true, data: reportExecutions });
  } catch (error) {
    console.error('Report executions error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/configurations/:reportId/execute', async (req, res) => {
  const startedAt = Date.now();
  try {
    const { reportId } = req.params;
    const configuration = reportConfigurations.find((r) => r.id === reportId);
    if (!configuration) {
      return res.status(404).json({ success: false, message: 'Report configuration not found' });
    }

    const execution: ReportExecution = {
      id: `EXE-${Date.now()}`,
      reportId: configuration.id,
      reportName: configuration.name,
      status: 'running',
      startedAt: new Date().toISOString(),
      parameters: req.body?.parameters || {},
      executedBy: req.body?.executedBy || 'current-user'
    };
    reportExecutions.unshift(execution);

    const payload = await buildReportData(configuration);
    const generated = await buildDownloadFile(execution, payload, configuration.outputFormat);
    reportFiles.set(execution.id, generated);

    execution.status = 'completed';
    execution.completedAt = new Date().toISOString();
    execution.duration = Date.now() - startedAt;
    execution.fileSize = Buffer.isBuffer(generated.content)
      ? generated.content.length
      : Buffer.byteLength(generated.content, 'utf-8');
    execution.downloadUrl = `/api/reports/executions/${execution.id}/download`;
    configuration.lastRun = execution.completedAt;

    res.json({ success: true, data: execution });
  } catch (error: any) {
    console.error('Execute report error:', error);
    res.status(500).json({ success: false, message: error?.message || 'Internal server error' });
  }
});

router.get('/executions/:executionId/download', async (req, res) => {
  try {
    const { executionId } = req.params;
    const file = reportFiles.get(executionId);
    if (!file) {
      return res.status(404).json({ success: false, message: 'Report file not found' });
    }

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    res.send(file.content);
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/templates/:templateId/download', async (req, res) => {
  try {
    const { templateId } = req.params;
    const requestedFormat = String(req.query.format || 'csv').toLowerCase() as OutputFormat;
    const template = reportTemplates.find((t) => t.id === templateId);

    if (!template) {
      return res.status(404).json({ success: false, message: 'Report template not found' });
    }

    const outputFormat: OutputFormat = template.supportedFormats.includes(requestedFormat)
      ? requestedFormat
      : (template.supportedFormats[0] || 'csv');

    const pseudoConfiguration: ReportConfiguration = {
      id: `RPT-DIRECT-${Date.now()}`,
      name: template.name,
      description: template.description,
      type: template.type,
      templateId: template.id,
      templateName: template.name,
      parameters: {},
      filters: {},
      outputFormat,
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: 'direct-download'
    };

    const payload = await buildReportData(pseudoConfiguration);
    const execution: ReportExecution = {
      id: `EXE-DIRECT-${Date.now()}`,
      reportId: pseudoConfiguration.id,
      reportName: pseudoConfiguration.name,
      status: 'completed',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      parameters: {},
      executedBy: 'direct-download'
    };

    const generated = await buildDownloadFile(execution, payload, outputFormat);
    res.setHeader('Content-Type', generated.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${generated.fileName}"`);
    res.send(generated.content);
  } catch (error) {
    console.error('Direct report download error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get transaction reports - simplified
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await TransactionModel.find().sort({ createdAt: -1 }).limit(100);
    
    res.json({
      success: true,
      data: {
        transactions,
        summary: {
          totalTransactions: transactions.length,
          completedTransactions: transactions.filter(t => t.status === 'settled').length,
          pendingTransactions: transactions.filter(t => t.status === 'pending').length
        }
      }
    });
  } catch (error) {
    console.error('Transaction reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get compliance reports - simplified  
router.get('/compliance', async (req, res) => {
  try {
    const totalTransactions = await TransactionModel.countDocuments();
    const entities = await EntityModel.countDocuments();
    
    res.json({
      success: true,
      data: {
        overview: {
          totalTransactions,
          totalEntities: entities,
          complianceScore: 95.2
        },
        riskAnalysis: {
          highRiskCount: 0,
          mediumRiskCount: 0,
          lowRiskCount: entities,
          averageRiskScore: 0
        },
        message: 'Compliance reports functionality is being migrated to MongoDB'
      }
    });
  } catch (error) {
    console.error('Compliance reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get risk reports - simplified
router.get('/risk', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        summary: {
          totalBreaches: 0,
          creditLimitBreaches: 0,
          concentrationLimitBreaches: 0
        },
        recommendations: [
          'Risk reports functionality is being migrated to MongoDB'
        ],
        message: 'Risk reports functionality is being migrated to MongoDB'
      }
    });
  } catch (error) {
    console.error('Risk reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get performance reports - simplified
router.get('/performance', async (req, res) => {
  try {
    const totalTransactions = await TransactionModel.countDocuments();
    
    res.json({
      success: true,
      data: {
        overview: {
          totalTransactions,
          currentMonth: 0,
          lastMonth: 0,
          growthRate: 0
        },
        statusBreakdown: {
          overdue: { count: 0, percentage: 0 },
          active: { count: 0, percentage: 0 }
        },
        message: 'Performance reports functionality is being migrated to MongoDB'
      }
    });
  } catch (error) {
    console.error('Performance reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get financial reports - simplified
router.get('/financial', async (req, res) => {
  try {
    const totalFees = await TransactionModel.aggregate([
      { $group: { _id: null, total: { $sum: '$feeAmount' } } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalRevenue: totalFees[0]?.total || 0,
        totalExpenses: 0,
        netProfit: totalFees[0]?.total || 0,
        message: 'Financial reports functionality is being migrated to MongoDB'
      }
    });
  } catch (error) {
    console.error('Financial reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get entity reports - simplified
router.get('/entities', async (req, res) => {
  try {
    const entities = await EntityModel.find().sort({ createdAt: -1 }).limit(50);
    const totalCount = await EntityModel.countDocuments();
    
    res.json({
      success: true,
      data: {
        entities,
        summary: {
          totalEntities: totalCount,
          suppliers: await EntityModel.countDocuments({ type: 'supplier' }),
          buyers: await EntityModel.countDocuments({ type: 'buyer' })
        },
        message: 'Entity reports functionality is being migrated to MongoDB'
      }
    });
  } catch (error) {
    console.error('Entity reports error:', error); 
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Wildcard routes for other report types
router.get('/*', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Reports functionality is being migrated to MongoDB',
      data: null
    });
  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;