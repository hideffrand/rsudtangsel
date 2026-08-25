import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
    const token = req.cookies.get("token")?.value;
    const pathname = req.nextUrl.pathname;

    if (pathname === "/admin/login") {
        return NextResponse.next();
    }

    if (pathname.startsWith("/admin") && !token) {
        return NextResponse.redirect(new URL("/admin/login?error=no-token", req.url));
    }

    if (pathname.startsWith("/admin") && token) {
        // Validasi sesi ke backend: /api/admin/me hanya 200 jika cookie `token`
        // adalah JWT valid (AuthMiddleware menerima header Bearer atau cookie).
        const apiURL = process.env.BACKEND_API_URL || process.env.API_URL || "http://127.0.0.1:8080";
        try {
            const session = await fetch(`${apiURL.replace(/\/$/, "")}/api/admin/me`, {
                headers: {
                    cookie: req.headers.get("cookie") || "",
                },
                cache: "no-store",
            });
            // Backend aktif dan session tidak valid → tolak
            if (!session.ok) {
                const response = NextResponse.redirect(new URL("/admin/login?error=invalid-session", req.url));
                response.cookies.delete("token");
                return response;
            }
            // Backend aktif dan session valid → izinkan
            return NextResponse.next();
        } catch {
            // Backend tidak bisa dijangkau (ECONNREFUSED / down) → fail-open:
            // Izinkan akses agar UI tetap bisa dibuka untuk development.
            return NextResponse.next();
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"],
};
