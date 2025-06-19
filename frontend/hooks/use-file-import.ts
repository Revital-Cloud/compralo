import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { excelService } from '@/services/excel.service';
import { 
  ImportOptions, 
  ImportPreview, 
  ImportResult,
  FileUploadProgress,
  ImportError
} from '@/types/data';

interface UseFileImportOptions {
  onSuccess?: (result: ImportResult) => void;
  onError?: (error: string) => void;
  validateRequired?: string[];
  maxFileSize?: number;
}

export const useFileImport = (options: UseFileImportOptions = {}) => {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress | null>(null);
  const [validationErrors, setValidationErrors] = useState<ImportError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const queryClient = useQueryClient();

  // Configuración por defecto
  const defaultImportOptions: ImportOptions = {
    fileType: 'auto',
    hasHeader: true,
    skipEmptyLines: true,
    trimFields: true,
    delimiter: ',',
    encoding: 'utf-8'
  };

  /**
   * Procesa archivo y genera preview
   */
  const processFile = useCallback(async (
    file: File, 
    importOptions: Partial<ImportOptions> = {}
  ) => {
    try {
      setIsProcessing(true);
      setValidationErrors([]);
      
      const finalOptions = { ...defaultImportOptions, ...importOptions };
      
      // Simular progreso de upload
      await excelService.simulateUploadProgress(setUploadProgress, 2000);
      
      // Procesar archivo
      const previewData = await excelService.processFile(file, finalOptions);
      setPreview(previewData);

      // Validar datos si se especificaron campos requeridos
      if (options.validateRequired && previewData.preview.length > 0) {
        const errors = excelService.validateImportData(
          previewData.preview, 
          options.validateRequired
        );
        setValidationErrors(errors);
      }

      setUploadProgress(null);
      
      toast.success(`Archivo procesado: ${previewData.totalRows} filas detectadas`);
      
      return previewData;
    } catch (error) {
      setUploadProgress(null);
      const errorMessage = error instanceof Error ? error.message : 'Error al procesar archivo';
      toast.error(errorMessage);
      options.onError?.(errorMessage);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [options]);

  /**
   * Mutation para enviar datos al backend
   */
  const importMutation = useMutation({
    mutationFn: async (data: { 
      preview: ImportPreview; 
      options: ImportOptions;
      endpoint: string;
    }) => {
      // Aquí iría la llamada al API del backend
      // Por ahora simulo el proceso
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const result: ImportResult = {
        success: true,
        totalRows: data.preview.totalRows,
        processedRows: data.preview.totalRows,
        successfulRows: data.preview.totalRows - validationErrors.filter(e => e.severity === 'error').length,
        failedRows: validationErrors.filter(e => e.severity === 'error').length,
        errors: validationErrors
      };

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      if (result.success) {
        toast.success(`Importación completada: ${result.successfulRows} registros procesados`);
        options.onSuccess?.(result);
      } else {
        toast.error('La importación falló. Revisa los errores.');
      }
      
      // Limpiar estado
      setPreview(null);
      setValidationErrors([]);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Error en la importación';
      toast.error(errorMessage);
      options.onError?.(errorMessage);
    }
  });

  /**
   * Confirma la importación después del preview
   */
  const confirmImport = useCallback((endpoint: string = '/api/v1/products/import') => {
    if (!preview) {
      toast.error('No hay datos para importar');
      return;
    }

    const hasErrors = validationErrors.some(error => error.severity === 'error');
    if (hasErrors) {
      toast.error('Corrige los errores antes de continuar con la importación');
      return;
    }

    importMutation.mutate({
      preview,
      options: defaultImportOptions,
      endpoint
    });
  }, [preview, validationErrors, importMutation]);

  /**
   * Cancela la importación y limpia el estado
   */
  const cancelImport = useCallback(() => {
    setPreview(null);
    setValidationErrors([]);
    setUploadProgress(null);
    setIsProcessing(false);
  }, []);

  /**
   * Descarga template de ejemplo
   */
  const downloadTemplate = useCallback((
    format: 'csv' | 'excel' = 'excel',
    templateType: 'products' | 'users' = 'products'
  ) => {
    try {
      excelService.downloadTemplate(format, templateType);
      toast.success(`Template ${format.toUpperCase()} descargado`);
    } catch (error) {
      toast.error('Error al descargar template');
    }
  }, []);

  /**
   * Estadísticas del preview
   */
  const previewStats = {
    totalRows: preview?.totalRows || 0,
    hasErrors: validationErrors.some(e => e.severity === 'error'),
    errorCount: validationErrors.filter(e => e.severity === 'error').length,
    warningCount: validationErrors.filter(e => e.severity === 'warning').length,
    validRows: (preview?.totalRows || 0) - validationErrors.filter(e => e.severity === 'error').length
  };

  return {
    // Estado
    preview,
    uploadProgress,
    validationErrors,
    isProcessing,
    isImporting: importMutation.isPending,
    previewStats,

    // Acciones
    processFile,
    confirmImport,
    cancelImport,
    downloadTemplate,

    // Métodos del servicio expuestos
    detectFileFormat: excelService.detectFileFormat,
    validateData: excelService.validateImportData
  };
}; 