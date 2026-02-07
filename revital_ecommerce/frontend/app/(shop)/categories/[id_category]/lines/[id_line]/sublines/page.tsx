'use client';

import { createElement } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSublinesByLine } from '@/hooks/use-sublines';
import { useCategory } from '@/hooks/use-categories';
import { useLine } from '@/hooks/use-lines';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Badge } from '@/components/ui';
import { getIconForSubline } from '@/utils/category-mapper';
import { ChevronRight, Package, ArrowLeft } from 'lucide-react';

export default function SublinesPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = Number(params.id_category);
  const lineId = Number(params.id_line);
  
  const { data: sublines, isLoading } = useSublinesByLine(lineId, categoryId);
  const { data: category } = useCategory(categoryId);
  const { data: line } = useLine(lineId, categoryId);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb Navigation */}
      <div className="mb-8">
        <button
          onClick={() => router.push(`/categories/${categoryId}/lines/${lineId}`)}
          className="flex items-center gap-2 text-primary hover:text-primary/90 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Línea
        </button>
        
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span 
            onClick={() => router.push(`/categories/${categoryId}`)} 
            className="cursor-pointer hover:text-primary"
          >
            {category?.nom_categoria}
          </span>
          <ChevronRight className="w-4 h-4" />
          <span 
            onClick={() => router.push(`/categories/${categoryId}/lines/${lineId}`)} 
            className="cursor-pointer hover:text-primary"
          >
            {line?.nom_linea}
          </span>
        </nav>
        
        <h1 className="text-3xl font-bold text-foreground">
          Sublíneas de {line?.nom_linea}
        </h1>
        <p className="text-muted-foreground mt-2">
          Selecciona una sublínea para ver los productos
        </p>
      </div>

      {/* Grid de Sublíneas */}
      {sublines && sublines.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sublines.map((subline, index) => {
            const SublineIcon = getIconForSubline(subline.nom_sublinea);
            return (
              <Card
                key={`${lineId}-${subline.id_sublinea}-${index}`}
                className="cursor-pointer hover:shadow-md transition-all duration-300 hover:scale-105"
                onClick={() => router.push(`/categories/${categoryId}/lines/${lineId}/sublines/${subline.id_sublinea}/products`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                      {createElement(SublineIcon, { className: 'w-5 h-5' })}
                    </div>
                    <div>
                      <CardTitle className="text-base text-card-foreground">{subline.nom_sublinea}</CardTitle>
                      {subline.desc_sublinea && (
                        <p className="text-xs text-muted-foreground">{subline.desc_sublinea}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {subline.productos_count ?? 0} productos
                    </Badge>
                    <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                      Click para explorar →
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No hay sublíneas disponibles
          </h3>
          <p className="text-muted-foreground">
            Esta línea no tiene sublíneas de productos en este momento
          </p>
        </div>
      )}
    </div>
  );
}
