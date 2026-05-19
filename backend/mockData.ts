// Mock data for backend routes (kept empty for production)
export const mockBuyers: any[] = [];
export const mockSuppliers: any[] = [];
export const mockTransactions: any[] = [];

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
  }
};

export const mockAlerts: any[] = [];
export const mockReports: any[] = [];
export const mockDisbursements: any[] = [];
export const mockReserves: any[] = [];
export const mockFeeConfigurations: any[] = [];
export const mockLimitConfigurations: any[] = [];
