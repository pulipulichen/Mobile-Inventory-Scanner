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
      "Load inventory IDs from Google Sheets, arrange labels for A4 paper, and download a vector PDF.",
    source_heading: "1. Google Sheet source",
    sheet_url_label: "Google Sheet URL",
    sheet_url_hint:
      "Paste the full URL from the browser address bar. The first worksheet and its id column will be loaded.",
    sheet_url_placeholder:
      "https://docs.google.com/spreadsheets/d/…/edit",
    recent_sheets: "Open recently used Google Sheets",
    recent_sheets_hint:
      "Google Drive opens in a new tab. Select a sheet and copy its URL back here.",
    load_sheet: "Load Sheet",
    reload_sheet: "Reload Sheet",
    scan_link: "Go to scan",
    mode_heading: "Work mode",
    mode_hint:
      "Choose between downloading PDF labels and building a scan scene for phone-camera recognition.",
    mode_pdf: "PDF printing",
    mode_simulation: "Scan simulation",
    mode_simulation_available:
      "The data is valid and contains no duplicate IDs, so a scan scene can be built.",
    simulation_requires_sheet:
      "Load a Google Sheet before using the scan simulation.",
    simulation_waiting_for_sheet:
      "The Google Sheet is loading; scan simulation is temporarily unavailable.",
    simulation_blocked_duplicates:
      "Duplicate IDs are present. Fix them and reload the Sheet before using the scan simulation.",
    simulation_requires_valid_data:
      "All QR Codes must be generated successfully before using the scan simulation.",
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
    orientation: "Paper orientation",
    orientation_portrait: "Portrait",
    orientation_landscape: "Landscape",
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
      "Fix these IDs in Google Sheets, then reload the sheet before generating a preview or PDF.",
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
    simulation_heading: "Scan simulation scene",
    simulation_description:
      "Build a virtual wall with scattered QR Codes, then use scan on another phone to photograph and recognize them.",
    simulation_controls: "Scan simulation controls",
    simulation_item_count: "QR Code count",
    simulation_count_5: "5",
    simulation_count_10: "10",
    simulation_count_20: "20",
    simulation_count_all: "All IDs",
    simulation_effective_count:
      "Showing {count} QR Codes; the source contains {available} valid IDs.",
    simulation_min_qr_size: "Minimum QR Code size",
    simulation_max_qr_size: "Maximum QR Code size",
    simulation_qr_size_hint: "Display size in pixels, from 48 to 512 px.",
    simulation_zoom: "Scene zoom",
    simulation_zoom_out: "Zoom out",
    simulation_zoom_in: "Zoom in",
    simulation_zoom_reset: "Reset to 100%",
    simulation_zoom_value: "Current zoom: {zoom}%",
    simulation_seed: "Current seed",
    simulation_randomize: "Randomize layout",
    simulation_rebuild_same_seed: "Rebuild with same seed",
    simulation_enter_fullscreen: "Enter fullscreen",
    simulation_exit_fullscreen: "Exit fullscreen",
    simulation_fullscreen_status: "Fullscreen mode is active.",
    simulation_windowed_status: "Windowed mode is active.",
    simulation_fullscreen_entered: "Entered fullscreen mode.",
    simulation_fullscreen_exited: "Exited fullscreen mode.",
    simulation_fullscreen_fallback:
      "Fullscreen is not supported by this browser. The page has been maximized instead.",
    simulation_keyboard_hint:
      "The scene supports keyboard operation. Focus the scene, then use arrow keys and the browser's native scrollbars to explore it.",
    simulation_scene_view: "QR Code scan simulation scene",
    simulation_qr_label: "QR Code, ID {id}",
    simulation_scene_created:
      "Scan scene created with {count} QR Codes.",
    simulation_no_data:
      "Load a valid Sheet without duplicate IDs to display the scan scene.",
  },
  status: {
    ready: "Paste a Google Sheet URL to begin.",
    loading_sheet: "Loading Google Sheet…",
    sheet_loaded: "Loaded {count} valid IDs from {sheet}.",
    duplicate_found: "The Sheet contains {count} duplicate ID groups. Preview and PDF are blocked.",
    pdf_generating: "Generating PDF…",
    pdf_success: "PDF downloaded successfully.",
    pdf_error: "PDF generation failed. Please try again.",
    load_error: "The Sheet could not be loaded.",
    settings_reset: "Print settings were reset to their defaults.",
  },
  errors: {
    CONFIG_MISSING:
      "Google OAuth is not configured. Set VITE_GOOGLE_CLIENT_ID and rebuild the app.",
    INVALID_SHEET_URL:
      "Enter a complete Google Sheet URL, such as https://docs.google.com/spreadsheets/d/…/edit.",
    GOOGLE_IDENTITY_UNAVAILABLE:
      "Google sign-in could not be loaded. Check your network connection and try again.",
    GOOGLE_AUTH_FAILED:
      "Google authorization failed or expired. Please try again.",
    SHEET_NOT_FOUND:
      "The Google Sheet or its first worksheet could not be found.",
    SHEET_ACCESS_DENIED:
      "You do not have permission to read this Google Sheet.",
    SHEET_READ_FAILED:
      "The Google Sheet could not be read. Check the URL and your network connection.",
    COLUMN_NOT_FOUND:
      "The first row must contain an id column.",
    NO_VALID_ID:
      "The Sheet contains no valid, non-empty IDs.",
    QR_GENERATION_FAILED:
      "QR Code generation failed. Reload the Sheet or try again later.",
    SIMULATION_MIN_SIZE_GREATER_THAN_MAX:
      "The minimum QR Code size cannot be greater than the maximum size.",
    SIMULATION_SIZE_OUT_OF_RANGE:
      "QR Code size must be between 48 and 512 px.",
    SIMULATION_ZOOM_OUT_OF_RANGE:
      "Scene zoom must be between 50% and 200%.",
    UNKNOWN:
      "An unexpected error occurred. Please try again.",
  },
} as const;
