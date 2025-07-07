// Tipos para importación/exportación de archivos
export interface ImportOptions {
  fileType: 'auto' | 'csv' | 'excel';
  delimiter?: ',' | ';' | '\t' | '|';
  encoding?: 'utf-8' | 'latin1' | 'iso-8859-1';
  hasHeader: boolean;
  skipEmptyLines?: boolean;
  trimFields?: boolean;
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'both';
  compression?: 'zip';
  sheets?: string[];
  delimiter?: string;
  includeHeaders?: boolean;
  filename?: string;
}

export interface ImportPreview {
  fileName: string;
  totalRows: number;
  headers: string[];
  preview: Record<string, any>[];
  detectedFormat: 'csv' | 'excel';
  encoding?: string;
  delimiter?: string;
  errors?: ImportError[];
}

export interface ImportError {
  row: number;
  column?: string;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  errors: ImportError[];
  warnings?: ImportError[];
  skippedRows?: number[];
}

export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
}

// Tipos para templates de importación
export interface ImportTemplate {
  id: string;
  name: string;
  description: string;
  fields: TemplateField[];
  fileType: 'csv' | 'excel';
  sampleData?: Record<string, any>[];
}

export interface TemplateField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'email' | 'url';
  required: boolean;
  validation?: FieldValidation;
  mapping?: string; // Para mapear con campos de la DB
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  allowedValues?: string[];
}

// Tipos para exportación de dashboard
export interface DashboardExportData {
  products?: ProductExportData[];
  orders?: OrderExportData[];
  users?: UserExportData[];
  analytics?: AnalyticsExportData[];
}

export interface ProductExportData {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  brand?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderExportData {
  id: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  items: number;
  createdAt: string;
  shippingAddress?: string;
}

export interface UserExportData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
}

export interface AnalyticsExportData {
  date: string;
  sales: number;
  orders: number;
  customers: number;
  revenue: number;
  topProducts?: string[];
}

// Tipos para configuración por cliente/instancia
export interface ClientImportConfig {
  allowedFormats: ('csv' | 'excel')[];
  maxFileSize: number; // en MB
  maxRows: number;
  requiredFields: string[];
  customFields?: TemplateField[];
  validationRules?: Record<string, FieldValidation>;
} 