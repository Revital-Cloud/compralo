#!/usr/bin/env python3
"""
Crea el primer usuario administrador de Synkro (admin_synkro).

Uso (desde synkro_panel/backend con venv activado):
  PYTHONPATH=app python scripts/create_admin.py --email admin@synkro.com --password "TuPasswordSeguro"
  python scripts/create_admin.py --email admin@synkro.com --password "TuPasswordSeguro" --nombre Admin --apellido Synkro

Requiere DATABASE_URL en .env o en el entorno.
"""
import argparse
import json
import os
import sys

# Permitir importar desde app cuando se ejecuta desde backend
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "app"))

from sqlalchemy import text
from core.database import SessionLocal
from core.jwt_utils import get_password_hash


def create_admin(
    email: str,
    password: str,
    nombre: str = "Admin",
    apellido: str = "Synkro",
    rol: str = "admin_synkro",
) -> dict:
    """Crea un usuario admin llamando a fun_insert_usuario_synkro."""
    hashed = get_password_hash(password)
    usr_insert = "system"  # Para el primer admin usamos 'system'
    db = SessionLocal()
    try:
        result = db.execute(
            text("""
                SELECT fun_insert_usuario_synkro(
                    :nom_usuario,
                    :ape_usuario,
                    :email_usuario,
                    :password_usuario,
                    CAST(:rol_synkro AS enum_rol_synkro),
                    :usr_insert,
                    true
                )
            """),
            {
                "nom_usuario": nombre,
                "ape_usuario": apellido,
                "email_usuario": email,
                "password_usuario": hashed,
                "rol_synkro": rol,
                "usr_insert": usr_insert,
            },
        )
        row = result.fetchone()
        db.commit()
        return row[0] if row else None
    except Exception as e:
        db.rollback()
        raise
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Crear usuario admin Synkro")
    parser.add_argument("--email", required=True, help="Email del admin")
    parser.add_argument("--password", required=True, help="Contraseña (mínimo 8 caracteres)")
    parser.add_argument("--nombre", default="Admin", help="Nombre (default: Admin)")
    parser.add_argument("--apellido", default="Synkro", help="Apellido (default: Synkro)")
    parser.add_argument("--rol", default="admin_synkro", choices=["admin_synkro", "soporte", "ventas"])
    args = parser.parse_args()

    if len(args.password) < 8:
        print("Error: La contraseña debe tener al menos 8 caracteres.", file=sys.stderr)
        sys.exit(1)

    try:
        raw = create_admin(
            email=args.email,
            password=args.password,
            nombre=args.nombre,
            apellido=args.apellido,
            rol=args.rol,
        )
        out = raw if isinstance(raw, dict) else (json.loads(raw) if isinstance(raw, str) else None)
        if out and out.get("success"):
            print(f"OK: Usuario creado. id_usuario={out.get('id_usuario')} email={out.get('email_usuario')}")
        else:
            print("Error:", out.get("message", "Error desconocido") if out else "Sin respuesta", file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
