"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { Textarea } from "@/components/ui";
import { StarRating } from "@/components/ui";
import { Send, X } from "lucide-react";

interface ReviewFormProps {
  productName: string;
  onSubmit: (rating: number, comment: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ReviewForm({ 
  productName, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating > 0 && comment.trim().length >= 3) {
      onSubmit(rating, comment);
    }
  };

  return (
    <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-sm">Escribe tu reseña para {productName}</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Calificación *
          </label>
          <StarRating
            rating={rating}
            onRatingChange={setRating}
            size="md"
          />
          {rating === 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Selecciona una calificación
            </p>
          )}
        </div>
        
        <div>
          <label htmlFor="comment" className="text-sm font-medium mb-2 block">
            Comentario *
          </label>
          <Textarea
            id="comment"
            placeholder="Comparte tu experiencia con este producto..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[80px] resize-none"
            maxLength={500}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            {comment.length}/500 caracteres
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={rating === 0 || comment.trim().length < 3 || isLoading}
            size="sm"
            className="flex-1"
          >
            {isLoading ? (
              "Enviando..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar reseña
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            size="sm"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
