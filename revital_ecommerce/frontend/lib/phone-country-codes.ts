/**
 * Códigos de país para teléfono (marcación internacional).
 * El valor es el código numérico sin "+" para enviar al backend como número.
 */

export const PHONE_COUNTRY_CODES = [
  { code: '57', label: 'Colombia (+57)' },
  { code: '1', label: 'Estados Unidos / Canadá (+1)' },
  { code: '52', label: 'México (+52)' },
  { code: '34', label: 'España (+34)' },
  { code: '54', label: 'Argentina (+54)' },
  { code: '56', label: 'Chile (+56)' },
  { code: '51', label: 'Perú (+51)' },
  { code: '58', label: 'Venezuela (+58)' },
  { code: '593', label: 'Ecuador (+593)' },
  { code: '595', label: 'Paraguay (+595)' },
  { code: '598', label: 'Uruguay (+598)' },
  { code: '591', label: 'Bolivia (+591)' },
  { code: '55', label: 'Brasil (+55)' },
  { code: '506', label: 'Costa Rica (+506)' },
  { code: '502', label: 'Guatemala (+502)' },
  { code: '503', label: 'El Salvador (+503)' },
  { code: '504', label: 'Honduras (+504)' },
  { code: '505', label: 'Nicaragua (+505)' },
  { code: '507', label: 'Panamá (+507)' },
  { code: '49', label: 'Alemania (+49)' },
  { code: '33', label: 'Francia (+33)' },
  { code: '39', label: 'Italia (+39)' },
  { code: '44', label: 'Reino Unido (+44)' },
  { code: '86', label: 'China (+86)' },
  { code: '91', label: 'India (+91)' },
  { code: '81', label: 'Japón (+81)' },
  { code: '82', label: 'Corea del Sur (+82)' },
  { code: '61', label: 'Australia (+61)' },
] as const

export type PhoneCountryCode = (typeof PHONE_COUNTRY_CODES)[number]['code']

/** Parsea un teléfono guardado (código+numero) en código de país y número local. */
export function parsePhoneForEdit(fullPhone: number | string | undefined): { code: string; numero: string } {
  const str = fullPhone != null ? String(fullPhone).replace(/\D/g, '') : ''
  if (!str) return { code: '57', numero: '' }
  const byLength = [...PHONE_COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length)
  for (const { code } of byLength) {
    if (str.startsWith(code) && str.length > code.length) {
      return { code, numero: str.slice(code.length) }
    }
  }
  return { code: '57', numero: str }
}
