# Synkro Frontend - Landing Page y Panel SaaS 🎨

> Landing page moderna y panel de control para la plataforma SaaS de e-commerce

## 🚀 Descripción

Frontend de Synkro que incluye:

- 🌐 **Landing page pública** - Marketing y conversión
- 📊 **Panel de control SaaS** (futuro) - Gestión de instancias de clientes
- 🎯 **Páginas de marketing** - Features, pricing, testimonios
- 📝 **CMS headless** - Contenido gestionable
- 🎨 **Diseño moderno** - Responsive con dark mode

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 16+ (App Router)
- **React**: 19+
- **TypeScript**: Tipado estático completo
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS 3
- **Animations**: Framer Motion
- **State Management**: React Query, Zustand
- **Package Manager**: pnpm (monorepo)

## 📁 Estructura del Proyecto

```
synkro_landing/
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

### Desde el Monorepo (Recomendado)

```bash
# Desde la raíz del monorepo (code/)
pnpm install          # Instala todas las dependencias
pnpm dev             # Ejecuta todos los proyectos

# O solo este proyecto:
cd apps/synkro/frontend
pnpm dev
```

### Standalone (si es necesario)

```bash
cd apps/synkro/frontend

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.local.example .env.local

# Ejecutar en desarrollo
pnpm dev
```

La aplicación estará disponible en: **http://localhost:3001** (puerto diferente al e-commerce)

## 📝 Scripts Disponibles

```bash
pnpm dev          # Servidor de desarrollo
pnpm build        # Build de producción
pnpm start        # Servidor de producción
pnpm lint         # Linter ESLint
pnpm type-check   # Verificación de tipos TypeScript
```

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

- [ ] Logo de Synkro
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

- **Landing Page**: https://synkro.com
- **App Principal (E-commerce)**: https://app.synkro.com
- **Registro**: https://app.synkro.com/register
- **Documentación**: https://docs.synkro.com
- **Soporte**: https://support.synkro.com

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

Este proyecto es propiedad de Synkro. Todos los derechos reservados.

## 📞 Contacto

- **Email**: hola@synkro.com
- **Soporte**: soporte@synkro.com
- **Ventas**: ventas@synkro.com

---

**Desarrollado con ❤️ para el mercado colombiano**
