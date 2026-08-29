(() => {
  const CONFIG = window.GOOGLE_SHEET_CONFIG;
  const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
  const API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

  let accessToken = null;
  let tokenClient = null;

  function assertConfig() {
    if (!CONFIG) throw new Error("找不到 GOOGLE_SHEET_CONFIG。請檢查 config/google-sheet.js。 ");
    if (!CONFIG.spreadsheetId || CONFIG.spreadsheetId.startsWith("PASTE_")) {
      throw new Error("尚未設定 Google Spreadsheet ID。");
    }
    if (!CONFIG.clientId || CONFIG.clientId.startsWith("PASTE_")) {
      throw new Error("尚未設定 Google OAuth Client ID。");
    }
  }

  function waitForGoogleIdentity(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const timer = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          clearInterval(timer);
          resolve();
        } else if (Date.now() - started > timeoutMs) {
          clearInterval(timer);
          reject(new Error("Google Identity Services 載入逾時。"));
        }
      }, 100);
    });
  }

  async function signIn() {
    assertConfig();
    await waitForGoogleIdentity();

    if (!tokenClient) {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CONFIG.clientId,
        scope: SHEETS_SCOPE,
        callback: () => {}
      });
    }

    return new Promise((resolve, reject) => {
      tokenClient.callback = (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }
        accessToken = response.access_token;
        resolve(response);
      };
      tokenClient.requestAccessToken({ prompt: accessToken ? "" : "consent" });
    });
  }

  function signOut() {
    if (accessToken && window.google?.accounts?.oauth2) {
      google.accounts.oauth2.revoke(accessToken, () => {});
    }
    accessToken = null;
  }

  function isSignedIn() {
    return Boolean(accessToken);
  }

  function quoteSheetName(name) {
    return `'${String(name).replaceAll("'", "''")}'`;
  }

  function buildRange(a1Range) {
    return `${quoteSheetName(CONFIG.sheetName)}!${a1Range}`;
  }

  async function apiFetch(path, options = {}) {
    if (!accessToken) throw new Error("請先登入 Google。 ");

    const response = await fetch(`${API_BASE}/${CONFIG.spreadsheetId}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });

    if (response.status === 401) {
      accessToken = null;
      throw new Error("Google 登入已失效，請重新登入。 ");
    }

    if (!response.ok) {
      let detail = response.statusText;
      try {
        const body = await response.json();
        detail = body.error?.message || detail;
      } catch (_) {}
      throw new Error(`Google Sheets API 錯誤：${detail}`);
    }

    if (response.status === 204) return null;
    return response.json();
  }

  async function readInventory() {
    assertConfig();
    const firstDataRow = (CONFIG.headerRow || 1) + 1;
    const range = buildRange(`A${firstDataRow}:C`);
    const result = await apiFetch(`/values/${encodeURIComponent(range)}?majorDimension=ROWS`);
    const values = result.values || [];

    return values.map((row, index) => ({
      rowNumber: firstDataRow + index,
      id: String(row[0] ?? "").trim(),
      checkedTime: String(row[1] ?? "").trim(),
      location: String(row[2] ?? "").trim()
    })).filter(item => item.id);
  }

  async function getInventoryById(id) {
    const normalizedId = String(id ?? "").trim();
    const inventory = await readInventory();
    const matches = inventory.filter(item => item.id === normalizedId);

    if (matches.length === 0) return null;
    if (matches.length > 1) {
      throw new Error(`Google Sheet 中有重複 ID：${normalizedId}`);
    }
    return matches[0];
  }

  async function updateInventoryCheck(id, location, checkedTime = formatCheckedTime(new Date())) {
    const item = await getInventoryById(id);
    if (!item) throw new Error(`找不到 ID：${id}`);

    const range = buildRange(`B${item.rowNumber}:C${item.rowNumber}`);
    await apiFetch(`/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
      method: "PUT",
      body: JSON.stringify({
        range,
        majorDimension: "ROWS",
        values: [[checkedTime, location]]
      })
    });

    return { ...item, checkedTime, location };
  }

  function formatCheckedTime(date) {
    const pad = value => String(value).padStart(2, "0");
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate())
    ].join("") + "-" + pad(date.getHours()) + pad(date.getMinutes());
  }

  window.GoogleSheetInventory = {
    signIn,
    signOut,
    isSignedIn,
    readInventory,
    getInventoryById,
    updateInventoryCheck,
    formatCheckedTime
  };
})();
