#!/usr/bin/env python3
"""
Script de diagnóstico para verificar el estado de las órdenes y pagos.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Crear conexión a la base de datos
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_orders_and_payments():
    """Verifica el estado de las órdenes y sus pagos asociados."""
    db = SessionLocal()
    try:
        # Obtener las últimas 10 órdenes
        query = text("""
            SELECT 
                o.id_orden,
                o.ind_estado,
                o.metodo_pago,
                o.fec_pedido,
                o.val_total_pedido,
                COUNT(p.id_pago) as num_pagos,
                MAX(p.status) as ultimo_status_pago,
                MAX(p.reference) as ultima_reference
            FROM tab_ordenes o
            LEFT JOIN tab_pagos p ON p.id_orden = o.id_orden
            GROUP BY o.id_orden, o.ind_estado, o.metodo_pago, o.fec_pedido, o.val_total_pedido
            ORDER BY o.fec_pedido DESC
            LIMIT 10
        """)
        
        result = db.execute(query)
        rows = result.fetchall()
        
        print("=" * 80)
        print("DIAGNÓSTICO: Estado de Órdenes y Pagos")
        print("=" * 80)
        print(f"{'ID Orden':<10} {'Estado':<10} {'Método Pago':<20} {'Total':<15} {'Pagos':<8} {'Status Pago':<15} {'Reference':<30}")
        print("-" * 80)
        
        for row in rows:
            estado_map = {1: "Pendiente", 2: "Pagada", 3: "Enviada", 4: "Cancelada"}
            estado = estado_map.get(row.ind_estado, f"Desconocido({row.ind_estado})")
            print(f"{row.id_orden:<10} {estado:<10} {row.metodo_pago or 'N/A':<20} ${row.val_total_pedido or 0:<14} {row.num_pagos:<8} {row.ultimo_status_pago or 'N/A':<15} {row.ultima_reference or 'N/A':<30}")
        
        print("\n" + "=" * 80)
        print("Órdenes con pagos APPROVED pero estado Pendiente:")
        print("=" * 80)
        
        # Buscar órdenes con pagos APPROVED pero estado pendiente
        query_problem = text("""
            SELECT 
                o.id_orden,
                o.ind_estado,
                o.metodo_pago,
                p.id_pago,
                p.status as pago_status,
                p.reference,
                p.provider_transaction_id
            FROM tab_ordenes o
            INNER JOIN tab_pagos p ON p.id_orden = o.id_orden
            WHERE p.status = 'APPROVED'
            AND o.ind_estado != 2
            ORDER BY o.fec_pedido DESC
            LIMIT 10
        """)
        
        result_problem = db.execute(query_problem)
        problem_rows = result_problem.fetchall()
        
        if problem_rows:
            print(f"{'ID Orden':<10} {'Estado Orden':<15} {'ID Pago':<10} {'Status Pago':<15} {'Reference':<30} {'Transaction ID':<30}")
            print("-" * 80)
            for row in problem_rows:
                estado_map = {1: "Pendiente", 2: "Pagada", 3: "Enviada", 4: "Cancelada"}
                estado = estado_map.get(row.ind_estado, f"Desconocido({row.ind_estado})")
                print(f"{row.id_orden:<10} {estado:<15} {row.id_pago:<10} {row.pago_status:<15} {row.reference or 'N/A':<30} {row.provider_transaction_id or 'N/A':<30}")
        else:
            print("✅ No se encontraron órdenes con este problema.")
        
    finally:
        db.close()

if __name__ == "__main__":
    check_orders_and_payments()

