import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",

      workbox: {
        runtimeCaching: [
          {
            // Cachea todas las fotos de raw.githubusercontent.com (ExerciseDB)
            urlPattern: /^https:\/\/raw\.githubusercontent\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "exercise-photos",
              expiration: {
                maxEntries: 200, // LRU: cuando se llena, purga las menos usadas
                maxAgeSeconds: 2592000, // 30 días
              },
              // Las respuestas cross-origin llegan como "opaque" (status 0) —
              // sin esto, Workbox las descarta y nunca se cachean
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },

      manifest: {
        name: "Lift Log",
        short_name: "LiftLog",
        description: "Track routines, sets, reps, and progress in one place.",
        theme_color: "#0b0f14",
        background_color: "#0b0f14",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
});
