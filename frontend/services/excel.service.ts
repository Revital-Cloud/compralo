import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { 
  ImportOptions, 
  ExportOptions, 
  ImportPreview, 
  ImportResult,
  DashboardExportData,
  ImportError,
  FileUploadProgress
} from '@/types/data';

class ExcelService {
  /**
   * Detecta automáticamente el formato del archivo
   */
  detectFileFormat(file: File): 'csv' | 'excel' | 'unknown' {
    const extension = file.name.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'csv':
        return 'csv';
      case 'xlsx':
      case 'xls':
        return 'excel';
      default:
        return 'unknown';
    }
  }

  /**
   * Lee y procesa archivo Excel
   */
  async readExcelFile(file: File, options: ImportOptions): Promise<ImportPreview> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = e.target?.result as ArrayBuffer;
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(data);

          const worksheet = workbook.worksheets[0];
          const headers = options.hasHeader ? (worksheet.getRow(1).values as string[]).slice(1) : [];
          
          const jsonData: Record<string, any>[] = [];
          const startRow = options.hasHeader ? 2 : 1;

          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber >= startRow) {
              const rowData: Record<string, any> = {};
              const values = row.values as any[];
              if (options.hasHeader) {
                headers.forEach((header, index) => {
                  rowData[header] = values[index + 1] ?? '';
                });
              } else {
                values.slice(1).forEach((value, index) => {
                  rowData[`column_${index + 1}`] = value ?? '';
                });
              }
              jsonData.push(rowData);
            }
          });
          
          const preview = jsonData.slice(0, 5);

          const result: ImportPreview = {
            fileName: file.name,
            totalRows: worksheet.rowCount - (options.hasHeader ? 1 : 0),
            headers,
            preview,
            detectedFormat: 'excel'
          };

          resolve(result);
        } catch (error) {
          reject(new Error(`Error al leer archivo Excel: ${error}`));
        }
      };

      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Lee y procesa archivo CSV
   */
  async readCSVFile(file: File, options: ImportOptions): Promise<ImportPreview> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: options.hasHeader,
        delimiter: options.delimiter || 'auto',
        skipEmptyLines: options.skipEmptyLines ?? true,
        encoding: options.encoding || 'utf-8',
        preview: 1000, // Limitar preview para archivos grandes
        complete: (results) => {
          try {
            const data = results.data as Record<string, any>[];
            const headers = options.hasHeader 
              ? Object.keys(data[0] || {})
              : results.meta.fields || [];
            
            const preview = data.slice(0, 5);
            
            const importPreview: ImportPreview = {
              fileName: file.name,
              totalRows: data.length,
              headers,
              preview,
              detectedFormat: 'csv',
              delimiter: results.meta.delimiter,
              errors: results.errors.map(error => ({
                row: error.row || 0,
                message: error.message,
                severity: 'error' as const
              }))
            };

            resolve(importPreview);
          } catch (error) {
            reject(new Error(`Error al procesar CSV: ${error}`));
          }
        },
        error: (error) => {
          reject(new Error(`Error al leer CSV: ${error.message}`));
        }
      });
    });
  }

  /**
   * Procesa archivo (auto-detecta formato)
   */
  async processFile(file: File, options: ImportOptions): Promise<ImportPreview> {
    // Validar tamaño del archivo
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new Error('El archivo es demasiado grande. Máximo 50MB permitido.');
    }

    const detectedFormat = this.detectFileFormat(file);
    
    if (detectedFormat === 'unknown') {
      throw new Error('Formato de archivo no soportado. Use CSV o Excel (.xlsx, .xls)');
    }

    const finalOptions = {
      ...options,
      fileType: options.fileType === 'auto' ? detectedFormat : options.fileType
    };

    if (finalOptions.fileType === 'csv') {
      return this.readCSVFile(file, finalOptions);
    } else {
      return this.readExcelFile(file, finalOptions);
    }
  }

  /**
   * Exporta datos a Excel
   */
  async exportToExcel(
    data: DashboardExportData,
    options: ExportOptions = { format: 'excel' }
  ): Promise<void> {
    try {
      const workbook = new ExcelJS.Workbook();

      const processSheet = (sheetName: string, sheetData: any[] | undefined) => {
        if (sheetData && sheetData.length > 0) {
          const worksheet = workbook.addWorksheet(sheetName);
          const headers = Object.keys(sheetData[0]);
          worksheet.columns = headers.map(header => ({ header, key: header, width: 20 }));
          worksheet.addRows(sheetData);
        }
      };
      
      processSheet('Productos', data.products);
      processSheet('Pedidos', data.orders);
      processSheet('Usuarios', data.users);
      processSheet('Analytics', data.analytics);

      // Generar archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const fileName = options.filename || `dashboard_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(blob, fileName);

    } catch (error) {
      throw new Error(`Error al exportar Excel: ${error}`);
    }
  }

  /**
   * Exporta datos a CSV
   */
  exportToCSV(
    data: Record<string, any>[], 
    fileName: string = 'export.csv',
    options: ExportOptions = { format: 'csv' }
  ): void {
    try {
      const csv = Papa.unparse(data, {
        delimiter: options.delimiter || ',',
        header: options.includeHeaders ?? true,
        skipEmptyLines: true
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, fileName);

    } catch (error) {
      throw new Error(`Error al exportar CSV: ${error}`);
    }
  }

  /**
   * Descarga template de importación
   */
  async downloadTemplate(format: 'csv' | 'excel', templateType: 'products' | 'users' = 'products'): Promise<void> {
    const templates = {
      products: {
        headers: ['nombre', 'precio', 'stock', 'categoria', 'marca', 'descripcion'],
        sampleData: [
          {
            nombre: 'Ejemplo Producto 1',
            precio: 29.99,
            stock: 100,
            categoria: 'Electrónicos',
            marca: 'Ejemplo',
            descripcion: 'Descripción del producto'
          },
          {
            nombre: 'Ejemplo Producto 2',
            precio: 49.99,
            stock: 50,
            categoria: 'Ropa',
            marca: 'Otra Marca',
            descripcion: 'Otra descripción'
          }
        ]
      },
      users: {
        headers: ['nombre', 'email', 'telefono', 'rol'],
        sampleData: [
          {
            nombre: 'Juan Pérez',
            email: 'juan@ejemplo.com',
            telefono: '+1234567890',
            rol: 'cliente'
          }
        ]
      }
    };

    const template = templates[templateType];
    const fileName = `template_${templateType}_${format}`;

    if (format === 'excel') {
      await this.exportToExcel(
        { [templateType]: template.sampleData },
        { format: 'excel', filename: `${fileName}.xlsx` }
      );
    } else {
      this.exportToCSV(template.sampleData, `${fileName}.csv`);
    }
  }

  /**
   * Valida datos antes de importar
   */
  validateImportData(data: Record<string, any>[], requiredFields: string[]): ImportError[] {
    const errors: ImportError[] = [];

    data.forEach((row, index) => {
      requiredFields.forEach(field => {
        if (!row[field] || row[field].toString().trim() === '') {
          errors.push({
            row: index + 1,
            field,
            message: `Campo requerido '${field}' está vacío`,
            severity: 'error'
          });
        }
      });

      // Validaciones específicas
      if (row.precio && isNaN(Number(row.precio))) {
        errors.push({
          row: index + 1,
          field: 'precio',
          message: 'El precio debe ser un número válido',
          severity: 'error'
        });
      }

      if (row.stock && isNaN(Number(row.stock))) {
        errors.push({
          row: index + 1,
          field: 'stock',
          message: 'El stock debe ser un número válido',
          severity: 'error'
        });
      }

      if (row.email && !this.isValidEmail(row.email)) {
        errors.push({
          row: index + 1,
          field: 'email',
          message: 'Email no tiene formato válido',
          severity: 'warning'
        });
      }
    });

    return errors;
  }

  /**
   * Valida formato de email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Simula progreso de upload (para uso con progress bars)
   */
  simulateUploadProgress(
    onProgress: (progress: FileUploadProgress) => void,
    duration: number = 3000
  ): Promise<void> {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = 50; // ms
      const increment = 100 / (duration / interval);

      const timer = setInterval(() => {
        progress += increment;
        
        if (progress >= 100) {
          clearInterval(timer);
          onProgress({
            loaded: 100,
            total: 100,
            percentage: 100,
            status: 'complete'
          });
          resolve();
        } else {
          onProgress({
            loaded: progress,
            total: 100,
            percentage: Math.round(progress),
            status: progress < 90 ? 'uploading' : 'processing'
          });
        }
      }, interval);
    });
  }
}

export const excelService = new ExcelService(); 