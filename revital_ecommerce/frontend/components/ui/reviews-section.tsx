"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Button } from "@/components/ui";
import { ReviewForm } from "@/components/ui";
import { MessageSquare, User, Calendar } from "lucide-react";
import { getProductComments, createComment, Comment } from "@/services/review.service";
import { StarRating } from "@/components/ui";
import { toast } from "sonner";

interface ReviewsSectionProps {
  /** Slug o id del producto (para GET comentarios) */
  productId: string;
  /** id_producto numérico (tab_products.id) para crear comentario */
  idProducto: number;
  productName: string;
  onReviewSubmit?: (rating: number, comment: string) => void;
}

export function ReviewsSection({
  productId,
  idProducto,
  productName,
  onReviewSubmit
}: ReviewsSectionProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: commentsResponse, isLoading, refetch } = useQuery({
    queryKey: ["comments", productId],
    queryFn: () => getProductComments(productId),
    enabled: !!productId,
  });

  const comments = commentsResponse?.data || [];

  const handleReviewSubmit = async (rating: number, comment: string) => {
    setIsSubmitting(true);
    try {
      await createComment({
        id_producto: idProducto,
        id_orden: 0,
        comentario: comment,
        calificacion: rating
      });
      
      // Refrescar los comentarios
      await refetch();
      
      // Cerrar el formulario
      setShowReviewForm(false);
      
      // Llamar callback si existe
      if (onReviewSubmit) {
        onReviewSubmit(rating, comment);
      }
      
      toast.success('¡Comentario enviado exitosamente!');
    } catch (error: any) {
      console.error('Error al enviar comentario:', error);
      
      // Extraer el mensaje de error del backend
      let errorMessage = 'Error al enviar el comentario. Inténtalo de nuevo.';
      
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Mostrar el mensaje de error específico
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };


  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha no disponible';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Reseñas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando comentarios...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comentarios ({comments.length})
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Formulario de reseña */}
        {showReviewForm && (
          <ReviewForm
            productName={productName}
            onSubmit={handleReviewSubmit}
            onCancel={() => setShowReviewForm(false)}
            isLoading={isSubmitting}
          />
        )}

        {/* Lista de comentarios */}
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay comentarios para este producto</p>
            <p className="text-sm text-muted-foreground">
              Sé el primero en escribir un comentario
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id_comentario} className="border rounded-lg p-4">
                <div className="flex items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {comment.nombre_usuario || 'Usuario anónimo'}
                      </p>
                      <div className="flex items-center gap-2">
                        <StarRating 
                          rating={comment.calificacion} 
                          readonly 
                          size="sm"
                        />
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(comment.fec_insert)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-2">
                  <p className="text-sm leading-relaxed">{comment.comentario}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
