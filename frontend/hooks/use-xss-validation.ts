/**
 * Hook para validación y sanitización XSS
 * 
 * Proporciona funciones para validar y sanitizar datos contra ataques XSS
 */

import { useCallback, useMemo } from 'react';
import { 
  sanitizeString, 
  sanitizeObject, 
  containsXSS, 
  sanitizeHTML, 
  sanitizeURL, 
  sanitizeFormData 
} from '@/utils/xss-sanitizer';

export interface XSSValidationOptions {
  sanitize?: boolean;
  throwOnXSS?: boolean;
  logWarnings?: boolean;
}

export function useXSSValidation(options: XSSValidationOptions = {}) {
  const {
    sanitize = true,
    throwOnXSS = false,
    logWarnings = true
  } = options;

  // Validar y sanitizar string
  const validateString = useCallback((input: string, fieldName?: string): string => {
    if (typeof input !== 'string') {
      return '';
    }

    const hasXSS = containsXSS(input);
    
    if (hasXSS) {
      if (logWarnings) {
        console.warn(`⚠️ XSS detectado en ${fieldName || 'campo'}:`, input);
      }
      
      if (throwOnXSS) {
        throw new Error(`Contenido potencialmente malicioso detectado en ${fieldName || 'campo'}`);
      }
    }

    return sanitize ? sanitizeString(input) : input;
  }, [sanitize, throwOnXSS, logWarnings]);

  // Validar y sanitizar objeto
  const validateObject = useCallback(<T>(obj: T, objectName?: string): T => {
    if (obj === null || obj === undefined) {
      return obj;
    }

    // Verificar si el objeto contiene XSS
    const objString = JSON.stringify(obj);
    const hasXSS = containsXSS(objString);
    
    if (hasXSS) {
      if (logWarnings) {
        console.warn(`⚠️ XSS detectado en objeto ${objectName || 'desconocido'}:`, obj);
      }
      
      if (throwOnXSS) {
        throw new Error(`Contenido potencialmente malicioso detectado en objeto ${objectName || 'desconocido'}`);
      }
    }

    return sanitize ? sanitizeObject(obj) : obj;
  }, [sanitize, throwOnXSS, logWarnings]);

  // Validar y sanitizar HTML
  const validateHTML = useCallback((html: string, fieldName?: string): string => {
    if (typeof html !== 'string') {
      return '';
    }

    const hasXSS = containsXSS(html);
    
    if (hasXSS) {
      if (logWarnings) {
        console.warn(`⚠️ XSS detectado en HTML ${fieldName || 'campo'}:`, html);
      }
      
      if (throwOnXSS) {
        throw new Error(`Contenido HTML potencialmente malicioso detectado en ${fieldName || 'campo'}`);
      }
    }

    return sanitize ? sanitizeHTML(html) : html;
  }, [sanitize, throwOnXSS, logWarnings]);

  // Validar y sanitizar URL
  const validateURL = useCallback((url: string, fieldName?: string): string => {
    if (typeof url !== 'string') {
      return '';
    }

    const hasXSS = containsXSS(url);
    
    if (hasXSS) {
      if (logWarnings) {
        console.warn(`⚠️ XSS detectado en URL ${fieldName || 'campo'}:`, url);
      }
      
      if (throwOnXSS) {
        throw new Error(`URL potencialmente maliciosa detectada en ${fieldName || 'campo'}`);
      }
    }

    return sanitize ? sanitizeURL(url) : url;
  }, [sanitize, throwOnXSS, logWarnings]);

  // Validar y sanitizar datos de formulario
  const validateFormData = useCallback(<T extends Record<string, any>>(
    data: T, 
    formName?: string
  ): T => {
    const hasXSS = Object.values(data).some(value => {
      if (typeof value === 'string') {
        return containsXSS(value);
      }
      if (Array.isArray(value)) {
        return value.some(item => typeof item === 'string' && containsXSS(item));
      }
      if (typeof value === 'object' && value !== null) {
        return containsXSS(JSON.stringify(value));
      }
      return false;
    });

    if (hasXSS) {
      if (logWarnings) {
        console.warn(`⚠️ XSS detectado en formulario ${formName || 'desconocido'}:`, data);
      }
      
      if (throwOnXSS) {
        throw new Error(`Contenido potencialmente malicioso detectado en formulario ${formName || 'desconocido'}`);
      }
    }

    return sanitize ? sanitizeFormData(data) : data;
  }, [sanitize, throwOnXSS, logWarnings]);

  // Validar múltiples campos
  const validateFields = useCallback((fields: Record<string, any>): Record<string, any> => {
    const validated: Record<string, any> = {};

    for (const [key, value] of Object.entries(fields)) {
      if (typeof value === 'string') {
        validated[key] = validateString(value, key);
      } else if (Array.isArray(value)) {
        validated[key] = value.map(item => 
          typeof item === 'string' ? validateString(item, `${key}[]`) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        validated[key] = validateObject(value, key);
      } else {
        validated[key] = value;
      }
    }

    return validated;
  }, [validateString, validateObject]);

  // Hook para validación en tiempo real
  const useRealTimeValidation = useCallback((fieldName: string) => {
    return useCallback((value: string) => {
      return validateString(value, fieldName);
    }, [validateString, fieldName]);
  }, [validateString]);

  // Memoizar funciones para evitar re-renders innecesarios
  const validationFunctions = useMemo(() => ({
    validateString,
    validateObject,
    validateHTML,
    validateURL,
    validateFormData,
    validateFields,
    useRealTimeValidation
  }), [
    validateString,
    validateObject,
    validateHTML,
    validateURL,
    validateFormData,
    validateFields,
    useRealTimeValidation
  ]);

  return validationFunctions;
}

// Hook específico para formularios
export function useFormXSSValidation(formName?: string) {
  const { validateFormData, validateFields } = useXSSValidation({
    sanitize: true,
    throwOnXSS: false,
    logWarnings: true
  });

  const validateForm = useCallback(<T extends Record<string, any>>(data: T): T => {
    return validateFormData(data, formName);
  }, [validateFormData, formName]);

  const validateFormFields = useCallback((fields: Record<string, any>): Record<string, any> => {
    return validateFields(fields);
  }, [validateFields]);

  return {
    validateForm,
    validateFormFields
  };
}

// Hook específico para contenido HTML
export function useHTMLXSSValidation() {
  const { validateHTML } = useXSSValidation({
    sanitize: true,
    throwOnXSS: false,
    logWarnings: true
  });

  return {
    validateHTML
  };
}

// Hook específico para URLs
export function useURLXSSValidation() {
  const { validateURL } = useXSSValidation({
    sanitize: true,
    throwOnXSS: false,
    logWarnings: true
  });

  return {
    validateURL
  };
}
