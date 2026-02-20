'use client';

import React from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productFormSchema, type ProductFormData } from '@/schemas/admin/product.schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { Input } from "@/components/ui";
import { Label } from "@/components/ui";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Textarea } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui";
import { Checkbox } from "@/components/ui";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui";
import { ColorPicker } from "@/components/admin/color-picker";
import { IconX, IconPlus, IconSettings, IconInfoCircle, IconChevronDown } from "@tabler/icons-react";
import { useCategoriesRaw } from "@/hooks/use-categories";
import { useBrands } from "@/hooks/use-products";
import { useAllProviders } from "@/hooks/use-providers";
import { useFormXSSValidation } from "@/hooks/use-xss-validation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Valor usado para "no seleccionado" en Select (Radix no permite value="" en SelectItem)
const SELECT_EMPTY_VALUE = '__empty__';
const COLOR_OTHER_VALUE = '__color_otro__';
const MATERIAL_OTHER_VALUE = '__material_otro__';

const DESC_CORTA_MAX_LENGTH = 500;

const COLOR_OPTIONS = [
  'Negro', 'Blanco', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Naranja', 'Rosa', 'Morado', 'Gris',
  'Marrón', 'Beige', 'Celeste', 'Turquesa', 'Dorado', 'Plateado', 'Multicolor',
];

const MATERIAL_OPTIONS = [
  'Algodón', 'Poliéster', 'Cuero', 'Sintético', 'Metal', 'Plástico', 'Madera', 'Vidrio',
  'Cerámica', 'Silicona', 'Tela', 'Nylon', 'Lana', 'Lino', 'EVA', 'Goma', 'Cartón', 'Papel',
];

const GARANTIA_UNIDADES = [
  { value: 'días', label: 'Días' },
  { value: 'semanas', label: 'Semanas' },
  { value: 'meses', label: 'Meses' },
  { value: 'años', label: 'Años' },
];

const PESO_UNIDADES = [
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
  { value: 'lb', label: 'lb' },
  { value: 'oz', label: 'oz' },
];

const COLOR_HEX: Record<string, string> = {
  Negro: '#000000',
  Blanco: '#ffffff',
  Rojo: '#dc2626',
  Azul: '#2563eb',
  Verde: '#16a34a',
  Amarillo: '#eab308',
  Naranja: '#ea580c',
  Rosa: '#ec4899',
  Morado: '#9333ea',
  Gris: '#6b7280',
  Marrón: '#78350f',
  Beige: '#d4b896',
  Celeste: '#0ea5e9',
  Turquesa: '#0d9488',
  Dorado: '#ca8a04',
  Plateado: '#94a3b8',
  Multicolor: 'linear-gradient(90deg, #ef4444, #eab308, #22c55e, #3b82f6)',
};

const COMMON_SPEC_KEYS = [
  'Talla', 'Color', 'Material', 'Peso', 'Dimensiones', 'Garantía', 'Modelo', 'Marca',
  'Origen', 'Contenido', 'Caducidad', 'Lote', 'SKU', 'UPC', 'Certificación',
];

// Presets de especificaciones por tipo de producto
const SPEC_PRESETS = {
  ropa: {
    label: 'Ropa',
    fields: [
      { key: 'talla', label: 'Talla', placeholder: 'Ej. M, L, XL', required: true },
      { key: 'genero', label: 'Género', placeholder: 'Ej. Hombre, Mujer, Unisex' },
      { key: 'composicion', label: 'Composición', placeholder: 'Ej. 100% Algodón' },
      { key: 'cuidados', label: 'Cuidados', placeholder: 'Ej. Lavar a máquina' },
      { key: 'tipo_prenda', label: 'Tipo de Prenda', placeholder: 'Ej. Camiseta, Pantalón' },
      { key: 'fit', label: 'Ajuste', placeholder: 'Ej. Regular, Slim, Oversized' }
    ]
  },
  calzado: {
    label: 'Calzado',
    fields: [
      { key: 'talla_calzado', label: 'Talla', placeholder: 'Ej. 42, 8.5 US', required: true },
      { key: 'genero', label: 'Género', placeholder: 'Ej. Hombre, Mujer, Unisex' },
      { key: 'horma', label: 'Horma', placeholder: 'Ej. Regular, Ancha, Estrecha' },
      { key: 'material_capellada', label: 'Material Capellada', placeholder: 'Ej. Cuero, Sintético' },
      { key: 'material_suela', label: 'Material Suela', placeholder: 'Ej. Goma, EVA' },
      { key: 'tipo_calzado', label: 'Tipo', placeholder: 'Ej. Deportivo, Casual, Formal' }
    ]
  },
  consumo: {
    label: 'Alimentos/Bebidas',
    fields: [
      { key: 'contenido_neto', label: 'Contenido Neto', placeholder: 'Ej. 500ml, 1kg', required: true },
      { key: 'unidad_medida', label: 'Unidad de Medida', placeholder: 'Ej. ml, gr, unidades' },
      { key: 'sabores', label: 'Sabores', placeholder: 'Ej. Fresa, Vainilla, Chocolate' },
      { key: 'fecha_vencimiento', label: 'Fecha Vencimiento', placeholder: 'Ej. 12 meses' },
      { key: 'ingredientes', label: 'Ingredientes', placeholder: 'Lista de ingredientes' },
      { key: 'info_nutricional', label: 'Info Nutricional', placeholder: 'Calorías, proteínas, etc.' }
    ]
  },
  belleza: {
    label: 'Belleza/Cosméticos',
    fields: [
      { key: 'tipo_piel', label: 'Tipo de Piel', placeholder: 'Ej. Seca, Mixta, Grasa', required: true },
      { key: 'libre_de', label: 'Libre de', placeholder: 'Ej. Parabenos, Sulfatos' },
      { key: 'contenido_neto', label: 'Contenido Neto', placeholder: 'Ej. 30ml, 50g' },
      { key: 'instrucciones', label: 'Instrucciones', placeholder: 'Modo de uso' },
      { key: 'beneficios', label: 'Beneficios', placeholder: 'Ej. Hidratante, Antienvejecimiento' },
      { key: 'textura', label: 'Textura', placeholder: 'Ej. Crema, Gel, Serum' }
    ]
  },
  hogar: {
    label: 'Hogar/Decoración',
    fields: [
      { key: 'dimensiones_detalle', label: 'Dimensiones Detalladas', placeholder: 'Ej. 100x50x30 cm', required: true },
      { key: 'material_principal', label: 'Material Principal', placeholder: 'Ej. Madera, Metal, Vidrio' },
      { key: 'uso_recomendado', label: 'Uso Recomendado', placeholder: 'Ej. Interior, Exterior' },
      { key: 'color_disponible', label: 'Colores Disponibles', placeholder: 'Ej. Blanco, Negro, Madera' },
      { key: 'estilo', label: 'Estilo', placeholder: 'Ej. Moderno, Clásico, Rústico' },
      { key: 'instalacion', label: 'Instalación', placeholder: 'Ej. Fácil, Requiere profesional' }
    ]
  },
  tecnologia: {
    label: 'Tecnología',
    fields: [
      { key: 'modelo', label: 'Modelo', placeholder: 'Ej. iPhone 15 Pro', required: true },
      { key: 'capacidad', label: 'Capacidad', placeholder: 'Ej. 128GB, 256GB' },
      { key: 'conectividad', label: 'Conectividad', placeholder: 'Ej. WiFi 6, Bluetooth 5.0' },
      { key: 'bateria', label: 'Batería', placeholder: 'Ej. 4000mAh, 8 horas' },
      { key: 'sistema_operativo', label: 'Sistema Operativo', placeholder: 'Ej. iOS 17, Android 14' },
      { key: 'accesorios_incluidos', label: 'Accesorios Incluidos', placeholder: 'Cargador, auriculares' }
    ]
  }
};

// Función para determinar el preset basado en categoría
const getPresetByCategory = (categoryName: string) => {
  const categoryLower = categoryName.toLowerCase();
  
  if (categoryLower.includes('ropa') || categoryLower.includes('vestimenta') || categoryLower.includes('textil')) {
    return 'ropa';
  }
  if (categoryLower.includes('calzado') || categoryLower.includes('zapatos') || categoryLower.includes('zapatillas')) {
    return 'calzado';
  }
  if (categoryLower.includes('alimento') || categoryLower.includes('bebida') || categoryLower.includes('comida') || categoryLower.includes('consumo')) {
    return 'consumo';
  }
  if (categoryLower.includes('belleza') || categoryLower.includes('cosmético') || categoryLower.includes('maquillaje') || categoryLower.includes('cuidado')) {
    return 'belleza';
  }
  if (categoryLower.includes('hogar') || categoryLower.includes('decoración') || categoryLower.includes('mueble') || categoryLower.includes('casa')) {
    return 'hogar';
  }
  if (categoryLower.includes('tecnología') || categoryLower.includes('electrónico') || categoryLower.includes('smartphone') || categoryLower.includes('computador')) {
    return 'tecnologia';
  }
  
  return null; // Sin preset específico
};

export interface ProductFormRef {
  reset: () => void;
}

interface ProductFormProps {
  onSubmit: (data: ProductFormData) => void;
  isLoading?: boolean;
  initialData?: Partial<ProductFormData>;
  submitLabel?: string;
  isEditing?: boolean;
  /** Si true, no se muestran los botones LIMPIAR/Guardar (se renderizan fuera para ponerlos al final en responsive) */
  hideActionButtons?: boolean;
  /** id del form para asociar botón submit externo (form="...") */
  formId?: string;
}

export const ProductForm = React.forwardRef<ProductFormRef, ProductFormProps>(function ProductForm(props, ref) {
  const {
    onSubmit,
    isLoading = false,
    initialData,
    submitLabel = 'CREAR PRODUCTO',
    isEditing = false,
    hideActionButtons = false,
    formId = 'product-form',
  } = props;

  const { data: categories = [] } = useCategoriesRaw();
  const { data: brands = [] } = useBrands();
  const { data: providers = [] } = useAllProviders();
  
  // Hook de validación XSS
  const { validateForm } = useFormXSSValidation('product-form');

  const resolver = React.useMemo(
    () => zodResolver(productFormSchema) as Resolver<ProductFormData>,
    []
  );

  const defaultValues: ProductFormData = {
    nom_producto: initialData?.nom_producto ?? '',
    des_producto: initialData?.des_producto ?? '',
    val_precio: initialData?.val_precio ?? '',
    num_stock: initialData?.num_stock ?? '',
    id_categoria: initialData?.id_categoria ?? (initialData as { category_id?: string })?.category_id ?? '',
    id_marca: initialData?.id_marca ?? '',
    id_proveedor: initialData?.id_proveedor ?? '',
    tags: initialData?.tags ?? [],
    spcf_producto: (initialData?.spcf_producto ?? {}) as Record<string, unknown>,
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    setValue,
    watch,
    reset,
  } = useForm<ProductFormData>({
    resolver,
    defaultValues,
  });

  React.useImperativeHandle(ref, () => ({ reset }), [reset]);

  React.useEffect(() => {
    if (initialData) {
      const descripcionCorta =
        String(initialData.spcf_producto?.descripcion_corta ?? initialData.des_producto ?? '').trim() || '';
      reset({
        nom_producto: initialData.nom_producto ?? '',
        des_producto: descripcionCorta,
        val_precio: initialData.val_precio ?? '',
        num_stock: initialData.num_stock ?? '',
        id_categoria: initialData.id_categoria ?? (initialData as { category_id?: string }).category_id ?? '',
        id_marca: initialData.id_marca ?? '',
        id_proveedor: initialData.id_proveedor ?? '',
        tags: initialData.tags ?? [],
        spcf_producto: (initialData.spcf_producto ?? {}) as Record<string, unknown>,
      });
      // Formatear precio inicial con separadores de miles
      if (initialData.val_precio) {
        const formatted = formatCurrency(String(initialData.val_precio));
        setValue('val_precio', formatted);
      }
    }
  }, [initialData, reset]);

  const watchedTags = watch('tags');
  const watchedCategory = watch('id_categoria');
  const [newTag, setNewTag] = React.useState('');
  const [customSpecs, setCustomSpecs] = React.useState<Array<{key: string, value: string}>>([]);
  const [newCustomKey, setNewCustomKey] = React.useState('');
  const [newCustomValue, setNewCustomValue] = React.useState('');
  
  const parseGarantia = (str: string | undefined): { numero: string; unidad: string } => {
    if (!str || !str.trim()) return { numero: '', unidad: '' };
    const match = str.trim().match(/^(\d+)\s*(días|día|semanas|semana|meses|mes|años|año)$/i);
    if (match) {
      const u = match[2].toLowerCase();
      const unidad = u.startsWith('a') ? 'años' : u.startsWith('me') ? 'meses' : u.startsWith('se') ? 'semanas' : 'días';
      return { numero: match[1], unidad };
    }
    return { numero: '', unidad: '' };
  };

  const parsePeso = (str: string | undefined): { numero: string; unidad: string } => {
    if (!str || !str.trim()) return { numero: '', unidad: '' };
    const match = str.trim().match(/^([\d.,]+)\s*(g|kg|lb|oz)$/i);
    if (match) {
      return { numero: match[1].replace(',', '.'), unidad: match[2].toLowerCase() };
    }
    return { numero: '', unidad: '' };
  };

  const initialGarantia = parseGarantia(initialData?.spcf_producto?.garantia as string | undefined);
  const initialPeso = parsePeso(initialData?.spcf_producto?.peso as string | undefined);
  const initialColorStr = (initialData?.spcf_producto?.color as string | undefined) || '';
  const initialColorHex = initialData?.spcf_producto?.color_hex as string | undefined;

  const parseColorInitial = (str: string): { colors: string[]; color_other: string } => {
    if (!str || !str.trim()) return { colors: [], color_other: '' };
    const parts = str.split(',').map((s) => s.trim()).filter(Boolean);
    const colors: string[] = [];
    let color_other = '';
    for (const p of parts) {
      if (COLOR_OPTIONS.includes(p)) colors.push(p);
      else if (!color_other) color_other = p;
    }
    return { colors, color_other };
  };
  const initialParsed = parseColorInitial(initialColorStr);
  const [isColorOtherSelected, setIsColorOtherSelected] = React.useState(!!initialParsed.color_other);
  const [colorPopoverOpen, setColorPopoverOpen] = React.useState(false);

  const initialMaterial = initialData?.spcf_producto?.material as string | undefined;
  const initialMaterialIsOther = !!(initialMaterial && !MATERIAL_OPTIONS.includes(initialMaterial));
  const [isMaterialOtherSelected, setIsMaterialOtherSelected] = React.useState(initialMaterialIsOther);

  const [baseSpecs, setBaseSpecs] = React.useState<Record<string, any>>({
    descripcion_corta: String(initialData?.spcf_producto?.descripcion_corta ?? initialData?.des_producto ?? '').slice(0, DESC_CORTA_MAX_LENGTH),
    colors: initialParsed.colors,
    color_other: initialParsed.color_other,
    color_hex: initialColorHex || '#6b7280',
    material: initialData?.spcf_producto?.material || '',
    garantia: initialData?.spcf_producto?.garantia || '',
    garantia_numero: initialGarantia.numero,
    garantia_unidad: initialGarantia.unidad,
    dimensiones: initialData?.spcf_producto?.dimensiones || '',
    peso: initialData?.spcf_producto?.peso || '',
    peso_numero: initialPeso.numero,
    peso_unidad: initialPeso.unidad,
  });
  const baseSpecsRef = React.useRef(baseSpecs);
  baseSpecsRef.current = baseSpecs;

  // Formatear precio con separadores de miles mientras se escribe
  const formatCurrency = (value: string) => {
    const numeric = value.replace(/\D/g, '');
    if (!numeric) return '';
    const withDots = numeric.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return withDots;
  };

  // Sincronizar des_producto con descripcion_corta
  React.useEffect(() => {
    setValue('des_producto', baseSpecs.descripcion_corta);
  }, [baseSpecs.descripcion_corta, setValue]);

  React.useEffect(() => {
    if (initialData?.spcf_producto) {
      const s = initialData.spcf_producto as Record<string, any>;
      const garantiaParsed = parseGarantia(s.garantia);
      const pesoParsed = parsePeso(s.peso);
      const colorStr = (s.color ?? '') as string;
      const parsed = parseColorInitial(colorStr);
      if (parsed.color_other) setIsColorOtherSelected(true);
      const materialVal = s.material ?? baseSpecsRef.current.material ?? '';
      if (materialVal && !MATERIAL_OPTIONS.includes(materialVal)) {
        setIsMaterialOtherSelected(true);
      }
      const next = {
        ...baseSpecsRef.current,
        descripcion_corta: (s.descripcion_corta ?? baseSpecsRef.current.descripcion_corta ?? '').slice(0, DESC_CORTA_MAX_LENGTH),
        colors: parsed.colors,
        color_other: parsed.color_other,
        color_hex: s.color_hex ?? baseSpecsRef.current.color_hex ?? '#6b7280',
        material: materialVal,
        garantia: s.garantia ?? baseSpecsRef.current.garantia ?? '',
        garantia_numero: (garantiaParsed.numero || baseSpecsRef.current.garantia_numero) ?? '',
        garantia_unidad: (garantiaParsed.unidad || baseSpecsRef.current.garantia_unidad) ?? '',
        dimensiones: s.dimensiones ?? baseSpecsRef.current.dimensiones ?? '',
        peso: s.peso ?? baseSpecsRef.current.peso ?? '',
        peso_numero: (pesoParsed.numero || baseSpecsRef.current.peso_numero) ?? '',
        peso_unidad: (pesoParsed.unidad || baseSpecsRef.current.peso_unidad) ?? '',
      };
      baseSpecsRef.current = next;
      setBaseSpecs(next);
    }
  }, [initialData?.spcf_producto]);

  // Evitar fallos si categories aún no está cargado o si no hay categoría seleccionada
  // Esto previene accesos a propiedades de undefined durante el render inicial
  const safeCategories = Array.isArray(categories) ? categories.filter(cat => (cat as { id?: number; id_categoria?: number }).id_categoria != null || (cat as { id?: number }).id != null) : [];
  const safeBrands = Array.isArray(brands) ? brands.filter(brand => brand?.id_marca != null) : [];
  const safeProviders = Array.isArray(providers) ? providers.filter(provider => provider?.id_proveedor != null) : [];

  // Obtener el preset actual basado en la categoría seleccionada (defensivo ante datos indefinidos)
  const selectedCategory = safeCategories.find((cat: any) => {
    const catId = cat && cat.id_categoria != null ? String(cat.id_categoria) : '';
    const watched = watchedCategory != null ? String(watchedCategory) : '';
    return catId === watched && watched !== '';
  });
  const currentPreset = selectedCategory ? getPresetByCategory(selectedCategory.name) : null;
  const presetFields = currentPreset ? SPEC_PRESETS[currentPreset]?.fields || [] : [];
  
  // Campos dinámicos del preset
  const [presetSpecs, setPresetSpecs] = React.useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    presetFields.forEach(field => {
      initial[field.key] = initialData?.spcf_producto?.[field.key] || '';
    });
    return initial;
  });
  const presetSpecsRef = React.useRef(presetSpecs);
  presetSpecsRef.current = presetSpecs;

  // Actualizar presetSpecs cuando cambie el preset
  React.useEffect(() => {
    const newPresetSpecs: Record<string, any> = {};
    presetFields.forEach(field => {
      newPresetSpecs[field.key] = initialData?.spcf_producto?.[field.key] || '';
    });
    presetSpecsRef.current = newPresetSpecs;
    setPresetSpecs(newPresetSpecs);
  }, [currentPreset, initialData?.spcf_producto, presetFields.length]);

  const addTag = () => {
    if (newTag.trim() && !watchedTags.includes(newTag.trim())) {
      setValue('tags', [...watchedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove));
  };

  const addCustomSpec = () => {
    if (newCustomKey.trim() && newCustomValue.trim()) {
      setCustomSpecs(prev => [...prev, { key: newCustomKey.trim(), value: newCustomValue.trim() }]);
      setNewCustomKey('');
      setNewCustomValue('');
    }
  };

  const removeCustomSpec = (index: number) => {
    setCustomSpecs(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = (data: ProductFormData) => {
    console.log('Form data:', data);
    console.log('Base specs:', baseSpecs);
    console.log('Preset specs:', presetSpecs);
    console.log('Custom specs:', customSpecs);
    console.log('Errors:', errors);
    console.log('Is valid:', isValid);
    
    // Validar campos requeridos del preset (usar ref para valor actual)
    const currentPresetSpecs = presetSpecsRef.current;
    const requiredFields = presetFields.filter(field => field.required);
    const missingRequiredFields = requiredFields.filter(field => !currentPresetSpecs[field.key]?.trim());
    
    if (missingRequiredFields.length > 0) {
      toast.error(`Los siguientes campos son requeridos: ${missingRequiredFields.map(f => f.label).join(', ')}`);
      return;
    }

    // Convertir customSpecs a objeto
    const customSpecsObj = customSpecs.reduce((acc, spec) => {
      acc[spec.key] = spec.value;
      return acc;
    }, {} as Record<string, any>);

    // Convertir strings a números para campos numéricos
    // Normalizar precio quitando puntos
    const normalizedPrice = String(data.val_precio || '')
      .toString()
      .replace(/\./g, '');

    // Usar refs para leer el estado más reciente (evita closure con datos viejos al enviar)
    const latestBaseSpecs = baseSpecsRef.current;
    const latestPresetSpecs = presetSpecsRef.current;

    // Sanitizar datos del formulario contra XSS (refs al final para que talla/color actuales no se sobrescriban)
    const sanitizedData = validateForm({
      ...data,
      nom_producto: data.nom_producto,
      des_producto: data.des_producto,
      spcf_producto: { ...data.spcf_producto, ...latestBaseSpecs, ...latestPresetSpecs, ...customSpecsObj }
    });

    const garantiaStr =
      latestBaseSpecs.garantia_numero && latestBaseSpecs.garantia_unidad
        ? `${latestBaseSpecs.garantia_numero} ${latestBaseSpecs.garantia_unidad}`
        : (latestBaseSpecs.garantia || '');

    const pesoStr =
      latestBaseSpecs.peso_numero && latestBaseSpecs.peso_unidad
        ? `${latestBaseSpecs.peso_numero}${latestBaseSpecs.peso_unidad}`
        : (latestBaseSpecs.peso || '');

    const colorStr = [...(latestBaseSpecs.colors || []), latestBaseSpecs.color_other].filter(Boolean).join(', ');

    const formattedData = {
      ...sanitizedData,
      des_producto: latestBaseSpecs.descripcion_corta || data.des_producto,
      spcf_producto: {
        ...data.spcf_producto,
        ...latestBaseSpecs,
        color: colorStr,
        garantia: garantiaStr,
        peso: pesoStr,
        ...latestPresetSpecs,
        ...customSpecsObj,
        tags: data.tags || [],
      },
      val_precio: parseFloat(normalizedPrice),
      num_stock: parseInt(data.num_stock),
      id_categoria: parseInt(data.id_categoria),
      id_marca: parseInt(data.id_marca),
      id_proveedor: parseInt(data.id_proveedor),
    };
    
    onSubmit(formattedData as any);
  };

  return (
    <form id={formId} onSubmit={handleSubmit(handleFormSubmit as any)} className="space-y-6">
      {/* Información del Producto */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Producto</CardTitle>
          <CardDescription>Datos básicos del producto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nombre del Producto */}
          <div className="space-y-2">
            <Label htmlFor="nom_producto">Nombre del Producto *</Label>
            <Input
              id="nom_producto"
              {...register('nom_producto')}
              placeholder="Ingresa el nombre del producto"
              className={errors.nom_producto ? 'border-red-500' : ''}
            />
            {errors.nom_producto && (
              <p className="text-sm text-red-600">{errors.nom_producto.message}</p>
            )}
          </div>

          {/* Categoría y Marca */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="id_categoria">Categoría *</Label>
              <Select
                value={watch('id_categoria') || SELECT_EMPTY_VALUE}
                onValueChange={(value) => setValue('id_categoria', value === SELECT_EMPTY_VALUE ? '' : value)}
                disabled={isEditing}
              >
                <SelectTrigger className={cn('w-full', errors.id_categoria && 'border-red-500')}>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_EMPTY_VALUE}>Selecciona una categoría</SelectItem>
                  {safeCategories.map((category) => {
                    const categoryId = (category as { id?: number; id_categoria?: number }).id ?? (category as { id_categoria?: number }).id_categoria;
                    if (categoryId == null) return null;
                    return (
                      <SelectItem key={`cat-${categoryId}`} value={String(categoryId)}>
                        {category.name || ''}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {errors.id_categoria && (
                <p className="text-sm text-red-600">{errors.id_categoria.message}</p>
              )}
              {isEditing && (
                <p className="text-sm text-muted-foreground">La categoría no se puede cambiar al editar</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="id_marca">Marca *</Label>
              <Select value={watch('id_marca') || SELECT_EMPTY_VALUE} onValueChange={(value) => setValue('id_marca', value === SELECT_EMPTY_VALUE ? '' : value)}>
                <SelectTrigger className={cn('w-full', errors.id_marca && 'border-red-500')}>
                  <SelectValue placeholder="Selecciona una marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_EMPTY_VALUE}>Selecciona una marca</SelectItem>
                  {safeBrands.map((brand) => {
                    const brandId = brand?.id_marca;
                    if (!brandId) return null;
                    return (
                      <SelectItem key={brandId} value={String(brandId)}>
                        {brand.nom_marca || ''}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {errors.id_marca && (
                <p className="text-sm text-red-600">{errors.id_marca.message}</p>
              )}
            </div>
          </div>

          {/* Proveedor */}
          <div className="space-y-2">
            <Label htmlFor="id_proveedor">Proveedor *</Label>
            <Select value={watch('id_proveedor') || SELECT_EMPTY_VALUE} onValueChange={(value) => setValue('id_proveedor', value === SELECT_EMPTY_VALUE ? '' : value)}>
              <SelectTrigger className={cn('w-full', errors.id_proveedor && 'border-red-500')}>
                <SelectValue placeholder="Selecciona un proveedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SELECT_EMPTY_VALUE}>Selecciona un proveedor</SelectItem>
                {safeProviders.map((provider) => {
                  const providerId = provider?.id_proveedor;
                  if (!providerId) return null;
                  return (
                    <SelectItem key={providerId} value={String(providerId)}>
                      {provider.nom_proveedor || ''}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors.id_proveedor && (
              <p className="text-sm text-red-600">{errors.id_proveedor.message}</p>
            )}
          </div>

          {/* Precio y Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="val_precio">Precio *</Label>
              <Input
                id="val_precio"
                value={watch('val_precio')}
                onChange={(e) => {
                  const formatted = formatCurrency(e.target.value);
                  setValue('val_precio', formatted);
                }}
                inputMode="numeric"
                placeholder="0"
                className={errors.val_precio ? 'border-red-500' : ''}
              />
              {errors.val_precio && (
                <p className="text-sm text-red-600">{errors.val_precio.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="num_stock">Stock *</Label>
              <Input
                id="num_stock"
                {...register('num_stock')}
                placeholder="0"
                type="number"
                min="0"
                className={errors.num_stock ? 'border-red-500' : ''}
              />
              {errors.num_stock && (
                <p className="text-sm text-red-600">{errors.num_stock.message}</p>
              )}
            </div>
          </div>

          {/* Especificaciones del Producto */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <IconSettings className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-medium">Especificaciones del Producto</h3>
              {currentPreset && (
                <Badge variant="secondary" className="ml-2">
                  {SPEC_PRESETS[currentPreset]?.label}
                </Badge>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground">
                    <IconInfoCircle className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  Datos técnicos y atributos que se muestran en la ficha del producto. Usa opciones predefinidas cuando puedas para mantener filtros consistentes.
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Descripción corta */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label>Descripción corta *</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground hover:text-foreground">
                      <IconInfoCircle className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Resumen breve que aparece en listados y buscadores. Máximo {DESC_CORTA_MAX_LENGTH} caracteres.</TooltipContent>
                </Tooltip>
              </div>
              <Input
                value={baseSpecs.descripcion_corta}
                onChange={(e) => setBaseSpecs((prev) => ({ ...prev, descripcion_corta: e.target.value.slice(0, DESC_CORTA_MAX_LENGTH) }))}
                placeholder="Resumen breve del producto"
                maxLength={DESC_CORTA_MAX_LENGTH}
                className={errors.des_producto ? 'border-red-500' : ''}
              />
              <p className="text-xs text-muted-foreground">{baseSpecs.descripcion_corta?.length ?? 0}/{DESC_CORTA_MAX_LENGTH}</p>
              {errors.des_producto && (
                <p className="text-sm text-red-600">{errors.des_producto.message}</p>
              )}
            </div>

            {/* Color, Material, Garantía */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label>Color</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-foreground">
                        <IconInfoCircle className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Elige uno o varios colores. Opción &quot;Otro&quot; para un color personalizado con nombre y tono.</TooltipContent>
                  </Tooltip>
                </div>
                <Popover open={colorPopoverOpen} onOpenChange={setColorPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn('w-full justify-between font-normal')}
                    >
                      <span className="truncate">
                        {(() => {
                          const colors = baseSpecs.colors || [];
                          const otherLabel = isColorOtherSelected ? (baseSpecs.color_other || 'Otro') : null;
                          const list = [...colors, otherLabel].filter(Boolean);
                          if (list.length === 0) return 'Selecciona colores';
                          if (list.length <= 2) return list.join(', ');
                          return `${list.length} colores`;
                        })()}
                      </span>
                      <IconChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <div className="max-h-[280px] overflow-y-auto p-2">
                      {COLOR_OPTIONS.map((c) => (
                        <label
                          key={c}
                          className="flex items-center gap-2 rounded-sm py-2 px-2 text-sm cursor-pointer hover:bg-muted/60"
                        >
                          <Checkbox
                            checked={(baseSpecs.colors || []).includes(c)}
                            onCheckedChange={(checked) => {
                              const prev = baseSpecsRef.current.colors || [];
                              const next = checked ? [...prev, c] : prev.filter((x: string) => x !== c);
                              const spec = { ...baseSpecsRef.current, colors: next };
                              baseSpecsRef.current = spec;
                              setBaseSpecs(spec);
                            }}
                          />
                          <span>{c}</span>
                        </label>
                      ))}
                      <label className="flex items-center gap-2 rounded-sm py-2 px-2 text-sm cursor-pointer hover:bg-muted/60 border-t mt-1 pt-2">
                        <Checkbox
                          checked={isColorOtherSelected}
                          onCheckedChange={(checked) => {
                            setIsColorOtherSelected(!!checked);
                            if (!checked) {
                              const spec = { ...baseSpecsRef.current, color_other: '' };
                              baseSpecsRef.current = spec;
                              setBaseSpecs(spec);
                            } else {
                              setColorPopoverOpen(false);
                            }
                          }}
                        />
                        <span>Otro</span>
                      </label>
                    </div>
                  </PopoverContent>
                </Popover>
                {isColorOtherSelected && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3 mt-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Nombre del color</Label>
                      <Input
                        placeholder="Ej. Coral, Verde musgo"
                        value={baseSpecs.color_other || ''}
                        onChange={(e) => {
                          const next = { ...baseSpecsRef.current, color_other: e.target.value };
                          baseSpecsRef.current = next;
                          setBaseSpecs(next);
                        }}
                      />
                    </div>
                    <div>
                      <ColorPicker
                        value={baseSpecs.color_hex || '#6b7280'}
                        onChange={(hex) => {
                          const next = { ...baseSpecsRef.current, color_hex: hex };
                          baseSpecsRef.current = next;
                          setBaseSpecs(next);
                        }}
                        label="Tono (hex)"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label>Material</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-foreground">
                        <IconInfoCircle className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Material principal del producto. Usa &quot;Otro&quot; si no está en la lista.</TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={baseSpecs.material === '' ? (isMaterialOtherSelected ? MATERIAL_OTHER_VALUE : SELECT_EMPTY_VALUE) : (MATERIAL_OPTIONS.includes(baseSpecs.material) ? baseSpecs.material : MATERIAL_OTHER_VALUE)}
                  onValueChange={(v) => {
                    if (v === SELECT_EMPTY_VALUE) {
                      setIsMaterialOtherSelected(false);
                      const next = { ...baseSpecsRef.current, material: '' };
                      baseSpecsRef.current = next;
                      setBaseSpecs(next);
                      return;
                    }
                    if (v === MATERIAL_OTHER_VALUE) {
                      setIsMaterialOtherSelected(true);
                      const next = { ...baseSpecsRef.current, material: '' };
                      baseSpecsRef.current = next;
                      setBaseSpecs(next);
                      return;
                    }
                    setIsMaterialOtherSelected(false);
                    const next = { ...baseSpecsRef.current, material: v };
                    baseSpecsRef.current = next;
                    setBaseSpecs(next);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SELECT_EMPTY_VALUE}>Selecciona material</SelectItem>
                    {MATERIAL_OPTIONS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                    <SelectItem value={MATERIAL_OTHER_VALUE}>Otro</SelectItem>
                  </SelectContent>
                </Select>
                {isMaterialOtherSelected && (
                  <Input
                    placeholder="Ej. Fibra de carbono"
                    value={baseSpecs.material || ''}
                    onChange={(e) => {
                      const next = { ...baseSpecsRef.current, material: e.target.value };
                      baseSpecsRef.current = next;
                      setBaseSpecs(next);
                    }}
                    className="mt-1"
                  />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label>Garantía</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-foreground">
                        <IconInfoCircle className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Duración de la garantía. Se mostrará como texto (ej. 12 meses) en la ficha.</TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={0}
                    placeholder="Nº"
                    value={baseSpecs.garantia_numero || ''}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 3);
                      const next = { ...baseSpecsRef.current, garantia_numero: v };
                      baseSpecsRef.current = next;
                      setBaseSpecs(next);
                    }}
                    className="w-20"
                  />
                  <Select
                    value={baseSpecs.garantia_unidad || SELECT_EMPTY_VALUE}
                    onValueChange={(v) => {
                      const val = v === SELECT_EMPTY_VALUE ? '' : v;
                      const next = { ...baseSpecsRef.current, garantia_unidad: val };
                      baseSpecsRef.current = next;
                      setBaseSpecs(next);
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SELECT_EMPTY_VALUE}>Unidad</SelectItem>
                      {GARANTIA_UNIDADES.map((u) => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Dimensiones y Peso */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label>Dimensiones</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-foreground">
                        <IconInfoCircle className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Alto x ancho x profundidad con unidad (ej. 146.7 x 71.5 x 7.8 mm o 100x50x30 cm).</TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  value={baseSpecs.dimensiones}
                  onChange={(e) => {
                    const next = { ...baseSpecsRef.current, dimensiones: e.target.value };
                    baseSpecsRef.current = next;
                    setBaseSpecs(next);
                  }}
                  placeholder="Ej. 146.7 x 71.5 x 7.8 mm"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label>Peso</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-foreground">
                        <IconInfoCircle className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Peso del producto. Indica el valor y la unidad (g, kg, lb, oz).</TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="Ej. 172"
                    value={baseSpecs.peso_numero || ''}
                    onChange={(e) => {
                      const v = e.target.value.replace(',', '.');
                      const next = { ...baseSpecsRef.current, peso_numero: v };
                      baseSpecsRef.current = next;
                      setBaseSpecs(next);
                    }}
                    className="w-24"
                  />
                  <Select
                    value={baseSpecs.peso_unidad || SELECT_EMPTY_VALUE}
                    onValueChange={(v) => {
                      const val = v === SELECT_EMPTY_VALUE ? '' : v;
                      const next = { ...baseSpecsRef.current, peso_unidad: val };
                      baseSpecsRef.current = next;
                      setBaseSpecs(next);
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SELECT_EMPTY_VALUE}>Unidad</SelectItem>
                      {PESO_UNIDADES.map((u) => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Campos dinámicos del preset */}
            {presetFields.length > 0 && (
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <h4 className="text-md font-medium text-muted-foreground">
                      Especificaciones para {currentPreset && SPEC_PRESETS[currentPreset] ? SPEC_PRESETS[currentPreset].label : ''}
                    </h4>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-muted-foreground hover:text-foreground">
                          <IconInfoCircle className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Campos recomendados según la categoría del producto.</TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {presetFields.map((field) => (
                      <div key={field.key} className="space-y-2">
                        <Label>
                          {field.label}
                          {field.required && <span className="text-red-600 ml-1">*</span>}
                        </Label>
                        <Input
                          value={presetSpecs[field.key] || ''}
                          onChange={(e) => {
                            const next = { ...presetSpecsRef.current, [field.key]: e.target.value };
                            presetSpecsRef.current = next;
                            setPresetSpecs(next);
                          }}
                          placeholder={field.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Especificaciones personalizadas */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-1.5 mb-3">
                <h4 className="text-md font-medium text-muted-foreground">
                  Especificaciones personalizadas
                </h4>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground hover:text-foreground">
                      <IconInfoCircle className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Atributos extra nombre-valor. Usa sugerencias para mantener nombres consistentes entre productos.</TooltipContent>
                </Tooltip>
              </div>

              {presetFields.length > 0 && (() => {
                const existingKeys = new Set(customSpecs.map((s) => s.key.toLowerCase()));
                const suggested = presetFields
                  .filter((f) => !existingKeys.has(f.key.toLowerCase()))
                  .slice(0, 6);
                if (suggested.length === 0) return null;
                return (
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-2">Añadir desde sugerencias de categoría:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggested.map((f) => (
                        <Button
                          key={f.key}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            setCustomSpecs((prev) => [...prev, { key: f.key, value: '' }]);
                            setNewCustomKey('');
                            setNewCustomValue('');
                          }}
                        >
                          + {f.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 space-y-1">
                    <Input
                      value={newCustomKey}
                      onChange={(e) => setNewCustomKey(e.target.value)}
                      placeholder="Nombre del atributo (ej. Talla, SKU)"
                      className="w-full"
                      list="custom-spec-keys-list"
                    />
                    <datalist id="custom-spec-keys-list">
                      {COMMON_SPEC_KEYS.filter((k) =>
                        !newCustomKey || k.toLowerCase().includes(newCustomKey.toLowerCase())
                      ).slice(0, 12).map((k) => (
                        <option key={k} value={k} />
                      ))}
                    </datalist>
                    {newCustomKey && COMMON_SPEC_KEYS.filter((k) =>
                      k.toLowerCase().includes(newCustomKey.toLowerCase())
                    ).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {COMMON_SPEC_KEYS.filter((k) =>
                          k.toLowerCase().includes(newCustomKey.toLowerCase())
                        ).slice(0, 5).map((k) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => setNewCustomKey(k)}
                            className="text-xs px-2 py-1 rounded-md bg-muted hover:bg-muted/80"
                          >
                            {k}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Input
                    value={newCustomValue}
                    onChange={(e) => setNewCustomValue(e.target.value)}
                    placeholder="Valor"
                    className="sm:w-48"
                  />
                  <Button type="button" onClick={addCustomSpec} variant="outline" size="sm" className="shrink-0">
                    <IconPlus className="h-4 w-4" />
                  </Button>
                </div>

                {customSpecs.length > 0 && (
                  <div className="space-y-2">
                    {customSpecs.map((spec, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                        <span className="font-medium text-sm">{spec.key}:</span>
                        <span className="text-sm text-muted-foreground truncate">{spec.value || '—'}</span>
                        <Button
                          type="button"
                          onClick={() => removeCustomSpec(index)}
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-6 w-6 p-0 shrink-0"
                        >
                          <IconX className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Campo oculto para compatibilidad con esquema des_producto */}
          <input type="hidden" value={baseSpecs.descripcion_corta} {...register('des_producto')} />
        </CardContent>
      </Card>

      {/* Etiquetas */}
      <Card>
        <CardHeader>
          <CardTitle>Etiquetas</CardTitle>
          <CardDescription>Agrega etiquetas para organizar tus productos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Nueva etiqueta"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button type="button" onClick={addTag} variant="outline" size="sm">
              <IconPlus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {watchedTags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <IconX className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Botones de Acción (ocultos si hideActionButtons; se renderizan en la página al final) */}
      {!hideActionButtons && (
        <div className="flex items-center justify-end space-x-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={() => reset()}>
            LIMPIAR
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isLoading ? 'GUARDANDO...' : submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
});
