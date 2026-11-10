/**
 * ==============================================================================
 * Order Up! — Café Talk: Google Sheets Tracking Script (Google Apps Script)
 * ==============================================================================
 * 
 * Target Columns in Google Sheet:
 * 1. timestamp : Record submission date and time (e.g. 2026-10-27 17:45:00)
 * 2. sentence1 : Number of practice taps for Sentence 1 ("Can I have a hot chocolate, please?")
 * 3. sentence2 : Number of practice taps for Sentence 2 ("A small one, please.")
 * 4. sentence3 : Number of practice taps for Sentence 3 ("To go, please.")
 * 5. sentence4 : Number of practice taps for Sentence 4 ("No, thank you.")
 * 6. sentence5 : Number of practice taps for Sentence 5 ("Here you are.")
 * 7. avg       : Average practice taps across all 5 sentences
 *
 * Setup Instructions:
 * 1. Open your Google Sheet (e.g., https://sheets.new).
 * 2. In the top menu, go to [Extensions] > [Apps Script] (확장 프로그램 > Apps Script).
 * 3. Delete any default code in Code.gs, paste this entire file, and click Save (💾).
 * 4. Click [Deploy] (배포) > [New deployment] (새 배포).
 * 5. Select type: [Web app] (웹 앱).
 * 6. Settings:
 *    - Description: "Cafe Talk Practice Logger"
 *    - Execute as: "Me" (나)
 *    - Who has access: "Anyone" (모든 사용자)  <-- CRITICAL!
 * 7. Click [Deploy], authorize permissions, and copy the "Web app URL" (Ends with /exec).
 * 8. Paste the Web app URL into the Café Talk app Settings / Result Screen.
 * ==============================================================================
 */

function setupHeaders(sheet) {
  var headers = [
    "timestamp",
    "sentence1",
    "sentence2",
    "sentence3",
    "sentence4",
    "sentence5",
    "avg"
  ];
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    // Format header row
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#FFF3E0");
    headerRange.setFontColor("#E65100");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Wait for up to 30 seconds for other operations to finish
    lock.waitLock(30000);

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    setupHeaders(sheet);

    var payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    // Format timestamp nicely if not provided or in ISO format
    var timestamp = payload.timestamp;
    if (!timestamp) {
      timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    }

    var sentence1 = Number(payload.sentence1 || 0);
    var sentence2 = Number(payload.sentence2 || 0);
    var sentence3 = Number(payload.sentence3 || 0);
    var sentence4 = Number(payload.sentence4 || 0);
    var sentence5 = Number(payload.sentence5 || 0);

    // Calculate or use provided average
    var avg = payload.avg !== undefined ? Number(payload.avg) : Number(((sentence1 + sentence2 + sentence3 + sentence4 + sentence5) / 5).toFixed(2));

    var newRow = [
      timestamp,
      sentence1,
      sentence2,
      sentence3,
      sentence4,
      sentence5,
      avg
    ];

    sheet.appendRow(newRow);

    // Format new row cells
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1).setHorizontalAlignment("center"); // timestamp
    sheet.getRange(lastRow, 2, 1, 6).setHorizontalAlignment("right"); // numbers

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Row saved successfully",
      data: {
        timestamp: timestamp,
        sentence1: sentence1,
        sentence2: sentence2,
        sentence3: sentence3,
        sentence4: sentence4,
        sentence5: sentence5,
        avg: avg
      }
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  // Test endpoint to verify Web App is functioning
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  setupHeaders(sheet);
  
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    app: "Order Up! — Café Talk",
    sheetName: sheet.getName(),
    totalRows: sheet.getLastRow()
  })).setMimeType(ContentService.MimeType.JSON);
}
