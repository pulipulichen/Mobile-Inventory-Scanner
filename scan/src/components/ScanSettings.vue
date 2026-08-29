<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineProps<{
  appsScriptUrl: string;
  location: string;
  locationHistory: string[];
  disabled: boolean;
}>();

const emit = defineEmits<{
  "update:appsScriptUrl": [value: string];
  "update:location": [value: string];
}>();

const { t } = useI18n({ useScope: "global" });
</script>

<template>
  <section class="section-card settings-card" aria-labelledby="settings-heading">
    <div class="section-heading">
      <h2 id="settings-heading">{{ t("scan.settings_heading") }}</h2>
      <p>{{ t("scan.settings_description") }}</p>
    </div>

    <div class="settings-fields">
      <v-text-field
        id="apps-script-url"
        :model-value="appsScriptUrl"
        :label="t('scan.apps_script_url_label')"
        :placeholder="t('scan.apps_script_url_placeholder')"
        :hint="t('scan.apps_script_url_hint')"
        type="url"
        autocomplete="url"
        aria-required="true"
        variant="outlined"
        persistent-hint
        :disabled="disabled"
        @update:model-value="emit('update:appsScriptUrl', String($event ?? ''))"
      />

      <v-combobox
        id="current-location"
        :model-value="location"
        :items="locationHistory"
        :label="t('scan.location_label')"
        :placeholder="t('scan.location_placeholder')"
        :hint="t('scan.location_hint')"
        autocomplete="off"
        aria-required="true"
        variant="outlined"
        persistent-hint
        :disabled="disabled"
        @update:model-value="emit('update:location', String($event ?? ''))"
      />
    </div>
  </section>
</template>
