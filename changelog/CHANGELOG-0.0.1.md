# 0.0.1

### Changed

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

- Expanded the Google Sheet setup guide with deployment steps for the Apps
  Script Web App and instructions for obtaining the Sheet URL.
- Split the Google Sheet and Apps Script URL instructions into dedicated
  guides.
- Documented the end-to-end `scan` and `print` workflows with Mermaid diagrams.
- Clarified responsive preview behavior, PDF download requirements, `scan`
  navigation, error handling, and the current project file layout.
- Added documentation guidance for vertical process flowcharts.
