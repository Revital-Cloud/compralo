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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getPlan, updatePlan } from '@/services/plan.service';
import type { PlanUpdate, Currency, EstadoPlan } from '@/types';

const CURRENCIES: Currency[] = [
  'USD',
  'COP',
  'EUR',
  'MXN',
  'BRL',
  'ARS',
  'CLP',
  'PEN',
  'UYU',
  'DOP',
  'CRC',
  'GTQ',
  'PAB',
  'VES',
  'GBP',
  'CAD',
  'OTRA',
];

const ESTADOS: EstadoPlan[] = ['activo', 'inactivo', 'deprecado'];

export default function AdminPlanEditPage() {
  const params = useParams();
  const idPlan = params.id_plan as string;
  const tCommon = useTranslations('common');
  const tSidebar = useTranslations('sidebar');
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PlanUpdate>({});

  const { data: plan, isLoading, error } = useQuery({
    queryKey: ['admin', 'plan', idPlan],
    queryFn: () => getPlan(idPlan),
    enabled: !!idPlan,
  });

  useEffect(() => {
    if (!plan) return;
    setForm({
      nom_plan: plan.nom_plan,
      desc_plan: plan.desc_plan ?? '',
      precio_mensual: plan.precio_mensual,
      precio_anual: plan.precio_anual ?? '',
      moneda: (plan.moneda as Currency) ?? 'USD',
      max_productos: plan.max_productos ?? undefined,
      max_usuarios: plan.max_usuarios ?? undefined,
      max_almacenamiento_gb: plan.max_almacenamiento_gb ?? undefined,
      features_json: plan.features_json ?? null,
      estado_plan: (plan.estado_plan as EstadoPlan) ?? 'activo',
    });
  }, [plan]);

  const updateMutation = useMutation({
    mutationFn: (payload: PlanUpdate) => updatePlan(idPlan, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plan', idPlan] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: PlanUpdate = {
      nom_plan: form.nom_plan?.trim(),
      desc_plan: form.desc_plan === '' ? null : form.desc_plan?.trim(),
      precio_mensual:
        form.precio_mensual !== undefined && form.precio_mensual !== ''
          ? Number(form.precio_mensual)
          : undefined,
      precio_anual:
        form.precio_anual != null ? Number(form.precio_anual) : null,
      moneda: form.moneda,
      max_productos:
        form.max_productos != null ? Number(form.max_productos) : undefined,
      max_usuarios:
        form.max_usuarios != null ? Number(form.max_usuarios) : undefined,
      max_almacenamiento_gb:
        form.max_almacenamiento_gb != null
          ? Number(form.max_almacenamiento_gb)
          : undefined,
      features_json: form.features_json ?? undefined,
      estado_plan: form.estado_plan,
    };
    updateMutation.mutate(payload);
  };

  const handleDeactivate = () => {
    if (window.confirm('¿Desactivar este plan? Las suscripciones existentes no se modifican.')) {
      updateMutation.mutate({ estado_plan: 'inactivo' });
    }
  };

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">
          {error instanceof Error ? error.message : tCommon('error')}
        </p>
        <Button variant="outline" asChild>
          <Link href="/admin/plans">{tCommon('back')}</Link>
        </Button>
      </div>
    );
  }

  if (isLoading || !plan) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full rounded-md" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/plans">{'←'}</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {tCommon('edit')} {tSidebar('plans').toLowerCase()}: {plan.nom_plan}
          </h1>
          <p className="text-muted-foreground">
            ID: {plan.id_plan}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del plan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nom_plan">Nombre del plan</Label>
                <Input
                  id="nom_plan"
                  value={form.nom_plan ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nom_plan: e.target.value }))
                  }
                  placeholder="Ej. Starter"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado_plan">Estado</Label>
                <Select
                  value={form.estado_plan ?? 'activo'}
                  onValueChange={(v: EstadoPlan) =>
                    setForm((f) => ({ ...f, estado_plan: v }))
                  }
                >
                  <SelectTrigger id="estado_plan">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc_plan">Descripción</Label>
              <Textarea
                id="desc_plan"
                value={form.desc_plan ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, desc_plan: e.target.value }))
                }
                placeholder="Descripción opcional"
                rows={2}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="precio_mensual">Precio mensual</Label>
                <Input
                  id="precio_mensual"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.precio_mensual === '' ? '' : form.precio_mensual}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      precio_mensual: e.target.value,
                    }))
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precio_anual">Precio anual</Label>
                <Input
                  id="precio_anual"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.precio_anual ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      precio_anual: e.target.value || undefined,
                    }))
                  }
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="moneda">Moneda</Label>
                <Select
                  value={form.moneda ?? 'USD'}
                  onValueChange={(v: Currency) =>
                    setForm((f) => ({ ...f, moneda: v }))
                  }
                >
                  <SelectTrigger id="moneda">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="max_productos">Máx. productos</Label>
                <Input
                  id="max_productos"
                  type="number"
                  min={0}
                  value={
                    form.max_productos === undefined || form.max_productos === null
                      ? ''
                      : form.max_productos
                  }
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      max_productos: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                  placeholder="Ilimitado"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_usuarios">Máx. usuarios</Label>
                <Input
                  id="max_usuarios"
                  type="number"
                  min={0}
                  value={
                    form.max_usuarios === undefined || form.max_usuarios === null
                      ? ''
                      : form.max_usuarios
                  }
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      max_usuarios: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                  placeholder="Ilimitado"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_almacenamiento_gb">Máx. almacenamiento (GB)</Label>
                <Input
                  id="max_almacenamiento_gb"
                  type="number"
                  min={0}
                  value={
                    form.max_almacenamiento_gb === undefined ||
                    form.max_almacenamiento_gb === null
                      ? ''
                      : form.max_almacenamiento_gb
                  }
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      max_almacenamiento_gb: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                  placeholder="Ilimitado"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? tCommon('loading') : tCommon('save')}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/plans">{tCommon('cancel')}</Link>
              </Button>
              {plan.estado_plan === 'activo' && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleDeactivate}
                  disabled={updateMutation.isPending}
                >
                  Desactivar plan
                </Button>
              )}
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
