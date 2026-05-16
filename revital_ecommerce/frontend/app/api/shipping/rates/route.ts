import { NextRequest, NextResponse } from 'next/server';

/** Origen del FastAPI (solo servidor Node / Route Handler). */
function getBackendUrl(): string {
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  if (backend) return backend.replace(/\/$/, "");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (apiUrl) {
    try {
      return new URL(apiUrl).origin;
    } catch {
      /* continuar */
    }
  }
  if (process.env.NODE_ENV === "development") {
    return (process.env.DEV_INTERNAL_API_ORIGIN || "http://127.0.0.1:8001").replace(
      /\/$/,
      ""
    );
  }
  return "http://localhost:8000";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;
    const storeId = request.headers.get('x-store-id');
    if (storeId) headers['x-store-id'] = storeId;

    const response = await fetch(`${getBackendUrl()}/api/shipping/rates`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || 'Error al cotizar envío' },
        { status: response.status }
      );
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
