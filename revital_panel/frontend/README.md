# Revital Frontend - Landing Page y Panel SaaS 🎨

> Landing page moderna y panel de control para la plataforma SaaS de e-commerce

## 🚀 Descripción

Frontend de Revital que incluye:

- 🌐 **Landing page pública** - Marketing y conversión
- 📊 **Panel de control SaaS** (futuro) - Gestión de instancias de clientes
- 🎯 **Páginas de marketing** - Features, pricing, testimonios
- 🔌 **API REST** - 24+ endpoints para integraciones
- 🎨 **Diseño moderno** - Responsive con dark mode

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 16+ (App Router)
- **React**: 19+
- **TypeScript**: Tipado estático completo
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS 3
- **Animations**: Framer Motion
- **State Management**: React Query, Zustand
- **Package Manager**: pnpm 10.28.0 (requerido)

## 📁 Estructura del Proyecto

```
revital_landing/
├── app/                    # App Router de Next.js
│   ├── layout.tsx         # Layout principal con metadatos
│   ├── page.tsx           # Página principal
│   └── globals.css        # Estilos globales
├── components/            # Componentes React
│   ├── ui/               # Componentes UI reutilizables
│   ├── hero-section-1.tsx
│   ├── header.tsx
│   ├── footer-section.tsx
│   └── ...
├── content/              # Contenido organizado
│   ├── index.ts          # Textos estáticos
│   ├── config.ts         # URLs y configuración
│   └── metadata.ts       # Metadatos SEO
├── lib/                  # Utilidades
└── public/              # Assets estáticos
```

## 🚀 Inicio Rápido

### ⚙️ Gestor de Paquetes

Este proyecto utiliza **pnpm** como gestor de paquetes exclusivo. La configuración está garantizada mediante:

- `packageManager: "pnpm@10.28.0"` en `package.json`
- Archivo `.npmrc` con configuración de pnpm
- Scripts optimizados para pnpm

**No uses `npm` o `yarn`** - El proyecto está configurado para usar pnpm automáticamente.

### Instalación y Configuración

```bash
# Navegar al directorio del frontend
cd revital_panel/frontend

# Instalar dependencias con pnpm
pnpm install

# Variables de entorno: Next.js usa .env.development con `pnpm dev` y .env.production con `pnpm build`/`pnpm start`
cp .env.development.example .env.development 2>/dev/null || true
cp .env.production.example .env.production 2>/dev/null || true

# Ejecutar en desarrollo
pnpm dev
```

La aplicación estará disponible en: **http://localhost:3000**

> **Nota:** Este proyecto usa `pnpm@10.28.0` como gestor de paquetes. El archivo `.npmrc` y `packageManager` en `package.json` garantizan el uso correcto de pnpm. Si intentas usar `npm` o `yarn`, recibirás una advertencia.

## 📝 Scripts Disponibles

```bash
pnpm dev          # Servidor de desarrollo
pnpm build        # Build de producción
pnpm start        # Servidor de producción
pnpm lint         # Linter ESLint
pnpm type-check   # Verificación de tipos TypeScript
```

### Navegación: dev vs producción

En **desarrollo** (`pnpm dev`), cada vez que cambias de ruta (ej. Dashboard → Instance → Resources) verás en la terminal algo como `compile: 75ms` o `compile: 103ms`. Eso es **normal**: Turbopack compila la ruta bajo demanda. La suma de compile + render es lo que notas como demora.

En **producción** (`pnpm build && pnpm start`) no hay compilación al navegar: las rutas ya están compiladas. El cambio de página es prácticamente instantáneo (solo pinta y datos desde React Query si ya están en caché).

Para comprobarlo en local:

```bash
pnpm build && pnpm start
```

Luego navega entre Dashboard, Instance, Resources, etc.: no deberías ver tiempos de compile y la transición será mucho más rápida.

Además, en el panel usamos **prefetch** (hover en el sidebar y prefetch en segundo plano al montar) para que los datos de la siguiente ruta estén en caché antes del clic; eso reduce la espera de datos en dev y en producción.

## 🎨 Características Implementadas

### ✅ Completado

- [x] Hero section con CTAs funcionales
- [x] Navegación con scroll suave
- [x] Sección de características (BentoGrid)
- [x] Showcase de integraciones
- [x] Sección de seguridad
- [x] Pricing con planes
- [x] FAQ actualizado para V1
- [x] Formulario de contacto
- [x] Footer completo
- [x] Responsive design
- [x] Contenido organizado en /content
- [x] Metadatos SEO básicos

### 🔄 Pendiente (Ver V1_CHECKLIST.md)

- [ ] Logo de Revital
- [ ] Screenshots del dashboard
- [ ] Iconos de integraciones
- [ ] Animaciones Framer Motion
- [ ] Formulario funcional

## 🎯 Configuración de Contenido

Todo el contenido está centralizado en la carpeta `/content`:

- **`index.ts`**: Textos de todas las secciones
- **`config.ts`**: URLs, configuración de app, integraciones
- **`metadata.ts`**: SEO, Open Graph, Structured Data

### Ejemplo de uso:

```typescript
import { heroContent, appConfig } from '@/content';

// Usar en componentes
<h1>{heroContent.title}</h1>
<Button onClick={() => window.open(appConfig.registerUrl)}>
  {heroContent.primaryButton}
</Button>
```

## 🔗 Enlaces Importantes

- **Panel / Landing**: https://panel.revital.cloud
- **Registro**: https://panel.revital.cloud/register
- **Documentación**: https://panel.revital.cloud/docs
- **Soporte**: https://panel.revital.cloud/support

## 📋 Roadmap

### V1 (Actual)

- Landing page funcional
- Contenido organizado
- SEO básico
- CTAs que redirigen a la app

### V2 (Futuro)

- Portal híbrido (landing + dashboard)
- Autenticación unificada
- Gestión de tiendas integrada
- Ver `ROADMAP_V2.md` para detalles

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/nueva-caracteristica`)
3. Commit cambios (`git commit -m 'Agregar nueva característica'`)
4. Push al branch (`git push origin feature/nueva-caracteristica`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto es propiedad de Revital. Todos los derechos reservados.

## 📞 Contacto

- **Email**: hola@revital.com
- **Soporte**: soporte@revital.com
- **Ventas**: ventas@revital.com

---

**Desarrollado con ❤️ para el mercado colombiano**
