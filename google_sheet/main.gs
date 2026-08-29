/**
 * Mobile Inventory Scanner - Bound Apps Script Web App
 *
 * This script must be bound to the Google Sheet that contains the inventory
 * data. Deploy it as a Web app and use the /exec URL in scan.
 */

var CONFIG = {
  // Rename this value if the inventory data is stored in another worksheet.
  SHEET_NAME: "盤點",
  HEADER_ROW: 1,
  TIMEZONE: "Asia/Taipei",
  CHECKED_TIME_FORMAT: "yyyyMMdd-HHmmss",
  LOCK_TIMEOUT_MS: 10000,
  COLUMNS: {
    ID: "id",
    NAME: "name",
    CHECKED_TIME: "checked_time",
    LOCATION: "location"
  }
};

/**
 * Receives one inventory check request.
 *
 * Expected body:
 * {
 *   "id": "A01",
 *   "location": "主機房 A 區"
 * }
 *
 * @param {Object} event Apps Script web-app event.
 * @return {ContentService.TextOutput} JSON response.
 */
function doPost(event) {
  var request = {};

  try {
    var payload = parseRequestBody_(event);
    request.id = normalizeId_(payload.id);
    request.location = normalizeLocation_(payload.location);

    return jsonResponse_(processInventoryCheck_(request));
  } catch (error) {
    return jsonResponse_(buildErrorResponse_(error, request));
  }
}

/**
 * Provides a small deployment health check. Inventory writes still require
 * POST and are never performed by this method.
 *
 * Supported query parameters:
 * - action=pending: returns items whose checked_time is blank.
 * - action=list: returns all inventory items.
 *
 * @param {Object} event Apps Script web-app event.
 * @return {ContentService.TextOutput} JSON response.
 */
function doGet(event) {
  var action = getCellText_(
    event && event.parameter && event.parameter.action
  ).toLowerCase();

  if (!action) {
    return jsonResponse_({
      success: true,
      message: "Inventory check service is ready. Use POST or GET?action=pending."
    });
  }

  try {
    if (action === "pending") {
      return jsonResponse_(processInventoryList_(true));
    }
    if (action === "list") {
      return jsonResponse_(processInventoryList_(false));
    }
    throw apiError_("INVALID_REQUEST", "Unsupported GET action: " + action);
  } catch (error) {
    return jsonResponse_(buildErrorResponse_(error, {}));
  }
}

/**
 * Parses the raw POST body as a JSON object.
 *
 * @param {Object} event Apps Script web-app event.
 * @return {Object} Parsed request payload.
 */
function parseRequestBody_(event) {
  if (!event || !event.postData ||
      typeof event.postData.contents !== "string" ||
      !event.postData.contents.trim()) {
    throw apiError_(
      "INVALID_REQUEST",
      "Request body must be a JSON object."
    );
  }

  var payload;
  try {
    payload = JSON.parse(event.postData.contents);
  } catch (error) {
    throw apiError_(
      "INVALID_REQUEST",
      "Request body must contain valid JSON."
    );
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw apiError_(
      "INVALID_REQUEST",
      "Request body must be a JSON object."
    );
  }

  return payload;
}

/**
 * Normalizes an incoming ID. IDs are compared as trimmed strings so that
 * values decoded from QR codes and values read from the sheet use the same
 * representation.
 *
 * @param {*} value Request ID.
 * @return {string} Normalized ID.
 */
function normalizeId_(value) {
  if (value === null || value === undefined ||
      (typeof value !== "string" && typeof value !== "number")) {
    throw apiError_("INVALID_ID", "Item ID must be a non-empty string.");
  }

  var id = String(value).trim();
  if (!id || /[\r\n]/.test(id)) {
    throw apiError_("INVALID_ID", "Item ID must be a non-empty string.");
  }

  return id;
}

/**
 * Normalizes an incoming location. An omitted or blank location is valid and
 * means that the existing sheet value must be preserved.
 *
 * @param {*} value Request location.
 * @return {string} Normalized location.
 */
function normalizeLocation_(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value !== "string") {
    throw apiError_("INVALID_LOCATION", "Location must be a string.");
  }

  return value.trim();
}

/**
 * Looks up the requested ID and writes the inventory result.
 *
 * @param {Object} request Normalized request.
 * @return {Object} Success response.
 */
function processInventoryCheck_(request) {
  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);
  } catch (error) {
    throw apiError_(
      "WRITE_FAILED",
      "Unable to acquire the inventory sheet lock."
    );
  }

  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getTargetSheet_(spreadsheet);
    var columnMap = getColumnMap_(sheet);
    var match = findUniqueIdRow_(sheet, columnMap.id, request.id);

    var checkedTime = formatCheckedTime_(
      new Date(),
      getSpreadsheetTimeZone_(spreadsheet)
    );
    var currentLocation = getCellText_(
      sheet.getRange(match.rowNumber, columnMap.location).getDisplayValue()
    );
    var nextLocation = request.location || currentLocation;

    writeInventoryCheck_(
      sheet,
      match.rowNumber,
      columnMap,
      checkedTime,
      request.location
    );

    return {
      success: true,
      item: {
        id: request.id,
        name: columnMap.name
          ? getCellText_(sheet.getRange(match.rowNumber, columnMap.name).getDisplayValue())
          : "",
        checked_time: checkedTime,
        location: nextLocation
      },
      message: "Inventory check succeeded"
    };
  } catch (error) {
    if (error && error.code) {
      throw error;
    }

    Logger.log(error && error.stack ? error.stack : error);
    throw apiError_(
      "WRITE_FAILED",
      "Unable to write the inventory check."
    );
  } finally {
    lock.releaseLock();
  }
}

/**
 * Reads inventory rows for the scan page.
 *
 * @param {boolean} onlyPending Return only rows without checked_time.
 * @return {Object} Inventory list response.
 */
function processInventoryList_(onlyPending) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getTargetSheet_(spreadsheet);
  var columnMap = getColumnMap_(sheet);
  var firstDataRow = CONFIG.HEADER_ROW + 1;
  var lastRow = sheet.getLastRow();
  var items = [];

  if (lastRow >= firstDataRow) {
    var lastColumn = sheet.getLastColumn();
    var rows = sheet
      .getRange(firstDataRow, 1, lastRow - CONFIG.HEADER_ROW, lastColumn)
      .getDisplayValues();

    rows.forEach(function(row) {
      var id = getCellText_(row[columnMap.id - 1]).trim();
      if (!id) {
        return;
      }

      var checkedTime = getCellText_(row[columnMap.checkedTime - 1]).trim();
      if (onlyPending && checkedTime) {
        return;
      }

      items.push({
        id: id,
        name: columnMap.name
          ? getCellText_(row[columnMap.name - 1]).trim()
          : "",
        checked_time: checkedTime,
        location: getCellText_(row[columnMap.location - 1]).trim()
      });
    });
  }

  return {
    success: true,
    items: items,
    message: onlyPending
      ? "Pending inventory items loaded"
      : "Inventory items loaded"
  };
}

/**
 * Gets the configured worksheet from the bound spreadsheet.
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet Bound sheet.
 * @return {GoogleAppsScript.Spreadsheet.Sheet} Target worksheet.
 */
function getTargetSheet_(spreadsheet) {
  if (!spreadsheet) {
    throw apiError_(
      "SHEET_NOT_FOUND",
      "The bound spreadsheet could not be found."
    );
  }

  var sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    throw apiError_(
      "SHEET_NOT_FOUND",
      "Target worksheet not found: " + CONFIG.SHEET_NAME
    );
  }

  return sheet;
}

/**
 * Finds required columns by their header names instead of relying on fixed
 * column letters.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet Target worksheet.
 * @return {Object} Column indexes, using one-based sheet indexes.
 * The name column is optional for backwards compatibility.
 */
function getColumnMap_(sheet) {
  var lastColumn = sheet.getLastColumn();
  if (lastColumn < 1) {
    throw apiError_(
      "COLUMN_NOT_FOUND",
      "Required columns were not found in the worksheet."
    );
  }

  var headers = sheet
    .getRange(CONFIG.HEADER_ROW, 1, 1, lastColumn)
    .getDisplayValues()[0];
  var requiredHeaders = [
    CONFIG.COLUMNS.ID,
    CONFIG.COLUMNS.CHECKED_TIME,
    CONFIG.COLUMNS.LOCATION
  ];
  var columnMap = {};

  headers.forEach(function(header, index) {
    var normalizedHeader = getCellText_(header);
    if (requiredHeaders.indexOf(normalizedHeader) === -1) {
      return;
    }

    if (columnMap[normalizedHeader]) {
      throw apiError_(
        "COLUMN_NOT_FOUND",
        "Required column appears more than once: " + normalizedHeader
      );
    }

    columnMap[normalizedHeader] = index + 1;
  });

  var missingHeaders = requiredHeaders.filter(function(header) {
    return !columnMap[header];
  });
  if (missingHeaders.length > 0) {
    throw apiError_(
      "COLUMN_NOT_FOUND",
      "Required column not found: " + missingHeaders.join(", ")
    );
  }

  return {
    id: columnMap[CONFIG.COLUMNS.ID],
    name: columnMap[CONFIG.COLUMNS.NAME] || 0,
    checkedTime: columnMap[CONFIG.COLUMNS.CHECKED_TIME],
    location: columnMap[CONFIG.COLUMNS.LOCATION]
  };
}

/**
 * Searches all data rows and rejects both missing and duplicate IDs.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet Target worksheet.
 * @param {number} idColumn One-based ID column index.
 * @param {string} id Requested ID.
 * @return {Object} Matching row metadata.
 */
function findUniqueIdRow_(sheet, idColumn, id) {
  var firstDataRow = CONFIG.HEADER_ROW + 1;
  var lastRow = sheet.getLastRow();

  if (lastRow < firstDataRow) {
    throw apiError_("ID_NOT_FOUND", "Item ID not found: " + id);
  }

  var rowValues = sheet
    .getRange(firstDataRow, idColumn, lastRow - CONFIG.HEADER_ROW, 1)
    .getDisplayValues();
  var matches = [];

  rowValues.forEach(function(row, index) {
    var sheetId = getCellText_(row[0]).trim();
    if (sheetId && sheetId === id) {
      matches.push(firstDataRow + index);
    }
  });

  if (matches.length === 0) {
    throw apiError_("ID_NOT_FOUND", "Item ID not found: " + id);
  }

  if (matches.length > 1) {
    throw apiError_("DUPLICATE_ID", "Duplicate item ID found: " + id);
  }

  return {
    rowNumber: matches[0]
  };
}

/**
 * Writes checked_time on every successful check and location only when a
 * non-blank location was supplied.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet Target worksheet.
 * @param {number} rowNumber Matching row number.
 * @param {Object} columnMap Required column indexes.
 * @param {string} checkedTime Server-generated timestamp.
 * @param {string} location Normalized request location.
 */
function writeInventoryCheck_(
  sheet,
  rowNumber,
  columnMap,
  checkedTime,
  location
) {
  try {
    sheet.getRange(rowNumber, columnMap.checkedTime).setValue(checkedTime);
    if (location) {
      sheet.getRange(rowNumber, columnMap.location).setValue(location);
    }
    SpreadsheetApp.flush();
  } catch (error) {
    Logger.log(error && error.stack ? error.stack : error);
    throw apiError_("WRITE_FAILED", "Unable to write the inventory check.");
  }
}

/**
 * Uses the spreadsheet timezone, with the documented Asia/Taipei fallback.
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet Bound sheet.
 * @return {string} IANA timezone.
 */
function getSpreadsheetTimeZone_(spreadsheet) {
  return spreadsheet.getSpreadsheetTimeZone() || CONFIG.TIMEZONE;
}

/**
 * Formats the server-side timestamp required by the API contract.
 *
 * @param {Date} date Current Apps Script server time.
 * @param {string} timezone Spreadsheet timezone.
 * @return {string} Timestamp in yyyyMMdd-HHmmss format.
 */
function formatCheckedTime_(date, timezone) {
  return Utilities.formatDate(
    date,
    timezone,
    CONFIG.CHECKED_TIME_FORMAT
  );
}

/**
 * Converts a cell value to display text without turning null into "null".
 *
 * @param {*} value Cell value.
 * @return {string} Cell text.
 */
function getCellText_(value) {
  return value === null || value === undefined ? "" : String(value);
}

/**
 * Creates an internal API error that can be converted to the public response.
 *
 * @param {string} code Stable API error code.
 * @param {string} message English API message.
 * @return {Error} Error with an API code.
 */
function apiError_(code, message) {
  var error = new Error(message);
  error.code = code;
  return error;
}

/**
 * Converts all expected and unexpected failures to the documented JSON shape.
 *
 * @param {Error} error Raised error.
 * @param {Object} request Partially normalized request.
 * @return {Object} Failure response.
 */
function buildErrorResponse_(error, request) {
  var isApiError = Boolean(error && error.code);
  var response = {
    success: false,
    error: isApiError ? error.code : "WRITE_FAILED",
    message: isApiError
      ? error.message
      : "Unable to write the inventory check."
  };

  if (request && request.id !== undefined) {
    response.id = request.id;
  }

  if (!isApiError) {
    Logger.log(error && error.stack ? error.stack : error);
  }

  return response;
}

/**
 * Serializes a response for the Apps Script Web App.
 *
 * @param {Object} body Response body.
 * @return {ContentService.TextOutput} JSON output.
 */
function jsonResponse_(body) {
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
