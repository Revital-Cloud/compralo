'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Package, Users, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ResourceUsagePublic } from '@/types';

interface ResourceItemProps {
  label: string;
  current: number;
  max: number | null;
  icon: typeof Package;
  unit?: string;
  hasAlert?: boolean;
}

function ResourceItem({ label, current, max, icon: Icon, unit = '', hasAlert = false }: ResourceItemProps) {
  const percentage = max ? Math.min((current / max) * 100, 100) : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 95;
  
  const progressColor = isAtLimit 
    ? 'bg-red-500' 
    : isNearLimit 
      ? 'bg-amber-500' 
      : 'bg-revital-green';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {current}{unit} / {max !== null ? `${max}${unit}` : '∞'}
        </span>
      </div>
      {max !== null && (
        <div className="relative">
          <Progress 
            value={percentage} 
            className="h-2"
          />
          <div 
            className={cn(
              'absolute inset-0 h-2 rounded-full transition-colors',
              progressColor
            )} 
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      {hasAlert && (
        <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-3 w-3" />
          <span>Near limit - consider upgrading your plan</span>
        </div>
      )}
    </div>
  );
}

interface ResourceCardProps {
  resourceUsage?: ResourceUsagePublic | null;
  loading?: boolean;
  className?: string;
  showTitle?: boolean;
  compact?: boolean;
}

export function ResourceCard({ 
  resourceUsage, 
  loading = false, 
  className,
  showTitle = true,
  compact = false,
}: ResourceCardProps) {
  if (loading) {
    return (
      <Card className={cn(
        'transition-all duration-200',
        'hover:shadow-lg dark:hover:shadow-[0_8px_16px_-4px_rgb(0,0,0,0.6)]',
        className
      )}>
        {showTitle && (
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
        )}
        <CardContent className={cn('space-y-4', !showTitle && 'pt-6')}>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!resourceUsage) {
    return (
      <Card className={cn(
        'transition-all duration-200',
        'hover:shadow-lg dark:hover:shadow-[0_8px_16px_-4px_rgb(0,0,0,0.6)]',
        className
      )}>
        {showTitle && (
          <CardHeader>
            <CardTitle className="text-lg">Resource Usage</CardTitle>
          </CardHeader>
        )}
        <CardContent className={cn(!showTitle && 'pt-6')}>
          <p className="text-sm text-muted-foreground">
            No resource usage data available yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const products = {
    current: resourceUsage.productos_actuales,
    max: resourceUsage.max_productos,
    hasAlert: resourceUsage.ind_alerta_productos,
  };

  const users = {
    current: resourceUsage.usuarios_actuales,
    max: resourceUsage.max_usuarios,
    hasAlert: resourceUsage.ind_alerta_usuarios,
  };

  const storage = {
    current: Number(resourceUsage.almacenamiento_actual_gb),
    max: resourceUsage.max_almacenamiento_gb ? Number(resourceUsage.max_almacenamiento_gb) : null,
    hasAlert: resourceUsage.ind_alerta_almacenamiento,
  };

  return (
    <Card className={cn(
      'transition-all duration-200',
      'hover:shadow-lg dark:hover:shadow-[0_8px_16px_-4px_rgb(0,0,0,0.6)]',
      className
    )}>
      {showTitle && (
        <CardHeader>
          <CardTitle className="text-lg">Resource Usage</CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn('space-y-4', !showTitle && 'pt-6', compact && 'space-y-3')}>
        <ResourceItem 
          label="Products" 
          current={products.current} 
          max={products.max ?? null}
          icon={Package}
          hasAlert={products.hasAlert}
        />
        <ResourceItem 
          label="Users" 
          current={users.current} 
          max={users.max ?? null}
          icon={Users}
          hasAlert={users.hasAlert}
        />
        <ResourceItem 
          label="Storage" 
          current={storage.current} 
          max={storage.max}
          icon={HardDrive}
          unit=" GB"
          hasAlert={storage.hasAlert}
        />
      </CardContent>
    </Card>
  );
}
