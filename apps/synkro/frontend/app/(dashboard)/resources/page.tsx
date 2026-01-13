'use client';

import {
  Package,
  Users,
  HardDrive,
  TrendingUp,
  AlertTriangle,
  ArrowUp,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Skeleton,
  Progress,
} from '@repo/ui';
import Link from 'next/link';

import { useInstances } from '@/hooks/use-instances';
import { useResourceUsage, useLatestResourceUsage } from '@/hooks/use-resource-usage';
import { useActiveSubscriptions } from '@/hooks/use-subscriptions';
import { usePlan } from '@/hooks/use-planes';
import { ResourceCard } from '@/components/dashboard';
import type { ResourceUsagePublic } from '@/types';

// Resource Detail Card
function ResourceDetailCard({ 
  title,
  icon: Icon,
  current,
  max,
  unit = '',
  hasAlert,
  loading,
}: { 
  title: string;
  icon: typeof Package;
  current: number;
  max: number | null;
  unit?: string;
  hasAlert?: boolean;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-2 w-full mt-4" />
        </CardContent>
      </Card>
    );
  }

  const percentage = max ? Math.min((current / max) * 100, 100) : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 95;

  return (
    <Card className={hasAlert ? 'border-amber-200 dark:border-amber-800' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${
          hasAlert 
            ? 'bg-amber-100 dark:bg-amber-900/30' 
            : 'bg-muted'
        }`}>
          <Icon className={`h-5 w-5 ${
            hasAlert 
              ? 'text-amber-600 dark:text-amber-400' 
              : 'text-muted-foreground'
          }`} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{current.toLocaleString()}</span>
            <span className="text-muted-foreground">
              / {max !== null ? max.toLocaleString() : '∞'} {unit}
            </span>
          </div>
          {max !== null && (
            <p className="text-sm text-muted-foreground mt-1">
              {percentage.toFixed(1)}% used
            </p>
          )}
        </div>

        {max !== null && (
          <div className="space-y-2">
            <Progress 
              value={percentage} 
              className={`h-3 ${
                isAtLimit 
                  ? '[&>div]:bg-red-500' 
                  : isNearLimit 
                    ? '[&>div]:bg-amber-500' 
                    : '[&>div]:bg-synkro-green'
              }`}
            />
            {hasAlert && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <span>Approaching limit - consider upgrading</span>
              </div>
            )}
          </div>
        )}

        {max !== null && (
          <p className="text-sm text-muted-foreground">
            {(max - current).toLocaleString()} {unit} remaining
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// No Instance Message
function NoInstanceMessage() {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Instance Yet</h3>
        <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
          Create your e-commerce instance to start tracking resource usage.
        </p>
        <Button asChild>
          <Link href="/instance">
            Create Instance
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// Main Resources Page
export default function ResourcesPage() {
  const { data: instances, isLoading: loadingInstances } = useInstances();
  const { data: subscriptions, isLoading: loadingSubscription } = useActiveSubscriptions();
  
  const instance = instances && instances.length > 0 ? instances[0] : null;
  const activeSubscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;
  
  const { data: currentPlan, isLoading: loadingPlan } = usePlan(
    activeSubscription?.id_plan || ''
  );
  
  const { data: latestUsage, isLoading: loadingUsage } = useLatestResourceUsage(
    instance?.id_instancia || ''
  );

  const loading = loadingInstances || loadingSubscription || loadingPlan || loadingUsage;

  if (loadingInstances) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Resource Usage</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your e-commerce resource consumption.
          </p>
        </div>
        <NoInstanceMessage />
      </div>
    );
  }

  // Get resource data
  const products = {
    current: latestUsage?.productos_actuales || 0,
    max: latestUsage?.max_productos || currentPlan?.max_productos || null,
    hasAlert: latestUsage?.ind_alerta_productos || false,
  };

  const users = {
    current: latestUsage?.usuarios_actuales || 0,
    max: latestUsage?.max_usuarios || currentPlan?.max_usuarios || null,
    hasAlert: latestUsage?.ind_alerta_usuarios || false,
  };

  const storage = {
    current: Number(latestUsage?.almacenamiento_actual_gb || 0),
    max: latestUsage?.max_almacenamiento_gb 
      ? Number(latestUsage.max_almacenamiento_gb) 
      : currentPlan?.max_almacenamiento_gb 
        ? Number(currentPlan.max_almacenamiento_gb) 
        : null,
    hasAlert: latestUsage?.ind_alerta_almacenamiento || false,
  };

  const hasAnyAlert = products.hasAlert || users.hasAlert || storage.hasAlert;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Resource Usage</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your e-commerce resource consumption.
          </p>
        </div>
        {hasAnyAlert && (
          <Button asChild>
            <Link href="/subscription">
              <ArrowUp className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Link>
          </Button>
        )}
      </div>

      {/* Alert Banner */}
      {hasAnyAlert && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50">
          <CardContent className="py-4">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Resource Usage Alert
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  One or more resources are approaching their limits. 
                  Consider upgrading your plan to avoid service interruption.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResourceDetailCard
          title="Products"
          icon={Package}
          current={products.current}
          max={products.max}
          hasAlert={products.hasAlert}
          loading={loadingUsage}
        />
        <ResourceDetailCard
          title="Users"
          icon={Users}
          current={users.current}
          max={users.max}
          hasAlert={users.hasAlert}
          loading={loadingUsage}
        />
        <ResourceDetailCard
          title="Storage"
          icon={HardDrive}
          current={storage.current}
          max={storage.max}
          unit="GB"
          hasAlert={storage.hasAlert}
          loading={loadingUsage}
        />
      </div>

      {/* Plan Info */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan Limits</CardTitle>
          <CardDescription>
            Your {currentPlan?.nom_plan || 'subscription'} plan includes the following resource limits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-synkro-green">
                {currentPlan?.max_productos || '∞'}
              </p>
              <p className="text-sm text-muted-foreground">Max Products</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-synkro-green">
                {currentPlan?.max_usuarios || '∞'}
              </p>
              <p className="text-sm text-muted-foreground">Max Users</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-synkro-green">
                {currentPlan?.max_almacenamiento_gb || '∞'}
              </p>
              <p className="text-sm text-muted-foreground">GB Storage</p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Need more resources? Upgrade to a higher plan.
            </p>
            <Button asChild variant="outline">
              <Link href="/subscription">
                View Available Plans
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      {latestUsage?.fecha_medicion && (
        <p className="text-sm text-muted-foreground text-center">
          Last updated: {new Date(latestUsage.fecha_medicion).toLocaleString()}
        </p>
      )}
    </div>
  );
}
