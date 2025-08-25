/**
 * Helpers para manejar especificaciones y descripciones de productos
 * Maneja diferentes formatos: string, objeto JSON, array, etc.
 * 
 * El backend envía spcf_producto como un JSON que puede contener:
 * {
 *   descripcion: "Descripción del producto",
 *   caracteristicas: ["Característica 1", "Característica 2"],
 *   especificaciones: { peso: "1kg", dimensiones: "10x20x30cm" }
 * }
 */

export type ProductSpecs = Record<string, any> | null | undefined;

/**
 * Extrae la descripción del producto desde las especificaciones
 * @param specs - Especificaciones del producto (JSON)
 * @param fallback - Texto por defecto si no hay descripción
 * @returns Descripción del producto o texto por defecto
 */
export const getProductDescription = (
  specs: ProductSpecs, 
  fallback: string = 'Descripción del producto disponible'
): string => {
  
  if (!specs) {
    return fallback
  }
  
  // Caso 1: Si specs es un string, usarlo directamente
  if (typeof specs === 'string') {
    const trimmed = (specs as string).trim()
    if (trimmed) {
      return trimmed
    } else {
      return fallback
    }
  }
  
  // Caso 2: Si specs es un objeto, buscar la descripción
  if (typeof specs === 'object' && specs !== null) {
    
    // Posibles claves para la descripción
    const descriptionKeys = [
      'descripcion', 
      'description', 
      'desc', 
      'descripcion_producto',
      'descripcion_detallada',
      'resumen',
      'summary',
      'detalle',
      'caracteristicas',
      'especificaciones'
    ]
    
    for (const key of descriptionKeys) {
      if (key in specs && typeof specs[key] === 'string') {
        const description = specs[key].trim()
        if (description) {
          return description
        }
      }
    }
    
    // NUEVA LÓGICA: Generar descripción desde especificaciones técnicas
    const availableSpecs = Object.entries(specs)
      .filter(([key, value]) => value && typeof value === 'string' && value.trim())
      .map(([key, value]) => ({ key, value: value.trim() }))
    
    if (availableSpecs.length > 0) {
      
      // Crear descripción inteligente basada en las especificaciones
      const description = generateDescriptionFromSpecs(availableSpecs)
      if (description) {
        return description
      }
    }
    
    // Si no hay descripción específica, intentar crear una desde otras propiedades
    const availableInfo = []
    
    if ('nombre' in specs && typeof specs.nombre === 'string') {
      availableInfo.push(specs.nombre)
    }
    
    if ('marca' in specs && typeof specs.marca === 'string') {
      availableInfo.push(specs.marca)
    }
    
    if ('categoria' in specs && typeof specs.categoria === 'string') {
      availableInfo.push(specs.categoria)
    }
    
    if (availableInfo.length > 0) {
      const generatedDesc = `${availableInfo.join(' - ')} disponible`
      return generatedDesc
    }
    
    // Caso especial: si specs es un array, tomar el primer elemento
    if (Array.isArray(specs) && specs.length > 0) {
      const firstItem = specs[0]
      if (typeof firstItem === 'string' && firstItem.trim()) {
        return firstItem.trim()
      }
    }
    
  }
  
  return fallback
}

/**
 * Genera una descripción legible desde las especificaciones técnicas
 * @param specs - Array de especificaciones {key, value}
 * @returns Descripción generada o null si no se puede generar
 */
const generateDescriptionFromSpecs = (specs: Array<{key: string, value: string}>): string | null => {
  if (specs.length === 0) return null
  
  // Mapear claves técnicas a nombres legibles
  const keyMappings: Record<string, string> = {
    'CPU': 'Procesador',
    'color': 'Color',
    'ram': 'Memoria RAM',
    'storage': 'Almacenamiento',
    'battery': 'Batería',
    'screen': 'Pantalla',
    'camera': 'Cámara',
    'weight': 'Peso',
    'dimensions': 'Dimensiones',
    'modelo': 'Modelo',
    'marca': 'Marca',
    'categoria': 'Categoría'
  }
  
  // Filtrar especificaciones relevantes para la descripción
  const relevantSpecs = specs.filter(({key, value}) => {
    const lowerKey = key.toLowerCase()
    return !['id', 'sku', 'codigo', 'reference'].some(exclude => 
      lowerKey.includes(exclude)
    )
  })
  
  if (relevantSpecs.length === 0) return null
  
  // Crear descripción desde las especificaciones más importantes
  const descriptions: string[] = []
  
  // Priorizar especificaciones técnicas importantes
  const priorityKeys = ['CPU', 'ram', 'storage', 'screen', 'camera']
  
  for (const {key, value} of relevantSpecs) {
    if (priorityKeys.includes(key)) {
      const readableKey = keyMappings[key] || key
      descriptions.push(`${readableKey}: ${value}`)
    }
  }
  
  // Agregar color si está disponible
  const colorSpec = relevantSpecs.find(spec => 
    spec.key.toLowerCase().includes('color') || spec.key.toLowerCase().includes('colour')
  )
  if (colorSpec) {
    descriptions.push(`Color: ${colorSpec.value}`)
  }
  
  // Si no hay especificaciones prioritarias, usar las primeras disponibles
  if (descriptions.length === 0 && relevantSpecs.length > 0) {
    const firstSpecs = relevantSpecs.slice(0, 3) // Máximo 3 especificaciones
    for (const {key, value} of firstSpecs) {
      const readableKey = keyMappings[key] || key
      descriptions.push(`${readableKey}: ${value}`)
    }
  }
  
  if (descriptions.length > 0) {
    return descriptions.join(' • ')
  }
  
  return null
}

/**
 * Extrae características específicas del producto
 * @param specs - Especificaciones del producto (JSON)
 * @param key - Clave de la característica
 * @param fallback - Valor por defecto
 * @returns Valor de la característica o fallback
 */
export const getProductSpec = (
  specs: ProductSpecs,
  key: string,
  fallback: any = null
): any => {
  if (!specs || typeof specs !== 'object') return fallback
  
  return specs[key] ?? fallback
}

/**
 * Obtiene múltiples especificaciones del producto
 * @param specs - Especificaciones del producto (JSON)
 * @param keys - Array de claves a extraer
 * @returns Objeto con las especificaciones encontradas
 */
export const getMultipleProductSpecs = (
  specs: ProductSpecs,
  keys: string[]
): Record<string, any> => {
  const result: Record<string, any> = {}
  
  if (!specs || typeof specs !== 'object') return result
  
  keys.forEach(key => {
    if (key in specs) {
      result[key] = specs[key]
    }
  })
  
  return result
}

/**
 * Verifica si las especificaciones tienen cierta característica
 * @param specs - Especificaciones del producto (JSON)
 * @param key - Clave a verificar
 * @returns true si existe y tiene valor, false en caso contrario
 */
export const hasProductSpec = (specs: ProductSpecs, key: string): boolean => {
  if (!specs || typeof specs !== 'object') return false
  
  return key in specs && specs[key] !== null && specs[key] !== undefined
}

/**
 * Obtiene todas las características disponibles del producto
 * @param specs - Especificaciones del producto (JSON)
 * @returns Array de características disponibles
 */
export const getAvailableProductSpecs = (specs: ProductSpecs): string[] => {
  if (!specs || typeof specs !== 'object') return []
  
  return Object.keys(specs).filter(key => {
    const value = specs[key]
    return value !== null && value !== undefined && value !== ''
  })
}

/**
 * Formatea las especificaciones para mostrar en la UI
 * @param specs - Especificaciones del producto (JSON)
 * @returns Objeto formateado para mostrar
 */
export const formatProductSpecsForDisplay = (specs: ProductSpecs) => {
  if (!specs || typeof specs !== 'object') return {}
  
  const formatted: Record<string, any> = {}
  
  Object.entries(specs).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      // Formatear la clave para mostrar
      const formattedKey = key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
      
      formatted[formattedKey] = value
    }
  })
  
  return formatted
}