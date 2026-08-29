import { reactive, ref, watch } from "vue";
import {
  clearPrintSettings,
  loadGoogleSheetUrl,
  loadPrintSettings,
  saveGoogleSheetUrl,
  savePrintSettings,
} from "../services/print_storage";
import {
  DEFAULT_PRINT_SETTINGS,
  type PrintSettings,
} from "../types/print";

export function usePrintSettings() {
  const settings = reactive<PrintSettings>(loadPrintSettings());
  const googleSheetUrl = ref(loadGoogleSheetUrl());

  watch(
    settings,
    (value) => {
      savePrintSettings(value);
    },
    { deep: true },
  );

  watch(googleSheetUrl, (value) => {
    saveGoogleSheetUrl(value);
  });

  function resetSettings(): void {
    clearPrintSettings();
    Object.assign(settings, DEFAULT_PRINT_SETTINGS);
    googleSheetUrl.value = "";
  }

  return {
    googleSheetUrl,
    settings,
    resetSettings,
  };
}
