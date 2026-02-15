import { NextRequest, NextResponse } from 'next/server';

/** Usar el mismo backend que la API (NEXT_PUBLIC_API_URL) para evitar "Carrito no encontrado" por backends distintos. */
function getBackendUrl(): string {
  if (process.env.NEXT_PUBLIC_BACKEND_URL) return process.env.NEXT_PUBLIC_BACKEND_URL;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    try {
      return new URL(apiUrl).origin; // ej. http://localhost:8001
    } catch {
      return 'http://localhost:8000';
    }
  }
  return 'http://localhost:8000';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;
    const storeId = request.headers.get('x-store-id');
    if (storeId) headers['x-store-id'] = storeId;

    const response = await fetch(`${getBackendUrl()}/api/payments/create-checkout`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error al crear sesión de checkout' },
        { status: response.status }
      );
    }
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Error en /api/payments/create-checkout:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
