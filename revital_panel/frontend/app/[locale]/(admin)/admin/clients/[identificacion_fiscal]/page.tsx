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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getClient, updateClient } from '@/services/client.service';
import type { ClientUpdate, ClientStatus, Pais } from '@/types';

const ESTADO_OPTIONS: ClientStatus[] = [
  'prospecto',
  'activo',
  'trial',
  'suspendido',
  'cancelado',
];

const PAIS_OPTIONS: Pais[] = [
  'CO',
  'US',
  'MX',
  'AR',
  'CL',
  'PE',
  'EC',
  'PA',
  'UY',
  'BR',
  'ES',
  'OTRO',
];

const TIPO_IDENTIFICACION = [
  'NIT',
  'EIN',
  'RFC',
  'CUIT',
  'RUT',
  'NIF',
  'CIF',
  'CNPJ',
  'RUC',
  'OTRO',
] as const;

export default function AdminClientEditPage() {
  const params = useParams();
  const identificacionFiscal = decodeURIComponent(
    (params.identificacion_fiscal as string) ?? ''
  );
  const tCommon = useTranslations('common');
  const tSidebar = useTranslations('sidebar');
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ClientUpdate>({});

  const { data: client, isLoading, error } = useQuery({
    queryKey: ['admin', 'client', identificacionFiscal],
    queryFn: () => getClient(identificacionFiscal),
    enabled: !!identificacionFiscal,
  });

  useEffect(() => {
    if (!client) return;
    setForm({
      tipo_identificacion: (client.tipo_identificacion as (typeof TIPO_IDENTIFICACION)[number]) ?? undefined,
      nom_empresa: client.nom_empresa,
      email_contacto: client.email_contacto,
      telefono_contacto: client.telefono_contacto ?? '',
      direccion_empresa: client.direccion_empresa ?? '',
      ciudad: client.ciudad ?? '',
      pais: (client.pais as Pais) ?? undefined,
      nom_contacto_principal: client.nom_contacto_principal,
      email_contacto_principal: client.email_contacto_principal,
      telefono_contacto_principal: client.telefono_contacto_principal ?? '',
      estado_cliente: (client.estado_cliente as ClientStatus) ?? undefined,
      ind_activo: client.ind_activo,
      notas_internas: '', // API no devuelve notas_internas en ClientePublic
    });
  }, [client]);

  const mutation = useMutation({
    mutationFn: (payload: ClientUpdate) =>
      updateClient(identificacionFiscal, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin', 'client', identificacionFiscal],
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'clients'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: ClientUpdate = {
      tipo_identificacion: form.tipo_identificacion,
      nom_empresa: form.nom_empresa?.trim(),
      email_contacto: form.email_contacto?.trim(),
      telefono_contacto: form.telefono_contacto || null,
      direccion_empresa: form.direccion_empresa || null,
      ciudad: form.ciudad || null,
      pais: form.pais,
      nom_contacto_principal: form.nom_contacto_principal?.trim(),
      email_contacto_principal: form.email_contacto_principal?.trim(),
      telefono_contacto_principal: form.telefono_contacto_principal || null,
      estado_cliente: form.estado_cliente,
      ind_activo: form.ind_activo,
      notas_internas: form.notas_internas === '' ? undefined : form.notas_internas?.trim() || undefined,
    };
    if (form.password_cliente?.trim()) {
      payload.password_cliente = form.password_cliente.trim();
    }
    mutation.mutate(payload);
  };

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">
          {error instanceof Error ? error.message : tCommon('error')}
        </p>
        <Button variant="outline" asChild>
          <Link href="/admin/clients">{tCommon('back')}</Link>
        </Button>
      </div>
    );
  }

  if (isLoading || !client) {
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
          <Link href="/admin/clients">{'←'}</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {tCommon('edit')} {tSidebar('clients').toLowerCase()}: {client.nom_empresa}
          </h1>
          <p className="text-muted-foreground">
            ID fiscal: {client.identificacion_fiscal}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-muted-foreground">
                Identificación fiscal (solo lectura)
              </Label>
              <Input
                value={client.identificacion_fiscal}
                disabled
                className="font-mono"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tipo_identificacion">Tipo identificación</Label>
                <Select
                  value={form.tipo_identificacion ?? ''}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      tipo_identificacion: v as (typeof TIPO_IDENTIFICACION)[number],
                    }))
                  }
                >
                  <SelectTrigger id="tipo_identificacion">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPO_IDENTIFICACION.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom_empresa">Nombre empresa *</Label>
                <Input
                  id="nom_empresa"
                  value={form.nom_empresa ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nom_empresa: e.target.value }))
                  }
                  required
                  placeholder="Nombre de la empresa"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="estado_cliente">Estado cliente</Label>
                <Select
                  value={form.estado_cliente ?? ''}
                  onValueChange={(v: ClientStatus) =>
                    setForm((f) => ({ ...f, estado_cliente: v }))
                  }
                >
                  <SelectTrigger id="estado_cliente">
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
              <div className="flex items-center gap-2 pt-8">
                <Switch
                  id="ind_activo"
                  checked={form.ind_activo ?? true}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, ind_activo: checked }))
                  }
                />
                <Label htmlFor="ind_activo">Cliente activo (puede acceder al panel)</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email_contacto">Email contacto empresa</Label>
              <Input
                id="email_contacto"
                type="email"
                value={form.email_contacto ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email_contacto: e.target.value }))
                }
                placeholder="contacto@empresa.com"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nom_contacto_principal">Nombre contacto principal</Label>
                <Input
                  id="nom_contacto_principal"
                  value={form.nom_contacto_principal ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      nom_contacto_principal: e.target.value,
                    }))
                  }
                  placeholder="Nombre"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email_contacto_principal">Email contacto principal (login)</Label>
                <Input
                  id="email_contacto_principal"
                  type="email"
                  value={form.email_contacto_principal ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      email_contacto_principal: e.target.value,
                    }))
                  }
                  placeholder="login@empresa.com"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="telefono_contacto">Teléfono contacto</Label>
                <Input
                  id="telefono_contacto"
                  value={form.telefono_contacto ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      telefono_contacto: e.target.value,
                    }))
                  }
                  placeholder="+57..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono_contacto_principal">Teléfono contacto principal</Label>
                <Input
                  id="telefono_contacto_principal"
                  value={form.telefono_contacto_principal ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      telefono_contacto_principal: e.target.value,
                    }))
                  }
                  placeholder="+57..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion_empresa">Dirección empresa</Label>
              <Input
                id="direccion_empresa"
                value={form.direccion_empresa ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, direccion_empresa: e.target.value }))
                }
                placeholder="Dirección"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  value={form.ciudad ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ciudad: e.target.value }))
                  }
                  placeholder="Ciudad"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pais">País</Label>
                <Select
                  value={form.pais ?? ''}
                  onValueChange={(v: Pais) =>
                    setForm((f) => ({ ...f, pais: v }))
                  }
                >
                  <SelectTrigger id="pais">
                    <SelectValue placeholder="País" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAIS_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notas_internas">Notas internas (solo admin)</Label>
              <Textarea
                id="notas_internas"
                value={form.notas_internas ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notas_internas: e.target.value }))
                }
                placeholder="Notas internas..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password_cliente">
                Nueva contraseña (dejar vacío para no cambiar)
              </Label>
              <Input
                id="password_cliente"
                type="password"
                autoComplete="new-password"
                value={form.password_cliente ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password_cliente: e.target.value }))
                }
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? tCommon('loading') : tCommon('save')}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/clients">{tCommon('cancel')}</Link>
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
