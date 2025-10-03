'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { IconX, IconPlus, IconSettings } from "@tabler/icons-react";
import { useCategories, useBrands } from "@/hooks/use-products";
import { useAllLines, useLinesByCategory } from "@/hooks/use-lines";
import { useSublinesByLine } from "@/hooks/use-sublines";
import { useAllProviders } from "@/hooks/use-providers";
import { toast } from "sonner";

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

// Esquema de validación con Zod
const productSchema = z.object({
  nom_producto: z.string().min(1, 'El nombre del producto es requerido'),
  des_producto: z.string().min(1, 'La descripción es requerida'),
  val_precio: z.string().min(1, 'El precio es requerido').refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    'El precio debe ser un número válido mayor a 0'
  ),
  num_stock: z.string().min(1, 'El stock es requerido').refine(
    (val) => !isNaN(parseInt(val)) && parseInt(val) >= 0,
    'El stock debe ser un número válido mayor o igual a 0'
  ),
  id_categoria: z.string().min(1, 'La categoría es requerida'),
  id_marca: z.string().min(1, 'La marca es requerida'),
  id_linea: z.string().min(1, 'La línea es requerida'),
  id_sublinea: z.string().min(1, 'La sublínea es requerida'),
  id_proveedor: z.string().min(1, 'El proveedor es requerido'),
  tags: z.array(z.string()).optional().default([]),
  spcf_producto: z.record(z.any()).optional().default({}),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  onSubmit: (data: ProductFormData) => void;
  isLoading?: boolean;
  initialData?: Partial<ProductFormData>;
  submitLabel?: string;
  isEditing?: boolean; // Nuevo: indica si estamos editando
}

export const ProductForm: React.FC<ProductFormProps> = ({ 
  onSubmit, 
  isLoading = false,
  initialData,
  submitLabel = 'CREAR PRODUCTO',
  isEditing = false, // Por defecto, no estamos editando
}) => {
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  const { data: providers = [] } = useAllProviders();
  const { data: allLines = [] } = useAllLines();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    setValue,
    watch,
    reset
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      nom_producto: initialData?.nom_producto || '',
      des_producto: initialData?.des_producto || '',
      val_precio: initialData?.val_precio || '',
      num_stock: initialData?.num_stock || '',
      id_categoria: initialData?.id_categoria || '',
      id_marca: initialData?.id_marca || '',
      id_linea: initialData?.id_linea || '',
      id_sublinea: initialData?.id_sublinea || '',
      id_proveedor: initialData?.id_proveedor || '',
      tags: initialData?.tags || [],
      spcf_producto: initialData?.spcf_producto || {},
    },
  });

  React.useEffect(() => {
    if (initialData) {
      const descripcionCorta = initialData.spcf_producto?.descripcion_corta || initialData.des_producto || '';
      reset({
        nom_producto: initialData.nom_producto || '',
        des_producto: descripcionCorta,
        val_precio: initialData.val_precio || '',
        num_stock: initialData.num_stock || '',
        id_categoria: initialData.id_categoria || '',
        id_marca: initialData.id_marca || '',
        id_linea: initialData.id_linea || '',
        id_sublinea: initialData.id_sublinea || '',
        id_proveedor: initialData.id_proveedor || '',
        tags: initialData.tags || [],
        spcf_producto: initialData.spcf_producto || {},
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
  const watchedLine = watch('id_linea');
  const watchedSubline = watch('id_sublinea');
  const [newTag, setNewTag] = React.useState('');
  const [customSpecs, setCustomSpecs] = React.useState<Array<{key: string, value: string}>>([]);
  const [newCustomKey, setNewCustomKey] = React.useState('');
  const [newCustomValue, setNewCustomValue] = React.useState('');
  
  // Campos base siempre presentes
  const [baseSpecs, setBaseSpecs] = React.useState<Record<string, any>>({
    descripcion_corta: initialData?.spcf_producto?.descripcion_corta || initialData?.des_producto || '',
    color: initialData?.spcf_producto?.color || '',
    material: initialData?.spcf_producto?.material || '',
    garantia: initialData?.spcf_producto?.garantia || '',
    dimensiones: initialData?.spcf_producto?.dimensiones || '',
    peso: initialData?.spcf_producto?.peso || '',
  });

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

  // Sincronizar baseSpecs cuando lleguen initialData/spcf desde el servidor (editar)
  React.useEffect(() => {
    if (initialData?.spcf_producto) {
      const s = initialData.spcf_producto as Record<string, any>;
      setBaseSpecs((prev) => ({
        ...prev,
        descripcion_corta: s.descripcion_corta ?? prev.descripcion_corta ?? '',
        color: s.color ?? prev.color ?? '',
        material: s.material ?? prev.material ?? '',
        garantia: s.garantia ?? prev.garantia ?? '',
        dimensiones: s.dimensiones ?? prev.dimensiones ?? '',
        peso: s.peso ?? prev.peso ?? '',
      }));
    }
  }, [initialData?.spcf_producto]);

  // Obtener el preset actual basado en la categoría seleccionada (defensivo ante datos indefinidos)
  const selectedCategory = (categories || []).find((cat: any) => {
    const catId = cat && cat.id_categoria != null ? String(cat.id_categoria) : '';
    const watched = watchedCategory != null ? String(watchedCategory) : '';
    return catId === watched && watched !== '';
  });
  const currentPreset = selectedCategory ? getPresetByCategory(selectedCategory.nom_categoria) : null;
  const presetFields = currentPreset ? SPEC_PRESETS[currentPreset]?.fields || [] : [];

  // Evitar fallos si categories aún no está cargado o si no hay categoría seleccionada
  // Esto previene accesos a propiedades de undefined durante el render inicial
  const safeCategories = Array.isArray(categories) ? categories : [];
  
  // Campos dinámicos del preset
  const [presetSpecs, setPresetSpecs] = React.useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    presetFields.forEach(field => {
      initial[field.key] = initialData?.spcf_producto?.[field.key] || '';
    });
    return initial;
  });

  // Actualizar presetSpecs cuando cambie el preset
  React.useEffect(() => {
    const newPresetSpecs: Record<string, any> = {};
    presetFields.forEach(field => {
      newPresetSpecs[field.key] = initialData?.spcf_producto?.[field.key] || '';
    });
    setPresetSpecs(newPresetSpecs);
  }, [currentPreset, initialData?.spcf_producto, presetFields.length]);

  // Obtener líneas filtradas por categoría seleccionada
  const { data: linesByCategory = [] } = useLinesByCategory(
    watchedCategory ? parseInt(watchedCategory) : 0
  );
  
  // Obtener sublíneas filtradas por línea seleccionada
  const { data: sublinesByLine = [] } = useSublinesByLine(
    watchedLine ? parseInt(watchedLine) : 0
  );

  // Usar líneas filtradas por categoría si hay una seleccionada, sino todas las líneas
  const availableLines = watchedCategory ? linesByCategory : allLines;

  // Utilidad: eliminar duplicados por id
  const uniqueById = <T extends Record<string, any>>(items: T[], idKey: string): T[] => {
    const seen = new Set<string>();
    return (items || []).filter((item) => {
      const id = item && item[idKey] != null ? String(item[idKey]) : '';
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  };

  const uniqueLines = uniqueById(availableLines, 'id_linea');
  const uniqueSublines = uniqueById(sublinesByLine, 'id_sublinea');

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
    
    // Validar que la sublínea pertenezca a la línea seleccionada
    if (watchedLine) {
      const existsInLine = uniqueSublines.some(
        (s) => String(s.id_sublinea) === String(watchedSubline)
      );
      if (!existsInLine) {
        toast.error('La sublínea seleccionada no pertenece a la línea elegida');
        return;
      }
    }

    // Validar campos requeridos del preset
    const requiredFields = presetFields.filter(field => field.required);
    const missingRequiredFields = requiredFields.filter(field => !presetSpecs[field.key]?.trim());
    
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

    const formattedData = {
      ...data,
      // sincronizar descripción corta al campo des_producto para compatibilidad
      des_producto: baseSpecs.descripcion_corta || data.des_producto,
      // construir spcf unificado con todos los campos
      spcf_producto: {
        ...baseSpecs,
        ...presetSpecs,
        ...customSpecsObj,
        ...data.spcf_producto,
        tags: data.tags || [],
      },
      val_precio: parseFloat(normalizedPrice),
      num_stock: parseInt(data.num_stock),
      id_categoria: parseInt(data.id_categoria),
      id_marca: parseInt(data.id_marca),
      id_linea: parseInt(data.id_linea),
      id_sublinea: parseInt(data.id_sublinea),
      id_proveedor: parseInt(data.id_proveedor),
    };
    
    onSubmit(formattedData as any);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit as any)} className="space-y-6">
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
              <p className="text-sm text-red-500">{errors.nom_producto.message}</p>
            )}
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
            </div>

            {/* Campos base siempre presentes */}
            <div className="space-y-2">
              <Label>Descripción corta *</Label>
              <Input
                value={baseSpecs.descripcion_corta}
                onChange={(e) => setBaseSpecs((prev) => ({ ...prev, descripcion_corta: e.target.value }))}
                placeholder="Resumen breve del producto"
                className={errors.des_producto ? 'border-red-500' : ''}
              />
              {errors.des_producto && (
                <p className="text-sm text-red-500">{errors.des_producto.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <Input
                  value={baseSpecs.color}
                  onChange={(e) => setBaseSpecs((prev) => ({ ...prev, color: e.target.value }))}
                  placeholder="Ej. Negro, Blanco, Rojo"
                />
              </div>
              <div className="space-y-2">
                <Label>Material</Label>
                <Input
                  value={baseSpecs.material}
                  onChange={(e) => setBaseSpecs((prev) => ({ ...prev, material: e.target.value }))}
                  placeholder="Ej. Algodón, Aluminio, Plástico"
                />
              </div>
              <div className="space-y-2">
                <Label>Garantía</Label>
                <Input
                  value={baseSpecs.garantia}
                  onChange={(e) => setBaseSpecs((prev) => ({ ...prev, garantia: e.target.value }))}
                  placeholder="Ej. 12 meses, 2 años"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dimensiones</Label>
                <Input
                  value={baseSpecs.dimensiones}
                  onChange={(e) => setBaseSpecs((prev) => ({ ...prev, dimensiones: e.target.value }))}
                  placeholder="Ej. 146.7 x 71.5 x 7.8 mm"
                />
              </div>
              <div className="space-y-2">
                <Label>Peso</Label>
                <Input
                  value={baseSpecs.peso}
                  onChange={(e) => setBaseSpecs((prev) => ({ ...prev, peso: e.target.value }))}
                  placeholder="Ej. 172g, 1.5kg"
                />
              </div>
            </div>

            {/* Campos dinámicos del preset */}
            {presetFields.length > 0 && (
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-muted-foreground mb-3">
                    Especificaciones específicas para {currentPreset && SPEC_PRESETS[currentPreset] ? SPEC_PRESETS[currentPreset].label : ''}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {presetFields.map((field) => (
                      <div key={field.key} className="space-y-2">
                        <Label>
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Input
                          value={presetSpecs[field.key] || ''}
                          onChange={(e) => setPresetSpecs((prev) => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Campos personalizados */}
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-muted-foreground mb-3">
                Especificaciones personalizadas
              </h4>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newCustomKey}
                    onChange={(e) => setNewCustomKey(e.target.value)}
                    placeholder="Nombre del atributo"
                    className="flex-1"
                  />
                  <Input
                    value={newCustomValue}
                    onChange={(e) => setNewCustomValue(e.target.value)}
                    placeholder="Valor"
                    className="flex-1"
                  />
                  <Button type="button" onClick={addCustomSpec} variant="outline" size="sm">
                    <IconPlus className="h-4 w-4" />
                  </Button>
                </div>

                {customSpecs.length > 0 && (
                  <div className="space-y-2">
                    {customSpecs.map((spec, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                        <span className="font-medium text-sm">{spec.key}:</span>
                        <span className="text-sm text-muted-foreground">{spec.value}</span>
                        <Button
                          type="button"
                          onClick={() => removeCustomSpec(index)}
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-6 w-6 p-0"
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

          {/* Categoría y Marca */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="id_categoria">Categoría *</Label>
              <Select 
                value={watch('id_categoria')}
                onChange={(e) => {
                  setValue('id_categoria', e.target.value);
                  // Al cambiar categoría, reiniciar línea y sublínea
                  setValue('id_linea', '');
                  setValue('id_sublinea', '');
                }}
                className={errors.id_categoria ? 'border-red-500' : ''}
                fullWidth
                disabled={isEditing} // Deshabilitar al editar
              >
                <option value="" disabled>Selecciona una categoría</option>
                {categories.map((category) => (
                  <option key={`cat-${category.id_categoria}`} value={category.id_categoria.toString()}>
                    {category.nom_categoria}
                  </option>
                ))}
              </Select>
              {errors.id_categoria && (
                <p className="text-sm text-red-500">{errors.id_categoria.message}</p>
              )}
              {isEditing && (
                <p className="text-sm text-muted-foreground">La categoría no se puede cambiar al editar</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="id_marca">Marca *</Label>
              <Select 
                value={watch('id_marca')}
                onChange={(e) => setValue('id_marca', e.target.value)}
                className={errors.id_marca ? 'border-red-500' : ''}
                fullWidth
              >
                <option value="" disabled>Selecciona una marca</option>
                {brands.map((brand) => (
                  <option key={brand.id_marca} value={brand.id_marca.toString()}>
                    {brand.nom_marca}
                  </option>
                ))}
              </Select>
              {errors.id_marca && (
                <p className="text-sm text-red-500">{errors.id_marca.message}</p>
              )}
            </div>
          </div>

          {/* Línea y Sublínea */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="id_linea">Línea *</Label>
                {!isEditing && <span className="text-xs text-muted-foreground">(elige primero la categoría)</span>}
              </div>
              <Select 
                value={watch('id_linea')}
                onChange={(e) => {
                  setValue('id_linea', e.target.value);
                  // Limpiar sublínea cuando cambie la línea
                  setValue('id_sublinea', '');
                }}
                className={errors.id_linea ? 'border-red-500' : ''}
                disabled={isEditing || !watchedCategory} // Deshabilitar al editar o si no hay categoría
                fullWidth
              >
                <option value="" disabled>Selecciona una línea</option>
                {uniqueLines.map((line) => (
                  <option key={`line-${line.id_linea}`} value={line.id_linea.toString()}>
                    {line.nom_linea}
                  </option>
                ))}
              </Select>
              {errors.id_linea && (
                <p className="text-sm text-red-500">{errors.id_linea.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="id_sublinea">Sublínea *</Label>
                {!isEditing && <span className="text-xs text-muted-foreground">(elige primero la línea)</span>}
              </div>
              <Select 
                value={watch('id_sublinea')}
                onChange={(e) => setValue('id_sublinea', e.target.value)}
                className={errors.id_sublinea ? 'border-red-500' : ''}
                disabled={isEditing || !watchedLine} // Deshabilitar al editar o si no hay línea
                fullWidth
              >
                <option value="" disabled>Selecciona una sublínea</option>
                {uniqueSublines.map((subline) => (
                  <option key={`subline-${subline.id_sublinea}`} value={subline.id_sublinea.toString()}>
                    {subline.nom_sublinea}
                  </option>
                ))}
              </Select>
              {errors.id_sublinea && (
                <p className="text-sm text-red-500">{errors.id_sublinea.message}</p>
              )}
              {isEditing && (
                <p className="text-sm text-muted-foreground">La sublínea no se puede cambiar al editar</p>
              )}
            </div>
          </div>

          {/* Proveedor */}
          <div className="space-y-2">
            <Label htmlFor="id_proveedor">Proveedor *</Label>
            <Select 
              value={watch('id_proveedor')}
              onChange={(e) => setValue('id_proveedor', e.target.value)}
              className={errors.id_proveedor ? 'border-red-500' : ''}
              fullWidth
            >
              <option value="" disabled>Selecciona un proveedor</option>
              {providers.map((provider) => (
                <option key={provider.id_proveedor} value={provider.id_proveedor.toString()}>
                  {provider.nom_proveedor}
                </option>
              ))}
            </Select>
            {errors.id_proveedor && (
              <p className="text-sm text-red-500">{errors.id_proveedor.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Precios y Stock */}
      <Card>
        <CardHeader>
          <CardTitle>Precios y Stock</CardTitle>
          <CardDescription>Información de precios e inventario</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                <p className="text-sm text-red-500">{errors.val_precio.message}</p>
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
                <p className="text-sm text-red-500">{errors.num_stock.message}</p>
              )}
            </div>
          </div>

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

      {/* Botones de Acción */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t">
        <Button type="button" variant="outline" onClick={() => reset()}>
          LIMPIAR
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-black hover:bg-gray-800 text-white"
        >
          {isLoading ? 'GUARDANDO...' : submitLabel}
        </Button>
      </div>
    </form>
  );
};
