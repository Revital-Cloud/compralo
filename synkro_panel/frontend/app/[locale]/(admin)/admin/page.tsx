'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { DollarSign, Server, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations, useLocale } from 'next-intl';
import { MetricCard } from '@/components/dashboard/metric-card';
import {
  useAdminOverviewMetrics,
  useClientsTimeseries,
  useInstancesByPlan,
  useRevenueTimeseries,
} from '@/hooks/use-admin-metrics';

const RevenueAreaChart = dynamic(
  () => import('@/components/admin/revenue-area-chart').then((m) => m.RevenueAreaChart),
  { ssr: false, loading: () => <Skeleton className="h-[300px] w-full rounded-md" /> }
);

const InstancesByPlanBarChart = dynamic(
  () => import('@/components/admin/instances-by-plan-bar-chart').then((m) => m.InstancesByPlanBarChart),
  { ssr: false, loading: () => <Skeleton className="h-[300px] w-full rounded-md" /> }
);

const ClientsFunnelChart = dynamic(
  () => import('@/components/admin/clients-funnel-chart').then((m) => m.ClientsFunnelChart),
  { ssr: false, loading: () => <Skeleton className="h-[300px] w-full rounded-md" /> }
);

type DateRangeKey = '30d' | '90d' | '180d';

export default function AdminDashboardPage() {
  const t = useTranslations();
  const locale = useLocale();
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
          <h1 className="text-2xl font-bold tracking-tight">{t('admin.title')}</h1>
          <p className="text-muted-foreground">{t('admin.subtitle')}</p>
        </div>
        <Tabs value={range} onValueChange={(v) => setRange(v as DateRangeKey)}>
          <TabsList>
            <TabsTrigger value="30d">{t('admin.dateRange.30d')}</TabsTrigger>
            <TabsTrigger value="90d">{t('admin.dateRange.90d')}</TabsTrigger>
            <TabsTrigger value="180d">{t('admin.dateRange.180d')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <MetricCard
          title={t('admin.metrics.activeClients')}
          value={totalClientes}
          icon={Users}
          loading={loadingOverview}
        />
        <MetricCard
          title={t('admin.metrics.totalInstances')}
          value={totalInstancias}
          icon={Server}
          loading={loadingOverview}
        />
        <MetricCard
          title={t('admin.metrics.approximateMRR')}
          value={new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: 'USD',
          }).format(mrrActual)}
          icon={DollarSign}
          loading={loadingOverview}
        />
        <MetricCard
          title={t('admin.metrics.revenue30Days')}
          value={new Intl.NumberFormat(locale, {
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
            <CardTitle>{t('admin.charts.revenue')}</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueAreaChart data={revenueSeries?.puntos ?? []} loading={loadingRevenue} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.charts.clientsFunnel')}</CardTitle>
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
          <CardTitle>{t('admin.charts.instancesByPlan')}</CardTitle>
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

