export default {
  common: {
    app_title: "QR Code 標籤產生器",
    app_description: "從 Google Sheet 產生盤點用 QR Code 標籤。",
    skip_to_content: "跳到主要內容",
    language: "語言",
    chinese: "繁體中文",
    english: "English",
    required: "必填",
    close: "關閉",
  },
  print: {
    page_title: "QR Code 標籤產生器",
    subtitle:
      "從 Google Sheet 讀取盤點 ID，排列 A4 標籤版面，並下載向量 PDF。",
    source_heading: "1. Google Sheet 資料來源",
    sheet_url_label: "Google Sheet 網址",
    sheet_url_hint:
      "請貼上瀏覽器網址列的完整網址，系統會讀取第一個工作表與其中的 id 欄。",
    sheet_url_placeholder:
      "https://docs.google.com/spreadsheets/d/…/edit",
    recent_sheets: "開啟最近使用的 Google Sheet",
    recent_sheets_hint:
      "Google Drive 會在新分頁開啟。選取試算表後，將網址複製回這裡。",
    load_sheet: "讀取 Sheet",
    reload_sheet: "重新讀取 Sheet",
    scan_link: "前往 scan",
    mode_heading: "工作模式",
    mode_hint: "選擇要下載 PDF 標籤，或建立供手機拍照辨識的掃描模擬場景。",
    mode_pdf: "PDF 列印",
    mode_simulation: "掃描模擬",
    mode_simulation_available: "資料有效且沒有重複 ID，可以建立掃描模擬場景。",
    simulation_requires_sheet: "請先載入 Google Sheet，才能使用掃描模擬。",
    simulation_waiting_for_sheet: "正在載入 Google Sheet，掃描模擬暫時不可用。",
    simulation_blocked_duplicates:
      "目前有重複 ID，請修正後重新讀取，才能使用掃描模擬。",
    simulation_requires_valid_data:
      "需要成功產生所有 QR Code 後，才能使用掃描模擬。",
    settings_heading: "2. 列印設定",
    settings_hint: "設定會保存於此瀏覽器，修改後立即更新預覽。",
    qr_size: "QR Code 尺寸",
    qr_size_hint: "每張 QR Code 的實體尺寸。",
    id_font_size: "ID 文字大小",
    id_font_size_hint: "印在 QR Code 下方的文字大小。",
    qr_text_gap: "QR／ID 間距",
    qr_text_gap_hint: "QR Code 與 ID 文字之間的距離。",
    label_gap: "標籤間距",
    label_gap_hint: "相鄰標籤之間的距離。",
    page_margin: "頁面邊界",
    page_margin_hint: "每一側內容與紙張邊緣的距離。",
    orientation: "紙張方向",
    orientation_portrait: "直向",
    orientation_landscape: "橫向",
    reset_settings: "重設設定",
    summary_heading: "Sheet 報表",
    summary_sheet: "試算表",
    summary_spreadsheet_id: "Spreadsheet ID",
    summary_valid_ids: "有效 ID",
    summary_rows: "資料列",
    summary_data_errors: "資料錯誤",
    summary_duplicate_groups: "重複 ID 組數",
    duplicate_heading: "有重複 ID，暫停產生 PDF",
    duplicate_description:
      "請在 Google Sheet 修正這些 ID，再重新讀取 Sheet，才能產生預覽或 PDF。",
    duplicate_item: "{id}：{locations}",
    preview_heading: "3. 預覽",
    preview_description:
      "{count} 張標籤・每列 {columns} 張・每頁 {rows} 列・共 {pages} 頁",
    preview_empty: "讀取沒有重複 ID 的 Sheet 後，這裡會顯示標籤預覽。",
    page: "第 {page} 頁，共 {pages} 頁",
    qr_label: "ID {id} 的 QR Code",
    download_pdf: "下載 PDF",
    pdf_filename: "inventory-qr-labels",
    footer_note:
      "PDF 在瀏覽器本機產生；本工具不會上傳你的 Sheet 資料。",
    simulation_heading: "掃描模擬場景",
    simulation_description:
      "建立一面散佈多張 QR Code 的虛擬牆，使用另一支手機開啟 scan 後拍照辨識。",
    simulation_controls: "掃描模擬控制項",
    simulation_item_count: "QR Code 數量",
    simulation_count_5: "5 張",
    simulation_count_10: "10 張",
    simulation_count_20: "20 張",
    simulation_count_all: "全部 ID",
    simulation_effective_count:
      "目前將顯示 {count} 張；資料來源共有 {available} 個有效 ID。",
    simulation_min_qr_size: "最小 QR Code 尺寸",
    simulation_max_qr_size: "最大 QR Code 尺寸",
    simulation_qr_size_hint: "畫面顯示尺寸，範圍為 48 至 512 px。",
    simulation_zoom: "場景縮放",
    simulation_zoom_out: "縮小場景",
    simulation_zoom_in: "放大場景",
    simulation_zoom_reset: "重設為 100%",
    simulation_zoom_value: "目前縮放 {zoom}%",
    simulation_seed: "目前 seed",
    simulation_randomize: "重新隨機排列",
    simulation_rebuild_same_seed: "使用相同 seed 重建",
    simulation_enter_fullscreen: "進入全螢幕",
    simulation_exit_fullscreen: "離開全螢幕",
    simulation_fullscreen_status: "目前為全螢幕模式。",
    simulation_windowed_status: "目前為一般視窗模式。",
    simulation_fullscreen_entered: "已進入全螢幕模式。",
    simulation_fullscreen_exited: "已離開全螢幕模式。",
    simulation_fullscreen_fallback:
      "瀏覽器不支援全螢幕 API，已切換為頁面最大化顯示。",
    simulation_keyboard_hint:
      "場景支援鍵盤操作；請將焦點移到場景後，使用方向鍵與瀏覽器原生捲軸瀏覽。",
    simulation_scene_view: "QR Code 掃描模擬場景",
    simulation_qr_label: "QR Code，ID {id}",
    simulation_scene_created: "掃描場景建立完成，共顯示 {count} 個 QR Code。",
    simulation_no_data: "載入有效且沒有重複 ID 的 Sheet 後，這裡會顯示掃描場景。",
  },
  status: {
    ready: "請貼上 Google Sheet 網址開始。",
    loading_sheet: "正在讀取 Google Sheet…",
    sheet_loaded: "已從「{sheet}」讀取 {count} 個有效 ID。",
    duplicate_found: "Sheet 有 {count} 組重複 ID，已暫停預覽與 PDF。",
    pdf_generating: "正在產生 PDF…",
    pdf_success: "PDF 已成功下載。",
    pdf_error: "PDF 產生失敗，請再試一次。",
    load_error: "無法讀取 Sheet。",
    settings_reset: "列印設定已重設為預設值。",
  },
  errors: {
    CONFIG_MISSING:
      "尚未設定 Google OAuth。請設定 VITE_GOOGLE_CLIENT_ID 後重新建置。",
    INVALID_SHEET_URL:
      "請輸入完整的 Google Sheet 網址，例如 https://docs.google.com/spreadsheets/d/…/edit。",
    GOOGLE_IDENTITY_UNAVAILABLE:
      "無法載入 Google 登入服務，請檢查網路後再試。",
    GOOGLE_AUTH_FAILED:
      "Google 授權失敗或已過期，請再試一次。",
    SHEET_NOT_FOUND:
      "找不到 Google Sheet 或第一個工作表。",
    SHEET_ACCESS_DENIED:
      "目前登入的 Google 帳號沒有讀取此 Sheet 的權限。",
    SHEET_READ_FAILED:
      "無法讀取 Google Sheet，請檢查網址與網路連線。",
    COLUMN_NOT_FOUND:
      "第一列必須包含 id 欄位。",
    NO_VALID_ID:
      "Sheet 中沒有有效的非空 ID。",
    QR_GENERATION_FAILED:
      "QR Code 產生失敗，請重新讀取 Sheet 或稍後再試。",
    SIMULATION_MIN_SIZE_GREATER_THAN_MAX:
      "最小 QR Code 尺寸不可大於最大尺寸。",
    SIMULATION_SIZE_OUT_OF_RANGE:
      "QR Code 尺寸必須介於 48 至 512 px。",
    SIMULATION_ZOOM_OUT_OF_RANGE:
      "場景縮放必須介於 50% 至 200%。",
    UNKNOWN:
      "發生未預期的錯誤，請再試一次。",
  },
} as const;
