import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔍 [API-ROUTE] /api/payments/attach-transaction recibido:', {
      reference: body.reference,
      transaction_id: body.transaction_id ? body.transaction_id.substring(0, 20) + '...' : 'N/A'
    });
    
    // Obtener token de autenticación desde el header de la request (server-side)
    // El frontend debe enviar el token en el header Authorization
    const authHeader = request.headers.get('authorization');
    
    console.log('🔍 [API-ROUTE] Authorization header:', authHeader ? 'Sí (primeros 20 chars: ' + authHeader.substring(0, 20) + '...)' : 'No');
    
    // Headers a preservar
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Agregar token si existe en el header de la request
    if (authHeader) {
      headers['Authorization'] = authHeader;
      console.log('✅ [API-ROUTE] Header Authorization agregado desde request');
    } else {
      console.warn('⚠️ [API-ROUTE] No se encontró header Authorization en la request. El endpoint puede requerir autenticación.');
    }
    
    // Preservar header x-store-id si existe (multi-tenant)
    const storeId = request.headers.get('x-store-id');
    if (storeId) {
      headers['x-store-id'] = storeId;
      console.log('🔍 [API-ROUTE] Header x-store-id agregado:', storeId);
    }
    
    console.log('🔍 [API-ROUTE] Enviando request al backend:', {
      url: `${BACKEND_URL}/api/payments/attach-transaction`,
      method: 'POST',
      hasAuth: !!authHeader,
      hasStoreId: !!storeId
    });
    
    // Forwardear al backend FastAPI
    const response = await fetch(`${BACKEND_URL}/api/payments/attach-transaction`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    console.log('🔍 [API-ROUTE] Response del backend:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ [API-ROUTE] Error del backend:', {
        status: response.status,
        data: data
      });
      return NextResponse.json(
        { error: data.detail || 'Error al asociar transaction_id' },
        { status: response.status }
      );
    }
    
    console.log('✅ [API-ROUTE] Transaction ID attachado exitosamente');
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('❌ [API-ROUTE] Error en /api/payments/attach-transaction:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

