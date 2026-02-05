'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getInvoices } from '@/services/billing.service';
import type { InvoicePublic } from '@/types';

export default function AdminBillingPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');

  const { data: invoices, isLoading, error } = useQuery<InvoicePublic[]>({
    queryKey: ['admin', 'billing', 'invoices'],
    queryFn: getInvoices,
    staleTime: 60 * 1000,
  });

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">
          {error instanceof Error ? error.message : tCommon('error')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')} - Facturación</h1>
        <p className="text-muted-foreground">
          Listado de facturas y pagos de la plataforma.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Facturas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full rounded-md" />
          ) : !invoices?.length ? (
            <p className="text-muted-foreground py-8 text-center">No hay facturas.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Factura</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha emisión</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={String(inv.id_factura)}>
                    <TableCell className="font-medium">{inv.num_factura ?? inv.id_factura}</TableCell>
                    <TableCell>{inv.identificacion_fiscal_cliente}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: inv.moneda ?? 'USD',
                      }).format(Number(inv.total))}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          inv.estado_pago === 'pagado' ? 'default' : 'secondary'
                        }
                      >
                        {inv.estado_pago}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {inv.fecha_emision
                        ? new Date(inv.fecha_emision).toLocaleDateString()
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
