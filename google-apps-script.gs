/**
 * Nalanda Vidya Niketan — Admissions 2026 Enquiry Form
 * Google Apps Script — receives POSTs from the landing page and logs
 * every enquiry (including UTM tracking data) into this spreadsheet.
 *
 * SETUP: see README.md → "Google Sheet setup" for step-by-step instructions.
 */

const SHEET_NAME = "Enquiries";

// Column order — must match the order values are appended below.
const HEADERS = [
  "Timestamp",
  "Student Name",
  "Parent Mobile",
  "Email",
  "Class Applying",
  "Stream Interested",
  "City",
  "Page URL",
  "Referrer",
  "UTM Source",
  "UTM Medium",
  "UTM Campaign",
  "UTM Term",
  "UTM Content",
];

function doPost(e) {
  try {
    const sheet = getOrCreateSheet();
    const p = (e && e.parameter) || {};

    sheet.appendRow([
      new Date(),
      p.studentName || "",
      p.parentPhone || "",
      p.email || "",
      p.classApplying || "",
      p.stream || "",
      p.city || "",
      p.pageUrl || "",
      p.referrer || "",
      p.utm_source || "",
      p.utm_medium || "",
      p.utm_campaign || "",
      p.utm_term || "",
      p.utm_content || "",
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Lets you open the Web App URL directly in a browser to confirm it's live.
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "Nalanda enquiry endpoint is live" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}
