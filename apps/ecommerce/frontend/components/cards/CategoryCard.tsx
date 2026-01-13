'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Badge } from '@repo/ui';
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
  categoryId?: string;
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
  categoryId
}: CategoryCardProps) {
  const router = useRouter();
  const baseClasses = "cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl";
  
  // Si no hay onClick pero hay categoryId, crear función de navegación automática
  const handleClick = onClick || (categoryId ? () => {
    router.push(`/categories/${categoryId}`);
  } : undefined);
  const variantClasses = {
    default: "bg-gray-800 hover:bg-gray-700",
    highlighted: "bg-orange-500 hover:bg-orange-600"
  };

  const iconClasses = {
    default: "bg-blue-100 text-blue-600",
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
            <CardTitle className={`text-lg ${variant === 'highlighted' ? 'text-white' : 'text-white'}`}>
              {title}
            </CardTitle>
            {description && (
              <p className={`text-sm ${variant === 'highlighted' ? 'text-white opacity-90' : 'text-gray-300'}`}>
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
          {categoryId && (
            <div className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors">
              Click para explorar →
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
