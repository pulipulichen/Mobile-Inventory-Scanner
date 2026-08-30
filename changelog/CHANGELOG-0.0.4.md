# 0.0.4

## Added

- Added a scanner-gun input mode on the `scan` tab so handheld barcode
  scanners can enter multiple IDs; after 3 seconds with no new input, the
  queued IDs are posted to Google Sheets. The camera/scanner-gun choice is
  saved in `localStorage`.
- Scan camera, photo, and live recognition now decode Code 128 alongside
  QR Codes. On-screen copy, the PWA name, and scan help text describe both
  barcode types instead of QR Code only.
- Added a print barcode format setting so labels can use QR Code, Code 128,
  or both. Preview and PDF keep vector Code 128 bars, and IDs that cannot be
  encoded as Code 128 block download until the Sheet is fixed or the format is
  switched back to QR Code.

## Fixed

- Removed the custom yellow focus outline from focused controls in the
  `scan` and `print` apps.
- Fixed `print` PDF downloads with Traditional Chinese label text by registering
  `pdflib-fontkit` correctly so `pdf-lib` can embed Noto Sans TC, and opening
  the save target from the original click before generation starts.
- Restored dashed label grid lines in generated PDFs so the spacing between
  labels remains visible for cutting.
- Prevented adjacent PDF label borders from overlapping when the label gap is
  zero, keeping shared dividers dashed instead of turning solid.
- Stopped `print` PDF downloads from using the File System Access save picker,
  so Chrome records the file in download history like a normal browser download.

## Changed

- Increased the PDF download button height and text size for easier touch
  interaction.
- Replaced the `scan` and `print` language dropdowns with a globe-only icon
  that opens a searchable dialog of large language buttons.
- Moved the scan-tab help button next to the heading, and replaced the
  camera / scanner-gun toggle buttons with a compact dropdown in the card's
  top-right corner.
- Renamed the scanner-gun input option to "External scanner (scanner gun)"
  to make the input method clearer.
- Unified the `print` app's generic QR Code and Code 128 wording as
  "barcode", while retaining each format name where the choice or error
  requires it.
- Moved the `print` app's output mode selector below print settings so PDF
  preview and scan simulation switching stays with the generated output.

## Improved

- Live camera scanning now also reads a central horizontal band so wide
  Code 128 barcodes are easier to decode, and zbar is limited to QR Code
  and Code 128 so other 1D formats are not treated as inventory IDs.
- Centered the scan pending-list loading message for clearer presentation.

## Documentation

- Added a Traditional Chinese usage guide covering Google Sheet setup, Apps
  Script deployment, QR and Code 128 label generation, mobile scanning,
  troubleshooting, privacy, and accessible operation.
- Fixed image links and the repository README link in the Apps Script setup
  guide.
