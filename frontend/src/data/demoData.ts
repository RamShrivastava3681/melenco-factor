// Mock data for all portal sections - cleared for production
export const mockBuyers: any[] = [];

export const mockSuppliers: any[] = [];

export const mockTransactions: any[] = [
  {
    id: 'TXN-CLOSED-001',
    invoiceNumber: 'Captain Corsaire Invoice.pdf',
    supplierName: 'Captain Corsaire',
    buyerName: 'Sample Buyer Corp',
    invoiceAmount: 18250,
    currency: 'USD',
    status: 'settled',
    createdAt: '2026-01-05T09:00:00.000Z',
    dueDate: '2026-02-19'
  },
  {
    id: 'TXN-CLOSED-002',
    invoiceNumber: 'COMPASS TEX LIMITED Invoice.pdf',
    supplierName: 'COMPASS TEX LIMITED',
    buyerName: 'Sample Buyer Corp',
    invoiceAmount: 24900,
    currency: 'USD',
    status: 'settled',
    createdAt: '2026-01-07T09:00:00.000Z',
    dueDate: '2026-02-21'
  },
  {
    id: 'TXN-CLOSED-003',
    invoiceNumber: 'Diesel SPA - Canada Invoice.pdf',
    supplierName: 'Diesel SPA - Canada',
    buyerName: 'Sample Buyer Corp',
    invoiceAmount: 31700,
    currency: 'USD',
    status: 'settled',
    createdAt: '2026-01-09T09:00:00.000Z',
    dueDate: '2026-02-23'
  },
  {
    id: 'TXN-CLOSED-004',
    invoiceNumber: 'Inv XL 33.xls',
    supplierName: 'Inv XL 33',
    buyerName: 'Sample Buyer Corp',
    invoiceAmount: 22600,
    currency: 'USD',
    status: 'settled',
    createdAt: '2026-01-11T09:00:00.000Z',
    dueDate: '2026-02-25'
  },
  {
    id: 'TXN-CLOSED-005',
    invoiceNumber: 'INV-53-655-2025 REVISED.pdf',
    supplierName: 'INV-53-655-2025 REVISED',
    buyerName: 'Sample Buyer Corp',
    invoiceAmount: 19840,
    currency: 'USD',
    status: 'settled',
    createdAt: '2026-01-13T09:00:00.000Z',
    dueDate: '2026-02-27'
  },
  {
    id: 'TXN-CLOSED-006',
    invoiceNumber: 'INVOICE  PL - DREX0045.pdf',
    supplierName: 'PL - DREX0045',
    buyerName: 'Sample Buyer Corp',
    invoiceAmount: 27450,
    currency: 'USD',
    status: 'settled',
    createdAt: '2026-01-15T09:00:00.000Z',
    dueDate: '2026-03-01'
  },
  {
    id: 'TXN-CLOSED-007',
    invoiceNumber: 'JOE BROWNS LIMITED Invoice.pdf',
    supplierName: 'JOE BROWNS LIMITED',
    buyerName: 'Sample Buyer Corp',
    invoiceAmount: 21375,
    currency: 'USD',
    status: 'settled',
    createdAt: '2026-01-17T09:00:00.000Z',
    dueDate: '2026-03-03'
  },
  {
    id: 'TXN-CLOSED-008',
    invoiceNumber: 'Mossy Oak Invoice.pdf',
    supplierName: 'Mossy Oak',
    buyerName: 'Sample Buyer Corp',
    invoiceAmount: 16890,
    currency: 'USD',
    status: 'settled',
    createdAt: '2026-01-19T09:00:00.000Z',
    dueDate: '2026-03-05'
  },
  {
    id: 'TXN-CLOSED-009',
    invoiceNumber: 'REVOLVER INC LTD Invoice.pdf',
    supplierName: 'REVOLVER INC LTD',
    buyerName: 'Sample Buyer Corp',
    invoiceAmount: 29500,
    currency: 'USD',
    status: 'settled',
    createdAt: '2026-01-21T09:00:00.000Z',
    dueDate: '2026-03-07'
  },
  {
    id: 'TXN-CLOSED-010',
    invoiceNumber: 'STAR DESIGN GROUP INC Invoice.pdf',
    supplierName: 'STAR DESIGN GROUP INC',
    buyerName: 'Sample Buyer Corp',
    invoiceAmount: 26120,
    currency: 'USD',
    status: 'settled',
    createdAt: '2026-01-23T09:00:00.000Z',
    dueDate: '2026-03-09'
  },
  {
    id: 'TXN-CLOSED-011',
    invoiceNumber: 'TBS Technisynthese Invoice.pdf',
    supplierName: 'TBS Technisynthese',
    buyerName: 'Sample Buyer Corp',
    invoiceAmount: 18430,
    currency: 'USD',
    status: 'settled',
    createdAt: '2026-01-25T09:00:00.000Z',
    dueDate: '2026-03-11'
  },
  {
    id: 'TXN-CLOSED-012',
    invoiceNumber: 'The Sting Sourcing & Productions Holding B.V.pdf',
    supplierName: 'The Sting Sourcing & Productions Holding B.V',
    buyerName: 'Sample Buyer Corp',
    invoiceAmount: 33880,
    currency: 'USD',
    status: 'settled',
    createdAt: '2026-01-27T09:00:00.000Z',
    dueDate: '2026-03-13'
  },
  {
    id: 'TXN-CLOSED-013',
    invoiceNumber: 'UNITCOTTON APS Invoice.pdf',
    supplierName: 'UNITCOTTON APS',
    buyerName: 'Sample Buyer Corp',
    invoiceAmount: 17220,
    currency: 'USD',
    status: 'settled',
    createdAt: '2026-01-29T09:00:00.000Z',
    dueDate: '2026-03-15'
  },
  {
    id: 'TXN-CLOSED-014',
    invoiceNumber: 'VOIA FASHION Invoice.pdf',
    supplierName: 'VOIA FASHION',
    buyerName: 'Sample Buyer Corp',
    invoiceAmount: 24110,
    currency: 'USD',
    status: 'settled',
    createdAt: '2026-01-31T09:00:00.000Z',
    dueDate: '2026-03-17'
  }
];

export const mockDashboardKPIs = {
  totalTransactions: {
    value: 0,
    change: 0,
    trend: 'up' as const
  },
  totalFeesEarned: {
    value: 0,
    change: 0,
    trend: 'up' as const,
    currency: 'USD'
  },
  totalReserves: {
    value: 0,
    change: 0,
    trend: 'up' as const,
    currency: 'USD'
  },
  portfolioUtilization: {
    value: 0,
    change: 0,
    trend: 'up' as const,
    unit: '%'
  },
  totalDueAmount: {
    value: 0,
    change: 0,
    trend: 'down' as const,
    currency: 'USD'
  }
};

export const mockAlerts: any[] = [];

export const mockReports: any[] = [];

export const mockDisbursements: any[] = [];

export const mockReserves: any[] = [];

export const mockFeeConfigurations: any[] = [];

export const mockLimitConfigurations: any[] = [];