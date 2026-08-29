<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type {
  InventoryItem,
  LayoutMetrics,
  PrintSettings,
} from "../types/print";
import { getPageItems } from "../utils/print_layout";
import QrLabel from "./QrLabel.vue";

const props = defineProps<{
  items: InventoryItem[];
  qrSvgs: Record<string, string>;
  settings: PrintSettings;
  metrics: LayoutMetrics;
}>();

const { t, n } = useI18n({ useScope: "global" });

const pages = computed(() => getPageItems(props.items, props.metrics));
const pageStyle = computed(() => ({
  width: `${props.metrics.pageWidthMm}mm`,
  height: `${props.metrics.pageHeightMm}mm`,
  padding: `${props.settings.pageMarginMm}mm`,
}));
const labelListStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.metrics.columns}, ${props.metrics.labelWidthMm}mm)`,
  gridTemplateRows: `repeat(${props.metrics.rows}, ${props.metrics.labelHeightMm}mm)`,
  gap: `${props.settings.labelGapMm}mm`,
}));
</script>

<template>
  <v-card
    id="preview-section"
    class="section-card preview-card"
    tag="section"
    aria-labelledby="preview-heading"
  >
    <v-card-item>
      <v-card-title id="preview-heading">
        {{ t("print.preview_heading") }}
      </v-card-title>
      <v-card-subtitle v-if="items.length">
        {{
          t("print.preview_description", {
            count: n(items.length),
            columns: n(metrics.columns),
            rows: n(metrics.rows),
            pages: n(metrics.pageCount),
          })
        }}
      </v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <p v-if="!items.length" class="empty-preview">
        {{ t("print.preview_empty") }}
      </p>

      <div v-else class="preview-stage">
        <section
          v-for="(pageItems, pageIndex) in pages"
          :id="`preview-page-${pageIndex + 1}`"
          :key="pageIndex"
          class="print-page"
          :style="pageStyle"
          :aria-labelledby="`preview-page-heading-${pageIndex + 1}`"
        >
          <h3
            :id="`preview-page-heading-${pageIndex + 1}`"
            class="page-heading"
          >
            {{ t("print.page", { page: pageIndex + 1, pages: pages.length }) }}
          </h3>
          <ol class="qr-label-list" :style="labelListStyle">
            <li
              v-for="item in pageItems"
              :key="item.cellAddress"
              class="qr-label-item"
            >
              <QrLabel
                :item="item"
                :svg-markup="qrSvgs[item.id] ?? ''"
                :metrics="metrics"
                :settings="settings"
              />
            </li>
          </ol>
        </section>
      </div>
    </v-card-text>

    <v-card-actions v-if="$slots.actions" class="preview-actions">
      <slot name="actions" />
    </v-card-actions>
  </v-card>
</template>
