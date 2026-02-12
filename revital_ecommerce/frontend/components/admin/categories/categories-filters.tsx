'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui';
import { Input } from '@/components/ui';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { IconSearch, IconX } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface CategoriesFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
  totalResults: number;
}

export const CategoriesFilters: React.FC<CategoriesFiltersProps> = ({
  search,
  onSearchChange,
  onClearFilters,
  totalResults,
}) => {
  const hasActiveFilters = !!search;

  return (
    <Card className={cn(
      'rounded-xl border border-border bg-card shadow-sm',
      'transition-shadow hover:shadow-md focus-within:shadow-md focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-primary/20'
    )}>
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="w-full sm:w-auto sm:min-w-[240px] sm:max-w-md space-y-1.5">
            <label className="text-sm font-medium text-foreground/90 block">
              Buscar
            </label>
            <div className="relative group">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-foreground/70" />
              <Input
                placeholder="Buscar categoría por nombre..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className={cn(
                  'pl-10 h-10 text-sm w-full sm:max-w-md rounded-lg',
                  'border-input bg-background transition-all duration-200',
                  'focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/30',
                  'placeholder:text-muted-foreground/80'
                )}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Filtra la lista por nombre de categoría
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 sm:pb-1">
            <Badge variant="secondary" className="text-xs font-medium px-3 py-1.5 rounded-md bg-muted/80 text-muted-foreground">
              {totalResults} resultado{totalResults !== 1 ? 's' : ''}
            </Badge>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-sm text-muted-foreground hover:text-foreground h-10 px-3 gap-2 rounded-lg"
              >
                <IconX className="h-4 w-4" />
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
