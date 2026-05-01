import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    process.env.VITE_ENABLE_DEVTOOLS === '1' ? vueDevTools() : null,
    tailwindcss(),
  ].filter(Boolean),
  base: '/EndfieldToolbox/',
  server: {
    watch: {
      ignored: [
        '**/public/avatars/**',
        '**/public/equipment/**',
        '**/public/weapons/**',
        '**/public/Icon_Enemy/**',
        '**/public/icons/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('/vue/') || id.includes('/vue-router/') || id.includes('/pinia/')) {
              return 'framework';
            }
            return 'vendor';
          }
          if (id.includes('/src/data/chars/')) return 'data-chars';
          if (id.includes('/src/data/weap/')) return 'data-weapons';
          if (id.includes('/src/data/gearSets/')) return 'data-gearsets';
          if (id.includes('/src/data/enemies/')) return 'data-enemies';
          if (id.includes('/src/lib/combat/')) return 'combat-core';
          return undefined;
        },
      },
    },
  },
})
