import { auth } from "./lib/auth";
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
    const { pathname } = context.url;

    // Protected routes that require authentication
    const protectedRoutes = ["/dashboard"];
    // Guest-only routes (redirect to dashboard if already logged in)
    const guestRoutes = ["/login", "/register"];

    // Check if current path starts with any protected route
    const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route)
    );

    // Check if current path is a guest route
    const isGuestRoute = guestRoutes.some((route) =>
        pathname === route || pathname.startsWith(route + "/")
    );

    // Get session from BetterAuth
    const session = await auth.api.getSession({
        headers: context.request.headers,
    });

    if (isProtectedRoute) {
        // If no session, redirect to login
        if (!session) {
            return context.redirect("/login?redirect=" + encodeURIComponent(pathname));
        }

        // Add user to locals for use in pages
        context.locals.user = session.user;
        context.locals.session = session.session;
    }

    if (isGuestRoute) {
        // If user is already logged in, redirect to dashboard
        if (session) {
            return context.redirect("/dashboard");
        }
    }

    // Add session to locals for all routes (optional, but good for navbar state)
    if (session) {
        context.locals.user = session.user;
        context.locals.session = session.session;
    }

    return next();
});
