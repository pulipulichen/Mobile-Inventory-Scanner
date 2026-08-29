<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { ScanResult } from "../types/scan";

defineProps<{
  results: ScanResult[];
}>();

const { t } = useI18n({ useScope: "global" });

function statusText(result: ScanResult): string {
  if (result.state === "queued") return t("scan.result_queued");
  if (result.state === "sending") return t("scan.result_sending");
  if (result.state === "success") {
    return t("scan.result_success", {
      checked_time: result.checked_time ?? "",
      location: result.location ?? "",
    });
  }
  return t("scan.result_error", {
    error: result.errorCode ?? "UNKNOWN",
  });
}
</script>

<template>
  <section
    v-if="results.length"
    class="section-card result-card"
    aria-labelledby="scan-results-heading"
  >
    <div class="section-heading">
      <h2 id="scan-results-heading">{{ t("scan.results_heading") }}</h2>
      <p>{{ t("scan.results_description", { count: results.length }) }}</p>
    </div>
    <ol class="scan-results">
      <li v-for="result in results" :key="result.id" class="scan-result">
        <div>
          <strong>{{ result.name }}</strong>
          <span class="result-id">{{ result.id }}</span>
        </div>
        <p :class="`result-status result-status-${result.state}`">
          {{ statusText(result) }}
        </p>
      </li>
    </ol>
  </section>
</template>
