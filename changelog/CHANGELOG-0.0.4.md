# 0.0.4

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
  Script deployment, QR label generation, mobile scanning, troubleshooting,
  privacy, and accessible operation.
