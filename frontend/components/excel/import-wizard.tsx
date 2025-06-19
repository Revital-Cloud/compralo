'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Upload, CheckCircle } from 'lucide-react';
import { FileUploader } from './file-uploader';
import { ImportPreview } from './import-preview';
import { ProgressBar } from './progress-bar';
import { useFileImport } from '@/hooks/use-file-import';
import { ImportOptions, ImportResult } from '@/types/data';

interface ImportWizardProps {
  title?: string;
  description?: string;
  templateType?: 'products' | 'users';
  requiredFields?: string[];
  onImportComplete?: (result: ImportResult) => void;
  onCancel?: () => void;
  className?: string;
}

export function ImportWizard({
  title = 'Importar Datos',
  description = 'Sube un archivo Excel o CSV para importar datos masivamente',
  templateType = 'products',
  requiredFields = ['nombre', 'precio'],
  onImportComplete,
  onCancel,
  className
}: ImportWizardProps) {
  const [currentStep, setCurrentStep] = useState<'upload' | 'progress' | 'preview' | 'complete'>('upload');

  const {
    preview,
    uploadProgress,
    validationErrors,
    isProcessing,
    isImporting,
    previewStats,
    processFile,
    confirmImport,
    cancelImport,
    downloadTemplate
  } = useFileImport({
    validateRequired: requiredFields,
    onSuccess: (result) => {
      setCurrentStep('complete');
      onImportComplete?.(result);
    },
    onError: (error) => {
      console.error('Import error:', error);
      setCurrentStep('upload');
    }
  });

  const handleFileSelect = async (file: File, options: ImportOptions) => {
    try {
      setCurrentStep('progress');
      await processFile(file, options);
      setCurrentStep('preview');
    } catch (error) {
      setCurrentStep('upload');
    }
  };

  const handleConfirmImport = () => {
    confirmImport('/api/v1/products/import');
  };

  const handleCancel = () => {
    cancelImport();
    setCurrentStep('upload');
    onCancel?.();
  };

  const handleBackToUpload = () => {
    cancelImport();
    setCurrentStep('upload');
  };

  const steps = [
    { id: 'upload', label: 'Subir Archivo', icon: Upload },
    { id: 'preview', label: 'Vista Previa', icon: CheckCircle },
    { id: 'complete', label: 'Completado', icon: CheckCircle }
  ];

  const getStepStatus = (stepId: string) => {
    const stepIndex = steps.findIndex(step => step.id === stepId);
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {title}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
          
          {/* Indicador de pasos */}
          <div className="flex items-center gap-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const status = getStepStatus(step.id);
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
                    status === 'completed' ? 'bg-green-100 text-green-800' :
                    status === 'current' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon className="h-3 w-3" />
                    {step.label}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-1 ${
                      status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Paso 1: Upload */}
        {currentStep === 'upload' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Paso 1: Seleccionar Archivo</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate('excel', templateType)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Template Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate('csv', templateType)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Template CSV
                </Button>
              </div>
            </div>
            
            <FileUploader
              onFileSelect={handleFileSelect}
              acceptedFormats={['csv', 'excel']}
              maxFileSize={50}
            />

            {requiredFields.length > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Campos Requeridos</h4>
                <div className="flex flex-wrap gap-2">
                  {requiredFields.map((field) => (
                    <Badge key={field} variant="outline" className="bg-white">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Paso 2: Progress */}
        {currentStep === 'progress' && uploadProgress && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToUpload}
                disabled={isProcessing}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver
              </Button>
              <h3 className="font-medium">Procesando Archivo</h3>
            </div>
            
            <ProgressBar
              progress={uploadProgress}
              fileName={preview?.fileName}
            />
          </div>
        )}

        {/* Paso 3: Preview */}
        {currentStep === 'preview' && preview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToUpload}
                  disabled={isImporting}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Volver
                </Button>
                <h3 className="font-medium">Paso 2: Revisar Datos</h3>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={previewStats.hasErrors ? 'destructive' : 'default'}>
                  {previewStats.validRows} filas válidas
                </Badge>
                {previewStats.errorCount > 0 && (
                  <Badge variant="destructive">
                    {previewStats.errorCount} errores
                  </Badge>
                )}
                {previewStats.warningCount > 0 && (
                  <Badge variant="secondary">
                    {previewStats.warningCount} advertencias
                  </Badge>
                )}
              </div>
            </div>

            <ImportPreview
              preview={preview}
              validationErrors={validationErrors}
              onConfirm={handleConfirmImport}
              onCancel={handleCancel}
              isImporting={isImporting}
            />
          </div>
        )}

        {/* Paso 4: Complete */}
        {currentStep === 'complete' && (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-xl font-semibold text-green-900 mb-2">
              ¡Importación Completada!
            </h3>
            <p className="text-gray-600 mb-6">
              Los datos se han importado exitosamente a tu sistema.
            </p>
            
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={handleBackToUpload}
              >
                Importar Más Datos
              </Button>
              <Button onClick={onCancel}>
                Finalizar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 