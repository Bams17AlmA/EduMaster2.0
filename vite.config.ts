import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => ({
  // Relative asset URLs are required for the packaged Electron app opened via file://.
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
      manifest: {
        id: './',
        name: 'EduGest - Gestion Scolaire Intégrale',
        short_name: 'EduGest',
        description: 'Plateforme numérique complète de gestion scolaire : élèves, finances, bulletins et administration.',
        theme_color: '#1e3a8a',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        scope: './',
        categories: ['education', 'productivity', 'finance'],
        icons: [
          { src: './pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: './pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: './pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: './icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
      },
      devOptions: { enabled: true, type: 'module' },
    }),
  ],
  resolve: {
    alias: { '@': projectRoot },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
}));
