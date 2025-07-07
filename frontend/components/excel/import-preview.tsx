'use client';

import { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Eye, EyeOff, FileText, BarChart3, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  const successRate = Math.round((validRows / preview.totalRows) * 100);

  const displayRows = showAllRows ? preview.preview : preview.preview.slice(0, 5);

  const getValidationIcon = () => {
    if (hasErrors) return <XCircle className="h-6 w-6 text-red-500" />;
    if (hasWarnings) return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
    return <CheckCircle className="h-6 w-6 text-green-500" />;
  };

  const getValidationStatus = () => {
    if (hasErrors) return { text: 'Errores encontrados', color: 'destructive' as const };
    if (hasWarnings) return { text: 'Advertencias encontradas', color: 'secondary' as const };
    return { text: 'Validación exitosa', color: 'default' as const };
  };

  const status = getValidationStatus();

  return (
    <div className={className}>
      {/* Header con estado de validación */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getValidationIcon()}
              <div>
                <CardTitle className="text-xl">Preview de Importación</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Revisión de datos antes de la importación
                </p>
              </div>
            </div>
            <Badge variant={status.color} className="text-sm px-3 py-1">
              {status.text}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Progress Bar */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Tasa de éxito</span>
              <span className="text-muted-foreground">{successRate}%</span>
            </div>
            <Progress 
              value={successRate} 
              className="h-2"
            />
          </div>

          {/* Estadísticas mejoradas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative overflow-hidden rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100/50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-500/10 p-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">{preview.totalRows}</p>
                  <p className="text-sm font-medium text-blue-600">Total Filas</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-lg border bg-gradient-to-br from-green-50 to-green-100/50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-500/10 p-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{validRows}</p>
                  <p className="text-sm font-medium text-green-600">Filas Válidas</p>
                </div>
              </div>
            </div>

            {errorCount > 0 && (
              <div className="relative overflow-hidden rounded-lg border bg-gradient-to-br from-red-50 to-red-100/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-red-500/10 p-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-700">{errorCount}</p>
                    <p className="text-sm font-medium text-red-600">Errores</p>
                  </div>
                </div>
              </div>
            )}

            {warningCount > 0 && (
              <div className="relative overflow-hidden rounded-lg border bg-gradient-to-br from-yellow-50 to-yellow-100/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-yellow-500/10 p-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-700">{warningCount}</p>
                    <p className="text-sm font-medium text-yellow-600">Advertencias</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Información del archivo mejorada */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Información del Archivo
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Archivo</span>
              <span className="text-sm font-mono bg-muted px-2 py-1 rounded truncate">
                {preview.fileName}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Formato</span>
              <Badge variant="outline" className="w-fit">
                {preview.detectedFormat.toUpperCase()}
              </Badge>
            </div>
            {preview.encoding && (
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Encoding</span>
                <span className="text-sm">{preview.encoding}</span>
              </div>
            )}
            {preview.delimiter && (
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Separador</span>
                <span className="text-sm font-mono bg-muted px-2 py-1 rounded w-fit">
                  {preview.delimiter}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs mejoradas */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <div className="border-b px-6 pt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="preview" className="text-sm">
                  Vista Previa ({preview.preview.length})
                </TabsTrigger>
                <TabsTrigger value="headers" className="text-sm">
                  Columnas ({preview.headers.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="errors" 
                  disabled={validationErrors.length === 0}
                  className="text-sm"
                >
                  {validationErrors.length > 0 ? `Errores (${validationErrors.length})` : 'Sin Errores'}
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="preview" className="space-y-4 m-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg">Vista Previa de Datos</h4>
                  {preview.preview.length > 5 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAllRows(!showAllRows)}
                    >
                      {showAllRows ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Mostrar menos
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver todas ({preview.preview.length})
                        </>
                      )}
                    </Button>
                  )}
                </div>

                <div className="rounded-lg border overflow-hidden">
                  <ScrollArea className="h-[400px] w-full">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="sticky left-0 bg-muted/50 border-r px-4 py-3 text-left text-sm font-semibold text-muted-foreground w-16">
                              #
                            </th>
                            {preview.headers.map((header, index) => (
                              <th key={index} className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground min-w-[120px]">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {displayRows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-muted/30 transition-colors">
                              <td className="sticky left-0 bg-background border-r px-4 py-3 text-sm font-medium text-muted-foreground">
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
                                    className={`px-4 py-3 text-sm ${
                                      hasError 
                                        ? 'bg-red-50 text-red-700 font-medium' 
                                        : 'text-foreground'
                                    }`}
                                  >
                                    <div className="max-w-[200px] truncate" title={String(value || '')}>
                                      {String(value || '-')}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent value="headers" className="space-y-4 m-0">
                <h4 className="font-semibold text-lg">Columnas Detectadas</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {preview.headers.map((header, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 rounded-lg border bg-card">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span className="text-sm font-medium truncate">{header}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="errors" className="space-y-4 m-0">
                <h4 className="font-semibold text-lg">
                  Errores y Advertencias ({validationErrors.length})
                </h4>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {validationErrors.map((error, index) => (
                      <AlertDialog key={index}>
                        <AlertDialogContent>
                          <AlertDialogCancel>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDialogDescription>
                          <span className="font-semibold">Fila {error.row}</span>
                          {error.field && <span className="text-muted-foreground"> • {error.field}</span>}
                          <br />
                          <span className="text-sm">{error.message}</span>
                          </AlertDialogDescription>
                        </AlertDialogCancel>
                      </AlertDialogContent>
                    </AlertDialog>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Mensajes de validación mejorados */}
      <div className="mt-6 space-y-4">
        {hasErrors && (
          <AlertDialog>
            <AlertDialogContent>
              <AlertDialogCancel>
                <XCircle className="h-4 w-4" />
                <AlertDialogDescription>
              <strong>Se encontraron {errorCount} errores críticos.</strong><br />
              Estos errores deben corregirse antes de continuar con la importación.
              </AlertDialogDescription>
            </AlertDialogCancel>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {hasWarnings && !hasErrors && (
          <AlertDialog>
            <AlertTriangle className="h-4 w-4" />
            <AlertDialogDescription>
              <strong>Se encontraron {warningCount} advertencias.</strong><br />
              Puedes continuar con la importación, pero recomendamos revisar estos datos.
            </AlertDialogDescription>
          </AlertDialog>
        )}

        {!hasErrors && !hasWarnings && (
          <AlertDialog>
            <AlertDialogContent>
              <AlertDialogCancel>
                <CheckCircle className="h-4 w-4" />
                <AlertDialogDescription>
              <strong>¡Validación completada exitosamente!</strong><br />
              Todos los datos son válidos y están listos para importar.
                </AlertDialogDescription>
              </AlertDialogCancel>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Botones de acción mejorados */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button
          onClick={onCancel}
          variant="outline"
          disabled={isImporting}
          className="sm:flex-1"
        >
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          disabled={hasErrors || isImporting}
          className="sm:flex-1"
        >
          {isImporting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              Importando...
            </>
          ) : (
            `Confirmar Importación (${validRows} filas válidas)`
          )}
        </Button>
      </div>
    </div>
  );
} 