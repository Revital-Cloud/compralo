'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Skeleton,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";

import { useInvoices, usePendingInvoices } from '@/hooks/use-billing';
import { MetricCard } from '@/components/dashboard';
import type { InvoicePublic } from '@/types';

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
const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pagado':
      return { 
        label: 'Paid', 
        icon: CheckCircle2, 
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
      };
    case 'pendiente':
      return { 
        label: 'Pending', 
        icon: Clock, 
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      };
    case 'fallido':
      return { 
        label: 'Failed', 
        icon: XCircle, 
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
      };
    case 'cancelado':
      return { 
        label: 'Cancelled', 
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
};

// Invoice Row Component
function InvoiceRow({ invoice }: { invoice: InvoicePublic }) {
  const statusConfig = getStatusConfig(invoice.estado_pago);
  const StatusIcon = statusConfig.icon;
  
  const isOverdue = invoice.estado_pago === 'pendiente' && 
    invoice.fecha_vencimiento && 
    new Date(invoice.fecha_vencimiento) < new Date();

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
          <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{invoice.num_factura}</p>
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">Overdue</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDate(invoice.fecha_emision)}
            {invoice.periodo_facturado_desde && invoice.periodo_facturado_hasta && (
              <span className="ml-2">
                ({formatDate(invoice.periodo_facturado_desde)} - {formatDate(invoice.periodo_facturado_hasta)})
              </span>
            )}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-semibold">{formatPrice(invoice.total, invoice.moneda)}</p>
          <Badge variant="outline" className="text-xs">
            {statusConfig.label}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="icon">
            <Link href={`/billing/${invoice.id_factura}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon">
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
  emptyMessage 
}: { 
  invoices: InvoicePublic[];
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

// Main Billing Page
export default function BillingPage() {
  const [activeTab, setActiveTab] = useState('all');
  
  const { data: allInvoices, isLoading: loadingAll } = useInvoices();
  const { data: pendingInvoices, isLoading: loadingPending } = usePendingInvoices();

  // Calculate stats
  const totalPending = pendingInvoices?.reduce((sum, inv) => {
    const amount = typeof inv.total === 'string' ? parseFloat(inv.total) : inv.total;
    return sum + amount;
  }, 0) || 0;

  const totalPaid = allInvoices?.filter(i => i.estado_pago === 'pagado').reduce((sum, inv) => {
    const amount = typeof inv.total === 'string' ? parseFloat(inv.total) : inv.total;
    return sum + amount;
  }, 0) || 0;

  // Filter invoices by status
  const paidInvoices = allInvoices?.filter(i => i.estado_pago === 'pagado') || [];
  const overdueInvoices = pendingInvoices?.filter(inv => 
    inv.fecha_vencimiento && new Date(inv.fecha_vencimiento) < new Date()
  ) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your invoices and payment history.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Total Paid"
          value={formatPrice(totalPaid)}
          icon={DollarSign}
          loading={loadingAll}
        />
        <MetricCard
          title="Pending"
          value={formatPrice(totalPending)}
          icon={Clock}
          loading={loadingPending}
          valueClassName={totalPending > 0 ? 'text-amber-600 dark:text-amber-400' : undefined}
        />
        <MetricCard
          title="Total Invoices"
          value={allInvoices?.length || 0}
          icon={Receipt}
          loading={loadingAll}
        />
      </div>

      {/* Overdue Alert */}
      {overdueInvoices.length > 0 && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">
                  You have {overdueInvoices.length} overdue invoice{overdueInvoices.length > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  Please make payment as soon as possible to avoid service interruption.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">
                All ({allInvoices?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({pendingInvoices?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="paid">
                Paid ({paidInvoices.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <InvoicesList 
                invoices={allInvoices || []}
                loading={loadingAll}
                emptyMessage="No invoices found."
              />
            </TabsContent>

            <TabsContent value="pending">
              <InvoicesList 
                invoices={pendingInvoices || []}
                loading={loadingPending}
                emptyMessage="No pending invoices. You're all caught up!"
              />
            </TabsContent>

            <TabsContent value="paid">
              <InvoicesList 
                invoices={paidInvoices}
                loading={loadingAll}
                emptyMessage="No paid invoices yet."
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
