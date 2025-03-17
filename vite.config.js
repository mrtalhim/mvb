import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss(),VitePWA({  // <-- Configure VitePWA plugin
    manifest: {  // Basic manifest configuration
      name: 'Virtual Monopoly Bank',
      short_name: 'MVBank',
      description: 'A Virtual Bank for Tabletop Monopoly Games',
      theme_color: '#ffffff',
      icons: [ // Basic icon configuration - You can customize icons later
        {
          src: 'pwa-192x192.png', // Placeholder icon path - Replace with your actual icon paths in /public folder
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'pwa-512x512.png', // Placeholder icon path - Replace with your actual icon paths in /public folder
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable' // For adaptive icons
        }
      ]
    },
    // Basic service worker configuration
    registerType: 'auto',
    injectRegister: 'auto',
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg}'] // Cache all assets
    },
    devOptions: {
      enabled: true // Enable PWA features in development for testing
    }
  })
],
base: '/mvb/'
})
