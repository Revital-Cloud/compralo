'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getSubscription,
  updateSubscription,
  changeSubscriptionPlan,
} from '@/services/subscription.service';
import { getPlanes } from '@/services/plan.service';
import type {
  SubscriptionUpdate,
  SubscriptionStatus,
  BillingType,
  PaymentMethod,
} from '@/types';
import type { PlanPublic } from '@/types';

const ESTADO_OPTIONS: SubscriptionStatus[] = [
  'activa',
  'trial',
  'cancelada',
  'suspendida',
  'expirada',
];

const TIPO_FACTURACION: BillingType[] = ['mensual', 'anual', 'trimestral'];

const METODO_PAGO: PaymentMethod[] = [
  'tarjeta',
  'transferencia',
  'paypal',
  'stripe',
  'wompi',
  'pse',
  'efectivo',
  'crypto',
  'otro',
];

const TIPO_CAMBIO_OPTIONS = [
  { value: 'upgrade', label: 'Upgrade' },
  { value: 'downgrade', label: 'Downgrade' },
  { value: 'lateral', label: 'Lateral' },
] as const;

export default function AdminSubscriptionEditPage() {
  const params = useParams();
  const idSuscripcion = params.id_suscripcion as string;
  const tCommon = useTranslations('common');
  const tSidebar = useTranslations('sidebar');
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SubscriptionUpdate>({});
  const [changePlanId, setChangePlanId] = useState<string>('');
  const [changePlanTipo, setChangePlanTipo] = useState<'upgrade' | 'downgrade' | 'lateral'>('upgrade');

  const { data: subscription, isLoading, error } = useQuery({
    queryKey: ['admin', 'subscription', idSuscripcion],
    queryFn: () => getSubscription(idSuscripcion),
    enabled: !!idSuscripcion,
  });

  const { data: plans } = useQuery<PlanPublic[]>({
    queryKey: ['admin', 'plans'],
    queryFn: () => getPlanes(false),
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (!subscription) return;
    setForm({
      id_plan: subscription.id_plan,
      id_instancia: subscription.id_instancia ?? undefined,
      tipo_facturacion: (subscription.tipo_facturacion as BillingType) ?? undefined,
      precio_actual: subscription.precio_actual,
      fecha_fin: subscription.fecha_fin ?? '',
      fecha_proximo_pago: subscription.fecha_proximo_pago ?? '',
      estado_suscripcion: (subscription.estado_suscripcion as SubscriptionStatus) ?? undefined,
      metodo_pago: (subscription.metodo_pago as PaymentMethod) ?? undefined,
      fecha_cancelacion: subscription.fecha_cancelacion ?? '',
      motivo_cancelacion: subscription.motivo_cancelacion ?? '',
    });
  }, [subscription]);

  const updateMutation = useMutation({
    mutationFn: (payload: SubscriptionUpdate) =>
      updateSubscription(idSuscripcion, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin', 'subscription', idSuscripcion],
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
    },
  });

  const changePlanMutation = useMutation({
    mutationFn: () =>
      changeSubscriptionPlan(
        idSuscripcion,
        changePlanId,
        changePlanTipo
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin', 'subscription', idSuscripcion],
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      setChangePlanId('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: SubscriptionUpdate = {
      id_plan: form.id_plan,
      id_instancia:
        form.id_instancia === '' || form.id_instancia === undefined
          ? undefined
          : form.id_instancia,
      tipo_facturacion: form.tipo_facturacion,
      precio_actual:
        form.precio_actual !== undefined && form.precio_actual !== ''
          ? Number(form.precio_actual)
          : undefined,
      fecha_fin:
        form.fecha_fin === '' ? null : (form.fecha_fin as string) || null,
      fecha_proximo_pago:
        form.fecha_proximo_pago === ''
          ? null
          : (form.fecha_proximo_pago as string) || null,
      estado_suscripcion: form.estado_suscripcion,
      metodo_pago: form.metodo_pago ?? null,
      fecha_cancelacion:
        form.fecha_cancelacion === ''
          ? null
          : (form.fecha_cancelacion as string) || null,
      motivo_cancelacion:
        form.motivo_cancelacion === ''
          ? null
          : (form.motivo_cancelacion as string) || null,
    };
    updateMutation.mutate(payload);
  };

  const handleChangePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!changePlanId) return;
    changePlanMutation.mutate();
  };

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">
          {error instanceof Error ? error.message : tCommon('error')}
        </p>
        <Button variant="outline" asChild>
          <Link href="/admin/subscriptions">{tCommon('back')}</Link>
        </Button>
      </div>
    );
  }

  if (isLoading || !subscription) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[500px] w-full rounded-md" />
      </div>
    );
  }

  const canChangePlan =
    subscription.estado_suscripcion === 'activa' && plans && plans.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/subscriptions">{'←'}</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {tCommon('edit')} {tSidebar('subscriptions').toLowerCase()}: ID{' '}
            {subscription.id_suscripcion}
          </h1>
          <p className="text-muted-foreground">
            Cliente: {subscription.identificacion_fiscal_cliente}
          </p>
        </div>
      </div>

      {canChangePlan && (
        <Card>
          <CardHeader>
            <CardTitle>Cambiar plan</CardTitle>
            <p className="text-sm text-muted-foreground">
              Solo disponible para suscripciones activas.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePlan} className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2 min-w-[180px]">
                <Label>Nuevo plan</Label>
                <Select
                  value={changePlanId}
                  onValueChange={setChangePlanId}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans
                      .filter((p) => String(p.id_plan) !== String(subscription.id_plan))
                      .map((p) => (
                        <SelectItem key={String(p.id_plan)} value={String(p.id_plan)}>
                          {p.nom_plan} (ID: {p.id_plan})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 min-w-[140px]">
                <Label>Tipo de cambio</Label>
                <Select
                  value={changePlanTipo}
                  onValueChange={(v: 'upgrade' | 'downgrade' | 'lateral') =>
                    setChangePlanTipo(v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPO_CAMBIO_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                variant="secondary"
                disabled={changePlanMutation.isPending || !changePlanId}
              >
                {changePlanMutation.isPending ? tCommon('loading') : 'Cambiar plan'}
              </Button>
              {changePlanMutation.isError && (
                <p className="text-sm text-destructive">
                  {changePlanMutation.error instanceof Error
                    ? changePlanMutation.error.message
                    : tCommon('error')}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Datos de la suscripción</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  ID suscripción (solo lectura)
                </Label>
                <Input
                  value={subscription.id_suscripcion}
                  disabled
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  Cliente (solo lectura)
                </Label>
                <Input
                  value={subscription.identificacion_fiscal_cliente}
                  disabled
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="estado_suscripcion">Estado</Label>
                <Select
                  value={form.estado_suscripcion ?? ''}
                  onValueChange={(v: SubscriptionStatus) =>
                    setForm((f) => ({ ...f, estado_suscripcion: v }))
                  }
                >
                  <SelectTrigger id="estado_suscripcion">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADO_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo_facturacion">Tipo facturación</Label>
                <Select
                  value={form.tipo_facturacion ?? ''}
                  onValueChange={(v: BillingType) =>
                    setForm((f) => ({ ...f, tipo_facturacion: v }))
                  }
                >
                  <SelectTrigger id="tipo_facturacion">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPO_FACTURACION.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="precio_actual">Precio actual</Label>
                <Input
                  id="precio_actual"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.precio_actual ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      precio_actual: e.target.value,
                    }))
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metodo_pago">Método de pago</Label>
                <Select
                  value={form.metodo_pago ?? ''}
                  onValueChange={(v: PaymentMethod) =>
                    setForm((f) => ({ ...f, metodo_pago: v }))
                  }
                >
                  <SelectTrigger id="metodo_pago">
                    <SelectValue placeholder="Método" />
                  </SelectTrigger>
                  <SelectContent>
                    {METODO_PAGO.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fecha_proximo_pago">Fecha próximo pago</Label>
                <Input
                  id="fecha_proximo_pago"
                  type="date"
                  value={
                    form.fecha_proximo_pago
                      ? String(form.fecha_proximo_pago).slice(0, 10)
                      : ''
                  }
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      fecha_proximo_pago: e.target.value || undefined,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_fin">Fecha fin</Label>
                <Input
                  id="fecha_fin"
                  type="date"
                  value={
                    form.fecha_fin
                      ? String(form.fecha_fin).slice(0, 10)
                      : ''
                  }
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      fecha_fin: e.target.value || undefined,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="id_plan">ID plan</Label>
                <Input
                  id="id_plan"
                  type="number"
                  value={form.id_plan ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      id_plan: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  placeholder="ID plan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="id_instancia">ID instancia</Label>
                <Input
                  id="id_instancia"
                  type="number"
                  value={form.id_instancia ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      id_instancia: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo_cancelacion">Motivo cancelación</Label>
              <Input
                id="motivo_cancelacion"
                value={form.motivo_cancelacion ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, motivo_cancelacion: e.target.value }))
                }
                placeholder="Si está cancelada"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? tCommon('loading') : tCommon('save')}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/subscriptions">{tCommon('cancel')}</Link>
              </Button>
            </div>
            {updateMutation.isError && (
              <p className="text-sm text-destructive">
                {updateMutation.error instanceof Error
                  ? updateMutation.error.message
                  : tCommon('error')}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
