'use client'

import { useMemo, useState } from 'react'
import { useDiscounts } from '@/hooks/use-discounts'
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
    let rows = data as Discount[]
    
    // Búsqueda
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(r => 
        r.nom_descuento?.toLowerCase().includes(q) ||
        r.des_descuento?.toLowerCase().includes(q) ||
        r.codigo_descuento?.toLowerCase().includes(q)
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

