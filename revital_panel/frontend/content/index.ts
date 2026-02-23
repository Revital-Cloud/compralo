// Contenido estático de la landing page de Revital

export const heroContent = {
  title: "La Plataforma E-commerce Todo-en-Uno para Colombia",
  subtitle:
    "Crea, gestiona y escala tu tienda online con nuestra plataforma integral. Panel de estadísticas en tiempo real, gestor de productos con SEO automático y herramientas de marketing.",
  primaryButton: "Crear Mi Tienda",
  secondaryButton: "Solicitar Demo",
  features: [
    "Integración nativa con Wompi para Colombia",
    "Panel de estadísticas detallado en tiempo real",
    "Gestor de productos simplificado con SEO automático",
    "Asistente de IA para revisar tu tienda",
  ],
};

export const navigationContent = {
  logo: "Revital",
  menuItems: [
    { label: "Características", href: "#features" },
    { label: "Seguridad", href: "#security" },
    { label: "Precios", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ],
  ctaButton: "Comenzar Gratis",
};

export const featuresContent = {
  title: "Todo lo que necesitas para vender online",
  subtitle:
    "Una plataforma completa diseñada específicamente para el mercado colombiano",
  features: [
    {
      title: "Panel de Estadísticas",
      description:
        "Monitorea ventas, inventario y clientes en tiempo real con dashboards intuitivos",
      icon: "📊",
    },
    {
      title: "Gestor de Productos",
      description:
        "Carga masiva, gestión de inventario y precios con SEO automático",
      icon: "📦",
    },
    {
      title: "Integración Wompi",
      description:
        "Acepta pagos con tarjetas, PSE, Nequi y más métodos colombianos",
      icon: "💳",
    },
    {
      title: "Asistente de IA en tu panel",
      description:
        "Pregunta a la IA por resúmenes de ventas, órdenes pendientes, productos más vendidos o stock bajo y realiza acciones desde el chat.",
      icon: "🤖",
    },
    {
      title: "Marketing Tools",
      description:
        "Descuentos configurables, sistema de puntos y campañas automatizadas",
      icon: "🎯",
    },
    {
      title: "Pagos Seguros",
      description: "Integración completa con Wompi para el mercado colombiano",
      icon: "🌐",
    },
  ],
};

export const securityContent = {
  title: "Seguridad de Nivel Empresarial",
  subtitle:
    "Tu tienda y datos están protegidos con los más altos estándares de seguridad",
  features: [
    {
      title: "Certificación SSL",
      description:
        "Todas las transacciones están encriptadas con certificados SSL de última generación",
      icon: "🔒",
    },
    {
      title: "Cumplimiento PCI DSS",
      description:
        "Procesamiento de pagos que cumple con los estándares internacionales de seguridad",
      icon: "🛡️",
    },
    {
      title: "Backups Automáticos",
      description:
        "Respaldos diarios automáticos con recuperación rápida en caso de emergencia",
      icon: "💾",
    },
    {
      title: "Monitoreo Continuo",
      description:
        "Supervisión de la infraestructura para garantizar máxima disponibilidad",
      icon: "👁️",
    },
  ],
};

export const pricingContent = {
  title: "Planes que se adaptan a tu negocio",
  subtitle: "Comienza gratis y escala según crezcas",
  plans: [
    {
      name: "Emprendedor",
      price: "$0",
      period: "/mes",
      description: "Perfecto para comenzar tu tienda online",
      features: [
        "Hasta 100 productos",
        "Integración Wompi básica",
        "Panel de estadísticas básico",
        "Soporte por email",
        "SSL incluido",
        "Dominio .revital.cloud",
      ],
      cta: "Comenzar Ahora",
      popular: false,
    },
    {
      name: "Profesional",
      price: "$49",
      period: "/mes",
      description: "Para negocios en crecimiento",
      features: [
        "Productos ilimitados",
        "Todas las integraciones de pago",
        "Panel avanzado + analytics",
        "Asistente de IA en el panel admin",
        "Soporte prioritario",
        "Dominio personalizado",
        "Marketing automation",
        "API completa",
      ],
      cta: "Elegir Plan",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Personalizado",
      period: "",
      description: "Soluciones a medida para grandes empresas",
      features: [
        "Todo del plan Profesional",
        "Soporte prioritario",
        "Integraciones personalizadas",
        "SLA garantizado",
        "Consultoría especializada",
        "Infraestructura dedicada",
      ],
      cta: "Contactar Ventas",
      popular: false,
    },
  ],
};

export const faqContent = {
  title: "Preguntas Frecuentes",
  subtitle: "Resolvemos las dudas más comunes sobre Revital",
  questions: [
    {
      question: "¿Qué incluye la integración con Wompi?",
      answer:
        "Nuestra integración con Wompi incluye procesamiento de pagos con tarjetas de crédito/débito, PSE, Nequi y otros métodos populares en Colombia. Configuración automática de webhooks, manejo de estados de pago y reconciliación automática.",
    },
    {
      question: "¿Qué hace el asistente de IA?",
      answer:
        "El asistente de IA del panel te ayuda a revisar cómo va tu tienda: puede darte resúmenes de ventas, mostrar órdenes pendientes o recientes, productos más vendidos y alertas de stock. También puede ayudarte a crear marcas, categorías y descuentos desde el chat, sin que tengas que buscar cada pantalla.",
    },
    {
      question: "¿Qué tipo de soporte técnico ofrecen?",
      answer:
        "Ofrecemos soporte por email en todos los planes, chat prioritario en el plan Profesional, y soporte prioritario en el plan Corporativo. También incluimos documentación completa, tutoriales en video y webinars mensuales.",
    },
    {
      question: "¿Puedo personalizar el diseño de mi tienda?",
      answer:
        "Sí, incluimos templates prediseñados y un editor visual básico para personalizar colores, logos y contenido. Ideal para empezar rápidamente con un diseño profesional.",
    },
    {
      question: "¿Cómo manejan la seguridad y el cumplimiento?",
      answer:
        "Cumplimos con estándares PCI DSS para pagos, usamos encriptación SSL/TLS, backups automáticos diarios, y seguimos las mejores prácticas de seguridad. Todos los datos están protegidos y almacenados en servidores certificados.",
    },
  ],
};

export const contactContent = {
  title: "¿Listo para comenzar?",
  subtitle: "Contáctanos y te ayudamos a configurar tu tienda",
  form: {
    nameLabel: "Nombre completo",
    emailLabel: "Email",
    companyLabel: "Empresa",
    messageLabel: "Cuéntanos sobre tu proyecto",
    submitButton: "Enviar Mensaje",
  },
};

import {
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  LinkedinIcon,
} from "lucide-react";
import type { FooterContent } from "@/types/footer";

export const footerContent: FooterContent = {
  company: {
    name: "Revital",
    description:
      "La plataforma e-commerce todo-en-uno diseñada para el mercado colombiano.",
  },
  sections: [
    {
      label: "Producto",
      links: [
        { title: "Características", href: "#features" },
        { title: "Precios", href: "#pricing" },
        { title: "Testimonios", href: "#testimonials" },
        { title: "Integraciones", href: "/integraciones" },
      ],
    },
    {
      label: "Empresa",
      links: [
        { title: "Preguntas Frecuentes", href: "/faqs" },
        { title: "Sobre Nosotros", href: "/about" },
        { title: "Política de Privacidad", href: "/privacy" },
        { title: "Términos de Servicio", href: "/terms" },
      ],
    },
    {
      label: "Recursos",
      links: [
        { title: "Blog", href: "/blog" },
        { title: "Actualizaciones", href: "/changelog" },
        { title: "Documentación", href: "/docs" },
        { title: "Soporte", href: "/help" },
      ],
    },
    {
      label: "Síguenos",
      links: [
        {
          title: "Facebook",
          href: "https://facebook.com/revital",
          icon: FacebookIcon,
        },
        {
          title: "Instagram",
          href: "https://instagram.com/revital",
          icon: InstagramIcon,
        },
        {
          title: "Twitter",
          href: "https://twitter.com/revital",
          icon: TwitterIcon,
        },
        {
          title: "LinkedIn",
          href: "https://linkedin.com/company/revital",
          icon: LinkedinIcon,
        },
      ],
    },
  ],
  social: {
    facebook: "https://facebook.com/revital",
    instagram: "https://instagram.com/revital",
    twitter: "https://twitter.com/revital",
    linkedin: "https://linkedin.com/company/revital",
  },
  copyright: `© ${new Date().getFullYear()} Revital. Todos los derechos reservados.`,
};
