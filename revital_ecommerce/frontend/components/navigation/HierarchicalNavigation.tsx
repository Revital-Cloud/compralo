'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, ArrowLeft } from 'lucide-react';

interface NavigationItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface HierarchicalNavigationProps {
  items: NavigationItem[];
  onBack?: () => void;
  backLabel?: string;
  className?: string;
}

export function HierarchicalNavigation({ 
  items, 
  onBack, 
  backLabel = "Volver", 
  className = "" 
}: HierarchicalNavigationProps) {
  const router = useRouter();

  const handleClick = (href: string) => {
    router.push(href);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className={`mb-8 ${className}`}>
      {/* Botón de regreso */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {backLabel}
      </button>
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="w-4 h-4" />}
            
            {item.href ? (
              <button
                onClick={() => handleClick(item.href!)}
                className={`cursor-pointer hover:text-blue-600 transition-colors ${
                  item.isActive ? 'text-gray-700 font-medium' : ''
                }`}
              >
                {item.label}
              </button>
            ) : (
              <span className={item.isActive ? 'text-gray-700 font-medium' : ''}>
                {item.label}
              </span>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
