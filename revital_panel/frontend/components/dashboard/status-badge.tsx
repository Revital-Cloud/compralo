'use client';

import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export type StatusType = 'active' | 'activa' | 'trial' | 'suspended' | 'suspendida' | 'cancelled' | 'cancelada' | 'pending' | 'creando' | 'error' | 'expirada' | 'eliminada';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  active: { 
    label: 'Active', 
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', 
    icon: CheckCircle2 
  },
  activa: { 
    label: 'Activa', 
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', 
    icon: CheckCircle2 
  },
  trial: { 
    label: 'Trial', 
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', 
    icon: Clock 
  },
  suspended: { 
    label: 'Suspended', 
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', 
    icon: AlertCircle 
  },
  suspendida: { 
    label: 'Suspendida', 
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', 
    icon: AlertCircle 
  },
  cancelled: { 
    label: 'Cancelled', 
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', 
    icon: XCircle 
  },
  cancelada: { 
    label: 'Cancelada', 
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', 
    icon: XCircle 
  },
  pending: { 
    label: 'Pending', 
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', 
    icon: Clock 
  },
  creando: { 
    label: 'Creando', 
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', 
    icon: Loader2 
  },
  error: { 
    label: 'Error', 
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', 
    icon: XCircle 
  },
  expirada: { 
    label: 'Expirada', 
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', 
    icon: Clock 
  },
  eliminada: { 
    label: 'Eliminada', 
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', 
    icon: XCircle 
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

const iconSizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
};

export function StatusBadge({ 
  status, 
  className, 
  showIcon = true,
  size = 'md' 
}: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();
  const config = statusConfig[normalizedStatus] || {
    label: status,
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    icon: Clock,
  };
  const Icon = config.icon;
  const isLoading = normalizedStatus === 'creando';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        sizeClasses[size],
        config.color,
        className
      )}
    >
      {showIcon && (
        <Icon className={cn(iconSizeClasses[size], isLoading && 'animate-spin')} />
      )}
      {config.label}
    </span>
  );
}
