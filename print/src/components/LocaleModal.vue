<script setup lang="ts">
import { computed, ref, useId, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  setLocale,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "../i18n";

const props = withDefaults(
  defineProps<{
    tone?: "light" | "dark";
  }>(),
  {
    tone: "light",
  },
);

const LANGUAGE_OPTIONS: Array<{
  value: SupportedLocale;
  nameKey: "common.chinese" | "common.english";
  searchTerms: string[];
}> = [
  {
    value: "zh-TW",
    nameKey: "common.chinese",
    searchTerms: ["繁體中文", "traditional chinese", "chinese", "中文", "zh-tw", "zh"],
  },
  {
    value: "en",
    nameKey: "common.english",
    searchTerms: ["english", "英文", "en"],
  },
];

const { t, locale } = useI18n({ useScope: "global" });
const isOpen = ref(false);
const searchQuery = ref("");
const titleId = useId();
const searchId = useId();
const resultsStatusId = useId();

const currentLanguageName = computed(() =>
  locale.value === "zh-TW" ? t("common.chinese") : t("common.english"),
);

const filteredLanguages = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return LANGUAGE_OPTIONS.filter((option) => {
    if (!SUPPORTED_LOCALES.includes(option.value)) return false;
    if (!query) return true;
    const label = t(option.nameKey).toLowerCase();
    return (
      label.includes(query) ||
      option.searchTerms.some((term) => term.toLowerCase().includes(query))
    );
  });
});

const resultsStatus = computed(() => {
  if (filteredLanguages.value.length === 0) {
    return t("common.language_no_results");
  }
  return "";
});

watch(isOpen, (open) => {
  if (open) searchQuery.value = "";
});

function selectLanguage(value: SupportedLocale): void {
  setLocale(value);
  isOpen.value = false;
}

function selectFirstMatch(): void {
  const first = filteredLanguages.value[0];
  if (first) selectLanguage(first.value);
}
</script>

<template>
  <div class="locale-modal" :class="`locale-modal--${props.tone}`">
    <v-dialog
      v-model="isOpen"
      class="locale-modal-dialog"
      max-width="28rem"
      :aria-labelledby="titleId"
    >
      <template #activator="{ props: activatorProps }">
        <v-btn
          v-bind="activatorProps"
          class="locale-modal-button"
          type="button"
          icon="mdi-web"
          variant="text"
          :color="props.tone === 'dark' ? 'white' : 'info'"
          :aria-label="
            t('common.language_button', { language: currentLanguageName })
          "
          :title="t('common.language')"
        />
      </template>

      <v-card>
        <v-card-title :id="titleId">
          {{ t("common.language") }}
        </v-card-title>
        <v-card-text>
          <form @submit.prevent="selectFirstMatch">
            <v-text-field
              :id="searchId"
              v-model="searchQuery"
              class="locale-search-field"
              :label="t('common.language_search')"
              :placeholder="t('common.language_search_placeholder')"
              :aria-describedby="resultsStatusId"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              autocomplete="off"
              spellcheck="false"
              hide-details="auto"
              clearable
            />
          </form>

          <p :id="resultsStatusId" class="visually-hidden" role="status">
            {{ resultsStatus }}
          </p>

          <ul
            v-if="filteredLanguages.length"
            class="locale-option-list"
            :aria-label="t('common.language_list')"
          >
            <li
              v-for="option in filteredLanguages"
              :key="option.value"
              class="locale-option-item"
            >
              <button
                type="button"
                class="locale-option"
                :aria-current="option.value === locale ? 'true' : undefined"
                @click="selectLanguage(option.value)"
              >
                <span class="locale-option-name">{{ t(option.nameKey) }}</span>
                <span
                  v-if="option.value === locale"
                  class="locale-option-current"
                >
                  {{ t("common.language_selected") }}
                </span>
              </button>
            </li>
          </ul>
          <p v-if="!filteredLanguages.length" class="locale-empty" aria-hidden="true">
            {{ t("common.language_no_results") }}
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn type="button" variant="text" @click="isOpen = false">
            {{ t("common.close") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped lang="scss">
.locale-modal-button {
  flex: 0 0 auto;
  min-width: 2.75rem;
  min-height: 2.75rem;
}

.locale-search-field {
  margin-bottom: 0.75rem;
}

.locale-option-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.locale-option-item + .locale-option-item {
  margin-top: 0.5rem;
}

.locale-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
  min-height: 3rem;
  padding: 0.75rem 1rem;
  color: #0f172a;
  text-align: left;
  cursor: pointer;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 0.75rem;
}

.locale-option:hover,
.locale-option:focus-visible {
  background: #ecfeff;
  border-color: #0f766e;
}

.locale-option[aria-current="true"] {
  background: #ccfbf1;
  border-color: #0f766e;
}

.locale-option-name {
  font-size: 1.05rem;
  font-weight: 700;
}

.locale-option-current {
  flex: 0 0 auto;
  color: #115e59;
  font-size: 0.85rem;
  font-weight: 700;
}

.locale-empty {
  margin: 0.25rem 0 0;
  color: #475569;
}
</style>
