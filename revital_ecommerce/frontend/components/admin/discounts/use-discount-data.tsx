'use client'

import { useMemo, useState } from 'react'
import { useDiscounts } from '@/hooks/use-discounts'
import { searchMatches } from '@/utils/search-helpers'
import type { Discount } from './discount-columns'

export const useDiscountData = () => {
  const { data, isLoading, isError } = useDiscounts()
  
  // Filtros locales
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'porcentaje' | 'monto_fijo'>('all')
  const [sortBy, setSortBy] = useState<'nombre' | 'fecha'>('nombre')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC')

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return []
    let rows = data as unknown as Discount[]
    
    // Búsqueda (sin importar tildes: "descuento" encuentra "Descuento", "año" encuentra "año")
    if (search.trim()) {
      rows = rows.filter(
        (r) =>
          searchMatches(search, r.nom_descuento) ||
          searchMatches(search, r.des_descuento) ||
          searchMatches(search, r.codigo_descuento)
      )
    }

    // Filtro por tipo
    if (filterType !== 'all') {
      rows = rows.filter(r => {
        if (filterType === 'porcentaje') return r.tipo_calculo === true
        if (filterType === 'monto_fijo') return r.tipo_calculo === false
        return true
      })
    }

    // Ordenamiento
    rows = [...rows].sort((a, b) => {
      let va: any, vb: any
      if (sortBy === 'fecha') {
        va = a.fec_insert || ''
        vb = b.fec_insert || ''
      } else {
        va = a.nom_descuento || ''
        vb = b.nom_descuento || ''
      }
      const cmp = String(va).localeCompare(String(vb))
      return sortOrder === 'ASC' ? cmp : -cmp
    })
    
    return rows
  }, [data, search, filterType, sortBy, sortOrder])

  return {
    filteredData,
    isLoading,
    isError,
    filters: {
      search,
      setSearch,
      filterType,
      setFilterType,
      sortBy,
      setSortBy,
      sortOrder,
      setSortOrder,
    }
  }
}

