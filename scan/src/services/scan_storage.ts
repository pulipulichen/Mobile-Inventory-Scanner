const STORAGE_KEYS = {
  appsScriptUrl: "mis.scan.apps_script_url",
  location: "mis.scan.location",
  locationHistory: "mis.scan.location_history",
  locale: "mis.scan.locale",
} as const;

const MAX_LOCATION_HISTORY = 20;

function getItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage-disabled contexts should not block scanning.
  }
}

export function loadAppsScriptUrl(): string {
  return getItem(STORAGE_KEYS.appsScriptUrl) ?? "";
}

export function saveAppsScriptUrl(url: string): void {
  setItem(STORAGE_KEYS.appsScriptUrl, url);
}

export function loadLocation(): string {
  return getItem(STORAGE_KEYS.location) ?? "";
}

export function saveLocation(location: string): void {
  setItem(STORAGE_KEYS.location, location);
}

export function loadLocationHistory(): string[] {
  const stored = getItem(STORAGE_KEYS.locationHistory);
  if (!stored) return [];

  try {
    const values: unknown = JSON.parse(stored);
    if (!Array.isArray(values)) return [];
    return values.filter(
      (value): value is string => typeof value === "string" && value.trim() !== "",
    );
  } catch {
    return [];
  }
}

export function saveLocationToHistory(location: string): string[] {
  const normalizedLocation = location.trim();
  if (!normalizedLocation) return loadLocationHistory();

  const history = [
    normalizedLocation,
    ...loadLocationHistory().filter((item) => item !== normalizedLocation),
  ].slice(0, MAX_LOCATION_HISTORY);
  setItem(STORAGE_KEYS.locationHistory, JSON.stringify(history));
  return history;
}

export function loadLocale(): string | null {
  return getItem(STORAGE_KEYS.locale);
}

export function saveLocale(locale: string): void {
  setItem(STORAGE_KEYS.locale, locale);
}
