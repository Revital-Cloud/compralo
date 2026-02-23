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
import { getInstance, updateInstance } from '@/services/instance.service';
import type { InstanceUpdate, InstanceStatus, RegionDeployment } from '@/types';

const ESTADO_OPTIONS: InstanceStatus[] = [
  'creando',
  'activa',
  'suspendida',
  'eliminada',
  'error',
];

const REGION_OPTIONS: RegionDeployment[] = [
  'us-east-1',
  'us-west-2',
  'sa-east-1',
  'eu-west-1',
  'eu-central-1',
  'ap-southeast-1',
  'ap-northeast-1',
  'custom',
];

export default function AdminInstanceEditPage() {
  const params = useParams();
  const idInstancia = params.id_instancia as string;
  const tCommon = useTranslations('common');
  const tSidebar = useTranslations('sidebar');
  const queryClient = useQueryClient();
  const [form, setForm] = useState<InstanceUpdate>({});

  const { data: instance, isLoading, error } = useQuery({
    queryKey: ['admin', 'instance', idInstancia],
    queryFn: () => getInstance(idInstancia),
    enabled: !!idInstancia,
  });

  useEffect(() => {
    if (!instance) return;
    setForm({
      nom_instancia: instance.nom_instancia,
      subdominio: instance.subdominio ?? '',
      dominio_personalizado: instance.dominio_personalizado ?? '',
      estado_instancia: (instance.estado_instancia as InstanceStatus) ?? undefined,
      version_instancia: instance.version_instancia ?? '',
      backend_url: instance.backend_url ?? '',
      frontend_url: instance.frontend_url ?? '',
      region_deployment: (instance.region_deployment as RegionDeployment) ?? undefined,
      db_host: undefined,
      db_puerto: undefined,
      db_usuario: undefined,
      config_json: undefined,
    });
  }, [instance]);

  const mutation = useMutation({
    mutationFn: (payload: InstanceUpdate) =>
      updateInstance(idInstancia, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin', 'instance', idInstancia],
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'instances'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: InstanceUpdate = {
      nom_instancia: form.nom_instancia?.trim(),
      subdominio: form.subdominio === '' ? null : form.subdominio?.trim() || null,
      dominio_personalizado:
        form.dominio_personalizado === ''
          ? null
          : form.dominio_personalizado?.trim() || null,
      estado_instancia: form.estado_instancia,
      version_instancia:
        form.version_instancia === '' ? undefined : form.version_instancia?.trim(),
      backend_url:
        form.backend_url === '' ? null : form.backend_url?.trim() || null,
      frontend_url:
        form.frontend_url === '' ? null : form.frontend_url?.trim() || null,
      region_deployment: form.region_deployment,
      db_host: form.db_host === '' ? null : form.db_host?.trim() || null,
      db_puerto:
        form.db_puerto != null ? Number(form.db_puerto) : undefined,
      db_usuario: form.db_usuario === '' ? null : form.db_usuario?.trim() || null,
      config_json: form.config_json ?? undefined,
    };
    mutation.mutate(payload);
  };

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">
          {error instanceof Error ? error.message : tCommon('error')}
        </p>
        <Button variant="outline" asChild>
          <Link href="/admin/instances">{tCommon('back')}</Link>
        </Button>
      </div>
    );
  }

  if (isLoading || !instance) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[500px] w-full rounded-md" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/instances">{'←'}</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {tCommon('edit')} {tSidebar('instances').toLowerCase()}: {instance.nom_instancia}
          </h1>
          <p className="text-muted-foreground">
            ID: {instance.id_instancia} · Slug: {instance.slug_instancia}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la instancia</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  ID instancia (solo lectura)
                </Label>
                <Input
                  value={instance.id_instancia}
                  disabled
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  Slug (solo lectura)
                </Label>
                <Input
                  value={instance.slug_instancia}
                  disabled
                  className="font-mono"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">
                Cliente (identificación fiscal, solo lectura)
              </Label>
              <Input
                value={instance.identificacion_fiscal_cliente}
                disabled
                className="font-mono"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nom_instancia">Nombre instancia</Label>
                <Input
                  id="nom_instancia"
                  value={form.nom_instancia ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nom_instancia: e.target.value }))
                  }
                  placeholder="Nombre de la instancia"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado_instancia">Estado</Label>
                <Select
                  value={form.estado_instancia ?? ''}
                  onValueChange={(v: InstanceStatus) =>
                    setForm((f) => ({ ...f, estado_instancia: v }))
                  }
                >
                  <SelectTrigger id="estado_instancia">
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
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subdominio">Subdominio</Label>
                <Input
                  id="subdominio"
                  value={form.subdominio ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, subdominio: e.target.value }))
                  }
                  placeholder="ej. tienda.revital.cloud"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dominio_personalizado">Dominio personalizado</Label>
                <Input
                  id="dominio_personalizado"
                  value={form.dominio_personalizado ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      dominio_personalizado: e.target.value,
                    }))
                  }
                  placeholder="ej. tienda.empresa.com"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="version_instancia">Versión (X.Y.Z)</Label>
                <Input
                  id="version_instancia"
                  value={form.version_instancia ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      version_instancia: e.target.value,
                    }))
                  }
                  placeholder="1.0.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region_deployment">Región de deployment</Label>
                <Select
                  value={form.region_deployment ?? ''}
                  onValueChange={(v: RegionDeployment) =>
                    setForm((f) => ({ ...f, region_deployment: v }))
                  }
                >
                  <SelectTrigger id="region_deployment">
                    <SelectValue placeholder="Región" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGION_OPTIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="backend_url">URL backend</Label>
                <Input
                  id="backend_url"
                  value={form.backend_url ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, backend_url: e.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frontend_url">URL frontend</Label>
                <Input
                  id="frontend_url"
                  value={form.frontend_url ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, frontend_url: e.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="db_host">DB host</Label>
                <Input
                  id="db_host"
                  value={form.db_host ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, db_host: e.target.value }))
                  }
                  placeholder="Host BD"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="db_puerto">DB puerto</Label>
                <Input
                  id="db_puerto"
                  type="number"
                  value={form.db_puerto ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      db_puerto: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                  placeholder="5432"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="db_usuario">DB usuario</Label>
                <Input
                  id="db_usuario"
                  value={form.db_usuario ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, db_usuario: e.target.value }))
                  }
                  placeholder="Usuario BD"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? tCommon('loading') : tCommon('save')}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/instances">{tCommon('cancel')}</Link>
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
