/**
 * Contenido y textos del chatbot interactivo basado en menús.
 * Información legal y comercial de esta tienda (Revital E-commerce).
 * Marco legal Colombia.
 */

export interface MenuSection {
  id: string
  title: string
  content: string
  isMockData?: boolean
}

export const MAIN_MENU_LABELS = [
  "1. Términos y condiciones",
  "2. Protección de datos y transacciones",
  "3. Descuentos activos",
  "4. Sistema de puntos",
  "5. Garantías y devoluciones",
  "6. Salir",
] as const

export const SUBMENU_LABELS = [
  "1. Volver",
  "2. Salir",
] as const

export const WELCOME_MESSAGE =
  "Hola. Soy tu asistente de información legal y comercial. Elige una opción del menú escribiendo el número:\n\n" +
  MAIN_MENU_LABELS.join("\n")

export const INVALID_OPTION_MESSAGE =
  "Esa opción no es válida. Por favor escribe solo el número de la opción que deseas."

export const GOODBYE_MESSAGE =
  "Gracias por usar el asistente. Si necesitas más información, aquí estaré. Hasta pronto."

const MARCO_TERMINOS =
  "Marco legal aplicable (Colombia):\n" +
  "• Ley 1480 de 2011 – Estatuto del Consumidor\n" +
  "• Ley 527 de 1999 – Comercio electrónico y mensajes de datos\n" +
  "• Decreto 1074 de 2015 – Comercio, industria y turismo"

const MARCO_DATOS =
  "Marco legal aplicable (Colombia):\n" +
  "• Ley 1581 de 2012 – Protección de Datos Personales\n" +
  "• Decreto 1377 de 2013\n" +
  "• Decreto 1074 de 2015\n" +
  "• Circular Externa 002 de 2015 – SIC"

const MARCO_DESCUENTOS =
  "Marco legal aplicable:\n" +
  "• Ley 1480 de 2011 – Publicidad e información veraz\n" +
  "• Decreto 2153 de 1992 – Protección al consumidor"

const MARCO_PUNTOS =
  "Marco legal aplicable:\n" +
  "• Ley 1480 de 2011 – Información clara y completa\n" +
  "• Ley 527 de 1999 – Contratos digitales"

const MARCO_GARANTIAS =
  "Marco legal aplicable:\n" +
  "• Ley 1480 de 2011 – Garantías y derecho de retracto\n" +
  "• Decreto 587 de 2016 – Derecho de retracto en comercio electrónico"

export const SECTIONS: MenuSection[] = [
  {
    id: "terminos",
    title: "Términos y condiciones",
    content:
      "• Registro: email, contraseña y datos de perfil; contraseñas protegidas con Argon2.\n" +
      "• Roles: Cliente (compras, perfil, órdenes), Empleado y Administrador (gestión de tienda).\n" +
      "• Carrito: puedes navegar y agregar productos sin cuenta; al iniciar sesión tu carrito anónimo se une a tu cuenta.\n" +
      "• Condiciones de compra: precios, impuestos y costos de envío según lo mostrado en checkout; pagos mediante Wompi.\n" +
      "• Comunicaciones: enviamos emails transaccionales (confirmación de registro, órdenes, recuperación de contraseña) vía Resend.\n" +
      "• Aceptación: el uso de la plataforma implica la aceptación de los Términos de Servicio y la Política de Privacidad. Puedes consultarlos en el footer: Términos y Condiciones, Política de Privacidad, Política de Cookies, Accesibilidad.\n\n" +
      MARCO_TERMINOS,
  },
  {
    id: "datos",
    title: "Protección de datos personales y transacciones",
    content:
      "• Datos que recolectamos: datos de registro y perfil, direcciones de envío, historial de órdenes; uso para prestar el servicio y comunicaciones transaccionales.\n" +
      "• Cookies: usamos cookies necesarias (login, carrito), funcionales, analíticas y de marketing. Puedes configurarlas en el banner de cookies y en el footer (Configuración de cookies). Sin cookies necesarias no es posible iniciar sesión ni usar el carrito de forma persistente.\n" +
      "• Derechos del titular: conocer, actualizar, rectificar y suprimir tus datos personales, conforme a la ley.\n" +
      "• Pagos: los pagos se procesan con Wompi. Esta tienda NO almacena datos de tarjetas ni datos financieros sensibles; todo es gestionado por la pasarela certificada.\n" +
      "• Seguridad: medidas técnicas y organizativas para proteger la información; cumplimiento PCI-DSS vía Wompi.\n\n" +
      MARCO_DATOS,
  },
  {
    id: "descuentos",
    title: "Descuentos activos",
    content:
      "• En esta tienda los descuentos pueden aplicar a: total del pedido, producto específico, categoría, marca, línea o sublínea, costo de envío, envío gratis o compra mínima.\n" +
      "• Cada descuento puede ser porcentaje o monto fijo; algunos son solo para primera compra o para cumpleaños; otros se canjean por puntos.\n" +
      "• Vigencia por fechas de inicio y fin; algunos requieren código; hay límites de uso total y por usuario.\n" +
      "• Para ver los descuentos disponibles y los canjeables por puntos, visita la página «Descuentos» en el menú (/discounts). Las promociones pueden cambiar o finalizar sin previo aviso, respetando lo ya anunciado.\n\n" +
      MARCO_DESCUENTOS,
  },
  {
    id: "puntos",
    title: "Sistema de puntos",
    content:
      "• Los puntos se acumulan automáticamente al pagar una orden, según la configuración de la tienda (por ejemplo: X puntos por cada cierto valor en pesos gastados).\n" +
      "• Puedes canjear puntos por descuentos elegibles en la sección de descuentos canjeables (visible en la página de Descuentos y en checkout cuando aplique).\n" +
      "• Cada canje descuenta puntos de tu saldo y aplica el beneficio en la compra según las reglas del descuento.\n" +
      "• Los puntos no son dinero, no son valores negociables ni transferibles; su uso está sujeto a las reglas de la tienda.\n\n" +
      MARCO_PUNTOS,
  },
  {
    id: "garantias",
    title: "Garantías y devoluciones",
    content:
      "• La política detallada de garantías y devoluciones está en proceso de publicación. Puedes consultar la página «Devoluciones» (/devoluciones) cuando esté disponible.\n" +
      "• En general, se aplican las garantías legales y el derecho de retracto en comercio electrónico según la normativa colombiana.\n\n" +
      MARCO_GARANTIAS,
  },
]

export function getMainMenuText(): string {
  return MAIN_MENU_LABELS.join("\n")
}

export function getSubmenuText(): string {
  return SUBMENU_LABELS.join("\n")
}

export function getSectionById(id: string): MenuSection | undefined {
  return SECTIONS.find((s) => s.id === id)
}
