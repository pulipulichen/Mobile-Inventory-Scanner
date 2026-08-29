# 0.0.2

## Added

- Added independent Vue 3/Vuetify 4 TypeScript frontend apps for `scan` and
  `print`, including responsive accessible interfaces, localization, PWA
  support, and centralized browser settings storage.
- Added the `scan` camera workflow with rear-camera live QR scanning, photo/file
  fallback, local multi-code decoding, scan-session deduplication, per-ID
  Apps Script submission results, and pending inventory grouped by location.
- Added the `print` workflow for authorized Google Sheet reading, ID validation
  and duplicate reporting, SVG QR previews, configurable physical label layout,
  local vector PDF generation, and scan-scene simulation.
- Expanded the Apps Script inventory contract with the optional `name` column
  and `GET?action=pending` / `GET?action=list` read endpoints while retaining
  validated POST writes, duplicate handling, locking, and location behavior.

## Changed

- Standardized both frontend apps on Vuetify 4.x with `vite-plugin-vuetify`
  for shared, tree-shaken UI components and responsive layouts.
- Simplified the `print` Google Sheet source flow to use the Google Drive
  recent-files link and manual URL copy/paste, removing the Google OAuth and
  Drive API quick-picker requirement.
- Defined the Podman-based frontend build workflow for producing deployable
  static `scan/dist/` and `print/dist/` artifacts.

## Documentation

- Documented the live rear-camera scanning flow, camera stream cleanup, and
  scan-session deduplication requirements.
- Documented the pending-inventory read API, optional `name` column, and
  location-grouped display behavior across the Google Sheet and frontend
  specifications.
- Updated the setup and frontend guidance to use the static Google Drive recent
  spreadsheets link with manual Sheet URL copy and paste instead of a Drive
  API picker.
- Added a root landing page and README links for the initialized Google Sheet,
  its copy workflow, and the deployed `print` and `scan` tools.
