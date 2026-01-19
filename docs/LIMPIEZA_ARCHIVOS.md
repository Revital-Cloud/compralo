# 🧹 Limpieza de Archivos - Turborepo

## Estado Actual

### `.npmrc`
- **Estado**: Existe pero está vacío (0 bytes)
- **Acción**: ✅ **Dejar como está** - Es un archivo de configuración opcional de npm/pnpm
- **Propósito**: Configuración de npm/pnpm (registry, autenticación, etc.). Si está vacío, usa valores por defecto.

### `pnpm-lock.yaml`
- **Estado**: ⚠️ **Contiene referencias obsoletas** a:
  - `turbo` en devDependencies del root
  - `workspace:*` (4 referencias)
  - `eslint-plugin-turbo`
- **Problema**: Este lockfile fue generado cuando todavía existía Turborepo y workspaces
- **Acción**: 🔄 **Regenerar el lockfile**

## Opciones para `pnpm-lock.yaml`

### Opción A: Eliminar y regenerar (RECOMENDADO)
```bash
cd /srv/synkro/code
rm pnpm-lock.yaml

# Si hay package.json root, regenerar desde ahí
# Si no, cada app regenerará su propio lockfile al hacer pnpm install
```

### Opción B: Mantenerlo (si aún funciona)
- Si las apps funcionan correctamente, puedes dejarlo
- Las referencias a `turbo` y `workspace:*` no afectarán si no se usan
- Pero es mejor limpiarlo para evitar confusión

## Recomendación Final

1. **`.npmrc`**: ✅ Dejar vacío (está bien así)
2. **`pnpm-lock.yaml`**: 🔄 Eliminar y regenerar cuando instales dependencias en cada app

### Pasos para limpiar `pnpm-lock.yaml`:

```bash
cd /srv/synkro/code

# Opción 1: Eliminar completamente (si no hay package.json root)
rm pnpm-lock.yaml

# Opción 2: Si hay package.json root, regenerar desde ahí
# (pero parece que lo eliminaste, así que mejor opción 1)
```

Cada app (`apps/ecommerce/frontend`, `apps/synkro/frontend`) generará su propio `pnpm-lock.yaml` cuando ejecutes `pnpm install` en cada una.
