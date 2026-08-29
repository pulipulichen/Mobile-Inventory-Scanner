<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineProps<{
  id: string;
  modelValue: string;
  locationHistory: string[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const { t } = useI18n({ useScope: "global" });
</script>

<template>
  <div class="current-location-field">
    <v-combobox
      :id="id"
      :model-value="modelValue"
      :items="locationHistory"
      :label="t('scan.location_label')"
      :placeholder="t('scan.location_placeholder')"
      menu-icon="mdi-history"
      :no-data-text="t('scan.location_history_empty')"
      :hide-no-data="false"
      persistent-placeholder
      autocomplete="off"
      variant="outlined"
      hide-details
      @update:model-value="emit('update:modelValue', String($event ?? ''))"
    >
      <template #prepend-item>
        <v-list-subheader>
          {{ t("scan.location_history_heading") }}
        </v-list-subheader>
      </template>
    </v-combobox>
  </div>
</template>
