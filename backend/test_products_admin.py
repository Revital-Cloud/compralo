#!/usr/bin/env python3
"""
Script de prueba para el endpoint /products-admin
"""

import requests
import json

def test_products_admin():
    """Prueba el endpoint de productos admin"""
    
    # URL del endpoint de prueba (sin autenticación)
    url = "http://localhost:8000/products-admin-test"
    
    # Parámetros de prueba
    params = {
        "ordenar_por": "nombre",
        "orden": "ASC",
        "limit": 10,
        "offset": 0
    }
    
    # Headers (no necesarios para el endpoint de prueba)
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        print("🔍 Probando endpoint /products-admin...")
        print(f"URL: {url}")
        print(f"Parámetros: {params}")
        
        # Hacer la petición
        response = requests.get(url, params=params, headers=headers)
        
        print(f"\n📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Éxito! Productos encontrados: {len(data)}")
            
            if data:
                print(f"\n📋 Primer producto:")
                first_product = data[0]
                for key, value in first_product.items():
                    print(f"  {key}: {value} ({type(value).__name__})")
                
                print(f"\n📊 Total registros: {first_product.get('total_registros', 'N/A')}")
            else:
                print("⚠️  No se encontraron productos")
                
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Respuesta: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Error: No se pudo conectar al servidor")
        print("Asegúrate de que el backend esté ejecutándose en http://localhost:8000")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")

if __name__ == "__main__":
    test_products_admin()
