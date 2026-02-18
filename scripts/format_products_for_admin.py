#!/usr/bin/env python3
"""
Convierte el JSON de productos generados a un formato Markdown legible
para crear productos manualmente desde el admin.
"""

import json
from pathlib import Path

# Leer el JSON generado
json_file = Path(__file__).parent / "productos_generados.json"
with open(json_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Generar formato Markdown
output_lines = []
output_lines.append("# Script de Productos para Crear Manualmente desde Admin\n")
output_lines.append(f"**Total de productos:** {data['metadata']['total_products']}\n")
output_lines.append(f"**Categorías utilizadas:** {data['metadata']['categories_used']}\n")
output_lines.append(f"**Marcas utilizadas:** {data['metadata']['brands_used']}\n")
output_lines.append(f"**Proveedores utilizados:** {data['metadata']['suppliers_used']}\n")
output_lines.append("\n---\n\n")

for idx, product in enumerate(data['products'], 1):
    output_lines.append(f"## Producto {idx}: {product['name']}\n")
    output_lines.append(f"**Slug:** `{product['slug']}`\n")
    output_lines.append(f"**Categoría:** {product['category_name']} (ID: {int(product['category_id'])})\n")
    
    if product.get('marca_name'):
        output_lines.append(f"**Marca:** {product['marca_name']} (ID: {int(product['id_marca'])})\n")
    
    if product.get('proveedor_name'):
        output_lines.append(f"**Proveedor:** {product['proveedor_name']} (ID: {int(product['id_proveedor'])})\n")
    
    output_lines.append(f"**Descripción:** {product['description']}\n")
    output_lines.append(f"\n**Variantes:** {len(product['variants'])} grupos\n\n")
    
    for v_idx, variant_group in enumerate(product['variants'], 1):
        output_lines.append(f"### Variante {v_idx}: {variant_group['dominant_attribute']} = {variant_group['dominant_value']}\n")
        
        if variant_group.get('hex_color'):
            output_lines.append(f"- **Color hex:** `{variant_group['hex_color']}`\n")
        
        output_lines.append(f"- **Combinaciones:** {len(variant_group['combinations'])}\n\n")
        
        for c_idx, combination in enumerate(variant_group['combinations'], 1):
            output_lines.append(f"  **Combinación {c_idx}:**\n")
            output_lines.append(f"  - SKU: `{combination['sku']}`\n")
            output_lines.append(f"  - Precio: ${combination['price']:,.2f}\n")
            output_lines.append(f"  - Stock: {combination['stock']}\n")
            
            if combination.get('attributes'):
                output_lines.append(f"  - Atributos adicionales:\n")
                for attr_name, attr_value in combination['attributes'].items():
                    output_lines.append(f"    - {attr_name}: {attr_value}\n")
            output_lines.append("\n")
    
    output_lines.append("---\n\n")

# Guardar en archivo Markdown
output_file = Path(__file__).parent / "PRODUCTOS_PARA_ADMIN.md"
with open(output_file, 'w', encoding='utf-8') as f:
    f.writelines(output_lines)

print(f"✓ Archivo Markdown generado: {output_file}")
print(f"  Total productos: {data['metadata']['total_products']}")
