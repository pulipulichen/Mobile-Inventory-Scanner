<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  idleMs: number;
}>();

const emit = defineEmits<{
  detected: [ids: string[]];
  activity: [];
  idleLeftover: [ids: string[]];
}>();

const { t } = useI18n({ useScope: "global" });
const form = ref<HTMLFormElement | null>(null);
const scannerInput = ref("");
const hintId = useId();
let idleTimer = 0;

function focusInput(): void {
  void nextTick(() => {
    form.value?.querySelector("input")?.focus();
  });
}

function readInput(): string {
  return String(scannerInput.value ?? "").trim();
}

function clearIdleTimer(): void {
  window.clearTimeout(idleTimer);
}

function scheduleIdleSubmit(): void {
  clearIdleTimer();
  idleTimer = window.setTimeout(() => {
    const leftover = readInput();
    if (!leftover) return;
    scannerInput.value = "";
    emit("idleLeftover", [leftover]);
  }, props.idleMs);
}

function handleInput(): void {
  if (!readInput()) {
    clearIdleTimer();
    return;
  }
  emit("activity");
  scheduleIdleSubmit();
}

function submitScannerInput(): void {
  clearIdleTimer();
  const value = readInput();
  if (!value) return;
  emit("detected", [value]);
  scannerInput.value = "";
  focusInput();
}

defineExpose({ focus: focusInput });

onMounted(focusInput);

onBeforeUnmount(() => {
  clearIdleTimer();
  const leftover = readInput();
  if (leftover) emit("detected", [leftover]);
});
</script>

<template>
  <form ref="form" class="scanner-gun-panel" @submit.prevent="submitScannerInput">
    <v-text-field
      v-model="scannerInput"
      class="scanner-gun-field"
      type="text"
      name="scanner_gun_id"
      :label="t('scan.scanner_gun_label')"
      :placeholder="t('scan.scanner_gun_placeholder')"
      :aria-describedby="hintId"
      prepend-inner-icon="mdi-barcode-scan"
      append-inner-icon="mdi-keyboard-return"
      variant="outlined"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      hide-details="auto"
      clearable
      @update:model-value="handleInput"
      @click:append-inner="submitScannerInput"
    />
    <p :id="hintId" class="scanner-gun-hint">
      {{ t("scan.scanner_gun_hint") }}
    </p>
    <v-btn
      type="submit"
      color="primary"
      size="large"
      prepend-icon="mdi-keyboard-return"
    >
      {{ t("scan.scanner_gun_submit") }}
    </v-btn>
  </form>
</template>
