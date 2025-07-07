'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Package, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InlineProgressBar } from './progress-bar';
import { useFileExport } from '@/hooks/use-file-export';

interface ExportDialogProps {
  children: React.ReactNode;
  defaultDataTypes?: ('products' | 'orders' | 'users' | 'analytics')[];
  onExportComplete?: (filename: string) => void;
}

export function ExportDialog({ 
  children, 
  defaultDataTypes = ['products'],
  onExportComplete 
}: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<'csv' | 'excel' | 'both'>('excel');
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>(defaultDataTypes);
  const [customFilename, setCustomFilename] = useState('');
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });
  const [filters, setFilters] = useState({
    status: [] as string[],
    categories: [] as string[],
    limit: 1000
  });

  const { isExporting, exportProgress, exportCustomData } = useFileExport({
    onSuccess: (filename) => {
      onExportComplete?.(filename);
      setOpen(false);
    }
  });

  const dataTypeOptions = [
    {
      id: 'products',
      label: 'Productos',
      description: 'Lista completa de productos con precios, stock y categorías',
      icon: Package,
      color: 'text-blue-500'
    },
    {
      id: 'orders',
      label: 'Pedidos',
      description: 'Historial de pedidos con detalles de clientes y ventas',
      icon: FileSpreadsheet,
      color: 'text-green-500'
    },
    {
      id: 'users',
      label: 'Usuarios',
      description: 'Base de datos de usuarios y clientes registrados',
      icon: FileText,
      color: 'text-purple-500'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      description: 'Métricas y estadísticas de rendimiento del negocio',
      icon: Calendar,
      color: 'text-orange-500'
    }
  ];

  const statusOptions = ['Pendiente', 'En proceso', 'Completado', 'Cancelado'];
  const categoryOptions = ['Electrónicos', 'Ropa', 'Hogar', 'Deportes', 'Libros'];

  const handleDataTypeToggle = (dataType: string, checked: boolean) => {
    if (checked) {
      setSelectedDataTypes(prev => [...prev, dataType]);
    } else {
      setSelectedDataTypes(prev => prev.filter(type => type !== dataType));
    }
  };

  const handleExport = () => {
    const exportFilters = {
      dateRange: dateRange.from && dateRange.to ? {
        from: new Date(dateRange.from),
        to: new Date(dateRange.to)
      } : undefined,
      status: filters.status,
      categories: filters.categories,
      limit: filters.limit
    };

    exportCustomData(
      selectedDataTypes as ('products' | 'orders' | 'users' | 'analytics')[],
      format,
      exportFilters,
      customFilename || undefined
    );
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv':
        return <FileText className="h-4 w-4" />;
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'both':
        return <Package className="h-4 w-4" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  const getEstimatedSize = () => {
    const baseSize = selectedDataTypes.length * 0.5; // MB base por tipo de dato
    return `~${baseSize.toFixed(1)}MB`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Datos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progreso si está exportando */}
          {isExporting && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Exportando datos...</span>
                    <span className="text-sm text-gray-500">{exportProgress}%</span>
                  </div>
                  <InlineProgressBar progress={exportProgress} />
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="data" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="data">Datos</TabsTrigger>
              <TabsTrigger value="format">Formato</TabsTrigger>
              <TabsTrigger value="filters">Filtros</TabsTrigger>
            </TabsList>

            <TabsContent value="data" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Seleccionar Datos a Exportar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dataTypeOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedDataTypes.includes(option.id);
                    
                    return (
                      <Card 
                        key={option.id}
                        className={`cursor-pointer transition-all ${
                          isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleDataTypeToggle(option.id, !isSelected)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              checked={isSelected}
                              onChange={() => {}}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Icon className={`h-4 w-4 ${option.color}`} />
                                <h4 className="font-medium">{option.label}</h4>
                              </div>
                              <p className="text-sm text-gray-600">{option.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="format" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Formato de Exportación</h3>
                <RadioGroup value={format} onValueChange={(value) => setFormat(value as 'csv' | 'excel' | 'both')}>
                  <div className="space-y-3">
                    <Card className={`cursor-pointer transition-all ${format === 'excel' ? 'ring-2 ring-primary' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="excel" id="excel" />
                          <Label htmlFor="excel" className="flex items-center gap-2 cursor-pointer flex-1">
                            <FileSpreadsheet className="h-4 w-4 text-green-600" />
                            <div>
                              <div className="font-medium">Excel (.xlsx)</div>
                              <div className="text-sm text-gray-600">
                                Múltiples hojas, formato y estilo. Ideal para análisis.
                              </div>
                            </div>
                          </Label>
                          <Badge variant="secondary">Recomendado</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className={`cursor-pointer transition-all ${format === 'csv' ? 'ring-2 ring-primary' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="csv" id="csv" />
                          <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer flex-1">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <div>
                              <div className="font-medium">CSV</div>
                              <div className="text-sm text-gray-600">
                                Archivos separados por comas. Compatible con cualquier sistema.
                              </div>
                            </div>
                          </Label>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className={`cursor-pointer transition-all ${format === 'both' ? 'ring-2 ring-primary' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="both" id="both" />
                          <Label htmlFor="both" className="flex items-center gap-2 cursor-pointer flex-1">
                            <Package className="h-4 w-4 text-purple-600" />
                            <div>
                              <div className="font-medium">Ambos Formatos</div>
                              <div className="text-sm text-gray-600">
                                Excel + archivos CSV individuales en ZIP.
                              </div>
                            </div>
                          </Label>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </RadioGroup>

                <Separator />

                <div className="space-y-3">
                  <Label htmlFor="filename">Nombre del archivo (opcional)</Label>
                  <Input
                    id="filename"
                    placeholder="mi_exportacion"
                    value={customFilename}
                    onChange={(e) => setCustomFilename(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Si no especificas un nombre, se generará automáticamente con la fecha.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="filters" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Filtros Avanzados</h3>
                
                <div className="space-y-4">
                  {/* Rango de fechas */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Rango de Fechas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="date-from">Desde</Label>
                          <Input
                            id="date-from"
                            type="date"
                            value={dateRange.from}
                            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="date-to">Hasta</Label>
                          <Input
                            id="date-to"
                            type="date"
                            value={dateRange.to}
                            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Filtros por estado */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Estados de Pedidos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        {statusOptions.map((status) => (
                          <div key={status} className="flex items-center space-x-2">
                            <Checkbox
                              id={`status-${status}`}
                              checked={filters.status.includes(status)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFilters(prev => ({
                                    ...prev,
                                    status: [...prev.status, status]
                                  }));
                                } else {
                                  setFilters(prev => ({
                                    ...prev,
                                    status: prev.status.filter(s => s !== status)
                                  }));
                                }
                              }}
                            />
                            <Label htmlFor={`status-${status}`} className="text-sm">
                              {status}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Límite de registros */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Límite de Registros</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select 
                        value={filters.limit.toString()} 
                        onValueChange={(value) => setFilters(prev => ({ ...prev, limit: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="100">100 registros</SelectItem>
                          <SelectItem value="500">500 registros</SelectItem>
                          <SelectItem value="1000">1,000 registros</SelectItem>
                          <SelectItem value="5000">5,000 registros</SelectItem>
                          <SelectItem value="0">Sin límite</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          {/* Resumen y botones */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="text-sm">
                <span className="font-medium">{selectedDataTypes.length} tipo(s) de datos</span>
                <span className="text-gray-500"> • </span>
                <span className="font-medium">Formato {format.toUpperCase()}</span>
                <span className="text-gray-500"> • </span>
                <span className="text-gray-500">Tamaño estimado: {getEstimatedSize()}</span>
              </div>
              <div className="flex items-center gap-2">
                {getFormatIcon(format)}
                <Badge variant="outline">
                  {selectedDataTypes.length} dataset{selectedDataTypes.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isExporting}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleExport}
                disabled={selectedDataTypes.length === 0 || isExporting}
                className="flex-1"
              >
                {isExporting ? 'Exportando...' : `Exportar ${selectedDataTypes.length} Dataset${selectedDataTypes.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 