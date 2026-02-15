'use client';

import React from 'react';
import { ProductCard } from './product-card';
import { Product } from '@/types/product';

interface ProductsGridProps {
  products: Product[];
  onDelete?: (id: number) => void;
  isLoading?: boolean;
}

export const ProductsGrid: React.FC<ProductsGridProps> = ({ 
  products, 
  onDelete, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-72"></div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        {/* Icono mejorado con gradiente */}
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          {/* Decoración adicional */}
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-accent" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Contenido mejorado */}
        <div className="text-center max-w-md">
          <h3 className="text-2xl font-bold text-foreground mb-3">
            ¡Tu tienda está lista para productos!
          </h3>
          <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
            Para crear productos necesitas tener definidas primero tus estructuras base.
          </p>

          {/* Botones de acción mejorados */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/admin/products/create" 
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <svg className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Agregar Producto
            </a>
            
            <button className="inline-flex items-center justify-center px-6 py-3 border-2 border-border text-foreground font-semibold rounded-lg hover:bg-muted/50 transition-all duration-200 group">
              <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Importar Excel
            </button>
          </div>

          {/* Requisitos previos */}
          <div className="mt-8 p-6 bg-muted/30 rounded-xl border border-border text-left">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-accent" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.707 5.293a1 1 0 010 1.414L7.414 10l3.293 3.293a1 1 0 11-1.414 1.414L5.293 10.707a1 1 0 010-1.414L9.293 5.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Requisitos para crear un producto
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>
                - Crear <a href="/admin/categories" className="text-primary hover:underline">Categorías</a>
              </li>
              <li>
                - Definir <a href="/admin/lines" className="text-primary hover:underline">Líneas</a> y <a href="/admin/sublines" className="text-primary hover:underline">Sublíneas</a>
              </li>
              <li>
                - Registrar <a href="/admin/brands" className="text-primary hover:underline">Marcas</a>
              </li>
              <li>
                - Agregar <a href="/admin/providers" className="text-primary hover:underline">Proveedores</a>
              </li>
            </ul>
          </div>

          {/* Tips adicionales */}
          <div className="mt-12 p-6 bg-muted/30 rounded-xl border border-border">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-accent" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Consejos para empezar
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2 text-left">
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Agrega imágenes de alta calidad para tus productos
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Organiza tus productos en categorías claras
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Usa descripciones detalladas y atractivas
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map((product) => (
        <ProductCard 
          key={product.id}
          product={product} 
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
