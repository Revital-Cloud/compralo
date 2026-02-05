'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  Receipt,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  FileText,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useBillingDataSuspense } from '@/hooks/use-billing-data';
import { MetricCard } from '@/components/dashboard/metric-card';
import billingService from '@/services/billing.service';
import { toast } from 'sonner';
import type { InvoicePublic, InvoicePending } from '@/types';

// Format price
const formatPrice = (price: number | string, currency: string = 'USD') => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(numPrice);
};

// Format date
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Get status config
function getStatusConfig(status: string, t: ReturnType<typeof useTranslations>) {
  switch (status) {
    case 'pagado':
      return {
        label: t('billing.status.paid'),
        icon: CheckCircle2,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
      };
    case 'pendiente':
      return {
        label: t('billing.status.pending'),
        icon: Clock,
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      };
    case 'fallido':
      return {
        label: t('billing.status.failed'),
        icon: XCircle,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
      };
    case 'cancelado':
      return {
        label: t('billing.status.cancelled'),
        icon: XCircle,
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
      };
    default:
      return {
        label: status,
        icon: AlertCircle,
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
      };
  }
}

// Invoice Row Component
function InvoiceRow({ invoice }: { invoice: InvoicePublic | InvoicePending }) {
  const locale = useLocale();
  const t = useTranslations();
  const localePrefix = `/${locale}`;
  const statusConfig = getStatusConfig(invoice.estado_pago, t);
  const StatusIcon = statusConfig.icon;
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const filename = `invoice-${(invoice.num_factura || invoice.id_factura).toString().replace(/\s+/g, '-')}.pdf`;
      await billingService.downloadInvoicePdf(invoice.id_factura, filename);
      toast.success(t('billing.invoice.downloadStarted'));
    } catch {
      toast.error(t('billing.invoice.downloadError'));
    } finally {
      setDownloading(false);
    }
  };

  const isOverdue =
    invoice.estado_pago === 'pendiente' &&
    invoice.fecha_vencimiento &&
    new Date(invoice.fecha_vencimiento) < new Date();

  // Check if invoice has periodo_facturado properties (InvoicePublic only)
  const hasPeriodo = 'periodo_facturado_desde' in invoice && 'periodo_facturado_hasta' in invoice;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
        <div className={`p-2 rounded-lg shrink-0 ${statusConfig.bgColor}`}>
          <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <p className="font-medium wrap-break-word">{invoice.num_factura}</p>
            {isOverdue && (
              <Badge variant="destructive" className="text-xs w-fit">
                {t('billing.invoice.overdue')}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground wrap-break-word">
            {formatDate(invoice.fecha_emision)}
            {hasPeriodo &&
              invoice.periodo_facturado_desde &&
              invoice.periodo_facturado_hasta && (
                <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0">
                  ({formatDate(invoice.periodo_facturado_desde)} -{' '}
                  {formatDate(invoice.periodo_facturado_hasta)})
                </span>
              )}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0">
        <div className="text-left sm:text-right">
          <p className="font-semibold">{formatPrice(invoice.total, invoice.moneda)}</p>
          <Badge variant="outline" className="text-xs">
            {statusConfig.label}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="icon">
            <Link href={`${localePrefix}/billing/${invoice.id_factura}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownloadPdf}
            disabled={downloading}
            title={t('billing.invoice.downloadPDF')}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Invoices List Component
function InvoicesList({
  invoices,
  loading,
  emptyMessage,
}: {
  invoices: (InvoicePublic | InvoicePending)[];
  loading: boolean;
  emptyMessage: string;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {invoices.map((invoice) => (
        <InvoiceRow key={invoice.id_factura} invoice={invoice} />
      ))}
    </div>
  );
}

// Skeleton shown while billing data loads (Suspense fallback)
function BillingPageSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

// Content that suspends until invoices and pending are loaded
function BillingPageContent() {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState('all');
  const { allInvoices, pendingInvoices } = useBillingDataSuspense();

  const totalPending =
    pendingInvoices.reduce((sum, inv) => {
      const amount = typeof inv.total === 'string' ? parseFloat(inv.total) : inv.total;
      return sum + amount;
    }, 0);

  const totalPaid = allInvoices
    .filter((i) => i.estado_pago === 'pagado')
    .reduce((sum, inv) => {
      const amount = typeof inv.total === 'string' ? parseFloat(inv.total) : inv.total;
      return sum + amount;
    }, 0);

  const paidInvoices = allInvoices.filter((i) => i.estado_pago === 'pagado');
  const overdueInvoices = pendingInvoices.filter(
    (inv) => inv.fecha_vencimiento && new Date(inv.fecha_vencimiento) < new Date(),
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <MetricCard title={t('billing.stats.totalPaid')} value={formatPrice(totalPaid)} icon={DollarSign} />
        <MetricCard
          title={t('billing.stats.pending')}
          value={formatPrice(totalPending)}
          icon={Clock}
          valueClassName={totalPending > 0 ? 'text-amber-600 dark:text-amber-400' : undefined}
        />
        <MetricCard title={t('billing.stats.totalInvoices')} value={allInvoices.length} icon={Receipt} />
      </div>

      {overdueInvoices.length > 0 && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">
                  {t('billing.overdue.title', {
                    count: overdueInvoices.length,
                    plural: overdueInvoices.length > 1 ? 's' : '',
                  })}
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {t('billing.overdue.description')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {t('billing.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 w-full sm:w-auto overflow-x-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm">{t('billing.tabs.all')} ({allInvoices.length})</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs sm:text-sm">{t('billing.tabs.pending')} ({pendingInvoices.length})</TabsTrigger>
              <TabsTrigger value="paid" className="text-xs sm:text-sm">{t('billing.tabs.paid')} ({paidInvoices.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <InvoicesList invoices={allInvoices} loading={false} emptyMessage={t('billing.empty.all')} />
            </TabsContent>
            <TabsContent value="pending">
              <InvoicesList
                invoices={pendingInvoices}
                loading={false}
                emptyMessage={t('billing.empty.pending')}
              />
            </TabsContent>
            <TabsContent value="paid">
              <InvoicesList invoices={paidInvoices} loading={false} emptyMessage={t('billing.empty.paid')} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingPage() {
  const t = useTranslations();
  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">{t('billing.title')}</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">{t('billing.subtitle')}</p>
      </div>
      <Suspense fallback={<BillingPageSkeleton />}>
        <BillingPageContent />
      </Suspense>
    </div>
  );
}
