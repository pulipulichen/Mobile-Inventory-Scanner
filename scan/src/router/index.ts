import { defineComponent, h } from "vue";
import { createRouter, createWebHashHistory } from "vue-router";
import { isAppsScriptUrl } from "../services/apps_script";
import { loadAppsScriptUrl } from "../services/scan_storage";

export const TAB_ROUTES = [
  "settings",
  "scan",
  "checked",
  "pending",
] as const;

export type AppTab = (typeof TAB_ROUTES)[number];

const TabOutlet = defineComponent({
  name: "TabOutlet",
  setup() {
    return () => h("div", { class: "visually-hidden", "aria-hidden": "true" });
  },
});

export function isAppTab(value: unknown): value is AppTab {
  return TAB_ROUTES.some((tab) => tab === value);
}

export function defaultTab(): AppTab {
  return isAppsScriptUrl(loadAppsScriptUrl()) ? "scan" : "settings";
}

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      redirect: () => ({ name: defaultTab() }),
    },
    {
      path: "/settings",
      name: "settings",
      component: TabOutlet,
    },
    {
      path: "/scan",
      name: "scan",
      component: TabOutlet,
    },
    {
      path: "/checked",
      name: "checked",
      component: TabOutlet,
    },
    {
      path: "/pending",
      name: "pending",
      component: TabOutlet,
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: () => ({ name: defaultTab() }),
    },
  ],
});
