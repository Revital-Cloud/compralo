'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { createPlan } from '@/services/plan.service';
import type { PlanCreate, Currency, EstadoPlan } from '@/types';

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

export default function AdminPlansNewPage() {
  const tCommon = useTranslations('common');
  const tSidebar = useTranslations('sidebar');
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PlanCreate>({
    nom_plan: '',
    desc_plan: '',
    precio_mensual: '',
    precio_anual: '',
    moneda: 'USD',
    max_productos: undefined,
    max_usuarios: undefined,
    max_almacenamiento_gb: undefined,
    features_json: null,
    estado_plan: 'activo',
  });

  const mutation = useMutation({
    mutationFn: createPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
      router.push('/admin/plans');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: PlanCreate = {
      nom_plan: form.nom_plan.trim(),
      precio_mensual: form.precio_mensual === '' ? 0 : Number(form.precio_mensual),
      moneda: form.moneda ?? 'USD',
      estado_plan: form.estado_plan ?? 'activo',
    };
    if (form.desc_plan?.trim()) payload.desc_plan = form.desc_plan.trim();
    if (form.precio_anual !== '' && form.precio_anual != null)
      payload.precio_anual = Number(form.precio_anual);
    if (form.max_productos != null && form.max_productos !== '')
      payload.max_productos = Number(form.max_productos);
    if (form.max_usuarios != null && form.max_usuarios !== '')
      payload.max_usuarios = Number(form.max_usuarios);
    if (form.max_almacenamiento_gb != null && form.max_almacenamiento_gb !== '')
      payload.max_almacenamiento_gb = Number(form.max_almacenamiento_gb);
    if (form.features_json) payload.features_json = form.features_json;
    mutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/plans">{'←'}</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {tCommon('create')} {tSidebar('plans').toLowerCase()}
          </h1>
          <p className="text-muted-foreground">
            Crear un nuevo plan de suscripción.
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
                <Label htmlFor="nom_plan">Nombre del plan *</Label>
                <Input
                  id="nom_plan"
                  value={form.nom_plan}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nom_plan: e.target.value }))
                  }
                  required
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
                placeholder="Descripción opcional del plan"
                rows={2}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="precio_mensual">Precio mensual *</Label>
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
                  required
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
                  value={form.precio_anual === '' ? '' : form.precio_anual}
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

            <div className="flex gap-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? tCommon('loading') : tCommon('create')}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/plans">{tCommon('cancel')}</Link>
              </Button>
            </div>
            {mutation.isError && (
              <p className="text-sm text-destructive">
                {mutation.error instanceof Error
                  ? mutation.error.message
                  : tCommon('error')}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
