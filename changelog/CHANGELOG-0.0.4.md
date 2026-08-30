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
- Enlarged the scan language selector and displayed the active language to
  make mobile language switching easier to tap.
- Moved the scan-tab help button next to the heading, and replaced the
  camera / scanner-gun toggle buttons with a compact dropdown in the card's
  top-right corner.

## Improved

- Live camera scanning now also reads a central horizontal band so wide
  Code 128 barcodes are easier to decode, and zbar is limited to QR Code
  and Code 128 so other 1D formats are not treated as inventory IDs.

## Documentation

- Added a Traditional Chinese usage guide covering Google Sheet setup, Apps
  Script deployment, QR and Code 128 label generation, mobile scanning,
  troubleshooting, privacy, and accessible operation.
