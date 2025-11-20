// Configuración y constantes del proyecto Synkro

export const siteConfig = {
  name: "Synkro",
  description:
    "La plataforma e-commerce todo-en-uno diseñada para el mercado colombiano",
  url: "https://synkro.com",
  ogImage: "https://synkro.com/og.jpg",
  links: {
    twitter: "https://twitter.com/synkro",
    github: "https://github.com/synkro",
    linkedin: "https://linkedin.com/company/synkro",
  },
};

export const appConfig = {
  // URLs de la aplicación principal
  appUrl: "https://app.synkro.com",
  registerUrl: "https://app.synkro.com/register",
  loginUrl: "https://app.synkro.com/login",
  dashboardUrl: "https://app.synkro.com/dashboard",

  // URLs con planes específicos
  registerWithPlan: {
    emprendedor: "https://app.synkro.com/register?plan=emprendedor",
    profesional: "https://app.synkro.com/register?plan=profesional",
    enterprise: "https://app.synkro.com/contact?plan=enterprise",
  },

  // URLs de documentación y soporte
  docsUrl: "https://docs.synkro.com",
  supportUrl: "https://support.synkro.com",
  statusUrl: "https://status.synkro.com",
};

export const contactConfig = {
  email: "hola@synkro.com",
  phone: "+57 1 234 5678",
  address: "Bogotá, Colombia",
  supportEmail: "soporte@synkro.com",
  salesEmail: "ventas@synkro.com",
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
    basicCMS: true,
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
