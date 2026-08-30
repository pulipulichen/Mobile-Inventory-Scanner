# 0.0.4

## Added

- Added a scanner-gun input mode on the `scan` tab so handheld barcode
  scanners can enter multiple IDs; after 3 seconds with no new input, the
  queued IDs are posted to Google Sheets. The camera/scanner-gun choice is
  saved in `localStorage`.
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

## Changed

- Increased the PDF download button height and text size for easier touch
  interaction.

## Documentation

- Added a Traditional Chinese usage guide covering Google Sheet setup, Apps
  Script deployment, QR and Code 128 label generation, mobile scanning,
  troubleshooting, privacy, and accessible operation.
