<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { InventoryItem, LayoutMetrics, PrintSettings } from "../types/print";

defineProps<{
  item: InventoryItem;
  svgMarkup: string;
  metrics: LayoutMetrics;
  settings: PrintSettings;
}>();

const { t } = useI18n({ useScope: "global" });
</script>

<template>
  <article
    class="qr-label"
    :style="{
      width: `${metrics.labelWidthMm}mm`,
      height: `${metrics.labelHeightMm}mm`,
      padding: `${metrics.labelPaddingMm}mm`,
    }"
    :aria-label="t('print.qr_label', { id: item.id })"
  >
    <div
      class="qr-image"
      role="img"
      :aria-label="t('print.qr_label', { id: item.id })"
      :style="{
        width: `${settings.qrSizeMm}mm`,
        height: `${settings.qrSizeMm}mm`,
      }"
      v-html="svgMarkup"
    />
    <p
      class="qr-id"
      :class="{ 'visually-hidden': !settings.showIdText }"
      :style="
        settings.showIdText
          ? {
              marginTop: `${settings.qrTextGapMm}mm`,
              fontSize: `${settings.idFontSizePt}pt`,
            }
          : undefined
      "
    >
      {{ item.id }}
    </p>
  </article>
</template>
