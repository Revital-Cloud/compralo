'use client';

import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@/components/ui";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
  valueClassName?: string;
}

export function MetricCard({
  title,
  value,
  description,
  change,
  trend = 'stable',
  icon: Icon,
  loading = false,
  className,
  valueClassName,
}: MetricCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = 
    trend === 'up' 
      ? 'text-green-600 dark:text-green-400' 
      : trend === 'down' 
        ? 'text-red-600 dark:text-red-400' 
        : 'text-gray-600 dark:text-gray-400';

  if (loading) {
    return (
      <Card className={cn('transition-all duration-200', className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <div className="rounded-lg bg-muted p-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold', valueClassName)}>{value}</div>
        {(change !== undefined || description) && (
          <div className="flex items-center gap-1 text-xs mt-1">
            {change !== undefined && (
              <div className={cn('flex items-center gap-0.5', trendColor)}>
                <TrendIcon className="h-3 w-3" />
                <span className="font-medium">{Math.abs(change).toFixed(1)}%</span>
              </div>
            )}
            {description && (
              <span className="text-muted-foreground">{description}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
