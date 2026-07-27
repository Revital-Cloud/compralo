#!/usr/bin/env python3
"""Genera PDF del plan comercial y marketing — Panel Admin IA para e-commerce."""

from __future__ import annotations

from fpdf import FPDF

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
OUTPUT = "/home/kevin/revital.cloud/docs/Plan-Comercial-Panel-Admin-IA-Ecommerce.pdf"


class PlanPDF(FPDF):
    def __init__(self) -> None:
        super().__init__()
        self.add_font("DejaVu", "", FONT)
        self.add_font("DejaVu", "B", FONT_B)
        self.set_auto_page_break(auto=True, margin=18)
        self.set_margins(18, 18, 18)

    def _w(self) -> float:
        return self.w - self.l_margin - self.r_margin

    def footer(self) -> None:
        self.set_y(-12)
        self.set_font("DejaVu", "", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 8, f"Plan Comercial — Panel Admin IA  |  Página {self.page_no()}", align="C")

    def cover(self) -> None:
        self.add_page()
        self.set_font("DejaVu", "B", 22)
        self.set_text_color(20, 20, 20)
        self.ln(40)
        self.multi_cell(self._w(), 12, "Plan Comercial y Marketing", align="C")
        self.ln(4)
        self.set_font("DejaVu", "B", 16)
        self.set_text_color(60, 60, 60)
        self.multi_cell(self._w(), 10, "Panel Admin con IA para E-commerce", align="C")
        self.ln(8)
        self.set_font("DejaVu", "", 12)
        self.multi_cell(
            self._w(),
            7,
            "Centro de mando multi-plataforma (Shopify, WooCommerce y más)\n"
            "Analytics + Prioridades diarias + Asistente IA + Acciones",
            align="C",
        )
        self.ln(20)
        self.set_font("DejaVu", "", 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 6, "Documento estratégico — Revital / nuevo producto SaaS", align="C")
        self.ln(6)
        self.cell(0, 6, "Junio 2026", align="C")

    def h1(self, text: str) -> None:
        self.ln(4)
        self.set_font("DejaVu", "B", 14)
        self.set_text_color(25, 25, 25)
        self.multi_cell(self._w(), 8, text)
        self.ln(2)

    def h2(self, text: str) -> None:
        self.ln(2)
        self.set_font("DejaVu", "B", 11)
        self.set_text_color(45, 45, 45)
        self.multi_cell(self._w(), 7, text)
        self.ln(1)

    def body(self, text: str) -> None:
        self.set_font("DejaVu", "", 10)
        self.set_text_color(35, 35, 35)
        self.multi_cell(self._w(), 5.5, text)
        self.ln(1)

    def bullet(self, text: str) -> None:
        self.set_font("DejaVu", "", 10)
        self.set_text_color(35, 35, 35)
        self.multi_cell(self._w(), 5.5, f"- {text}")

    def quote(self, text: str) -> None:
        self.set_font("DejaVu", "B", 10)
        self.set_text_color(80, 80, 80)
        self.multi_cell(self._w(), 5.5, f'"{text}"')
        self.ln(1)


def build() -> None:
    pdf = PlanPDF()
    pdf.cover()

    # --- 1. Resumen ---
    pdf.add_page()
    pdf.h1("1. Resumen ejecutivo")
    pdf.body(
        "Este documento define la estrategia comercial y de marketing para un nuevo SaaS: "
        "un panel admin con inteligencia artificial que se conecta a tiendas existentes "
        "(Shopify, WooCommerce y futuras plataformas). No compite con Shopify ni con "
        "soluciones de logística post-compra (ej. Pango). Es una capa encima: analytics, "
        "prioridades diarias, asistente IA y acciones aprobadas por el dueño."
    )
    pdf.quote(
        "Cada mañana sé cómo va mi tienda y qué hacer — en un solo sitio, "
        "sin cambiar de plataforma."
    )
    pdf.body(
        "Infraestructura propia + proveedor de IA como único tercero core. "
        "Los conectores a tiendas son el cable al negocio del cliente; no se vende otro e-commerce."
    )

    # --- 2. Visión ---
    pdf.h1("2. Visión y categoría de producto")
    pdf.h2("Qué es")
    pdf.body(
        "Command Center / Centro de mando para dueños de tienda online. "
        "Conectan su tienda, ven KPIs unificados, reciben un briefing diario de prioridades "
        "y pueden aprobar acciones que la IA ejecuta vía API de la plataforma."
    )
    pdf.h2("Qué NO es")
    pdf.bullet("Otra tienda online ni otro checkout")
    pdf.bullet("Herramienta de logística, envíos o devoluciones")
    pdf.bullet("Suite de ads (Meta/Google) obligatoria al inicio")
    pdf.bullet("Un chatbot genérico desconectado de datos reales")

    pdf.h2("Comparables mentales")
    pdf.bullet("Shopify Sidekick = asistente reactivo dentro de Shopify (gratis)")
    pdf.bullet("Vadour / Hiveku / SureThing = ops + analytics + briefing (competencia parcial)")
    pdf.bullet("Pango = logística post-compra (dominio distinto)")
    pdf.bullet("Este producto = operaciones de tienda + catálogo + ventas + analytics accionables")

    # --- 3. Propuesta de valor ---
    pdf.add_page()
    pdf.h1("3. Propuesta de valor — 4 pilares")
    pdf.body("El cliente paga por tres sensaciones encadenadas, no por 'tener IA':")
    pdf.h2("Ver — Entender mi negocio")
    pdf.body("Dashboard unificado: ventas, pedidos, productos top, stock, clientes, comparativas vs periodo anterior.")
    pdf.h2("Decidir — Saber qué importa hoy")
    pdf.body("Briefing diario / bandeja de prioridades: 3–7 acciones concretas con contexto, no 50 gráficos.")
    pdf.h2("Actuar — Hacer sin salir del panel")
    pdf.body("Acciones con aprobación explícita: descuentos, descripciones, pausar productos, estados de pedido.")
    pdf.h2("Automatizar — Vigilancia en segundo plano (plan superior)")
    pdf.body("Playbooks: si stock bajo → aviso; si 0 ventas en 30 días → sugerir descuento; informe semanal automático.")

    # --- 4. ICP ---
    pdf.h1("4. Cliente ideal (ICP)")
    pdf.h2("Primario — Dueño operador")
    pdf.bullet("Shopify o WooCommerce, $3k–50k/mes en ventas")
    pdf.bullet("1–3 personas; a menudo el dueño hace de todo")
    pdf.bullet("100–2.000 productos; sin analista ni data team")
    pdf.bullet("Dolor: vive apagando incendios; no sabe qué priorizar cada día")
    pdf.h2("Secundario — Agencia / freelancer e-commerce")
    pdf.bullet("Gestiona 5–20 tiendas; necesita informes rápidos para clientes")
    pdf.bullet("Pagará más por multi-tienda e informes white-label")
    pdf.h2("No es cliente (al inicio)")
    pdf.bullet("Enterprise con ERP y BI propio")
    pdf.bullet("Dropshippers con catálogo mínimo sin datos")
    pdf.bullet("Tiendas sin ventas aún (sin datos = sin valor)")

    # --- 5. Jobs to be done ---
    pdf.h1("5. Jobs to be done (por qué contratan)")
    pdf.bullet("Ahorrar tiempo — no abrir 6 pantallas cada mañana")
    pdf.bullet("No perder ventas — stock crítico en bestsellers")
    pdf.bullet("Vender más sin ser experto — qué promocionar y qué limpiar del catálogo")
    pdf.bullet("Sentir control — resumen claro para sí mismo o socios")
    pdf.bullet("Parecer profesional — agencias: informes para el cliente")

    # --- 6. Módulos ---
    pdf.add_page()
    pdf.h1("6. Módulos del producto (lenguaje comercial)")
    pdf.body("En web y ventas, presentar 6–7 módulos entendibles, no jerga técnica:")
    modules = [
        ("Dashboard", "Tu tienda en un vistazo: ventas, pedidos, tops, vs semana pasada."),
        ("Analytics", "Categorías, ticket medio, tendencias, salud del catálogo, clientes."),
        ("Prioridades", "Lista diaria de qué hacer — generada automáticamente."),
        ("Asistente IA", "Pregunta en español o inglés; respuestas basadas en tus datos."),
        ("Acciones", "Un clic y queda hecho en tu tienda (con tu aprobación previa)."),
        ("Informes", "Semanal/mensual por email o PDF — ideal para socios y agencias."),
        ("Automatizaciones", "Reglas simples: stock bajo, productos muertos, resumen lunes."),
    ]
    for name, desc in modules:
        pdf.h2(name)
        pdf.body(desc)

    # --- 7. Analytics ---
    pdf.h1("7. Analytics como motor del negocio")
    pdf.body("Los analytics no son un módulo aparte: alimentan briefing, chat y acciones.")
    pdf.bullet("Ventas por categoría → insight + promo focalizada")
    pdf.bullet("Velocidad de venta + stock → alerta de agotamiento")
    pdf.bullet("Productos sin ventas → descuento u ocultar")
    pdf.bullet("Ticket medio → decisiones de bundling (fase 2)")
    pdf.bullet("Salud del catálogo (score) → bulk de descripciones")
    pdf.quote("Analytics que no solo informan — te dicen qué hacer.")

    # --- 8. Multi-plataforma ---
    pdf.h1("8. Estrategia multi-plataforma")
    pdf.bullet("Shopify: mercado grande, OAuth maduro, mucha competencia en IA")
    pdf.bullet("WooCommerce: millones de tiendas, poco Sidekick, hueco comercial claro")
    pdf.bullet("Magento / BigCommerce: fase 2–3, clientes mid-market")
    pdf.quote("Funciona con la tienda que ya tienes. No migres nada.")

    # --- 9. Competencia ---
    pdf.add_page()
    pdf.h1("9. Competencia y diferenciación")
    pdf.h2("Saturado (evitar como único pitch)")
    pdf.bullet("Briefing genérico solo para Shopify")
    pdf.bullet("Chat de ventas sin acciones")
    pdf.bullet("Copia de Sidekick en otro dominio")
    pdf.h2("Espacio defendible")
    pdf.bullet("Multi-plataforma (Shopify + Woo desde día 1 en messaging)")
    pdf.bullet("Analytics + prioridades + acciones en un solo panel")
    pdf.bullet("Sin obligar integraciones de ads/email al inicio")
    pdf.bullet("Ejecución en catálogo (bulk copy, descuentos, productos muertos)")
    pdf.bullet("Español nativo + mercado hispano global")
    pdf.h2("vs Sidekick")
    pdf.body(
        "Sidekick es gratis y reactivo dentro de Shopify. Nosotros: briefing proactivo, "
        "panel independiente, WooCommerce, informes y automatizaciones."
    )

    # --- 10. Pricing ---
    pdf.h1("10. Planes y pricing")
    pdf.body("Ancla de valor: a $10k/mes, perder 1 venta/día o 2h/semana en reportes justifica $29–79/mes.")
    plans = [
        ("Free — $0", "1 tienda, dashboard básico, briefing semanal, chat limitado. Gancho: conectar en 5 min."),
        ("Starter — $29/mes", "1 tienda, briefing diario, chat + acciones básicas, Shopify + Woo."),
        ("Growth — $79/mes", "Analytics completo, bulk descripciones, playbooks, informes. Marcar 'Más popular'."),
        ("Agency — $149–199/mes", "3–10 tiendas, informes white-label, soporte prioritario."),
    ]
    for name, desc in plans:
        pdf.h2(name)
        pdf.body(desc)
    pdf.body("Anual: 2 meses gratis (~17% descuento) para mejorar cash y reducir churn.")

    # --- 11. Onboarding ---
    pdf.h1("11. Onboarding y momento 'aha'")
    pdf.bullet("Min 0–5: Conecta Shopify o Woo")
    pdf.bullet("Min 5–10: Ve dashboard con ventas reales")
    pdf.bullet("Min 10–15: Recibe 3 prioridades accionables")
    pdf.bullet("Min 15+: Prueba una acción (descripción, top productos, descuento)")
    pdf.body("Métrica clave: % usuarios con 'aha' en 24h → predictor de conversión free→paid.")

    # --- 12. MARKETING ---
    pdf.add_page()
    pdf.h1("12. Estrategia de marketing")
    pdf.body(
        "El marketing vende el resultado (claridad + control + tiempo), no la tecnología (LLM, tools, sync). "
        "Tres ejes: contenido/educación, comunidad/confianza, partnerships/escala."
    )

    pdf.h2("12.1 Posicionamiento de marca")
    pdf.bullet("Tono: claro, directo, empático con el dueño abrumado — no 'startup AI hype'")
    pdf.bullet("Promesa: centro de mando, no 'copilot' genérico")
    pdf.bullet("Prueba: capturas de briefing real, testimonios de tiempo ahorrado")
    pdf.bullet("Idiomas: español e inglés desde landing y producto (mercado global + LATAM/España)")

    pdf.h2("12.2 Marketing de contenido y SEO")
    pdf.body("Artículos orientados a intención del dueño de tienda (medio plazo, CAC bajo):")
    pdf.bullet("Cómo saber si tu tienda Shopify va bien (sin ser experto)")
    pdf.bullet("Métricas WooCommerce que todo dueño debería mirar")
    pdf.bullet("Sidekick vs panel externo: cuándo tiene sentido cada uno")
    pdf.bullet("Checklist de salud del catálogo e-commerce")
    pdf.bullet("Qué hacer cuando un producto no vende en 30 días")
    pdf.body("Formatos: blog, guías PDF lead magnet, videos cortos (Reels/TikTok/YouTube Shorts) mostrando el briefing diario.")

    pdf.h2("12.3 Redes y comunidades")
    pdf.bullet("Grupos Facebook de Shopify / WooCommerce (aportar valor, no spam)")
    pdf.bullet("Reddit: r/ecommerce, r/shopify, r/woocommerce")
    pdf.bullet("Discord/Telegram de e-commerce hispano")
    pdf.bullet("LinkedIn: posts para dueños DTC y agencias (casos de uso, no features)")
    pdf.body("Regla: 80% educación / 20% producto. El CTA es 'prueba gratis conectando tu tienda'.")

    pdf.h2("12.4 Canal agencias (alto LTV)")
    pdf.body(
        "Una agencia con 10 clientes = 1 plan Agency vs 10 Starter sueltos. "
        "Oferta de lanzamiento: 2 meses gratis Agency a cambio de feedback + logo + case study."
    )
    pdf.bullet("Outreach directo a freelancers Shopify/Woo en Upwork, Fiverr, LinkedIn")
    pdf.bullet("Programa partner: comisión 20–30% recurrente")
    pdf.bullet("Kit agencia: informes white-label, multi-tienda, soporte prioritario")

    pdf.h2("12.5 Afiliados y referidos")
    pdf.bullet("Consultores e-commerce, cursos online, contadores de pymes online")
    pdf.bullet("Referido usuario: 1 mes gratis por tienda referida que pague")
    pdf.bullet("Tracking con códigos / Rewardful o similar cuando escale")

    pdf.add_page()
    pdf.h2("12.6 Lanzamiento y PR")
    pdf.bullet("Product Hunt: cuando exista Shopify + Woo + briefing (no antes)")
    pdf.bullet("Beta privada: 20–50 tiendas con onboarding asistido")
    pdf.bullet("Case studies en video (2 min): 'antes Excel/admin, ahora un panel'")
    pdf.bullet("Comparativas honestas en web (vs Sidekick, vs Excel, vs silos de plugins)")

    pdf.h2("12.7 Email marketing")
    pdf.body("Secuencia post-registro (free):")
    pdf.bullet("D0: Bienvenida + conectar tienda en 5 min")
    pdf.bullet("D1: 'Tu primer briefing está listo' (si conectó)")
    pdf.bullet("D3: Caso de uso — stock bajo detectado")
    pdf.bullet("D7: Upgrade a Starter — briefing diario ilimitado")
    pdf.bullet("D14: Social proof + oferta anual")
    pdf.body("Newsletter semanal (todos): tip de ops de tienda + feature highlight.")

    pdf.h2("12.8 Paid ads (cuando haya conversión probada)")
    pdf.bullet("No invertir fuerte hasta free→paid > 5% en cohorte inicial")
    pdf.bullet("Google Ads: keywords 'shopify analytics dashboard', 'woocommerce reporting'")
    pdf.bullet("Meta: lookalike de clientes pagos; creativos = briefing screen recording")
    pdf.bullet("Retargeting: visitaron pricing pero no conectaron tienda")

    pdf.h2("12.9 Mensajes por plataforma")
    pdf.bullet("Shopify: 'Sidekick responde. Nosotros te priorizamos el día.'")
    pdf.bullet("WooCommerce: 'El centro de mando con IA que Woo no tiene nativo.'")
    pdf.bullet("Ambas: 'Conecta la tienda que ya tienes.'")

    pdf.h2("12.10 Calendario marketing — primeros 90 días")
    pdf.bullet("Mes 1: Landing ES+EN, 10 betas, 3 testimonios, 4 posts LinkedIn, 2 artículos SEO")
    pdf.bullet("Mes 2: Woo en producción, outreach 20 agencias, lead magnet PDF catálogo")
    pdf.bullet("Mes 3: Product Hunt, programa afiliados, primer case study en video, paid test $500")

    # --- 13. Objeciones ---
    pdf.add_page()
    pdf.h1("13. Objeciones de venta y respuestas")
    objections = [
        ("Sidekick es gratis", "Sidekick vive en Shopify y responde cuando preguntas. Nosotros priorizamos cada mañana, unificamos analytics y funcionamos en Woo."),
        ("Ya uso Google Analytics", "GA mide visitas. Nosotros cruzamos ventas, productos, stock y pedidos — y sugerimos acciones."),
        ("No confío en la IA", "Nada se ejecuta sin tu aprobación explícita."),
        ("Es caro", "Si ahorras 2 h/semana, el plan se paga solo. Menos que un VA o una hora de consultor."),
        ("Ya tengo Excel", "Excel no te avisa solo ni crea descuentos en tu tienda."),
    ]
    for obj, resp in objections:
        pdf.h2(obj)
        pdf.body(resp)

    # --- 14. Retención ---
    pdf.h1("14. Retención y expansión")
    pdf.h2("Se quedan si")
    pdf.bullet("Abren el panel ≥3 días/semana (hábito)")
    pdf.bullet("Usaron ≥1 acción que ahorró tiempo o generó venta")
    pdf.bullet("El briefing acertó algo real al menos 2 veces")
    pdf.h2("Anti-churn")
    pdf.bullet("Informe semanal por email")
    pdf.bullet("Historial de acciones ('mira lo que hiciste este mes')")
    pdf.bullet("'Tu semana vs la anterior' automático")
    pdf.h2("Expansión de ingresos")
    pdf.bullet("Upsell Starter → Growth por límites y bulk")
    pdf.bullet("Plan Agency + asientos extra")
    pdf.bullet("Add-on futuro: conectores ads (opcional)")
    pdf.bullet("Setup asistido one-time $99")

    # --- 15. Roadmap comercial ---
    pdf.h1("15. Roadmap comercial")
    pdf.bullet("Q1: 20 betas, 5 pagando, testimonio video")
    pdf.bullet("Q2: Shopify + Woo, landing EN+ES, Agency beta")
    pdf.bullet("Q3: 100 clientes Starter+, churn <5%/mes")
    pdf.bullet("Q4: Afiliados, 3 agencias partner, case studies por vertical")

    # --- 16. Métricas ---
    pdf.h1("16. Métricas del negocio")
    pdf.bullet("Tiendas conectadas (top funnel)")
    pdf.bullet("Usuarios con 'aha' en 24h")
    pdf.bullet("Conversión free → paid")
    pdf.bullet("MRR / ARPU")
    pdf.bullet("Churn mensual")
    pdf.bullet("Acciones aprobadas / usuario / mes")
    pdf.bullet("NPS o '¿recomendarías?'")

    # --- 17. Landing copy ---
    pdf.add_page()
    pdf.h1("17. Copy de landing (borrador)")
    pdf.h2("Hero ES")
    pdf.quote("Tu tienda online, un solo panel.")
    pdf.body(
        "Conecta Shopify o WooCommerce. Ve ventas, stock y clientes. Recibe prioridades "
        "cada mañana y actúa con IA — sin cambiar de plataforma."
    )
    pdf.h2("Subtítulo")
    pdf.body("Analytics + asistente + acciones en un lugar. Para dueños que no tienen equipo de datos.")
    pdf.h2("3 bullets")
    pdf.bullet("Dashboard unificado con comparativas reales")
    pdf.bullet("Lista diaria de qué hacer en tu tienda")
    pdf.bullet("IA que ejecuta cambios cuando tú apruebas")
    pdf.h2("CTA")
    pdf.body("Empieza gratis — conecta tu tienda en 5 minutos")

    # --- 18. Nombres ---
    pdf.h1("18. Direcciones de nombre de marca")
    pdf.bullet("Klaro / StorePulse — latido del negocio")
    pdf.bullet("Mando / Command — centro de mando")
    pdf.bullet("Orbit — todo orbita alrededor de tu tienda")
    pdf.bullet("Revital Ops — continuidad con marca existente")
    pdf.body("Verificar dominio .com y ausencia de conflictos de marca.")

    # --- 19. MVP ---
    pdf.h1("19. MVP comercial (qué prometer al lanzar)")
    pdf.bullet("Conectar Shopify + WooCommerce")
    pdf.bullet("Dashboard: ventas, pedidos, tops, stock crítico")
    pdf.bullet("Briefing diario con 3 prioridades")
    pdf.bullet("Chat IA sobre datos de la tienda")
    pdf.bullet("Acciones: descuento, descripción, pausar producto, estado pedido")
    pdf.bullet("Informe semanal automático")
    pdf.body("Regla: 6 módulos profundos > 30 features superficiales.")

    # --- 20. Matriz nichos ---
    pdf.h1("20. Matriz de nichos (referencia)")
    pdf.body("A — Catalog Ops Shopify (velocidad al mercado). B — Woo-first (menos competencia). C — Vertical moda/variantes (wedge defendible). Híbrido recomendado: construir A, vender messaging C.")

    # --- 21. Próximos pasos ---
    pdf.h1("21. Próximos pasos recomendados")
    pdf.bullet("Validar nombre y dominio")
    pdf.bullet("Landing waitlist / beta con hero + pricing")
    pdf.bullet("Reclutar 10 betas (5 Shopify, 5 Woo)")
    pdf.bullet("Medir aha 24h y free→paid en 30 días")
    pdf.bullet("Iterar briefing y acciones según feedback")
    pdf.bullet("Lanzar programa agencias en mes 2")

    pdf.ln(6)
    pdf.set_font("DejaVu", "", 9)
    pdf.set_text_color(100, 100, 100)
    pdf.multi_cell(
        pdf._w(),
        5,
        "Documento generado a partir de la estrategia definida para el nuevo producto SaaS "
        "Panel Admin IA. Basado en activos y aprendizajes del ecosistema Revital.",
        align="C",
    )

    pdf.output(OUTPUT)
    print(f"PDF generado: {OUTPUT}")


if __name__ == "__main__":
    build()
