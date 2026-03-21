-- Migración: Agregar deleted_at a tab_usuarios para soft delete
-- Fecha: 2026-03
-- Descripción: Campo para registrar cuándo el usuario desactivó su cuenta.
--              Soft delete: ind_activo = FALSE + deleted_at = timestamp.
--              Reactivación: ind_activo = TRUE + deleted_at = NULL.

ALTER TABLE tab_usuarios
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITHOUT TIME ZONE NULL;
