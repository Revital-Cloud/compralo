"""
Script para generar diagrama de Gantt en Excel para Synkro SaaS Platform
"""
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.chart import BarChart, Reference
from datetime import datetime, timedelta
import calendar

# Datos de los hitos
hitos = [
    {
        "nombre": "Sistema de Checkout Completo",
        "descripcion": "Implementar flujo completo de checkout con múltiples pasos",
        "duracion_semanas": 3,
        "porcentaje": 0,
        "prioridad": "Crítico"
    },
    {
        "nombre": "Integración Completa de Pagos Wompi",
        "descripcion": "Finalizar integración de pasarela de pagos Wompi",
        "duracion_semanas": 2,
        "porcentaje": 60,
        "prioridad": "Crítico"
    },
    {
        "nombre": "Gestión de Órdenes del Usuario",
        "descripcion": "Sistema completo para que usuarios vean y gestionen órdenes",
        "duracion_semanas": 2,
        "porcentaje": 30,
        "prioridad": "Crítico"
    },
    {
        "nombre": "Dashboard Administrativo de Órdenes",
        "descripcion": "Panel completo para administradores gestionen órdenes",
        "duracion_semanas": 2,
        "porcentaje": 40,
        "prioridad": "Crítico"
    },
    {
        "nombre": "Sistema de Analytics y KPIs Avanzado",
        "descripcion": "Dashboard con métricas en tiempo real y gráficos",
        "duracion_semanas": 3,
        "porcentaje": 25,
        "prioridad": "Crítico"
    },
    {
        "nombre": "Gestión Completa de Inventario",
        "descripcion": "Sistema robusto de control de stock con movimientos",
        "duracion_semanas": 2,
        "porcentaje": 50,
        "prioridad": "Alto"
    },
    {
        "nombre": "Sistema de Notificaciones en Tiempo Real",
        "descripcion": "Notificaciones push, email y en-app",
        "duracion_semanas": 2,
        "porcentaje": 20,
        "prioridad": "Alto"
    },
    {
        "nombre": "Perfil de Usuario Completo",
        "descripcion": "Perfil extendido con gestión de datos y direcciones",
        "duracion_semanas": 1,
        "porcentaje": 60,
        "prioridad": "Alto"
    },
    {
        "nombre": "Sistema de Favoritos y Wishlist",
        "descripcion": "Funcionalidad completa de productos favoritos",
        "duracion_semanas": 1,
        "porcentaje": 70,
        "prioridad": "Alto"
    },
    {
        "nombre": "Sistema de Comentarios y Reviews",
        "descripcion": "Sistema de reseñas y calificaciones de productos",
        "duracion_semanas": 2,
        "porcentaje": 40,
        "prioridad": "Alto"
    },
    {
        "nombre": "Gestión Avanzada de Descuentos y Cupones",
        "descripcion": "Sistema completo de promociones y cupones",
        "duracion_semanas": 2,
        "porcentaje": 65,
        "prioridad": "Alto"
    },
    {
        "nombre": "Sistema de Puntos de Fidelidad",
        "descripcion": "Programa de recompensas con acumulación y canje",
        "duracion_semanas": 2,
        "porcentaje": 55,
        "prioridad": "Alto"
    },
    {
        "nombre": "CMS y Gestión de Contenido",
        "descripcion": "Sistema de gestión de contenido para páginas",
        "duracion_semanas": 2,
        "porcentaje": 50,
        "prioridad": "Medio"
    },
    {
        "nombre": "Optimización SEO y Performance",
        "descripcion": "Mejoras de rendimiento, SEO y experiencia",
        "duracion_semanas": 2,
        "porcentaje": 40,
        "prioridad": "Medio"
    },
    {
        "nombre": "Sistema de Deployment Automatizado",
        "descripcion": "Automatización del proceso de creación de instancias",
        "duracion_semanas": 3,
        "porcentaje": 30,
        "prioridad": "Medio"
    },
    {
        "nombre": "Panel de Control Multi-Instancia",
        "descripcion": "Dashboard centralizado para gestionar instancias",
        "duracion_semanas": 3,
        "porcentaje": 20,
        "prioridad": "Medio"
    },
    {
        "nombre": "Sistema de Testing y QA Completo",
        "descripcion": "Suite completa de pruebas automatizadas",
        "duracion_semanas": 3,
        "porcentaje": 25,
        "prioridad": "Medio"
    },
    {
        "nombre": "Documentación Técnica y de Usuario",
        "descripcion": "Documentación completa para desarrolladores y usuarios",
        "duracion_semanas": 2,
        "porcentaje": 50,
        "prioridad": "Bajo"
    },
    {
        "nombre": "Seguridad y Compliance",
        "descripcion": "Medidas de seguridad avanzadas y cumplimiento",
        "duracion_semanas": 2,
        "porcentaje": 45,
        "prioridad": "Bajo"
    },
    {
        "nombre": "Lanzamiento y Go-Live",
        "descripcion": "Preparación final para lanzamiento comercial",
        "duracion_semanas": 2,
        "porcentaje": 0,
        "prioridad": "Bajo"
    }
]

def calcular_fechas(hitos, fecha_inicio):
    """Calcula fechas de inicio y fin para cada hito"""
    fecha_actual = fecha_inicio
    fechas = []
    
    for hito in hitos:
        inicio = fecha_actual
        fin = inicio + timedelta(weeks=hito["duracion_semanas"])
        fechas.append({
            "inicio": inicio,
            "fin": fin,
            "duracion_dias": hito["duracion_semanas"] * 7
        })
        # Algunos hitos pueden ejecutarse en paralelo, pero para el Gantt los ponemos secuenciales
        # En un escenario real, algunos hitos se solaparían
        fecha_actual = fin
    
    return fechas

def crear_gantt_excel():
    """Crea el archivo Excel con el diagrama de Gantt"""
    wb = Workbook()
    ws = wb.active
    ws.title = "Gantt Chart - Synkro"
    
    # Fecha de inicio del proyecto (hoy)
    fecha_inicio_proyecto = datetime(2025, 1, 15)
    fechas = calcular_fechas(hitos, fecha_inicio_proyecto)
    
    # Estilos
    header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF", size=11)
    border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )
    
    # Colores por prioridad
    colores_prioridad = {
        "Crítico": PatternFill(start_color="FF6B6B", end_color="FF6B6B", fill_type="solid"),
        "Alto": PatternFill(start_color="FFD93D", end_color="FFD93D", fill_type="solid"),
        "Medio": PatternFill(start_color="6BCF7F", end_color="6BCF7F", fill_type="solid"),
        "Bajo": PatternFill(start_color="95E1D3", end_color="95E1D3", fill_type="solid")
    }
    
    # Encabezados
    headers = [
        "ID",
        "Nombre del Hito",
        "Descripción",
        "Prioridad",
        "Inicio",
        "Fin",
        "Duración (semanas)",
        "Duración (días)",
        "% Cumplimiento",
        "Estado",
        "Días Transcurridos",
        "Días Restantes"
    ]
    
    # Escribir encabezados
    for col, header in enumerate(headers, start=1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = border
    
    # Escribir datos de hitos
    for idx, (hito, fecha) in enumerate(zip(hitos, fechas), start=1):
        row = idx + 1
        
        # Calcular estado
        porcentaje = hito["porcentaje"]
        if porcentaje == 0:
            estado = "No Iniciado"
        elif porcentaje < 100:
            estado = "En Progreso"
        else:
            estado = "Completado"
        
        # Calcular días transcurridos y restantes
        hoy = datetime.now()
        dias_transcurridos = max(0, (hoy - fecha["inicio"]).days) if hoy >= fecha["inicio"] else 0
        dias_restantes = max(0, (fecha["fin"] - hoy).days) if hoy <= fecha["fin"] else 0
        
        # Datos de la fila
        datos = [
            idx,
            hito["nombre"],
            hito["descripcion"],
            hito["prioridad"],
            fecha["inicio"].strftime("%Y-%m-%d"),
            fecha["fin"].strftime("%Y-%m-%d"),
            hito["duracion_semanas"],
            fecha["duracion_dias"],
            f"{porcentaje}%",
            estado,
            dias_transcurridos,
            dias_restantes
        ]
        
        # Escribir datos
        for col, valor in enumerate(datos, start=1):
            cell = ws.cell(row=row, column=col, value=valor)
            cell.border = border
            cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
            
            # Aplicar color según prioridad en columna de prioridad
            if col == 4:  # Columna de Prioridad
                cell.fill = colores_prioridad.get(hito["prioridad"], PatternFill())
                cell.font = Font(bold=True)
            
            # Formato para porcentaje
            if col == 9:  # Columna de % Cumplimiento
                cell.alignment = Alignment(horizontal="center", vertical="center")
                if porcentaje == 100:
                    cell.fill = PatternFill(start_color="C6EFCE", end_color="C6EFCE", fill_type="solid")
                elif porcentaje >= 50:
                    cell.fill = PatternFill(start_color="FFEB9C", end_color="FFEB9C", fill_type="solid")
                else:
                    cell.fill = PatternFill(start_color="FFC7CE", end_color="FFC7CE", fill_type="solid")
            
            # Formato para estado
            if col == 10:  # Columna de Estado
                cell.alignment = Alignment(horizontal="center", vertical="center")
                if estado == "Completado":
                    cell.fill = PatternFill(start_color="C6EFCE", end_color="C6EFCE", fill_type="solid")
                elif estado == "En Progreso":
                    cell.fill = PatternFill(start_color="FFEB9C", end_color="FFEB9C", fill_type="solid")
                else:
                    cell.fill = PatternFill(start_color="FFC7CE", end_color="FFC7CE", fill_type="solid")
    
    # Ajustar ancho de columnas
    column_widths = {
        'A': 5,   # ID
        'B': 40,  # Nombre
        'C': 50,  # Descripción
        'D': 12,  # Prioridad
        'E': 12,  # Inicio
        'F': 12,  # Fin
        'G': 18,  # Duración (semanas)
        'H': 15,  # Duración (días)
        'I': 15,  # % Cumplimiento
        'J': 15,  # Estado
        'K': 18,  # Días Transcurridos
        'L': 18   # Días Restantes
    }
    
    for col, width in column_widths.items():
        ws.column_dimensions[col].width = width
    
    # Ajustar altura de filas
    ws.row_dimensions[1].height = 25
    for row in range(2, len(hitos) + 2):
        ws.row_dimensions[row].height = 30
    
    # Crear hoja de resumen
    ws_summary = wb.create_sheet("Resumen")
    
    # Resumen por prioridad
    resumen_headers = ["Prioridad", "Total Hitos", "Completados", "En Progreso", "No Iniciados", "% Promedio"]
    for col, header in enumerate(resumen_headers, start=1):
        cell = ws_summary.cell(row=1, column=col, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = border
    
    # Calcular estadísticas por prioridad
    prioridades = ["Crítico", "Alto", "Medio", "Bajo"]
    row = 2
    for prioridad in prioridades:
        hitos_prioridad = [h for h in hitos if h["prioridad"] == prioridad]
        total = len(hitos_prioridad)
        completados = len([h for h in hitos_prioridad if h["porcentaje"] == 100])
        en_progreso = len([h for h in hitos_prioridad if 0 < h["porcentaje"] < 100])
        no_iniciados = len([h for h in hitos_prioridad if h["porcentaje"] == 0])
        promedio = sum(h["porcentaje"] for h in hitos_prioridad) / total if total > 0 else 0
        
        datos_resumen = [
            prioridad,
            total,
            completados,
            en_progreso,
            no_iniciados,
            f"{promedio:.1f}%"
        ]
        
        for col, valor in enumerate(datos_resumen, start=1):
            cell = ws_summary.cell(row=row, column=col, value=valor)
            cell.border = border
            cell.alignment = Alignment(horizontal="center", vertical="center")
            if col == 1:  # Columna de Prioridad
                cell.fill = colores_prioridad.get(prioridad, PatternFill())
                cell.font = Font(bold=True)
        
        row += 1
    
    # Ajustar ancho de columnas en resumen
    for col in ['A', 'B', 'C', 'D', 'E', 'F']:
        ws_summary.column_dimensions[col].width = 18
    
    # Agregar información del proyecto
    ws_info = wb.create_sheet("Información del Proyecto")
    info_data = [
        ["PROYECTO", "Synkro - Plataforma SaaS de E-Commerce"],
        ["Versión Objetivo", "V1.0 - Lanzamiento Comercial"],
        ["Estado Actual", "85% completado"],
        ["Fecha de Inicio", fecha_inicio_proyecto.strftime("%Y-%m-%d")],
        ["Total de Hitos", len(hitos)],
        ["Tiempo Total Estimado", f"{sum(h['duracion_semanas'] for h in hitos)} semanas"],
        ["", ""],
        ["LEGENDA DE PRIORIDADES", ""],
        ["Crítico", "Hitos críticos para el MVP"],
        ["Alto", "Hitos de alta importancia"],
        ["Medio", "Hitos de importancia media"],
        ["Bajo", "Hitos de baja prioridad"],
        ["", ""],
        ["LEGENDA DE ESTADOS", ""],
        ["Completado", "Hito 100% completado"],
        ["En Progreso", "Hito iniciado pero no completado"],
        ["No Iniciado", "Hito aún no comenzado"]
    ]
    
    for row_idx, (label, value) in enumerate(info_data, start=1):
        ws_info.cell(row=row_idx, column=1, value=label).font = Font(bold=True)
        ws_info.cell(row=row_idx, column=2, value=value)
        if row_idx == 1:
            ws_info.cell(row=row_idx, column=1).font = Font(bold=True, size=14)
            ws_info.cell(row=row_idx, column=2).font = Font(bold=True, size=14)
    
    ws_info.column_dimensions['A'].width = 25
    ws_info.column_dimensions['B'].width = 50
    
    # Guardar archivo
    nombre_archivo = "GANTT_SYNKRO_SAAS.xlsx"
    wb.save(nombre_archivo)
    print(f"[OK] Archivo Excel generado exitosamente: {nombre_archivo}")
    return nombre_archivo

if __name__ == "__main__":
    crear_gantt_excel()

