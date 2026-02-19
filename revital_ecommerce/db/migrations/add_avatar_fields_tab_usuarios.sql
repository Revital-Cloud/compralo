-- Migración: Agregar avatar_seed y avatar_colors a tab_usuarios
-- Fecha: 2026-02
-- Descripción: Campos para el avatar del perfil (Facehash): seed y colores hex.
--              El código (perfil, user_service.get_user, etc.) ya los usa; la tabla no los tenía.

-- 1. avatar_seed: string opcional para el seed del avatar (Facehash)
ALTER TABLE tab_usuarios
ADD COLUMN IF NOT EXISTS avatar_seed VARCHAR;

-- 2. avatar_colors: colores hex separados por coma, ej. "#ec4899,#3b82f6"
ALTER TABLE tab_usuarios
ADD COLUMN IF NOT EXISTS avatar_colors VARCHAR;
