export default {
  common: {
    app_title: "Mobile QR Code Inventory",
    app_description:
      "Scan QR Codes, record item locations, and find items not yet checked.",
    skip_to_content: "Skip to main content",
    language: "Language",
    chinese: "繁體中文",
    english: "English",
  },
  scan: {
    app_bar_subtitle: "Mobile QR Code inventory",
    settings_heading: "Connection and location",
    settings_description:
      "Enter the deployed Apps Script /exec URL. Current location is optional; Google sign-in is not required.",
    apps_script_url_label: "Apps Script /exec URL",
    apps_script_url_placeholder:
      "https://script.google.com/macros/s/…/exec",
    apps_script_url_hint:
      "Use the deployed URL ending in /exec, not the /dev test URL.",
    recent_sheets: "Open recently used Google Sheets",
    recent_sheets_hint:
      "Google Drive opens in a new tab. Select a spreadsheet and copy its URL back here.",
    location_label: "Current location",
    location_placeholder: "Science Laboratory",
    location_hint:
      "Optional. Leave it blank to keep the existing Google Sheets location; enter a value to update it.",
    confirm_settings: "Confirm settings and enter inventory",
    confirm_settings_hint:
      "Confirm the Apps Script URL to show the inventory controls; current location is optional. A saved valid URL opens the inventory controls automatically.",
    scanner_heading: "Start inventory check",
    scanner_description:
      "Place QR Codes in front of the camera and start scanning. You can also take or choose a photo; multiple QR Codes are supported.",
    start_camera: "Start scanning",
    stop_camera: "Stop camera",
    capture_qr_code: "Take QR Code photo",
    choose_photo: "Choose a photo",
    camera_preview_label: "QR Code camera preview",
    camera_tap_to_focus:
      "Tap the preview to focus, or press Enter to focus on the center",
    camera_tap_to_focus_hint: "Tap the preview to focus",
    camera_focused: "Focused on the selected point.",
    clear_results: "Clear results and start a new check",
    pending_button: "List unchecked IDs",
    pending_control_description:
      "Read items with a blank checked_time from Google Sheets and group them by their existing location.",
    pending_heading: "Items not yet checked",
    pending_loading: "Loading unchecked items…",
    pending_summary: "{count} unchecked IDs in {groups} location groups.",
    pending_group_count: "{count} IDs",
    pending_empty: "There are no unchecked IDs right now.",
    unassigned_location: "Location not set",
    results_heading: "Current check results",
    results_description: "{count} IDs processed.",
    result_queued: "Waiting to send",
    result_sending: "Writing to Google Sheets…",
    result_success: "Check succeeded; time {checked_time}; location {location}",
    result_error: "Check failed ({error})",
    privacy_note:
      "QR Code images are decoded locally in this browser. Photos and camera frames are not uploaded.",
  },
  status: {
    ready: "Set the Apps Script URL to begin; current location is optional.",
    settings_confirmed: "Settings confirmed. You can start the inventory check.",
    camera_starting: "Starting camera…",
    camera_active:
      "Camera is active. Place a QR Code in front of the camera. Tap the preview to focus.",
    camera_stopped: "Camera stopped.",
    photo_recognizing: "Recognizing QR Codes in the photo…",
    ids_found: "Recognition complete. Found {count} QR Codes.",
    no_qr_code: "No QR Code was detected. Take another photo or choose a different one.",
    ids_duplicate_ignored:
      "All detected QR Codes were already processed in this check. Duplicates were ignored.",
    ids_found_with_duplicates:
      "Recognition complete. Found {count} new QR Codes; {ignored} duplicates were ignored.",
    sending: "Sending the inventory result for {id}…",
    all_complete: "Inventory check complete: {success} succeeded and {failed} failed.",
    pending_loaded: "Loaded {count} unchecked IDs.",
    pending_empty: "There are no unchecked IDs right now.",
    session_cleared: "Current results were cleared. You can start a new check.",
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
      "Unchecked items could not be loaded. Check the network and Apps Script deployment.",
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
