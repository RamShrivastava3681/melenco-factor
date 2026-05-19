import React, { useEffect, useState } from 'react';
import { BarChart3, Download, FileText } from 'lucide-react';
import { createApiUrl, getApiHeaders } from '@/config/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'operational' | 'financial' | 'risk' | 'compliance';
  category: string;
  supportedFormats: ('pdf' | 'csv' | 'excel' | 'json')[];
  isActive: boolean;
}

interface ReportFilters {
  fromDate: string;
  toDate: string;
  buyerName: string;
  supplierName: string;
  invoiceState: 'all' | 'open' | 'closed' | 'overdue';
  transactionType: string;
  currency: string;
}

interface ReportFilterOptions {
  buyers: string[];
  suppliers: string[];
  transactionTypes: string[];
  currencies: string[];
}

const getDefaultFilters = (): ReportFilters => ({
  fromDate: '',
  toDate: '',
  buyerName: 'all',
  supplierName: 'all',
  invoiceState: 'all',
  transactionType: 'all',
  currency: 'all'
});

export default function Reports() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [filtersByTemplate, setFiltersByTemplate] = useState<Record<string, ReportFilters>>({});
  const [filterOptions, setFilterOptions] = useState<ReportFilterOptions>({ buyers: [], suppliers: [], transactionTypes: [], currencies: [] });

  useEffect(() => {
    loadTemplates().catch(console.error);
    loadFilterOptions().catch(console.error);
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch(createApiUrl('/reports/templates'), {
        headers: getApiHeaders()
      });
      const result = await response.json();
      setTemplates(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      console.error('Failed to load report templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const response = await fetch(createApiUrl('/reports/filter-options'), {
        headers: getApiHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to load report filter options');
      }

      const result = await response.json();
      setFilterOptions({
        buyers: Array.isArray(result?.data?.buyers) ? result.data.buyers : [],
        suppliers: Array.isArray(result?.data?.suppliers) ? result.data.suppliers : [],
        transactionTypes: Array.isArray(result?.data?.transactionTypes) ? result.data.transactionTypes : [],
        currencies: Array.isArray(result?.data?.currencies) ? result.data.currencies : []
      });
    } catch (error) {
      console.error('Failed to load report filter options:', error);
      setFilterOptions({ buyers: [], suppliers: [], transactionTypes: [], currencies: [] });
    }
  };

  const getTemplateFilters = (templateId: string): ReportFilters => {
    return filtersByTemplate[templateId] || getDefaultFilters();
  };

  const updateTemplateFilters = (templateId: string, patch: Partial<ReportFilters>) => {
    setFiltersByTemplate((prev) => ({
      ...prev,
      [templateId]: {
        ...(prev[templateId] || getDefaultFilters()),
        ...patch
      }
    }));
  };

  const buildDownloadUrl = (template: ReportTemplate, format: 'pdf' | 'excel') => {
    const requestFormat = template.supportedFormats.includes(format) ? format : 'excel';
    const params = new URLSearchParams({ format: requestFormat });
    const filters = getTemplateFilters(template.id);

    if ((template.id === 'TPL-001' || template.id === 'TPL-002' || template.id === 'TPL-003') && filters.fromDate) {
      params.set('from', filters.fromDate);
    }

    if ((template.id === 'TPL-001' || template.id === 'TPL-002' || template.id === 'TPL-003') && filters.toDate) {
      params.set('to', filters.toDate);
    }

    if ((template.id === 'TPL-001' || template.id === 'TPL-002' || template.id === 'TPL-003') && filters.buyerName !== 'all') {
      params.set('buyerName', filters.buyerName);
    }

    if ((template.id === 'TPL-001' || template.id === 'TPL-002' || template.id === 'TPL-003') && filters.supplierName !== 'all') {
      params.set('supplierName', filters.supplierName);
    }

    if (template.id === 'TPL-002' && filters.invoiceState !== 'all') {
      params.set('invoiceState', filters.invoiceState);
    }

    if (template.id === 'TPL-003' && filters.transactionType !== 'all') {
      params.set('transactionType', filters.transactionType);
    }

    if (template.id === 'TPL-003' && filters.currency !== 'all') {
      params.set('currency', filters.currency);
    }

    return createApiUrl(`/reports/templates/${template.id}/download?${params.toString()}`);
  };

  const handleDownloadReport = async (template: ReportTemplate, format: 'pdf' | 'excel') => {
    try {
      const requestFormat = template.supportedFormats.includes(format) ? format : 'excel';
      setDownloadingKey(`${template.id}:${requestFormat}`);

      const response = await fetch(buildDownloadUrl(template, format), {
        headers: getApiHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const disposition = response.headers.get('content-disposition') || '';
      const matched = disposition.match(/filename=\"?([^\"]+)\"?/i);
      link.download = matched?.[1] || `${template.name.replace(/\s+/g, '_')}.${requestFormat === 'excel' ? 'xlsx' : requestFormat}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download report error:', error);
      toast.error('Failed to download report', {
        description: 'Please try again. You can choose PDF or Excel.'
      });
    } finally {
      setDownloadingKey(null);
    }
  };

  const getTypeBadge = (type: string) => {
    const config = {
      operational: { variant: 'default' as const, label: 'Operational' },
      financial: { variant: 'secondary' as const, label: 'Financial' },
      risk: { variant: 'destructive' as const, label: 'Risk' },
      compliance: { variant: 'outline' as const, label: 'Compliance' }
    };

    return config[type as keyof typeof config] || config.operational;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <BarChart3 className="w-8 h-8 animate-pulse text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground">Download real-time reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
          <CardDescription>Click download to generate and export the latest report data</CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">No report templates available</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.filter((template) => template.isActive).map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant={getTypeBadge(template.type).variant}>
                        {getTypeBadge(template.type).label}
                      </Badge>
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-xs text-muted-foreground">Category: {template.category}</div>
                    <div className="flex gap-1 flex-wrap">
                      {template.supportedFormats.map((format) => (
                        <Badge key={format} variant="outline" className="text-xs">
                          {format.toUpperCase()}
                        </Badge>
                      ))}
                    </div>

                    {(template.id === 'TPL-001' || template.id === 'TPL-002' || template.id === 'TPL-003') && (
                      <div className="space-y-3 rounded-md border border-border p-3">
                        <div className="text-xs font-medium text-muted-foreground">Filters</div>
                        <div className="grid grid-cols-1 gap-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs text-muted-foreground">Date From</Label>
                              <Input
                                type="date"
                                value={getTemplateFilters(template.id).fromDate}
                                onChange={(event) => updateTemplateFilters(template.id, { fromDate: event.target.value })}
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Date To</Label>
                              <Input
                                type="date"
                                value={getTemplateFilters(template.id).toDate}
                                onChange={(event) => updateTemplateFilters(template.id, { toDate: event.target.value })}
                              />
                            </div>
                          </div>

                          {template.id === 'TPL-002' && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Invoice Status</Label>
                              <Select
                                value={getTemplateFilters(template.id).invoiceState}
                                onValueChange={(value: 'all' | 'open' | 'closed' | 'overdue') => {
                                  updateTemplateFilters(template.id, { invoiceState: value });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All</SelectItem>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                  <SelectItem value="overdue">Overdue</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          <div>
                            <Label className="text-xs text-muted-foreground">Buyer</Label>
                            <Select
                              value={getTemplateFilters(template.id).buyerName}
                              onValueChange={(value) => updateTemplateFilters(template.id, { buyerName: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="All buyers" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All buyers</SelectItem>
                                {filterOptions.buyers.map((buyer) => (
                                  <SelectItem key={buyer} value={buyer}>
                                    {buyer}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs text-muted-foreground">Supplier</Label>
                            <Select
                              value={getTemplateFilters(template.id).supplierName}
                              onValueChange={(value) => updateTemplateFilters(template.id, { supplierName: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="All suppliers" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All suppliers</SelectItem>
                                {filterOptions.suppliers.map((supplier) => (
                                  <SelectItem key={supplier} value={supplier}>
                                    {supplier}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {template.id === 'TPL-003' && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Transaction Type</Label>
                              <Select
                                value={getTemplateFilters(template.id).transactionType}
                                onValueChange={(value) => updateTemplateFilters(template.id, { transactionType: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="All transaction types" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All transaction types</SelectItem>
                                  {filterOptions.transactionTypes.map((transactionType) => (
                                    <SelectItem key={transactionType} value={transactionType}>
                                      {transactionType}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {template.id === 'TPL-003' && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Currency</Label>
                              <Select
                                value={getTemplateFilters(template.id).currency}
                                onValueChange={(value) => updateTemplateFilters(template.id, { currency: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="All currencies" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All currencies</SelectItem>
                                  {filterOptions.currencies.map((currency) => (
                                    <SelectItem key={currency} value={currency}>
                                      {currency}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleDownloadReport(template, 'pdf')}
                        disabled={!template.supportedFormats.includes('pdf') || downloadingKey !== null}
                      >
                        {downloadingKey === `${template.id}:pdf` ? 'Downloading...' : 'Download PDF'}
                      </Button>
                      <Button
                        onClick={() => handleDownloadReport(template, 'excel')}
                        disabled={!template.supportedFormats.includes('excel') || downloadingKey !== null}
                      >
                        {downloadingKey === `${template.id}:excel` ? (
                          'Downloading...'
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Download Excel
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground flex items-center gap-2">
        <FileText className="w-3 h-3" />
        Reports are generated from current live transaction and entity data.
      </div>
    </div>
  );
}
