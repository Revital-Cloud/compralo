'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, FileText, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogDescription } from '@/components/ui/alert-dialog';

import { cn } from '@/lib/utils';
import { ImportOptions } from '@/types/data';

interface FileUploaderProps {
  onFileSelect: (file: File, options: ImportOptions) => void;
  onFileRemove?: () => void;
  acceptedFormats?: ('csv' | 'excel')[];
  maxFileSize?: number; // en MB
  className?: string;
  disabled?: boolean;
}

export function FileUploader({
  onFileSelect,
  onFileRemove,
  acceptedFormats = ['csv', 'excel'],
  maxFileSize = 50,
  className,
  disabled = false
}: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    fileType: 'auto',
    hasHeader: true,
    skipEmptyLines: true,
    trimFields: true,
    delimiter: ',',
    encoding: 'utf-8'
  });

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);

    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0];
      if (error.code === 'file-too-large') {
        setError(`El archivo es demasiado grande. Máximo ${maxFileSize}MB permitido.`);
      } else if (error.code === 'file-invalid-type') {
        setError('Formato de archivo no válido. Use CSV o Excel (.xlsx, .xls).');
      } else {
        setError('Error al cargar el archivo.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      setError(null);
    }
  }, [maxFileSize]);

  const acceptedFileTypes = {
    'text/csv': ['.csv'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-excel': ['.xls']
  };

  // Filtrar tipos según formatos permitidos
  const filteredAcceptTypes = Object.entries(acceptedFileTypes).reduce((acc, [mimeType, extensions]) => {
    const isCSV = extensions.includes('.csv');
    const isExcel = extensions.includes('.xlsx') || extensions.includes('.xls');
    
    if ((isCSV && acceptedFormats.includes('csv')) || (isExcel && acceptedFormats.includes('excel'))) {
      acc[mimeType] = extensions;
    }
    return acc;
  }, {} as Record<string, string[]>);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: filteredAcceptTypes,
    maxSize: maxFileSize * 1024 * 1024, // Convertir MB a bytes
    multiple: false,
    disabled
  });

  const handleProcessFile = () => {
    if (selectedFile) {
      onFileSelect(selectedFile, importOptions);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
    onFileRemove?.();
  };

  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'csv') {
      return <FileText className="h-8 w-8 text-green-500" />;
    }
    return <FileSpreadsheet className="h-8 w-8 text-blue-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Área de Drop Zone */}
      {!selectedFile && (
        <Card className={cn(
          'border-2 border-dashed transition-colors duration-200',
          isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}>
          <CardContent className="p-8">
            <div
              {...getRootProps()}
              className={cn(
                'flex flex-col items-center justify-center text-center cursor-pointer',
                disabled && 'cursor-not-allowed'
              )}
            >
              <input {...getInputProps()} />
              <Upload className={cn(
                'h-12 w-12 mb-4',
                isDragActive ? 'text-primary' : 'text-gray-400'
              )} />
              
              <h3 className="text-lg font-semibold mb-2">
                {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra tu archivo aquí'}
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                o haz clic para seleccionar
              </p>

              <div className="flex gap-2 mb-4">
                {acceptedFormats.includes('csv') && (
                  <Badge variant="secondary">CSV</Badge>
                )}
                {acceptedFormats.includes('excel') && (
                  <>
                    <Badge variant="secondary">XLSX</Badge>
                    <Badge variant="secondary">XLS</Badge>
                  </>
                )}
              </div>

              <p className="text-xs text-gray-500">
                Máximo {maxFileSize}MB
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Archivo Seleccionado */}
      {selectedFile && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getFileIcon(selectedFile)}
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Opciones de Importación */}
      {selectedFile && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h4 className="font-medium">Opciones de Importación</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Formato</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={importOptions.fileType}
                  onChange={(e) => setImportOptions(prev => ({
                    ...prev,
                    fileType: e.target.value as 'auto' | 'csv' | 'excel'
                  }))}
                >
                  <option value="auto">Auto-detectar</option>
                  <option value="csv">CSV</option>
                  <option value="excel">Excel</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Encoding</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={importOptions.encoding}
                  onChange={(e) => setImportOptions(prev => ({
                    ...prev,
                    encoding: e.target.value as 'utf-8' | 'latin1' | 'iso-8859-1'
                  }))}
                >
                  <option value="utf-8">UTF-8</option>
                  <option value="latin1">Latin1</option>
                  <option value="iso-8859-1">ISO-8859-1</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Separador (CSV)</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={importOptions.delimiter}
                  onChange={(e) => setImportOptions(prev => ({
                    ...prev,
                    delimiter: e.target.value as ',' | ';' | '\t' | '|'
                  }))}
                  disabled={importOptions.fileType === 'excel'}
                >
                  <option value=",">Coma (,)</option>
                  <option value=";">Punto y coma (;)</option>
                  <option value="\t">Tab</option>
                  <option value="|">Pipe (|)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={importOptions.hasHeader}
                    onChange={(e) => setImportOptions(prev => ({
                      ...prev,
                      hasHeader: e.target.checked
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Primera fila es encabezado</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={importOptions.skipEmptyLines}
                    onChange={(e) => setImportOptions(prev => ({
                      ...prev,
                      skipEmptyLines: e.target.checked
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Omitir líneas vacías</span>
                </label>
              </div>
            </div>

            <Button
              onClick={handleProcessFile}
              className="w-full"
              disabled={!selectedFile}
            >
              Procesar Archivo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <AlertDialog>
          <AlertCircle className="h-4 w-4" />
          <AlertDialogDescription>{error}</AlertDialogDescription>
        </AlertDialog>
      )}
    </div>
  );
} 