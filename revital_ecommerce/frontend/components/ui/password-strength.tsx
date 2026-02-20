"use client";

import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';

interface PasswordStrengthProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showToggle?: boolean;
  showStrength?: boolean;
  showCriteria?: boolean;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  progressColor: string;
}

export function PasswordStrength({
  value,
  onChange,
  placeholder = "••••••••",
  disabled = false,
  className = "",
  showToggle = true,
  showStrength = true,
  showCriteria = true,
}: PasswordStrengthProps) {
  const [showPassword, setShowPassword] = useState(false);

  const getPasswordStrength = (password: string): PasswordStrength => {
    if (!password) return { score: 0, label: '', color: '', progressColor: '' }
    
    let score = 0
    if (password.length >= 8) score++
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++ // Caracteres especiales
    
    const labels = ['Muy débil', 'Débil', 'Media', 'Fuerte', 'Muy fuerte']
    const colors = ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-blue-500', 'text-green-500']
    const progressColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']
    
    return {
      score,
      label: labels[score - 1] || '',
      color: colors[score - 1] || '',
      progressColor: progressColors[score - 1] || '',
    }
  }

  const passwordStrength = getPasswordStrength(value);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Campo de contraseña */}
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={showToggle ? "pr-10" : undefined}
        />
        {showToggle && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Indicador de fortaleza */}
      {showStrength && value && (
        <div className="space-y-2">
          {/* Barra de progreso */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                passwordStrength.progressColor || 'bg-gray-300'
              }`}
              style={{ 
                width: `${Math.max(20, passwordStrength.score * 20)}%` 
              }}
            />
          </div>
          
          {/* Información de fortaleza */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground dark:text-gray-400">
              Fortaleza de la contraseña:
            </span>
            {passwordStrength.label && (
              <span className={`font-medium ${passwordStrength.color}`}>
                {passwordStrength.label}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Criterios de validación */}
      {showCriteria && value && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className={`flex items-center gap-2 ${value.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${value.length >= 8 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
            Al menos 8 caracteres
          </div>
          <div className={`flex items-center gap-2 ${/[a-z]/.test(value) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${/[a-z]/.test(value) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
            Letra minúscula
          </div>
          <div className={`flex items-center gap-2 ${/[A-Z]/.test(value) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(value) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
            Letra mayúscula
          </div>
          <div className={`flex items-center gap-2 ${/\d/.test(value) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${/\d/.test(value) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
            Número
          </div>
          <div className={`flex items-center gap-2 ${/[^A-Za-z0-9]/.test(value) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${/[^A-Za-z0-9]/.test(value) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
            Carácter especial
          </div>
        </div>
      )}
    </div>
  );
}
