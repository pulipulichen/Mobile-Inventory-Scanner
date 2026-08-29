<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  isPaperSize,
  MAX_PAGE_MARGIN_MM,
  MIN_PAGE_MARGIN_MM,
  PAPER_SIZE_DIMENSIONS,
  PAPER_SIZES,
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

function updateShowIdText(value: unknown): void {
  emit("update", { ...props.settings, showIdText: Boolean(value) });
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
          :label="t('print.qr_size')"
          :hint="t('print.qr_size_hint')"
          suffix="mm"
          type="number"
          min="10"
          max="100"
          step="1"
          persistent-hint
          variant="outlined"
          @update:model-value="updateNumber('qrSizeMm', $event)"
        />

        <v-switch
          id="show-id-text"
          class="settings-toggle"
          :model-value="settings.showIdText"
          :label="t('print.show_id_text')"
          :hint="t('print.show_id_text_hint')"
          persistent-hint
          color="primary"
          inset
          @update:model-value="updateShowIdText"
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
          :hint="t('print.id_font_size_hint')"
          suffix="pt"
          type="number"
          min="6"
          max="36"
          step="1"
          persistent-hint
          variant="outlined"
          :disabled="!settings.showIdText"
          @update:model-value="updateNumber('idFontSizePt', $event)"
        />

        <v-text-field
          id="qr-text-gap-mm"
          :model-value="settings.qrTextGapMm"
          :label="t('print.qr_text_gap')"
          :hint="t('print.qr_text_gap_hint')"
          suffix="mm"
          type="number"
          min="0"
          max="20"
          step="0.5"
          persistent-hint
          variant="outlined"
          :disabled="!settings.showIdText"
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
