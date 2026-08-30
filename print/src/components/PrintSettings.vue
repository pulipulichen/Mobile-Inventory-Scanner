<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  isBarcodeMode,
  isLabelTextMode,
  isPaperSize,
  MAX_PAGE_MARGIN_MM,
  MIN_PAGE_MARGIN_MM,
  PAPER_SIZE_DIMENSIONS,
  PAPER_SIZES,
  showsLabelText,
  showsQrCode,
  type Orientation,
  type PrintSettings as PrintSettingsModel,
} from "../types/print";

const props = defineProps<{
  settings: PrintSettingsModel;
}>();

const emit = defineEmits<{
  update: [settings: PrintSettingsModel];
  reset: [];
}>();

const { t, n } = useI18n({ useScope: "global" });

const paperSizeOptions = computed(() =>
  PAPER_SIZES.map((value) => {
    const { widthMm, heightMm } = PAPER_SIZE_DIMENSIONS[value];
    return {
      label: t("print.paper_size_option", {
        name: value.toUpperCase(),
        width: n(widthMm),
        height: n(heightMm),
      }),
      value,
    };
  }),
);

const orientationOptions = computed(() => [
  {
    label: t("print.orientation_portrait"),
    value: "portrait" as const,
  },
  {
    label: t("print.orientation_landscape"),
    value: "landscape" as const,
  },
]);

const barcodeModeOptions = computed(() => [
  {
    label: t("print.barcode_mode_qr"),
    value: "qr" as const,
  },
  {
    label: t("print.barcode_mode_code128"),
    value: "code128" as const,
  },
  {
    label: t("print.barcode_mode_both"),
    value: "both" as const,
  },
]);

const sizeLabel = computed(() =>
  showsQrCode(props.settings.barcodeMode)
    ? t("print.qr_size")
    : t("print.code128_size"),
);

const sizeHint = computed(() => {
  if (props.settings.barcodeMode === "both") {
    return t("print.qr_size_hint_with_code128");
  }
  if (props.settings.barcodeMode === "code128") {
    return t("print.code128_size_hint");
  }
  return t("print.qr_size_hint");
});

const textGapLabel = computed(() =>
  showsQrCode(props.settings.barcodeMode)
    ? t("print.qr_text_gap")
    : t("print.code128_text_gap"),
);

const textGapHint = computed(() =>
  showsQrCode(props.settings.barcodeMode)
    ? t("print.qr_text_gap_hint")
    : t("print.code128_text_gap_hint"),
);

const fontSizeHint = computed(() =>
  showsQrCode(props.settings.barcodeMode)
    ? t("print.id_font_size_hint")
    : t("print.code128_font_size_hint"),
);

const labelTextHint = computed(() =>
  showsQrCode(props.settings.barcodeMode)
    ? t("print.label_text_hint")
    : t("print.code128_label_text_hint"),
);

const labelTextOptions = computed(() => [
  {
    label: t("print.label_text_hidden"),
    value: "hidden" as const,
  },
  {
    label: t("print.label_text_id"),
    value: "id" as const,
  },
  {
    label: t("print.label_text_name"),
    value: "name" as const,
  },
]);

function updateNumber(
  key: "qrSizeMm" | "idFontSizePt" | "qrTextGapMm" | "labelGapMm" | "pageMarginMm",
  value: unknown,
): void {
  const number = Number(value);
  if (!Number.isFinite(number)) return;
  const clamped =
    key === "pageMarginMm"
      ? Math.min(MAX_PAGE_MARGIN_MM, Math.max(MIN_PAGE_MARGIN_MM, number))
      : number;
  emit("update", { ...props.settings, [key]: clamped });
}

function updatePaperSize(value: unknown): void {
  if (!isPaperSize(value)) return;
  emit("update", { ...props.settings, paperSize: value });
}

function updateOrientation(value: unknown): void {
  if (value !== "portrait" && value !== "landscape") return;
  emit("update", { ...props.settings, orientation: value as Orientation });
}

function updateBarcodeMode(value: unknown): void {
  if (!isBarcodeMode(value)) return;
  emit("update", { ...props.settings, barcodeMode: value });
}

function updateLabelText(value: unknown): void {
  if (!isLabelTextMode(value)) return;
  emit("update", { ...props.settings, labelText: value });
}
</script>

<template>
  <v-card class="section-card" tag="section" aria-labelledby="settings-heading">
    <v-card-item>
      <v-card-title id="settings-heading">
        {{ t("print.settings_heading") }}
      </v-card-title>
      <v-card-subtitle>{{ t("print.settings_hint") }}</v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <div class="settings-grid">
        <v-select
          id="barcode-mode"
          :model-value="settings.barcodeMode"
          :items="barcodeModeOptions"
          item-title="label"
          item-value="value"
          :label="t('print.barcode_mode')"
          :hint="t('print.barcode_mode_hint')"
          persistent-hint
          variant="outlined"
          @update:model-value="updateBarcodeMode"
        />

        <v-select
          id="paper-size"
          :model-value="settings.paperSize"
          :items="paperSizeOptions"
          item-title="label"
          item-value="value"
          :label="t('print.paper_size')"
          :hint="t('print.paper_size_hint')"
          persistent-hint
          variant="outlined"
          @update:model-value="updatePaperSize"
        />

        <v-select
          id="orientation"
          :model-value="settings.orientation"
          :items="orientationOptions"
          item-title="label"
          item-value="value"
          :label="t('print.orientation')"
          variant="outlined"
          @update:model-value="updateOrientation"
        />

        <v-text-field
          id="page-margin-mm"
          :model-value="settings.pageMarginMm"
          :label="t('print.page_margin')"
          :hint="t('print.page_margin_hint')"
          suffix="mm"
          type="number"
          :min="MIN_PAGE_MARGIN_MM"
          :max="MAX_PAGE_MARGIN_MM"
          step="1"
          persistent-hint
          variant="outlined"
          @update:model-value="updateNumber('pageMarginMm', $event)"
        />

        <v-text-field
          id="qr-size-mm"
          :model-value="settings.qrSizeMm"
          :label="sizeLabel"
          :hint="sizeHint"
          suffix="mm"
          type="number"
          min="10"
          max="100"
          step="1"
          persistent-hint
          variant="outlined"
          @update:model-value="updateNumber('qrSizeMm', $event)"
        />

        <v-select
          id="label-text"
          :model-value="settings.labelText"
          :items="labelTextOptions"
          item-title="label"
          item-value="value"
          :label="t('print.label_text')"
          :hint="labelTextHint"
          persistent-hint
          variant="outlined"
          @update:model-value="updateLabelText"
        />

        <v-text-field
          id="label-gap-mm"
          :model-value="settings.labelGapMm"
          :label="t('print.label_gap')"
          :hint="t('print.label_gap_hint')"
          suffix="mm"
          type="number"
          min="0"
          max="20"
          step="0.5"
          persistent-hint
          variant="outlined"
          @update:model-value="updateNumber('labelGapMm', $event)"
        />

        <v-text-field
          id="id-font-size-pt"
          :model-value="settings.idFontSizePt"
          :label="t('print.id_font_size')"
          :hint="fontSizeHint"
          suffix="pt"
          type="number"
          min="6"
          max="36"
          step="1"
          persistent-hint
          variant="outlined"
          :disabled="!showsLabelText(settings.labelText)"
          @update:model-value="updateNumber('idFontSizePt', $event)"
        />

        <v-text-field
          id="qr-text-gap-mm"
          :model-value="settings.qrTextGapMm"
          :label="textGapLabel"
          :hint="textGapHint"
          suffix="mm"
          type="number"
          min="0"
          max="20"
          step="0.5"
          persistent-hint
          variant="outlined"
          :disabled="!showsLabelText(settings.labelText)"
          @update:model-value="updateNumber('qrTextGapMm', $event)"
        />
      </div>

      <v-btn
        class="reset-button"
        type="button"
        variant="text"
        color="secondary"
        @click="emit('reset')"
      >
        {{ t("print.reset_settings") }}
      </v-btn>
    </v-card-text>
  </v-card>
</template>
