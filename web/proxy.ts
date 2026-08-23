import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
    const token = req.cookies.get("token")?.value;
    const pathname = req.nextUrl.pathname;

    console.log(token)

    if (pathname === "/admin/login") {
        return NextResponse.next();
    }

    if (pathname.startsWith("/admin") && !token) {
        return NextResponse.redirect(new URL("/admin/login?error=no-token", req.url));
    }

    if (pathname.startsWith("/admin") && token) {
        // Validasi sesi ke backend: /api/admin/me hanya 200 jika cookie `token`
        // adalah JWT valid (AuthMiddleware menerima header Bearer atau cookie).
        const apiURL = process.env.BACKEND_API_URL || process.env.API_URL || "http://localhost:8080";
        try {
            const session = await fetch(`${apiURL.replace(/\/$/, "")}/api/admin/me`, {
                headers: {
                    cookie: req.headers.get("cookie") || "",
                },
                cache: "no-store",
            });
            if (session.ok) return NextResponse.next();
        } catch {
            // Fail closed: a protected dashboard must not render when the
            // backend cannot validate its session.
        }

        const response = NextResponse.redirect(new URL("/admin/login?error=invalid-session", req.url));
        response.cookies.delete("token");
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"],
};
