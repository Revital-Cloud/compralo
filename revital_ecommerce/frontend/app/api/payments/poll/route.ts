import { NextRequest, NextResponse } from 'next/server';

function getBackendUrl(): string {
  if (process.env.NEXT_PUBLIC_BACKEND_URL) return process.env.NEXT_PUBLIC_BACKEND_URL;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    try {
      return new URL(apiUrl).origin;
    } catch {
      return 'http://localhost:8000';
    }
  }
  return 'http://localhost:8000';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    
    if (!reference) {
      return NextResponse.json(
        { error: 'reference es requerido' },
        { status: 400 }
      );
    }
    
    // Obtener token de autenticación desde el header de la request (server-side)
    // El frontend debe enviar el token en el header Authorization
    const authHeader = request.headers.get('authorization');
    
    console.log('🔍 [API-ROUTE-POLL] Authorization header:', authHeader ? 'Sí (primeros 20 chars: ' + authHeader.substring(0, 20) + '...)' : 'No');
    
    // Headers a preservar
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Agregar token si existe en el header de la request
    if (authHeader) {
      headers['Authorization'] = authHeader;
      console.log('✅ [API-ROUTE-POLL] Header Authorization agregado desde request');
    } else {
      console.warn('⚠️ [API-ROUTE-POLL] No se encontró header Authorization en la request. El endpoint puede requerir autenticación.');
    }
    
    // Preservar header x-store-id si existe (multi-tenant)
    const storeId = request.headers.get('x-store-id');
    if (storeId) {
      headers['x-store-id'] = storeId;
    }
    
    // Forwardear al backend FastAPI
    const response = await fetch(`${getBackendUrl()}/api/payments/poll?reference=${reference}`, {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error al hacer polling' },
        { status: response.status }
      );
    }
    
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Error en API route /api/payments/poll:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

