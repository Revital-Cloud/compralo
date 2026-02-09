"use client"

import { useState } from "react"
import { ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui"
import { Badge } from "@/components/ui"
import { cn } from "@/lib/utils"

interface FilterOption {
  id: string
  label: string
  count?: number
}

interface FilterSection {
  id: string
  title: string
  options: FilterOption[]
  type: 'checkbox' | 'color' | 'size'
}

interface ProductFiltersProps {
  filters: FilterSection[]
  activeFilters: Record<string, string[]>
  onFilterChange: (sectionId: string, optionId: string, checked: boolean) => void
  onClearFilters: () => void
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  activeFilters,
  onFilterChange,
  onClearFilters
}) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['brand', 'color', 'size'])

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).flat().length
  }

  const renderFilterOption = (section: FilterSection, option: FilterOption) => {
    const isActive = activeFilters[section.id]?.includes(option.id)

    switch (section.type) {
      case 'color':
        return (
          <button
            key={option.id}
            onClick={() => onFilterChange(section.id, option.id, !isActive)}
            className={cn(
              "w-8 h-8 rounded-full border-2 transition-all",
              isActive ? "border-gray-900 scale-110" : "border-gray-300",
              "hover:scale-105"
            )}
            style={{ backgroundColor: option.id }}
            title={option.label}
          />
        )
      
      case 'size':
        return (
          <button
            key={option.id}
            onClick={() => onFilterChange(section.id, option.id, !isActive)}
            className={cn(
              "px-3 py-1 text-sm border rounded transition-colors",
              isActive 
                ? "border-gray-900 bg-gray-900 text-white" 
                : "border-gray-300 hover:border-gray-400"
            )}
          >
            {option.label}
          </button>
        )

      default:
        return (
          <label
            key={option.id}
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded"
          >
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => onFilterChange(section.id, option.id, e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm flex-1">{option.label}</span>
            {option.count && (
              <span className="text-xs text-gray-500">({option.count})</span>
            )}
          </label>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Filtros</h3>
        {getActiveFilterCount() > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4 mr-1" />
            Limpiar ({getActiveFilterCount()})
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {getActiveFilterCount() > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtros activos:</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(activeFilters).map(([sectionId, options]) =>
              options.map(optionId => {
                const section = filters.find(f => f.id === sectionId)
                const option = section?.options.find(o => o.id === optionId)
                return (
                  <Badge
                    key={`${sectionId}-${optionId}`}
                    variant="secondary"
                    className="cursor-pointer hover:bg-red-100 hover:text-red-800"
                    onClick={() => onFilterChange(sectionId, optionId, false)}
                  >
                    {option?.label} ✕
                  </Badge>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Filter Sections */}
      {filters.map((section) => (
        <div key={section.id} className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <button
            onClick={() => toggleSection(section.id)}
            className="flex items-center justify-between w-full py-2 text-left"
          >
            <span className="font-medium text-gray-900 dark:text-white">{section.title}</span>
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform",
                expandedSections.includes(section.id) ? "rotate-180" : ""
              )}
            />
          </button>
          
          {expandedSections.includes(section.id) && (
            <div className="mt-3 space-y-2">
              {section.type === 'color' ? (
                <div className="flex flex-wrap gap-2">
                  {section.options.map(option => renderFilterOption(section, option))}
                </div>
              ) : section.type === 'size' ? (
                <div className="flex flex-wrap gap-2">
                  {section.options.map(option => renderFilterOption(section, option))}
                </div>
              ) : (
                <div className="space-y-1">
                  {section.options.map(option => renderFilterOption(section, option))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default ProductFilters 