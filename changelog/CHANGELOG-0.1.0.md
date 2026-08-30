# 0.1.0

## Added

- Added Code 128 support to `scan` recognition and `print` label generation,
  including vector Code 128 bars in previews and PDFs.
- Added an external scanner (scanner gun) input mode that queues multiple IDs
  and submits them after three seconds without new input.

## Changed

- Replaced the language dropdowns with globe buttons that open searchable
  dialogs containing large language choices.
- Moved scan help beside its heading and moved the camera / external scanner
  choice into a compact card dropdown.
- Unified QR Code and Code 128 wording as “barcode” where the selected format
  is not relevant.
- Moved the print output mode selector beside the generated output.

## Fixed

- Preserved dashed PDF label dividers when labels have no gap.
- Routed PDF saves through the browser download manager instead of the File
  System Access save picker.
- Clarified external scanner labels and enlarged the PDF download action for
  easier touch interaction.

## Improved

- Improved live camera recognition of wide Code 128 barcodes by scanning a
  central horizontal band and limiting recognition to supported inventory
  formats.
- Centered the scan pending-list loading message.

## Documentation

- Updated the usage and app documentation for Code 128 labels, external
  scanner input, searchable language dialogs, and the revised scan workflow.
