'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  Server,
  CreditCard,
  Receipt,
  BarChart3,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

import { useAuth } from '@/hooks/use-auth';
import { useDashboardDataSuspense } from '@/hooks/use-dashboard-data';
import { useLatestResourceUsage } from '@/hooks/use-resource-usage';
import { usePlan } from '@/hooks/use-planes';

import { MetricCard } from '@/components/dashboard/metric-card';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { ResourceCard } from '@/components/dashboard/resource-card';
import { InstanceOverviewCard } from '@/components/dashboard/instance-overview-card';
import type { InstancePublic, PlanPublic, SubscriptionPublic } from '@/types';

// Skeleton shown while dashboard data is loading (Suspense fallback)
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-9 w-32" />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-9 w-32" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Subscription Card Component
function SubscriptionCard({
  subscription,
  plan,
  loading = false,
}: {
  subscription?: SubscriptionPublic | null;
  plan?: PlanPublic | null;
  loading?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const localePrefix = `/${locale}`;

  if (loading) {
    return (
      <Card className="hover:shadow-lg dark:hover:shadow-[0_8px_16px_-4px_rgb(0,0,0,0.6)] transition-all duration-200">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className="border-dashed border-2 hover:border-solid hover:shadow-lg dark:hover:shadow-[0_8px_16px_-4px_rgb(0,0,0,0.6)] transition-all duration-200">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="rounded-full bg-muted/50 dark:bg-muted/30 p-4 mb-4 border border-border/50">
            <CreditCard className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {t('subscription.currentPlan.noSubscription.title')}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            {t('subscription.currentPlan.noSubscription.description')}
          </p>
          <Button asChild>
            <Link href={`${localePrefix}/subscription`}>
              {t('subscription.availablePlans.title')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
    }).format(numPrice);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="hover:shadow-lg dark:hover:shadow-[0_8px_16px_-4px_rgb(0,0,0,0.6)] transition-all duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">{t('dashboard.subscription.title')}</CardTitle>
        <StatusBadge status={subscription.estado_suscripcion} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-2xl font-bold text-synkro-green">
            {plan?.nom_plan || t('common.loading')}
          </h3>
          <p className="text-2xl font-bold mt-1">
            {formatPrice(subscription.precio_actual)}
            <span className="text-sm font-normal text-muted-foreground">
              /
              {subscription.tipo_facturacion === 'anual'
                ? t('subscription.availablePlans.perYear').replace('/', '')
                : t('subscription.availablePlans.perMonth').replace('/', '')}
            </span>
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('dashboard.subscription.started')}:</span>
            <span>{formatDate(subscription.fecha_inicio)}</span>
          </div>
          {subscription.fecha_proximo_pago && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('dashboard.subscription.nextPayment')}:</span>
              <span>{formatDate(subscription.fecha_proximo_pago)}</span>
            </div>
          )}
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link href={`${localePrefix}/subscription`}>
            {t('dashboard.subscription.manageSubscription')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// Quick Actions Card
function QuickActionsCard({ instance }: { instance?: InstancePublic | null }) {
  const t = useTranslations();
  const locale = useLocale();
  const localePrefix = `/${locale}`;

  return (
    <Card className="hover:shadow-lg dark:hover:shadow-[0_8px_16px_-4px_rgb(0,0,0,0.6)] transition-all duration-200">
      <CardHeader>
        <CardTitle className="text-lg">{t('dashboard.quickActions.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {instance?.frontend_url && (
          <Button asChild variant="default" className="w-full justify-start" size="sm">
            <a href={instance.frontend_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              {t('dashboard.quickActions.viewStore')}
            </a>
          </Button>
        )}
        <Button asChild variant="outline" className="w-full justify-start" size="sm">
          <Link href={`${localePrefix}/instance`}>
            <Server className="mr-2 h-4 w-4" />
            {t('dashboard.quickActions.manageInstance')}
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full justify-start" size="sm">
          <Link href={`${localePrefix}/billing`}>
            <Receipt className="mr-2 h-4 w-4" />
            {t('dashboard.quickActions.viewInvoices')}
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full justify-start" size="sm">
          <Link href={`${localePrefix}/resources`}>
            <BarChart3 className="mr-2 h-4 w-4" />
            {t('dashboard.quickActions.resourceUsage')}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// Content that suspends until instances, subscriptions and pending invoices are loaded
function DashboardContent() {
  const t = useTranslations();
  const router = useRouter();
  const { instances, subscriptions, pendingInvoices } = useDashboardDataSuspense();

  const instance = instances && instances.length > 0 ? instances[0] : null;
  const activeSubscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;

  const { data: plan, isLoading: loadingPlan } = usePlan(activeSubscription?.id_plan || '');
  const { data: latestResourceUsage, isLoading: loadingResources } = useLatestResourceUsage(
    instance?.id_instancia ?? ''
  );

  const pendingInvoicesCount = pendingInvoices?.length || 0;
  const locale = useLocale();
  const localePrefix = `/${locale}`;

  const handleCreateInstance = () => {
    router.push(`${localePrefix}/instance`);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={t('dashboard.metrics.instanceStatus')}
          value={instance ? t('dashboard.values.active') : t('dashboard.values.noInstance')}
          icon={Server}
          loading={false}
          valueClassName={
            instance?.estado_instancia === 'activa'
              ? 'text-green-600 dark:text-green-400'
              : undefined
          }
        />
        <MetricCard
          title={t('dashboard.metrics.currentPlan')}
          value={plan?.nom_plan || t('dashboard.values.noPlan')}
          icon={CreditCard}
          loading={loadingPlan}
          valueClassName={
            !activeSubscription 
              ? 'text-amber-600 dark:text-amber-400' 
              : undefined
          }
          description={
            !activeSubscription 
              ? t('dashboard.values.selectPlanToStart')
              : undefined
          }
        />
        <MetricCard
          title={t('dashboard.metrics.pendingInvoices')}
          value={pendingInvoicesCount}
          description={
            pendingInvoicesCount > 0
              ? t('dashboard.values.pendingPayment')
              : t('dashboard.values.allPaid')
          }
          icon={Receipt}
          loading={false}
          valueClassName={
            pendingInvoicesCount > 0 ? 'text-amber-600 dark:text-amber-400' : undefined
          }
        />
        <MetricCard
          title={t('dashboard.metrics.resourceUsage')}
          value={
            latestResourceUsage ? `${latestResourceUsage.porcentaje_uso_productos || 0}%` : 'N/A'
          }
          description={t('dashboard.values.productsUsed')}
          icon={BarChart3}
          loading={loadingResources}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <InstanceOverviewCard
            instance={instance}
            loading={false}
            onCreateClick={handleCreateInstance}
          />
        </div>
        <div>
          <QuickActionsCard instance={instance} />
        </div>
      </div>

      {/* Subscription and Resources Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SubscriptionCard
          subscription={activeSubscription}
          plan={plan}
          loading={loadingPlan}
        />
        <ResourceCard resourceUsage={latestResourceUsage} loading={loadingResources} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const t = useTranslations();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t('dashboard.welcome', { name: user?.nombre || '' })}
        </h1>
        <p className="text-muted-foreground mt-1">{t('dashboard.subtitle')}</p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

