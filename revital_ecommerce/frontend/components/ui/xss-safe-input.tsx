/**
 * Input seguro contra XSS
 * 
 * Componente de input que valida y sanitiza automáticamente contra XSS
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from "@/components/ui";
import { Label } from "@/components/ui";
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useXSSValidation } from '@/hooks/use-xss-validation';
import { cn } from '@/lib/utils';

interface XSSSafeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  onXSSDetected?: (hasXSS: boolean) => void;
  sanitize?: boolean;
  showValidation?: boolean;
  className?: string;
}

export const XSSSafeInput = React.forwardRef<HTMLInputElement, XSSSafeInputProps>(
  ({ 
    label, 
    error, 
    onXSSDetected, 
    sanitize = true, 
    showValidation = true,
    className,
    onChange,
    value,
    ...props 
  }, ref) => {
    const [inputValue, setInputValue] = useState(value || '');
    const [hasXSS, setHasXSS] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    
    const { validateString } = useXSSValidation({
      sanitize,
      throwOnXSS: false,
      logWarnings: true
    });

    // Validar en tiempo real
    const validateInput = useCallback((value: string) => {
      if (!value) {
        setHasXSS(false);
        onXSSDetected?.(false);
        return value;
      }

      setIsValidating(true);
      
      try {
        const sanitized = validateString(value, props.name || 'input');
        const hasXSSDetected = sanitized !== value;
        
        setHasXSS(hasXSSDetected);
        onXSSDetected?.(hasXSSDetected);
        
        return sanitized;
      } catch (error) {
        console.error('Error validando input:', error);
        setHasXSS(false);
        onXSSDetected?.(false);
        return value;
      } finally {
        setIsValidating(false);
      }
    }, [validateString, props.name, onXSSDetected]);

    // Manejar cambios en el input
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      
      // Validar y sanitizar
      const sanitizedValue = validateInput(newValue);
      
      // Crear evento con valor sanitizado
      const sanitizedEvent = {
        ...e,
        target: {
          ...e.target,
          value: sanitizedValue
        }
      };
      
      onChange?.(sanitizedEvent);
    }, [validateInput, onChange]);

    // Sincronizar con value externo
    useEffect(() => {
      if (value !== undefined && value !== inputValue) {
        setInputValue(value);
      }
    }, [value, inputValue]);

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={props.id} className="text-sm font-medium">
            {label}
          </Label>
        )}
        
        <div className="relative">
          <Input
            ref={ref}
            value={inputValue}
            onChange={handleChange}
            className={cn(
              "pr-8",
              hasXSS && "border-red-500 focus:border-red-500",
              !hasXSS && inputValue && "border-green-500 focus:border-green-500",
              className
            )}
            {...props}
          />
          
          {showValidation && inputValue && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isValidating ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              ) : hasXSS ? (
                <AlertCircle className="w-4 h-4 text-red-500" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        
        {hasXSS && showValidation && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            Contenido potencialmente malicioso detectado y sanitizado
          </p>
        )}
      </div>
    );
  }
);

XSSSafeInput.displayName = 'XSSSafeInput';

// Componente para textarea
interface XSSSafeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  onXSSDetected?: (hasXSS: boolean) => void;
  sanitize?: boolean;
  showValidation?: boolean;
  className?: string;
}

export const XSSSafeTextarea = React.forwardRef<HTMLTextAreaElement, XSSSafeTextareaProps>(
  ({ 
    label, 
    error, 
    onXSSDetected, 
    sanitize = true, 
    showValidation = true,
    className,
    onChange,
    value,
    ...props 
  }, ref) => {
    const [inputValue, setInputValue] = useState(value || '');
    const [hasXSS, setHasXSS] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    
    const { validateString } = useXSSValidation({
      sanitize,
      throwOnXSS: false,
      logWarnings: true
    });

    const validateInput = useCallback((value: string) => {
      if (!value) {
        setHasXSS(false);
        onXSSDetected?.(false);
        return value;
      }

      setIsValidating(true);
      
      try {
        const sanitized = validateString(value, props.name || 'textarea');
        const hasXSSDetected = sanitized !== value;
        
        setHasXSS(hasXSSDetected);
        onXSSDetected?.(hasXSSDetected);
        
        return sanitized;
      } catch (error) {
        console.error('Error validando textarea:', error);
        setHasXSS(false);
        onXSSDetected?.(false);
        return value;
      } finally {
        setIsValidating(false);
      }
    }, [validateString, props.name, onXSSDetected]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      
      const sanitizedValue = validateInput(newValue);
      
      const sanitizedEvent = {
        ...e,
        target: {
          ...e.target,
          value: sanitizedValue
        }
      };
      
      onChange?.(sanitizedEvent);
    }, [validateInput, onChange]);

    useEffect(() => {
      if (value !== undefined && value !== inputValue) {
        setInputValue(value);
      }
    }, [value, inputValue]);

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={props.id} className="text-sm font-medium">
            {label}
          </Label>
        )}
        
        <div className="relative">
          <textarea
            ref={ref}
            value={inputValue}
            onChange={handleChange}
            className={cn(
              "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-8",
              hasXSS && "border-red-500 focus:border-red-500",
              !hasXSS && inputValue && "border-green-500 focus:border-green-500",
              className
            )}
            {...props}
          />
          
          {showValidation && inputValue && (
            <div className="absolute right-3 top-3">
              {isValidating ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              ) : hasXSS ? (
                <AlertCircle className="w-4 h-4 text-red-500" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        
        {hasXSS && showValidation && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            Contenido potencialmente malicioso detectado y sanitizado
          </p>
        )}
      </div>
    );
  }
);

XSSSafeTextarea.displayName = 'XSSSafeTextarea';
