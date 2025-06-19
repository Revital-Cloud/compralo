"use client"

import * as React from "react"
import Link from "next/link"

interface CategoryItem {
  label: string
  href: string
}

interface CategoriesSectionProps {
  title: string
  categories: CategoryItem[]
}

const CategoriesSection: React.FC<CategoriesSectionProps> = ({ title, categories }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-blue-400 dark:text-blue-300 text-lg font-semibold">{title}</h3>
      <ul className="space-y-2.5">
        {categories.map((category, index) => (
          <li key={index}>
            <Link 
              href={category.href} 
              className="text-sm text-gray-300 dark:text-gray-400 hover:text-blue-400 dark:hover:text-white transition-colors block py-1"
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