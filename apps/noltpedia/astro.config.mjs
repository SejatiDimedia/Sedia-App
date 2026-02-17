// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        'drizzle-orm': new URL('./node_modules/drizzle-orm', import.meta.url).pathname,
      }
    }
  },

  adapter: vercel()
});