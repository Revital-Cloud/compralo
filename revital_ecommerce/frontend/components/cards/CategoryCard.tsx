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
  const baseClasses = "cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl";
  
  // Si no hay onClick pero hay categoryId, crear función de navegación automática
  const handleClick = onClick || (categoryId ? () => {
    router.push(`/categories/${categoryId}`);
  } : undefined);
  const variantClasses = {
    default: "bg-card border border-border hover:bg-muted/50",
    highlighted: "bg-orange-500 hover:bg-orange-600 border-orange-500"
  };

  const iconClasses = {
    default: "bg-muted text-muted-foreground",
    highlighted: "bg-white text-orange-600"
  };

  return (
    <Card
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconClasses[variant]}`}>
            {icon}
          </div>
          <div>
            <CardTitle className={`text-lg font-semibold ${variant === 'highlighted' ? 'text-white' : 'text-card-foreground'}`}>
              {title}
            </CardTitle>
            {description && (
              <p className={`text-sm ${variant === 'highlighted' ? 'text-white/90' : 'text-muted-foreground'}`}>
                {description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between">
          <Badge 
            variant={variant === 'highlighted' ? 'secondary' : 'outline'} 
            className="text-xs"
          >
            {count} {countLabel}
          </Badge>
          {(categoryId || showExploreHint) && handleClick && (
            <div className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
              Click para explorar →
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
