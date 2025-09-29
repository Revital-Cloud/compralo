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
import { IconX, IconPlus } from "@tabler/icons-react";
import { useCategories, useBrands } from "@/hooks/use-products";
import { toast } from "sonner";

// Esquema de validación con Zod
const productSchema = z.object({
  nom_producto: z.string().min(1, 'El nombre del producto es requerido'),
  des_producto: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
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
  cod_producto: z.string().min(1, 'El código del producto es requerido'),
  tags: z.array(z.string()).default([]),
  spcf_producto: z.record(z.any()).default({}),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  onSubmit: (data: ProductFormData) => void;
  isLoading?: boolean;
  initialData?: Partial<ProductFormData>;
}

export const ProductForm: React.FC<ProductFormProps> = ({ 
  onSubmit, 
  isLoading = false,
  initialData 
}) => {
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
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
      cod_producto: initialData?.cod_producto || '',
      tags: initialData?.tags || [],
      spcf_producto: initialData?.spcf_producto || {},
    },
  });

  const watchedTags = watch('tags');
  const [newTag, setNewTag] = React.useState('');

  const addTag = () => {
    if (newTag.trim() && !watchedTags.includes(newTag.trim())) {
      setValue('tags', [...watchedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove));
  };

  const handleFormSubmit = (data: ProductFormData) => {
    // Convertir strings a números para campos numéricos
    const formattedData = {
      ...data,
      val_precio: parseFloat(data.val_precio),
      num_stock: parseInt(data.num_stock),
      id_categoria: parseInt(data.id_categoria),
      id_marca: parseInt(data.id_marca),
      id_linea: parseInt(data.id_linea),
      id_sublinea: parseInt(data.id_sublinea),
      id_proveedor: parseInt(data.id_proveedor),
    };
    
    onSubmit(formattedData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
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

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="des_producto">Descripción *</Label>
            <Textarea
              id="des_producto"
              {...register('des_producto')}
              placeholder="Ingresa la descripción del producto"
              className={errors.des_producto ? 'border-red-500' : ''}
              rows={4}
            />
            {errors.des_producto && (
              <p className="text-sm text-red-500">{errors.des_producto.message}</p>
            )}
          </div>

          {/* Categoría y Marca */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="id_categoria">Categoría *</Label>
              <Select 
                onChange={(e) => setValue('id_categoria', e.target.value)}
                className={errors.id_categoria ? 'border-red-500' : ''}
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((category) => (
                  <option key={category.id_categoria} value={category.id_categoria.toString()}>
                    {category.nom_categoria}
                  </option>
                ))}
              </Select>
              {errors.id_categoria && (
                <p className="text-sm text-red-500">{errors.id_categoria.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="id_marca">Marca *</Label>
              <Select 
                onChange={(e) => setValue('id_marca', e.target.value)}
                className={errors.id_marca ? 'border-red-500' : ''}
              >
                <option value="">Selecciona una marca</option>
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
              <Label htmlFor="id_linea">Línea *</Label>
              <Input
                id="id_linea"
                {...register('id_linea')}
                placeholder="ID de la línea"
                className={errors.id_linea ? 'border-red-500' : ''}
              />
              {errors.id_linea && (
                <p className="text-sm text-red-500">{errors.id_linea.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="id_sublinea">Sublínea *</Label>
              <Input
                id="id_sublinea"
                {...register('id_sublinea')}
                placeholder="ID de la sublínea"
                className={errors.id_sublinea ? 'border-red-500' : ''}
              />
              {errors.id_sublinea && (
                <p className="text-sm text-red-500">{errors.id_sublinea.message}</p>
              )}
            </div>
          </div>

          {/* Proveedor */}
          <div className="space-y-2">
            <Label htmlFor="id_proveedor">Proveedor *</Label>
            <Input
              id="id_proveedor"
              {...register('id_proveedor')}
              placeholder="ID del proveedor"
              className={errors.id_proveedor ? 'border-red-500' : ''}
            />
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
                {...register('val_precio')}
                placeholder="0.00"
                type="number"
                step="0.01"
                min="0"
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

          <div className="space-y-2">
            <Label htmlFor="cod_producto">Código del Producto *</Label>
            <Input
              id="cod_producto"
              {...register('cod_producto')}
              placeholder="SKU o código interno"
              className={errors.cod_producto ? 'border-red-500' : ''}
            />
            {errors.cod_producto && (
              <p className="text-sm text-red-500">{errors.cod_producto.message}</p>
            )}
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
          disabled={!isValid || isLoading}
          className="bg-black hover:bg-gray-800 text-white"
        >
          {isLoading ? 'CREANDO...' : 'CREAR PRODUCTO'}
        </Button>
      </div>
    </form>
  );
};
