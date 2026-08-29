<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { createCode128Svg } from "../services/code128_generator";
import {
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
const code128Markup = computed(() =>
  showCode128.value ? createCode128Svg(props.item.id) : "",
);
const code128WidthMm = computed(() => getCode128WidthMm(props.settings.qrSizeMm));
const code128HeightMm = computed(() => getCode128HeightMm(props.settings.qrSizeMm));
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
      :aria-label="`QR Code: ${item.id}`"
      :style="{
        width: `${settings.qrSizeMm}mm`,
        height: `${settings.qrSizeMm}mm`,
        flex: '0 0 auto',
      }"
      v-html="svgMarkup"
    />
    <div
      v-if="showCode128"
      class="code128-image"
      role="img"
      :aria-label="`Code 128: ${item.id}`"
      :style="{
        width: `${code128WidthMm}mm`,
        height: `${code128HeightMm}mm`,
        marginTop: showQr ? '2mm' : '0',
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
