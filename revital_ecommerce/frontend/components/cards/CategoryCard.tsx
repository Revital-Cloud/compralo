'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Package } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CategoryCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  count?: number;
  countLabel?: string;
  onClick?: () => void;
  variant?: 'default' | 'highlighted';
  className?: string;
  /** Si está definido, navega a /categories/{categoryId} al hacer click */
  categoryId?: string;
  /** Mostrar "Click para explorar" (también se muestra cuando hay categoryId) */
  showExploreHint?: boolean;
}

export function CategoryCard({
  title,
  description,
  icon = <Package className="w-6 h-6" />,
  count = 0,
  countLabel = "items",
  onClick,
  variant = 'default',
  className = '',
  categoryId,
  showExploreHint = false,
}: CategoryCardProps) {
  const router = useRouter();
  const baseClasses =
    "group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border transition-all duration-300 " +
    "shadow-sm hover:-translate-y-0.5 hover:shadow-lg " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 " +
    "self-start min-h-[142px]";
  
  // Si no hay onClick pero hay categoryId, crear función de navegación automática
  const handleClick =
    onClick ||
    (categoryId
      ? () => {
          router.push(`/categories/${categoryId}`);
        }
      : undefined);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!handleClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };
  const variantClasses = {
    default: "bg-card border-border/80 hover:bg-muted/30",
    highlighted: "bg-orange-500 hover:bg-orange-600 border-orange-500"
  };

  const iconClasses = {
    default: "bg-gradient-to-br from-primary/15 to-muted text-muted-foreground",
    highlighted: "bg-white text-orange-600"
  };

  const ariaLabel = `Categoría: ${title}`;

  return (
    <Card
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onClick={handleClick}
      role={handleClick ? "link" : undefined}
      tabIndex={handleClick ? 0 : -1}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
    >
      {/* Fondo decorativo sutil */}
      <div
        aria-hidden="true"
        className={
          variant === 'highlighted'
            ? "absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.35),transparent_55%)] opacity-40"
            : "absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(254,200,6,0.22),transparent_55%),radial-gradient(circle_at_85%_15%,rgba(249,115,22,0.12),transparent_45%)] opacity-65"
        }
      />

      <CardHeader className="relative z-10 pb-3">
        <div className="flex items-center gap-3">
          <div className={`flex w-12 h-12 items-center justify-center rounded-lg ${iconClasses[variant]}`}>
            {icon}
          </div>
          <div>
            <CardTitle
              className={`line-clamp-1 text-lg font-semibold ${variant === 'highlighted' ? 'text-white' : 'text-card-foreground'}`}
            >
              {title}
            </CardTitle>
            {description && (
              <p
                className={`line-clamp-2 text-sm ${variant === 'highlighted' ? 'text-white/90' : 'text-muted-foreground'}`}
              >
                {description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10 mt-auto">
        <div className="flex items-center justify-between gap-3">
          <Badge
            variant={variant === 'highlighted' ? 'secondary' : 'outline'}
            className={
              variant === 'highlighted'
                ? "bg-white/20 text-white text-xs"
                : "text-xs bg-primary/10 text-primary border-primary/10"
            }
          >
            {count} {countLabel}
          </Badge>
          {(categoryId || showExploreHint) && handleClick && (
            <div className="text-xs whitespace-nowrap text-muted-foreground group-hover:text-primary transition-colors">
              Click para explorar →
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
