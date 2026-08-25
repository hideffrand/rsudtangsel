import type { NextRequest } from "next/server";

/**
 * Reverse proxy ke Go backend. Browser hanya melihat /api/proxy/*, URL backend
 * (BACKEND_API_URL) tidak pernah diekspos ke client. Semua path setelah
 * /api/proxy diteruskan verbatim ke backend (mis. /api/proxy/api/poli
 * -> BACKEND_API_URL/api/poli).
 */
const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://127.0.0.1:8080";

const HOP_BY_HOP = new Set([
  "connection",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

async function proxy(request: NextRequest): Promise<Response> {
  const { pathname, search } = request.nextUrl;
  const target = new URL(pathname.replace(/^\/api\/proxy/, ""), BACKEND_API_URL);
  target.search = search;

  const headers = new Headers();
  for (const [key, value] of request.headers) {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };
  if (request.body) {
    init.body = request.body;
    (init as RequestInit & { duplex: string }).duplex = "half";
  }

  const upstream = await fetch(target, init);

  const responseHeaders = new Headers();
  for (const [key, value] of upstream.headers) {
    // set-cookie ditangani terpisah di bawah: iterasi Headers biasa
    // menggabungkan beberapa cookie jadi satu nilai dipisah koma, yang
    // membuat browser menolak cookie sesi (token/refresh_token).
    if (!HOP_BY_HOP.has(key.toLowerCase()) && key.toLowerCase() !== "set-cookie") {
      responseHeaders.set(key, value);
    }
  }

  // Teruskan setiap cookie Set-Cookie satu per satu (multi-value header).
  for (const cookie of upstream.headers.getSetCookie()) {
    responseHeaders.append("set-cookie", cookie);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const dynamic = "force-dynamic";

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
