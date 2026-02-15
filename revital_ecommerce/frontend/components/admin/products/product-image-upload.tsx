'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui";
import { IconUpload, IconX, IconCheck, IconCamera, IconTrash } from "@tabler/icons-react";
import { useDropzone } from 'react-dropzone';
import { toast } from "sonner";

interface ProductImage {
  id: string;
  file: File;
  preview: string;
  uploaded: boolean;
  uploading: boolean;
  loaded: boolean;
  error: boolean;
}

interface ProductImageUploadProps {
  onImagesChange: (images: ProductImage[]) => void;
  maxImages?: number;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // en MB
  existingImages?: any; // Imágenes existentes del producto
}

export const ProductImageUpload: React.FC<ProductImageUploadProps> = ({
  onImagesChange,
  maxImages = 10,
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSize = 5, // 5MB por defecto
  existingImages
}) => {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);

  // Procesar imágenes existentes al cargar el componente
  React.useEffect(() => {
    if (!existingImages) {
      setExistingImageUrls([]);
      return;
    }
    const urls: string[] = [];
    if (typeof existingImages === 'string') {
      urls.push(existingImages);
    } else if (existingImages.main) {
      urls.push(existingImages.main);
      if (existingImages.gallery && Array.isArray(existingImages.gallery)) {
        urls.push(...existingImages.gallery);
      }
    }
    setExistingImageUrls(urls);
  }, [existingImages]);

  // Limpiar URLs de preview al desmontar el componente
  React.useEffect(() => {
    return () => {
      images.forEach(image => {
        if (image.preview.startsWith('blob:')) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, [images]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('Archivos aceptados:', acceptedFiles);
    
    const newImages: ProductImage[] = acceptedFiles.map(file => {
      const previewUrl = URL.createObjectURL(file);
      console.log('URL de preview generada:', previewUrl);
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: previewUrl,
        uploaded: false,
        uploading: false,
        loaded: false,
        error: false
      };
    });

    const updatedImages = [...images, ...newImages].slice(0, maxImages);
    console.log('Imágenes actualizadas:', updatedImages);
    
    setImages(updatedImages);
    onImagesChange(updatedImages);

    if (acceptedFiles.length > 0) {
      toast.success(`${acceptedFiles.length} imagen(es) agregada(s)`);
    }
  }, [images, maxImages, onImagesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxSize: maxFileSize * 1024 * 1024, // Convertir MB a bytes
    multiple: true,
    disabled: images.length >= maxImages
  });

  const removeImage = (imageId: string) => {
    const imageToRemove = images.find(img => img.id === imageId);
    if (imageToRemove && imageToRemove.preview.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    
    const updatedImages = images.filter(img => img.id !== imageId);
    setImages(updatedImages);
    onImagesChange(updatedImages);
    toast.info('Imagen removida');
  };

  const uploadImage = async (image: ProductImage) => {
    // Simular subida de imagen
    setImages(prev => prev.map(img => 
      img.id === image.id ? { ...img, uploading: true } : img
    ));

    try {
      // Aquí iría la lógica real de subida a Cloudinary o similar
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simular delay
      
      setImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, uploaded: true, uploading: false } : img
      ));
      
      toast.success('Imagen subida exitosamente');
    } catch (error) {
      setImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, uploading: false } : img
      ));
      toast.error('Error al subir la imagen');
    }
  };

  const uploadAllImages = async () => {
    const unuploadedImages = images.filter(img => !img.uploaded && !img.uploading);
    
    if (unuploadedImages.length === 0) {
      toast.info('Todas las imágenes ya están subidas');
      return;
    }

    for (const image of unuploadedImages) {
      await uploadImage(image);
    }
  };

  return (
    <div className="space-y-6">
      {/* Imagen Principal */}
      <Card>
        <CardHeader>
          <CardTitle>Imagen Principal</CardTitle>
          <CardDescription>
            Imagen que se muestra primero en la ficha del producto. Si el producto tiene variantes (color, almacenamiento, etc.), esta imagen se verá cuando el cliente aún no haya elegido opciones; así no se preselecciona un color.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            {images.length > 0 ? (
              <img 
                src={images[0].preview} 
                alt="Imagen principal"
                className="w-full h-full object-cover rounded-lg"
              />
            ) : existingImageUrls.length > 0 ? (
              <img 
                src={existingImageUrls[0]} 
                alt="Imagen principal existente"
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="text-center">
                <IconCamera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Sin imagen principal</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Galería de Imágenes */}
      <Card>
        <CardHeader>
          <CardTitle>Galería del Producto</CardTitle>
          <CardDescription>
            Imágenes por defecto del producto (se muestran cuando no hay variante elegida). Sube hasta {maxImages} imágenes (JPEG, PNG, WebP, máximo {maxFileSize}MB cada una).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Área de Subida */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            } ${images.length >= maxImages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <input {...getInputProps()} />
            <IconUpload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            {isDragActive ? (
              <p className="text-sm text-blue-600">Suelta las imágenes aquí</p>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-1">
                  Arrastra tus imágenes aquí, o haz clic para seleccionar
                </p>
                <p className="text-xs text-gray-400">
                  {images.length}/{maxImages} imágenes
                </p>
              </>
            )}
          </div>

          {/* Lista de Imágenes */}
          {(images.length > 0 || existingImageUrls.length > 0) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Imágenes ({images.length + existingImageUrls.length}/{maxImages})
                </h4>
                {images.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Las imágenes se subirán al crear el producto
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Imágenes existentes */}
                {existingImageUrls.map((url, index) => (
                  <div key={`existing-${index}`} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={url} 
                        alt={`Imagen existente ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Badge de imagen existente */}
                    <div className="absolute top-2 right-2">
                      <Badge variant="default" className="bg-blue-100 text-blue-800">
                        Existente
                      </Badge>
                    </div>
                  </div>
                ))}

                {/* Imágenes nuevas - ENFOQUE SIMPLIFICADO */}
                {images.map((image) => (
                  <div key={image.id} className="relative group">
                    {/* Contenedor de imagen */}
                    <div 
                      className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900"
                      style={{
                        backgroundImage: `url(${image.preview})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                      }}
                    >
                      {/* Spinner de carga */}
                      {!image.loaded && (
                        <div className="w-full h-full flex items-center justify-center bg-white/90 dark:bg-gray-900/90">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mx-auto mb-2"></div>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Cargando...</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Mensaje de error */}
                      {image.loaded && image.error && (
                        <div className="w-full h-full flex items-center justify-center bg-red-50/95 dark:bg-red-900/50">
                          <div className="text-center p-4">
                            <IconCamera className="h-10 w-10 mx-auto mb-2 text-red-500" />
                            <p className="text-xs font-semibold text-red-700 dark:text-red-300">Error al cargar</p>
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1 truncate max-w-[150px] mx-auto">
                              {image.file.name}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Imagen invisible para activar eventos */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={image.preview} 
                        alt={image.file.name}
                        className="hidden"
                        onLoad={(e) => {
                          console.log('✅ Imagen cargada:', image.file.name);
                          const img = e.currentTarget;
                          console.log('📐 Dimensiones:', {
                            natural: `${img.naturalWidth}x${img.naturalHeight}`,
                            tipo: image.file.type,
                            tamaño: `${(image.file.size / 1024).toFixed(1)} KB`
                          });
                          setImages(prev => prev.map(img => 
                            img.id === image.id ? { ...img, loaded: true, error: false } : img
                          ));
                        }}
                        onError={() => {
                          console.error('❌ Error:', image.file.name);
                          setImages(prev => prev.map(img => 
                            img.id === image.id ? { ...img, loaded: true, error: true } : img
                          ));
                        }}
                      />
                    </div>
                    
                    {/* Overlay con acciones - SOLO cuando la imagen está cargada */}
                    {image.loaded && !image.error && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center rounded-lg">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeImage(image.id)}
                            className="shadow-lg"
                          >
                            <IconTrash className="h-4 w-4 mr-2" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Badge de estado */}
                    <div className="absolute top-2 right-2">
                      {image.loaded && !image.error && (
                        <Badge variant="outline" className="bg-white/95 dark:bg-gray-800/95 shadow-lg backdrop-blur-sm">
                          <IconCheck className="h-3 w-3 mr-1 text-green-600" />
                          Listo
                        </Badge>
                      )}
                    </div>

                    {/* Información del archivo */}
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="bg-black/75 backdrop-blur-sm px-3 py-1.5 rounded-md">
                        <p className="text-xs font-medium text-white truncate">
                          {image.file.name}
                        </p>
                        <p className="text-[10px] text-gray-300">
                          {(image.file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mensaje cuando no hay imágenes */}
          {images.length === 0 && existingImageUrls.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <IconCamera className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No hay imágenes seleccionadas</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
