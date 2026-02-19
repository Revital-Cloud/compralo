#!/usr/bin/env python3
"""
Script para generar 50 productos con 3-5 variantes cada uno basado en datos reales de la BD.
Consulta categorías, marcas, proveedores, atributos y productos existentes.
"""

import os
import sys
import json
import random
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from urllib.parse import urlparse
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor

# Agregar el directorio raíz al path para importar config
sys.path.insert(0, str(Path(__file__).parent.parent))

# Intentar cargar desde .env del backend
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent / "revital_ecommerce" / "backend" / ".env"
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    pass

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("Error: DATABASE_URL no encontrada en variables de entorno")
    print("Asegúrate de tener un archivo .env en revital_ecommerce/backend/")
    sys.exit(1)


def convert_decimal(obj):
    """Convierte Decimal a float para serialización JSON"""
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: convert_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_decimal(item) for item in obj]
    return obj


def get_db_connection():
    """Conecta a la base de datos usando DATABASE_URL"""
    return psycopg2.connect(DATABASE_URL)


def get_categories_hierarchy(conn) -> Dict:
    """Obtiene categorías organizadas por nivel (padres, hijas, nietas)"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Obtener todas las categorías activas
        cur.execute("""
            SELECT id, name, slug, parent_id, is_active
            FROM tab_categories
            WHERE is_active = TRUE
            ORDER BY parent_id NULLS FIRST, id
        """)
        all_cats = cur.fetchall()
        
        # Organizar por nivel
        padres = [c for c in all_cats if c['parent_id'] is None]
        hijas = {}
        nietas = {}
        
        for cat in all_cats:
            if cat['parent_id'] is not None:
                # Verificar si es hija o nieta
                parent = next((p for p in all_cats if p['id'] == cat['parent_id']), None)
                if parent and parent['parent_id'] is None:
                    # Es hija directa
                    if cat['parent_id'] not in hijas:
                        hijas[cat['parent_id']] = []
                    hijas[cat['parent_id']].append(cat)
                else:
                    # Es nieta
                    if cat['parent_id'] not in nietas:
                        nietas[cat['parent_id']] = []
                    nietas[cat['parent_id']].append(cat)
        
        return {
            'padres': [dict(p) for p in padres],
            'hijas': {k: [dict(h) for h in v] for k, v in hijas.items()},
            'nietas': {k: [dict(n) for n in v] for k, v in nietas.items()},
            'todas': [dict(c) for c in all_cats]
        }


def get_brands(conn) -> List[Dict]:
    """Obtiene todas las marcas activas"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT id_marca, nom_marca
            FROM tab_marcas
            WHERE ind_activo = TRUE
            ORDER BY nom_marca
        """)
        return [dict(b) for b in cur.fetchall()]


def get_suppliers(conn) -> List[Dict]:
    """Obtiene todos los proveedores activos"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT id_proveedor, nom_proveedor, email
            FROM tab_proveedores
            WHERE ind_activo = TRUE
            ORDER BY nom_proveedor
        """)
        return [dict(s) for s in cur.fetchall()]


def get_category_attributes(conn) -> Dict[int, List[Dict]]:
    """Obtiene atributos por categoría con sus valores predefinidos"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT 
                ca.category_id,
                a.id as attribute_id,
                a.name as attribute_name,
                a.data_type,
                a.has_predefined_values,
                ca.is_required,
                ca.is_filterable
            FROM tab_category_attributes ca
            JOIN tab_attributes a ON ca.attribute_id = a.id
            ORDER BY ca.category_id, a.name
        """)
        attrs_by_cat = {}
        for row in cur.fetchall():
            cat_id = row['category_id']
            if cat_id not in attrs_by_cat:
                attrs_by_cat[cat_id] = []
            attrs_by_cat[cat_id].append(dict(row))
        
        # Obtener valores predefinidos para cada atributo
        for cat_id, attrs in attrs_by_cat.items():
            for attr in attrs:
                if attr['has_predefined_values']:
                    cur.execute("""
                        SELECT value, hex_color, sort_order
                        FROM tab_attribute_values
                        WHERE attribute_id = %s AND is_active = TRUE
                        ORDER BY sort_order, value
                    """, (attr['attribute_id'],))
                    attr['values'] = [dict(v) for v in cur.fetchall()]
                else:
                    attr['values'] = []
        
        return attrs_by_cat


def get_existing_products(conn) -> List[Dict]:
    """Obtiene productos existentes con sus variantes"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT 
                p.id,
                p.name,
                p.category_id,
                p.id_marca,
                p.id_proveedor,
                COUNT(DISTINCT vg.id) as variant_groups_count,
                COUNT(DISTINCT vc.id) as variants_count
            FROM tab_products p
            LEFT JOIN tab_product_variant_groups vg ON p.id = vg.product_id
            LEFT JOIN tab_product_variant_combinations vc ON vg.id = vc.group_id
            WHERE p.is_active = TRUE
            GROUP BY p.id, p.name, p.category_id, p.id_marca, p.id_proveedor
            ORDER BY p.name
        """)
        return [dict(p) for p in cur.fetchall()]


def generate_slug(name: str) -> str:
    """Genera un slug a partir de un nombre"""
    import re
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = re.sub(r'^-+|-+$', '', slug)
    return slug


def generate_product_variants(
    category_id: int,
    category_attrs: List[Dict],
    num_variants: int = None
) -> List[Dict]:
    """
    Genera variantes para un producto basado en los atributos de su categoría.
    Retorna grupos de variantes con sus combinaciones.
    """
    if num_variants is None:
        num_variants = random.randint(3, 5)
    
    # Buscar atributo dominante (generalmente Color)
    dominant_attr = None
    for attr in category_attrs:
        if attr['attribute_name'].lower() in ['color', 'colores', 'color']:
            dominant_attr = attr
            break
    
    # Si no hay color, usar el primer atributo con valores predefinidos
    if not dominant_attr:
        for attr in category_attrs:
            if attr['has_predefined_values'] and attr['values']:
                dominant_attr = attr
                break
    
    variants = []
    
    if dominant_attr and dominant_attr['values']:
        # Usar valores predefinidos del atributo dominante
        available_values = dominant_attr['values']
        num_groups = min(num_variants, len(available_values))
        selected_values = random.sample(available_values, num_groups)
        
        for i, value in enumerate(selected_values):
            # Crear grupo de variante
            group = {
                'dominant_attribute': dominant_attr['attribute_name'],
                'dominant_value': value['value'],
                'hex_color': value.get('hex_color'),
                'combinations': []
            }
            
            # Generar combinaciones dentro del grupo (ej: diferentes tallas)
            # Buscar otro atributo para combinaciones (ej: Talla)
            other_attr = None
            for attr in category_attrs:
                if attr['attribute_id'] != dominant_attr['attribute_id']:
                    if attr['has_predefined_values'] and attr['values']:
                        other_attr = attr
                        break
            
            if other_attr and other_attr['values']:
                # Crear combinaciones con el otro atributo
                num_combinations = random.randint(1, min(3, len(other_attr['values'])))
                selected_other_values = random.sample(other_attr['values'], num_combinations)
                
                for j, other_value in enumerate(selected_other_values):
                    attributes_json = {
                        other_attr['attribute_name']: other_value['value']
                    }
                    
                    combination = {
                        'sku': f"SKU-{random.randint(10000, 99999)}",
                        'price': round(random.uniform(50000, 500000), 2),
                        'stock': random.randint(10, 100),
                        'attributes': attributes_json
                    }
                    group['combinations'].append(combination)
            else:
                # Solo una combinación sin otro atributo
                combination = {
                    'sku': f"SKU-{random.randint(10000, 99999)}",
                    'price': round(random.uniform(50000, 500000), 2),
                    'stock': random.randint(10, 100),
                    'attributes': {}
                }
                group['combinations'].append(combination)
            
            variants.append(group)
    else:
        # Sin atributo dominante, crear variantes simples
        for i in range(num_variants):
            group = {
                'dominant_attribute': 'Variante',
                'dominant_value': f'Variante {i+1}',
                'hex_color': None,
                'combinations': [{
                    'sku': f"SKU-{random.randint(10000, 99999)}",
                    'price': round(random.uniform(50000, 500000), 2),
                    'stock': random.randint(10, 100),
                    'attributes': {}
                }]
            }
            variants.append(group)
    
    return variants


def generate_products_script(
    categories_hierarchy: Dict,
    brands: List[Dict],
    suppliers: List[Dict],
    category_attributes: Dict[int, List[Dict]],
    existing_products: List[Dict],
    num_products: int = 50
) -> Dict:
    """Genera el script JSON con productos y variantes"""
    
    # Obtener solo categorías nietas (hojas) para productos
    nietas_hojas = []
    for parent_id, nietas_list in categories_hierarchy['nietas'].items():
        nietas_hojas.extend(nietas_list)
    
    if not nietas_hojas:
        # Si no hay nietas, usar hijas
        for parent_id, hijas_list in categories_hierarchy['hijas'].items():
            nietas_hojas.extend(hijas_list)
    
    if not nietas_hojas:
        # Si no hay hijas, usar padres
        nietas_hojas = categories_hierarchy['padres']
    
    if not nietas_hojas:
        return "# Error: No hay categorías disponibles en la base de datos"
    
    # Generar productos
    products_data = []
    used_names = set(p['name'].lower() for p in existing_products)
    
    # Nombres de productos de ejemplo por categoría
    product_templates = {
        'tecnologia': ['Smartphone', 'Tablet', 'Laptop', 'Monitor', 'Teclado', 'Mouse', 'Auriculares', 'Cargador'],
        'hogar': ['Sofá', 'Mesa', 'Silla', 'Lámpara', 'Alfombra', 'Cortina', 'Cojín', 'Espejo'],
        'moda': ['Camiseta', 'Pantalón', 'Vestido', 'Zapatos', 'Bolso', 'Gorra', 'Bufanda', 'Cinturón'],
        'deportes': ['Pelota', 'Raqueta', 'Bicicleta', 'Pesas', 'Colchoneta', 'Mochila', 'Botella', 'Toalla'],
        'belleza': ['Crema', 'Shampoo', 'Perfume', 'Labial', 'Sombras', 'Brocha', 'Esmalte', 'Mascarilla'],
        'default': ['Producto', 'Artículo', 'Item', 'Elemento', 'Objeto', 'Mercancía', 'Bien', 'Servicio']
    }
    
    for i in range(num_products):
        # Seleccionar categoría aleatoria
        category = random.choice(nietas_hojas)
        category_name_lower = category['name'].lower()
        
        # Seleccionar template según categoría
        template_key = 'default'
        for key in product_templates.keys():
            if key in category_name_lower:
                template_key = key
                break
        
        # Generar nombre único
        base_name = random.choice(product_templates[template_key])
        brand = random.choice(brands) if brands else None
        supplier = random.choice(suppliers) if suppliers else None
        
        if brand:
            product_name = f"{base_name} {brand['nom_marca']}"
        else:
            product_name = f"{base_name} {random.randint(1, 999)}"
        
        # Asegurar nombre único
        counter = 1
        original_name = product_name
        while product_name.lower() in used_names:
            product_name = f"{original_name} {counter}"
            counter += 1
        used_names.add(product_name.lower())
        
        # Obtener atributos de la categoría
        cat_attrs = category_attributes.get(category['id'], [])
        
        # Generar variantes
        variants = generate_product_variants(category['id'], cat_attrs)
        
        product_data = {
            'name': product_name,
            'slug': generate_slug(product_name),
            'category_id': category['id'],
            'category_name': category['name'],
            'description': f"Descripción detallada del producto {product_name}. Características y beneficios principales.",
            'id_marca': brand['id_marca'] if brand else None,
            'marca_name': brand['nom_marca'] if brand else None,
            'id_proveedor': supplier['id_proveedor'] if supplier else None,
            'proveedor_name': supplier['nom_proveedor'] if supplier else None,
            'variants': variants
        }
        
        products_data.append(product_data)
    
    # Generar script en formato JSON estructurado
    script_content = {
        'metadata': {
            'total_products': len(products_data),
            'categories_used': len(set(p['category_id'] for p in products_data)),
            'brands_used': len(set(p['id_marca'] for p in products_data if p['id_marca'])),
            'suppliers_used': len(set(p['id_proveedor'] for p in products_data if p['id_proveedor']))
        },
        'products': products_data
    }
    
    return script_content


def main():
    """Función principal"""
    print("Conectando a la base de datos...")
    conn = get_db_connection()
    
    try:
        print("Consultando categorías...")
        categories_hierarchy = get_categories_hierarchy(conn)
        print(f"  - Padres: {len(categories_hierarchy['padres'])}")
        print(f"  - Hijas: {sum(len(v) for v in categories_hierarchy['hijas'].values())}")
        print(f"  - Nietas: {sum(len(v) for v in categories_hierarchy['nietas'].values())}")
        
        print("Consultando marcas...")
        brands = get_brands(conn)
        print(f"  - Marcas encontradas: {len(brands)}")
        
        print("Consultando proveedores...")
        suppliers = get_suppliers(conn)
        print(f"  - Proveedores encontrados: {len(suppliers)}")
        
        print("Consultando atributos por categoría...")
        category_attributes = get_category_attributes(conn)
        print(f"  - Categorías con atributos: {len(category_attributes)}")
        
        print("Consultando productos existentes...")
        existing_products = get_existing_products(conn)
        print(f"  - Productos existentes: {len(existing_products)}")
        
        print("\nGenerando script con 50 productos...")
        script_content = generate_products_script(
            categories_hierarchy,
            brands,
            suppliers,
            category_attributes,
            existing_products,
            num_products=50
        )
        
        # Convertir Decimal a float antes de serializar
        script_content = convert_decimal(script_content)
        script_json = json.dumps(script_content, indent=2, ensure_ascii=False)
        
        # Guardar en archivo
        output_file = Path(__file__).parent / "productos_generados.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(script_json)
        
        print(f"\n✓ Script generado exitosamente: {output_file}")
        print(f"  Total productos: 50")
        print(f"  Cada producto tiene entre 3-5 variantes")
        print("\nEl archivo contiene la estructura JSON lista para usar en el admin.")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()


if __name__ == "__main__":
    main()
