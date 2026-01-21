// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'server', // Enable SSR for API routes and auth
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  }
});