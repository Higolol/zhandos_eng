import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../secrets', '');
  const target = env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

  let targetHost = 'unknown';
  try {
    targetHost = new URL(target).host;
  } catch {
    targetHost = target;
  }

  const keyStatus = env.OPENROUTER_API_KEY ? 'set' : 'missing';
  console.log(`AI dev proxy → ${targetHost}, key: ${keyStatus}`);

  const headers: Record<string, string> = {
    'HTTP-Referer': 'http://localhost',
    'X-Title': 'English Algorithm Trainer',
  };
  if (env.OPENROUTER_API_KEY) {
    headers.Authorization = `Bearer ${env.OPENROUTER_API_KEY}`;
  }
  if (env.PROXY_AUTH_HEADER && env.PROXY_AUTH_VALUE) {
    headers[env.PROXY_AUTH_HEADER] = env.PROXY_AUTH_VALUE;
  }

  const aiProxy = {
    '/api/ai': {
      target,
      changeOrigin: true,
      secure: true,
      headers,
      rewrite: (p: string) => p.replace(/^\/api\/ai/, ''),
    },
  };

  return {
    base: process.env.BASE ?? '/zhandos_eng/',
    envDir: '../secrets',
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'icons/*.png'],
        manifest: {
          name: 'English Algorithm',
          short_name: 'EA Trainer',
          description: 'Мобильный PWA-тренажёр грамматики по авторской методике «English Algorithm»',
          theme_color: '#dc2626',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          start_url: './',
          scope: './',
          icons: [
            {
              src: 'icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'icons/icon-maskable-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: 'icons/icon-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,webmanifest}'],
        },
      }),
    ],
    server: {
      proxy: aiProxy,
    },
    preview: {
      proxy: aiProxy,
    },
  };
});
