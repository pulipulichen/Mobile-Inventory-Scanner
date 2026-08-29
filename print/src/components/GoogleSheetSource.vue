<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineProps<{
  modelValue: string;
  loading: boolean;
  errorMessage: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  load: [];
}>();

const { t } = useI18n({ useScope: "global" });
</script>

<template>
  <v-card class="section-card" tag="section" aria-labelledby="source-heading">
    <v-card-item>
      <v-card-title id="source-heading">
        {{ t("print.source_heading") }}
      </v-card-title>
      <v-card-subtitle>{{ t("print.sheet_url_hint") }}</v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <form class="source-form" @submit.prevent="emit('load')">
        <v-text-field
          id="google-sheet-url"
          :model-value="modelValue"
          :label="t('print.sheet_url_label')"
          :placeholder="t('print.sheet_url_placeholder')"
          :error-messages="errorMessage ? [errorMessage] : []"
          :aria-describedby="'google-sheet-url-hint'"
          aria-required="true"
          autocomplete="url"
          type="url"
          variant="outlined"
          clearable
          @update:model-value="emit('update:modelValue', String($event ?? ''))"
        />
        <p id="google-sheet-url-hint" class="field-description">
          {{ t("print.sheet_url_hint") }}
        </p>

        <div class="source-actions">
          <v-btn
            type="submit"
            color="primary"
            size="large"
            :loading="loading"
            :disabled="!modelValue.trim()"
          >
            {{ t("print.load_sheet") }}
          </v-btn>
          <a
            class="secondary-link"
            href="https://drive.google.com/drive/u/0/recent?q=type:spreadsheet"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ t("print.recent_sheets") }}
          </a>
        </div>
        <p class="field-description">{{ t("print.recent_sheets_hint") }}</p>
      </form>
    </v-card-text>
  </v-card>
</template>
