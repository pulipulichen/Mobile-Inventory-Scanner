<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";

defineProps<{
  disabled: boolean;
}>();

const emit = defineEmits<{
  file: [file: File];
}>();

const cameraInput = ref<HTMLInputElement | null>(null);
const photoInput = ref<HTMLInputElement | null>(null);
const { t } = useI18n({ useScope: "global" });

function handleFile(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (file) emit("file", file);
}
</script>

<template>
  <div class="image-source-actions">
    <v-btn
      type="button"
      color="secondary"
      size="large"
      stacked
      block
      prepend-icon="mdi-camera"
      :disabled="disabled"
      @click="cameraInput?.click()"
    >
      {{ t("scan.capture_qr_code") }}
    </v-btn>
    <v-btn
      type="button"
      variant="outlined"
      color="secondary"
      size="large"
      stacked
      block
      prepend-icon="mdi-image"
      :disabled="disabled"
      @click="photoInput?.click()"
    >
      {{ t("scan.choose_photo") }}
    </v-btn>
    <input
      ref="cameraInput"
      class="visually-hidden"
      type="file"
      accept="image/*"
      capture="environment"
      :disabled="disabled"
      @change="handleFile"
    />
    <input
      ref="photoInput"
      class="visually-hidden"
      type="file"
      accept="image/*"
      :disabled="disabled"
      @change="handleFile"
    />
  </div>
</template>
