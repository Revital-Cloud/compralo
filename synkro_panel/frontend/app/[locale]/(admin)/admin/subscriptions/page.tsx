'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getSubscriptions } from '@/services/subscription.service';
import type { SubscriptionPublic } from '@/types';
import { Pencil } from 'lucide-react';

const ESTADO_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'activa', label: 'Activa' },
  { value: 'trial', label: 'Trial' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'suspendida', label: 'Suspendida' },
  { value: 'expirada', label: 'Expirada' },
];

const TIPO_FACTURACION_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'anual', label: 'Anual' },
  { value: 'trimestral', label: 'Trimestral' },
];

export default function AdminSubscriptionsPage() {
  const tAdmin = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tSidebar = useTranslations('sidebar');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all');

  const { data: subscriptions, isLoading, error } = useQuery<SubscriptionPublic[]>({
    queryKey: ['admin', 'subscriptions'],
    queryFn: getSubscriptions,
    staleTime: 60 * 1000,
  });

  const filteredSubscriptions = useMemo(() => {
    if (!subscriptions) return [];
    let list = subscriptions;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          String(s.id_suscripcion).toLowerCase().includes(q) ||
          s.identificacion_fiscal_cliente?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter((s) => s.estado_suscripcion === statusFilter);
    }
    if (tipoFilter !== 'all') {
      list = list.filter((s) => s.tipo_facturacion === tipoFilter);
    }
    return list;
  }, [subscriptions, search, statusFilter, tipoFilter]);

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
        <h1 className="text-2xl font-bold tracking-tight">
          {tAdmin('title')} - {tSidebar('subscriptions')}
        </h1>
        <p className="text-muted-foreground">
          Listado de suscripciones.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <CardTitle className="flex-1">{tSidebar('subscriptions')}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder={tCommon('search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-[200px]"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADO_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Tipo fact." />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_FACTURACION_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full rounded-md" />
          ) : !filteredSubscriptions.length ? (
            <p className="py-8 text-center text-muted-foreground">
              No hay suscripciones que coincidan con los filtros.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente (ID fiscal)</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Tipo fact.</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Próx. pago</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((s) => (
                  <TableRow key={String(s.id_suscripcion)}>
                    <TableCell className="font-mono text-muted-foreground">
                      {s.id_suscripcion}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground max-w-[140px] truncate">
                      {s.identificacion_fiscal_cliente}
                    </TableCell>
                    <TableCell>{s.id_plan}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          s.estado_suscripcion === 'activa' ? 'default' : 'secondary'
                        }
                      >
                        {s.estado_suscripcion}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.tipo_facturacion ?? '—'}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(Number(s.precio_actual))}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.fecha_proximo_pago
                        ? new Date(s.fecha_proximo_pago).toLocaleDateString()
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/subscriptions/${s.id_suscripcion}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
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
