"""
Seed de migración: páginas legales/informativas estáticas -> CMS Builder.

Inserta como páginas publicadas del builder (`tab_cms_content` con
`nom_cms_content = 'builder_page:<slug>'`) el contenido de las páginas
hardcodeadas (privacidad, términos, nosotros, devoluciones, contacto),
convertido a bloques en `scripts/cms_pages_seed.json`.

Idempotente: si una página ya existe en el builder, NO la sobreescribe
(para no pisar ediciones hechas desde el panel).

Uso (desde revital_ecommerce/backend, con el venv):
    PYTHONPATH=app venv/bin/python scripts/seed_cms_pages.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "app"))

from sqlalchemy import create_engine, text  # noqa: E402

from core.config import settings  # noqa: E402

SEED_FILE = os.path.join(os.path.dirname(__file__), "cms_pages_seed.json")
NOM_PREFIX = "builder_page:"


def _default_style():
    return {
        "bgColor": "transparent",
        "paddingTop": 0,
        "paddingBottom": 0,
        "marginTop": 0,
        "marginBottom": 0,
        "align": "left",
    }


def _build_sections(raw_sections):
    sections = []
    for i, s in enumerate(raw_sections):
        sections.append(
            {
                "id": f"{s['type']}-seed-{i}",
                "type": s["type"],
                "visible": True,
                "props": s.get("props", {}),
                "style": _default_style(),
            }
        )
    return sections


def main():
    pages = json.load(open(SEED_FILE, encoding="utf-8"))
    engine = create_engine(settings.DATABASE_URL)

    with engine.begin() as conn:
        admin = conn.execute(
            text("SELECT id_usuario FROM tab_usuarios WHERE id_rol = 1 ORDER BY id_usuario LIMIT 1")
        ).scalar()
        usr = admin if admin is not None else 1

        created, skipped = [], []
        for page in pages:
            slug = page["slug"]
            nom = f"{NOM_PREFIX}{slug}"
            exists = conn.execute(
                text("SELECT 1 FROM tab_cms_content WHERE nom_cms_content = :nom"), {"nom": nom}
            ).first()
            if exists:
                skipped.append(slug)
                continue

            sections = _build_sections(page["sections"])
            doc = {
                "slug": slug,
                "title": page["title"],
                "is_home": False,
                "seo": {
                    "title": page.get("title"),
                    "description": page.get("description"),
                    "og_image": None,
                },
                "draft": {"sections": sections},
                "published": {"sections": sections},
            }
            conn.execute(
                text(
                    """
                    INSERT INTO tab_cms_content
                        (nom_cms_content, des_cms_content, num_version, ind_publicado, usr_insert, fec_insert)
                    VALUES
                        (:nom, CAST(:des AS JSONB), 1, true, :usr, NOW())
                    """
                ),
                {"nom": nom, "des": json.dumps(doc), "usr": usr},
            )
            created.append(slug)

    print(f"Seed CMS pages — creadas: {created or '∅'} | ya existían (sin tocar): {skipped or '∅'}")


if __name__ == "__main__":
    main()
