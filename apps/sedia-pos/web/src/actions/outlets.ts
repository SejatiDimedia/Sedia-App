"use server";

import { db } from "@/lib/db";
import { outlets, employees } from "@/lib/schema/sedia-pos";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";

import { getAuthorizedOutlets } from "@/lib/outlets-logic";

export async function getOutlets() {
    // Opt out of caching to ensure fresh data for theme/banding updates
    noStore();

    return getAuthorizedOutlets(await headers());
}

export async function setActiveOutletCookie(outletId: string) {
    const cookieStore = await headers(); // In newer Next.js actions, commonly used with cookies()
    const { cookies } = await import("next/headers");
    (await cookies()).set("active_outlet_id", outletId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: "lax",
    });
    return { success: true };
}


