<script setup lang="ts">
import { useI18n } from "vue-i18n";
import CurrentLocationField from "./CurrentLocationField.vue";
import HelpModal from "./HelpModal.vue";

defineProps<{
  appsScriptUrl: string;
  location: string;
  locationHistory: string[];
  settingsLocked: boolean;
}>();

const emit = defineEmits<{
  "update:appsScriptUrl": [value: string];
  "update:location": [value: string];
  confirm: [];
}>();

const { t } = useI18n({ useScope: "global" });
</script>

<template>
  <section class="section-card settings-card" aria-labelledby="settings-heading">
    <div class="section-heading">
      <div class="section-heading-row">
        <h2 id="settings-heading">{{ t("scan.settings_heading") }}</h2>
        <HelpModal
          :title="t('scan.settings_help')"
          :description="t('scan.settings_description')"
        />
      </div>
    </div>

    <div class="settings-fields">
      <v-text-field
        id="apps-script-url"
        class="apps-script-url-field"
        :model-value="appsScriptUrl"
        :label="t('scan.apps_script_url_label')"
        :placeholder="t('scan.apps_script_url_placeholder')"
        type="url"
        autocomplete="url"
        aria-required="true"
        variant="outlined"
        hide-details="auto"
        :disabled="settingsLocked"
        @update:model-value="emit('update:appsScriptUrl', String($event ?? ''))"
      >
        <template #prepend>
          <v-btn
            class="recent-apps-script-button"
            icon="mdi-history"
            color="secondary"
            variant="outlined"
            :aria-label="t('scan.recent_sheets')"
            :title="t('scan.recent_sheets')"
            href="https://drive.google.com/drive/u/0/recent?q=type:spreadsheet"
            target="_blank"
            rel="noopener noreferrer"
          />
        </template>
      </v-text-field>

      <CurrentLocationField
        id="current-location"
        :model-value="location"
        :location-history="locationHistory"
        @update:model-value="emit('update:location', $event)"
      />

      <v-btn
        class="confirm-settings-button"
        type="button"
        color="primary"
        size="large"
        prepend-icon="mdi-check-circle"
        :disabled="settingsLocked"
        @click="emit('confirm')"
      >
        {{ t("scan.confirm_settings") }}
      </v-btn>
    </div>
  </section>
</template>
