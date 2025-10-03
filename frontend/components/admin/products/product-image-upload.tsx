'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconUpload, IconX, IconCheck, IconCamera, IconTrash } from "@tabler/icons-react";
import { useDropzone } from 'react-dropzone';
import { toast } from "sonner";

interface ProductImage {
  id: string;
  file: File;
  preview: string;
  uploaded: boolean;
  uploading: boolean;
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
    if (existingImages) {
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
    }
  }, [existingImages]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages: ProductImage[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      uploaded: false,
      uploading: false
    }));

    const updatedImages = [...images, ...newImages].slice(0, maxImages);
    setImages(updatedImages);
    onImagesChange(updatedImages);

    if (acceptedFiles.length > 0) {
      toast.success(`${acceptedFiles.length} imagen(es) agregada(s)`);
    }
  }, [images, maxImages, onImagesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': acceptedFileTypes
    },
    maxSize: maxFileSize * 1024 * 1024, // Convertir MB a bytes
    multiple: true,
    disabled: images.length >= maxImages
  });

  const removeImage = (imageId: string) => {
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
          <CardDescription>Imagen destacada del producto</CardDescription>
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
            Sube hasta {maxImages} imágenes (JPEG, PNG, WebP, máximo {maxFileSize}MB cada una)
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
                <h4 className="text-sm font-medium">
                  Imágenes ({images.length + existingImageUrls.length}/{maxImages})
                </h4>
                {images.length > 0 && (
                  <Button 
                    onClick={uploadAllImages} 
                    variant="outline" 
                    size="sm"
                    disabled={images.every(img => img.uploaded || img.uploading)}
                  >
                    Subir Todas
                  </Button>
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

                {/* Imágenes nuevas */}
                {images.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={image.preview} 
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Overlay con acciones */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                        {!image.uploaded && !image.uploading && (
                          <Button
                            size="sm"
                            onClick={() => uploadImage(image)}
                            className="bg-white text-black hover:bg-gray-100"
                          >
                            Subir
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeImage(image.id)}
                          className="bg-white text-red-600 hover:bg-red-50"
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Badges de estado */}
                    <div className="absolute top-2 right-2">
                      {image.uploading && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Subiendo...
                        </Badge>
                      )}
                      {image.uploaded && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <IconCheck className="h-3 w-3 mr-1" />
                          Subida
                        </Badge>
                      )}
                    </div>

                    {/* Información del archivo */}
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-xs text-white bg-black bg-opacity-70 px-2 py-1 rounded truncate">
                        {image.file.name}
                      </p>
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
