export default {
  common: {
    app_title: "Mobile QR Code Inventory",
    app_description:
      "Scan QR Codes, record item locations, and find items not yet checked.",
    skip_to_content: "Skip to main content",
    language: "Language",
    chinese: "繁體中文",
    english: "English",
    dismiss: "Dismiss notification",
    close: "Close",
  },
  scan: {
    app_bar_subtitle: "Mobile QR Code inventory",
    settings_heading: "Connection and location",
    settings_help: "Settings instructions",
    settings_description:
      "Enter the deployed Apps Script /exec URL. Current location is optional. Confirm the Apps Script URL to start scanning. A saved valid URL opens the scan tab automatically.",
    apps_script_url_label: "Apps Script /exec URL",
    apps_script_url_placeholder:
      "https://script.google.com/macros/s/…/exec",
    recent_sheets: "Open recently used Google Sheets",
    location_label: "Current location",
    location_placeholder: "Science Laboratory",
    location_history_heading: "Location history",
    location_history_empty:
      "No location history yet. Locations appear here after a successful check.",
    confirm_settings: "Confirm settings and start scanning",
    scanner_heading: "Start inventory check",
    scanner_help: "Scanning instructions",
    scanner_description:
      "Place QR Codes in front of the camera and start scanning. You can also take or choose a photo; multiple QR Codes are supported. After scanning, the app waits 3 seconds with no new IDs, then sends one batch. The same ID is not sent again within 10 seconds.",
    start_camera: "Start scanning",
    stop_camera: "Stop camera",
    capture_qr_code: "Take QR Code photo",
    choose_photo: "Choose a photo",
    camera_preview_label: "QR Code camera preview",
    camera_tap_to_focus:
      "Tap the preview to focus, or press Enter to focus on the center",
    camera_tap_to_focus_hint: "Tap the preview to focus",
    camera_focused: "Focused on the selected point.",
    pending_button: "List unchecked IDs",
    pending_help: "Unchecked items instructions",
    pending_control_description:
      "Read items with a blank checked_time from Google Sheets, show them in one list card, and label their existing locations.",
    pending_heading: "Items not yet checked",
    pending_loading: "Loading unchecked items…",
    pending_summary: "{count} unchecked IDs.",
    pending_group_count: "{count} IDs",
    pending_current_location_badge: "Current location",
    pending_empty: "There are no unchecked IDs right now.",
    unassigned_location: "Location not set",
    results_heading: "Current check results",
    results_description: "{count} IDs processed.",
    result_queued: "Waiting 3 seconds to send as a batch",
    result_sending: "Writing to Google Sheets…",
    result_success: "Check succeeded; time {checked_time}",
    result_success_with_location:
      "Check succeeded; time {checked_time}; location {location}",
    result_error: "Check failed ({error})",
    privacy_note:
      "QR Code images are decoded locally in this browser. Photos and camera frames are not uploaded.",
    tab_navigation: "Main features",
    tab_settings: "Settings",
    tab_scan: "Scan",
    tab_checked: "Checked",
    tab_pending: "Unchecked",
    tab_needs_settings_heading: "Finish setup first",
    tab_needs_settings:
      "Confirm the Apps Script /exec URL in Settings before using this feature.",
    go_to_settings: "Go to Settings",
    results_empty: "No checked items yet. Scanned QR Codes will appear here.",
  },
  status: {
    ready: "Set the Apps Script URL to begin; current location is optional.",
    settings_confirmed: "Settings confirmed. You can start scanning.",
    camera_starting: "Starting camera…",
    camera_active:
      "Camera is active. Place a QR Code in front of the camera. Tap the preview to focus.",
    camera_stopped: "Camera stopped.",
    photo_recognizing: "Recognizing QR Codes in the photo…",
    ids_found: "Recognition complete. Found {count} QR Codes.",
    no_qr_code: "No QR Code was detected. Take another photo or choose a different one.",
    ids_duplicate_ignored:
      "These QR Codes were already scanned within 10 seconds and were ignored.",
    ids_found_with_duplicates:
      "Added {count} QR Codes. They will be sent as one batch after 3 seconds with no new scans. {ignored} duplicates scanned within 10 seconds were ignored.",
    ids_batch_waiting:
      "Added {count} QR Codes. They will be sent as one batch after 3 seconds with no new scans.",
    sending: "Sending the inventory result for {id}…",
    batch_sending: "Sending {count} inventory results as one batch…",
    confirming: "Confirming {count} submitted inventory results…",
    inventory_failed_item: "Inventory check failed: {id} ({error})",
    all_complete: "Inventory check complete: {success} succeeded and {failed} failed.",
    pending_loaded: "Loaded {count} unchecked IDs.",
    pending_empty: "There are no unchecked IDs right now.",
    location_changed_results_cleared:
      "The location changed, so the current check results were reset.",
  },
  errors: {
    INVALID_REQUEST: "The Apps Script URL is invalid. Use the complete /exec URL.",
    INVALID_ID: "The scanned ID is invalid.",
    INVALID_LOCATION: "The current location is invalid.",
    ID_NOT_FOUND: "This ID was not found in Google Sheets.",
    DUPLICATE_ID: "This ID appears more than once in Google Sheets. Fix the data first.",
    SHEET_NOT_FOUND: "The configured Google Sheet worksheet could not be found.",
    COLUMN_NOT_FOUND:
      "Google Sheets is missing a required column. Check the first row headers.",
    WRITE_FAILED: "Google Sheets could not be updated. Please try again later.",
    READ_FAILED:
      "The Apps Script response could not be read. Check the network and Apps Script deployment.",
    CAMERA_UNAVAILABLE:
      "This browser or device does not support a camera. Use a photo instead.",
    CAMERA_PERMISSION_DENIED:
      "The camera could not start. Allow camera access or use a photo instead.",
    CAMERA_FRAME_UNAVAILABLE: "The camera frame is unavailable. Start scanning again.",
    QR_DECODE_FAILED:
      "QR Code recognition temporarily failed. Adjust the distance or lighting and try again.",
    IMAGE_READ_FAILED: "The photo could not be read. Choose it again.",
    UNKNOWN: "An unexpected error occurred. Please try again.",
  },
} as const;
