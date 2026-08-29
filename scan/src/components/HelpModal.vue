<script setup lang="ts">
import { ref, useId } from "vue";
import { useI18n } from "vue-i18n";

defineProps<{
  title: string;
  description: string;
}>();

const { t } = useI18n({ useScope: "global" });
const isOpen = ref(false);
const titleId = useId();
</script>

<template>
  <span class="help-modal-wrap">
    <v-dialog
      v-model="isOpen"
      class="help-modal"
      max-width="32rem"
      :aria-labelledby="titleId"
    >
      <template #activator="{ props: activatorProps }">
        <v-btn
          v-bind="activatorProps"
          class="help-modal-button"
          type="button"
          icon="mdi-help-circle-outline"
          variant="text"
          color="secondary"
          :aria-label="title"
          :title="title"
        />
      </template>
      <v-card>
        <v-card-title :id="titleId">
          {{ title }}
        </v-card-title>
        <v-card-text>
          {{ description }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn type="button" variant="text" @click="isOpen = false">
            {{ t("common.close") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>
</template>

<style scoped lang="scss">
.help-modal-wrap {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
}

.help-modal-button {
  flex: 0 0 auto;
  min-width: 2.75rem;
  min-height: 2.75rem;
}
</style>
