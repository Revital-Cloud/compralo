/**
 * Sanitización HTML para prevenir XSS (SEC-002).
 * Usa DOMPurify con allowlist restrictiva para contenido de barra informativa y CMS.
 */

import DOMPurify from 'dompurify';

const ALLOWED_TAGS = ['strong', 'em', 'a', 'br', 'p', 'span'] as const;
const ALLOWED_ATTR = ['href'] as const;

/**
 * Sanitiza HTML para renderizar de forma segura con dangerouslySetInnerHTML.
 * Solo permite etiquetas y atributos de la allowlist (p. ej. formato básico y enlaces).
 * En SSR (sin window) devuelve string vacío para evitar inyección en el markup inicial.
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (html == null || html === '') return '';
  if (typeof window === 'undefined') {
    return '';
  }
  
  if (!DOMPurify || typeof DOMPurify.sanitize !== 'function') return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...ALLOWED_TAGS],
    ALLOWED_ATTR: [...ALLOWED_ATTR],
  });
}
