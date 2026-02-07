'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Settings, Plus, Server } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { StatusBadge } from './status-badge';
import type { InstancePublic } from '@/types';

interface InstanceOverviewCardProps {
  instance?: InstancePublic | null;
  loading?: boolean;
  className?: string;
  onCreateClick?: () => void;
}

export function InstanceOverviewCard({ 
  instance, 
  loading = false, 
  className,
  onCreateClick,
}: InstanceOverviewCardProps) {
  if (loading) {
    return (
      <Card className={cn(
        'transition-all duration-200',
        'hover:shadow-lg dark:hover:shadow-[0_8px_16px_-4px_rgb(0,0,0,0.6)]',
        className
      )}>
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-20" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // No instance exists - show CTA to create
  if (!instance) {
    return (
      <Card className={cn(
        'transition-all duration-200 border-dashed border-2',
        'hover:border-solid hover:shadow-lg dark:hover:shadow-[0_8px_16px_-4px_rgb(0,0,0,0.6)]',
        className
      )}>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="rounded-full bg-muted/50 dark:bg-muted/30 p-4 mb-4 border border-border/50">
            <Server className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No instance yet</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Create your e-commerce instance to start selling online. 
            It only takes a few minutes to set up.
          </p>
          <Button 
            onClick={onCreateClick}
            className="bg-revital-green hover:bg-revital-green/90 text-revital-black"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create my e-commerce
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'transition-all duration-200',
      'hover:shadow-lg dark:hover:shadow-[0_8px_16px_-4px_rgb(0,0,0,0.6)]',
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-lg">{instance.nom_instancia}</CardTitle>
          <p className="text-sm text-muted-foreground">{instance.slug_instancia}</p>
        </div>
        <StatusBadge status={instance.estado_instancia} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          {instance.frontend_url && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Store URL:</span>
              <a
                href={instance.frontend_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-revital-green hover:underline truncate max-w-[200px]"
              >
                {instance.frontend_url.replace(/^https?:\/\//, '')}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
          )}
          {instance.version_instancia && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Version:</span>
              <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                {instance.version_instancia}
              </span>
            </div>
          )}
          {instance.region_deployment && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Region:</span>
              <span>{instance.region_deployment}</span>
            </div>
          )}
          {instance.fecha_ultimo_deploy && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last deploy:</span>
              <span>
                {new Date(instance.fecha_ultimo_deploy).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          {instance.frontend_url && (
            <Button asChild variant="default" size="sm" className="flex-1">
              <a
                href={instance.frontend_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Store
              </a>
            </Button>
          )}
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href="/instance/settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
