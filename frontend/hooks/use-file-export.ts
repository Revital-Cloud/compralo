import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { excelService } from '@/services/excel.service';
import { 
  ExportOptions, 
  DashboardExportData,
  ProductExportData,
  OrderExportData,
  UserExportData,
  AnalyticsExportData
} from '@/types/data';

interface UseFileExportOptions {
  onSuccess?: (filename: string) => void;
  onError?: (error: string) => void;
}

interface ExportFilters {
  dateRange?: {
    from: Date;
    to: Date;
  };
  status?: string[];
  categories?: string[];
  limit?: number;
}

export const useFileExport = (options: UseFileExportOptions = {}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<number>(0);

  /**
   * Mutation para obtener datos del backend y exportar
   */
  const exportMutation = useMutation({
    mutationFn: async (data: {
      dataTypes: ('products' | 'orders' | 'users' | 'analytics')[];
      format: 'csv' | 'excel' | 'both';
      filters?: ExportFilters;
      filename?: string;
    }) => {
      setIsExporting(true);
      setExportProgress(0);

      try {
        // Simular progreso
        const updateProgress = (progress: number) => {
          setExportProgress(progress);
        };

        updateProgress(10);

        // Aquí iría la llamada real al API
        // Por ahora simulo los datos
        const exportData: DashboardExportData = {};

        if (data.dataTypes.includes('products')) {
          updateProgress(30);
          // Simular datos de productos
          exportData.products = [];
        }

        if (data.dataTypes.includes('orders')) {
          updateProgress(50);
          // Simular datos de pedidos
          exportData.orders = [];
        }

        if (data.dataTypes.includes('users')) {
          updateProgress(70);
          // Simular datos de usuarios
          exportData.users = [];
        }

        if (data.dataTypes.includes('analytics')) {
          updateProgress(80);
          // Simular datos de analytics
          exportData.analytics = [];
        }

        updateProgress(90);

        // Exportar según el formato
        const exportOptions: ExportOptions = {
          format: data.format,
          filename: data.filename,
          includeHeaders: true
        };

        if (data.format === 'excel' || data.format === 'both') {
          await excelService.exportToExcel(exportData, exportOptions);
        }

        if (data.format === 'csv') {
          // Para CSV, exportar cada tipo de dato como archivo separado
          if (exportData.products) {
            excelService.exportToCSV(
              exportData.products, 
              `productos_${new Date().toISOString().split('T')[0]}.csv`
            );
          }
          if (exportData.orders) {
            excelService.exportToCSV(
              exportData.orders, 
              `pedidos_${new Date().toISOString().split('T')[0]}.csv`
            );
          }
          if (exportData.users) {
            excelService.exportToCSV(
              exportData.users, 
              `usuarios_${new Date().toISOString().split('T')[0]}.csv`
            );
          }
          if (exportData.analytics) {
            excelService.exportToCSV(
              exportData.analytics, 
              `analytics_${new Date().toISOString().split('T')[0]}.csv`
            );
          }
        }

        if (data.format === 'both') {
          // También exportar CSVs individuales
          Object.keys(exportData).forEach(key => {
            const dataArray = exportData[key as keyof DashboardExportData];
            if (dataArray) {
              excelService.exportToCSV(
                dataArray, 
                `${key}_${new Date().toISOString().split('T')[0]}.csv`
              );
            }
          });
        }

        updateProgress(100);
        
        const filename = data.filename || `export_${new Date().toISOString().split('T')[0]}`;
        return { filename, dataCount: calculateDataCount(exportData) };

      } finally {
        setIsExporting(false);
        setExportProgress(0);
      }
    },
    onSuccess: (result) => {
      toast.success(`Exportación completada: ${result.dataCount} registros exportados`);
      options.onSuccess?.(result.filename);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Error en la exportación';
      toast.error(errorMessage);
      options.onError?.(errorMessage);
      setIsExporting(false);
      setExportProgress(0);
    }
  });

  /**
   * Exporta productos
   */
  const exportProducts = useCallback((
    format: 'csv' | 'excel' = 'excel',
    filters?: ExportFilters
  ) => {
    exportMutation.mutate({
      dataTypes: ['products'],
      format,
      filters,
      filename: `productos_${new Date().toISOString().split('T')[0]}`
    });
  }, [exportMutation]);

  /**
   * Exporta pedidos
   */
  const exportOrders = useCallback((
    format: 'csv' | 'excel' = 'excel',
    filters?: ExportFilters
  ) => {
    exportMutation.mutate({
      dataTypes: ['orders'],
      format,
      filters,
      filename: `pedidos_${new Date().toISOString().split('T')[0]}`
    });
  }, [exportMutation]);

  /**
   * Exporta usuarios
   */
  const exportUsers = useCallback((
    format: 'csv' | 'excel' = 'excel',
    filters?: ExportFilters
  ) => {
    exportMutation.mutate({
      dataTypes: ['users'],
      format,
      filters,
      filename: `usuarios_${new Date().toISOString().split('T')[0]}`
    });
  }, [exportMutation]);

  /**
   * Exporta datos del dashboard completo
   */
  const exportDashboard = useCallback((
    format: 'csv' | 'excel' | 'both' = 'excel',
    filters?: ExportFilters
  ) => {
    exportMutation.mutate({
      dataTypes: ['products', 'orders', 'users', 'analytics'],
      format,
      filters,
      filename: `dashboard_completo_${new Date().toISOString().split('T')[0]}`
    });
  }, [exportMutation]);

  /**
   * Exporta datos personalizados
   */
  const exportCustomData = useCallback((
    dataTypes: ('products' | 'orders' | 'users' | 'analytics')[],
    format: 'csv' | 'excel' | 'both' = 'excel',
    filters?: ExportFilters,
    filename?: string
  ) => {
    exportMutation.mutate({
      dataTypes,
      format,
      filters,
      filename
    });
  }, [exportMutation]);

  return {
    // Estado
    isExporting,
    exportProgress,

    // Acciones específicas
    exportProducts,
    exportOrders,
    exportUsers,
    exportDashboard,
    exportCustomData,

    // Métodos del servicio expuestos
    downloadTemplate: excelService.downloadTemplate
  };
};

function calculateDataCount(data: DashboardExportData): number {
  let count = 0;
  if (data.products) count += data.products.length;
  if (data.orders) count += data.orders.length;
  if (data.users) count += data.users.length;
  if (data.analytics) count += data.analytics.length;
  return count;
} 