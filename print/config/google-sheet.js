// Browser-side configuration. OAuth Client ID is not a Client Secret.
// Do not place a Google OAuth Client Secret in this repository.
window.GOOGLE_SHEET_CONFIG = {
  spreadsheetId: "PASTE_SPREADSHEET_ID_HERE",
  sheetName: "盤點",
  clientId: "PASTE_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com",

  // Expected Google Sheet columns.
  columns: {
    id: "A",
    checkedTime: "B",
    location: "C"
  },

  // Row 1 is the header; inventory data starts from row 2.
  headerRow: 1,

  // checked_time is written as YYYYMMDD-HHmm, e.g. 20260829-1710.
  checkedTimeFormat: "YYYYMMDD-HHmm"
};
