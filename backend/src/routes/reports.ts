import express from 'express';
import puppeteer from 'puppeteer';
import * as XLSX from 'xlsx';
import { listEntities, listTransactions } from '../data/dynamoRepository';

export const router = express.Router();

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
    name: 'Custom Reports',
    description: 'Custom transaction report with flexible filtering',
    type: 'operational',
    category: 'Custom Reporting',
    supportedFormats: ['pdf', 'excel', 'csv', 'json'],
    isActive: true
  }
  ,
  {
    id: 'TPL-004',
    name: 'Invoice Aging Report',
    description: 'Aging buckets for outstanding invoices (current, 0-30, 31-60, 61-90, 91-120, 120+)',
    type: 'financial',
    category: 'Invoice Management',
    supportedFormats: ['pdf', 'excel', 'csv', 'json'],
    isActive: true
  }
];

const reportConfigurations: ReportConfiguration[] = [];
const reportExecutions: ReportExecution[] = [];
const reportFiles = new Map<string, { fileName: string; mimeType: string; content: string | Buffer }>();

const CLOSED_STATUSES = new Set(['settled', 'completed', 'closed']);

const getInvoiceState = (tx: any): 'open' | 'closed' | 'overdue' => {
  const status = String(tx?.status || '').toLowerCase();
  if (CLOSED_STATUSES.has(status)) {
    return 'closed';
  }

  const dueDate = tx?.dueDate ? new Date(tx.dueDate) : null;
  if (dueDate && !Number.isNaN(dueDate.getTime()) && dueDate < new Date()) {
    return 'overdue';
  }

  return 'open';
};

const parseListQueryParam = (input: unknown): string[] => {
  if (Array.isArray(input)) {
    return input
      .flatMap((value) => String(value).split(','))
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
  }

  if (typeof input === 'string') {
    return input
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
  }

  return [];
};

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
  const summaryEntries = Object.entries(payload?.summary || {}).slice(0, 5);

  const escapeHtml = (value: any) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const titleize = (value: string) => value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const asNumber = (value: any) => {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const formatCurrency = (value: any) => {
    const parsed = asNumber(value);
    if (parsed === null) {
      return '$0';
    }

    return `$${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(parsed)}`;
  };

  const formatNumber = (value: any) => {
    const parsed = asNumber(value);
    if (parsed === null) {
      return escapeHtml(value);
    }

    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(parsed);
  };

  const formatDateTime = (value: any) => {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return escapeHtml(value);
    }

    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const isCurrencyField = (key: string) => /(amount|limit|utilized|available|fees|revenue|profit|credit|^current$|days_)/i.test(key);
  const isDateField = (key: string) => /(date|at)$/i.test(key);
  const isNumericField = (key: string, value: any) => asNumber(value) !== null || isCurrencyField(key);

  const getStatusBadge = (value: any, field: string) => {
    const raw = String(value || '').trim();
    const normalized = raw.toLowerCase();

    if (field === 'entityType') {
      const badgeClass = normalized === 'buyer' ? 'badge badge-buyer' : 'badge badge-supplier';
      return `<span class="${badgeClass}" title="${escapeHtml(raw)}">${escapeHtml(titleize(raw || '-'))}</span>`;
    }

    let badgeClass = 'badge badge-neutral';
    if (['settled', 'closed', 'completed'].includes(normalized)) {
      badgeClass = 'badge badge-green';
    } else if (['pending', 'approved', 'running', 'open', 'funded', 'partial_payment'].includes(normalized)) {
      badgeClass = 'badge badge-yellow';
    } else if (['overdue', 'failed', 'rejected', 'disputed'].includes(normalized)) {
      badgeClass = 'badge badge-red';
    }

    return `<span class="${badgeClass}" title="${escapeHtml(raw)}">${escapeHtml(titleize(raw || '-'))}</span>`;
  };

  const detectColumns = () => {
    const sample = rows[0] || {};
    if ('entityType' in sample) {
      return ['entityId', 'entityName', 'entityType', 'creditLimit', 'utilized', 'available'];
    }
    // Invoice aging detection: include invoice and bucket columns if present in sample
    if ('invoiceDate' in sample || 'current' in sample || 'days_0_30' in sample || 'days_31_60' in sample || 'days_61_90' in sample) {
      return ['buyerName', 'invoiceNumber', 'invoiceDate', 'dueDate', 'daysOverdue', 'amount', 'creditTerms', 'current', 'days_0_30', 'days_31_60', 'days_61_90', 'days_91_120', 'days_120_plus'];
    }
    if ('paidAmount' in sample || 'dueDate' in sample || 'closedAt' in sample) {
      return ['transactionId', 'invoiceNumber', 'buyerName', 'supplierName', 'status', 'invoiceAmount', 'paidAmount', 'dueDate', 'closedAt'];
    }
    return ['transactionId', 'invoiceNumber', 'buyerName', 'supplierName', 'status', 'invoiceAmount', 'feeAmount', 'createdAt'];
  };

  const columns = rows.length ? detectColumns().filter((key) => rows.some((row) => row[key] !== undefined)) : [];
  const headerLabels: Record<string, string> = {
    buyerName: 'Buyer Name',
    invoiceNumber: 'Invoice Number',
    invoiceDate: 'Invoice Date',
    dueDate: 'Invoice Due Date',
    daysOverdue: 'Days Overdue',
    amount: 'Amount',
    creditTerms: 'Credit Terms',
    current: 'Current',
    days_0_30: '0-30 days',
    days_31_60: '31-60 days',
    days_61_90: '61-90 days',
    days_91_120: '91-120 days',
    days_120_plus: '120+ days'
  };

  const tableHeader = columns
    .map((header) => {
      const alignClass = isCurrencyField(header) || /(amount|limit|utilized|available|paid)/i.test(header) ? 'text-right' : 'text-left';
      const label = headerLabels[header] || titleize(header);
      return `<th class="${alignClass}">${escapeHtml(label)}</th>`;
    })
    .join('');

  const groupedRows: Array<{ label: string; rows: Record<string, any>[] }> = [];
  if (rows.length > 0) {
    if (columns.includes('entityType')) {
      const buyers = rows.filter((r) => String(r.entityType || '').toLowerCase() === 'buyer');
      const suppliers = rows.filter((r) => String(r.entityType || '').toLowerCase() === 'supplier');
      if (buyers.length) groupedRows.push({ label: 'Buyers', rows: buyers });
      if (suppliers.length) groupedRows.push({ label: 'Suppliers', rows: suppliers });
    } else if (columns.includes('paidAmount') || columns.includes('dueDate')) {
      const openStatuses = new Set(['funded', 'partial_payment', 'pending', 'approved', 'open']);
      const openRows = rows.filter((r) => openStatuses.has(String(r.status || '').toLowerCase()));
      const closedRows = rows.filter((r) => !openStatuses.has(String(r.status || '').toLowerCase()));
      if (openRows.length) groupedRows.push({ label: 'Open', rows: openRows });
      if (closedRows.length) groupedRows.push({ label: 'Closed', rows: closedRows });
    } else {
      groupedRows.push({ label: 'Transactions', rows });
    }
  }

  let rowSequence = 0;
  const tableRows = groupedRows
    .map((group) => {
      const sectionHeader = `<tr class="section-row"><td colspan="${columns.length}">${escapeHtml(group.label)}</td></tr>`;
      const sectionRows = group.rows
        .map((row) => {
          rowSequence += 1;
          const zebraClass = rowSequence % 2 === 0 ? 'row-even' : 'row-odd';
          const cells = columns.map((column) => {
            const raw = row[column];
            const numeric = isNumericField(column, raw);
            const alignClass = numeric ? 'text-right' : 'text-left';
            let rendered = '-';

            if (column === 'status' || column === 'entityType') {
              rendered = getStatusBadge(raw, column);
            } else if (isCurrencyField(column)) {
              rendered = formatCurrency(raw);
            } else if (isDateField(column)) {
              rendered = formatDateTime(raw);
            } else if (numeric) {
              rendered = formatNumber(raw);
            } else if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
              rendered = escapeHtml(raw);
            }

            const tooltip = escapeHtml(raw ?? '-');
            return `<td class="${alignClass}"><span class="truncate" title="${tooltip}">${rendered}</span></td>`;
          }).join('');
          return `<tr class="${zebraClass}">${cells}</tr>`;
        })
        .join('');

      return `${sectionHeader}${sectionRows}`;
    })
    .join('');

  const summaryCards = summaryEntries
    .map(([key, value]) => {
      const isMoney = /(amount|fees|revenue|profit|limit|credit)/i.test(key);
      const displayValue = isMoney ? formatCurrency(value) : formatNumber(value);
      return `
        <div class="kpi-card">
          <div class="kpi-label">${escapeHtml(titleize(key))}</div>
          <div class="kpi-value">${displayValue}</div>
        </div>
      `;
    })
    .join('');

  const generatedAtText = formatDateTime(payload?.generatedAt || new Date().toISOString());

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page {
            margin: 14mm 10mm 18mm 10mm;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Inter, Poppins, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: #0f172a;
            background: #f8fafc;
          }
          .report-shell {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            margin-bottom: 10px;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .logo {
            width: 28px;
            height: 28px;
            border-radius: 8px;
            background: #0f172a;
            color: #ffffff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 11px;
            letter-spacing: 0.5px;
          }
          .title {
            margin: 0;
            font-size: 24px;
            line-height: 1.2;
            font-weight: 700;
            color: #0f172a;
          }
          .subheading {
            margin-top: 4px;
            color: #64748b;
            font-size: 12px;
          }
          .divider {
            border-top: 1px solid #e2e8f0;
            margin: 12px 0 16px;
          }
          .kpi-strip {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 10px;
            margin-bottom: 16px;
          }
          .kpi-card {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            background: #f8fafc;
            padding: 10px 12px;
          }
          .kpi-label {
            color: #64748b;
            font-size: 11px;
            margin-bottom: 4px;
          }
          .kpi-value {
            font-size: 20px;
            line-height: 1.1;
            font-weight: 700;
            color: #0f172a;
          }
          .table-wrap {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            overflow: hidden;
          }
          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            font-size: 11px;
            table-layout: auto;
            /* allow the table to size columns naturally so dates and long text are visible */
            word-break: break-word;
          }
          th {
            position: sticky;
            top: 0;
            background: #f1f5f9;
            color: #334155;
            font-weight: 600;
            border-bottom: 1px solid #e2e8f0;
            padding: 10px;
            white-space: normal;
            text-align: left;
            min-width: 72px;
          }
          td {
            border-bottom: 1px solid #e2e8f0;
            padding: 9px 10px;
            color: #0f172a;
            vertical-align: middle;
          }
          tr.row-odd td { background: #ffffff; }
          tr.row-even td { background: #f8fafc; }
          .section-row td {
            background: #eef2ff;
            color: #1e293b;
            font-weight: 600;
            border-bottom: 1px solid #e2e8f0;
            padding: 8px 10px;
          }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .truncate {
            display: inline-block;
            max-width: 100%;
            overflow-wrap: anywhere;
            word-break: break-word;
            white-space: normal;
            vertical-align: bottom;
          }
          .badge {
            display: inline-flex;
            align-items: center;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 600;
            padding: 3px 8px;
            line-height: 1;
            border: 1px solid transparent;
          }
          .badge-green { color: #166534; background: #dcfce7; border-color: #bbf7d0; }
          .badge-yellow { color: #854d0e; background: #fef9c3; border-color: #fde68a; }
          .badge-red { color: #991b1b; background: #fee2e2; border-color: #fecaca; }
          .badge-neutral { color: #334155; background: #e2e8f0; border-color: #cbd5e1; }
          .badge-buyer { color: #1d4ed8; background: #dbeafe; border-color: #bfdbfe; }
          .badge-supplier { color: #4338ca; background: #e0e7ff; border-color: #c7d2fe; }
          .report-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin-top: 12px;
            color: #64748b;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="report-shell">
          <div class="header">
            <div class="brand">
              <div class="logo">WF</div>
              <div>
                <h1 class="title">${escapeHtml(reportName)}</h1>
                <div class="subheading">Generated on: ${escapeHtml(generatedAtText)}</div>
              </div>
            </div>
          </div>
          <div class="divider"></div>

          <div class="kpi-strip">
            ${summaryCards || '<div class="kpi-card"><div class="kpi-label">Total Records</div><div class="kpi-value">0</div></div>'}
          </div>

          <div class="table-wrap">
            ${rows.length ? `<table><thead><tr>${tableHeader}</tr></thead><tbody>${tableRows}</tbody></table>` : '<div style="padding:16px; color:#64748b; font-size:12px;">No records found</div>'}
          </div>

          <div class="report-footer">
            <span>Total rows displayed: ${rows.length}</span>
            <span>End of Report</span>
          </div>
        </div>
      </body>
    </html>
  `;

  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { 
      waitUntil: 'load' as any 
    });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `<div style="width:100%; font-size:10px; color:#64748b; padding:0 10mm; display:flex; justify-content:space-between;"><span>Total rows displayed: ${rows.length}</span><span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span><span>End of Report</span></div>`,
      margin: { top: '12mm', bottom: '18mm', left: '8mm', right: '8mm' }
    });
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

  if (format === 'csv') {
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    const content = rowsToCsv(rows);
    return {
      fileName: `${base}.csv`,
      mimeType: 'text/csv',
      content
    };
  }

  if (format === 'excel') {
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    const content = Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));

    return {
      fileName: `${base}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
  const transactions = await listTransactions();
  const buyerNameFilter = String(configuration.filters?.customFilters?.buyerName || '').trim().toLowerCase();
  const supplierNameFilter = String(configuration.filters?.customFilters?.supplierName || '').trim().toLowerCase();
  const transactionTypeFilter = String(configuration.filters?.customFilters?.transactionType || '').trim().toLowerCase();
  const currencyFilter = String(configuration.filters?.customFilters?.currency || '').trim().toLowerCase();
  const invoiceStateFilters = Array.isArray(configuration.filters?.status)
    ? configuration.filters.status.map((value) => String(value).toLowerCase())
    : [];

  const txFiltered = transactions.filter((tx) => {
    const baseDate = tx.invoiceDate ? new Date(tx.invoiceDate) : new Date(tx.createdAt as any);
    if (isNaN(baseDate.getTime())) return true;

    if (!inRange(baseDate, from, to)) {
      return false;
    }

    if (buyerNameFilter && String(tx.buyerName || '').trim().toLowerCase() !== buyerNameFilter) {
      return false;
    }

    if (supplierNameFilter && String(tx.supplierName || '').trim().toLowerCase() !== supplierNameFilter) {
      return false;
    }

    if (configuration.templateId === 'TPL-002' && invoiceStateFilters.length > 0) {
      const state = getInvoiceState(tx);
      return invoiceStateFilters.includes(state);
    }

    if (configuration.templateId === 'TPL-003' && transactionTypeFilter) {
      if (String(tx.transactionType || '').trim().toLowerCase() !== transactionTypeFilter) {
        return false;
      }
    }

    if (configuration.templateId === 'TPL-003' && currencyFilter) {
      if (String(tx.currency || '').trim().toLowerCase() !== currencyFilter) {
        return false;
      }
    }

    return true;
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
      invoiceDate: tx.invoiceDate || tx.issuedAt || tx.createdAt || null,
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

  if (configuration.templateId === 'TPL-004') {
    const asOfRaw = configuration.parameters?.asOf || configuration.filters?.dateRange?.to || new Date().toISOString();
    const asOfDate = new Date(asOfRaw);

    // only include open invoices (exclude closed/settled/completed)
    const openTx = txFiltered.filter((tx) => {
      const status = String(tx.status || '').toLowerCase();
      return !CLOSED_STATUSES.has(status);
    });

    const rows = openTx.map((tx) => {
      const invoiceAmount = tx.invoiceValue || tx.invoiceAmount || 0;
      const paidAmount = tx.paidAmount || 0;
      const unpaid = Math.max(0, invoiceAmount - paidAmount);
      const invoiceDate = tx.invoiceDate ? new Date(tx.invoiceDate) : (tx.issuedAt ? new Date(tx.issuedAt) : new Date(tx.createdAt || Date.now()));
      const dueDate = tx.dueDate ? new Date(tx.dueDate) : null;

      const creditTerms = (typeof tx.creditTerms === 'number') ? tx.creditTerms : (dueDate && invoiceDate ? Math.round((dueDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24)) : null);

      // determine days overdue relative to asOfDate (positive = overdue days)
      let daysOverdue: number | null = null;
      if (dueDate instanceof Date && !isNaN(dueDate.getTime())) {
        daysOverdue = Math.floor((asOfDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      const buckets: Record<string, number> = {
        current: 0,
        days_0_30: 0,
        days_31_60: 0,
        days_61_90: 0,
        days_91_120: 0,
        days_120_plus: 0
      };

      if (daysOverdue === null || daysOverdue <= 0) {
        // not overdue yet
        buckets.current = unpaid;
      } else if (daysOverdue <= 30) {
        buckets.days_0_30 = unpaid;
      } else if (daysOverdue <= 60) {
        buckets.days_31_60 = unpaid;
      } else if (daysOverdue <= 90) {
        buckets.days_61_90 = unpaid;
      } else if (daysOverdue <= 120) {
        buckets.days_91_120 = unpaid;
      } else {
        buckets.days_120_plus = unpaid;
      }

      return {
        buyerName: tx.buyerName,
        invoiceNumber: tx.invoiceNumber,
        invoiceDate: invoiceDate ? invoiceDate.toISOString() : null,
        dueDate: dueDate ? dueDate.toISOString() : null,
        daysOverdue: daysOverdue,
        amount: invoiceAmount,
        creditTerms: creditTerms,
        current: buckets.current,
        days_0_30: buckets.days_0_30,
        days_31_60: buckets.days_31_60,
        days_61_90: buckets.days_61_90,
        days_91_120: buckets.days_91_120,
        days_120_plus: buckets.days_120_plus
      };
    });

    const totalUnpaid = rows.reduce((s, r) => s + (r.current || 0) + (r.days_0_30 || 0) + (r.days_31_60 || 0) + (r.days_61_90 || 0) + (r.days_91_120 || 0) + (r.days_120_plus || 0), 0);

    return {
      reportType: configuration.templateName,
      generatedAt: new Date().toISOString(),
      summary: {
        totalInvoices: rows.length,
        totalUnpaid,
        asOf: asOfDate.toISOString()
      },
      rows
    };
  }

  const rows = txFiltered.map((tx) => ({
    transactionId: tx.transactionId,
    invoiceNumber: tx.invoiceNumber,
    buyerName: tx.buyerName,
    supplierName: tx.supplierName,
    transactionType: tx.transactionType || 'factoring',
    currency: tx.currency || 'USD',
    status: tx.status,
    invoiceAmount: tx.invoiceValue || tx.invoiceAmount || 0,
    createdAt: tx.createdAt
  }));

  return {
    reportType: configuration.templateName,
    generatedAt: new Date().toISOString(),
    summary: {
      totalTransactions: rows.length,
      totalInvoiceAmount: rows.reduce((sum, row) => sum + (row.invoiceAmount || 0), 0),
      currencies: new Set(rows.map((row) => String(row.currency || '').toUpperCase())).size
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
    const requestedFormat = String(req.query.format || 'excel').toLowerCase() as OutputFormat;
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
      filters: {
        dateRange: {
          from: typeof req.query.from === 'string' ? req.query.from : '',
          to: typeof req.query.to === 'string' ? req.query.to : ''
        },
        status: parseListQueryParam(req.query.invoiceState),
        customFilters: {
          buyerName: typeof req.query.buyerName === 'string' ? req.query.buyerName : '',
          supplierName: typeof req.query.supplierName === 'string' ? req.query.supplierName : '',
          transactionType: typeof req.query.transactionType === 'string' ? req.query.transactionType : '',
          currency: typeof req.query.currency === 'string' ? req.query.currency : ''
        }
      },
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

    let generated;
    try {
      generated = await buildDownloadFile(execution, payload, outputFormat);
    } catch (generationError) {
      if (outputFormat !== 'pdf') {
        throw generationError;
      }

      console.error('PDF generation failed, falling back to Excel:', generationError);
      generated = await buildDownloadFile(execution, payload, 'excel');
      res.setHeader('X-Report-Format-Fallback', 'excel');
    }

    res.setHeader('Content-Type', generated.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${generated.fileName}"`);
    res.send(generated.content);
  } catch (error) {
    console.error('Direct report download error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/filter-options', async (req, res) => {
  try {
    const [transactions, entities] = await Promise.all([
      listTransactions(),
      listEntities()
    ]);

    const buyerSet = new Set<string>();
    const supplierSet = new Set<string>();
    const transactionTypeSet = new Set<string>();
    const currencySet = new Set<string>();

    for (const tx of transactions) {
      const buyerName = String(tx.buyerName || '').trim();
      const supplierName = String(tx.supplierName || '').trim();
      const transactionType = String((tx as any).transactionType || '').trim();
      const currency = String((tx as any).currency || '').trim().toUpperCase();
      if (buyerName) buyerSet.add(buyerName);
      if (supplierName) supplierSet.add(supplierName);
      if (transactionType) transactionTypeSet.add(transactionType);
      if (currency) currencySet.add(currency);
    }

    for (const entity of entities) {
      const name = String((entity as any).name || '').trim();
      const type = String((entity as any).type || '').toLowerCase();
      if (!name) continue;
      if (type === 'buyer') buyerSet.add(name);
      if (type === 'supplier') supplierSet.add(name);
    }

    res.json({
      success: true,
      data: {
        buyers: Array.from(buyerSet).sort((a, b) => a.localeCompare(b)),
        suppliers: Array.from(supplierSet).sort((a, b) => a.localeCompare(b)),
        transactionTypes: Array.from(transactionTypeSet).sort((a, b) => a.localeCompare(b)),
        currencies: Array.from(currencySet).sort((a, b) => a.localeCompare(b))
      }
    });
  } catch (error) {
    console.error('Report filter options error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get transaction reports - simplified
router.get('/transactions', async (req, res) => {
  try {
    const transactions = (await listTransactions()).slice(0, 100);
    
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
    const totalTransactions = (await listTransactions()).length;
    const entities = (await listEntities()).length;
    
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
    const totalTransactions = (await listTransactions()).length;
    
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
    const totalFees = (await listTransactions()).reduce((sum, tx) => sum + (tx.feeAmount || 0), 0);
    
    res.json({
      success: true,
      data: {
        totalRevenue: totalFees || 0,
        totalExpenses: 0,
        netProfit: totalFees || 0,
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
    const allEntities = await listEntities();
    const entities = allEntities
      .sort((a, b) => {
        const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bCreated - aCreated;
      })
      .slice(0, 50);
    const totalCount = allEntities.length;
    
    res.json({
      success: true,
      data: {
        entities,
        summary: {
          totalEntities: totalCount,
          suppliers: allEntities.filter((entity) => entity.type === 'supplier').length,
          buyers: allEntities.filter((entity) => entity.type === 'buyer').length
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