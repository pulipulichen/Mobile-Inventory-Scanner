<script setup lang="ts">
import { useI18n } from "vue-i18n";

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
      <p id="apps-script-url-hint" class="field-description">
        {{ t("scan.apps_script_url_hint") }}
      </p>
      <p id="recent-apps-script-hint" class="field-description">
        {{ t("scan.recent_sheets_hint") }}
      </p>

      <v-combobox
        id="current-location"
        :model-value="location"
        :items="locationHistory"
        :label="t('scan.location_label')"
        :placeholder="t('scan.location_placeholder')"
        menu-icon="mdi-history"
        persistent-placeholder
        :hint="t('scan.location_hint')"
        autocomplete="off"
        variant="outlined"
        persistent-hint
        @update:model-value="emit('update:location', String($event ?? ''))"
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
      <p class="field-description settings-confirmation-hint">
        {{ t("scan.confirm_settings_hint") }}
      </p>
    </div>
  </section>
</template>
