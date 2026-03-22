import React, { useEffect, useState } from 'react';
import { BarChart3, Download, FileText } from 'lucide-react';
import { createApiUrl, getApiHeaders } from '@/config/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'operational' | 'financial' | 'risk' | 'compliance';
  category: string;
  supportedFormats: ('pdf' | 'csv' | 'excel' | 'json')[];
  isActive: boolean;
}

export default function Reports() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingTemplateId, setDownloadingTemplateId] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates().catch(console.error);
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

  const handleDownloadReport = async (template: ReportTemplate) => {
    try {
      setDownloadingTemplateId(template.id);
      const format = template.supportedFormats.includes('pdf') ? 'pdf' : (template.supportedFormats[0] || 'csv');

      const response = await fetch(
        createApiUrl(`/reports/templates/${template.id}/download?format=${format}`),
        { headers: getApiHeaders() }
      );

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const disposition = response.headers.get('content-disposition') || '';
      const matched = disposition.match(/filename=\"?([^\"]+)\"?/i);
      link.download = matched?.[1] || `${template.name.replace(/\s+/g, '_')}.${format === 'excel' ? 'csv' : format}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download report error:', error);
    } finally {
      setDownloadingTemplateId(null);
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
                    <Button
                      className="w-full"
                      onClick={() => handleDownloadReport(template)}
                      disabled={downloadingTemplateId === template.id}
                    >
                      {downloadingTemplateId === template.id ? (
                        'Downloading...'
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Download Report
                        </>
                      )}
                    </Button>
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
