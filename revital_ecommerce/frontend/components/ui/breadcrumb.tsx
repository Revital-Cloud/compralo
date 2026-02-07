"use client";

import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  const router = useRouter();

  const handleClick = (href: string) => {
    router.push(href);
  };

  return (
    <nav className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}>
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
  );
}
