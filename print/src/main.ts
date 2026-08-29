import { createApp } from "vue";
import { createVuetify } from "vuetify";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";
import App from "./App.vue";
import { i18n } from "./i18n";
import "./styles/main.scss";

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

createApp(App).use(i18n).use(vuetify).mount("#app");
