import { createApp } from "vue";
import { createVuetify } from "vuetify";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";
import App from "./App.vue";
import { i18n } from "./i18n";
import { router } from "./router";
import "./styles/main.scss";

async function clearLegacyPwaState(): Promise<void> {
  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map((registration) => registration.unregister()),
      );
    } catch {
      // Service worker cleanup is best-effort and must not block the app.
    }
  }

  if ("caches" in window) {
    try {
      const cacheNames = await window.caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => window.caches.delete(cacheName)),
      );
    } catch {
      // Cache cleanup is best-effort and must not block the app.
    }
  }
}

void clearLegacyPwaState();

const vuetify = createVuetify({
  icons: {
    defaultSet: "mdi",
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: "inventory",
    themes: {
      inventory: {
        dark: false,
        colors: {
          primary: "#0f766e",
          secondary: "#475569",
          info: "#0369a1",
          success: "#15803d",
          warning: "#a16207",
          error: "#b91c1c",
          background: "#f5f7f8",
          surface: "#ffffff",
        },
      },
    },
  },
  defaults: {
    VCard: {
      rounded: "lg",
    },
    VBtn: {
      rounded: "lg",
      class: "text-none",
    },
  },
});

createApp(App).use(i18n).use(router).use(vuetify).mount("#app");
