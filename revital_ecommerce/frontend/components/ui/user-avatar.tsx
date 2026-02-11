"use client";

import { Facehash } from "facehash";
import { cn } from "@/lib/utils";
import type { UserPublic } from "@/types";

interface UserAvatarProps {
  user: Pick<UserPublic, "nom_usuario" | "ape_usuario" | "email_usuario"> & {
    avatar_seed?: string | null;
    avatar_colors?: string | null;
  };
  size?: number;
  className?: string;
  variant?: "round" | "square" | "squircle";
}

/**
 * Componente de avatar de usuario que usa Facehash.
 * Soporta avatar_seed y avatar_colors (hex separados por coma).
 */
export function UserAvatar({
  user,
  size = 40,
  className,
  variant = "square",
}: UserAvatarProps) {
  const seed = user.avatar_seed || user.email_usuario || `${user.nom_usuario} ${user.ape_usuario}`;
  const colors =
    user.avatar_colors && user.avatar_colors.trim()
      ? user.avatar_colors.split(",").map((c) => c.trim()).filter(Boolean)
      : undefined;

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center overflow-hidden",
        variant === "round" && "rounded-full",
        variant === "square" && "rounded-md",
        variant === "squircle" && "rounded-lg",
        className
      )}
    >
      <Facehash
        name={seed}
        size={size}
        variant="gradient"
        intensity3d="subtle"
        showInitial={true}
        colors={colors}
        className={cn(
          variant === "round" && "rounded-full",
          variant === "square" && "rounded-none",
          variant === "squircle" && "rounded-lg"
        )}
      />
    </div>
  );
}
