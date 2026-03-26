"use client";

import { Badge } from "@/components/ui";
import { Button } from "@/components/ui";
import { UserAvatar } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Edit, Pencil, Star } from "lucide-react";
import { UserPublic } from "@/types/auth";

/**
 * Cabecera del perfil.
 *
 * Responsabilidad:
 * - Presentar datos del usuario (`nom_usuario`, `ape_usuario`).
 * - Mostrar un badge de “Usuario Activo”.
 * - Ofrecer interacción de edición:
 *   - botón “Editar Perfil” con estado controlado por el contenedor (`isEditing`)
 *   - edición opcional de avatar mediante `onAvatarClick`
 */
interface ProfileHeaderProps {
  user: UserPublic;
  isEditing: boolean;
  onEditToggle: () => void;
  onAvatarClick?: () => void;
}

export default function ProfileHeader({ user, isEditing, onEditToggle, onAvatarClick }: ProfileHeaderProps) {
  return (
    <div className="bg-card border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="flex items-center space-x-4">
            <div
              role={onAvatarClick ? "button" : undefined}
              onClick={onAvatarClick}
              className={cn(
                "relative rounded-md overflow-hidden",
                onAvatarClick && "cursor-pointer group"
              )}
              aria-label={onAvatarClick ? "Editar avatar" : undefined}
            >
              <UserAvatar user={user} size={80} />
              {onAvatarClick && (
                <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Pencil className="h-8 w-8 text-white" strokeWidth={2} />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">
                {user.nom_usuario} {user.ape_usuario}
              </h1>
              <p className="text-muted-foreground">Cliente registrado</p>
              <div className="flex items-center mt-2 space-x-4">
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  <Star className="w-3 h-3 mr-1" />
                  Usuario Activo
                </Badge>
              </div>
            </div>
            <Button variant={isEditing ? "default" : "outline"} onClick={onEditToggle}>
              <Edit className="w-4 h-4 mr-2" />
              {isEditing ? "Guardar" : "Editar Perfil"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 