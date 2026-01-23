import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import { loadEnv } from 'vite';

// Load env variables
const { DATABASE_URL } = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');

// https://astro.build/config
export default defineConfig({
  output: 'server', // Enable SSR for API routes and auth
  adapter: vercel(),
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@neondatabase/serverless': resolve(process.cwd(), 'node_modules/@neondatabase/serverless'),
        'drizzle-orm': resolve(process.cwd(), 'node_modules/drizzle-orm')
      }
    },
    define: {
      'process.env.DATABASE_URL': JSON.stringify(DATABASE_URL)
    }
  }
});