export default {
  common: {
    app_title: "QR label generator",
    app_description: "Create inventory QR Code labels from a Google Sheet.",
    skip_to_content: "Skip to main content",
    language: "Language",
    chinese: "繁體中文",
    english: "English",
    required: "Required",
    close: "Close",
  },
  print: {
    page_title: "QR Code label generator",
    subtitle:
      "Load inventory IDs from Google Sheets, arrange labels for the selected paper size, and download a vector PDF.",
    source_heading: "1. Google Sheet source",
    sheet_url_label: "Google Sheet URL",
    sheet_url_hint:
      "Paste a Google Sheet URL. The first worksheet is downloaded as CSV and its id column is analyzed.",
    sheet_url_placeholder:
      "https://docs.google.com/spreadsheets/d/…/edit",
    recent_sheets: "Open recently used Google Sheets",
    recent_sheets_hint:
      "Google Drive opens in a new tab. Select a sheet and copy its URL back here.",
    load_sheet: "Load data",
    reload_sheet: "Reload data",
    settings_heading: "2. Print settings",
    settings_hint:
      "Changes are saved in this browser and update the preview immediately.",
    qr_size: "QR Code size",
    qr_size_hint: "Physical size of each QR Code.",
    id_font_size: "ID text size",
    id_font_size_hint: "Text size printed below the QR Code.",
    qr_text_gap: "QR / ID gap",
    qr_text_gap_hint: "Space between the QR Code and its ID.",
    label_gap: "Label gap",
    label_gap_hint: "Space between adjacent labels.",
    page_margin: "Page margin",
    page_margin_hint: "Printable content margin on each side.",
    paper_size: "Paper size",
    paper_size_hint: "B-series sizes use the JIS dimensions common in Taiwan.",
    paper_size_option: "{name} ({width} × {height} mm)",
    orientation: "Paper orientation",
    orientation_portrait: "Portrait",
    orientation_landscape: "Landscape",
    show_id_text: "Show ID text",
    show_id_text_hint:
      "When off, preview and PDF keep only the QR Code and relayout the labels.",
    reset_settings: "Reset settings",
    summary_heading: "Sheet report",
    summary_sheet: "Sheet",
    summary_spreadsheet_id: "Spreadsheet ID",
    summary_valid_ids: "Valid IDs",
    summary_rows: "Data rows",
    summary_data_errors: "Data errors",
    summary_duplicate_groups: "Duplicate groups",
    duplicate_heading: "Duplicate IDs prevent PDF generation",
    duplicate_description:
      "Fix these IDs in Google Sheets, then reload the data before generating a preview or PDF.",
    duplicate_item: "{id}: {locations}",
    preview_heading: "3. Preview",
    preview_description:
      "{count} labels · {columns} per row · {rows} rows per page · {pages} pages",
    preview_empty: "Load a Sheet without duplicate IDs to see the label preview.",
    page: "Page {page} of {pages}",
    qr_label: "QR Code for ID {id}",
    download_pdf: "Download PDF",
    pdf_filename: "inventory-qr-labels",
    footer_note:
      "PDF is generated locally in your browser. Your Sheet data is not uploaded to this app.",
  },
  status: {
    ready: "Confirm the Google Sheet URL, then select “Load data”.",
    loading_sheet: "Downloading Google Sheet CSV…",
    sheet_loaded: "Loaded {count} valid IDs from {sheet}.",
    duplicate_found: "The Sheet contains {count} duplicate ID groups. Preview and PDF are blocked.",
    pdf_generating: "Generating PDF…",
    pdf_success: "PDF downloaded successfully.",
    pdf_error: "PDF generation failed. Please try again.",
    load_error: "The Sheet could not be loaded.",
    settings_reset: "Print settings were reset to their defaults.",
  },
  errors: {
    INVALID_SHEET_URL:
      "Enter a complete Google Sheet URL, such as https://docs.google.com/spreadsheets/d/…/edit.",
    SHEET_NOT_FOUND:
      "The Google Sheet or its first worksheet could not be found.",
    SHEET_ACCESS_DENIED:
      "The Google Sheet CSV could not be downloaded. Check that the Sheet is publicly accessible.",
    SHEET_READ_FAILED:
      "The Google Sheet CSV could not be downloaded or analyzed. Check the URL, sharing settings, and network connection.",
    COLUMN_NOT_FOUND:
      "The first row must contain an id column.",
    NO_VALID_ID:
      "The Sheet contains no valid, non-empty IDs.",
    QR_GENERATION_FAILED:
      "QR Code generation failed. Reload the Sheet or try again later.",
    UNKNOWN:
      "An unexpected error occurred. Please try again.",
  },
} as const;
