/**
 * Contenido informativo del chatbot legal y comercial.
 * Normativa colombiana vigente. Actualizar conforme a la SIC y legislación aplicable.
 */

export interface InformativeSection {
  id: string
  title: string
  shortLabel: string
  /** Resumen corto para el chatbot interactivo (2-4 líneas). */
  shortContent?: string
  content: string
  legalFramework: string[]
}

export const INFORMATIVE_SECTIONS: InformativeSection[] = [
  {
    id: "terminos",
    title: "Términos y condiciones",
    shortLabel: "Términos y condiciones",
    shortContent:
      "Al registrarte aceptas usar la plataforma de forma lícita y mantener tu información actualizada. Los precios incluyen IVA cuando aplique; los costos de envío se indican antes de confirmar. Puedes solicitar la cancelación de tu cuenta según los procedimientos de la plataforma.",
    content: `Resumen de los términos de uso de la plataforma, conforme a la legislación colombiana:

• Condiciones de registro y uso del sistema
Al registrarte aceptas usar la plataforma de forma lícita. Debes proporcionar información veraz y mantenerla actualizada. El proveedor se reserva el derecho de verificar la identidad y de negar o suspender el acceso en caso de incumplimiento.

• Obligaciones del usuario y del proveedor
El usuario se obliga a no usar la plataforma para fines ilícitos, a no suplantar identidades y a respetar la propiedad intelectual. El proveedor se obliga a ofrecer la información de productos y condiciones de venta de forma clara, y a cumplir con las obligaciones legales de garantía y protección al consumidor.

• Condiciones de compra, precios, impuestos y costos de envío
Los precios mostrados incluyen IVA cuando aplique. Los costos de envío se indican antes de confirmar la compra. El pago final refleja el total de productos, impuestos y envío según la normativa vigente.

• Políticas de cancelación y suspensión de cuentas
Puedes solicitar la cancelación de tu cuenta según los procedimientos indicados en la plataforma. El proveedor puede suspender o dar por terminada la relación en caso de incumplimiento de estos términos o de la ley.

• Aceptación expresa de los términos
El uso continuado de la plataforma constituye aceptación de los términos y condiciones vigentes. Se recomienda consultar periódicamente esta sección.`,
    legalFramework: [
      "Ley 1480 de 2011 – Estatuto del Consumidor",
      "Ley 527 de 1999 – Comercio electrónico y mensajes de datos",
      "Decreto 1074 de 2015 – Reglamentación del comercio, industria y turismo",
    ],
  },
  {
    id: "datos-personales",
    title: "Protección de datos personales y transacciones",
    shortLabel: "Datos personales y transacciones",
    shortContent:
      "Recolectamos solo los datos necesarios para registro, compra y envío. Tienes derecho a conocer, actualizar y suprimir tu información. Los pagos se procesan con pasarelas certificadas; no almacenamos datos sensibles de tarjetas.",
    content: `Información sobre el tratamiento de datos personales y la seguridad de las transacciones:

• Datos personales recolectados y su finalidad
Recolectamos datos necesarios para el registro, la compra, el envío y la atención al cliente (nombre, identificación, dirección, correo, teléfono). Estos se usan para gestionar tu cuenta, procesar pedidos, cumplir obligaciones legales y mejorar el servicio.

• Derechos del titular de los datos
Tienes derecho a conocer, actualizar, rectificar y suprimir tu información personal. Puedes ejercer estos derechos ante el responsable del tratamiento mediante los canales indicados en la plataforma o en la política de privacidad.

• Medidas de seguridad
Implementamos medidas técnicas y organizativas para proteger tus datos contra acceso no autorizado, pérdida o alteración, conforme a la normativa colombiana de protección de datos.

• Uso de pasarelas de pago certificadas
Los pagos se procesan mediante pasarelas de pago certificadas y autorizadas. La plataforma no almacena datos financieros sensibles (por ejemplo, números completos de tarjetas); estos son gestionados exclusivamente por terceros autorizados que cumplen estándares de seguridad.`,
    legalFramework: [
      "Ley 1581 de 2012 – Protección de Datos Personales",
      "Decreto 1377 de 2013 – Reglamentación parcial de la Ley 1581",
      "Decreto 1074 de 2015 – Régimen de protección de datos personales",
      "Circular Externa 002 de 2015 – Superintendencia de Industria y Comercio (SIC)",
    ],
  },
  {
    id: "descuentos",
    title: "Descuentos activos",
    shortLabel: "Descuentos y promociones",
    shortContent:
      "Hay descuentos por porcentaje, monto fijo, cupones o canje por puntos. Cada promoción indica su vigencia y condiciones. Puedes ver los descuentos activos en la sección de descuentos de la tienda.",
    content: `Información sobre promociones y descuentos vigentes, con transparencia al consumidor:

• Tipos de descuentos disponibles
La plataforma puede ofrecer descuentos por porcentaje, monto fijo, cupones o canje por puntos. Cada promoción indica sus condiciones específicas.

• Vigencia y condiciones
Cada promoción tiene fechas de vigencia y condiciones (compra mínima, uso por usuario, etc.). El descuento se aplica solo cuando se cumplen todas las condiciones publicadas.

• Restricciones y limitaciones
Pueden existir límites de uso por usuario o por producto. Las promociones pueden cambiar o finalizar sin previo aviso; se respeta lo ya anunciado para las compras realizadas dentro de la vigencia indicada.

A continuación se muestran los descuentos activos en este momento (si los hay).`,
    legalFramework: [
      "Ley 1480 de 2011 – Estatuto del Consumidor (publicidad e información veraz)",
      "Decreto 2153 de 1992 – Protección de la competencia y del consumidor",
    ],
  },
  {
    id: "puntos",
    title: "Sistema de puntos",
    shortLabel: "Sistema de puntos",
    shortContent:
      "Acumulas puntos con tus compras. Tu saldo e historial se consultan en Mi perfil > puntos/canje. Los puntos sirven para canjear descuentos; al canjear obtienes un cupón de uso único para aplicar en el carrito o checkout.",
    content: `Cómo funciona el sistema de puntos de esta tienda:

• Acumulación de puntos
En esta plataforma acumulas puntos principalmente con tus compras. La cantidad de puntos que ganas por cada compra depende de la configuración vigente (por ejemplo, un valor en pesos equivalente por punto). Al finalizar una compra podrás ver cuántos puntos sumaste.

• Dónde ver tu saldo
Tu saldo de puntos y el historial (acumulaciones y canjes) se consultan en Mi perfil, en la pestaña de puntos/canje.

• Para qué se pueden usar los puntos
Los puntos sirven para canjear descuentos. En Mi perfil > Canje verás los descuentos disponibles para canjear por puntos: cada uno indica cuántos puntos cuesta. Al canjear, se descuenta ese monto de tu saldo y obtienes un cupón de uso único que podrás aplicar en el carrito o en el checkout en tu próxima compra que cumpla las condiciones del descuento.

• Vigencia y restricciones
Los descuentos canjeados suelen tener una vigencia de uso (por ejemplo 30 días). Los puntos no constituyen dinero, ni valores negociables, ni son transferibles a terceros; son un beneficio promocional de la tienda.`,
    legalFramework: [
      "Ley 1480 de 2011 – Estatuto del Consumidor (información clara y completa)",
      "Ley 527 de 1999 – Información electrónica y contratos digitales",
    ],
  },
  {
    id: "garantias",
    title: "Garantías y devoluciones (información de referencia)",
    shortLabel: "Garantías y devoluciones",
    shortContent:
      "Los productos pueden tener garantía del fabricante o vendedor; el plazo se indica en la ficha. Para devoluciones o reclamos sigue el procedimiento de la plataforma y conserva comprobantes. Algunos productos pueden tener condiciones especiales.",
    content: `Información general sobre garantías y devoluciones (datos de referencia; la política definitiva puede variar):

• Información general sobre garantías
Los productos pueden tener garantía legal del fabricante o del vendedor según la ley. El plazo y alcance se indican en la ficha del producto o en la documentación de la compra.

• Condiciones y plazos para devoluciones
Sujeto a la política comercial vigente, pueden existir plazos para solicitar devoluciones o ejercer el derecho de retracto en comercio electrónico. Los plazos y condiciones se comunican en el proceso de compra.

• Procedimiento general
Para devoluciones o reclamos por garantía, debes seguir el procedimiento indicado en la plataforma (formularios, correo, centro de atención) y conservar comprobantes de compra.

• Casos excluidos
Ciertos productos o situaciones pueden estar excluidos de devolución o tener condiciones especiales (productos personalizados, higiene, etc.), según lo establecido en la política comercial.

• Aviso importante
Esta información es de carácter referencial y puede cambiar. La política aplicable es la publicada en el momento de la compra y la que conste en los términos y condiciones vigentes.`,
    legalFramework: [
      "Ley 1480 de 2011 – Garantías, devoluciones y derecho de retracto",
      "Decreto 587 de 2016 – Derecho de retracto en comercio electrónico",
    ],
  },
]
