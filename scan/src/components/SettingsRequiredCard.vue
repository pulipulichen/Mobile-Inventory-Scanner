<script setup lang="ts">
import { useI18n } from "vue-i18n";

const emit = defineEmits<{
  goToSettings: [];
}>();

const { t } = useI18n({ useScope: "global" });
</script>

<template>
  <section class="section-card" aria-labelledby="tab-locked-heading">
    <div class="section-heading">
      <h2 id="tab-locked-heading">
        {{ t("scan.tab_needs_settings_heading") }}
      </h2>
      <p>{{ t("scan.tab_needs_settings") }}</p>
    </div>
    <v-btn
      class="settings-required-button"
      type="button"
      color="primary"
      size="large"
      @click="emit('goToSettings')"
    >
      {{ t("scan.go_to_settings") }}
    </v-btn>
  </section>
</template>
