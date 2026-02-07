/**
 * Utilidades de Sanitización XSS
 * 
 * Funciones para limpiar y validar datos contra ataques XSS
 */

// Lista de patrones maliciosos comunes
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
  /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
  /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /onmouseover\s*=/gi,
  /onfocus\s*=/gi,
  /onblur\s*=/gi,
  /onchange\s*=/gi,
  /onsubmit\s*=/gi,
  /onreset\s*=/gi,
  /onselect\s*=/gi,
  /onkeydown\s*=/gi,
  /onkeyup\s*=/gi,
  /onkeypress\s*=/gi,
  /onmousedown\s*=/gi,
  /onmouseup\s*=/gi,
  /onmousemove\s*=/gi,
  /onmouseout\s*=/gi,
  /onmouseenter\s*=/gi,
  /onmouseleave\s*=/gi,
  /oncontextmenu\s*=/gi,
  /ondblclick\s*=/gi,
  /onabort\s*=/gi,
  /onbeforeunload\s*=/gi,
  /onerror\s*=/gi,
  /onhashchange\s*=/gi,
  /onload\s*=/gi,
  /onmessage\s*=/gi,
  /onoffline\s*=/gi,
  /ononline\s*=/gi,
  /onpagehide\s*=/gi,
  /onpageshow\s*=/gi,
  /onpopstate\s*=/gi,
  /onresize\s*=/gi,
  /onstorage\s*=/gi,
  /onunload\s*=/gi,
  /expression\s*\(/gi,
  /url\s*\(/gi,
  /@import/gi,
  /eval\s*\(/gi,
  /Function\s*\(/gi,
  /setTimeout\s*\(/gi,
  /setInterval\s*\(/gi,
  /document\./gi,
  /window\./gi,
  /location\./gi,
  /history\./gi,
  /navigator\./gi,
  /screen\./gi,
  /alert\s*\(/gi,
  /confirm\s*\(/gi,
  /prompt\s*\(/gi,
  /console\./gi,
  /localStorage\./gi,
  /sessionStorage\./gi,
  /cookie/gi,
  /document\.cookie/gi,
  /document\.write/gi,
  /document\.writeln/gi,
  /innerHTML/gi,
  /outerHTML/gi,
  /insertAdjacentHTML/gi,
  /createElement/gi,
  /appendChild/gi,
  /insertBefore/gi,
  /replaceChild/gi,
  /removeChild/gi,
  /cloneNode/gi,
  /importNode/gi,
  /adoptNode/gi,
  /normalize/gi,
  /splitText/gi,
  /substringData/gi,
  /insertData/gi,
  /deleteData/gi,
  /replaceData/gi,
  /appendData/gi,
  /getAttribute/gi,
  /setAttribute/gi,
  /removeAttribute/gi,
  /getAttributeNode/gi,
  /setAttributeNode/gi,
  /removeAttributeNode/gi,
  /getElementsByTagName/gi,
  /getElementsByClassName/gi,
  /getElementById/gi,
  /querySelector/gi,
  /querySelectorAll/gi,
  /getComputedStyle/gi,
  /matchMedia/gi,
  /addEventListener/gi,
  /removeEventListener/gi,
  /dispatchEvent/gi,
  /createEvent/gi,
  /initEvent/gi,
  /preventDefault/gi,
  /stopPropagation/gi,
  /stopImmediatePropagation/gi,
  /bubbles/gi,
  /cancelable/gi,
  /defaultPrevented/gi,
  /eventPhase/gi,
  /target/gi,
  /currentTarget/gi,
  /type/gi,
  /timeStamp/gi,
  /isTrusted/gi,
  /initCustomEvent/gi,
  /detail/gi,
  /initUIEvent/gi,
  /view/gi,
  /detail/gi,
  /initMouseEvent/gi,
  /screenX/gi,
  /screenY/gi,
  /clientX/gi,
  /clientY/gi,
  /ctrlKey/gi,
  /shiftKey/gi,
  /altKey/gi,
  /metaKey/gi,
  /button/gi,
  /buttons/gi,
  /relatedTarget/gi,
  /initKeyboardEvent/gi,
  /key/gi,
  /code/gi,
  /location/gi,
  /repeat/gi,
  /isComposing/gi,
  /initFocusEvent/gi,
  /relatedTarget/gi,
  /initTouchEvent/gi,
  /touches/gi,
  /targetTouches/gi,
  /changedTouches/gi,
  /initWheelEvent/gi,
  /deltaX/gi,
  /deltaY/gi,
  /deltaZ/gi,
  /deltaMode/gi,
  /initPointerEvent/gi,
  /pointerId/gi,
  /width/gi,
  /height/gi,
  /pressure/gi,
  /tangentialPressure/gi,
  /tiltX/gi,
  /tiltY/gi,
  /twist/gi,
  /pointerType/gi,
  /isPrimary/gi,
  /initClipboardEvent/gi,
  /clipboardData/gi,
  /initDragEvent/gi,
  /dataTransfer/gi,
  /initCompositionEvent/gi,
  /data/gi,
  /locale/gi,
  /initTransitionEvent/gi,
  /propertyName/gi,
  /elapsedTime/gi,
  /pseudoElement/gi,
  /initAnimationEvent/gi,
  /animationName/gi,
  /elapsedTime/gi,
  /pseudoElement/gi,
  /initUIEvent/gi,
  /view/gi,
  /detail/gi,
  /initMouseEvent/gi,
  /screenX/gi,
  /screenY/gi,
  /clientX/gi,
  /clientY/gi,
  /ctrlKey/gi,
  /shiftKey/gi,
  /altKey/gi,
  /metaKey/gi,
  /button/gi,
  /buttons/gi,
  /relatedTarget/gi,
  /initKeyboardEvent/gi,
  /key/gi,
  /code/gi,
  /location/gi,
  /repeat/gi,
  /isComposing/gi,
  /initFocusEvent/gi,
  /relatedTarget/gi,
  /initTouchEvent/gi,
  /touches/gi,
  /targetTouches/gi,
  /changedTouches/gi,
  /initWheelEvent/gi,
  /deltaX/gi,
  /deltaY/gi,
  /deltaZ/gi,
  /deltaMode/gi,
  /initPointerEvent/gi,
  /pointerId/gi,
  /width/gi,
  /height/gi,
  /pressure/gi,
  /tangentialPressure/gi,
  /tiltX/gi,
  /tiltY/gi,
  /twist/gi,
  /pointerType/gi,
  /isPrimary/gi,
  /initClipboardEvent/gi,
  /clipboardData/gi,
  /initDragEvent/gi,
  /dataTransfer/gi,
  /initCompositionEvent/gi,
  /data/gi,
  /locale/gi,
  /initTransitionEvent/gi,
  /propertyName/gi,
  /elapsedTime/gi,
  /pseudoElement/gi,
  /initAnimationEvent/gi,
  /animationName/gi,
  /elapsedTime/gi,
  /pseudoElement/gi
];

/**
 * Sanitiza una cadena de texto eliminando patrones XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Eliminar patrones XSS
  XSS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Escapar caracteres HTML especiales
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return sanitized;
}

/**
 * Sanitiza un objeto recursivamente
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as T;
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Valida si una cadena contiene patrones XSS
 */
export function containsXSS(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }

  return XSS_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Sanitiza HTML permitiendo solo etiquetas seguras
 */
export function sanitizeHTML(html: string): string {
  if (typeof html !== 'string') {
    return '';
  }

  // Lista de etiquetas permitidas
  const allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br', 'span', 'div'];
  
  // Crear un parser temporal para limpiar el HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Función recursiva para limpiar nodos
  function cleanNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return sanitizeString(node.textContent || '');
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();

      if (!allowedTags.includes(tagName)) {
        return Array.from(element.childNodes)
          .map(child => cleanNode(child))
          .join('');
      }

      const cleanAttributes: string[] = [];
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        // Solo permitir atributos seguros
        if (['class', 'id', 'style'].includes(attr.name.toLowerCase())) {
          cleanAttributes.push(`${attr.name}="${sanitizeString(attr.value)}"`);
        }
      }

      const children = Array.from(element.childNodes)
        .map(child => cleanNode(child))
        .join('');

      return `<${tagName}${cleanAttributes.length > 0 ? ' ' + cleanAttributes.join(' ') : ''}>${children}</${tagName}>`;
    }

    return '';
  }

  return Array.from(tempDiv.childNodes)
    .map(child => cleanNode(child))
    .join('');
}

/**
 * Valida y sanitiza URLs
 */
export function sanitizeURL(url: string): string {
  if (typeof url !== 'string') {
    return '';
  }

  try {
    const urlObj = new URL(url);
    
    // Solo permitir protocolos seguros
    if (!['http:', 'https:', 'mailto:', 'tel:'].includes(urlObj.protocol)) {
      return '';
    }

    return urlObj.toString();
  } catch {
    return '';
  }
}

/**
 * Sanitiza datos de formulario
 */
export function sanitizeFormData<T extends Record<string, any>>(data: T): T {
  const sanitized: any = {};

  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const value = data[key];
      
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item: string) => 
          typeof item === 'string' ? sanitizeString(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}
