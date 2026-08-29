<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import HelpModal from "./HelpModal.vue";
import type { PendingLocationGroup } from "../types/scan";

const props = defineProps<{
  groups: PendingLocationGroup[];
  loading: boolean;
  hasLoaded: boolean;
}>();

const emit = defineEmits<{
  load: [];
}>();

const { t } = useI18n({ useScope: "global" });
const itemCount = computed(() =>
  props.groups.reduce((total, group) => total + group.items.length, 0),
);
</script>

<template>
  <section
    class="section-card pending-card"
    aria-labelledby="pending-heading"
    :aria-busy="loading"
  >
    <div class="section-heading">
      <div class="section-heading-row">
        <h2 id="pending-heading">{{ t("scan.pending_heading") }}</h2>
        <HelpModal
          :title="t('scan.pending_help')"
          :description="t('scan.pending_control_description')"
        />
      </div>
    </div>

    <v-btn
      type="button"
      color="secondary"
      size="large"
      :loading="loading"
      @click="emit('load')"
    >
      {{ t("scan.pending_button") }}
    </v-btn>

    <p v-if="groups.length" class="pending-summary">
      {{ t("scan.pending_summary", { count: itemCount }) }}
    </p>
    <p v-else-if="hasLoaded && !loading" class="pending-summary">
      {{ t("scan.pending_empty") }}
    </p>

    <div
      v-if="loading && !groups.length"
      class="loading-text"
      role="status"
      aria-live="polite"
    >
      {{ t("scan.pending_loading") }}
    </div>

    <div v-else-if="groups.length" class="pending-groups">
      <section
        v-for="(group, groupIndex) in groups"
        :key="group.locationKey"
        class="pending-location-card"
        :class="{ 'is-current': group.isCurrent }"
        :aria-labelledby="`pending-location-${groupIndex}`"
      >
        <h3 :id="`pending-location-${groupIndex}`">
          {{ group.location }}
          <span
            v-if="group.isCurrent && group.locationKey"
            class="pending-current-badge"
          >
            {{ t("scan.pending_current_location_badge") }}
          </span>
          <span class="group-count">
            {{ t("scan.pending_group_count", { count: group.items.length }) }}
          </span>
        </h3>
        <ul class="pending-items">
          <li v-for="item in group.items" :key="item.id">
            <span class="pending-item-id">{{ item.id }}</span>
            <span class="pending-item-name">{{ item.name }}</span>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>
