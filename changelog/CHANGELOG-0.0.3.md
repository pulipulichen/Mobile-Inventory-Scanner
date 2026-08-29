# 0.0.3

## Added

- Added an explicit `scan` settings confirmation action that enables inventory
  controls after a valid deployed Apps Script `/exec` URL is confirmed.
- Added a static `scan` PWA manifest for installable standalone display.

## Changed

- Made the `scan` location optional: a blank location preserves the existing
  Google Sheet location, while a value updates it.
- Added localized settings-confirmation status messages and guidance.
- Standardized `print` production asset filenames for predictable static
  deployments.

## Removed

- Removed `vite-plugin-pwa`, generated Service Worker registration, and runtime
  asset caching. The app now performs best-effort cleanup of legacy Service
  Workers and Cache Storage entries during startup.

## Documentation

- Updated frontend architecture, package, and `scan` documentation to describe
  the static-manifest PWA behavior and optional location workflow.
- Documented bounded frontend build verification and the requirement to report
  build timeouts instead of waiting indefinitely.
