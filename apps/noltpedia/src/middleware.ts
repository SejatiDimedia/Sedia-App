import { defineMiddleware } from "astro/middleware";
import { auth } from "./lib/auth";

export const onRequest = defineMiddleware(async (context, next) => {
    // Only intercept requests to /dashboard
    if (context.url.pathname.startsWith("/dashboard")) {
        const session = await auth.api.getSession({
            headers: context.request.headers,
        });

        if (!session) {
            return context.redirect("/login");
        }

        // Make user available to pages if needed (optional)
        context.locals.user = session.user;
        context.locals.session = session.session;
    }

    return next();
});
