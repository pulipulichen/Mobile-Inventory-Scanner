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
      "Changes are saved in this browser and update the PDF preview and scan-simulation labels immediately.",
    qr_size: "QR Code size",
    qr_size_hint: "Physical size of each QR Code.",
    id_font_size: "Text size",
    id_font_size_hint: "Text size printed below the QR Code.",
    qr_text_gap: "QR / text gap",
    qr_text_gap_hint: "Space between the QR Code and its label text.",
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
    label_text: "Label text",
    label_text_hint:
      "Show the ID, the name, or no text below each QR Code. Empty names fall back to the ID.",
    label_text_hidden: "Hidden",
    label_text_id: "ID",
    label_text_name: "Name",
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
    qr_label_with_name: "QR Code for ID {id}, name {name}",
    download_pdf: "Download PDF",
    pdf_filename: "inventory-qr-labels",
    footer_note:
      "PDF is generated locally in your browser. Your Sheet data is not uploaded to this app.",
  },
  simulation: {
    mode_heading: "Output mode",
    mode_hint: "Choose whether to generate a PDF or display a scan practice scene.",
    pdf_mode: "PDF labels",
    simulation_mode: "Scan simulation",
    simulation_unavailable: "Load a valid Sheet without duplicate IDs first.",
    heading: "QR Code scan simulation",
    description:
      "Display a scrollable wall of QR Code labels on this screen and scan it with another device.",
    controls_heading: "Scan simulation controls",
    item_count: "QR Code count",
    item_count_hint: "The current scene will contain {count} available IDs.",
    item_count_option: "{count} QR Codes",
    item_count_all: "All IDs",
    min_qr_size: "Minimum QR Code size",
    max_qr_size: "Maximum QR Code size",
    qr_size_hint: "Display size for each QR Code. The scene chooses a size in this range.",
    build_scene: "Build scene",
    randomize: "Randomize layout",
    rebuild_same_seed: "Rebuild with same seed",
    zoom: "Scene zoom",
    zoom_out: "Zoom out",
    zoom_in: "Zoom in",
    zoom_reset: "Reset to 100%",
    source_not_loaded: "Load a Google Sheet before building a scan scene.",
    source_duplicates:
      "Scan simulation is disabled because the loaded Sheet contains duplicate IDs.",
    source_qr_loading:
      "QR Codes are being updated to match the print settings. Please wait.",
    source_qr_error:
      "Scan simulation is disabled because one or more QR Codes could not be generated.",
    ready: "Choose the scene settings, then select “Build scene”.",
    no_items: "There are no valid IDs available for the scan scene.",
    scene_created: "Scan scene built with {count} QR Codes.",
    build_hint:
      "The scene will appear here after a valid Sheet is loaded and you build it.",
    scene_heading: "QR Code scan scene",
    scene_summary:
      "{count} QR Codes · scene size {width} × {height} px before zoom",
    go_to_scan: "Open scan on another device",
    enter_fullscreen: "Enter full screen",
    exit_fullscreen: "Exit full screen",
    exit_fullscreen_hint: "Press Escape to exit full screen.",
    fullscreen_entered: "Full screen enabled. Press Escape to exit.",
    fullscreen_exited: "Full screen disabled. Focus returned to the full-screen button.",
    fullscreen_unsupported:
      "Full screen is not supported here. The simulation was expanded within this page. Press Escape to exit.",
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
    SIMULATION_INVALID_ITEM_COUNT:
      "Choose a supported QR Code count.",
    SIMULATION_INVALID_QR_SIZE:
      "QR Code sizes must be between 48 px and 480 px.",
    SIMULATION_MIN_QR_LARGER_THAN_MAX:
      "The minimum QR Code size cannot be larger than the maximum.",
    SIMULATION_INVALID_ZOOM:
      "Scene zoom must be between 50% and 200%.",
    SIMULATION_LAYOUT_FAILED:
      "The scene could not fit all QR Codes. Try a smaller QR Code size range.",
    UNKNOWN:
      "An unexpected error occurred. Please try again.",
  },
} as const;
