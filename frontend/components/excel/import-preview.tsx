'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogDescription,AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ImportPreview, ImportError } from '@/types/data';

interface ImportPreviewProps {
  preview: ImportPreview;
  validationErrors: ImportError[];
  onConfirm: () => void;
  onCancel: () => void;
  isImporting?: boolean;
  className?: string;
}

export function ImportPreview({
  preview,
  validationErrors,
  onConfirm,
  onCancel,
  isImporting = false,
  className
}: ImportPreviewProps) {
  const [showAllRows, setShowAllRows] = useState(false);
  const [selectedTab, setSelectedTab] = useState('preview');

  const hasErrors = validationErrors.some(error => error.severity === 'error');
  const hasWarnings = validationErrors.some(error => error.severity === 'warning');
  const errorCount = validationErrors.filter(error => error.severity === 'error').length;
  const warningCount = validationErrors.filter(error => error.severity === 'warning').length;
  const validRows = preview.totalRows - errorCount;

  const displayRows = showAllRows ? preview.preview : preview.preview.slice(0, 3);

  const getValidationStatusIcon = () => {
    if (hasErrors) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    if (hasWarnings) {
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  const getValidationStatusText = () => {
    if (hasErrors) {
      return 'Errores encontrados';
    }
    if (hasWarnings) {
      return 'Advertencias encontradas';
    }
    return 'Validación exitosa';
  };

  const getValidationStatusColor = () => {
    if (hasErrors) return 'destructive';
    if (hasWarnings) return 'secondary';
    return 'default';
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getValidationStatusIcon()}
              Preview de Importación
            </CardTitle>
            <Badge variant={getValidationStatusColor()}>
              {getValidationStatusText()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{preview.totalRows}</p>
              <p className="text-sm text-blue-600">Total Filas</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{validRows}</p>
              <p className="text-sm text-green-600">Filas Válidas</p>
            </div>
            {errorCount > 0 && (
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{errorCount}</p>
                <p className="text-sm text-red-600">Errores</p>
              </div>
            )}
            {warningCount > 0 && (
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
                <p className="text-sm text-yellow-600">Advertencias</p>
              </div>
            )}
          </div>

          {/* Información del archivo */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Información del Archivo</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Archivo:</span> {preview.fileName}
              </div>
              <div>
                <span className="font-medium">Formato:</span> {preview.detectedFormat.toUpperCase()}
              </div>
              {preview.encoding && (
                <div>
                  <span className="font-medium">Encoding:</span> {preview.encoding}
                </div>
              )}
              {preview.delimiter && (
                <div>
                  <span className="font-medium">Separador:</span> {preview.delimiter}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Tabs para Preview y Errores */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview">
                Preview ({preview.preview.length} filas)
              </TabsTrigger>
              <TabsTrigger value="headers">
                Columnas ({preview.headers.length})
              </TabsTrigger>
              <TabsTrigger value="errors" disabled={validationErrors.length === 0}>
                {validationErrors.length > 0 ? `Errores (${validationErrors.length})` : 'Sin Errores'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Vista Previa de Datos</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllRows(!showAllRows)}
                  disabled={preview.preview.length <= 3}
                >
                  {showAllRows ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Mostrar menos
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Mostrar todas ({preview.preview.length})
                    </>
                  )}
                </Button>
              </div>

              <ScrollArea className="h-[400px] w-full">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">#</th>
                        {preview.headers.map((header, index) => (
                          <th key={index} className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayRows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-3 py-2 text-sm font-medium bg-gray-50">
                            {rowIndex + 1}
                          </td>
                          {preview.headers.map((header, colIndex) => {
                            const value = row[header];
                            const hasError = validationErrors.some(
                              error => error.row === rowIndex + 1 && error.field === header
                            );
                            return (
                              <td
                                key={colIndex}
                                className={`border border-gray-200 px-3 py-2 text-sm ${
                                  hasError ? 'bg-red-50 text-red-700' : ''
                                }`}
                              >
                                {String(value || '-')}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="headers" className="space-y-4">
              <h4 className="font-medium">Columnas Detectadas</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {preview.headers.map((header, index) => (
                  <Badge key={index} variant="outline" className="justify-center py-2">
                    {header}
                  </Badge>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="errors" className="space-y-4">
              <h4 className="font-medium">
                Errores y Advertencias ({validationErrors.length})
              </h4>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {validationErrors.map((error, index) => (
                    <AlertDialog key={index}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDialogDescription>
                        <span className="font-medium">Fila {error.row}</span>
                        {error.field && <span className="text-sm"> - {error.field}</span>}
                        : {error.message}
                      </AlertDialogDescription>
                    </AlertDialog>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <Separator />

          {/* Mensaje de validación */}
          {hasErrors && (
            <AlertDialogCancel>
              <XCircle className="h-4 w-4" />
              <AlertDialogDescription>
                Se encontraron {errorCount} errores que deben corregirse antes de continuar.
                Por favor, revisa el archivo y vuelve a intentarlo.
              </AlertDialogDescription>
            </AlertDialogCancel>
          )}

          {hasWarnings && !hasErrors && (
            <AlertDialog>
              <AlertCircle className="h-4 w-4" />
              <AlertDialogDescription>
                Se encontraron {warningCount} advertencias. Puedes continuar con la importación,
                pero te recomendamos revisar estos datos.
              </AlertDialogDescription>
            </AlertDialog>
          )}

          {!hasErrors && !hasWarnings && (
            <AlertDialog>
              <CheckCircle className="h-4 w-4" />
              <AlertDialogDescription>
                ¡Excelente! Todos los datos son válidos. Puedes proceder con la importación.
              </AlertDialogDescription>
            </AlertDialog>
          )}

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onCancel}
              variant="outline"
              disabled={isImporting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={onConfirm}
              disabled={hasErrors || isImporting}
              className="flex-1"
            >
              {isImporting ? 'Importando...' : `Confirmar Importación (${validRows} filas)`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 