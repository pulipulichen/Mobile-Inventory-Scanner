<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { Orientation, PrintSettings as PrintSettingsModel } from "../types/print";

const props = defineProps<{
  settings: PrintSettingsModel;
}>();

const emit = defineEmits<{
  update: [settings: PrintSettingsModel];
  reset: [];
}>();

const { t } = useI18n({ useScope: "global" });

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
  emit("update", { ...props.settings, [key]: number });
}

function updateOrientation(value: unknown): void {
  if (value !== "portrait" && value !== "landscape") return;
  emit("update", { ...props.settings, orientation: value as Orientation });
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
          @update:model-value="updateNumber('qrTextGapMm', $event)"
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
          id="page-margin-mm"
          :model-value="settings.pageMarginMm"
          :label="t('print.page_margin')"
          :hint="t('print.page_margin_hint')"
          suffix="mm"
          type="number"
          min="0"
          max="40"
          step="1"
          persistent-hint
          variant="outlined"
          @update:model-value="updateNumber('pageMarginMm', $event)"
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
