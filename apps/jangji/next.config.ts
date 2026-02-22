import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/equran\.id\/api\/v2\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 150,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
      {
        // Explicitly catch our 144 generated offline pages
        urlPattern: /^\/(?:surah|juz)\/\d+/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'quran-pages',
          expiration: {
            maxEntries: 200, // Enough for 114 surahs and 30 juz
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
        },
      },
    ],
  },
  fallbacks: {
    document: "/~offline",
  },
});

const nextConfig: NextConfig = {
  output: 'standalone',
  turbopack: {},
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'shadcn-ui'],
  },
};

export default withPWA(nextConfig);
