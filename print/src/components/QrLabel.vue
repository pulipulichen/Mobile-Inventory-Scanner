<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  getLabelCaption,
  showsLabelText,
  type InventoryItem,
  type LayoutMetrics,
  type PrintSettings,
} from "../types/print";

const props = defineProps<{
  item: InventoryItem;
  svgMarkup: string;
  metrics: LayoutMetrics;
  settings: PrintSettings;
}>();

const { t } = useI18n({ useScope: "global" });

const caption = computed(() =>
  getLabelCaption(props.item, props.settings.labelText),
);
const showText = computed(() => showsLabelText(props.settings.labelText));
const accessibleName = computed(() =>
  props.item.name
    ? t("print.qr_label_with_name", {
        id: props.item.id,
        name: props.item.name,
      })
    : t("print.qr_label", { id: props.item.id }),
);
</script>

<template>
  <article
    class="qr-label"
    :style="{
      width: `${metrics.labelWidthMm}mm`,
      height: `${metrics.labelHeightMm}mm`,
      padding: `${metrics.labelPaddingMm}mm`,
    }"
    :aria-label="accessibleName"
  >
    <div
      class="qr-image"
      role="img"
      :aria-label="accessibleName"
      :style="{
        width: `${settings.qrSizeMm}mm`,
        height: `${settings.qrSizeMm}mm`,
      }"
      v-html="svgMarkup"
    />
    <p
      class="qr-id"
      :class="{ 'visually-hidden': !showText }"
      :style="
        showText
          ? {
              marginTop: `${settings.qrTextGapMm}mm`,
              fontSize: `${settings.idFontSizePt}pt`,
            }
          : undefined
      "
    >
      {{ showText ? caption : item.id }}
    </p>
  </article>
</template>
