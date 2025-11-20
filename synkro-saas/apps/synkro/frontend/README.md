# Synkro Landing Page

> La plataforma e-commerce todo-en-uno diseñada para el mercado colombiano

## 🚀 Descripción

Landing page moderna y responsive para Synkro, una plataforma SaaS de e-commerce integral que incluye:

- 📊 Panel de estadísticas en tiempo real
- 📦 Gestor de productos simplificado con SEO automático
- 💳 Integración nativa con Wompi, Stripe y PayPal
- 📝 CMS headless integrado y flexible
- 🎯 Herramientas de marketing y descuentos configurables

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 15+
- **React**: 19+
- **UI Components**: ShadcnUI
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **TypeScript**: Para type safety
- **Deployment**: Vercel (recomendado)

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

1. **Clonar el repositorio**

```bash
git clone <repository-url>
cd synkro_landing
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Ejecutar en desarrollo**

```bash
npm run dev
```

4. **Abrir en el navegador**

```
http://localhost:3000
```

## 📝 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linter ESLint
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

- **App Principal**: https://app.synkro.com
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
