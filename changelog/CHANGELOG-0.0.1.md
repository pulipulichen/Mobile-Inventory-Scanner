# 0.0.1

### Changed

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
- Standardized both frontend apps on Vuetify 4.x with `vite-plugin-vuetify`
  for shared, tree-shaken UI components and responsive layouts.
- Added the bound Apps Script Web App implementation for inventory writes,
  including JSON `POST` validation, dynamic required-column lookup, duplicate
  and missing-ID handling, script locking, server-side timestamps, and blank
  location preservation.
- Simplified the `print` Google Sheet source flow to use the Google Drive
  recent-files link and manual URL copy/paste, removing the Google OAuth and
  Drive API quick-picker requirement.
- Defined the Podman-based frontend build workflow for producing deployable
  static `scan/dist/` and `print/dist/` artifacts.

- Updated the frontend architecture guidance to define responsive `print`
  behavior and browser-local vector PDF generation with `pdf-lib`.
- Clarified the package-first approach for QR Code previews and vector PDF
  output.
- Standardized the Google Sheet and Apps Script integration on a JSON `POST`
  contract with English response messages.
- Added `vue-i18n` requirements for both frontend apps, including locale
  persistence, translation key conventions, and accessible status messages.
- Clarified duplicate-ID detection, spreadsheet cell reporting, and blank
  location handling for Google Sheet integration.

### Documentation

- Added a project roles document describing responsibilities and boundaries for
  the development environment, CI, static hosting, frontend apps, Google Sheet,
  and bound Apps Script.
- Added the frontend build guide with Podman commands, development ports, and
  static deployment output directories.
- Updated package and app documentation to record the Vuetify UI boundary,
  retained native controls, and the revised Google Sheet access workflow.
- Expanded the Google Sheet setup guide with deployment steps for the Apps
  Script Web App and instructions for obtaining the Sheet URL.
- Split the Google Sheet and Apps Script URL instructions into dedicated
  guides.
- Documented the end-to-end `scan` and `print` workflows with Mermaid diagrams.
- Clarified responsive preview behavior, PDF download requirements, `scan`
  navigation, error handling, and the current project file layout.
- Added documentation guidance for vertical process flowcharts.
