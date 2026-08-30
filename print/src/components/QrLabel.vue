<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { createCode128Svg } from "../services/code128_generator";
import {
  BARCODE_STACK_GAP_MM,
  getCode128HeightMm,
  getCode128WidthMm,
  getLabelCaption,
  showsCode128,
  showsLabelText,
  showsQrCode,
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
const showQr = computed(() => showsQrCode(props.settings.barcodeMode));
const showCode128 = computed(() => showsCode128(props.settings.barcodeMode));
const code128Markup = computed(() => {
  if (!showCode128.value) return "";
  try {
    return createCode128Svg(props.item.id);
  } catch {
    return "";
  }
});
const code128WidthMm = computed(() =>
  getCode128WidthMm(props.settings.qrSizeMm, props.settings.barcodeMode),
);
const code128HeightMm = computed(() =>
  getCode128HeightMm(props.settings.qrSizeMm),
);
const accessibleName = computed(() => {
  const named = Boolean(props.item.name);
  if (showQr.value && showCode128.value) {
    return named
      ? t("print.symbol_label_with_name", {
          id: props.item.id,
          name: props.item.name,
        })
      : t("print.symbol_label", { id: props.item.id });
  }
  if (showCode128.value) {
    return named
      ? t("print.code128_label_with_name", {
          id: props.item.id,
          name: props.item.name,
        })
      : t("print.code128_label", { id: props.item.id });
  }
  return named
    ? t("print.qr_label_with_name", {
        id: props.item.id,
        name: props.item.name,
      })
    : t("print.qr_label", { id: props.item.id });
});
</script>

<template>
  <article
    class="qr-label"
    :style="{
      width: `${metrics.labelWidthMm}mm`,
      height: `${metrics.labelHeightMm}mm`,
      padding: `${metrics.labelPaddingMm}mm`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
    }"
    :aria-label="accessibleName"
  >
    <div
      v-if="showQr"
      class="qr-image"
      role="img"
      :aria-label="t('print.qr_label', { id: item.id })"
      :style="{
        width: `${settings.qrSizeMm}mm`,
        height: `${settings.qrSizeMm}mm`,
        flex: '0 0 auto',
      }"
      v-html="svgMarkup"
    />
    <div
      v-if="showCode128 && code128Markup"
      class="code128-image"
      role="img"
      :aria-label="t('print.code128_label', { id: item.id })"
      :style="{
        width: `${code128WidthMm}mm`,
        height: `${code128HeightMm}mm`,
        marginTop: showQr ? `${BARCODE_STACK_GAP_MM}mm` : '0',
        flex: '0 0 auto',
      }"
      v-html="code128Markup"
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
