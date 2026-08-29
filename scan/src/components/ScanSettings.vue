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
        class="apps-script-url-field"
        :model-value="appsScriptUrl"
        :label="t('scan.apps_script_url_label')"
        :placeholder="t('scan.apps_script_url_placeholder')"
        aria-describedby="apps-script-url-hint recent-apps-script-hint"
        type="url"
        autocomplete="url"
        aria-required="true"
        variant="outlined"
        hide-details="auto"
        :disabled="disabled"
        @update:model-value="emit('update:appsScriptUrl', String($event ?? ''))"
      >
        <template #prepend>
          <v-btn
            class="recent-apps-script-button"
            icon="mdi-history"
            color="secondary"
            variant="outlined"
            :aria-label="t('scan.recent_apps_script')"
            :title="t('scan.recent_apps_script')"
            href="https://script.google.com/home"
            target="_blank"
            rel="noopener noreferrer"
          />
        </template>
      </v-text-field>
      <p id="apps-script-url-hint" class="field-description">
        {{ t("scan.apps_script_url_hint") }}
      </p>
      <p id="recent-apps-script-hint" class="field-description">
        {{ t("scan.recent_apps_script_hint") }}
      </p>

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
