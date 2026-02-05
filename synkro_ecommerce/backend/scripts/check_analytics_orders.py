#!/usr/bin/env python3
"""
Diagnóstico: órdenes en la BD y por qué Performance por Categoría puede estar en 0.
"""
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def run():
    db = SessionLocal()
    try:
        now = datetime.now()
        start_30 = now - timedelta(days=30)
        prev_start = start_30 - timedelta(days=30)
        prev_end = start_30

        print("=" * 70)
        print("1. TOTAL ÓRDENES POR ESTADO (tab_ordenes)")
        print("=" * 70)
        r = db.execute(text("""
            SELECT ind_estado,
                   COUNT(*) as total
            FROM tab_ordenes
            GROUP BY ind_estado
            ORDER BY ind_estado
        """))
        for row in r:
            estado = {1: "Pendiente", 2: "Pagada", 3: "Completada", 4: "Cancelada"}.get(row.ind_estado, row.ind_estado)
            print(f"  ind_estado={row.ind_estado} ({estado}): {row.total} órdenes")
        print()

        print("=" * 70)
        print("2. ÓRDENES EN ÚLTIMOS 30 DÍAS (por estado)")
        print("=" * 70)
        r = db.execute(text("""
            SELECT ind_estado, COUNT(*) as total
            FROM tab_ordenes
            WHERE fec_pedido >= :start AND fec_pedido <= :end
            GROUP BY ind_estado
        """), {"start": start_30, "end": now})
        rows = list(r)
        if not rows:
            print("  No hay órdenes en los últimos 30 días.")
        else:
            for row in rows:
                estado = {1: "Pendiente", 2: "Pagada", 3: "Completada", 4: "Cancelada"}.get(row.ind_estado, row.ind_estado)
                print(f"  ind_estado={row.ind_estado} ({estado}): {row.total}")
        print()

        print("=" * 70)
        print("3. DETALLE ÚLTIMAS 5 ÓRDENES (id, estado, fec_pedido, val_total)")
        print("=" * 70)
        r = db.execute(text("""
            SELECT id_orden, ind_estado, fec_pedido, val_total_pedido
            FROM tab_ordenes
            ORDER BY fec_pedido DESC
            LIMIT 5
        """))
        for row in r:
            estado = {1: "Pendiente", 2: "Pagada", 3: "Completada", 4: "Cancelada"}.get(row.ind_estado, row.ind_estado)
            print(f"  id={row.id_orden} estado={row.ind_estado}({estado}) fec={row.fec_pedido} total={row.val_total_pedido}")
        print()

        print("=" * 70)
        print("4. TABLA tab_orden_productos (filas y ejemplo)")
        print("=" * 70)
        r = db.execute(text("SELECT COUNT(*) as n FROM tab_orden_productos"))
        n_op = r.scalar()
        print(f"  Total filas en tab_orden_productos: {n_op}")
        if n_op and n_op > 0:
            r = db.execute(text("""
                SELECT op.id_orden, op.id_categoria_producto, op.subtotal, o.ind_estado, o.fec_pedido
                FROM tab_orden_productos op
                JOIN tab_ordenes o ON o.id_orden = op.id_orden
                ORDER BY o.fec_pedido DESC
                LIMIT 5
            """))
            for row in r:
                print(f"  id_orden={row.id_orden} id_categoria_producto={row.id_categoria_producto} subtotal={row.subtotal} ind_estado={row.ind_estado} fec={row.fec_pedido}")
        print()

        print("=" * 70)
        print("5. CATEGORÍAS ACTIVAS (tab_categorias)")
        print("=" * 70)
        r = db.execute(text("SELECT id_categoria, nom_categoria FROM tab_categorias WHERE ind_activo = TRUE ORDER BY nom_categoria"))
        for row in r:
            print(f"  id_categoria={row.id_categoria} nom_categoria={row.nom_categoria}")
        print()

        print("=" * 70)
        print("6. QUERY ANALYTICS (ventas por categoría, últimos 30d, estado 2 o 3)")
        print("=" * 70)
        q = text("""
            SELECT 
                c.id_categoria,
                COALESCE(SUM(op.subtotal) FILTER (
                    WHERE o.fec_pedido >= :start_date AND o.fec_pedido <= :end_date
                    AND o.ind_estado IN (2, 3)
                ), 0) as ingresos_actuales,
                COALESCE(SUM(op.subtotal) FILTER (
                    WHERE o.fec_pedido >= :prev_start AND o.fec_pedido <= :prev_end
                    AND o.ind_estado IN (2, 3)
                ), 0) as ingresos_anteriores
            FROM tab_categorias c
            LEFT JOIN tab_productos p ON c.id_categoria = p.id_categoria AND p.ind_activo = TRUE
            LEFT JOIN tab_orden_productos op ON p.id_categoria = op.id_categoria_producto
                AND p.id_linea = op.id_linea_producto
                AND p.id_sublinea = op.id_sublinea_producto
                AND p.id_producto = op.id_producto
            LEFT JOIN tab_ordenes o ON op.id_orden = o.id_orden AND o.ind_estado IN (2, 3)
            WHERE c.ind_activo = TRUE
            GROUP BY c.id_categoria
        """)
        r = db.execute(q, {
            "start_date": start_30, "end_date": now,
            "prev_start": prev_start, "prev_end": prev_end
        })
        for row in r:
            print(f"  id_categoria={row.id_categoria} ingresos_actuales={row.ingresos_actuales} ingresos_anteriores={row.ingresos_anteriores}")
        print()

    finally:
        db.close()

if __name__ == "__main__":
    run()
