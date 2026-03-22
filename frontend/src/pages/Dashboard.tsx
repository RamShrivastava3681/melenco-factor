import { useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  Area,
  AreaChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  Brain,
  CircleDollarSign,
  File,
  FileCheck2,
  FileClock,
  FileWarning,
  Landmark,
  Loader2,
  Moon,
  RefreshCw,
  Sun,
  Wallet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { createApiUrl, getApiHeaders } from '@/config/api';

type InvoiceStatus = 'Open' | 'Closed' | 'Overdue';

type ActivityType = 'funded' | 'payment' | 'deal';

interface OpenInvoice {
  id: string;
  invoiceNumber?: string;
  buyerName?: string;
  supplierName?: string;
  invoiceAmount?: number;
  paidAmount?: number;
  reserves?: number;
  feeAmount?: number;
  lateFees?: number;
  processingFee?: number;
  transactionFee?: number;
  currency?: string;
  isOverdue?: boolean;
  agingDays?: number;
  createdAt?: string;
  fundedAt?: string;
  paymentHistory?: Array<{ paidAt?: string; amount?: number }>;
}

interface ClosedInvoice {
  id: string;
  invoiceNumber?: string;
  buyerName?: string;
  supplierName?: string;
  invoiceAmount?: number;
  paidAmount?: number;
  reserves?: number;
  feeAmount?: number;
  lateFees?: number;
  processingFee?: number;
  transactionFee?: number;
  currency?: string;
  settledAt?: string;
  createdAt?: string;
  paymentHistory?: Array<{ paidAt?: string; amount?: number }>;
}

interface TransactionRecord {
  transactionId?: string;
  invoiceNumber?: string;
  buyerName?: string;
  supplierName?: string;
  currency?: string;
  invoiceValue?: number;
  invoiceAmount?: number;
  advanceAmount?: number;
  feeAmount?: number;
  processingFee?: number;
  transactionFee?: number;
  factoringFee?: number;
  setupFee?: number;
  status?: string;
  fundedAt?: string;
  createdAt?: string;
}

interface EntityRecord {
  name?: string;
  type?: 'supplier' | 'buyer';
  country?: string;
}

interface InvoiceTableRow {
  id: string;
  buyer: string;
  country: string;
  amount: number;
  status: InvoiceStatus;
}

interface DashboardKpi {
  key: string;
  title: string;
  value: string;
  series: number[];
  gradient: string;
  icon: ComponentType<{ className?: string }>;
}

interface ActivityItem {
  id: string;
  title: string;
  time: string;
  description: string;
  type: ActivityType;
  ts: number;
}

const PIE_COLORS = ['#8B5CF6', '#3B82F6', '#F97316'];
const SPARKLINE_COLOR = '#ffffff';

const money = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value || 0);

const number = (value: number) => new Intl.NumberFormat('en-US').format(value || 0);

const safeDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const relativeTime = (timestamp?: string) => {
  const date = safeDate(timestamp);
  if (!date) return 'recently';

  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

const statusBadgeClass: Record<InvoiceStatus, string> = {
  Open: 'bg-blue-100 text-blue-700 border-blue-200',
  Closed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Overdue: 'bg-rose-100 text-rose-700 border-rose-200',
};

const activityIconMap = {
  funded: FileCheck2,
  payment: Activity,
  deal: Landmark,
};

function Sparkline({ values }: { values: number[] }) {
  const data = values.map((value, index) => ({ index, value }));

  return (
    <div className="h-12 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" stroke={SPARKLINE_COLOR} strokeWidth={2.2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Dashboard() {
  const [isDark, setIsDark] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all');
  const [page, setPage] = useState(1);

  const [openInvoices, setOpenInvoices] = useState<OpenInvoice[]>([]);
  const [closedInvoices, setClosedInvoices] = useState<ClosedInvoice[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [entities, setEntities] = useState<EntityRecord[]>([]);
  const [fxRates, setFxRates] = useState<Record<string, number>>({ USD: 1 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const pageSize = 5;

  const loadData = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const [openRes, closedRes, txRes, entityRes, ratesRes] = await Promise.all([
        fetch(createApiUrl('/treasury/open-invoices'), { headers: getApiHeaders() }),
        fetch(createApiUrl('/treasury/closed-invoices'), { headers: getApiHeaders() }),
        fetch(createApiUrl('/transactions'), { headers: getApiHeaders() }),
        fetch(createApiUrl('/entities'), { headers: getApiHeaders() }),
        fetch(createApiUrl('/currency/rates?base=USD'), { headers: getApiHeaders() }),
      ]);

      const openJson = openRes.ok ? await openRes.json() : { data: [] };
      const closedJson = closedRes.ok ? await closedRes.json() : { data: [] };
      const txJson = txRes.ok ? await txRes.json() : { data: [] };
      const entityJson = entityRes.ok ? await entityRes.json() : { data: [] };
      const ratesJson = ratesRes.ok ? await ratesRes.json() : null;

      setOpenInvoices(Array.isArray(openJson?.data) ? openJson.data : []);
      setClosedInvoices(Array.isArray(closedJson?.data) ? closedJson.data : []);
      setTransactions(Array.isArray(txJson?.data) ? txJson.data : []);
      setEntities(Array.isArray(entityJson?.data) ? entityJson.data : []);
      if (ratesJson?.data?.rates && typeof ratesJson.data.rates === 'object') {
        setFxRates(ratesJson.data.rates);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setOpenInvoices([]);
      setClosedInvoices([]);
      setTransactions([]);
      setEntities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const convertToUsd = (amount: number, currency?: string) => {
    const normalizedCurrency = String(currency || 'USD').toUpperCase();
    if (normalizedCurrency === 'USD') return amount;
    const rate = fxRates[normalizedCurrency];
    if (!rate || rate <= 0) return amount;
    return amount / rate;
  };

  const formatCurrencyAmount = (amount: number, currency?: string) => {
    const normalizedCurrency = String(currency || 'USD').toUpperCase();
    return `${number(amount)} ${normalizedCurrency}`;
  };

  const monthlyTrend = useMemo(() => {
    const today = new Date();
    const points: Array<{ label: string; amount: number; funded: number; closed: number; open: number; overdue: number; outstanding: number }> = [];

    for (let index = 7; index >= 0; index -= 1) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - index, 1);
      const monthLabel = monthDate.toLocaleString('en-US', { month: 'short' });

      const txThisMonth = transactions.filter((tx) => {
        const date = safeDate(tx.createdAt || tx.fundedAt);
        return date && date.getMonth() === monthDate.getMonth() && date.getFullYear() === monthDate.getFullYear();
      });

      const openThisMonth = openInvoices.filter((inv) => {
        const date = safeDate(inv.createdAt || inv.fundedAt);
        return date && date.getMonth() === monthDate.getMonth() && date.getFullYear() === monthDate.getFullYear();
      });

      const closedThisMonth = closedInvoices.filter((inv) => {
        const date = safeDate(inv.settledAt || inv.createdAt);
        return date && date.getMonth() === monthDate.getMonth() && date.getFullYear() === monthDate.getFullYear();
      });

      const overdueThisMonth = openThisMonth.filter((inv) => Boolean(inv.isOverdue || (inv.agingDays || 0) > 0));
      const fundedAmount = txThisMonth.reduce((sum, tx) => sum + convertToUsd(tx.advanceAmount || 0, tx.currency), 0);
      const outstandingAmount = openThisMonth.reduce((sum, inv) => sum + convertToUsd(Math.max(0, (inv.invoiceAmount || 0) - (inv.paidAmount || 0)), inv.currency), 0);

      points.push({
        label: monthLabel,
        amount: Math.round(fundedAmount),
        funded: txThisMonth.length,
        closed: closedThisMonth.length,
        open: openThisMonth.length,
        overdue: overdueThisMonth.length,
        outstanding: Math.round(outstandingAmount),
      });
    }

    return points;
  }, [transactions, openInvoices, closedInvoices, fxRates]);

  const totals = useMemo(() => {
    const totalOpenInvoices = openInvoices.length;
    const totalClosedInvoices = closedInvoices.length;
    const totalOverdueInvoices = openInvoices.filter((inv) => Boolean(inv.isOverdue || (inv.agingDays || 0) > 0)).length;

    const totalAmountFunded = transactions.reduce((sum, tx) => sum + convertToUsd(tx.advanceAmount || 0, tx.currency), 0);
    const totalAmountOutstanding = openInvoices.reduce((sum, inv) => sum + convertToUsd(Math.max(0, (inv.invoiceAmount || 0) - (inv.paidAmount || 0)), inv.currency), 0);

    const totalReserveHolding = openInvoices.reduce((sum, inv) => sum + (inv.reserves || 0), 0);
    const lateFeesOpen = openInvoices.reduce((sum, inv) => sum + (inv.lateFees || 0), 0);
    const lateFeesClosed = closedInvoices.reduce((sum, inv) => sum + (inv.lateFees || 0), 0);
    const lateFees = lateFeesOpen + lateFeesClosed;
    const processingFees = transactions.reduce((sum, tx) => sum + (tx.processingFee || 0), 0);
    const transactionFees = transactions.reduce((sum, tx) => {
      const explicitTransactionFee = tx.transactionFee || 0;
      if (explicitTransactionFee > 0) return sum + explicitTransactionFee;

      const totalFeeAmount = tx.feeAmount || 0;
      const knownNonTransactionFees = (tx.processingFee || 0) + (tx.factoringFee || 0) + (tx.setupFee || 0);
      return sum + Math.max(0, totalFeeAmount - knownNonTransactionFees);
    }, 0);
    const totalTransactionFees = transactions.reduce((sum, tx) => sum + (tx.feeAmount || 0), 0);
    const totalFeesEarned = totalTransactionFees + lateFees;

    const totalSuppliers = new Set(entities.filter((entity) => entity.type === 'supplier').map((entity) => entity.name).filter(Boolean)).size;
    const totalBuyers = new Set(entities.filter((entity) => entity.type === 'buyer').map((entity) => entity.name).filter(Boolean)).size;

    return {
      totalFundedInvoices: totalOpenInvoices + totalClosedInvoices,
      totalClosedInvoices,
      totalOpenInvoices,
      totalOverdueInvoices,
      totalAmountFunded,
      totalAmountOutstanding,
      totalReserveHolding,
      totalFeesEarned,
      lateFees,
      processingFees,
      transactionFees,
      totalSuppliers,
      totalBuyers,
    };
  }, [openInvoices, closedInvoices, transactions, entities, fxRates]);

  const kpis: DashboardKpi[] = useMemo(
    () => [
      {
        key: 'funded',
        title: 'Total Funded Invoices',
        value: number(totals.totalFundedInvoices),
        series: monthlyTrend.map((item) => item.funded),
        gradient: 'from-violet-600 via-fuchsia-600 to-indigo-500',
        icon: FileCheck2,
      },
      {
        key: 'closed',
        title: 'Total Closed Invoices',
        value: number(totals.totalClosedInvoices),
        series: monthlyTrend.map((item) => item.closed),
        gradient: 'from-blue-600 via-cyan-500 to-sky-500',
        icon: Wallet,
      },
      {
        key: 'open',
        title: 'Total Open Invoices',
        value: number(totals.totalOpenInvoices),
        series: monthlyTrend.map((item) => item.open),
        gradient: 'from-orange-500 via-amber-500 to-yellow-500',
        icon: File,
      },
      {
        key: 'overdue',
        title: 'Total Overdue Invoices',
        value: number(totals.totalOverdueInvoices),
        series: monthlyTrend.map((item) => item.overdue),
        gradient: 'from-rose-500 via-pink-500 to-red-500',
        icon: FileWarning,
      },
      {
        key: 'amountFunded',
        title: 'Total Amount Funded ($)',
        value: money(totals.totalAmountFunded),
        series: monthlyTrend.map((item) => item.amount),
        gradient: 'from-indigo-600 via-purple-500 to-pink-500',
        icon: CircleDollarSign,
      },
      {
        key: 'amountOutstanding',
        title: 'Total Amount Outstanding ($)',
        value: money(totals.totalAmountOutstanding),
        series: monthlyTrend.map((item) => item.outstanding),
        gradient: 'from-blue-600 via-indigo-500 to-violet-500',
        icon: Landmark,
      },
    ],
    [totals, monthlyTrend]
  );

  const statusData = useMemo(
    () => [
      { name: 'Closed' as const, value: totals.totalClosedInvoices },
      { name: 'Open' as const, value: totals.totalOpenInvoices },
      { name: 'Overdue' as const, value: totals.totalOverdueInvoices },
    ],
    [totals.totalClosedInvoices, totals.totalOpenInvoices, totals.totalOverdueInvoices]
  );

  const fundedByCurrencyData = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((tx) => {
      const currency = String(tx.currency || 'USD').toUpperCase();
      const amount = tx.advanceAmount || 0;
      map.set(currency, (map.get(currency) || 0) + amount);
    });

    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const outstandingByCurrencyData = useMemo(() => {
    const map = new Map<string, number>();
    openInvoices.forEach((inv) => {
      const currency = String(inv.currency || 'USD').toUpperCase();
      const amount = Math.max(0, (inv.invoiceAmount || 0) - (inv.paidAmount || 0));
      map.set(currency, (map.get(currency) || 0) + amount);
    });

    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [openInvoices]);

  const buyerCountryMap = useMemo(() => {
    const map = new Map<string, string>();
    entities.forEach((entity) => {
      if (entity.type === 'buyer' && entity.name) {
        map.set(entity.name.toLowerCase(), entity.country || 'N/A');
      }
    });
    return map;
  }, [entities]);

  const invoiceRows = useMemo<InvoiceTableRow[]>(() => {
    const openRows = openInvoices.map((inv) => ({
      id: inv.invoiceNumber || inv.id,
      buyer: inv.buyerName || 'Unknown Buyer',
      country: buyerCountryMap.get((inv.buyerName || '').toLowerCase()) || 'N/A',
      amount: inv.invoiceAmount || 0,
      status: (inv.isOverdue || (inv.agingDays || 0) > 0 ? 'Overdue' : 'Open') as InvoiceStatus,
    }));

    const closedRows = closedInvoices.map((inv) => ({
      id: inv.invoiceNumber || inv.id,
      buyer: inv.buyerName || 'Unknown Buyer',
      country: buyerCountryMap.get((inv.buyerName || '').toLowerCase()) || 'N/A',
      amount: inv.invoiceAmount || 0,
      status: 'Closed' as const,
    }));

    return [...openRows, ...closedRows].filter((row) => row.id);
  }, [openInvoices, closedInvoices, buyerCountryMap]);

  const activities = useMemo<ActivityItem[]>(() => {
    const activityList: ActivityItem[] = [];

    transactions.slice(0, 6).forEach((tx, index) => {
      const createdAt = tx.createdAt;
      activityList.push({
        id: `deal-${tx.transactionId || index}`,
        title: 'Deal added',
        time: relativeTime(createdAt),
        description: `New deal created for ${tx.buyerName || 'buyer'} (${tx.invoiceNumber || tx.transactionId || 'invoice'})`,
        type: 'deal',
        ts: safeDate(createdAt)?.getTime() || 0,
      });

      if (tx.fundedAt) {
        activityList.push({
          id: `funded-${tx.transactionId || index}`,
          title: 'Invoice funded',
          time: relativeTime(tx.fundedAt),
          description: `${tx.invoiceNumber || tx.transactionId || 'Invoice'} funded for ${tx.supplierName || 'supplier'}`,
          type: 'funded',
          ts: safeDate(tx.fundedAt)?.getTime() || 0,
        });
      }
    });

    [...openInvoices, ...closedInvoices].forEach((inv, invIndex) => {
      (inv.paymentHistory || []).slice(-1).forEach((payment, payIndex) => {
        activityList.push({
          id: `pay-${inv.id}-${invIndex}-${payIndex}`,
          title: 'Payment received',
          time: relativeTime(payment.paidAt),
          description: `Payment ${money(payment.amount || 0)} received for ${inv.invoiceNumber || inv.id}`,
          type: 'payment',
          ts: safeDate(payment.paidAt)?.getTime() || 0,
        });
      });
    });

    return activityList
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 5);
  }, [transactions, openInvoices, closedInvoices]);

  const filteredRows = useMemo(() => {
    return invoiceRows.filter((row) => {
      const textMatch =
        row.id.toLowerCase().includes(query.toLowerCase()) ||
        row.buyer.toLowerCase().includes(query.toLowerCase()) ||
        row.country.toLowerCase().includes(query.toLowerCase());
      const statusMatch = statusFilter === 'all' || row.status === statusFilter;
      return textMatch && statusMatch;
    });
  }, [invoiceRows, query, statusFilter]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const statusTotal = statusData.reduce((sum, item) => sum + item.value, 0) || 1;

  const topOverdueBuyers = useMemo(() => {
    const map = new Map<string, number>();
    openInvoices
      .filter((invoice) => Boolean(invoice.isOverdue || (invoice.agingDays || 0) > 0))
      .forEach((invoice) => {
        const buyer = invoice.buyerName || 'Unknown Buyer';
        const outstanding = Math.max(0, (invoice.invoiceAmount || 0) - (invoice.paidAmount || 0));
        map.set(buyer, (map.get(buyer) || 0) + outstanding);
      });

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);
  }, [openInvoices]);

  const insightText = useMemo(() => {
    if (totals.totalOverdueInvoices === 0) {
      return 'Overdue invoices are currently under control with no active overdue positions. Maintain current collection cadence to preserve this trend.';
    }

    const topBuyerNames = topOverdueBuyers.map(([name]) => name).join(' and ') || 'top buyers';
    const topBuyerShare = topOverdueBuyers.reduce((sum, [, amount]) => sum + amount, 0);
    const sharePct = totals.totalAmountOutstanding > 0 ? Math.round((topBuyerShare / totals.totalAmountOutstanding) * 100) : 0;

    return `Overdue invoices currently stand at ${totals.totalOverdueInvoices}, with ${sharePct}% of outstanding exposure concentrated in ${topBuyerNames}. Prioritize follow-ups on these accounts to improve cash conversion.`;
  }, [totals.totalOverdueInvoices, totals.totalAmountOutstanding, topOverdueBuyers]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter]);

  if (loading) {
    return (
      <div className="p-6 min-h-full flex items-center justify-center">
        <Card className="w-full max-w-md rounded-3xl">
          <CardContent className="py-12 flex items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading dashboard data...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('min-h-full p-6 transition-colors duration-300', isDark ? 'bg-slate-950 text-slate-100' : 'bg-gradient-to-b from-purple-50 via-blue-50 to-pink-50 text-slate-900')}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Whizunik Dashboard</h1>
          <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>Premium trade finance intelligence with live application data</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className={cn('rounded-full', isDark ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-300')}
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', refreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDark((prev) => !prev)}
            className={cn('rounded-full', isDark ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-300')}
          >
            {isDark ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {kpis.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.key} className={cn('rounded-3xl border-0 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-gradient-to-br text-white', item.gradient)}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-sm text-white/90 font-medium">{item.title}</CardTitle>
                  <div className="p-2 rounded-xl bg-white/20 shadow-sm">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{item.value}</div>
                <Sparkline values={item.series} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <Card className={cn('rounded-3xl shadow-md border-0 transition-all duration-300 hover:shadow-xl', isDark ? 'bg-slate-900' : 'bg-white')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileClock className="w-5 h-5 text-indigo-500" />
              Invoice Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(value: number) => money(value)} />
                <Area type="monotone" dataKey="amount" stroke="#7C3AED" strokeWidth={3} fill="url(#trendFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className={cn('rounded-3xl shadow-md border-0 transition-all duration-300 hover:shadow-xl', isDark ? 'bg-slate-900' : 'bg-white')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Invoice Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[340px]">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={3}>
                  {statusData.map((_, index) => (
                    <Cell key={`status-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => number(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {statusData.map((item, index) => (
                <div key={item.name} className={cn('rounded-xl p-2 text-center', isDark ? 'bg-slate-800' : 'bg-slate-50')}>
                  <div className="text-xs" style={{ color: PIE_COLORS[index] }}>{item.name}</div>
                  <div className="font-semibold">{Math.round((item.value / statusTotal) * 100)}%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <Card className={cn('rounded-3xl shadow-md border-0 transition-all duration-300 hover:shadow-xl', isDark ? 'bg-slate-900' : 'bg-white')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleDollarSign className="w-5 h-5 text-violet-500" />
              Funded Amount by Currency
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie data={fundedByCurrencyData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={105} paddingAngle={3}>
                  {fundedByCurrencyData.map((_, index) => (
                    <Cell key={`funded-currency-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, _name: string, props: any) => formatCurrencyAmount(value, props?.payload?.name)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {fundedByCurrencyData.map((item, index) => (
                <div key={item.name} className={cn('rounded-xl p-2 text-center', isDark ? 'bg-slate-800' : 'bg-slate-50')}>
                  <div className="text-xs" style={{ color: PIE_COLORS[index % PIE_COLORS.length] }}>{item.name}</div>
                  <div className="font-semibold text-sm">{number(item.value)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={cn('rounded-3xl shadow-md border-0 transition-all duration-300 hover:shadow-xl', isDark ? 'bg-slate-900' : 'bg-white')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-blue-500" />
              Outstanding Amount by Currency
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie data={outstandingByCurrencyData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={105} paddingAngle={3}>
                  {outstandingByCurrencyData.map((_, index) => (
                    <Cell key={`outstanding-currency-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, _name: string, props: any) => formatCurrencyAmount(value, props?.payload?.name)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {outstandingByCurrencyData.map((item, index) => (
                <div key={item.name} className={cn('rounded-xl p-2 text-center', isDark ? 'bg-slate-800' : 'bg-slate-50')}>
                  <div className="text-xs" style={{ color: PIE_COLORS[index % PIE_COLORS.length] }}>{item.name}</div>
                  <div className="font-semibold text-sm">{number(item.value)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <Card className={cn('xl:col-span-1 rounded-3xl shadow-md border-0 transition-all duration-300 hover:shadow-xl', isDark ? 'bg-slate-900' : 'bg-white')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-500" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities.length === 0 ? (
              <div className={cn('rounded-2xl p-3 border text-sm', isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500')}>
                No recent activity found.
              </div>
            ) : (
              activities.map((activity) => {
                const Icon = activityIconMap[activity.type] || Activity;
                return (
                  <div key={activity.id} className={cn('rounded-2xl p-3 border transition-all duration-300 hover:-translate-y-0.5', isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100')}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-md">
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{activity.title}</div>
                        <div className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-slate-500')}>{activity.description}</div>
                        <div className="text-xs text-violet-500 mt-1">{activity.time}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className={cn('xl:col-span-2 rounded-3xl shadow-md border-0 transition-all duration-300 hover:shadow-xl', isDark ? 'bg-slate-900' : 'bg-white')}>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <FileClock className="w-5 h-5 text-blue-500" />
                Invoice Table
              </CardTitle>

              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Search invoice, buyer, country"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className={cn('w-full sm:w-64 rounded-full', isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50')}
                />
                <div className="flex gap-1 flex-wrap">
                  {(['all', 'Open', 'Closed', 'Overdue'] as const).map((status) => (
                    <Button
                      key={status}
                      variant={statusFilter === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStatusFilter(status)}
                      className="rounded-full"
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn('rounded-2xl border overflow-x-auto', isDark ? 'border-slate-700' : 'border-slate-100')}>
              <table className="w-full text-sm min-w-[680px]">
                <thead className={cn(isDark ? 'bg-slate-800' : 'bg-slate-50')}>
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Invoice ID</th>
                    <th className="text-left px-4 py-3 font-semibold">Buyer / Customer</th>
                    <th className="text-left px-4 py-3 font-semibold">Country</th>
                    <th className="text-left px-4 py-3 font-semibold">Amount</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row) => (
                    <tr key={`${row.id}-${row.status}`} className={cn('border-t transition-colors', isDark ? 'border-slate-700 hover:bg-slate-800/70' : 'border-slate-100 hover:bg-slate-50')}>
                      <td className="px-4 py-3 font-medium">{row.id}</td>
                      <td className="px-4 py-3">{row.buyer}</td>
                      <td className="px-4 py-3">{row.country}</td>
                      <td className="px-4 py-3">{money(row.amount)}</td>
                      <td className="px-4 py-3">
                        <Badge className={cn('border', statusBadgeClass[row.status])}>{row.status}</Badge>
                      </td>
                    </tr>
                  ))}
                  {paginatedRows.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>No invoices match your filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                Showing {paginatedRows.length} of {filteredRows.length} invoices
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>
                  Previous
                </Button>
                <span className="text-sm font-medium">Page {page} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page === totalPages}>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className={cn('xl:col-span-2 rounded-3xl border-0 shadow-md transition-all duration-300 hover:shadow-xl', isDark ? 'bg-slate-900' : 'bg-white')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-500" />
              Whizunik Insight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn('rounded-2xl p-4 border bg-gradient-to-r', isDark ? 'from-slate-800 to-slate-900 border-slate-700' : 'from-violet-50 to-blue-50 border-indigo-100')}>
              <p className="text-sm leading-relaxed">{insightText}</p>
            </div>
          </CardContent>
        </Card>

        <Card className={cn('xl:col-span-1 rounded-3xl border-0 shadow-md transition-all duration-300 hover:shadow-xl', isDark ? 'bg-slate-900' : 'bg-white')}>
          <CardHeader>
            <CardTitle className="text-base">Additional Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible defaultValue="metrics">
              <AccordionItem value="metrics" className={cn('rounded-2xl px-3', isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50')}>
                <AccordionTrigger className="text-sm">Business Logic Metrics</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {[
                      { label: 'Total Reserve Holding', value: money(totals.totalReserveHolding) },
                      { label: 'Total Fees Earned', value: money(totals.totalFeesEarned) },
                      { label: 'Late Fees', value: money(totals.lateFees) },
                      { label: 'Processing Fees', value: money(totals.processingFees) },
                      { label: 'Transaction Fees', value: money(totals.transactionFees) },
                      { label: 'Total Suppliers', value: number(totals.totalSuppliers) },
                      { label: 'Total Buyers', value: number(totals.totalBuyers) },
                    ].map((metric) => (
                      <div key={metric.label} className={cn('flex items-center justify-between rounded-xl px-3 py-2', isDark ? 'bg-slate-900' : 'bg-white')}>
                        <span className="text-xs">{metric.label}</span>
                        <span className="font-semibold text-sm">{metric.value}</span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>


    </div>
  );
}
