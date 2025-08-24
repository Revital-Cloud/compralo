'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductImageGalleryProps {
  images: {
    main: string;
    gallery: string[];
    thumbnails: string[];
  };
  productName: string;
  className?: string;
}

export function ProductImageGallery({ images, productName, className = '' }: ProductImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Combinar imagen principal con galería
  const allImages = [images.main, ...images.gallery];
  const allThumbnails = [images.thumbnails[0], ...images.thumbnails.slice(1)];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className={`relative ${className}`}>
      {/* Imagen principal */}
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer" onClick={openModal}>
        <img
          src={allImages[currentImageIndex]}
          alt={`${productName} - Imagen ${currentImageIndex + 1}`}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* Indicador de múltiples imágenes */}
        {allImages.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
            {currentImageIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Navegación de imágenes */}
      {allImages.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md"
            onClick={previousImage}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md"
            onClick={nextImage}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </>
      )}

      {/* Miniaturas */}
      {allThumbnails.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {allThumbnails.map((thumbnail, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                index === currentImageIndex
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img
                src={thumbnail}
                alt={`${productName} - Miniatura ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Modal de imagen completa */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            {/* Botón cerrar */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white z-10"
              onClick={closeModal}
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Imagen principal */}
            <img
              src={allImages[currentImageIndex]}
              alt={`${productName} - Imagen ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />

            {/* Navegación en modal */}
            {allImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white"
                  onClick={previousImage}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white"
                  onClick={nextImage}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>

                {/* Indicador de posición */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} de {allImages.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
