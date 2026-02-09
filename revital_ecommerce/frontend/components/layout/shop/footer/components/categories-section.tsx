"use client"

import * as React from "react"
import Link from "next/link"
import { Skeleton } from "@/components/ui"

interface CategoryItem {
  label: string
  href: string
}

interface CategoriesSectionProps {
  title: string
  categories: CategoryItem[]
  isLoading?: boolean
  error?: Error | null
}

const CategoriesSection: React.FC<CategoriesSectionProps> = ({ 
  title, 
  categories, 
  isLoading = false, 
  error = null 
}) => {
  // Mostrar skeleton mientras carga
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-[#ec2538] dark:text-red-400 text-lg font-semibold transition-colors duration-300">{title}</h3>
        <ul className="space-y-2.5">
          {Array.from({ length: 6 }).map((_, index) => (
            <li key={index}>
              <Skeleton className="h-4 w-24" />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  // Mostrar mensaje de error si hay error
  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-[#ec2538] dark:text-red-400 text-lg font-semibold transition-colors duration-300">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No se pudieron cargar las categorías
        </p>
      </div>
    )
  }

  // Mostrar categorías vacías si no hay datos
  if (!categories || categories.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-[#ec2538] dark:text-red-400 text-lg font-semibold transition-colors duration-300">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No hay categorías disponibles
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-[#ec2538] dark:text-red-400 text-lg font-semibold transition-colors duration-300">{title}</h3>
      <ul className="space-y-2.5">
        {categories.map((category, index) => (
          <li key={`${category.label}-${index}`}>
            <Link 
              href={category.href}
              prefetch={false}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#ec2538] dark:hover:text-red-400 transition-colors duration-300 block py-1"
            >
              {category.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default CategoriesSection 