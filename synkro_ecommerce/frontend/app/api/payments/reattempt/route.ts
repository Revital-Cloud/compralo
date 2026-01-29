import { NextRequest, NextResponse } from 'next/server';
import { getStoredToken } from '@/utils/apiWrapper';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Obtener token de autenticación
    const token = getStoredToken();
    
    // Headers a preservar
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Agregar token si existe
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Preservar header x-store-id si existe (multi-tenant)
    const storeId = request.headers.get('x-store-id');
    if (storeId) {
      headers['x-store-id'] = storeId;
    }
    
    // Forwardear al backend FastAPI
    const response = await fetch(`${BACKEND_URL}/api/payments/reattempt`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error al crear reintento' },
        { status: response.status }
      );
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Error en API route /api/payments/reattempt:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

