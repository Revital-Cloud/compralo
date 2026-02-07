#!/usr/bin/env python3
"""
Script para eliminar todas las órdenes y sus datos relacionados.

ADVERTENCIA: Este script elimina TODAS las órdenes, pagos y productos de órdenes.
Solo usar en desarrollo/testing.

Uso:
    python3 scripts/cleanup_all_orders.py          # Con confirmación interactiva
    python3 scripts/cleanup_all_orders.py --yes    # Sin confirmación (automático)
"""

import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/db_revital')

def cleanup_all_orders(skip_confirmation=False):
    """Elimina todas las órdenes y sus datos relacionados."""
    engine = create_engine(DATABASE_URL)
    
    print("=" * 80)
    print("SCRIPT DE LIMPIEZA DE ÓRDENES")
    print("=" * 80)
    print("\n⚠️  ADVERTENCIA: Este script eliminará TODAS las órdenes, pagos y productos de órdenes.")
    print("   Solo usar en desarrollo/testing.\n")
    
    # Confirmar antes de proceder (a menos que se pase --yes)
    if not skip_confirmation:
        try:
            confirm = input("¿Estás seguro de que quieres eliminar TODAS las órdenes? (escribe 'SI' para confirmar): ")
            if confirm != 'SI':
                print("❌ Operación cancelada.")
                return
        except EOFError:
            print("❌ No se puede leer la entrada. Usa --yes para ejecutar sin confirmación.")
            return
    
    try:
        with engine.begin() as conn:  # Usar begin() para transacción automática
            # 1. Contar registros antes de eliminar
            print("\n📊 Contando registros antes de eliminar...")
            
            count_movimientos = conn.execute(text("SELECT COUNT(*) FROM tab_movimientos_inventario WHERE id_orden_usuario_detalle IS NOT NULL")).scalar()
            count_orden_productos = conn.execute(text("SELECT COUNT(*) FROM tab_orden_productos")).scalar()
            count_pagos = conn.execute(text("SELECT COUNT(*) FROM tab_pagos")).scalar()
            count_ordenes = conn.execute(text("SELECT COUNT(*) FROM tab_ordenes")).scalar()
            
            print(f"   - Movimientos de inventario relacionados: {count_movimientos}")
            print(f"   - Productos de órdenes: {count_orden_productos}")
            print(f"   - Pagos: {count_pagos}")
            print(f"   - Órdenes: {count_ordenes}")
            
            if count_ordenes == 0:
                print("\n✅ No hay órdenes para eliminar.")
                return
            
            # 2. Eliminar en el orden correcto (respetando foreign keys)
            print("\n🗑️  Eliminando registros...")
            
            # Primero: Eliminar movimientos de inventario relacionados con órdenes
            if count_movimientos > 0:
                print("   0. Eliminando movimientos de inventario relacionados con órdenes...")
                result0 = conn.execute(text("DELETE FROM tab_movimientos_inventario WHERE id_orden_usuario_detalle IS NOT NULL"))
                print(f"      ✅ Eliminados {result0.rowcount} movimientos de inventario")
            
            # Segundo: Eliminar productos de órdenes
            print("   1. Eliminando productos de órdenes...")
            result1 = conn.execute(text("DELETE FROM tab_orden_productos"))
            print(f"      ✅ Eliminados {result1.rowcount} productos de órdenes")
            
            # Tercero: Eliminar pagos
            print("   2. Eliminando pagos...")
            result2 = conn.execute(text("DELETE FROM tab_pagos"))
            print(f"      ✅ Eliminados {result2.rowcount} pagos")
            
            # Cuarto: Eliminar órdenes
            print("   3. Eliminando órdenes...")
            result3 = conn.execute(text("DELETE FROM tab_ordenes"))
            print(f"      ✅ Eliminadas {result3.rowcount} órdenes")
            
            # 3. Verificar que se eliminaron todos
            print("\n📊 Verificando eliminación...")
            
            count_orden_productos_after = conn.execute(text("SELECT COUNT(*) FROM tab_orden_productos")).scalar()
            count_pagos_after = conn.execute(text("SELECT COUNT(*) FROM tab_pagos")).scalar()
            count_ordenes_after = conn.execute(text("SELECT COUNT(*) FROM tab_ordenes")).scalar()
            
            print(f"   - Productos de órdenes restantes: {count_orden_productos_after}")
            print(f"   - Pagos restantes: {count_pagos_after}")
            print(f"   - Órdenes restantes: {count_ordenes_after}")
            
            if count_orden_productos_after == 0 and count_pagos_after == 0 and count_ordenes_after == 0:
                print("\n✅ ¡Limpieza completada exitosamente!")
                print("   Todas las órdenes, pagos y productos de órdenes han sido eliminados.")
            else:
                print("\n⚠️  ADVERTENCIA: Algunos registros no se eliminaron.")
                print("   Revisa los mensajes anteriores para más detalles.")
        
        print("\n" + "=" * 80)
        
    except Exception as e:
        print(f"\n❌ Error durante la limpieza: {str(e)}")
        print("   La transacción se ha revertido automáticamente.")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    skip_confirmation = '--yes' in sys.argv or '-y' in sys.argv
    cleanup_all_orders(skip_confirmation=skip_confirmation)
