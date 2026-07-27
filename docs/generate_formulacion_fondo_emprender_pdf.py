#!/usr/bin/env python3
"""Genera PDF ordenado: Formulacion Capital Semilla - Compralo / Fondo Emprender."""

from __future__ import annotations

from fpdf import FPDF
from fpdf.enums import XPos, YPos

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
OUTPUT = "/home/kevin/revital.cloud/docs/Formulacion-Capital-Semilla-Compralo-Fondo-Emprender.pdf"

# Paleta sobria (formal SENA)
INK = (28, 28, 28)
MUTED = (90, 90, 90)
LINE = (210, 210, 210)
ACCENT = (25, 95, 85)
SOFT = (245, 248, 247)


class DocPDF(FPDF):
    def __init__(self) -> None:
        super().__init__()
        self.add_font("DejaVu", "", FONT)
        self.add_font("DejaVu", "B", FONT_B)
        self.set_auto_page_break(auto=True, margin=20)
        self.set_margins(18, 16, 18)
        self._skip_header = False

    def _w(self) -> float:
        return self.w - self.l_margin - self.r_margin

    def _mc(self, h: float, text: str, align: str = "L") -> None:
        self.set_x(self.l_margin)
        self.multi_cell(
            self._w(),
            h,
            text,
            align=align,
            new_x=XPos.LMARGIN,
            new_y=YPos.NEXT,
        )

    def header(self) -> None:
        if self._skip_header or self.page_no() == 1:
            return
        self.set_font("DejaVu", "", 8)
        self.set_text_color(*MUTED)
        self.set_x(self.l_margin)
        self.cell(self._w() * 0.55, 5, "Compralo  |  Capital Semilla", new_x=XPos.RIGHT, new_y=YPos.TOP)
        self.cell(self._w() * 0.45, 5, "Fondo Emprender SENA", align="R", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_draw_color(*LINE)
        self.set_line_width(0.3)
        y = self.get_y() + 1
        self.line(self.l_margin, y, self.l_margin + self._w(), y)
        self.set_y(y + 5)

    def footer(self) -> None:
        self.set_y(-14)
        self.set_draw_color(*LINE)
        self.line(self.l_margin, self.get_y(), self.l_margin + self._w(), self.get_y())
        self.ln(2)
        self.set_font("DejaVu", "", 8)
        self.set_text_color(*MUTED)
        self.cell(
            0,
            6,
            f"Bucaramanga, Colombia  |  Pagina {self.page_no()}",
            align="C",
            new_x=XPos.LMARGIN,
            new_y=YPos.NEXT,
        )

    def chapter(self, number: str, title: str) -> None:
        self.add_page()
        # Barra de seccion
        self.set_fill_color(*ACCENT)
        self.rect(self.l_margin, self.get_y(), 3.5, 12, style="F")
        self.set_xy(self.l_margin + 6, self.get_y())
        self.set_font("DejaVu", "B", 14)
        self.set_text_color(*INK)
        self._mc(7, f"{number}.  {title}")
        self.ln(2)
        self.set_draw_color(*LINE)
        self.line(self.l_margin, self.get_y(), self.l_margin + self._w(), self.get_y())
        self.ln(5)

    def h2(self, text: str) -> None:
        self.ln(2)
        self.set_font("DejaVu", "B", 11)
        self.set_text_color(*ACCENT)
        self._mc(6.2, text)
        self.ln(1.5)

    def body(self, text: str) -> None:
        self.set_font("DejaVu", "", 10)
        self.set_text_color(*INK)
        self._mc(5.3, text)
        self.ln(1.2)

    def quote(self, text: str) -> None:
        x0 = self.l_margin
        y0 = self.get_y()
        self.set_xy(x0 + 5, y0 + 1)
        self.set_font("DejaVu", "", 9.5)
        self.set_text_color(*MUTED)
        self.multi_cell(
            self._w() - 5,
            5.1,
            f'"{text}"',
            new_x=XPos.LMARGIN,
            new_y=YPos.NEXT,
        )
        y1 = self.get_y() + 1
        self.set_draw_color(*ACCENT)
        self.set_line_width(1.4)
        self.line(x0, y0, x0, y1)
        self.set_line_width(0.3)
        self.set_y(y1 + 2)

    def bullet(self, text: str) -> None:
        self.set_font("DejaVu", "", 10)
        self.set_text_color(*INK)
        # sangria controlada
        self.set_x(self.l_margin)
        bullet_w = 6
        self.cell(bullet_w, 5.3, "-", new_x=XPos.RIGHT, new_y=YPos.TOP)
        self.multi_cell(
            self._w() - bullet_w,
            5.3,
            text,
            new_x=XPos.LMARGIN,
            new_y=YPos.NEXT,
        )
        self.ln(0.6)

    def numbered(self, n: int, text: str) -> None:
        self.set_font("DejaVu", "", 10)
        self.set_text_color(*INK)
        num_w = 8
        self.set_x(self.l_margin)
        self.set_font("DejaVu", "B", 10)
        self.set_text_color(*ACCENT)
        self.cell(num_w, 5.3, f"{n}.", new_x=XPos.RIGHT, new_y=YPos.TOP)
        self.set_font("DejaVu", "", 10)
        self.set_text_color(*INK)
        self.multi_cell(
            self._w() - num_w,
            5.3,
            text,
            new_x=XPos.LMARGIN,
            new_y=YPos.NEXT,
        )
        self.ln(0.8)

    def label_value(self, label: str, value: str) -> None:
        self.set_font("DejaVu", "B", 10)
        self.set_text_color(*ACCENT)
        self._mc(5.2, label)
        self.set_font("DejaVu", "", 10)
        self.set_text_color(*INK)
        self._mc(5.3, value)
        self.ln(1.5)

    def kv_table(self, rows: list[tuple[str, str]]) -> None:
        label_w = 48
        val_w = self._w() - label_w
        for i, (label, value) in enumerate(rows):
            if self.get_y() > self.h - 30:
                self.add_page()
            y0 = self.get_y()
            # Medir altura del valor
            self.set_xy(self.l_margin + label_w, y0 + 2.5)
            self.set_font("DejaVu", "", 9.5)
            self.multi_cell(val_w, 4.8, value, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            y1 = max(self.get_y() + 2, y0 + 10)
            # Fondo
            self.set_fill_color(*(SOFT if i % 2 == 0 else (255, 255, 255)))
            self.rect(self.l_margin, y0, self._w(), y1 - y0, style="F")
            # Label
            self.set_xy(self.l_margin + 2, y0 + 2.5)
            self.set_font("DejaVu", "B", 9)
            self.set_text_color(*ACCENT)
            self.multi_cell(label_w - 4, 4.8, label, new_x=XPos.LMARGIN, new_y=YPos.TOP)
            # Valor
            self.set_xy(self.l_margin + label_w, y0 + 2.5)
            self.set_font("DejaVu", "", 9.5)
            self.set_text_color(*INK)
            self.multi_cell(val_w, 4.8, value, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            self.set_y(y1 + 1)

    def checklist(self, items: list[str]) -> None:
        for item in items:
            self.set_font("DejaVu", "", 10)
            self.set_text_color(*INK)
            self.set_x(self.l_margin)
            self.cell(8, 5.4, "[ ]", new_x=XPos.RIGHT, new_y=YPos.TOP)
            self.multi_cell(
                self._w() - 8,
                5.4,
                item,
                new_x=XPos.LMARGIN,
                new_y=YPos.NEXT,
            )
            self.ln(0.5)

    def cover(self) -> None:
        self._skip_header = True
        self.add_page()
        # franja superior
        self.set_fill_color(*ACCENT)
        self.rect(0, 0, self.w, 8, style="F")

        self.ln(36)
        self.set_font("DejaVu", "", 10)
        self.set_text_color(*MUTED)
        self._mc(6, "FORMULACION DE PROYECTO  ·  CAPITAL SEMILLA", align="C")
        self.ln(8)
        self.set_font("DejaVu", "B", 28)
        self.set_text_color(*INK)
        self._mc(12, "Compralo", align="C")
        self.ln(3)
        self.set_font("DejaVu", "B", 12)
        self.set_text_color(*ACCENT)
        self._mc(6.5, "Modelo de Negocio Canvas + Plan de Mercado", align="C")
        self.ln(2)
        self.set_font("DejaVu", "", 11)
        self.set_text_color(*MUTED)
        self._mc(6, "Estructura estrategica para Bucaramanga, Santander", align="C")

        self.ln(14)
        meta = [
            ("Plataforma", "compralo.revital.cloud"),
            ("Convocatoria", "Fondo Emprender SENA"),
            ("Ubicacion", "Bucaramanga, Colombia"),
            ("Fecha", "Julio 2026"),
        ]
        for label, value in meta:
            self.set_font("DejaVu", "B", 10)
            self.set_text_color(*ACCENT)
            self.cell(45, 7, label, align="R", new_x=XPos.RIGHT, new_y=YPos.TOP)
            self.set_font("DejaVu", "", 10)
            self.set_text_color(*INK)
            self.cell(5, 7, "", new_x=XPos.RIGHT, new_y=YPos.TOP)
            self.cell(80, 7, value, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        self.ln(16)
        self.set_draw_color(*LINE)
        self.line(self.l_margin + 30, self.get_y(), self.l_margin + self._w() - 30, self.get_y())
        self.ln(8)
        self.set_font("DejaVu", "B", 10)
        self.set_text_color(*INK)
        self._mc(6, "Contenido del documento", align="C")
        self.ln(2)
        contents = [
            "1. Resumen ejecutivo",
            "2. Ruta Canvas",
            "3. Modelo de Negocio Canvas (9 bloques)",
            "4. Plan de Mercado",
            "5. Guia de exposicion",
            "6. Producto visible (mockup / piloto)",
            "7. Enfoque Fondo Emprender / SENA",
        ]
        self.set_font("DejaVu", "", 10)
        self.set_text_color(*MUTED)
        for c in contents:
            self._mc(5.8, c, align="C")

        self._skip_header = False


def build() -> None:
    pdf = DocPDF()
    pdf.cover()

    # ---- 1. Resumen ----
    pdf.chapter("1", "Resumen ejecutivo")
    pdf.body(
        "Compralo es una plataforma de tienda digital para MiPyMEs de Bucaramanga. "
        "Permite vender en linea con pagos regionales, margen protegido y acompanamiento "
        "local, frente a las altas comisiones de marketplaces globales."
    )
    pdf.quote(
        "Tu tienda digital lista en Bucaramanga: pagos seguros, margen protegido "
        "y soporte local, sin las comisiones de los grandes marketplaces."
    )
    pdf.h2("En una mirada")
    pdf.kv_table(
        [
            ("Problema", "El tendero vende por WhatsApp, pierde margen con intermediarios y no tiene canal propio confiable."),
            ("Solucion", "Tienda digital lista + pagos regionales + onboarding asistido."),
            ("Cliente que paga", "MiPyME comercial de Bucaramanga (B2B)."),
            ("Usuario final", "Consumidor local 18-45 anos (B2C)."),
            ("Mercado Year 1", "SOM: 200 a 500 comercios del area metropolitana."),
            ("Ingresos", "SaaS desde $30.000 COP/mes + comision 1-2% + premium."),
            ("Pedido", "Capital semilla para runway de 12 meses, empleo local y penetracion."),
            ("Evidencia", "Piloto / mockup en compralo.revital.cloud"),
        ]
    )
    pdf.h2("Que evaluaran en esta etapa")
    pdf.bullet("Plan de mercado: quien compra, donde, cuanto y como se llega.")
    pdf.bullet("Ruta canvas: logica problema -> valor -> canales -> ingresos.")
    pdf.bullet("Exposicion del modelo canvas: claridad en 5 a 8 minutos.")
    pdf.bullet("Producto visible: mockup o piloto creible.")

    # ---- 2. Ruta ----
    pdf.chapter("2", "Ruta Canvas")
    pdf.body(
        "La ruta ordena la formulacion: del problema local al modelo presentable. "
        "Sirve para la exposicion y para demostrar que el equipo valida, prioriza y decide."
    )
    pdf.h2("Secuencia de formulacion")
    steps = [
        ("Problema local", "WhatsApp + intermediarios + sin canal digital propio."),
        ("Segmento", "MiPyME comercial de Bucaramanga (quien paga el SaaS)."),
        ("Job-to-be-done", "Vender sin erosionar margen; comprar local sin friccion."),
        ("Propuesta de valor", "Tienda lista + pagos regionales + acompanamiento."),
        ("Canales", "Gremios / brigadas (B2B) + web movil / WhatsApp (B2C)."),
        ("Relacion", "Onboarding asistido -> autoservicio + soporte WhatsApp."),
        ("Actividades", "Plataforma estable, alta <24h, captacion y demanda local."),
        ("Socios", "SENA, pasarelas, gremios, ultima milla."),
        ("Economia", "SaaS + comision baja + premium."),
        ("Prueba", "Mockup/piloto + metricas tempranas."),
    ]
    for i, (title, detail) in enumerate(steps, 1):
        pdf.numbered(i, f"{title}: {detail}")

    pdf.h2("Uso en la exposicion (8 minutos)")
    pdf.kv_table(
        [
            ("0:00 - 1:00", "Problema + ciudad (Bucaramanga)."),
            ("1:00 - 3:00", "Segmento + TAM/SAM/SOM + por que ahora."),
            ("3:00 - 5:00", "Canvas: valor, canales e ingresos."),
            ("5:00 - 7:00", "Plan de mercado y captacion."),
            ("7:00 - 8:00", "Mockup en vivo + empleo + pedido de capital."),
        ]
    )

    # ---- 3. Canvas ----
    pdf.chapter("3", "Modelo de Negocio Canvas")
    pdf.body(
        "Nueve bloques del Business Model Canvas, adaptados a Bucaramanga. "
        "Version para exposicion inicial ante Fondo Emprender SENA."
    )

    # Macro mapa
    pdf.h2("Mapa rapido (4 preguntas)")
    pdf.kv_table(
        [
            ("¿A quien?", "Segmentos, relacion y canales."),
            ("¿Que?", "Propuesta de valor."),
            ("¿Como?", "Actividades, recursos y socios."),
            ("¿Cuanto?", "Costos e ingresos."),
        ]
    )

    pdf.h2("3.1 Segmentos de clientes")
    pdf.quote(
        "Existe un grupo especifico que experimenta el problema con suficiente frecuencia "
        "e intensidad como para buscar una solucion."
    )
    pdf.label_value(
        "B2B - Lado oferta (cliente que paga)",
        "MiPyMEs de Bucaramanga y area metropolitana (San Alonso, San Francisco, Centro, Cabecera). "
        "Propietarios 25-50 anos con digitalizacion basica (WhatsApp Business), sin pasarela ni control "
        "automatizado. Frustrados por altas comisiones de marketplaces globales.",
    )
    pdf.label_value(
        "B2C - Lado demanda (usuario de la tienda)",
        "Consumidores locales 18-45 anos, bancarizados o con Nequi/Daviplata. Buscan inmediatez, "
        "apoyo al comercio local y pagos digitales sencillos.",
    )
    pdf.label_value(
        "TAM / SAM / SOM",
        "TAM: tejido empresarial de Santander (>100.000 empresas; ~95% microempresas - citar Camara/DANE). "
        "SOM Year 1: 200 a 500 MiPyMEs de comercio al por menor en el area metropolitana.",
    )
    pdf.label_value(
        "Job-to-be-done",
        "Comerciante: vender de forma recurrente sin erosionar margen. "
        "Consumidor: encontrar stock local y pagar sin desconfianza.",
    )

    pdf.h2("3.2 Propuesta de valor")
    pdf.quote(
        "Nuestra oferta alivia los dolores o crea las ganancias mas importantes para el "
        "segmento priorizado mejor que las alternativas actuales."
    )
    pdf.body("Top-3 pains / gains:")
    pdf.numbered(1, "Comisiones altas de intermediarios  vs  flujo de ventas a costo justo.")
    pdf.numbered(2, "Informalidad e inseguridad de pago  vs  transacciones trazables.")
    pdf.numbered(3, "Complejidad de armar canal propio  vs  vitrina digital lista en poco tiempo.")
    pdf.label_value(
        "Diferenciador",
        "SaaS + ecosistema local. Ultra-localizado en Bucaramanga, con dinamica de entrega urbana "
        "y metodos de pago masivos de la region (Nequi/Daviplata via pasarela aliada).",
    )
    pdf.label_value(
        "Disposicion a pagar",
        "Las MiPyMEs ya invierten en pauta Meta o delivery; prefieren tarifa fija o micro-comision "
        "si centraliza la operacion.",
    )

    pdf.add_page()
    pdf.h2("3.3 Relaciones con el cliente")
    pdf.bullet("Onboarding asistido: capacitacion y alfabetizacion digital (valorado por SENA).")
    pdf.bullet("Luego: autoservicio guiado + soporte agil por WhatsApp.")
    pdf.bullet("Engagement: actividad semanal en panel (inventario, pedidos) + NPS.")
    pdf.bullet("Anti-churn: primeras ventas dentro de los primeros 30 dias.")

    pdf.h2("3.4 Canales")
    pdf.label_value(
        "Adquisicion B2B",
        "Gremios (Camara de Comercio de Bucaramanga, Fenalco Santander), brigadas puerta a puerta "
        "en clusters comerciales y casos de exito locales.",
    )
    pdf.label_value(
        "Distribucion B2C",
        "Web / PWA movil; enlaces en Instagram y estados de WhatsApp.",
    )
    pdf.label_value(
        "Por que funciona",
        "El canal presencial inicial reduce CAC en un mercado que exige confianza relacional.",
    )

    pdf.h2("3.5 Actividades clave")
    pdf.bullet("Estabilidad de la plataforma Compralo (revital.cloud).")
    pdf.bullet("Onboarding estandarizado: registro a operacion en <24 horas (meta).")
    pdf.bullet("Marketing de demanda local para las tiendas afiliadas.")

    pdf.h2("3.6 Recursos clave")
    pdf.bullet("Talento: ingenieria full-stack, Customer Success y comercial de campo.")
    pdf.bullet("Tecnologia: cloud, pasarela de pagos y geolocalizacion.")
    pdf.bullet("IP: codigo del orquestador de tiendas y marca.")

    pdf.h2("3.7 Socios clave")
    pdf.bullet("SENA / Fondo Emprender: capital, mentoria y validacion institucional.")
    pdf.bullet("Pasarelas (Wompi / Bold): Nequi, Daviplata y tarjetas.")
    pdf.bullet("Ultima milla: cooperativas de mensajeria urbana en Bucaramanga.")
    pdf.bullet("Gremios: acceso confiable a MiPyME.")

    pdf.h2("3.8 Estructura de costes")
    pdf.bullet("Fijos: nomina (dev, soporte, comercial), servidores y herramientas.")
    pdf.bullet("Variables: comision de pasarela y pauta digital.")
    pdf.bullet("Capital semilla: absorber fijos del Year 1 y blindar runway de 12 meses.")

    pdf.h2("3.9 Fuentes de ingresos")
    pdf.bullet("Suscripcion SaaS: desde $30.000 COP/mes (infraestructura, subdominio, metricas).")
    pdf.bullet("Comision por exito: 1% a 2% por transaccion completada.")
    pdf.bullet("Premium: visibilidad destacada en el ecosistema Compralo.")

    # ---- 4. Plan de mercado ----
    pdf.chapter("4", "Plan de Mercado")
    pdf.body(
        "Traduce el canvas en decisiones comerciales: a quien se ataca primero, "
        "con que mensaje, por que canal y con que metas del ano 1."
    )

    pdf.h2("4.1 Definicion del mercado")
    pdf.bullet("Primario: digitalizacion de ventas de MiPyME comercial en Bucaramanga AMA.")
    pdf.bullet("Necesidad: canal propio, pagos confiables y operacion simple.")
    pdf.bullet("Momento: alta adopcion de WhatsApp/billeteras; baja formalizacion e-commerce.")

    pdf.h2("4.2 Segmentacion")
    pdf.label_value(
        "Segmento A - prioritario (Year 1)",
        "Comercio al por menor con catalogo estable; usa WhatsApp Business; dueno-operador 25-50 anos; "
        "ubicado en clusters densos (San Alonso, Centro, Cabecera).",
    )
    pdf.label_value(
        "Segmento B - secundario",
        "Servicios locales con agenda o catalogo digitalizable.",
    )
    pdf.label_value(
        "No-cliente inicial",
        "Empresas grandes con ERP/ecommerce maduro; negocios 100% informales sin interes en trazabilidad.",
    )

    pdf.h2("4.3 Propuesta comercial (Segmento A)")
    pdf.bullet("Mensaje: tienda online sin comisiones abusivas y con pagos que el cliente ya usa.")
    pdf.bullet("Oferta de entrada: activacion asistida + primer mes de acompanamiento.")
    pdf.bullet("Prueba de valor: primeras ventas digitales en <= 30 dias.")

    pdf.h2("4.4 Competencia (resumen)")
    pdf.kv_table(
        [
            ("Marketplaces / delivery", "Alto trafico, altas comisiones, poca identidad local."),
            ("DIY WhatsApp + transfer", "Barato, informal, sin trazabilidad."),
            ("Ecommerce generico", "Potente, complejo, poco acompanamiento local."),
            ("Espacio Compralo", "Facilidad + precio predecible + pagos regionales + soporte local."),
        ]
    )

    pdf.h2("4.5 Go-to-Market Year 1")
    pdf.numbered(1, "Piloto cerrado: 10 a 20 comercios en 1-2 zonas.")
    pdf.numbered(2, "Casos de exito en video corto (antes / despues).")
    pdf.numbered(3, "Alianzas gremiales y talleres de alfabetizacion digital.")
    pdf.numbered(4, "Brigadas comerciales en clusters de alta densidad.")
    pdf.numbered(5, "Impulso de demanda B2C (contenido + enlaces WhatsApp/Instagram).")

    pdf.h2("4.6 Mix de marketing")
    pdf.kv_table(
        [
            ("Producto", "Tienda digital, panel simple, pagos locales, soporte WhatsApp."),
            ("Precio", "SaaS accesible + comision baja + premium de visibilidad."),
            ("Plaza", "Web/PWA + activacion en campo + gremios."),
            ("Promocion", "BTL, talleres, redes locales, referidos entre tenderos."),
        ]
    )

    pdf.h2("4.7 Metas Year 1")
    pdf.bullet("200 a 500 MiPyMEs activas (SOM).")
    pdf.bullet("KPI critico: % de comercios con >=1 venta en 30 dias.")
    pdf.bullet("Retencion trimestral / churn controlado tras onboarding.")
    pdf.bullet("NPS del comercio afiliado.")
    pdf.bullet("Empleo directo: 3 a 5 puestos formales en la region.")

    pdf.h2("4.8 Riesgos y mitigacion")
    pdf.kv_table(
        [
            ("Adopcion lenta", "Onboarding asistido + meta de primera venta en 30 dias."),
            ("Poca demanda B2C", "Campanas locales + canales que ya usa el tendero."),
            ("Desconfianza tech", "Presencia fisica inicial + alfabetizacion digital."),
            ("Presion de comisiones", "Comunicar ahorro de margen vs apps globales."),
        ]
    )

    # ---- 5. Exposicion ----
    pdf.chapter("5", "Guia de exposicion")
    pdf.body(
        "Objetivo: que el evaluador entienda el negocio en menos de 8 minutos, "
        "con segmentacion clara, viabilidad y producto visible."
    )
    pdf.h2("5.1 Guion (8 minutos)")
    pdf.kv_table(
        [
            ("1. Gancho (30-45 s)", "Problema del tendero bumangues + WhatsApp + comisiones."),
            ("2. Segmento (60-90 s)", "ICP B2B, zonas, SOM 200-500."),
            ("3. Canvas (2-3 min)", "Valor, canales, ingresos, socios."),
            ("4. Mercado (90 s)", "Como se captura el SOM en 12 meses."),
            ("5. Mockup (60-90 s)", "Catalogo, checkout, panel."),
            ("6. Cierre (45-60 s)", "Empleo 3-5, runway 12 meses, pedido claro."),
        ]
    )
    pdf.h2("5.2 Frases clave")
    pdf.quote("No competimos por ser el marketplace global; digitalizamos al comercio local de Bucaramanga.")
    pdf.quote("El que paga es la MiPyME; el consumidor hace viable la primera venta.")
    pdf.quote("El capital semilla compra runway de 12 meses para penetracion, no para inventar el producto desde cero.")

    pdf.h2("5.3 Preguntas frecuentes")
    faqs = [
        ("¿Como van a conseguir clientes?", "Gremios + brigadas + talleres; el presencial baja la desconfianza."),
        ("¿Por que les van a pagar?", "Ya pagan pauta o delivery; ofrecemos tarifa predecible y comision baja."),
        ("¿Y si no hay compradores?", "KPI: primera venta en 30 dias; empujamos demanda por canales del tendero."),
        ("¿Vs Rappi / Mercado Libre?", "Tienda propia + precio justo + identidad local."),
        ("¿Ya tienen algo funcionando?", "Si: piloto/mockup en compralo.revital.cloud."),
    ]
    for q, a in faqs:
        pdf.label_value(q, a)

    # ---- 6. Producto ----
    pdf.chapter("6", "Producto visible (mockup / piloto)")
    pdf.body(
        "En esta etapa el producto debe verse y recorrerse. No se exige el marketplace a escala; "
        "se exige credibilidad visual y flujo basico."
    )
    pdf.h2("6.1 Checklist de demo")
    pdf.checklist(
        [
            "Home / vitrina con marca Compralo",
            "Catalogo con categorias y detalle de producto",
            "Carrito y checkout con pasarela",
            "Panel del comercio (pedidos / productos)",
            "URL visible: compralo.revital.cloud",
        ]
    )
    pdf.h2("6.2 Como narrarlo")
    pdf.bullet("Esto es lo que ve el comprador bumangues en el celular.")
    pdf.bullet("Esto es lo que opera el tendero sin ser experto tecnico.")
    pdf.bullet("Con el capital se escala onboarding y demanda local; no se reinventa el nucleo.")
    pdf.h2("6.3 Anexos recomendados")
    pdf.bullet("3 a 5 capturas (home, producto, checkout, panel).")
    pdf.bullet("Si hay piloto: numero de comercios / pedidos de prueba.")
    pdf.bullet("Testimonio corto de un comercio (si existe).")

    # ---- 7. SENA ----
    pdf.chapter("7", "Enfoque Fondo Emprender / SENA")
    pdf.h2("7.1 Empleo formal (Year 1)")
    pdf.bullet("2 roles de ingenieria / producto")
    pdf.bullet("1 Customer Success / soporte regional")
    pdf.bullet("1 gestor comercial de campo")
    pdf.bullet("1 rol adicional (ops / marketing local) segun presupuesto")
    pdf.body("Total de referencia: 3 a 5 empleos estructurados en la region.")

    pdf.h2("7.2 Efecto multiplicador local")
    pdf.bullet("Protege margen del comercio tradicional.")
    pdf.bullet("Formaliza pagos y trazabilidad en MiPyME.")
    pdf.bullet("Capacita digitalmente al dueno-operador.")

    pdf.h2("7.3 Uso del capital semilla")
    pdf.kv_table(
        [
            ("Nomina", "Equipo nucleo - runway 12 meses."),
            ("Infraestructura", "Cloud y herramientas operativas."),
            ("Go-to-market", "Onboarding en campo y alfabetizacion digital."),
            ("Demanda", "Pauta / activacion local controlada."),
        ]
    )
    pdf.h2("7.4 Validacion temprana")
    pdf.body(
        "Al contar con ecosistema visible en compralo.revital.cloud, incorporar metricas "
        "del piloto en Bucaramanga incrementa la calificacion de viabilidad."
    )

    pdf.ln(6)
    pdf.set_draw_color(*LINE)
    y_line = pdf.get_y()
    pdf.line(pdf.l_margin, y_line, pdf.l_margin + pdf._w(), y_line)
    pdf.ln(4)
    pdf.set_font("DejaVu", "", 8.5)
    pdf.set_text_color(*MUTED)
    pdf._mc(
        4.8,
        "Documento de formulacion comercial - Compralo. "
        "Orientado a viabilidad, segmentacion y narrativa de mercado para Capital Semilla.",
        align="C",
    )

    pdf.output(OUTPUT)
    print(f"PDF generado: {OUTPUT}")


if __name__ == "__main__":
    build()
