"use client";

import { toast } from "sonner";
import { getStoredToken } from "@/utils/apiWrapper";

// Configuración del widget de Wompi
export interface WompiWidgetConfig {
  currency: string;
  amountInCents: number;
  reference: string;
  publicKey: string;
  signature: {
    integrity: string;
  };
  redirectUrl?: string;
  expirationTime?: string;
  taxInCents?: {
    vat?: number;
    consumption?: number;
  };
  customerData?: {
    email?: string;
    fullName?: string;
    phoneNumber?: string;
    phoneNumberPrefix?: string;
    legalId?: string;
    legalIdType?: string;
  };
  shippingAddress?: {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    phoneNumber?: string;
    region?: string;
    country?: string;
    name?: string;
  };
}

// Métodos de pago permitidos según especificaciones
export const ALLOWED_PAYMENT_METHODS = [
  'CARD', // Tarjetas débito y crédito
  'PSE', // PSE
  'NEQUI', // Nequi
  'BANCOLOMBIA_TRANSFER', // Corresponsal bancario
  'DAVIPLATA' // Daviplata
];

// Configuración de métodos de pago para el widget
export const PAYMENT_METHOD_CONFIG = {
  // Filtrar solo los métodos permitidos
  paymentMethods: ALLOWED_PAYMENT_METHODS,
  // Configuración específica para cada método
  methodsConfig: {
    CARD: {
      enabled: true,
      title: "Tarjetas Débito y Crédito",
      description: "VISA, Mastercard, American Express"
    },
    PSE: {
      enabled: true,
      title: "PSE",
      description: "Débito desde tu cuenta bancaria"
    },
    NEQUI: {
      enabled: true,
      title: "Nequi",
      description: "Paga con tu cuenta Nequi"
    },
    BANCOLOMBIA_TRANSFER: {
      enabled: true,
      title: "Corresponsal Bancario",
      description: "Paga en efectivo en Bancolombia"
    },
    DAVIPLATA: {
      enabled: true,
      title: "Daviplata",
      description: "Paga con tu cuenta Daviplata"
    }
  }
};

// Clase para manejar el widget de Wompi
export class WompiWidgetService {
  private static instance: WompiWidgetService;
  public widgetLoaded = false;
  private widgetScript: HTMLScriptElement | null = null;

  private constructor() {}

  // Diagnóstico del sistema
  async diagnoseSystem(): Promise<{
    connectivity: boolean;
    adBlocker: boolean;
    csp: boolean;
    environment: any;
  }> {
    const diagnosis = {
      connectivity: false,
      adBlocker: false,
      csp: false,
      environment: {
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        cookiesEnabled: navigator.cookieEnabled,
        language: navigator.language,
        platform: navigator.platform,
        referrer: document.referrer,
        protocol: window.location.protocol,
        host: window.location.host
      }
    };

    // Test de conectividad
    try {
      diagnosis.connectivity = await this.checkWompiConnectivity();
    } catch (error) {
      console.warn('Error en test de conectividad:', error);
    }

    // Test de AdBlocker (crear elemento que suele ser bloqueado)
    try {
      const testElement = document.createElement('div');
      testElement.innerHTML = '&nbsp;';
      testElement.className = 'adsbox';
      testElement.style.position = 'absolute';
      testElement.style.left = '-9999px';
      document.body.appendChild(testElement);
      
      setTimeout(() => {
        const isBlocked = testElement.offsetHeight === 0;
        diagnosis.adBlocker = isBlocked;
        document.body.removeChild(testElement);
      }, 100);
    } catch (error) {
      console.warn('Error en test de AdBlocker:', error);
    }

    // Test de CSP más completo
    try {
      const cspRestrictions = await this.detectCSPRestrictions();
      diagnosis.csp = cspRestrictions.scriptSrc || cspRestrictions.formAction;
      
      // Información adicional sobre CSP
      (diagnosis as any).cspDetails = {
        scriptSrcBlocked: cspRestrictions.scriptSrc,
        formActionBlocked: cspRestrictions.formAction,
        connectSrcBlocked: cspRestrictions.connectSrc
      };
    } catch (error) {
      console.warn('Error en test de CSP:', error);
      diagnosis.csp = true; // Asumir bloqueado si hay error
    }

    console.log('Diagnóstico del sistema:', diagnosis);
    return diagnosis;
  }

  static getInstance(): WompiWidgetService {
    if (!WompiWidgetService.instance) {
      WompiWidgetService.instance = new WompiWidgetService();
    }
    return WompiWidgetService.instance;
  }

  // Verificar conectividad a Wompi
  async checkWompiConnectivity(): Promise<boolean> {
    try {
      console.log('🌐 Verificando conectividad a Wompi...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://checkout.wompi.co/widget.js', {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'no-cors' // Evitar problemas de CORS
      });
      
      clearTimeout(timeoutId);
      console.log('✅ Conectividad a Wompi: OK');
      return true;
    } catch (error) {
      console.warn('❌ Problema de conectividad a Wompi:', error);
      return false;
    }
  }

  // Cargar el script del widget de Wompi con reintentos
  async loadWidgetScript(): Promise<void> {
    if (this.widgetLoaded && typeof (window as any).WidgetCheckout !== 'undefined') {
      console.log('✅ Widget ya está cargado y funcional');
      return Promise.resolve();
    }

    // Verificar conectividad primero
    const isConnected = await this.checkWompiConnectivity();
    if (!isConnected) {
      console.warn('⚠️ Problemas de conectividad detectados, pero continuando...');
    }

    return this.loadWidgetScriptWithRetry(3);
  }

  // Cargar script con reintentos
  async loadWidgetScriptWithRetry(maxRetries: number = 3): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Intento ${attempt}/${maxRetries} de carga del script de Wompi`);
        await this.loadWidgetScriptSingle();
        return; // Éxito
      } catch (error) {
        console.warn(`❌ Intento ${attempt} falló:`, error);
        
        if (attempt === maxRetries) {
          throw error; // Último intento, lanzar error
        }
        
        // Esperar antes del siguiente intento (backoff exponencial)
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Cargar el script del widget de Wompi (intento único)
  async loadWidgetScriptSingle(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Verificar si ya existe el script y funciona
      const existingScript = document.querySelector('script[src*="checkout.wompi.co"]');
      if (existingScript && typeof (window as any).WidgetCheckout !== 'undefined') {
        console.log('✅ Script de Wompi ya está cargado y funcional');
        this.widgetLoaded = true;
        resolve();
        return;
      }

      // Limpiar script anterior si existe pero no funciona
      if (existingScript) {
        console.log('🧹 Removiendo script anterior no funcional');
        existingScript.remove();
      }

      console.log('📥 Cargando script del widget de Wompi...');

      // Crear y cargar el script
      this.widgetScript = document.createElement('script');
      this.widgetScript.src = 'https://checkout.wompi.co/widget.js';
      this.widgetScript.type = 'text/javascript';
      this.widgetScript.async = true;
      this.widgetScript.defer = true;
      
      // Timeout más largo para conexiones lentas
      const timeout = setTimeout(() => {
        console.error('⏰ Timeout al cargar el script de Wompi');
        this.cleanup();
        reject(new Error('Timeout al cargar el script del widget de Wompi. Verifica tu conexión a internet.'));
      }, 15000); // 15 segundos

      this.widgetScript.onload = () => {
        clearTimeout(timeout);
        console.log('📦 Script de Wompi cargado, verificando disponibilidad...');
        
        // Esperar un momento para que se inicialice
        setTimeout(() => {
          if (typeof (window as any).WidgetCheckout !== 'undefined') {
            console.log('✅ WidgetCheckout disponible');
            this.widgetLoaded = true;
            resolve();
          } else {
            console.error('❌ WidgetCheckout no está disponible después de cargar');
            this.cleanup();
            reject(new Error('El widget de Wompi no se inicializó correctamente'));
          }
        }, 1000); // Esperar 1 segundo para inicialización
      };

      this.widgetScript.onerror = (event) => {
        clearTimeout(timeout);
        console.error('❌ Error al cargar el script de Wompi:', event);
        
        // Información adicional para debugging
        const errorDetails = {
          src: this.widgetScript?.src,
          userAgent: navigator.userAgent,
          online: navigator.onLine,
          cookiesEnabled: navigator.cookieEnabled,
          language: navigator.language,
          platform: navigator.platform,
          protocol: window.location.protocol,
          host: window.location.host
        };
        
        console.error('🔍 Detalles del sistema:', errorDetails);
        
        this.cleanup();
        
        let errorMessage = 'Error al cargar el script del widget de Wompi';
        
        if (!navigator.onLine) {
          errorMessage += ': Sin conexión a internet';
        } else if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
          errorMessage += ': Se requiere HTTPS para cargar el widget de Wompi';
        } else {
          // Detectar si es específicamente CSP
          const errorString = event?.toString() || '';
          if (errorString.includes('Content Security Policy') || 
              errorString.includes('script-src') ||
              document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
            errorMessage += ': Bloqueado por Content Security Policy (CSP)';
          } else {
            errorMessage += ': Posible bloqueo por firewall, AdBlocker o política de seguridad';
          }
        }
        
        reject(new Error(errorMessage));
      };

      // Agregar el script al head
      try {
        document.head.appendChild(this.widgetScript);
        console.log('📋 Script agregado al DOM');
      } catch (error) {
        clearTimeout(timeout);
        console.error('❌ Error al agregar el script al DOM:', error);
        reject(new Error('Error al agregar el script del widget al DOM'));
      }
    });
  }

  // Generar referencia única de pago
  generatePaymentReference(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `REVITAL-${timestamp}-${random}`;
  }

  // DEPRECATED: Generar firma de integridad (ahora se hace en backend)
  // Mantenido para compatibilidad, pero se recomienda usar createWidgetConfigFromBackend
  async generateIntegritySignature(
    reference: string,
    amountInCents: number,
    currency: string = 'COP',
    expirationTime?: string
  ): Promise<string> {
    console.warn('generateIntegritySignature está deprecado. La firma debe generarse en el backend.');
    
    // Obtener el secreto de integridad desde las variables de entorno
    const integritySecret = process.env.NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET;
    
    if (!integritySecret) {
      throw new Error('NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET no está configurado. Use createWidgetConfigFromBackend en su lugar.');
    }

    // Concatenar valores según documentación de Wompi
    let dataToHash = `${reference}${amountInCents}${currency}${integritySecret}`;
    
    // Si hay tiempo de expiración, agregarlo
    if (expirationTime) {
      dataToHash += expirationTime;
    }

    // Generar hash SHA256
    const encoder = new TextEncoder();
    const data = encoder.encode(dataToHash);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }

  // Crear configuración del widget desde respuesta del backend
  // Este es el método recomendado: la firma se genera en el backend
  createWidgetConfigFromBackend(
    backendResponse: {
      reference: string;
      amount_in_cents: number;
      currency: string;
      public_key: string;
      integrity_signature: string;
    },
    customerData?: WompiWidgetConfig['customerData'],
    shippingAddress?: WompiWidgetConfig['shippingAddress']
  ): WompiWidgetConfig {
    // Filtrar customerData para eliminar campos vacíos o inválidos
    const filteredCustomerData = customerData ? {
      ...(customerData.email ? { email: customerData.email } : {}),
      ...(customerData.fullName ? { fullName: customerData.fullName } : {}),
      ...(customerData.phoneNumber ? { phoneNumber: customerData.phoneNumber } : {}),
      ...(customerData.phoneNumberPrefix ? { phoneNumberPrefix: customerData.phoneNumberPrefix } : {}),
      // Solo incluir legalId y legalIdType si ambos están presentes y no están vacíos
      ...(customerData.legalId && customerData.legalId.trim() && customerData.legalIdType && customerData.legalIdType.trim()
        ? {
            legalId: customerData.legalId,
            legalIdType: customerData.legalIdType
          }
        : {})
    } : undefined;

    const config: WompiWidgetConfig = {
      currency: backendResponse.currency,
      amountInCents: backendResponse.amount_in_cents,
      reference: backendResponse.reference,
      publicKey: backendResponse.public_key,
      signature: {
        integrity: backendResponse.integrity_signature
      },
      // NO incluir redirectUrl - el widget embebido no lo necesita
      customerData: filteredCustomerData,
      shippingAddress
    };

    return config;
  }

  // Crear configuración del widget (DEPRECATED: usar createWidgetConfigFromBackend)
  // Mantenido para compatibilidad con código existente
  async createWidgetConfig(
    amountInCents: number,
    customerData?: WompiWidgetConfig['customerData'],
    shippingAddress?: WompiWidgetConfig['shippingAddress']
  ): Promise<WompiWidgetConfig> {
    console.warn('createWidgetConfig está deprecado. Use createWidgetConfigFromBackend con respuesta del endpoint /api/payments/create');
    
    const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
    
    if (!publicKey) {
      throw new Error('NEXT_PUBLIC_WOMPI_PUBLIC_KEY no está configurado');
    }

    const reference = this.generatePaymentReference();
    const currency = 'COP';
    
    // Generar tiempo de expiración (30 minutos desde ahora)
    const expirationTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    
    // Generar firma de integridad (DEPRECATED: debe hacerse en backend)
    const signature = await this.generateIntegritySignature(
      reference,
      amountInCents,
      currency,
      expirationTime
    );

    // Filtrar customerData para eliminar campos vacíos o inválidos
    const filteredCustomerData = customerData ? {
      ...(customerData.email ? { email: customerData.email } : {}),
      ...(customerData.fullName ? { fullName: customerData.fullName } : {}),
      ...(customerData.phoneNumber ? { phoneNumber: customerData.phoneNumber } : {}),
      ...(customerData.phoneNumberPrefix ? { phoneNumberPrefix: customerData.phoneNumberPrefix } : {}),
      // Solo incluir legalId y legalIdType si ambos están presentes y no están vacíos
      ...(customerData.legalId && customerData.legalId.trim() && customerData.legalIdType && customerData.legalIdType.trim()
        ? {
            legalId: customerData.legalId,
            legalIdType: customerData.legalIdType
          }
        : {})
    } : undefined;

    const config: WompiWidgetConfig = {
      currency,
      amountInCents,
      reference,
      publicKey,
      signature: {
        integrity: signature
      },
      // NO incluir redirectUrl - el widget embebido no lo necesita
      expirationTime,
      customerData: filteredCustomerData,
      shippingAddress
    };

    return config;
  }

  // Abrir el widget de Wompi
  async openWidget(
    config: WompiWidgetConfig,
    onResult?: (result: any) => void
  ): Promise<void> {
    // Definir cleanupErrorHandler fuera del try para que esté disponible en el catch
    let cleanupErrorHandler: (() => void) | null = null;
    
    try {
      console.log('🚀 Iniciando apertura del widget de Wompi...');
      console.log('⚙️ Configuración:', { ...config, signature: '[HIDDEN]' });

      // Validar configuración básica
      if (!config.publicKey) {
        throw new Error('Llave pública de Wompi no configurada');
      }

      if (!config.amountInCents || config.amountInCents <= 0) {
        throw new Error('Monto inválido para el pago');
      }

      // Asegurar que el script esté cargado
      console.log('📥 Cargando script del widget...');
      await this.loadWidgetScript();

      // Verificar que WidgetCheckout esté disponible
      if (typeof (window as any).WidgetCheckout === 'undefined') {
        console.error('❌ WidgetCheckout no está disponible en window');
        console.log('🔍 Propiedades disponibles en window:', Object.keys(window).filter(key => key.toLowerCase().includes('wompi')));
        throw new Error('WidgetCheckout no está disponible. El script de Wompi no se cargó correctamente.');
      }

      console.log('✅ WidgetCheckout disponible, creando instancia...');
      console.log('📋 Configuración completa (sin signature):', {
        currency: config.currency,
        amountInCents: config.amountInCents,
        reference: config.reference,
        publicKey: config.publicKey?.substring(0, 20) + '...',
        redirectUrl: config.redirectUrl,
        expirationTime: config.expirationTime,
        hasCustomerData: !!config.customerData,
        hasShippingAddress: !!config.shippingAddress
      });

      // Validar que la firma de integridad esté presente
      if (!config.signature?.integrity) {
        throw new Error('Firma de integridad faltante. La configuración del widget es inválida.');
      }

      // Validar formato de la referencia
      if (!config.reference || config.reference.trim() === '') {
        throw new Error('Referencia de pago faltante. La configuración del widget es inválida.');
      }

      // Validar que el monto sea válido
      if (!config.amountInCents || config.amountInCents <= 0) {
        throw new Error('Monto inválido. El monto debe ser mayor a 0.');
      }

      // Crear instancia del checkout
      let checkout;
      try {
        // Preparar configuración limpia para el widget
        // IMPORTANTE: Wompi WidgetCheckout acepta tanto camelCase como snake_case
        // pero algunos parámetros deben estar en el formato correcto
        const widgetConfig: any = {
          currency: config.currency,
          amountInCents: config.amountInCents,
          reference: config.reference,
          publicKey: config.publicKey,
          signature: {
            integrity: config.signature.integrity
          }
        };

        // NO incluir redirectUrl para widget embebido
        // El widget embebido de Wompi NO debe tener redirectUrl
        // Solo se usa redirectUrl para Web Checkout (redirección completa)
        // if (config.redirectUrl) {
        //   widgetConfig.redirectUrl = config.redirectUrl;
        // }

        // Solo incluir expirationTime si está definido
        if (config.expirationTime) {
          widgetConfig.expirationTime = config.expirationTime;
        }

        // Solo incluir customerData si tiene al menos un campo válido
        if (config.customerData && Object.keys(config.customerData).length > 0) {
          widgetConfig.customerData = config.customerData;
        }

        // Solo incluir shippingAddress si tiene al menos un campo válido
        if (config.shippingAddress && Object.keys(config.shippingAddress).length > 0) {
          widgetConfig.shippingAddress = config.shippingAddress;
        }

        // Validar que todos los campos requeridos estén presentes
        if (!widgetConfig.currency || !widgetConfig.amountInCents || !widgetConfig.reference || !widgetConfig.publicKey || !widgetConfig.signature?.integrity) {
          console.error('❌ Configuración incompleta:', {
            hasCurrency: !!widgetConfig.currency,
            hasAmountInCents: !!widgetConfig.amountInCents,
            hasReference: !!widgetConfig.reference,
            hasPublicKey: !!widgetConfig.publicKey,
            hasSignature: !!widgetConfig.signature?.integrity,
            config: widgetConfig
          });
          throw new Error('La configuración del widget está incompleta. Faltan campos requeridos.');
        }

        console.log('📋 Configuración final del widget (sin signature):', {
          currency: widgetConfig.currency,
          amountInCents: widgetConfig.amountInCents,
          reference: widgetConfig.reference,
          publicKey: widgetConfig.publicKey?.substring(0, 20) + '...',
          hasSignature: !!widgetConfig.signature?.integrity,
          signatureLength: widgetConfig.signature?.integrity?.length || 0,
          hasRedirectUrl: !!widgetConfig.redirectUrl,
          hasCustomerData: !!widgetConfig.customerData,
          hasShippingAddress: !!widgetConfig.shippingAddress
        });

        checkout = new (window as any).WidgetCheckout(widgetConfig);
        console.log('✅ Instancia de WidgetCheckout creada exitosamente');
      } catch (error: any) {
        console.error('❌ Error al crear instancia de WidgetCheckout:', error);
        console.error('📋 Configuración que causó el error:', {
          currency: config.currency,
          amountInCents: config.amountInCents,
          reference: config.reference,
          publicKey: config.publicKey?.substring(0, 20) + '...',
          hasSignature: !!config.signature?.integrity,
          signatureLength: config.signature?.integrity?.length || 0
        });
        throw new Error(`Error al inicializar el widget de Wompi: ${error?.message || 'Verifica la configuración.'}`);
      }

      // Abrir el widget
      console.log('🎯 Abriendo widget...');
      
      // Notificar que el widget se está abriendo (para cerrar el modal de loading)
      // El widget mostrará su propio modal/iframe
      if (onResult) {
        // Llamar al callback inmediatamente para indicar que el widget se está abriendo
        // Esto permite cerrar el modal de loading antes de que el widget muestre su contenido
        setTimeout(() => {
          onResult({ widgetOpening: true });
        }, 100);
      }
      
      // Agregar listener para errores del widget (solo una vez)
      const errorHandler = (event: ErrorEvent) => {
        const target = event.target as HTMLElement;
        const isWompiResource = 
          (event.message && event.message.includes('wompi')) ||
          (target && 'src' in target && (target as any).src && (target as any).src.includes('wompi')) ||
          (event.filename && event.filename.includes('wompi'));
        
        if (isWompiResource) {
          console.error('❌ Error detectado al cargar recurso de Wompi:', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error,
            target: target ? {
              tagName: target.tagName,
              src: (target as any).src,
              href: (target as any).href
            } : null
          });
          
          // Si es un 403, puede ser problema de firma o configuración
          if (event.message && event.message.includes('403')) {
            toast.error('Error de autenticación con Wompi. Verifica la configuración del pago.');
          }
        }
      };
      
      window.addEventListener('error', errorHandler, true);
      
      // Remover el listener después de que el widget se abra o cierre
      cleanupErrorHandler = () => {
        window.removeEventListener('error', errorHandler, true);
      };
      
      // Flag para evitar múltiples ejecuciones del callback
      let callbackExecuted = false;
      
      checkout.open(async (result: any) => {
        // Prevenir múltiples ejecuciones
        if (callbackExecuted) {
          console.warn('⚠️ Callback ya ejecutado, ignorando ejecución duplicada');
          return;
        }

        try {
          if (cleanupErrorHandler) {
            cleanupErrorHandler();
            cleanupErrorHandler = null;
          }
        console.log('📊 Resultado del widget de Wompi:', result);
        
          // Guard clause 1: result existe
          if (result === null || result === undefined) {
            console.warn('⚠️ El callback se ejecutó pero result es null/undefined');
            console.log('ℹ️ Esto puede ocurrir si el usuario cerró el widget sin completar el pago');
        if (onResult) {
          onResult(result);
        }
            callbackExecuted = true;
            return;
          }
          
          // IMPORTANTE: Siempre procesar transaction_id y llamar a attach-transaction
          // ANTES de llamar al callback personalizado, para asegurar que el backend
          // tenga el transaction_id guardado
          console.log('🔍 [WIDGET-SERVICE] Verificando result.transaction...');
          console.log('🔍 [WIDGET-SERVICE] result.transaction existe?', !!result.transaction);
          console.log('🔍 [WIDGET-SERVICE] result.transaction:', result.transaction);
          console.log('🔍 [WIDGET-SERVICE] Tipo de result.transaction:', typeof result.transaction);
          
          let transactionId: string | null = null;
          let transactionStatus: string | null = null;
          
          if (
            result.transaction && 
            result.transaction !== null && 
            typeof result.transaction === 'object'
          ) {
          const transaction = result.transaction;
            console.log('🔍 [WIDGET-SERVICE] transaction.id:', transaction.id);
            console.log('🔍 [WIDGET-SERVICE] transaction.status:', transaction.status);
            console.log('🔍 [WIDGET-SERVICE] Tipo de transaction.status:', typeof transaction.status);
            
            // Validar que transaction.status existe y es string ANTES de usarlo
            if (!transaction.status || typeof transaction.status !== 'string') {
              console.error('❌ [WIDGET-SERVICE] transaction.status inválido:', transaction.status);
              console.error('❌ [WIDGET-SERVICE] Transaction completa:', JSON.stringify(transaction, null, 2));
              // Continuar aunque el status sea inválido, al menos intentar attachar el transaction_id
            } else {
              transactionStatus = transaction.status;
            }
            
            transactionId = transaction.id || null;
            
            // attach-transaction solo cuando ya existe un pago en backend (referencia revital_* con order_id).
            // Con revital_cart_* no hay pago aún: el webhook crea orden y pago al recibir APPROVED; no llamar attach.
            const isCheckoutFlow = config.reference?.startsWith('revital_cart_') ?? false;
            if (transactionId && config.reference && !isCheckoutFlow) {
              try {
                console.log(`🔍 [WIDGET-SERVICE] ========== LLAMANDO A ATTACH-TRANSACTION ==========`);
                console.log(`🔍 [WIDGET-SERVICE] reference=${config.reference}, transaction_id=${transactionId}`);
                
                let token: string | null = null;
                try {
                  token = getStoredToken();
                  console.log(`🔍 [WIDGET-SERVICE] Token obtenido: ${token ? 'Sí (primeros 20 chars: ' + token.substring(0, 20) + '...)' : 'No'}`);
                } catch (tokenError) {
                  console.warn('⚠️ [WIDGET-SERVICE] Error al obtener token:', tokenError);
                  token = null;
                }
                
                const headers: HeadersInit = {
                  'Content-Type': 'application/json',
                };
                if (token) {
                  headers['Authorization'] = `Bearer ${token}`;
                  console.log(`✅ [WIDGET-SERVICE] Header Authorization agregado`);
                } else {
                  console.warn(`⚠️ [WIDGET-SERVICE] No se encontró token de autenticación. El endpoint puede requerir autenticación.`);
                }
                
                const attachResponse = await fetch('/api/payments/attach-transaction', {
                  method: 'POST',
                  headers,
                  body: JSON.stringify({
                    reference: config.reference,
                    transaction_id: transactionId
                  }),
                });
                
                if (!attachResponse.ok) {
                  const errorData = await attachResponse.json().catch(() => ({}));
                  console.error(`❌ [WIDGET-SERVICE] Error al attach transaction: ${attachResponse.status}`, errorData);
                } else {
                  const attachData = await attachResponse.json();
                  console.log(`✅ [WIDGET-SERVICE] ========== TRANSACTION ID ATTACHADO EXITOSAMENTE ==========`);
                  console.log(`✅ [WIDGET-SERVICE] Response:`, attachData);
                  
                  if (transactionStatus && ['APPROVED', 'DECLINED', 'VOIDED', 'ERROR'].includes(transactionStatus)) {
                    console.log(`🔍 [WIDGET-SERVICE] Status final detectado (${transactionStatus}), llamando a /api/payments/poll...`);
                    try {
                      const pollResponse = await fetch(`/api/payments/poll?reference=${encodeURIComponent(config.reference)}`, {
                        method: 'GET',
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                      });
                      if (pollResponse.ok) {
                        const pollData = await pollResponse.json();
                        console.log(`✅ [WIDGET-SERVICE] Poll completado:`, pollData);
                      } else {
                        const pollError = await pollResponse.json().catch(() => ({}));
                        console.warn(`⚠️ [WIDGET-SERVICE] Error en poll (el webhook puede actualizar después):`, pollError);
                      }
                    } catch (pollError: any) {
                      console.warn(`⚠️ [WIDGET-SERVICE] Error al llamar poll (el webhook puede actualizar después):`, pollError);
                    }
                  }
                }
              } catch (attachError: any) {
                console.error(`❌ [WIDGET-SERVICE] Error al llamar attach-transaction:`, attachError);
              }
            } else if (isCheckoutFlow && transactionId && config.reference) {
              console.log(`🔍 [WIDGET-SERVICE] Flujo checkout (revital_cart_): no se llama attach; el webhook crea orden y pago. Redirigiendo a resultado...`);
            } else if (!transactionId || !config.reference) {
              console.warn(`⚠️ [WIDGET-SERVICE] No se puede attach transaction: transactionId=${transactionId}, reference=${config.reference}`);
            }
          }
          
          // Si hay un callback personalizado, llamarlo (p. ej. invalidar queries)
          if (onResult) {
            console.log('🔍 [WIDGET-SERVICE] Llamando callback personalizado onResult...');
            onResult(result);
          }

          // Redirigir siempre a payment-result cuando hay estado final y referencia,
          // para que la página de resultado haga polling (revital_cart_) o muestre el pedido.
          // Así el usuario no se queda en checkout sin ver el resultado.
          if (transactionId && transactionStatus && config.reference) {
            callbackExecuted = true;
            console.log(`✅ [WIDGET-SERVICE] Redirigiendo a resultado: status=${transactionStatus}`);
            switch (transactionStatus) {
              case 'APPROVED':
                toast.success('¡Pago aprobado exitosamente!');
                window.location.href = `/checkout/payment-result?status=success&transaction_id=${transactionId}&amount=${config.amountInCents}&reference=${encodeURIComponent(config.reference)}`;
                return;
              case 'DECLINED':
                toast.error('El pago fue rechazado. Intenta con otro método de pago.');
                window.location.href = `/checkout/payment-result?status=declined&transaction_id=${transactionId}&message=Pago rechazado&reference=${encodeURIComponent(config.reference)}`;
                return;
              case 'PENDING':
                toast.info('El pago está pendiente de confirmación.');
                window.location.href = `/checkout/payment-result?status=pending&transaction_id=${transactionId}&amount=${config.amountInCents}&reference=${encodeURIComponent(config.reference)}`;
                return;
              case 'ERROR':
                toast.error('Ocurrió un error durante el pago. Intenta nuevamente.');
                window.location.href = `/checkout/payment-result?status=error&message=Error durante el pago&reference=${encodeURIComponent(config.reference)}`;
                return;
              default:
                console.log('❓ Estado de transacción no manejado:', transactionStatus);
                toast.info(`Estado del pago: ${transactionStatus}`);
            }
          }

          // Manejar el resultado automáticamente solo si NO se redirigió arriba
          if (!callbackExecuted && transactionId && transactionStatus) {
            console.log(`✅ [WIDGET-SERVICE] Transaction válida - ID: ${transactionId}, Status: ${transactionStatus}`);
            switch (transactionStatus) {
              case 'APPROVED':
                toast.success('¡Pago aprobado exitosamente!');
                window.location.href = `/checkout/payment-result?status=success&transaction_id=${transactionId}&amount=${config.amountInCents}&reference=${config.reference ? encodeURIComponent(config.reference) : ''}`;
                break;
              case 'DECLINED':
                toast.error('El pago fue rechazado. Intenta con otro método de pago.');
                window.location.href = `/checkout/payment-result?status=declined&transaction_id=${transactionId}&message=Pago rechazado`;
                break;
              case 'PENDING':
                toast.info('El pago está pendiente de confirmación.');
                window.location.href = `/checkout/payment-result?status=pending&transaction_id=${transactionId}&amount=${config.amountInCents}&reference=${config.reference ? encodeURIComponent(config.reference) : ''}`;
                break;
              case 'ERROR':
                toast.error('Ocurrió un error durante el pago. Intenta nuevamente.');
                window.location.href = `/checkout/payment-result?status=error&message=Error durante el pago`;
                break;
              default:
                console.log('❓ Estado de transacción no manejado:', transactionStatus);
                toast.info(`Estado del pago: ${transactionStatus}`);
            }
            callbackExecuted = true;
          } else if (result.error) {
          console.error('❌ Error en el resultado del widget:', result.error);
          toast.error('Error en el procesamiento del pago');
            callbackExecuted = true;
          } else {
            console.log('ℹ️ Widget cerrado sin completar el pago (usuario canceló o cerró el widget)');
            callbackExecuted = true;
          }
        } catch (error: any) {
          console.error('❌ Error en callback del widget:', error);
          callbackExecuted = true;
        }
      });

      console.log('✅ Widget abierto exitosamente');

      // Limpiar el error handler después de 5 segundos si el widget se abrió correctamente
      setTimeout(() => {
        if (cleanupErrorHandler) {
          cleanupErrorHandler();
          cleanupErrorHandler = null;
        }
      }, 5000);

    } catch (error: any) {
      console.error('❌ Error al abrir el widget de Wompi:', error);
      
      // Limpiar el error handler en caso de error
      if (cleanupErrorHandler) {
        cleanupErrorHandler();
        cleanupErrorHandler = null;
      }
      
      // Análisis del error para determinar si usar respaldo
      let useWebCheckoutFallback = false;
      let errorMessage = 'Error al cargar el sistema de pagos.';
      
      if (error instanceof Error) {
        if (error.message.includes('Content Security Policy') || 
            error.message.includes('CSP') ||
            error.message.includes('script-src') ||
            error.message.includes('form-action')) {
          useWebCheckoutFallback = true;
          errorMessage = 'Política de seguridad detectada. Usando método de pago directo...';
        } else if (error.message.includes('Timeout') || 
            error.message.includes('bloqueo') || 
            error.message.includes('AdBlocker') ||
            error.message.includes('firewall') ||
            error.message.includes('política de seguridad')) {
          useWebCheckoutFallback = true;
          errorMessage = 'Detectado bloqueo del widget. Usando método alternativo...';
        } else if (error.message.includes('WidgetCheckout')) {
          useWebCheckoutFallback = true;
          errorMessage = 'Widget no disponible. Usando método alternativo...';
        } else if (error.message.includes('Llave pública')) {
          errorMessage = 'Error de configuración del sistema de pagos. Contacta al soporte.';
        } else {
          errorMessage = error.message;
        }
      }
      
      // Si es un error que puede resolverse con Web Checkout, usarlo como respaldo
      if (useWebCheckoutFallback) {
        console.log('🔄 Intentando con Web Checkout como respaldo...');
        toast.info(errorMessage, { duration: 4000 });
        
        try {
          await this.openFallbackCheckout(config);
          return; // Éxito con el respaldo
        } catch (fallbackError) {
          console.error('❌ Error también en el respaldo:', fallbackError);
          toast.error('No se pudo abrir el sistema de pagos. Verifica tu conexión e intenta nuevamente.');
        }
      } else {
        toast.error(errorMessage);
      }
      
      throw error;
    }
  }

  // Crear formulario de respaldo para Web Checkout
  createFallbackForm(config: WompiWidgetConfig): HTMLFormElement {
    const form = document.createElement('form');
    form.action = 'https://checkout.wompi.co/p/';
    form.method = 'GET';
    form.target = '_blank';

    // Campos obligatorios y opcionales
    const fields: Record<string, string> = {
      'public-key': config.publicKey,
      'currency': config.currency,
      'amount-in-cents': config.amountInCents.toString(),
      'reference': config.reference,
      'signature:integrity': config.signature.integrity,
    };

    // Campos opcionales
    if (config.redirectUrl) {
      fields['redirect-url'] = config.redirectUrl;
    }
    if (config.expirationTime) {
      fields['expiration-time'] = config.expirationTime;
    }
    if (config.customerData?.email) {
      fields['customer-data:email'] = config.customerData.email;
    }
    if (config.customerData?.fullName) {
      fields['customer-data:full-name'] = config.customerData.fullName;
    }
    if (config.customerData?.phoneNumber) {
      fields['customer-data:phone-number'] = config.customerData.phoneNumber;
    }
    if (config.customerData?.legalId) {
      fields['customer-data:legal-id'] = config.customerData.legalId;
    }
    if (config.customerData?.legalIdType) {
      fields['customer-data:legal-id-type'] = config.customerData.legalIdType;
    }

    // Crear inputs
    Object.entries(fields).forEach(([name, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      form.appendChild(input);
    });

    return form;
  }

  // Crear URL de pago directo para CSP restrictivo
  createDirectPaymentUrl(config: WompiWidgetConfig): string {
    const params = new URLSearchParams({
      'public-key': config.publicKey,
      'currency': config.currency,
      'amount-in-cents': config.amountInCents.toString(),
      'reference': config.reference,
      'signature:integrity': config.signature.integrity,
    });

    // Agregar parámetros opcionales
    if (config.redirectUrl) {
      params.append('redirect-url', config.redirectUrl);
    }
    if (config.expirationTime) {
      params.append('expiration-time', config.expirationTime);
    }
    if (config.customerData?.email) {
      params.append('customer-data:email', config.customerData.email);
    }
    if (config.customerData?.fullName) {
      params.append('customer-data:full-name', config.customerData.fullName);
    }
    if (config.customerData?.phoneNumber) {
      params.append('customer-data:phone-number', config.customerData.phoneNumber);
    }
    if (config.customerData?.legalId) {
      params.append('customer-data:legal-id', config.customerData.legalId);
    }
    if (config.customerData?.legalIdType) {
      params.append('customer-data:legal-id-type', config.customerData.legalIdType);
    }

    return `https://checkout.wompi.co/p/?${params.toString()}`;
  }

  // Usar Web Checkout como respaldo
  async openFallbackCheckout(config: WompiWidgetConfig): Promise<void> {
    console.log('🔄 Usando Web Checkout como respaldo...');
    
    // Si llegamos aquí, es porque el script fue bloqueado por CSP
    // En este caso, es muy probable que form-action también esté bloqueado
    // Así que vamos directo a la redirección
    
    console.log('🔒 CSP detectado (script bloqueado), usando redirección directa...');
    
    try {
      // Crear URL directa
      const paymentUrl = this.createDirectPaymentUrl(config);
      console.log('🔗 URL de pago directo creada:', paymentUrl);
      
      // Verificar que la URL sea válida antes de redirigir
      if (!paymentUrl || !paymentUrl.startsWith('https://checkout.wompi.co')) {
        throw new Error('URL de pago inválida generada');
      }
      
      // Mostrar mensaje al usuario con opción de cancelar
      const userConfirmed = window.confirm(
        'Se detectó una política de seguridad que bloquea el widget embebido.\n\n' +
        '¿Deseas continuar y ser redirigido al sistema de pagos de Wompi?\n\n' +
        'Si ves un error 403, puede ser un problema de configuración o bloqueo de red.\n\n' +
        'URL: ' + paymentUrl.substring(0, 80) + '...'
      );
      
      if (!userConfirmed) {
        console.log('❌ Usuario canceló la redirección');
        throw new Error('Redirección cancelada por el usuario');
      }
      
      // Mostrar mensaje de redirección
      toast.info('Redirigiendo al sistema de pagos de Wompi...', { 
        duration: 2000,
        description: 'Se detectó una política de seguridad. Usando método directo.'
      });
      
      // Pequeño delay para que el usuario vea el mensaje
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🚀 Redirigiendo a:', paymentUrl);
      
      // Redirigir
        window.location.href = paymentUrl;
      
    } catch (error) {
      console.error('❌ Error al crear redirección directa:', error);
      
      // Como último recurso, intentar con formulario
      console.log('🆘 Intentando con formulario como último recurso...');
      try {
        const form = this.createFallbackForm(config);
        document.body.appendChild(form);
        
        toast.info('Intentando método alternativo...', { duration: 2000 });
        
        setTimeout(() => {
          try {
            console.log('📤 Enviando formulario a Wompi...');
            form.submit();
            document.body.removeChild(form);
          } catch (submitError) {
            console.error('❌ Error al enviar formulario:', submitError);
            document.body.removeChild(form);
            
            // Si todo falla, mostrar mensaje de error con instrucciones
            toast.error('No se pudo abrir el sistema de pagos automáticamente.', {
              duration: 8000,
              description: 'Por favor, contacta al soporte o intenta desde otro navegador.'
            });
          }
        }, 1000);
        
      } catch (formError) {
        console.error('❌ Error también creando formulario:', formError);
        throw new Error('No se pudo abrir el sistema de pagos. La política de seguridad del sitio está bloqueando el acceso a Wompi.');
      }
    }
  }

  // Detectar restricciones de CSP
  async detectCSPRestrictions(): Promise<{
    scriptSrc: boolean;
    formAction: boolean;
    connectSrc: boolean;
  }> {
    const restrictions = {
      scriptSrc: true, // Asumimos que está bloqueado si llegamos aquí
      formAction: false,
      connectSrc: false
    };

    try {
      // Si llegamos aquí, sabemos que script-src está bloqueado
      // porque el widget no pudo cargar
      
      // Test form-action intentando crear y enviar un formulario
      return new Promise((resolve) => {
        const testForm = document.createElement('form');
        testForm.action = 'https://checkout.wompi.co/p/';
        testForm.method = 'GET';
        testForm.style.display = 'none';
        testForm.target = '_blank';
        
        // Crear un input de prueba
        const testInput = document.createElement('input');
        testInput.type = 'hidden';
        testInput.name = 'test';
        testInput.value = 'csp-test';
        testForm.appendChild(testInput);
        
        // Listener para detectar si el formulario puede enviarse
        const testSubmit = () => {
          try {
            document.body.appendChild(testForm);
            testForm.submit();
            // Si llegamos aquí, form-action no está bloqueado
            restrictions.formAction = false;
            document.body.removeChild(testForm);
          } catch (error) {
            // Error al enviar = form-action bloqueado
            restrictions.formAction = true;
            if (testForm.parentNode) {
              document.body.removeChild(testForm);
            }
          }
          resolve(restrictions);
        };
        
        // Ejecutar test después de un momento
        setTimeout(testSubmit, 100);
      });

    } catch (error) {
      console.warn('Error detectando restricciones CSP:', error);
      // Si hay error, asumir que todo está bloqueado
      restrictions.formAction = true;
      return restrictions;
    }
  }

  // Limpiar recursos
  cleanup(): void {
    try {
      if (this.widgetScript) {
        // Remover event listeners
        this.widgetScript.onload = null;
        this.widgetScript.onerror = null;
        
        // Remover del DOM si está presente
        if (this.widgetScript.parentNode) {
          this.widgetScript.parentNode.removeChild(this.widgetScript);
        }
        
        this.widgetScript = null;
      }
      
      // Limpiar todos los scripts de Wompi existentes
      const existingScripts = document.querySelectorAll('script[src*="checkout.wompi.co"]');
      existingScripts.forEach(script => {
        try {
          script.remove();
        } catch (e) {
          console.warn('⚠️ Error al remover script:', e);
        }
      });
      
      this.widgetLoaded = false;
      console.log('🧹 Recursos de Wompi limpiados');
    } catch (error) {
      console.warn('⚠️ Error durante cleanup:', error);
    }
  }
}

// Exportar instancia singleton
export const wompiWidgetService = WompiWidgetService.getInstance();

// Función de utilidad para debugging manual
export const debugWompi = async () => {
  console.log('🔍 Iniciando diagnóstico completo de Wompi...');
  
  try {
    // Diagnóstico del sistema
    const diagnosis = await wompiWidgetService.diagnoseSystem();
    console.log('📊 Diagnóstico del sistema:', diagnosis);
    
    // Test de conectividad específico
    console.log('🌐 Probando conectividad a Wompi...');
    const connectivity = await wompiWidgetService.checkWompiConnectivity();
    console.log('Conectividad:', connectivity ? '✅ OK' : '❌ FALLO');
    
    // Verificar variables de entorno
    console.log('🔑 Variables de entorno:');
    console.log('WOMPI_PUBLIC_KEY:', process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY ? '✅ Configurada' : '❌ No configurada');
    console.log('WOMPI_INTEGRITY_SECRET:', process.env.NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET ? '✅ Configurada' : '❌ No configurada');
    
    // Verificar estado del widget
    console.log('🔧 Estado del widget:');
    console.log('Widget cargado:', wompiWidgetService.widgetLoaded ? '✅ Sí' : '❌ No');
    console.log('WidgetCheckout disponible:', typeof (window as any).WidgetCheckout !== 'undefined' ? '✅ Sí' : '❌ No');
    
    // Test de carga del script
    console.log('📜 Probando carga del script...');
    try {
      await wompiWidgetService.loadWidgetScript();
      console.log('✅ Script cargado exitosamente');
    } catch (error) {
      console.error('❌ Error al cargar script:', error);
    }
    
    // Mostrar recomendaciones basadas en el diagnóstico
    console.log('💡 Recomendaciones:');
    if (diagnosis.adBlocker) {
      console.log('🚫 AdBlocker detectado - Considera desactivarlo o usar Web Checkout como respaldo');
    }
    if (diagnosis.csp) {
      console.log('🔒 CSP restrictivo detectado - Verifica la política de seguridad del sitio');
      
      // Mostrar detalles específicos de CSP si están disponibles
      const cspDetails = (diagnosis as any).cspDetails;
      if (cspDetails) {
        if (cspDetails.scriptSrcBlocked) {
          console.log('   📜 script-src bloqueado - Agregar https://checkout.wompi.co a script-src');
        }
        if (cspDetails.formActionBlocked) {
          console.log('   📋 form-action bloqueado - Agregar https://checkout.wompi.co a form-action');
        }
        console.log('   💡 CSP recomendado:');
        console.log('   script-src \'self\' https://checkout.wompi.co;');
        console.log('   form-action \'self\' https://checkout.wompi.co;');
        console.log('   connect-src \'self\' https://checkout.wompi.co;');
      }
    }
    if (!diagnosis.connectivity) {
      console.log('🌐 Problemas de conectividad - Verifica firewall o proxy');
    }
    
    console.log('🏁 Diagnóstico completado');
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  }
};

// Función de prueba del respaldo CSP
export const testWompiFallback = async () => {
  console.log('🧪 Iniciando prueba del respaldo de Wompi...');
  
  try {
    // Verificar variables de entorno
    const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
    const integritySecret = process.env.NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET;
    
    console.log('🔑 Variables de entorno:');
    console.log('   WOMPI_PUBLIC_KEY:', publicKey ? '✅ Configurada' : '❌ No configurada');
    console.log('   WOMPI_INTEGRITY_SECRET:', integritySecret ? '✅ Configurada' : '❌ No configurada');
    
    if (!publicKey) {
      console.error('❌ NEXT_PUBLIC_WOMPI_PUBLIC_KEY no está configurado');
      return;
    }
    
    // Generar firma de integridad real
    const reference = `TEST-${Date.now()}`;
    const amountInCents = 100000;
    const currency = 'COP';
    
    let signature = 'test_signature';
    if (integritySecret) {
      try {
        const dataToHash = `${reference}${amountInCents}${currency}${integritySecret}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(dataToHash);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        console.log('✅ Firma de integridad generada correctamente');
      } catch (error) {
        console.warn('⚠️ Error generando firma, usando firma de prueba');
      }
    }
    
    // Configuración de prueba
    const testConfig = {
      currency,
      amountInCents,
      reference,
      publicKey,
      signature: {
        integrity: signature
      },
      redirectUrl: `${window.location.origin}/checkout/payment-result`,
      customerData: {
        email: 'test@example.com',
        fullName: 'Usuario de Prueba',
        phoneNumber: '3001234567',
        phoneNumberPrefix: '+57'
      }
    };

    console.log('⚙️ Configuración de prueba creada');
    console.log('   Referencia:', reference);
    console.log('   Monto:', amountInCents, 'centavos');
    console.log('   Moneda:', currency);
    
    // Probar el respaldo directamente
    await wompiWidgetService.openFallbackCheckout(testConfig);
    
  } catch (error) {
    console.error('❌ Error en prueba del respaldo:', error);
  }
};

// Función para probar solo la URL directa
export const testDirectUrl = async () => {
  console.log('🔗 Probando creación de URL directa...');
  
  try {
    const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
    if (!publicKey) {
      console.error('❌ NEXT_PUBLIC_WOMPI_PUBLIC_KEY no está configurado');
      return;
    }
    
    const testConfig = {
      currency: 'COP',
      amountInCents: 100000,
      reference: `TEST-${Date.now()}`,
      publicKey,
      signature: {
        integrity: 'test_signature'
      },
      redirectUrl: `${window.location.origin}/checkout/payment-result`
    };
    
    const url = wompiWidgetService.createDirectPaymentUrl(testConfig);
    console.log('✅ URL creada:', url);
    console.log('🚀 Abriendo en nueva pestaña...');
    window.open(url, '_blank');
    
  } catch (error) {
    console.error('❌ Error creando URL:', error);
  }
};

// Hacer disponible globalmente para debugging
if (typeof window !== 'undefined') {
  (window as any).debugWompi = debugWompi;
  (window as any).testWompiFallback = testWompiFallback;
  (window as any).testDirectUrl = testDirectUrl;
  console.log('💡 Funciones disponibles en consola:');
  console.log('   - debugWompi() - Diagnóstico completo');
  console.log('   - testWompiFallback() - Probar respaldo CSP completo');
  console.log('   - testDirectUrl() - Probar solo URL directa');
}

export interface CheckoutData {
  cart_id: number;
  id_direccion: number;
  id_canje?: number | null;
  /** Código de cupón aplicado en el carrito; se envía al crear la sesión de checkout para aplicarlo al crear la orden. */
  codigo_descuento?: string | null;
}

// Función helper para inicializar el pago
export const initializeWompiPayment = async (
  amountInCents: number,
  customerData?: WompiWidgetConfig['customerData'],
  shippingAddress?: WompiWidgetConfig['shippingAddress'],
  onResult?: (result: any) => void,
  orderId?: number,
  checkoutData?: CheckoutData
): Promise<void> => {
  try {
    console.log('🚀 Inicializando pago con Wompi...');
    
    let config: WompiWidgetConfig;
    const token = getStoredToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Flujo checkout session: no se crea orden hasta que el pago sea aprobado
    if (checkoutData) {
      try {
        console.log('📡 Creando sesión de checkout (sin orden)...');
        const response = await fetch('/api/payments/create-checkout', {
          method: 'POST',
          headers,
          body: JSON.stringify(checkoutData),
        });
        const responseData = await response.json().catch(() => ({}));
        if (!response.ok) {
          const message = responseData?.error ?? responseData?.detail ?? (typeof responseData === 'string' ? responseData : null);
          throw new Error(message || `Error del servidor: ${response.status}`);
        }
        const backendResponse = responseData;
        if (!backendResponse.reference || !backendResponse.amount_in_cents || !backendResponse.currency || !backendResponse.public_key || !backendResponse.integrity_signature) {
          throw new Error('La respuesta del backend está incompleta.');
        }
        config = wompiWidgetService.createWidgetConfigFromBackend(backendResponse, customerData, shippingAddress);
        console.log('✅ Configuración checkout obtenida:', { reference: config.reference, amountInCents: config.amountInCents });
      } catch (e) {
        console.error('Error al crear checkout session:', e);
        throw e;
      }
    } else if (orderId) {
      try {
        console.log('📡 Obteniendo configuración desde el backend...');
        const response = await fetch('/api/payments/create', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            order_id: orderId,
            amount_in_cents: amountInCents,
          }),
        });

        if (!response.ok) {
          throw new Error(`Error del servidor: ${response.status}`);
        }

        const backendResponse = await response.json();
        
        console.log('📡 Respuesta del backend:', {
          hasReference: !!backendResponse.reference,
          hasAmountInCents: !!backendResponse.amount_in_cents,
          hasCurrency: !!backendResponse.currency,
          hasPublicKey: !!backendResponse.public_key,
          hasIntegritySignature: !!backendResponse.integrity_signature,
          reference: backendResponse.reference,
          amountInCents: backendResponse.amount_in_cents,
          currency: backendResponse.currency
        });
        
        // Validar que la respuesta del backend tenga todos los campos requeridos
        if (!backendResponse.reference || !backendResponse.amount_in_cents || !backendResponse.currency || !backendResponse.public_key || !backendResponse.integrity_signature) {
          throw new Error('La respuesta del backend está incompleta. Faltan campos requeridos.');
        }
        
        // Usar el método recomendado que obtiene la configuración del backend
        config = wompiWidgetService.createWidgetConfigFromBackend(
          backendResponse,
          customerData,
          shippingAddress
        );
        
        console.log('✅ Configuración obtenida desde el backend:', {
          reference: config.reference,
          amountInCents: config.amountInCents,
          currency: config.currency,
          hasPublicKey: !!config.publicKey,
          hasSignature: !!config.signature?.integrity
        });
      } catch (backendError) {
        console.warn('⚠️ No se pudo obtener configuración del backend, usando método alternativo:', backendError);
        // Fallback: usar método deprecado si el backend falla
        // En Next.js, solo las variables con prefijo NEXT_PUBLIC_ están disponibles en el cliente
    if (!process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY) {
          throw new Error(
            'NEXT_PUBLIC_WOMPI_PUBLIC_KEY no está configurado y el backend no está disponible. ' +
            'Agrega esta variable en el archivo .env del frontend con el valor de WOMPI_PUBLIC_KEY.'
          );
    }
    
    if (!process.env.NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET) {
          throw new Error(
            'NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET no está configurado y el backend no está disponible. ' +
            'Agrega esta variable en el archivo .env del frontend con el valor de WOMPI_INTEGRITY_SECRET.'
          );
    }
    
        config = await wompiWidgetService.createWidgetConfig(
      amountInCents,
      customerData,
      shippingAddress
    );
      }
    } else {
      // Si no hay orderId, usar método deprecado (requiere variables de entorno)
      // En Next.js, solo las variables con prefijo NEXT_PUBLIC_ están disponibles en el cliente
      if (!process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY) {
        throw new Error(
          'NEXT_PUBLIC_WOMPI_PUBLIC_KEY no está configurado. ' +
          'Agrega esta variable en el archivo .env del frontend con el valor de WOMPI_PUBLIC_KEY. ' +
          'Ejemplo: NEXT_PUBLIC_WOMPI_PUBLIC_KEY=pub_test_...'
        );
      }
      
      if (!process.env.NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET) {
        throw new Error(
          'NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET no está configurado. ' +
          'Agrega esta variable en el archivo .env del frontend con el valor de WOMPI_INTEGRITY_SECRET. ' +
          'Ejemplo: NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET=test_integrity_...'
        );
      }
      
      config = await wompiWidgetService.createWidgetConfig(
        amountInCents,
        customerData,
        shippingAddress
      );
    }

    console.log('⚙️ Configuración creada, intentando abrir widget...');
    console.log('📋 Validación de configuración:', {
      hasCurrency: !!config.currency,
      hasAmountInCents: !!config.amountInCents,
      hasReference: !!config.reference,
      hasPublicKey: !!config.publicKey,
      hasSignature: !!config.signature?.integrity,
      currency: config.currency,
      amountInCents: config.amountInCents,
      reference: config.reference,
      publicKey: config.publicKey?.substring(0, 20) + '...',
      signatureLength: config.signature?.integrity?.length || 0
    });
    
    // Validar configuración antes de intentar abrir el widget
    if (!config.currency || !config.amountInCents || !config.reference || !config.publicKey || !config.signature?.integrity) {
      const missingFields = [];
      if (!config.currency) missingFields.push('currency');
      if (!config.amountInCents) missingFields.push('amountInCents');
      if (!config.reference) missingFields.push('reference');
      if (!config.publicKey) missingFields.push('publicKey');
      if (!config.signature?.integrity) missingFields.push('signature.integrity');
      
      throw new Error(`La configuración del widget está incompleta. Faltan: ${missingFields.join(', ')}`);
    }
    
    try {
      // Intentar abrir el widget primero
      await wompiWidgetService.openWidget(config, onResult);
    } catch (widgetError) {
      console.warn('⚠️ Error con el widget, analizando causa:', widgetError);
      
      // Análisis del error para mensaje más específico
      let fallbackMessage = 'Usando método alternativo de pago...';
      
      if (widgetError instanceof Error) {
        if (widgetError.message.includes('Content Security Policy') || 
            widgetError.message.includes('CSP') ||
            widgetError.message.includes('script-src')) {
          fallbackMessage = 'Content Security Policy detectado. Redirigiendo a pago directo...';
        } else if (widgetError.message.includes('Timeout')) {
          fallbackMessage = 'Conexión lenta detectada. Usando método alternativo más rápido...';
        } else if (widgetError.message.includes('bloqueo') || widgetError.message.includes('AdBlocker')) {
          fallbackMessage = 'Bloqueador detectado. Usando método alternativo compatible...';
        } else if (widgetError.message.includes('política')) {
          fallbackMessage = 'Restricción de seguridad detectada. Usando método alternativo...';
        }
      }
      
      // Si el widget falla, NO usar respaldo automático para evitar redirecciones no deseadas
      // En su lugar, mostrar el error y permitir al usuario decidir
      console.error('❌ Widget de Wompi no pudo abrirse:', widgetError);
      
      // Analizar el error específico
      let errorMessage = 'No se pudo abrir el widget de pago.';
      let canUseFallback = false;
      
      if (widgetError instanceof Error) {
        if (widgetError.message.includes('Content Security Policy') || 
            widgetError.message.includes('CSP') ||
            widgetError.message.includes('script-src')) {
          errorMessage = 'El widget está bloqueado por políticas de seguridad del navegador.';
          canUseFallback = true;
        } else if (widgetError.message.includes('WidgetCheckout') || 
                   widgetError.message.includes('no está disponible')) {
          errorMessage = 'El script de Wompi no se cargó correctamente. Verifica tu conexión o desactiva bloqueadores de contenido.';
          canUseFallback = true;
        } else {
          errorMessage = widgetError.message || 'Error desconocido al abrir el widget.';
        }
      }
      
      // Mostrar error y opción de usar método alternativo
      toast.error(errorMessage, { 
        duration: 8000,
        action: canUseFallback ? {
          label: 'Usar método alternativo',
          onClick: async () => {
      try {
        await wompiWidgetService.openFallbackCheckout(config);
      } catch (fallbackError) {
        console.error('❌ Error también en el respaldo:', fallbackError);
              toast.error('El método alternativo también falló. Contacta al soporte técnico.', { duration: 8000 });
            }
          }
        } : undefined
      });
      
      // No lanzar error aquí, solo informar al usuario
      // throw widgetError;
    }
    
  } catch (error) {
    console.error('❌ Error al inicializar el pago con Wompi:', error);
    
    let errorMessage = 'Error al inicializar el pago.';
    let suggestions = '';
    
    if (error instanceof Error) {
      if (error.message.includes('NEXT_PUBLIC_WOMPI_PUBLIC_KEY')) {
        errorMessage = 'Error de configuración del sistema de pagos.';
        suggestions = ' Contacta al soporte técnico.';
      } else if (error.message.includes('NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET')) {
        errorMessage = 'Error de configuración del sistema de pagos.';
        suggestions = ' Contacta al soporte técnico.';
      } else if (error.message.includes('conexión') || error.message.includes('Timeout') || error.message.includes('network')) {
        errorMessage = 'Problemas de conexión a internet.';
        suggestions = ' Verifica tu conexión e intenta nuevamente.';
      } else if (error.message.includes('bloqueo') || error.message.includes('AdBlocker')) {
        errorMessage = 'Bloqueador de contenido detectado.';
        suggestions = ' Desactiva tu AdBlocker para este sitio e intenta nuevamente.';
      } else if (error.message.includes('firewall')) {
        errorMessage = 'Acceso bloqueado por firewall o política de red.';
        suggestions = ' Contacta a tu administrador de red.';
      } else {
        errorMessage = error.message;
      }
    }
    
    toast.error(errorMessage + suggestions, { duration: 8000 });
    throw error;
  }
};
