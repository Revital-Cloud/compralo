"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Star } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { UserPublic } from "@/types/auth";

interface ProfileHeaderProps {
  user: UserPublic;
  isEditing: boolean;
  onEditToggle: () => void;
}

export default function ProfileHeader({ user, isEditing, onEditToggle }: ProfileHeaderProps) {
  return (
    <div className="bg-card border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src="" alt="Profile" />
              <AvatarFallback>{getInitials(`${user.nom_usuario} ${user.ape_usuario}`)}</AvatarFallback>
            </Avatar>
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