<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { PendingLocationGroup } from "../types/scan";

defineProps<{
  groups: PendingLocationGroup[];
  loading: boolean;
}>();

const { t } = useI18n({ useScope: "global" });
</script>

<template>
  <section
    class="section-card pending-card"
    aria-labelledby="pending-heading"
    :aria-busy="loading"
  >
    <div class="section-heading">
      <h2 id="pending-heading">{{ t("scan.pending_heading") }}</h2>
      <p v-if="groups.length">
        {{ t("scan.pending_summary", {
          count: groups.reduce((total, group) => total + group.items.length, 0),
          groups: groups.length,
        }) }}
      </p>
      <p v-else>{{ t("scan.pending_empty") }}</p>
    </div>

    <div v-if="loading" class="loading-text" role="status" aria-live="polite">
      {{ t("scan.pending_loading") }}
    </div>

    <div v-else-if="groups.length" class="pending-groups">
      <section
        v-for="group in groups"
        :key="group.location"
        class="pending-group"
        :aria-labelledby="`pending-location-${group.location}`"
      >
        <h3 :id="`pending-location-${group.location}`">
          {{ group.location }}
          <span class="group-count">
            {{ t("scan.pending_group_count", { count: group.items.length }) }}
          </span>
        </h3>
        <ul>
          <li v-for="item in group.items" :key="item.id">
            <strong>{{ item.name }}</strong>
            <span class="result-id">{{ item.id }}</span>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>
