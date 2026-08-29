# 0.0.3

## Added

- Added an explicit `scan` settings confirmation action that enables inventory
  controls after a valid deployed Apps Script `/exec` URL is confirmed.
- Added a static `scan` PWA manifest for installable standalone display.
- Added tap-to-focus on the `scan` camera preview, with a visible reticle and
  keyboard activation that focuses the center of the frame.
- Added a current-location field on the `scan` screen so location can be
  changed without going back to Settings.
- Added a mobile-app bottom navigation bar in `scan` for Settings, Scan,
  Checked, and Unchecked.
- Added `vue-router` hash routes in `scan` so each tab has a shareable URL
  (`#/settings`, `#/scan`, `#/checked`, `#/pending`).

## Changed

- Made the `scan` location optional: a blank location preserves the existing
  Google Sheet location, while a value updates it.
- Added localized settings-confirmation status messages and guidance.
- Standardized `print` production asset filenames for predictable static
  deployments.
- Opened `scan` on the scan tab when a saved Apps Script `/exec` URL is
  already valid.
- Improved live QR scanning on phones by requesting the rear camera at a
  moderate resolution, enabling continuous autofocus when the browser allows
  it, downscaling frames before decode, retrying a center crop, and merging
  native `BarcodeDetector` results with `@undecaf/zbar-wasm`.
- Combined the `scan` pending-inventory action and result list into one card,
  showed each location as a nested card, listed ID and name in two columns,
  and moved the current location group to the top.
- Batched `scan` inventory writes: new IDs wait 3 seconds with no further
  scans, then one POST sends `ids` plus location. The UI does not wait for the
  Apps Script POST body; it confirms writes with `GET ?action=list`.
- Updated the bound Apps Script Web App to write a batch of IDs under one
  lock and return per-item success or failure.
- Replaced session-wide scan deduplication with a 10-second cooldown so the
  same ID can be checked again later.
- Cleared the current `scan` results when the location changes, so a new
  place starts a new check.
- Replaced the in-page status alert for unrecognized QR Codes and photo decode errors with bottom toast notifications.
- Showed batch-complete summaries as a bottom toast instead of a persistent
  in-page alert.
- Gave `scan` a mobile-app layout with a bottom navigation bar for Settings,
  Scan, Checked, and Unchecked. Confirming settings opens `#/scan`; leaving
  Scan stops the camera. Direct URLs and the browser back button switch tabs.
- Stopped inserting in-page info banners above the `scan` camera. Queue and
  camera progress stay in a visually hidden live region or a bottom toast, so
  the preview no longer jumps when IDs are added.
- Moved the `scan` start-inventory instructions behind a help-icon button next
  to the heading. The previous on-page paragraph now opens in a dialog.
- Moved the `scan` unchecked-items instructions behind the same heading help
  icon and dialog, using a shared `HelpModal` component.
- Moved `scan` settings instructions behind the heading help icon, dropped the
  Google sign-in note, and removed the confirmation hint under the button.

## Fixed

- Fixed `scan` photo decoding dropping valid QR Codes because zbar reports
  `ZBAR_QRCODE` while the decoder only kept `QR-Code`.
- Improved `scan` photo decoding for screen photographs by using high-quality
  downscaling across several sizes, so moiré from monitor pixels no longer
  hides QR Codes that are visible to people.
- Changed the toast dismiss control from visible “close” text to an icon-only
  close button with an accessible name.
- Fixed Vite `504 (Outdated Optimize Dep)` error during photo recognition in `scan`
  by explicitly configuring `@undecaf/zbar-wasm` in `optimizeDeps.include`, statically
  importing QR decoder modules, and adding a full-resolution fallback when scaled photo decoding detects no QR codes.
- Mapped the optional Google Sheet `name` column in Apps Script so pending
  inventory items return their human-readable names instead of repeating the ID.
- Stopped `scan` results from remaining stuck on “waiting to send” or
  “writing to Google Sheets” when the Apps Script POST redirect was unreadable.

## Removed

- Removed `vite-plugin-pwa`, generated Service Worker registration, and runtime
  asset caching. The app now performs best-effort cleanup of legacy Service
  Workers and Cache Storage entries during startup.
- Removed the in-page “clear results” action, the extra “open location
  history” button, duplicated current-location cards, and the Apps Script URL
  helper copy on the `scan` settings screen.

## Documentation

- Documented the static-manifest PWA behavior, optional location workflow, and
  the `scan` bottom-tab mobile layout.
- Documented bounded frontend build verification and the requirement to report
  build timeouts instead of waiting indefinitely.
- Documented `scan` auto-confirm of a saved `/exec` URL, the bottom feature
  tabs and hash routes, camera tap-to-focus, live-frame downscaling, and native
  `BarcodeDetector` fallback alongside zbar.
- Documented batch inventory POST (`ids` + location), GET confirmation, the
  10-second rescan cooldown, and resetting current results after a location
  change. Apps Script must be redeployed for the batch contract.
