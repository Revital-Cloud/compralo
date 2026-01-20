'use client';

import { useMemo, useState } from 'react';
import { DollarSign, Server, Users } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import { MetricCard } from '@/components/dashboard';
import {
  useAdminOverviewMetrics,
  useClientsTimeseries,
  useInstancesByPlan,
  useRevenueTimeseries,
} from '@/hooks/use-admin-metrics';
import {
  RevenueAreaChart,
  InstancesByPlanBarChart,
  ClientsFunnelChart,
} from '@/components/admin';

type DateRangeKey = '30d' | '90d' | '180d';

export default function AdminDashboardPage() {
  const [range, setRange] = useState<DateRangeKey>('30d');

  const { data: overview, isLoading: loadingOverview } = useAdminOverviewMetrics();

  const { fromDate, toDate } = useMemo(() => {
    const to = new Date();
    let from = new Date();
    if (range === '30d') {
      from.setDate(to.getDate() - 30);
    } else if (range === '90d') {
      from.setDate(to.getDate() - 90);
    } else {
      from.setDate(to.getDate() - 180);
    }
    return {
      fromDate: from.toISOString().slice(0, 10),
      toDate: to.toISOString().slice(0, 10),
    };
  }, [range]);

  const { data: revenueSeries, isLoading: loadingRevenue } = useRevenueTimeseries(
    fromDate,
    toDate,
  );
  const { data: clientsSeries, isLoading: loadingClients } = useClientsTimeseries(
    undefined,
    undefined,
  );
  const { data: instancesByPlan, isLoading: loadingInstancesByPlan } =
    useInstancesByPlan();

  const totalClientes = overview?.total_clientes ?? 0;
  const totalInstancias = overview?.total_instancias ?? 0;
  const mrrActual = overview?.mrr_actual ?? 0;

  const ingresos30 = overview?.ingresos_ultimos_30_dias ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Panel de administración
          </h1>
          <p className="text-muted-foreground">
            Vista global de clientes, instancias y facturación de Synkro.
          </p>
        </div>
        <Tabs value={range} onValueChange={(v) => setRange(v as DateRangeKey)}>
          <TabsList>
            <TabsTrigger value="30d">Últimos 30 días</TabsTrigger>
            <TabsTrigger value="90d">Últimos 90 días</TabsTrigger>
            <TabsTrigger value="180d">Últimos 180 días</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <MetricCard
          title="Clientes activos"
          value={totalClientes}
          icon={Users}
          loading={loadingOverview}
        />
        <MetricCard
          title="Instancias totales"
          value={totalInstancias}
          icon={Server}
          loading={loadingOverview}
        />
        <MetricCard
          title="MRR aproximado"
          value={new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'USD',
          }).format(mrrActual)}
          icon={DollarSign}
          loading={loadingOverview}
        />
        <MetricCard
          title="Ingresos 30 días"
          value={new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'USD',
          }).format(ingresos30)}
          icon={DollarSign}
          loading={loadingOverview}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueAreaChart
              data={revenueSeries?.puntos ?? []}
              loading={loadingRevenue}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Embudo de clientes (6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientsFunnelChart
              data={overview?.funnel_ultimos_6_meses ?? []}
              loading={loadingOverview || loadingClients}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instancias por plan</CardTitle>
        </CardHeader>
        <CardContent>
          <InstancesByPlanBarChart
            data={instancesByPlan?.items ?? []}
            loading={loadingInstancesByPlan}
          />
        </CardContent>
      </Card>
    </div>
  );
}

