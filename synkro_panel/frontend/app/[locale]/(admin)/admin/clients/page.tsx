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
import { getClients } from '@/services/client.service';
import type { ClientPublic } from '@/types';

export default function AdminClientsPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');

  const { data: clients, isLoading, error } = useQuery<ClientPublic[]>({
    queryKey: ['admin', 'clients'],
    queryFn: getClients,
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
        <h1 className="text-2xl font-bold tracking-tight">{t('title')} - Clientes</h1>
        <p className="text-muted-foreground">
          Listado de clientes registrados en la plataforma.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full rounded-md" />
          ) : !clients?.length ? (
            <p className="text-muted-foreground py-8 text-center">No hay clientes registrados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Email contacto</TableHead>
                  <TableHead>Identificación fiscal</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => (
                  <TableRow key={c.identificacion_fiscal}>
                    <TableCell className="font-medium">{c.nom_empresa}</TableCell>
                    <TableCell>{c.email_contacto_principal}</TableCell>
                    <TableCell>{c.identificacion_fiscal}</TableCell>
                    <TableCell>
                      <Badge variant={c.estado_cliente === 'activo' ? 'default' : 'secondary'}>
                        {c.estado_cliente}
                      </Badge>
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
