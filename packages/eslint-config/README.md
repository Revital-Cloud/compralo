# `@synkro/eslint-config`

Configuración compartida de ESLint para el monorepo de Synkro.

## 📦 Descripción

Este paquete contiene la configuración centralizada de ESLint que se utiliza en todos los proyectos del monorepo (frontends de Next.js, packages compartidos, etc.).

## 🚀 Uso

### En un proyecto Next.js

```json
// package.json
{
  "name": "my-app",
  "devDependencies": {
    "@synkro/eslint-config": "workspace:*"
  }
}
```

```js
// .eslintrc.js o eslint.config.js
module.exports = {
  extends: ["@synkro/eslint-config"],
  // Configuraciones específicas del proyecto
};
```

### En un package compartido

```json
// package.json
{
  "name": "@synkro/ui",
  "devDependencies": {
    "@synkro/eslint-config": "workspace:*"
  }
}
```

## 🛠️ Configuración

Esta configuración incluye:

- **Next.js**: Reglas optimizadas para Next.js 16+
- **TypeScript**: Reglas de TypeScript estrictas
- **React**: Mejores prácticas de React
- **Import/Export**: Organización de imports
- **Prettier**: Integración con Prettier (si está configurado)

## 📝 Scripts

```bash
# Desde la raíz del monorepo
pnpm lint              # Lint en todos los proyectos
pnpm lint:fix          # Lint con corrección automática
```

## 🔄 Actualización

Para actualizar la configuración en todos los proyectos:

1. Modifica este paquete
2. Ejecuta `pnpm install` desde la raíz
3. Todos los proyectos heredarán los cambios automáticamente

---

**ESLint Config** - Configuración compartida para el monorepo Synkro 🔧
