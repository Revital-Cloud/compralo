'use client';

import { useRouter } from 'next/navigation';
import { 
  Server, 
  CreditCard, 
  Receipt, 
  BarChart3,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Skeleton } from '@repo/ui';
import Link from 'next/link';

import { useAuth } from '@/hooks/use-auth';
import { useInstances } from '@/hooks/use-instances';
import { useActiveSubscriptions } from '@/hooks/use-subscriptions';
import { useResourceUsage } from '@/hooks/use-resource-usage';
import { usePendingInvoices } from '@/hooks/use-billing';
import { usePlan } from '@/hooks/use-planes';

import { MetricCard, StatusBadge, ResourceCard, InstanceOverviewCard } from '@/components/dashboard';
import type { InstancePublic, SubscriptionPublic, PlanPublic } from '@/types';

// Subscription Card Component
function SubscriptionCard({ 
  subscription, 
  plan,
  loading = false 
}: { 
  subscription?: SubscriptionPublic | null;
  plan?: PlanPublic | null;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
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
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <CreditCard className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No active subscription</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            You don&apos;t have an active subscription yet. Choose a plan to get started.
          </p>
          <Button asChild>
            <Link href="/subscription">
              View Plans
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numPrice);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">Current Plan</CardTitle>
        <StatusBadge status={subscription.estado_suscripcion} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-2xl font-bold text-synkro-green">
            {plan?.nom_plan || 'Loading...'}
          </h3>
          <p className="text-2xl font-bold mt-1">
            {formatPrice(subscription.precio_actual)}
            <span className="text-sm font-normal text-muted-foreground">
              /{subscription.tipo_facturacion === 'anual' ? 'year' : 'month'}
            </span>
          </p>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Started:</span>
            <span>{formatDate(subscription.fecha_inicio)}</span>
          </div>
          {subscription.fecha_proximo_pago && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Next payment:</span>
              <span>{formatDate(subscription.fecha_proximo_pago)}</span>
            </div>
          )}
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link href="/subscription">
            Manage Subscription
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// Quick Actions Card
function QuickActionsCard({ instance }: { instance?: InstancePublic | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {instance?.frontend_url && (
          <Button asChild variant="default" className="w-full justify-start" size="sm">
            <a href={instance.frontend_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              View my store
            </a>
          </Button>
        )}
        <Button asChild variant="outline" className="w-full justify-start" size="sm">
          <Link href="/instance">
            <Server className="mr-2 h-4 w-4" />
            Manage instance
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full justify-start" size="sm">
          <Link href="/billing">
            <Receipt className="mr-2 h-4 w-4" />
            View invoices
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full justify-start" size="sm">
          <Link href="/resources">
            <BarChart3 className="mr-2 h-4 w-4" />
            Resource usage
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Fetch data
  const { data: instances, isLoading: loadingInstances } = useInstances();
  const { data: subscriptions, isLoading: loadingSubscriptions } = useActiveSubscriptions();
  const { data: pendingInvoices, isLoading: loadingInvoices } = usePendingInvoices();
  
  // Get the first instance (clients typically have one)
  const instance = instances && instances.length > 0 ? instances[0] : null;
  
  // Get active subscription
  const activeSubscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;
  
  // Get plan details for the subscription
  const { data: plan, isLoading: loadingPlan } = usePlan(activeSubscription?.id_plan || '');
  
  // Get resource usage for the instance
  const { data: resourceUsage, isLoading: loadingResources } = useResourceUsage(
    instance?.id_instancia
  );
  
  // Get latest resource usage
  const latestResourceUsage = resourceUsage && resourceUsage.length > 0 ? resourceUsage[0] : null;
  
  // Calculate metrics
  const pendingInvoicesCount = pendingInvoices?.length || 0;

  const handleCreateInstance = () => {
    router.push('/instance');
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Welcome back{user?.nombre ? `, ${user.nombre}` : ''}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s an overview of your e-commerce platform.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Instance Status"
          value={instance ? 'Active' : 'No Instance'}
          icon={Server}
          loading={loadingInstances}
          valueClassName={instance?.estado_instancia === 'activa' ? 'text-green-600 dark:text-green-400' : undefined}
        />
        <MetricCard
          title="Current Plan"
          value={plan?.nom_plan || 'No Plan'}
          icon={CreditCard}
          loading={loadingSubscriptions || loadingPlan}
        />
        <MetricCard
          title="Pending Invoices"
          value={pendingInvoicesCount}
          description={pendingInvoicesCount > 0 ? 'Awaiting payment' : 'All paid'}
          icon={Receipt}
          loading={loadingInvoices}
          valueClassName={pendingInvoicesCount > 0 ? 'text-amber-600 dark:text-amber-400' : undefined}
        />
        <MetricCard
          title="Resource Usage"
          value={latestResourceUsage 
            ? `${latestResourceUsage.porcentaje_uso_productos || 0}%` 
            : 'N/A'}
          description="Products used"
          icon={BarChart3}
          loading={loadingResources}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Instance Overview - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <InstanceOverviewCard 
            instance={instance}
            loading={loadingInstances}
            onCreateClick={handleCreateInstance}
          />
        </div>

        {/* Quick Actions */}
        <div>
          <QuickActionsCard instance={instance} />
        </div>
      </div>

      {/* Subscription and Resources Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Card */}
        <SubscriptionCard 
          subscription={activeSubscription}
          plan={plan}
          loading={loadingSubscriptions || loadingPlan}
        />

        {/* Resource Usage Card */}
        <ResourceCard 
          resourceUsage={latestResourceUsage}
          loading={loadingResources}
        />
      </div>
    </div>
  );
}
