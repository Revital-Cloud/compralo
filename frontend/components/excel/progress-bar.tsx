'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Upload, Database, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileUploadProgress } from '@/types/data';

interface ProgressBarProps {
  progress: FileUploadProgress;
  fileName?: string;
  className?: string;
}

export function ProgressBar({ progress, fileName, className }: ProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  // Animación suave del progreso
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress.percentage);
    }, 100);

    return () => clearTimeout(timer);
  }, [progress.percentage]);

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'uploading':
        return <Upload className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'processing':
        return <Database className="h-5 w-5 text-orange-500 animate-spin" />;
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Upload className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (progress.status) {
      case 'uploading':
        return 'Subiendo archivo...';
      case 'processing':
        return 'Procesando datos...';
      case 'complete':
        return 'Proceso completado';
      case 'error':
        return 'Error en el proceso';
      default:
        return 'Preparando...';
    }
  };

  const getStatusBadgeVariant = () => {
    switch (progress.status) {
      case 'uploading':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'complete':
        return 'default';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getProgressBarColor = () => {
    switch (progress.status) {
      case 'error':
        return 'bg-red-500';
      case 'complete':
        return 'bg-green-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header con estado */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <h4 className="font-medium">{getStatusText()}</h4>
                {fileName && (
                  <p className="text-sm text-gray-600">{fileName}</p>
                )}
              </div>
            </div>
            <Badge variant={getStatusBadgeVariant()}>
              {displayProgress}%
            </Badge>
          </div>

          {/* Barra de progreso */}
          <div className="space-y-2">
            <Progress 
              value={displayProgress} 
              className="h-3"
            />
            
            {/* Detalles del progreso */}
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                {progress.loaded.toFixed(1)}MB / {progress.total.toFixed(1)}MB
              </span>
              <span>
                {progress.status === 'complete' ? 'Completado' : 'En progreso'}
              </span>
            </div>
          </div>

          {/* Fases del proceso */}
          <div className="flex items-center justify-between text-xs">
            <div className={`flex items-center gap-1 ${
              progress.status === 'uploading' || progress.status === 'processing' || progress.status === 'complete'
                ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                progress.status === 'uploading' || progress.status === 'processing' || progress.status === 'complete'
                  ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              Subida
            </div>

            <div className={`flex items-center gap-1 ${
              progress.status === 'processing' || progress.status === 'complete'
                ? 'text-green-600' : progress.status === 'uploading' ? 'text-blue-600' : 'text-gray-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                progress.status === 'processing' || progress.status === 'complete'
                  ? 'bg-green-500' : progress.status === 'uploading' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
              }`} />
              Procesamiento
            </div>

            <div className={`flex items-center gap-1 ${
              progress.status === 'complete' ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                progress.status === 'complete' ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              Completado
            </div>
          </div>

          {/* Mensaje adicional según el estado */}
          {progress.status === 'processing' && (
            <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
              Analizando estructura del archivo y validando datos...
            </div>
          )}

          {progress.status === 'complete' && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
              ¡Archivo procesado exitosamente! Revisa el preview antes de continuar.
            </div>
          )}

          {progress.status === 'error' && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              Hubo un error al procesar el archivo. Por favor, inténtalo de nuevo.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente más simple para progreso inline
export function InlineProgressBar({ 
  progress, 
  showDetails = false 
}: { 
  progress: number; 
  showDetails?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {showDetails && (
          <>
            <span className="text-sm text-gray-600">Progreso</span>
            <span className="text-sm font-medium">{progress}%</span>
          </>
        )}
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}

// Componente para progreso circular
export function CircularProgress({ 
  progress, 
  size = 'md',
  showPercentage = true 
}: { 
  progress: number; 
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
}) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8';
      case 'lg':
        return 'w-16 h-16';
      default:
        return 'w-12 h-12';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-sm';
      default:
        return 'text-xs';
    }
  };

  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative ${getSizeClasses()}`}>
      <svg className="transform -rotate-90 w-full h-full">
        {/* Background circle */}
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="text-blue-500 transition-all duration-300 ease-in-out"
          strokeLinecap="round"
        />
      </svg>
      
      {showPercentage && (
        <div className={`absolute inset-0 flex items-center justify-center ${getTextSize()} font-medium`}>
          {progress}%
        </div>
      )}
    </div>
  );
} 