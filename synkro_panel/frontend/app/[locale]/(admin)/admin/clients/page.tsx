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
import { getClients } from '@/services/client.service';
import type { ClientPublic } from '@/types';
import { Pencil } from 'lucide-react';

const ESTADO_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'activo', label: 'Activo' },
  { value: 'trial', label: 'Trial' },
  { value: 'prospecto', label: 'Prospecto' },
  { value: 'suspendido', label: 'Suspendido' },
  { value: 'cancelado', label: 'Cancelado' },
];

export default function AdminClientsPage() {
  const tAdmin = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tSidebar = useTranslations('sidebar');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const { data: clients, isLoading, error } = useQuery<ClientPublic[]>({
    queryKey: ['admin', 'clients'],
    queryFn: getClients,
    staleTime: 60 * 1000,
  });

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    let list = clients;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.nom_empresa?.toLowerCase().includes(q) ||
          c.email_contacto_principal?.toLowerCase().includes(q) ||
          c.email_contacto?.toLowerCase().includes(q) ||
          c.identificacion_fiscal?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter((c) => c.estado_cliente === statusFilter);
    }
    if (activeFilter === 'yes') {
      list = list.filter((c) => c.ind_activo === true);
    } else if (activeFilter === 'no') {
      list = list.filter((c) => c.ind_activo === false);
    }
    return list;
  }, [clients, search, statusFilter, activeFilter]);

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
          {tAdmin('title')} - {tSidebar('clients')}
        </h1>
        <p className="text-muted-foreground">
          Listado de clientes registrados en la plataforma.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <CardTitle className="flex-1">{tSidebar('clients')}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder={tCommon('search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-[220px]"
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
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Activo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="yes">Sí</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full rounded-md" />
          ) : !filteredClients.length ? (
            <p className="py-8 text-center text-muted-foreground">
              No hay clientes que coincidan con los filtros.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Email contacto</TableHead>
                  <TableHead>Identificación fiscal</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((c) => (
                  <TableRow key={c.identificacion_fiscal}>
                    <TableCell className="font-medium">{c.nom_empresa}</TableCell>
                    <TableCell>{c.email_contacto_principal}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {c.identificacion_fiscal}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          c.estado_cliente === 'activo' ? 'default' : 'secondary'
                        }
                      >
                        {c.estado_cliente}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {c.ind_activo ? (
                        <Badge variant="outline">Sí</Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link
                          href={`/admin/clients/${encodeURIComponent(c.identificacion_fiscal)}`}
                        >
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
