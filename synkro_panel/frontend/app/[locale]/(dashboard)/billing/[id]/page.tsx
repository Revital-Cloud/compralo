'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, CheckCircle2, Calendar, CreditCard, FileText } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Skeleton,
  Badge,
  Separator,
} from "@/components/ui";

import { useInvoice } from '@/hooks/use-billing';

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
    month: 'long',
    day: 'numeric',
  });
};

// Get status config
const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pagado':
      return {
        label: 'Paid',
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      };
    case 'pendiente':
      return {
        label: 'Pending',
        color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      };
    case 'fallido':
      return {
        label: 'Failed',
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      };
    default:
      return {
        label: status,
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
      };
  }
};

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { data: invoice, isLoading } = useInvoice(resolvedParams.id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Invoice Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The invoice you&apos;re looking for doesn&apos;t exist or has been deleted.
        </p>
        <Button onClick={() => router.push('/billing')}>Back to Billing</Button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(invoice.estado_pago);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/billing')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Invoice {invoice.num_factura}</h1>
            <p className="text-muted-foreground">Issued on {formatDate(invoice.fecha_emision)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Billing Period */}
            {invoice.periodo_facturado_desde && invoice.periodo_facturado_hasta && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Billing Period</h3>
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {formatDate(invoice.periodo_facturado_desde)} - {formatDate(invoice.periodo_facturado_hasta)}
                </p>
              </div>
            )}

            <Separator />

            {/* Line Items (if available in details) */}
            {'detalles' in invoice && invoice.detalles && invoice.detalles.length > 0 ? (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Items</h3>
                <div className="space-y-3">
                  {invoice.detalles.map((detail: any, index: number) => (
                    <div
                      key={detail.id_detalle || index}
                      className="flex items-center justify-between py-3 border-b last:border-0"
                    >
                      <div>
                        <p className="font-medium">{detail.concepto}</p>
                        {detail.cantidad && detail.cantidad > 1 && (
                          <p className="text-sm text-muted-foreground">
                            {detail.cantidad} × {formatPrice(detail.precio_unitario, invoice.moneda)}
                          </p>
                        )}
                      </div>
                      <p className="font-medium">
                        {formatPrice(detail.total_linea || detail.subtotal_linea, invoice.moneda)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Summary</h3>
                <p className="text-muted-foreground">Subscription payment</p>
              </div>
            )}

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(invoice.subtotal, invoice.moneda)}</span>
              </div>
              {parseFloat(String(invoice.descuentos)) > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Discounts</span>
                  <span>-{formatPrice(invoice.descuentos, invoice.moneda)}</span>
                </div>
              )}
              {parseFloat(String(invoice.impuestos)) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxes</span>
                  <span>{formatPrice(invoice.impuestos, invoice.moneda)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(invoice.total, invoice.moneda)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={`mt-1 ${statusConfig.color}`}>{statusConfig.label}</Badge>
              </div>

              {invoice.fecha_vencimiento && (
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">{formatDate(invoice.fecha_vencimiento)}</p>
                </div>
              )}

              {invoice.fecha_pago && (
                <div>
                  <p className="text-sm text-muted-foreground">Paid On</p>
                  <p className="font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    {formatDate(invoice.fecha_pago)}
                  </p>
                </div>
              )}

              {invoice.metodo_pago && (
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    {invoice.metodo_pago}
                  </p>
                </div>
              )}

              {invoice.referencia_pago && (
                <div>
                  <p className="text-sm text-muted-foreground">Reference</p>
                  <p className="font-mono text-sm">{invoice.referencia_pago}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {invoice.notas && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{invoice.notas}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {invoice.estado_pago === 'pendiente' && (
            <Card>
              <CardContent className="pt-6">
                <Button className="w-full bg-synkro-green hover:bg-synkro-green/90 text-synkro-black">
                  Pay Now
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

