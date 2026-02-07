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
import { getPlanes } from '@/services/plan.service';
import type { PlanPublic } from '@/types';
import { Plus, Pencil } from 'lucide-react';

export default function AdminPlansPage() {
  const tAdmin = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tSidebar = useTranslations('sidebar');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: plans, isLoading, error } = useQuery<PlanPublic[]>({
    queryKey: ['admin', 'plans'],
    queryFn: () => getPlanes(false),
    staleTime: 60 * 1000,
  });

  const filteredPlans = useMemo(() => {
    if (!plans) return [];
    let list = plans;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.nom_plan?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter((p) => p.estado_plan === statusFilter);
    }
    return list;
  }, [plans, search, statusFilter]);

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {tAdmin('title')} - {tSidebar('plans')}
          </h1>
          <p className="text-muted-foreground">
            Listado de planes. Crear y editar desde aquí.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/plans/new">
            <Plus className="mr-2 h-4 w-4" />
            {tCommon('create')} {tSidebar('plans').toLowerCase()}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <CardTitle className="flex-1">{tSidebar('plans')}</CardTitle>
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
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                  <SelectItem value="deprecado">Deprecado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full rounded-md" />
          ) : !filteredPlans.length ? (
            <p className="py-8 text-center text-muted-foreground">
              No hay planes.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Precio mensual</TableHead>
                  <TableHead>Precio anual</TableHead>
                  <TableHead>Moneda</TableHead>
                  <TableHead>Límites</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.map((p) => (
                  <TableRow key={String(p.id_plan)}>
                    <TableCell className="font-mono text-muted-foreground">
                      {p.id_plan}
                    </TableCell>
                    <TableCell className="font-medium">{p.nom_plan}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: p.moneda ?? 'USD',
                      }).format(Number(p.precio_mensual))}
                    </TableCell>
                    <TableCell>
                      {p.precio_anual != null
                        ? new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: p.moneda ?? 'USD',
                          }).format(Number(p.precio_anual))
                        : '-'}
                    </TableCell>
                    <TableCell>{p.moneda ?? '-'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {[p.max_productos, p.max_usuarios, p.max_almacenamiento_gb]
                        .filter((x) => x != null)
                        .join(' / ') || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.estado_plan === 'activo' ? 'default' : 'secondary'
                        }
                      >
                        {p.estado_plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/plans/${p.id_plan}`}>
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
