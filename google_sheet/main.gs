/**
 * Mobile Inventory Scanner - Bound Apps Script Web App
 *
 * This script must be bound to the Google Sheet that contains the inventory
 * data. Deploy it as a Web app and use the /exec URL in scan.
 */

var CONFIG = {
  HEADER_ROW: 1,
  TIMEZONE: "Asia/Taipei",
  CHECKED_TIME_FORMAT: "yyyyMMdd-HHmmss",
  LOCK_TIMEOUT_MS: 20000,
  COLUMNS: {
    ID: "id",
    NAME: "name",
    CHECKED_TIME: "checked_time",
    LOCATION: "location"
  }
};

/**
 * Receives one inventory check request, or a batch of IDs.
 *
 * Expected body:
 * {
 *   "ids": ["A01", "A02"],
 *   "location": "主機房 A 區"
 * }
 *
 * A single `id` is still accepted for compatibility.
 *
 * @param {Object} event Apps Script web-app event.
 * @return {ContentService.TextOutput} JSON response.
 */
function doPost(event) {
  try {
    var payload = parseRequestBody_(event);
    var location = normalizeLocation_(payload.location);
    var entries = collectRequestIds_(payload);
    return jsonResponse_(processInventoryChecks_(entries, location));
  } catch (error) {
    return jsonResponse_(buildErrorResponse_(error, {}));
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
 * Collects IDs from either `ids` or a single `id`. Invalid values are kept as
 * per-item failures so a batch can still write the valid IDs.
 *
 * @param {Object} payload Parsed request body.
 * @return {Object[]} Request entries with `id` and optional `error`.
 */
function collectRequestIds_(payload) {
  var rawIds;
  if (Array.isArray(payload.ids)) {
    rawIds = payload.ids;
  } else if (payload.id !== undefined && payload.id !== null) {
    rawIds = [payload.id];
  } else {
    throw apiError_(
      "INVALID_REQUEST",
      "Request body must include id or ids."
    );
  }

  if (!rawIds.length) {
    throw apiError_("INVALID_ID", "At least one item ID is required.");
  }

  var seen = {};
  var entries = [];

  rawIds.forEach(function(value) {
    var displayedId = typeof value === "string" || typeof value === "number"
      ? String(value).trim()
      : "";

    try {
      var id = normalizeId_(value);
      if (seen[id]) {
        return;
      }
      seen[id] = true;
      entries.push({ id: id });
    } catch (error) {
      entries.push({
        id: displayedId,
        error: error && error.code
          ? error
          : apiError_("INVALID_ID", "Item ID must be a non-empty string.")
      });
    }
  });

  return entries;
}

/**
 * Looks up requested IDs and writes all valid inventory results in one lock.
 *
 * @param {Object[]} entries Normalized request entries.
 * @param {string} location Normalized location for the whole batch.
 * @return {Object} Success response with per-item results.
 */
function processInventoryChecks_(entries, location) {
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
    var idRows = buildIdRowMap_(sheet, columnMap);
    var checkedTime = formatCheckedTime_(
      new Date(),
      getSpreadsheetTimeZone_(spreadsheet)
    );
    var rowNumbers = [];
    var items = [];
    var results = [];

    entries.forEach(function(entry) {
      if (entry.error) {
        results.push(buildItemFailure_(entry.id, entry.error));
        return;
      }

      var matches = idRows[entry.id] || [];
      if (matches.length === 0) {
        results.push(buildItemFailure_(
          entry.id,
          apiError_("ID_NOT_FOUND", "Item ID not found: " + entry.id)
        ));
        return;
      }

      if (matches.length > 1) {
        results.push(buildItemFailure_(
          entry.id,
          apiError_("DUPLICATE_ID", "Duplicate item ID found: " + entry.id)
        ));
        return;
      }

      var match = matches[0];
      var nextLocation = location || match.location;
      var item = {
        id: entry.id,
        name: match.name,
        checked_time: checkedTime,
        location: nextLocation
      };

      rowNumbers.push(match.rowNumber);
      items.push(item);
      results.push({
        success: true,
        item: item
      });
    });

    writeInventoryChecks_(
      sheet,
      columnMap,
      rowNumbers,
      checkedTime,
      location
    );

    var response = {
      success: true,
      items: items,
      results: results,
      message: items.length === 1
        ? "Inventory check succeeded"
        : "Inventory check completed"
    };
    if (items.length === 1) {
      response.item = items[0];
    }
    return response;
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
 * Builds a per-item failure object from an API error.
 *
 * @param {string} id Requested ID, if known.
 * @param {Error} error API error with a code.
 * @return {Object} Failure result.
 */
function buildItemFailure_(id, error) {
  var result = {
    success: false,
    error: error && error.code ? error.code : "WRITE_FAILED",
    message: error && error.message
      ? error.message
      : "Unable to write the inventory check."
  };
  if (id) {
    result.id = id;
  }
  return result;
}

/**
 * Indexes non-empty IDs to their sheet rows in one pass.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet Target worksheet.
 * @param {Object} columnMap Required column indexes.
 * @return {Object} Map of ID to matching row metadata arrays.
 */
function buildIdRowMap_(sheet, columnMap) {
  var firstDataRow = CONFIG.HEADER_ROW + 1;
  var lastRow = sheet.getLastRow();
  var idRows = {};

  if (lastRow < firstDataRow) {
    return idRows;
  }

  var lastColumn = sheet.getLastColumn();
  var rows = sheet
    .getRange(firstDataRow, 1, lastRow - CONFIG.HEADER_ROW, lastColumn)
    .getDisplayValues();

  rows.forEach(function(row, index) {
    var id = getCellText_(row[columnMap.id - 1]).trim();
    if (!id) {
      return;
    }

    if (!idRows[id]) {
      idRows[id] = [];
    }

    idRows[id].push({
      rowNumber: firstDataRow + index,
      name: columnMap.name
        ? getCellText_(row[columnMap.name - 1]).trim()
        : "",
      location: getCellText_(row[columnMap.location - 1]).trim()
    });
  });

  return idRows;
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
 * Gets the first worksheet from the bound spreadsheet.
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

  var sheets = spreadsheet.getSheets();
  var sheet = sheets.length > 0 ? sheets[0] : null;
  if (!sheet) {
    throw apiError_(
      "SHEET_NOT_FOUND",
      "The bound spreadsheet does not contain a worksheet."
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
  var optionalHeaders = [CONFIG.COLUMNS.NAME];
  var knownHeaders = requiredHeaders.concat(optionalHeaders);
  var columnMap = {};

  headers.forEach(function(header, index) {
    var normalizedHeader = getCellText_(header);
    if (knownHeaders.indexOf(normalizedHeader) === -1) {
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
 * Writes checked_time for every successful row, and location when a
 * non-blank location was supplied. One flush is used for the whole batch.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet Target worksheet.
 * @param {Object} columnMap Required column indexes.
 * @param {number[]} rowNumbers Matching row numbers to update.
 * @param {string} checkedTime Server-generated timestamp.
 * @param {string} location Normalized request location.
 */
function writeInventoryChecks_(
  sheet,
  columnMap,
  rowNumbers,
  checkedTime,
  location
) {
  if (!rowNumbers.length) {
    return;
  }

  try {
    var timeRanges = [];
    var locationRanges = [];

    rowNumbers.forEach(function(rowNumber) {
      timeRanges.push(
        sheet.getRange(rowNumber, columnMap.checkedTime).getA1Notation()
      );
      if (location) {
        locationRanges.push(
          sheet.getRange(rowNumber, columnMap.location).getA1Notation()
        );
      }
    });

    sheet.getRangeList(timeRanges).setValue(checkedTime);
    if (locationRanges.length) {
      sheet.getRangeList(locationRanges).setValue(location);
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
