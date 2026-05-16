import { NextRequest, NextResponse } from "next/server";

function getBackendUrl(): string {
  if (process.env.NEXT_PUBLIC_BACKEND_URL) return process.env.NEXT_PUBLIC_BACKEND_URL;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    try {
      return new URL(apiUrl).origin;
    } catch {
      return "http://localhost:8000";
    }
  }
  return "http://localhost:8000";
}

/** Proxy sin Authorization: el backend valida reference + transaction_id contra Wompi. */
export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get("reference");
    const transaction_id = request.nextUrl.searchParams.get("transaction_id");
    if (!reference?.trim() || !transaction_id?.trim()) {
      return NextResponse.json(
        { detail: "reference y transaction_id son requeridos" },
        { status: 400 }
      );
    }

    const qs = new URLSearchParams({
      reference: reference.trim(),
      transaction_id: transaction_id.trim(),
    });
    const headers: HeadersInit = {};
    const storeId = request.headers.get("x-store-id");
    if (storeId) headers["x-store-id"] = storeId;

    const response = await fetch(
      `${getBackendUrl()}/api/payments/checkout-order-detail?${qs.toString()}`,
      { method: "GET", headers }
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error interno";
    console.error("Error en /api/payments/checkout-order-detail:", error);
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
