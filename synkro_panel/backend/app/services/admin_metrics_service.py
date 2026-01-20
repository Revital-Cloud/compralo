"""
Servicio de métricas para el dashboard admin de Synkro.
"""
from typing import Any, Dict

from sqlalchemy.orm import Session


def get_overview_metrics(db: Session) -> Dict[str, Any]:
    """
    Devuelve un diccionario con métricas agregadas básicas para el dashboard admin.

    Implementación completa pendiente; por ahora retorna valores por defecto
    para permitir integrar el endpoint y el frontend sin romper.
    """
    return {
        "total_clientes": 0,
        "total_instancias": 0,
        "instancias_por_estado": {},
        "instancias_por_region": {},
        "mrr_actual": 0.0,
        "ingresos_ultimos_30_dias": 0.0,
        "ingresos_por_plan": {},
        "funnel_ultimos_6_meses": [],
    }

"""
Servicio de métricas para el dashboard admin de Synkro.

Todas las consultas son agregadas sobre la base de datos central del panel SaaS
(`tab_clientes`, `tab_instancias`, `tab_suscripciones`, `tab_facturacion_*`, `tab_planes`).
"""
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session


def _to_float(value: Any) -> float:
    if value is None:
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, Decimal):
        return float(value)
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def get_overview_metrics(db: Session) -> Dict[str, Any]:
    """
    Obtiene un resumen general para el dashboard admin.

    Incluye totales y algunas distribuciones para tarjetas principales.
    """
    try:
        # Total de clientes activos (o en trial)
        total_clientes_row = db.execute(
            text(
                """
                SELECT COUNT(*) AS total
                FROM tab_clientes
                WHERE ind_activo = TRUE
                """
            )
        ).first()
        total_clientes = int(total_clientes_row.total) if total_clientes_row else 0

        # Total de instancias
        total_instancias_row = db.execute(
            text(
                """
                SELECT COUNT(*) AS total
                FROM tab_instancias
                """
            )
        ).first()
        total_instancias = int(total_instancias_row.total) if total_instancias_row else 0

        # Distribución por estado
        estados_rows = db.execute(
            text(
                """
                SELECT estado_instancia, COUNT(*) AS total
                FROM tab_instancias
                GROUP BY estado_instancia
                """
            )
        ).mappings()
        instancias_por_estado: Dict[str, int] = {
            str(row["estado_instancia"]): int(row["total"]) for row in estados_rows
        }

        # Distribución por región
        regiones_rows = db.execute(
            text(
                """
                SELECT COALESCE(region_deployment, 'sin_region') AS region, COUNT(*) AS total
                FROM tab_instancias
                GROUP BY COALESCE(region_deployment, 'sin_region')
                """
            )
        ).mappings()
        instancias_por_region: Dict[str, int] = {
            str(row["region"]): int(row["total"]) for row in regiones_rows
        }

        # MRR aproximado basado en suscripciones activas
        mrr_row = db.execute(
            text(
                """
                SELECT
                    COALESCE(
                        SUM(
                            CASE
                                WHEN tipo_facturacion = 'mensual' THEN precio_actual
                                WHEN tipo_facturacion = 'anual' THEN precio_actual / 12
                                WHEN tipo_facturacion = 'trimestral' THEN precio_actual / 3
                                ELSE 0
                            END
                        ),
                        0
                    ) AS mrr
                FROM tab_suscripciones
                WHERE estado_suscripcion = 'activa'
                """
            )
        ).first()
        mrr_actual = _to_float(mrr_row.mrr) if mrr_row else 0.0

        # Ingresos últimos 30 días
        ingresos_30_row = db.execute(
            text(
                """
                SELECT COALESCE(SUM(total), 0) AS ingresos
                FROM tab_facturacion_cabecera
                WHERE fecha_emision >= (CURRENT_TIMESTAMP - INTERVAL '30 days')
                  AND estado_pago IN ('pagado', 'reembolsado')
                """
            )
        ).first()
        ingresos_ultimos_30_dias = _to_float(ingresos_30_row.ingresos) if ingresos_30_row else 0.0

        # MRR aproximado por plan (basado en suscripciones activas)
        ingresos_plan_rows = db.execute(
            text(
                """
                SELECT
                    p.nom_plan,
                    COALESCE(
                        SUM(
                            CASE
                                WHEN s.tipo_facturacion = 'mensual' THEN s.precio_actual
                                WHEN s.tipo_facturacion = 'anual' THEN s.precio_actual / 12
                                WHEN s.tipo_facturacion = 'trimestral' THEN s.precio_actual / 3
                                ELSE 0
                            END
                        ),
                        0
                    ) AS mrr_plan
                FROM tab_suscripciones s
                JOIN tab_planes p ON s.id_plan = p.id_plan
                WHERE s.estado_suscripcion = 'activa'
                GROUP BY p.nom_plan
                ORDER BY p.nom_plan
                """
            )
        ).mappings()
        ingresos_por_plan: Dict[str, float] = {
            str(row["nom_plan"]): _to_float(row["mrr_plan"]) for row in ingresos_plan_rows
        }

        # Funnel últimos 6 meses basado en fecha de inserción de clientes
        funnel_rows = db.execute(
            text(
                """
                SELECT
                    date_trunc('month', fec_insert)::date AS periodo,
                    COUNT(*) AS registros,
                    COUNT(*) FILTER (WHERE estado_cliente = 'trial') AS trials,
                    COUNT(*) FILTER (WHERE estado_cliente = 'activo') AS activos
                FROM tab_clientes
                WHERE fec_insert >= (date_trunc('month', CURRENT_DATE) - INTERVAL '5 months')
                GROUP BY date_trunc('month', fec_insert)::date
                ORDER BY periodo
                """
            )
        ).mappings()

        funnel_ultimos_6_meses: List[Dict[str, Any]] = []
        for row in funnel_rows:
            periodo: date = row["periodo"]
            funnel_ultimos_6_meses.append(
                {
                    "periodo": periodo,
                    "registros": int(row["registros"] or 0),
                    "trials": int(row["trials"] or 0),
                    "activos": int(row["activos"] or 0),
                }
            )

        return {
            "total_clientes": total_clientes,
            "total_instancias": total_instancias,
            "instancias_por_estado": instancias_por_estado,
            "instancias_por_region": instancias_por_region,
            "mrr_actual": mrr_actual,
            "ingresos_ultimos_30_dias": ingresos_ultimos_30_dias,
            "ingresos_por_plan": ingresos_por_plan,
            "funnel_ultimos_6_meses": funnel_ultimos_6_meses,
        }
    except Exception as exc:
        db.rollback()
        raise Exception(f"Error al obtener métricas generales: {exc}") from exc


def get_revenue_timeseries(
    db: Session,
    from_date: date,
    to_date: date,
) -> List[Dict[str, Any]]:
    """
    Serie temporal de ingresos por día entre `from_date` y `to_date`.
    """
    try:
        query = text(
            """
            SELECT
                date_trunc('day', fecha_emision)::date AS fecha,
                COALESCE(SUM(total), 0) AS total
            FROM tab_facturacion_cabecera
            WHERE fecha_emision::date BETWEEN :from_date AND :to_date
              AND estado_pago IN ('pagado', 'reembolsado')
            GROUP BY date_trunc('day', fecha_emision)::date
            ORDER BY fecha
            """
        )
        result = db.execute(
            query,
            {
                "from_date": from_date,
                "to_date": to_date,
            },
        ).mappings()

        puntos: List[Dict[str, Any]] = []
        for row in result:
            puntos.append(
                {
                    "fecha": row["fecha"],
                    "total": _to_float(row["total"]),
                }
            )
        return puntos
    except Exception as exc:
        db.rollback()
        raise Exception(f"Error al obtener serie de ingresos: {exc}") from exc


def get_clients_timeseries(
    db: Session,
    from_date: date,
    to_date: date,
) -> List[Dict[str, Any]]:
    """
    Serie temporal mensual de registros / trials / activos entre `from_date` y `to_date`.
    """
    try:
        query = text(
            """
            SELECT
                date_trunc('month', fec_insert)::date AS periodo,
                COUNT(*) AS registros,
                COUNT(*) FILTER (WHERE estado_cliente = 'trial') AS trials,
                COUNT(*) FILTER (WHERE estado_cliente = 'activo') AS activos
            FROM tab_clientes
            WHERE fec_insert::date BETWEEN :from_date AND :to_date
            GROUP BY date_trunc('month', fec_insert)::date
            ORDER BY periodo
            """
        )
        result = db.execute(
            query,
            {
                "from_date": from_date,
                "to_date": to_date,
            },
        ).mappings()

        puntos: List[Dict[str, Any]] = []
        for row in result:
            puntos.append(
                {
                    "periodo": row["periodo"],
                    "registros": int(row["registros"] or 0),
                    "trials": int(row["trials"] or 0),
                    "activos": int(row["activos"] or 0),
                }
            )
        return puntos
    except Exception as exc:
        db.rollback()
        raise Exception(f"Error al obtener serie de clientes: {exc}") from exc


def get_instances_by_plan(db: Session) -> List[Dict[str, Any]]:
    """
    Distribución de instancias por plan y estado.

    Se basa en la suscripción activa asociada a la instancia (si existe).
    """
    try:
        query = text(
            """
            SELECT
                p.id_plan,
                p.nom_plan,
                COUNT(i.id_instancia) AS total_instancias,
                COUNT(i.id_instancia) FILTER (WHERE i.estado_instancia = 'activa') AS activas,
                COUNT(i.id_instancia) FILTER (WHERE i.estado_instancia = 'suspendida') AS suspendidas,
                COUNT(i.id_instancia) FILTER (WHERE i.estado_instancia = 'eliminada') AS eliminadas,
                COUNT(i.id_instancia) FILTER (WHERE i.estado_instancia = 'error') AS error
            FROM tab_instancias i
            LEFT JOIN tab_suscripciones s
              ON s.id_instancia = i.id_instancia
             AND s.estado_suscripcion = 'activa'
            LEFT JOIN tab_planes p
              ON s.id_plan = p.id_plan
            WHERE p.id_plan IS NOT NULL
            GROUP BY p.id_plan, p.nom_plan
            ORDER BY p.nom_plan
            """
        )
        result = db.execute(query).mappings()

        items: List[Dict[str, Any]] = []
        for row in result:
            items.append(
                {
                    "id_plan": int(row["id_plan"]),
                    "nom_plan": str(row["nom_plan"]),
                    "total_instancias": int(row["total_instancias"] or 0),
                    "activas": int(row["activas"] or 0),
                    "suspendidas": int(row["suspendidas"] or 0),
                    "eliminadas": int(row["eliminadas"] or 0),
                    "error": int(row["error"] or 0),
                }
            )
        return items
    except Exception as exc:
        db.rollback()
        raise Exception(f"Error al obtener instancias por plan: {exc}") from exc

              COUNT(*) FILTER (WHERE estado_cliente = 'trial') AS trials,
                    COUNT(*) FILTER (WHERE estado_cliente = 'activo') AS activos
                FROM tab_clientes
                WHERE fec_insert >= (date_trunc('month', CURRENT_DATE) - INTERVAL '5 months')
                GROUP BY date_trunc('month', fec_insert)::date
                ORDER BY periodo
                """
            )
        ).mappings()

        funnel_ultimos_6_meses: List[Dict[str, Any]] = []
        for row in funnel_rows:
            periodo: date = row["periodo"]
            funnel_ultimos_6_meses.append(
                {
                    "periodo": periodo,
                    "registros": int(row["registros"] or 0),
                    "trials": int(row["trials"] or 0),
                    "activos": int(row["activos"] or 0),
                }
            )

        return {
            "total_clientes": total_clientes,
            "total_instancias": total_instancias,
            "instancias_por_estado": instancias_por_estado,
            "instancias_por_region": instancias_por_region,
            "mrr_actual": mrr_actual,
            "ingresos_ultimos_30_dias": ingresos_ultimos_30_dias,
            "ingresos_por_plan": ingresos_por_plan,
            "funnel_ultimos_6_meses": funnel_ultimos_6_meses,
        }
    except Exception as exc:
        db.rollback()
        raise Exception(f"Error al obtener métricas generales: {exc}") from exc


def get_revenue_timeseries(
    db: Session,
    from_date: date,
    to_date: date,
) -> List[Dict[str, Any]]:
    """
    Serie temporal de ingresos por día entre `from_date` y `to_date`.
    """
    try:
        query = text(
            """
            SELECT
                date_trunc('day', fecha_emision)::date AS fecha,
                COALESCE(SUM(total), 0) AS total
            FROM tab_facturacion_cabecera
            WHERE fecha_emision::date BETWEEN :from_date AND :to_date
              AND estado_pago IN ('pagado', 'reembolsado')
            GROUP BY date_trunc('day', fecha_emision)::date
            ORDER BY fecha
            """
        )
        result = db.execute(
            query,
            {
                "from_date": from_date,
                "to_date": to_date,
            },
        ).mappings()

        puntos: List[Dict[str, Any]] = []
        for row in result:
            puntos.append(
                {
                    "fecha": row["fecha"],
                    "total": _to_float(row["total"]),
                }
            )
        return puntos
    except Exception as exc:
        db.rollback()
        raise Exception(f"Error al obtener serie de ingresos: {exc}") from exc


def get_clients_timeseries(
    db: Session,
    from_date: date,
    to_date: date,
) -> List[Dict[str, Any]]:
    """
    Serie temporal mensual de registros / trials / activos entre `from_date` y `to_date`.
    """
    try:
        query = text(
            """
            SELECT
                date_trunc('month', fec_insert)::date AS periodo,
                COUNT(*) AS registros,
                COUNT(*) FILTER (WHERE estado_cliente = 'trial') AS trials,
                COUNT(*) FILTER (WHERE estado_cliente = 'activo') AS activos
            FROM tab_clientes
            WHERE fec_insert::date BETWEEN :from_date AND :to_date
            GROUP BY date_trunc('month', fec_insert)::date
            ORDER BY periodo
            """
        )
        result = db.execute(
            query,
            {
                "from_date": from_date,
                "to_date": to_date,
            },
        ).mappings()

        puntos: List[Dict[str, Any]] = []
        for row in result:
            puntos.append(
                {
                    "periodo": row["periodo"],
                    "registros": int(row["registros"] or 0),
                    "trials": int(row["trials"] or 0),
                    "activos": int(row["activos"] or 0),
                }
            )
        return puntos
    except Exception as exc:
        db.rollback()
        raise Exception(f"Error al obtener serie de clientes: {exc}") from exc


def get_instances_by_plan(db: Session) -> List[Dict[str, Any]]:
    """
    Distribución de instancias por plan y estado.

    Se basa en la suscripción activa asociada a la instancia (si existe).
    """
    try:
        query = text(
            """
            SELECT
                p.id_plan,
                p.nom_plan,
                COUNT(i.id_instancia) AS total_instancias,
                COUNT(i.id_instancia) FILTER (WHERE i.estado_instancia = 'activa') AS activas,
                COUNT(i.id_instancia) FILTER (WHERE i.estado_instancia = 'suspendida') AS suspendidas,
                COUNT(i.id_instancia) FILTER (WHERE i.estado_instancia = 'eliminada') AS eliminadas,
                COUNT(i.id_instancia) FILTER (WHERE i.estado_instancia = 'error') AS error
            FROM tab_instancias i
            LEFT JOIN tab_suscripciones s
              ON s.id_instancia = i.id_instancia
             AND s.estado_suscripcion = 'activa'
            LEFT JOIN tab_planes p
              ON s.id_plan = p.id_plan
            WHERE p.id_plan IS NOT NULL
            GROUP BY p.id_plan, p.nom_plan
            ORDER BY p.nom_plan
            """
        )
        result = db.execute(query).mappings()

        items: List[Dict[str, Any]] = []
        for row in result:
            items.append(
                {
                    "id_plan": int(row["id_plan"]),
                    "nom_plan": str(row["nom_plan"]),
                    "total_instancias": int(row["total_instancias"] or 0),
                    "activas": int(row["activas"] or 0),
                    "suspendidas": int(row["suspendidas"] or 0),
                    "eliminadas": int(row["eliminadas"] or 0),
                    "error": int(row["error"] or 0),
                }
            )
        return items
    except Exception as exc:
        db.rollback()
        raise Exception(f"Error al obtener instancias por plan: {exc}") from exc

