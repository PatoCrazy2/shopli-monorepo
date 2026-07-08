import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  console.log('--- VITE_API_BASE_URL BUILD VALUE:', env.VITE_API_BASE_URL || process.env.VITE_API_BASE_URL || 'NOT DEFINED');
  console.log('--- VITE_API_URL BUILD VALUE:', env.VITE_API_URL || process.env.VITE_API_URL || 'NOT DEFINED');

  return {
    build: {
      outDir: 'dist',
      emptyOutDir: true
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        injectManifest: {
          injectionPoint: undefined
        },
        manifest: {
          name: 'ShopLI POS',
          short_name: 'ShopLI',
          description: 'Sistema de Punto de Venta ShopLI',
          theme_color: '#000000',
          background_color: '#000000',
          display: 'standalone',
          icons: [
            {
              src: 'shopli.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any'
            },
            {
              src: 'shopli.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'maskable'
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: 'module'
        }
      })
    ],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        }
      }
    }
  };
})
