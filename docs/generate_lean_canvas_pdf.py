#!/usr/bin/env python3
"""Genera PDF del Lean Canvas de Revital (versión explicativa para exposición)."""

from __future__ import annotations

from fpdf import FPDF

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
OUTPUT = "/home/kevin/revital.cloud/docs/Lean-Canvas-Revital.pdf"


class LeanCanvasPDF(FPDF):
    def __init__(self) -> None:
        super().__init__()
        self.add_font("DejaVu", "", FONT)
        self.add_font("DejaVu", "B", FONT_B)
        self.set_auto_page_break(auto=True, margin=18)
        self.set_margins(18, 18, 18)

    def _w(self) -> float:
        return self.w - self.l_margin - self.r_margin

    def _write(self, h: float, text: str, align: str = "L") -> None:
        """Escribe multi_cell y vuelve siempre al margen izquierdo."""
        self.set_x(self.l_margin)
        self.multi_cell(self._w(), h, text, align=align)
        self.set_x(self.l_margin)

    def footer(self) -> None:
        self.set_y(-12)
        self.set_x(self.l_margin)
        self.set_font("DejaVu", "", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 8, f"Lean Canvas — Revital  |  Página {self.page_no()}", align="C")

    def cover(self) -> None:
        self.add_page()
        self.ln(45)
        self.set_font("DejaVu", "B", 24)
        self.set_text_color(20, 20, 20)
        self._write(12, "Lean Canvas", align="C")
        self.ln(4)
        self.set_font("DejaVu", "B", 18)
        self.set_text_color(50, 50, 50)
        self._write(10, "Revital", align="C")
        self.ln(10)
        self.set_font("DejaVu", "", 12)
        self.set_text_color(90, 90, 90)
        self._write(7, "Versión explicativa para exposición", align="C")
        self.ln(18)
        self.set_font("DejaVu", "", 11)
        self.set_text_color(70, 70, 70)
        self._write(
            6,
            "Modelo de negocio en una página:\n"
            "a quién servimos, qué problema resolvemos y cómo generamos valor.",
            align="C",
        )
        self.ln(30)
        self.set_font("DejaVu", "", 10)
        self.set_text_color(110, 110, 110)
        self.set_x(self.l_margin)
        self.cell(0, 6, "Julio 2026", align="C")

    def h1(self, text: str) -> None:
        self.ln(5)
        self.set_font("DejaVu", "B", 13)
        self.set_text_color(25, 25, 25)
        self._write(8, text)
        self.ln(2)

    def body(self, text: str) -> None:
        self.set_font("DejaVu", "", 10)
        self.set_text_color(35, 35, 35)
        self._write(5.5, text)
        self.ln(1)

    def bullet(self, text: str) -> None:
        self.set_font("DejaVu", "", 10)
        self.set_text_color(35, 35, 35)
        self._write(5.5, f"- {text}")
        self.ln(0.5)

    def numbered(self, n: int, text: str) -> None:
        self.set_font("DejaVu", "", 10)
        self.set_text_color(35, 35, 35)
        self._write(5.5, f"{n}. {text}")
        self.ln(0.5)

    def quote(self, text: str) -> None:
        self.ln(1)
        self.set_font("DejaVu", "B", 11)
        self.set_text_color(70, 70, 70)
        self._write(6, f'"{text}"')
        self.ln(2)

    def italic(self, text: str) -> None:
        self.set_font("DejaVu", "", 10)
        self.set_text_color(55, 55, 55)
        self._write(5.5, text)
        self.ln(1)


def build() -> None:
    pdf = LeanCanvasPDF()
    pdf.cover()
    pdf.add_page()

    # 1
    pdf.h1("1. Segmentos de clientes")
    pdf.body(
        "Nos dirigimos a dueños de comercios pequeños y medianos que ya venden "
        "bien en físico o por WhatsApp, pero quieren tener su propia tienda online."
    )
    pdf.body("Son personas que:")
    pdf.bullet("Quieren crecer sin perder el control de su marca.")
    pdf.bullet("No tienen un equipo de tecnología.")
    pdf.bullet("Buscan algo claro, listo para usar y con soporte cercano.")
    pdf.ln(1)
    pdf.body(
        "Nuestro primer caso real es Compralo: un comercio que usa Revital "
        "para vender en línea de forma ordenada."
    )

    # 2
    pdf.h1("2. Problema")
    pdf.body("Hoy muchos comercios enfrentan tres dolores fuertes:")
    pdf.numbered(
        1,
        "Desorden en las ventas: anotan pedidos a mano, por chat o en Excel, "
        "y se equivocan con precios, existencias o datos del cliente.",
    )
    pdf.numbered(
        2,
        "Dependencia de otros canales: venden por redes o marketplaces, "
        "pero no tienen una tienda propia que represente su marca.",
    )
    pdf.numbered(
        3,
        "Decisiones a ciegas: no saben con claridad qué se vende más, "
        "qué se queda quieto o cómo les está yendo mes a mes.",
    )
    pdf.ln(1)
    pdf.body(
        "En resumen: quieren vender más y mejor, pero el día a día les queda desorganizado."
    )

    # 3
    pdf.h1("3. Propuesta de valor única")
    pdf.quote(
        "Revital te da tu propia tienda online, lista para vender, "
        "sin complicarte con tecnología."
    )
    pdf.body(
        "No eres un número más en una plataforma grande: tienes tu espacio, "
        "tu marca y tu operación. Puedes publicar productos, recibir pedidos, "
        "cobrar y ver cómo va tu negocio desde un solo lugar."
    )
    pdf.body("Mensaje corto para el cliente:")
    pdf.italic("“Tu tienda online, a tu nombre, sin dolores de cabeza.”")

    # 4
    pdf.h1("4. Solución")
    pdf.body("Revital es una tienda online completa pensada para el comercio real:")
    pdf.bullet("El cliente entra, ve el catálogo y compra.")
    pdf.bullet("El dueño administra productos, pedidos y clientes desde un panel sencillo.")
    pdf.bullet("Se reciben pagos y se confirman pedidos por correo.")
    pdf.bullet("Se pueden ver ventas y alertas importantes.")
    pdf.bullet(
        "Incluye un asistente inteligente que ayuda a entender el negocio "
        "y a tomar decisiones más rápido."
    )
    pdf.ln(1)
    pdf.body(
        "Cada comercio tiene su propia tienda, separada de las demás: "
        "más control, más confianza y más personalización."
    )

    # 5
    pdf.h1("5. Canales")
    pdf.body("Cómo llegamos a los clientes:")
    pdf.bullet("Contacto directo con comercios locales.")
    pdf.bullet("Referidos de quienes ya usan la solución.")
    pdf.bullet("Demostraciones en vivo con casos reales (como Compralo).")
    pdf.bullet(
        "Alianzas con personas o negocios que ya acompañan a PYMEs "
        "(asesores, agencias, redes de emprendimiento)."
    )
    pdf.ln(1)
    pdf.body(
        "La entrega es cercana: instalamos la tienda, acompañamos el arranque "
        "y capacitamos al equipo."
    )

    # 6
    pdf.h1("6. Flujo de ingresos")
    pdf.body("Ganamos dinero con una suscripción mensual por tienda.")
    pdf.body("Hay planes según el tamaño del comercio:")
    pdf.bullet("Uno básico, para empezar.")
    pdf.bullet("Uno intermedio, para crecer.")
    pdf.bullet("Uno avanzado, para negocios que necesitan más capacidad y acompañamiento.")
    pdf.ln(1)
    pdf.body(
        "También se pueden ofrecer servicios puntuales: puesta en marcha, "
        "carga de productos o personalización de la tienda."
    )

    # 7
    pdf.h1("7. Estructura de costes")
    pdf.body("Para operar necesitamos invertir en:")
    pdf.bullet("El equipo que construye y mejora la plataforma.")
    pdf.bullet("El hosting y el mantenimiento de cada tienda.")
    pdf.bullet("Herramientas de comunicación, pagos y soporte.")
    pdf.bullet("El acompañamiento inicial de cada nuevo cliente.")
    pdf.ln(1)
    pdf.body(
        "Al inicio el costo de arrancar cada tienda es más alto porque el "
        "acompañamiento es personal. A medida que crezcamos, ese proceso se "
        "vuelve más ágil y rentable."
    )

    # 8
    pdf.h1("8. Métricas clave")
    pdf.body("Para saber si vamos bien, medimos cosas simples:")
    pdf.bullet("¿Cuántos comercios pagan por usar Revital?")
    pdf.bullet("¿Cuánto tarda un comercio en hacer su primera venta online?")
    pdf.bullet("¿Siguen usando la plataforma después del primer mes?")
    pdf.bullet("¿Cuánto nos cuesta acompañar a cada nuevo cliente?")
    pdf.bullet("¿Los clientes recomiendan Revital a otros?")
    pdf.ln(1)
    pdf.body(
        "Si un comercio empieza a vender online rápido y se queda, "
        "el modelo está funcionando."
    )

    # 9
    pdf.h1("9. Ventaja desleal")
    pdf.body("Lo que nos hace difíciles de copiar no es solo el software, sino:")
    pdf.bullet("Ya tenemos una solución lista y probada, no una idea en papel.")
    pdf.bullet(
        "Entendemos el contexto local: cómo venden las PYMEs aquí, "
        "qué les duele y cómo pagan."
    )
    pdf.bullet(
        "Damos una tienda propia y cercana, no una solución genérica e impersonal."
    )
    pdf.bullet(
        "Aprendemos con clientes reales (como Compralo) y mejoramos "
        "con esa experiencia."
    )
    pdf.ln(1)
    pdf.body(
        "Eso —producto + cercanía + aprendizaje del mercado— es lo que nos diferencia."
    )

    # Cierre
    pdf.h1("Cierre para la exposición (30 segundos)")
    pdf.body(
        "Muchos comercios quieren vender en línea, pero se atascan entre el "
        "desorden del día a día y plataformas que no sienten propias."
    )
    pdf.body(
        "Revital les da su tienda online lista para operar, con su marca, "
        "sus datos y un acompañamiento cercano."
    )
    pdf.body(
        "Empezamos con comercios reales, medimos si venden y se quedan, "
        "y desde ahí escalamos."
    )

    pdf.output(OUTPUT)
    print(f"PDF generado: {OUTPUT}")


if __name__ == "__main__":
    build()
