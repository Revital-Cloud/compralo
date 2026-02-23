// Configuración y constantes del proyecto Revital

export const siteConfig = {
  name: "Revital",
  description:
    "La plataforma e-commerce todo-en-uno diseñada para el mercado colombiano",
  url: "https://panel.revital.cloud",
  ogImage: "https://panel.revital.cloud/og.jpg",
  links: {
    twitter: "https://twitter.com/revital",
    github: "https://github.com/revital",
    linkedin: "https://linkedin.com/company/revital",
  },
};

export const appConfig = {
  // URLs de la aplicación principal
  appUrl: "https://panel.revital.cloud",
  registerUrl: "https://panel.revital.cloud/register",
  loginUrl: "https://panel.revital.cloud/login",
  dashboardUrl: "https://panel.revital.cloud/dashboard",

  // URLs con planes específicos
  registerWithPlan: {
    emprendedor: "https://panel.revital.cloud/register?plan=emprendedor",
    profesional: "https://panel.revital.cloud/register?plan=profesional",
    enterprise: "https://panel.revital.cloud/contact?plan=enterprise",
  },

  // URLs de documentación y soporte
  docsUrl: "https://panel.revital.cloud/docs",
  supportUrl: "https://panel.revital.cloud/support",
  statusUrl: "https://status.panel.revital.cloud",
};

export const contactConfig = {
  email: "hola@revital.com",
  phone: "+57 1 234 5678",
  address: "Bogotá, Colombia",
  supportEmail: "soporte@revital.com",
  salesEmail: "ventas@revital.com",
};

export const integrationConfig = {
  // Pasarelas de pago soportadas
  paymentGateways: [
    {
      name: "Wompi",
      logo: "/images/integrations/wompi.svg",
      description: "Pagos locales en Colombia",
      methods: ["Tarjetas", "PSE", "Nequi", "Bancolombia"],
    },
    {
      name: "Stripe",
      logo: "/images/integrations/stripe.svg",
      description: "Pagos internacionales",
      methods: ["Tarjetas", "Apple Pay", "Google Pay"],
    },
    {
      name: "PayPal",
      logo: "/images/integrations/paypal.svg",
      description: "Pagos globales",
      methods: ["PayPal", "Tarjetas"],
    },
  ],

  // Integraciones de envío
  shippingProviders: [
    {
      name: "Coordinadora",
      logo: "/images/integrations/coordinadora.svg",
    },
    {
      name: "Servientrega",
      logo: "/images/integrations/servientrega.svg",
    },
    {
      name: "TCC",
      logo: "/images/integrations/tcc.svg",
    },
  ],
};

export const featureFlags = {
  // Características disponibles en V1
  v1Features: {
    basicAnalytics: true,
    productManagement: true,
    wompiIntegration: true,
    basicCMS: false,
    emailSupport: true,
    sslIncluded: true,
  },

  // Características planificadas para V2
  v2Features: {
    advancedAnalytics: false,
    multiStore: false,
    apiAccess: false,
    customDomains: false,
    prioritySupport: false,
    marketingAutomation: false,
  },
};
