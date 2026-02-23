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
import { getInstances } from '@/services/instance.service';
import type { InstancePublic } from '@/types';
import { Pencil } from 'lucide-react';

const ESTADO_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'activa', label: 'Activa' },
  { value: 'creando', label: 'Creando' },
  { value: 'suspendida', label: 'Suspendida' },
  { value: 'eliminada', label: 'Eliminada' },
  { value: 'error', label: 'Error' },
];

export default function AdminInstancesPage() {
  const tAdmin = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tSidebar = useTranslations('sidebar');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: instances, isLoading, error } = useQuery<InstancePublic[]>({
    queryKey: ['admin', 'instances'],
    queryFn: getInstances,
    staleTime: 60 * 1000,
  });

  const filteredInstances = useMemo(() => {
    if (!instances) return [];
    let list = instances;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.nom_instancia?.toLowerCase().includes(q) ||
          i.slug_instancia?.toLowerCase().includes(q) ||
          i.identificacion_fiscal_cliente?.toLowerCase().includes(q) ||
          i.subdominio?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter((i) => i.estado_instancia === statusFilter);
    }
    return list;
  }, [instances, search, statusFilter]);

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
          {tAdmin('title')} - {tSidebar('instances')}
        </h1>
        <p className="text-muted-foreground">
          Listado de instancias de e-commerce.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <CardTitle className="flex-1">{tSidebar('instances')}</CardTitle>
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full rounded-md" />
          ) : !filteredInstances.length ? (
            <p className="py-8 text-center text-muted-foreground">
              No hay instancias que coincidan con los filtros.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Cliente (ID fiscal)</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Región</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstances.map((i) => (
                  <TableRow key={String(i.id_instancia)}>
                    <TableCell className="font-mono text-muted-foreground">
                      {i.id_instancia}
                    </TableCell>
                    <TableCell className="font-medium">
                      {i.nom_instancia}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {i.slug_instancia}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground max-w-[140px] truncate">
                      {i.identificacion_fiscal_cliente}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          i.estado_instancia === 'activa' ? 'default' : 'secondary'
                        }
                      >
                        {i.estado_instancia}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {i.region_deployment ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/instances/${i.id_instancia}`}>
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
