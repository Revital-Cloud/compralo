import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get('reference');
    if (!reference) {
      return NextResponse.json({ error: 'reference requerido' }, { status: 400 });
    }
    const authHeader = request.headers.get('authorization');
    const headers: HeadersInit = {};
    if (authHeader) headers['Authorization'] = authHeader;
    const storeId = request.headers.get('x-store-id');
    if (storeId) headers['x-store-id'] = storeId;

    const response = await fetch(
      `${BACKEND_URL}/api/payments/order-by-reference?reference=${encodeURIComponent(reference)}`,
      { method: 'GET', headers }
    );
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error en /api/payments/order-by-reference:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
