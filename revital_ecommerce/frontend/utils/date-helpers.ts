/**
 * Helpers para manejar fechas y evitar problemas de zona horaria
 * Especialmente útil para calendarios y formularios
 */

import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Crea una fecha en hora local sin problemas de zona horaria
 * @param year - Año
 * @param month - Mes (0-11)
 * @param day - Día
 * @returns Date object en hora local
 */
export const createLocalDate = (year: number, month: number, day: number): Date => {
  return new Date(year, month, day)
}

/**
 * Convierte una fecha a string ISO sin problemas de zona horaria
 * @param date - Fecha a convertir
 * @returns String en formato YYYY-MM-DD
 */
export const toLocalISOString = (date: Date): string => {
  const localDate = createLocalDate(date.getFullYear(), date.getMonth(), date.getDate())
  return format(localDate, 'yyyy-MM-dd')
}

/**
 * Parsea un string YYYY-MM-DD como fecha local (sin desplazamiento UTC).
 * Útil para inputs/calendarios y para comparar solo el día.
 * @param s - String YYYY-MM-DD o undefined
 * @returns Date en hora local o undefined si vacío/inválido
 */
export const parseDateSafe = (s: string | undefined): Date | undefined => {
  if (!s?.trim()) return undefined
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim())
  if (match) {
    const y = parseInt(match[1], 10)
    const m = parseInt(match[2], 10) - 1
    const day = parseInt(match[3], 10)
    const d = new Date(y, m, day)
    return isNaN(d.getTime()) ? undefined : d
  }
  const d = new Date(s)
  return isNaN(d.getTime()) ? undefined : d
}

/**
 * Parsea una fecha desde string ISO y la convierte a hora local
 * @param dateString - String de fecha en formato ISO
 * @returns Date object en hora local
 */
export const parseLocalDate = (dateString: string): Date => {
  try {
    // Intentar parsear con parseISO primero
    const date = parseISO(dateString)
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date from parseISO')
    }
    return createLocalDate(date.getFullYear(), date.getMonth(), date.getDate())
  } catch (error) {
    // Si parseISO falla, intentar con Date constructor
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date from Date constructor')
      }
      return createLocalDate(date.getFullYear(), date.getMonth(), date.getDate())
    } catch (fallbackError) {
      // Si todo falla, devolver fecha actual
      console.warn('Failed to parse date:', dateString, 'Using current date as fallback')
      return new Date()
    }
  }
}

/**
 * Formatea una fecha para mostrar en español
 * @param date - Fecha a formatear
 * @param formatString - Formato de salida (por defecto "PPP")
 * @returns String formateado en español
 */
export const formatDateSpanish = (date: Date | string, formatString: string = 'PPP'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseLocalDate(date) : date
    
    // Verificar que la fecha es válida antes de formatear
    if (!dateObj || isNaN(dateObj.getTime())) {
      console.warn('Invalid date object:', dateObj)
      return 'Fecha inválida'
    }
    
    return format(dateObj, formatString, { locale: es })
  } catch (error) {
    console.warn('Error formatting date:', error, 'Input:', date)
    return 'Fecha inválida'
  }
}

/**
 * Función simple para formatear fechas ISO del backend
 * @param dateString - String de fecha ISO del backend
 * @returns String formateado como dd/MM/yyyy
 */
export const formatBackendDate = (dateString: string): string => {
  try {
    // Extraer solo la parte de fecha (antes de la T)
    const datePart = dateString.split('T')[0]
    const [year, month, day] = datePart.split('-')
    
    // Crear fecha local
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    
    // Verificar que es válida
    if (isNaN(date.getTime())) {
      return 'Fecha inválida'
    }
    
    // Formatear como dd/MM/yyyy
    return `${day}/${month}/${year}`
  } catch (error) {
    console.warn('Error formatting backend date:', error, 'Input:', dateString)
    return 'Fecha inválida'
  }
}

/**
 * Verifica si una fecha es válida
 * @param date - Fecha a verificar
 * @returns true si la fecha es válida
 */
export const isValidDate = (date: any): boolean => {
  if (!date) return false
  if (date instanceof Date) return !isNaN(date.getTime())
  if (typeof date === 'string') {
    try {
      const parsed = parseISO(date)
      return !isNaN(parsed.getTime())
    } catch {
      try {
        const parsed = new Date(date)
        return !isNaN(parsed.getTime())
      } catch {
        return false
      }
    }
  }
  return false
}

/**
 * Obtiene la fecha actual en hora local
 * @returns Date object de hoy en hora local
 */
export const getTodayLocal = (): Date => {
  const now = new Date()
  return createLocalDate(now.getFullYear(), now.getMonth(), now.getDate())
}

/**
 * Verifica si una fecha es en el futuro
 * @param date - Fecha a verificar
 * @returns true si la fecha es en el futuro
 */
export const isFutureDate = (date: Date): boolean => {
  const today = getTodayLocal()
  return date > today
}

/**
 * Verifica si una fecha es en el pasado
 * @param date - Fecha a verificar
 * @returns true si la fecha es en el pasado
 */
export const isPastDate = (date: Date): boolean => {
  const today = getTodayLocal()
  return date < today
}

/**
 * Obtiene la edad basada en la fecha de nacimiento
 * @param birthDate - Fecha de nacimiento
 * @returns Edad en años
 */
export const getAge = (birthDate: Date | string): number => {
  const birth = typeof birthDate === 'string' ? parseLocalDate(birthDate) : birthDate
  const today = getTodayLocal()
  
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

/**
 * SOLUCIÓN ESPECÍFICA para el problema de zona horaria del calendario
 * Cuando se selecciona una fecha del calendario, esta función asegura
 * que la fecha se mantenga en la zona horaria local correcta
 * @param date - Fecha seleccionada del calendario
 * @returns String de fecha en formato YYYY-MM-DD sin desplazamiento de zona horaria
 */
export const fixCalendarDateSelection = (date: Date): string => {
  // El problema ocurre porque el Date object puede interpretar la fecha en UTC
  // pero queremos mantenerla en hora local
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()
  
  // Crear una nueva fecha usando los componentes individuales
  // Esto evita problemas de zona horaria
  const fixedDate = new Date(year, month, day, 12, 0, 0, 0)
  
  // Formatear como YYYY-MM-DD
  return format(fixedDate, 'yyyy-MM-dd')
}

/**
 * Debug helper para ver qué está pasando con las fechas
 * @param date - Fecha a debuggear
 * @param label - Etiqueta para identificar la fecha en los logs
 */
export const debugDate = (date: Date | string, label: string = 'Fecha'): void => {
  console.log(` ${label}:`, {
    original: date,
    type: typeof date,
    isDate: date instanceof Date,
    parsed: date instanceof Date ? date : parseISO(date as string),
    localString: date instanceof Date ? toLocalISOString(date) : date,
    fixed: date instanceof Date ? fixCalendarDateSelection(date) : date
  })
}
