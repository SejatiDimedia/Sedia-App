import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define protected routes
const protectedRoutes = ["/dashboard"];

// Define public routes (accessible without auth)
const publicRoutes = ["/", "/login", "/register", "/catalog"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const origin = request.headers.get("origin");

    // Handle CORS
    const allowedOrigins = [
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://10.0.2.2:3000",
        "http://10.0.2.2:8081"
    ];

    let response = NextResponse.next();

    // Check strict match or pattern match for local network IPs
    const isAllowedOrigin = origin && (
        allowedOrigins.includes(origin) ||
        /^http:\/\/192\.168\.\d+\.\d+:[0-9]+$/.test(origin)
    );

    if (isAllowedOrigin) {
        response.headers.set("Access-Control-Allow-Origin", origin);
        response.headers.set("Access-Control-Allow-Credentials", "true");
        response.headers.set("Access-Control-Allow-Methods", "GET,DELETE,PATCH,POST,PUT,OPTIONS");
        response.headers.set("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization");
    }

    // Handle OPTIONS request (preflight)
    if (request.method === "OPTIONS") {
        return new NextResponse(null, {
            status: 204,
            headers: response.headers,
        });
    }

    // Define protected routes
    const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route)
    );

    // Get the session token from cookies
    const sessionToken = request.cookies.get("better-auth.session_token") ||
        request.cookies.get("__Secure-better-auth.session_token");

    // If trying to access protected route without session, redirect to login
    if (isProtectedRoute && !sessionToken) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // If logged in and trying to access login/register, redirect to dashboard
    if (sessionToken && (pathname === "/login" || pathname === "/register")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml
         * - public files (files with extensions)
         */
        "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|.*\\..*).*)",
    ],
};
