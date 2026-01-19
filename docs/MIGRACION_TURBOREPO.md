# 🚀 Migración: Eliminación de Turborepo

**Fecha**: $(date)  
**Objetivo**: Eliminar Turborepo y workspaces, migrar a proyectos independientes

---

## ✅ Cambios Realizados

### 1. Copiado de `packages/ui` a cada app
- ✅ Copiado `packages/ui/src` → `apps/ecommerce/frontend/components/ui-package`
- ✅ Copiado `packages/ui/src` → `apps/synkro/frontend/components/ui-package`

### 2. Actualización de Imports
- ✅ Reemplazado todos los imports de `@repo/ui` por `@/components/ui-package`
- ✅ Script creado: `scripts/replace-ui-imports.js` para automatizar el proceso
- ✅ Total de reemplazos: ~1270 imports actualizados

### 3. Actualización de `package.json`
- ✅ Eliminado `@repo/ui: "workspace:*"` de `apps/ecommerce/frontend/package.json`
- ✅ Eliminado `@repo/ui: "workspace:*"` de `apps/synkro/frontend/package.json`
- ✅ Las dependencias directas (radix-ui, etc.) ya estaban presentes

### 4. Actualización de `next.config.ts`
- ✅ Eliminado `transpilePackages: ['@repo/ui']` de ambas apps
- ✅ Mantenidas otras configuraciones (images, headers, etc.)

### 5. Eliminación de Turborepo
- ✅ Eliminado `turbo.json`
- ✅ Actualizado `package.json` root:
  - Eliminados scripts: `build`, `dev`, `lint`, `check-types` (que usaban turbo)
  - Eliminado `turbo` de devDependencies
  - Eliminado `workspaces` array
  - Mantenido solo `format` script y dependencias básicas

### 6. Archivos de Re-export Actualizados
- ✅ `apps/ecommerce/frontend/components/ui/index.ts` → ahora exporta desde `@/components/ui-package`
- ✅ `apps/ecommerce/frontend/components/index.ts` → ahora exporta desde `@/components/ui-package`

---

## 📝 Estado Actual

### Estructura
```
code/
├── apps/
│   ├── ecommerce/
│   │   └── frontend/
│   │       ├── components/
│   │       │   └── ui-package/    # ← Copia local de packages/ui
│   │       ├── package.json        # ← Sin @repo/ui
│   │       └── next.config.ts      # ← Sin transpilePackages
│   └── synkro/
│       └── frontend/
│           ├── components/
│           │   └── ui-package/    # ← Copia local de packages/ui
│           ├── package.json        # ← Sin @repo/ui
│           └── next.config.ts      # ← Sin transpilePackages
├── packages/                        # ← Ya no se usa en workspaces
│   └── ui/                          # ← Mantenido por referencia
└── package.json                     # ← Sin turbo, sin workspaces
```

### `pnpm-workspace.yaml`
⚠️ **Mantenido por ahora** pero ya no se usa activamente. Puede eliminarse si no hay dependencias cruzadas.

---

## 🔄 Próximos Pasos (Opcional)

### Para Completar la Separación Total:

1. **Eliminar `pnpm-workspace.yaml`** (si no hay dependencias cruzadas)
2. **Mover proyectos a `/home/usuario/`** (según plan de separación)
3. **Configurar PostgreSQL nativo** (no Docker para desarrollo)
4. **Actualizar scripts de desarrollo** en cada proyecto

---

## ⚠️ Notas Importantes

- **Código compartido**: `packages/ui` ahora está copiado en cada app. Si necesitas actualizar componentes compartidos, deberás actualizarlos en ambas ubicaciones (o usar Git Submodules en el futuro).

- **Dependencias**: Todas las dependencias de `packages/ui` (radix-ui, etc.) ya están en los `package.json` de cada app, así que no hay problema.

- **Builds**: Ahora cada app se construye independientemente:
  ```bash
  cd apps/ecommerce/frontend
  pnpm install
  pnpm build
  ```

---

## 🧪 Verificación

Para verificar que todo funciona:

```bash
# Ecommerce
cd apps/ecommerce/frontend
pnpm install
pnpm dev

# Synkro
cd apps/synkro/frontend
pnpm install
pnpm dev
```

Si hay errores de imports, verificar que:
- Los archivos en `components/ui-package/` existen
- Los imports usan `@/components/ui-package` (no `@repo/ui`)
- `tsconfig.json` tiene el alias `@/*` configurado correctamente
