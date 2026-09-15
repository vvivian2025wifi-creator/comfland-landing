/**
 * Comfland email signup endpoint.
 * Deploy this script as a Google Apps Script Web App.
 */

// The Comfland response spreadsheet is fixed explicitly so the Web App
// always writes to this sheet, even if the script is not container-bound.
const GOOGLE_SHEET_ID = "1g4P0xq0jSnsvs-zfubOXa7B8BVaq4-prCmzd9OYHzW0";
const SHEET_NAME = "Emails";
const HEADERS = [
  "Timestamp",
  "Visit ID",
  "Email",
  "Group",
  "Time On Page (s)",
  "Device",
  "Region",
  "Language",
  "Source"
];

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const email = String(payload.email || "").trim().toLowerCase();

    if (email && !isValidEmail_(email)) {
      return jsonResponse_({ success: false, error: "INVALID_EMAIL" });
    }

    upsertVisit_({
      visitId: clean_(payload.visitId, ""),
      email: email,
      group: clean_(payload.group, "direct"),
      timeOnPage: toNumber_(payload.timeOnPage),
      deviceType: clean_(payload.deviceType, "unknown"),
      region: clean_(payload.region, "unknown"),
      language: clean_(payload.language, "unknown"),
      source: clean_(payload.source, "page_view")
    });

    return jsonResponse_({ success: true });
  } catch (error) {
    return jsonResponse_({ success: false, error: "SERVER_ERROR" });
  }
}

function doGet() {
  return jsonResponse_({
    success: true,
    message: "Comfland signup endpoint is running."
  });
}

// Creates the Emails sheet and header row when they do not exist yet.
function setupSheet() {
  const sheet = getSheet_();
  Logger.log("Ready. Sheet: " + sheet.getName());
}

function getSheet_() {
  if (!GOOGLE_SHEET_ID || GOOGLE_SHEET_ID === "YOUR_GOOGLE_SHEET_ID") {
    throw new Error("GOOGLE_SHEET_ID is not configured.");
  }

  const spreadsheet = SpreadsheetApp.openById(GOOGLE_SHEET_ID);

  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.setFrozenRows(1);
  }
  ensureHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  const current = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (current.join("|") !== HEADERS.join("|")) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}

function upsertVisit_(data) {
  const sheet = getSheet_();

  if (data.visitId) {
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][1]) === data.visitId) {
        const rowNumber = i + 1;
        const existingEmail = String(values[i][2] || "");
        const existingTime = toNumber_(values[i][4]);
        const nextEmail = data.email || existingEmail;
        const nextTime = Math.max(existingTime, data.timeOnPage);

        sheet.getRange(rowNumber, 3, 1, 7).setValues([
          [
            nextEmail,
            data.group,
            nextTime,
            data.deviceType,
            data.region,
            data.language,
            data.source
          ]
        ]);
        return;
      }
    }
  }

  sheet.appendRow([
    new Date(),
    data.visitId,
    data.email,
    data.group,
    data.timeOnPage,
    data.deviceType,
    data.region,
    data.language,
    data.source
  ]);
}

function parsePayload_(e) {
  const raw =
    e.postData && e.postData.contents ? e.postData.contents : "";

  try {
    return JSON.parse(raw);
  } catch (error) {
    const params = {};
    raw.split("&").forEach((pair) => {
      if (!pair) return;
      const separator = pair.indexOf("=");
      const key = pair.slice(0, separator);
      const value = pair.slice(separator + 1);
      params[decodeURIComponent(key)] = decodeURIComponent(value || "");
    });
    return params;
  }
}

function clean_(value, fallback) {
  const text = String(value || "").trim();
  return text ? text.slice(0, 500) : fallback;
}

function toNumber_(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
}

function isValidEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
