import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import vuetify from "vite-plugin-vuetify";

export default defineConfig({
  base: "./",
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon.svg"],
      manifest: {
        name: "Mobile Inventory Scanner",
        short_name: "Inventory Scanner",
        description: "Scan inventory QR Codes and record their locations.",
        theme_color: "#0f766e",
        background_color: "#f5f7f8",
        display: "standalone",
        start_url: "./",
        icons: [
          {
            src: "icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,wasm}"],
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
