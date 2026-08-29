# 0.0.2

## Added

- Added independent Vue 3/Vuetify 4 TypeScript frontend apps for `scan` and
  `print`, including responsive accessible interfaces, localization, PWA
  support, and centralized browser settings storage.
- Added the `scan` camera workflow with rear-camera live QR scanning, photo/file
  fallback, local multi-code decoding, scan-session deduplication, per-ID
  Apps Script submission results, and pending inventory grouped by location.
- Added the `print` workflow for browser-accessible Google Sheet CSV data, ID
  validation and duplicate reporting, SVG QR previews, configurable physical
  label layout, and local vector PDF generation.
- Added a `print` scan-simulation scene with configurable QR Code count and
  display size, deterministic layouts, zoom, keyboard scrolling, randomization,
  and full-screen display for multi-code scanning practice.
- Added `print` paper-size selection (A4, A3, A5, B4, B5; default A4) and a
  label-text setting to hide text or show either the ID or the Sheet `name`
  on the preview and generated PDF.
- Added Material Design Icons for the scan controls and print source actions.
- Expanded the Apps Script inventory contract with the optional `name` column
  and `GET?action=pending` / `GET?action=list` read endpoints while retaining
  validated POST writes, duplicate handling, locking, and location behavior.

## Changed

- Hid the `scan` header language `<select>` behind the globe icon so the native
  picker still opens on tap or keyboard focus without showing a truncated
  dropdown beside the title.
- Hid the `scan` unchecked-items result card until the user loads the pending
  list, so an empty “no unchecked IDs” message is not shown on first visit.
- Laid out the `scan` stop-camera, capture, and photo buttons as three equal
  columns with Material Design Icons.
- Standardized both frontend apps on Vuetify 4.x with `vite-plugin-vuetify`
  for shared, tree-shaken UI components and responsive layouts.
- Simplified the `print` Google Sheet source flow to use browser CSV export,
  the Google Drive recent-files link, and manual URL copy/paste, removing
  Google OAuth, Google Identity Services, and the Drive API quick picker.
- Replaced the `print` PDF download control with a full-width Vuetify button
  that includes a PDF icon.
- Auto-loaded `print` Google Sheet data when a valid URL is already present or
  pasted, keeping the source button as a manual reload.
- Changed the bound Apps Script to use the first worksheet automatically,
  removing the need for a configured worksheet name.
- Restricted `scan` Apps Script requests to deployed HTTPS `/exec` endpoints
  and announced ignored duplicate IDs during a scan session.
- Saved a new location in history only after a successful inventory submission.
- Removed the optional `print` scan-scene simulator and cross-app navigation so
  `print` and `scan` remain independent tools.
- Defined the Podman-based frontend build workflow for producing deployable
  static `scan/dist/` and `print/dist/` artifacts.
- Added `frontend_dev.sh` and `frontend_build.sh` one-click commands for
  watched development and compressed production builds.
- Made the `print` scan-simulation “Build scene” control a full-width
  button that enters fullscreen after a successful scene is created, and
  stopped showing the layout seed in the simulator UI.
- Limited `print` scan-simulation fullscreen to the scene canvas, hiding
  the toolbar and other controls, and using Escape to exit.
- Packed about 10 QR Codes into one scan-simulation screen and placed extra
  codes on adjacent screens that can be scrolled into view.
- Made `print` scan-simulation labels follow the current print settings for
  text size, caption, and QR-to-text spacing.
- Encoded the selected label caption (`id` or `name`) into QR Codes for print
  preview, PDF, and scan simulation, falling back to `id` when `name` is blank.
- Hid the `scan` camera, pending-inventory, and result UI until both a valid
  Apps Script `/exec` URL and a location are set, and showed an error alert
  for invalid URLs.
- Added a `scan` source action that opens the same Google Drive recent
  spreadsheets link as `print`.
- Loaded a saved Google Sheet URL automatically when opening `print`.
- Kept print settings visible in scan-simulation mode and regenerated QR Codes
  when the label-text setting changes.
- Lazy-loaded the `print` scan simulator, PDF generator, and `scan` QR decoder
  to reduce the initial bundle size.
- Tracked `scan/dist/` and `print/dist/` for GitHub Pages and pointed the
  published tool URLs at those directories.
- Limited the frontend GitHub Actions workflow to manual `workflow_dispatch`
  and ran `./frontend_build.sh` as the single build step.

## Documentation

- Documented the live rear-camera scanning flow, camera stream cleanup, and
  scan-session deduplication requirements.
- Documented the pending-inventory read API, optional `name` column, and
  location-grouped display behavior across the Google Sheet and frontend
  specifications.
- Updated the setup and frontend guidance to use the static Google Drive recent
  spreadsheets link with manual Sheet URL copy and paste instead of a Drive
  API picker.
- Documented CSV export access requirements, selectable paper sizes, optional
  ID text, independent `print`/`scan` boundaries, and deployed `/exec` URL
  requirements.
- Added a root landing page and README links for the initialized Google Sheet,
  its copy workflow, and the deployed `print` and `scan` tools.
- Documented QR Code payload following the label-text setting, scan-simulation
  packing of about 10 codes per screen, and GitHub Pages URLs under
  `print/dist/` and `scan/dist/`.
- Documented that `print` automatically loads a valid Google Sheet URL and
  keeps the source button for a manual reload.
- Documented the `scan` Google Drive recent-spreadsheets link for finding the
  Sheet used by the Apps Script deployment without Google OAuth or Drive API.
- Added illustrated Apps Script deployment and authorization steps, including
  copying the deployed Web App URL back into `scan`.
