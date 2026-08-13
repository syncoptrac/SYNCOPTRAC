/**
 * ============================================================
 * COACHING CENTRE MANAGEMENT SYSTEM - Google Apps Script
 * ============================================================
 * Deploy as Web App:
 *   - Execute as: Me
 *   - Who has access: Anyone
 * ============================================================
 */

const SHEETS = {
  STUDENTS:   'Students',
  ATTENDANCE: 'Attendance',
  FEES:       'Fees',
  ENQUIRIES:  'Enquiries',
  BATCHES:    'Batches',
  SCHEDULE:   'Schedule'
};

// ─── EMAIL TEMPLATES ──────────────────────────────────────────
const EMAIL_TEMPLATES = {

  absentee: (studentName, date, instituteName) => ({
    subject: `Attendance Update – ${studentName}`,
    body: `Dear Parent/Guardian,
<br><br>
We noticed that <strong>${studentName}</strong> was absent from the class on <strong>${date}</strong>.
<br><br>
We hope everything is fine. Regular attendance is important to maintain learning continuity, so we kindly request you to ensure consistent participation.
<br><br>
If there is any issue or concern, please feel free to inform us.
<br><br>
Looking forward to seeing <strong>${studentName}</strong> in the next class.
<br><br>
Best regards,<br>
<strong>${instituteName}</strong>`
  }),

  feeReminder: (studentName, dueDate, instituteName) => ({
    subject: `Pending Fee Reminder – ${studentName}`,
    body: `Dear Parent/Guardian,
<br><br>
We would like to inform you that the fee for <strong>${studentName}</strong> is currently pending.
<br><br>
We kindly request you to clear the dues at the earliest to ensure continued access to classes.
<br><br>
If you are facing any issues regarding the payment, please feel free to reach out.
<br><br>
Thank you for your attention.
<br><br>
Best regards,<br>
<strong>${instituteName}</strong>`
  }),

  enquiryResponse: (name, course, instituteName) => ({
    subject: `Thank you for your enquiry – ${instituteName}`,
    body: `Dear ${name},
<br><br>
Thank you for your interest in <strong>${instituteName}</strong>.
<br><br>
We have received your enquiry about the <strong>${course}</strong> course and our team will contact you shortly with details on admissions, batch timings, and fee structure.
<br><br>
If you have any immediate questions, please feel free to call us.
<br><br>
Best regards,<br>
<strong>${instituteName}</strong>`
  }),

  followUp: (name, course, instituteName) => ({
    subject: `Following up on your enquiry – ${instituteName}`,
    body: `Dear ${name},
<br><br>
We hope you are doing well! We wanted to follow up on your recent enquiry about the <strong>${course}</strong> course at <strong>${instituteName}</strong>.
<br><br>
We would love to assist you in taking the next step. If you have any questions about the course curriculum, batch timings, fee structure, or anything else, please feel free to reach out to us.
<br><br>
We look forward to hearing from you soon.
<br><br>
Best regards,<br>
<strong>${instituteName}</strong>`
  })

};

// ─── MAIN HANDLERS ────────────────────────────────────────────
function doGet(e) {
  const params = e.parameter;

  // Liveness probe. Open <your /exec URL>?action=ping in a browser:
  //   JSON back -> the deployment is correct, any failure is data-side.
  //   HTML back -> the deployment itself is wrong (access, or never deployed).
  // Reads no sheet and is never cached, so it is always the honest answer.
  if (params.action === 'ping') {
    return jsonResponse({ success: true, pong: true, time: new Date().toISOString() });
  }

  try {
    // PERF: identical read requests inside READ_CACHE_TTL are answered from
    // CacheService (~10ms) instead of re-reading the spreadsheet (~1-3s).
    // Any write bumps the version counter, so this can never serve stale data
    // after a save.
    const cacheKey = [
      params.action || '',
      params.cycle || '',
      params.date || '',
      params.studentId || ''
    ].join('|');
    return jsonResponse(cachedRead_(cacheKey, function () {
      return computeGet_(params);
    }));
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function computeGet_(params) {
    let result;
    switch (params.action) {
      case 'getStudents':         result = getStudents(); break;
      case 'getBundle':           result = getBundle(params.cycle, params.date); break;
      case 'getAttendance':       result = getAttendance(params.date, params.studentId); break;
      case 'getFees':             result = getFees(params.cycle); break;
      case 'getEnquiries':        result = getEnquiries(); break;
      case 'getDashboardSummary': result = getDashboardSummary(params.cycle); break;
      case 'getBatches':         result = getBatches(); break;
      case 'getSchedule':         result = getSchedule(); break;
      default: result = { error: 'Unknown action' };
    }
    return result;
}

function doPost(e) {
  // Writes are serialised. Several of them (row rewrites, identity
  // propagation) read the sheet, compute, then write it back; two overlapping
  // saves could otherwise clobber each other's rows. tryLock never fails the
  // request - if the lock cannot be taken we still proceed, exactly as before.
  var lock = null;
  // 8s, NOT 20s: the backend aborts the request at 20s, so a 20s lock wait
  // could burn the whole budget and return nothing at all. Waiting less
  // guarantees there is still time to do the work and answer with JSON.
  try { lock = LockService.getScriptLock(); lock.tryLock(8000); } catch (lockErr) { lock = null; }
  try {
    const body = JSON.parse(e.postData.contents);
    let result;
    switch (body.action) {
      case 'addStudent':     result = addStudent(body); break;
      case 'updateStudent':  result = updateStudent(body); break;
      case 'deleteStudent':  result = deleteStudent(body.studentId); break;
      case 'markAttendance': result = markAttendance(body); break;
      case 'updateFees':     result = updateFees(body); break;
      case 'addEnquiry':     result = addEnquiry(body); break;
      case 'updateEnquiry':  result = updateEnquiry(body); break;
      case 'sendEmail':      result = sendEmail(body); break;
      case 'addBatch':       result = addBatch(body); break;
      case 'updateBatch':    result = updateBatch(body); break;
      case 'deleteBatch':    result = deleteBatch(body.batchId); break;
      case 'assignStudents': result = assignStudents(body); break;
      case 'addSlot':        result = addSlot(body); break;
      case 'updateSlot':     result = updateSlot(body); break;
      case 'deleteSlot':     result = deleteSlot(body.slotId); break;
      default: result = { error: 'Unknown action' };
    }
    // One bump invalidates every cached read, so the next page load sees the
    // change immediately.
    if (result && !result.error && result.success !== false) bumpDataVersion_();
    return jsonResponse(result);
  } catch (err) {
    // Always JSON, never an HTML error page - this is the response contract
    // the backend validates against.
    return jsonResponse({ success: false, error: String(err && err.message ? err.message : err) });
  } finally {
    if (lock) { try { lock.releaseLock(); } catch (relErr) {} }
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── DATE HELPER ──────────────────────────────────────────────
// Always store and compare dates as YYYY-MM-DD (ISO).
// Fixes the mismatch: frontend sends 2026-05-25,
// old code stored 25/5/2026 via toLocaleDateString('en-IN').
// FIX: Apps Script runs in UTC. IST = UTC+5:30, so midnight IST = 18:30 UTC
// the PREVIOUS day. Using getDate() returned the wrong calendar date.
// Utilities.formatDate() with 'Asia/Kolkata' resolves the correct IST date.
function toISO(dateVal) {
  if (!dateVal) return '';
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) return dateVal;
  var d = (dateVal instanceof Date) ? dateVal : new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  return Utilities.formatDate(d, 'Asia/Kolkata', 'yyyy-MM-dd');
}

// Returns today's date as YYYY-MM-DD in IST (not UTC).
function todayISO() {
  return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd');
}

// ─── FEE COLLECTION CYCLE HELPERS ──────────────────────────────
// The institute's Fee Collection Cycle (set in Institute Settings, stored in
// MongoDB) is forwarded by the backend as `cycle` on every fee-related call.
// These helpers turn that cycle into month-interval math and human-readable
// period labels, so due dates / periods / status stay in sync automatically.

// How many months make up one billing cycle.
function cycleMonths(cycle) {
  switch (String(cycle || 'monthly').toLowerCase()) {
    case 'quarterly':    return 3;
    case 'half-yearly':  return 6;
    case 'yearly':       return 12;
    default:              return 1; // monthly
  }
}

// Adds `months` calendar months to a YYYY-MM-DD string, clamping the day to
// the last day of the resulting month (e.g. 31 Jan + 1 month -> 28/29 Feb).
// Pure calendar math — no timezone conversion, so it can't drift by a day.
function addMonthsISO(dateStr, months) {
  var p = String(dateStr).split('-').map(Number);
  var y = p[0], mIndex = (p[1] - 1) + months, d = p[2];
  var newY = y + Math.floor(mIndex / 12);
  var newM = ((mIndex % 12) + 12) % 12; // 0-11
  var lastDayOfMonth = new Date(newY, newM + 1, 0).getDate();
  var newD = Math.min(d, lastDayOfMonth);
  return newY + '-' + String(newM + 1).padStart(2, '0') + '-' + String(newD).padStart(2, '0');
}

// Human-readable collection period for a student's OWN cycle window — not a
// fixed calendar month/quarter. Each student's cycle starts on their last
// successful payment date (or enrollment date, before any payment) and runs
// to their due date, e.g. "15 Feb 2026 – 15 May 2026". This is what makes
// every student's cycle genuinely independent instead of forcing everyone
// into shared calendar buckets like "Q1 2026".
function fmtShortDate(dateStr, withYear) {
  if (!dateStr) return '';
  var p = String(dateStr).split('-').map(Number);
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return p[2] + ' ' + MONTHS[p[1] - 1] + (withYear ? ' ' + p[0] : '');
}

function periodLabel(startDateStr, dueDateStr) {
  if (!dueDateStr) return '';
  if (!startDateStr) return fmtShortDate(dueDateStr, true);
  var startYear = String(startDateStr).split('-')[0];
  var dueYear = String(dueDateStr).split('-')[0];
  var sameYear = startYear === dueYear;
  return fmtShortDate(startDateStr, !sameYear) + ' \u2013 ' + fmtShortDate(dueDateStr, true);
}

// ─── SHEET HELPERS ────────────────────────────────────────────
// ─── PERFORMANCE LAYER ─────────────────────────────────────────
// Every SpreadsheetApp call is a remote round trip (roughly 50-300ms each).
// The original code paid that cost once PER CELL on updates and once PER ROW
// on bulk operations, which is why saving attendance for a class could take
// tens of seconds. These helpers collapse each operation into a single read
// and a single write, and cache read results between requests so repeat page
// loads don't touch the spreadsheet at all.

var __ssMemo = null;
var __sheetMemo = {};
var __dataMemo = {};

function ss_() {
  if (!__ssMemo) __ssMemo = SpreadsheetApp.getActiveSpreadsheet();
  return __ssMemo;
}

// One getValues() per sheet per execution, reused by every helper below.
function sheetData_(sheet) {
  var key = sheet.getSheetId();
  if (!__dataMemo[key]) __dataMemo[key] = sheet.getDataRange().getValues();
  return __dataMemo[key];
}

function invalidateSheetData_(sheet) {
  delete __dataMemo[sheet.getSheetId()];
}

// ── Cross-request read cache ─────────────────────────────────────
// CacheService reads take ~5-15ms versus 1-3s for a full spreadsheet read.
var READ_CACHE_TTL = 90; // seconds
var CACHE_VERSION_KEY = 'dataVersion';

function cache_() {
  return CacheService.getScriptCache();
}

// A single version counter is bumped on every write and forms part of every
// read key, so one bump invalidates all cached reads at once. (CacheService
// cannot enumerate or wildcard-delete keys, so this is the reliable way.)
function dataVersion_() {
  var c = cache_();
  var v = c.get(CACHE_VERSION_KEY);
  if (!v) {
    v = '1';
    c.put(CACHE_VERSION_KEY, v, 21600);
  }
  return v;
}

function bumpDataVersion_() {
  var c = cache_();
  var next = String((parseInt(c.get(CACHE_VERSION_KEY), 10) || 1) + 1);
  c.put(CACHE_VERSION_KEY, next, 21600);
}

function cachedRead_(key, producer) {
  var c = cache_();
  var full = 'v' + dataVersion_() + ':' + key;
  var hit = c.get(full);
  if (hit) {
    try {
      return JSON.parse(hit);
    } catch (e) {
      // Corrupt entry - fall through and recompute.
    }
  }
  var fresh = producer();
  // Never cache failures, or an error would stick around for the whole TTL.
  if (fresh && !fresh.error && fresh.success !== false) {
    try {
      var payload = JSON.stringify(fresh);
      // CacheService rejects values above ~100KB; very large sheets simply
      // skip the cache instead of throwing.
      if (payload.length < 100000) c.put(full, payload, READ_CACHE_TTL);
    } catch (e) {
      // Value not serialisable/cacheable - ignore, correctness is unaffected.
    }
  }
  return fresh;
}

// ── Batched writers ──────────────────────────────────────────────
// Replaces the old "headers.forEach(... setValue ...)" pattern, which issued
// one round trip per column. This issues exactly one for the whole row.
function writeRowUpdates_(sheet, rowIndex, updates) {
  var data = sheetData_(sheet);
  var headers = data[0];
  var row = (data[rowIndex - 1] || []).slice();
  while (row.length < headers.length) row.push('');
  var changed = false;
  for (var i = 0; i < headers.length; i++) {
    if (updates[headers[i]] !== undefined) {
      row[i] = updates[headers[i]];
      changed = true;
    }
  }
  if (!changed) return false;
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([row]);
  invalidateSheetData_(sheet);
  bumpDataVersion_();
  return true;
}

// Removing N scattered rows used to mean N deleteRow() calls. Instead the
// surviving rows are written back in one setValues and any leftover rows at
// the bottom are removed with a single deleteRows call.
function rewriteRows_(sheet, keptRows) {
  var width = sheetData_(sheet)[0].length;
  var lastRow = sheet.getLastRow();
  var normalised = keptRows.map(function (r) {
    var row = r.slice(0, width);
    while (row.length < width) row.push('');
    return row;
  });
  if (normalised.length) {
    sheet.getRange(2, 1, normalised.length, width).setValues(normalised);
  }
  var surplus = lastRow - 1 - normalised.length;
  if (surplus > 0) sheet.deleteRows(normalised.length + 2, surplus);
  invalidateSheetData_(sheet);
  bumpDataVersion_();
}

function getSheet(name) {
  // PERF: memoised so repeated getSheet() calls in one request don't re-open
  // the spreadsheet or re-run the Fees self-heal check.
  if (__sheetMemo[name]) return __sheetMemo[name];
  const ss = ss_();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = createSheet(name);
  // Self-heal: institutes that already have a Fees sheet from before the
  // Fee Collection Cycle feature won't have the 'Period'/'CycleStart'
  // columns yet. Add them automatically instead of requiring anyone to
  // manually edit the sheet.
  if (name === SHEETS.FEES) ensureFeesCycleColumns(sheet);
  __sheetMemo[name] = sheet;
  return sheet;
}

function ensureFeesCycleColumns(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) return; // brand new sheet, headers not written yet
  let headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  ['Period', 'CycleStart'].forEach((col) => {
    if (headers.indexOf(col) === -1) {
      const newCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, newCol).setValue(col)
        .setFontWeight('bold').setBackground('#1a73e8').setFontColor('#ffffff');
      headers = sheet.getRange(1, 1, 1, newCol).getValues()[0];
    }
  });
}

function createSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.insertSheet(name);
  const headers = {
    Students:   ['StudentID', 'StudentName', 'Phone', 'ParentContact', 'Course', 'JoiningDate', 'Email', 'Address'],
    Attendance: ['AttendanceID', 'StudentID', 'StudentName', 'Date', 'Status'],
    Fees:       ['StudentID', 'StudentName', 'Course', 'TotalFee', 'PaidAmount', 'PendingAmount', 'DueDate', 'LastPaymentDate', 'Status', 'Period', 'CycleStart'],
    Enquiries:  ['EnquiryID', 'Name', 'Phone', 'Email', 'Course', 'Status', 'Notes', 'CreatedAt', 'FollowUpDate'],
    Batches:    ['BatchID', 'BatchName', 'Course', 'Teacher', 'Description', 'Students'],
    Schedule:   ['SlotID', 'BatchID', 'Day', 'StartTime', 'EndTime', 'Subject']
  };
  if (headers[name]) {
    sheet.getRange(1, 1, 1, headers[name].length).setValues([headers[name]])
      .setFontWeight('bold').setBackground('#1a73e8').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Simple numeric auto-increment ID: 1, 2, 3...
function nextStudentId() {
  const sheet = getSheet(SHEETS.STUDENTS);
  const data = sheetData_(sheet);
  if (data.length < 2) return 1;
  let max = 0;
  for (let i = 1; i < data.length; i++) {
    const val = parseInt(data[i][0]);
    if (!isNaN(val) && val > max) max = val;
  }
  return max + 1;
}

function generateId(prefix) {
  return prefix + Date.now().toString().slice(-7) + Math.floor(Math.random() * 10);
}

// DATE COLUMNS: Google Sheets getValues() returns Date objects for date cells.
// These serialize to ISO strings like '2026-05-30T18:30:00.000Z' (IST midnight
// expressed as UTC), which makes the frontend display one day behind.
// We convert all Date objects to clean YYYY-MM-DD strings in IST right here,
// so the frontend always receives a plain date string and never has to guess.
var DATE_COLS = ['Date','JoiningDate','DueDate','LastPaymentDate','CreatedAt','FollowUpDate','CycleStart'];

function sheetToObjects(sheet) {
  var data = sheetData_(sheet);
  if (data.length < 2) return [];
  var headers = data[0];
  var out = [];
  for (var r = 1; r < data.length; r++) {
    var row = data[r];

    // ROOT-CAUSE FIX (student count): getDataRange() extends to the last row
    // that has EVER held content, so a row whose cells were cleared instead of
    // deleted still sits inside the range. Those rows used to be returned as
    // real objects, silently inflating every count and list in the app.
    // A row with no values at all is not a record.
    var blank = true;
    for (var c = 0; c < headers.length; c++) {
      var cell = row[c];
      if (cell !== '' && cell !== null && cell !== undefined) { blank = false; break; }
    }
    if (blank) continue;

    var obj = {};
    headers.forEach(function(h, i) {
      var val = row[i];
      // Convert any Date object in a known date column to YYYY-MM-DD (IST)
      if (val instanceof Date && !isNaN(val.getTime()) && DATE_COLS.indexOf(h) !== -1) {
        val = Utilities.formatDate(val, 'Asia/Kolkata', 'yyyy-MM-dd');
      }
      obj[h] = val;
    });
    out.push(obj);
  }
  return out;
}

function findRowByField(sheet, fieldName, value) {
  const data = sheetData_(sheet);
  const headers = data[0];
  const colIndex = headers.indexOf(fieldName);
  if (colIndex === -1) return -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][colIndex]) === String(value)) return i + 1;
  }
  return -1;
}

// ─── STUDENTS ─────────────────────────────────────────────────
function getStudents() {
  return { success: true, data: canonicalStudents_() };
}

/**
 * THE single source of truth for "who the students are".
 *
 * Guarantees, so the count can never disagree with the rows again:
 *   - a row without a StudentID is not a student (stray/partial sheet row)
 *   - the same StudentID is never returned twice
 *   - order follows the sheet, so the display serial is stable
 *
 * Nothing is deleted or rewritten here: this is a read-side filter only.
 */
function canonicalStudents_() {
  var rows = sheetToObjects(getSheet(SHEETS.STUDENTS));
  var seen = {};
  var out = [];
  for (var i = 0; i < rows.length; i++) {
    var sid = rows[i].StudentID;
    sid = String(sid === null || sid === undefined ? '' : sid).trim();
    if (!sid) continue;
    if (seen[sid]) continue;
    seen[sid] = true;
    out.push(rows[i]);
  }
  return out;
}

/** StudentID -> current identity. Students sheet always wins. */
function studentIdentityMap_() {
  var map = {};
  var list = canonicalStudents_();
  for (var i = 0; i < list.length; i++) {
    map[String(list[i].StudentID)] = {
      name: list[i].StudentName,
      course: list[i].Course
    };
  }
  return map;
}

function addStudent(body) {
  const sheet = getSheet(SHEETS.STUDENTS);
  const studentId = nextStudentId(); // 1, 2, 3... not STU67660151
  sheet.appendRow([
    studentId,
    body.studentName || '',
    body.phone || '',
    body.parentContact || '',
    body.course || '',
    body.joiningDate || todayISO(),
    body.email || '',
    body.address || ''
  ]);
  addFeeRecord(studentId, body.studentName, body.course, body.totalFee || 0, body.cycle);
  return { success: true, studentId, message: 'Student added successfully' };
}

function updateStudent(body) {
  const sheet = getSheet(SHEETS.STUDENTS);
  const rowIndex = findRowByField(sheet, 'StudentID', body.studentId);
  if (rowIndex === -1) return { success: false, error: 'Student not found' };
  const updates = {
    StudentName: body.studentName, Phone: body.phone,
    ParentContact: body.parentContact, Course: body.course,
    Email: body.email, Address: body.address
  };
  // PERF: one write for the whole row instead of one per column.
  writeRowUpdates_(sheet, rowIndex, updates);

  // ROOT-CAUSE FIX (Students -> Fees desync): the Students sheet is the source
  // of truth for identity, but Fees and Attendance each keep a DENORMALISED
  // copy of StudentName (Fees also copies Course) so their rows read on their
  // own. addStudent() wrote those copies; updateStudent() never refreshed them,
  // so renaming Mira -> Mira Sharma left "Mira" in Fees forever.
  // Only the identity columns are rewritten. No amount, due date, payment
  // date, status, period, cycle or attendance status is touched, so payment
  // history and fee-cycle logic are preserved exactly.
  const synced = propagateStudentIdentity_(body.studentId, body.studentName, body.course);

  return {
    success: true,
    message: 'Student updated',
    student: currentStudent_(body.studentId),
    synced: synced
  };
}

/** The saved row, read back so the client can update state without a refetch. */
function currentStudent_(studentId) {
  var list = canonicalStudents_();
  for (var i = 0; i < list.length; i++) {
    if (String(list[i].StudentID) === String(studentId)) return list[i];
  }
  return null;
}

function propagateStudentIdentity_(studentId, studentName, course) {
  var result = { fees: 0, attendance: 0 };
  try {
    result.fees = updateIdentityColumns_(getSheet(SHEETS.FEES), studentId, {
      StudentName: studentName,
      Course: course
    });
  } catch (err) { result.feesError = String(err && err.message ? err.message : err); }
  try {
    result.attendance = updateIdentityColumns_(getSheet(SHEETS.ATTENDANCE), studentId, {
      StudentName: studentName
    });
  } catch (err) { result.attendanceError = String(err && err.message ? err.message : err); }
  return result;
}

/**
 * Rewrites ONLY the named identity columns, and only for rows belonging to
 * studentId. One setValues() per column (never a full-sheet rewrite), and it
 * bails out entirely when nothing actually differs - so a save that does not
 * change the name costs zero extra writes.
 */
function updateIdentityColumns_(sheet, studentId, values) {
  var data = sheetData_(sheet);
  if (data.length < 2) return 0;
  var headers = data[0];
  var sidCol = headers.indexOf('StudentID');
  if (sidCol === -1) return 0;

  var sid = String(studentId);
  var rowsChanged = 0;
  var wrote = false;

  Object.keys(values).forEach(function (colName) {
    var value = values[colName];
    if (value === undefined || value === null || value === '') return; // nothing to copy
    var col = headers.indexOf(colName);
    if (col === -1) return;

    // PERF ROOT CAUSE (slow updateStudent).
    // This used to rebuild the ENTIRE column and write every row back whenever
    // a single cell changed. Renaming one student therefore rewrote every row of
    // Attendance - the only sheet in the app that grows without limit - so the
    // cost of a rename scaled with total attendance history instead of with the
    // one student. On a large sheet that single setValues call is what pushed
    // updateStudent past the timeout.
    // Only the rows belonging to THIS student are written now, in contiguous
    // blocks, so a rename costs a handful of cells instead of a whole column.
    var runStart = -1;
    var run = [];
    var flush = function () {
      if (runStart === -1) return;
      sheet.getRange(runStart + 1, col + 1, run.length, 1).setValues(run);
      wrote = true;
      runStart = -1;
      run = [];
    };
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][sidCol]) === sid && String(data[i][col]) !== String(value)) {
        if (runStart === -1) runStart = i;   // data row i == sheet row i + 1
        run.push([value]);
        rowsChanged++;
      } else {
        flush();
      }
    }
    flush();
  });

  if (wrote) {
    invalidateSheetData_(sheet);
    bumpDataVersion_();
  }
  return rowsChanged;
}

function deleteStudent(studentId) {
  const sheet = getSheet(SHEETS.STUDENTS);
  const rowIndex = findRowByField(sheet, 'StudentID', studentId);
  if (rowIndex === -1) return { success: false, error: 'Student not found' };
  sheet.deleteRow(rowIndex);

  // Also remove from Fees so deleted students don't ghost in fee records.
  // BUG: findRowByField returns only the FIRST match, but a student holds one
  // fee row PER BILLING CYCLE (see the Period / CycleStart columns). Every
  // later cycle was therefore left behind pointing at a StudentID that no
  // longer exists - precisely the ghosting this block exists to prevent. One
  // rewrite removes them all, and is faster than repeated deleteRow calls.
  const feesSheet = getSheet(SHEETS.FEES);
  const feeData = sheetData_(feesSheet);
  const fSidCol = feeData[0].indexOf('StudentID');
  if (fSidCol !== -1) {
    const keptFees = [];
    for (let i = 1; i < feeData.length; i++) {
      if (String(feeData[i][fSidCol]) !== String(studentId)) keptFees.push(feeData[i]);
    }
    if (keptFees.length !== feeData.length - 1) rewriteRows_(feesSheet, keptFees);
  }

  // Also remove attendance records for this student
  const attendanceSheet = getSheet(SHEETS.ATTENDANCE);
  // Delete in reverse order so row indices don't shift
  const attData = sheetData_(attendanceSheet);
  const sidCol = attData[0].indexOf('StudentID');
  // PERF: one rewrite instead of a deleteRow() per matching record.
  const keptAtt = [];
  for (let i = 1; i < attData.length; i++) {
    if (String(attData[i][sidCol]) !== String(studentId)) keptAtt.push(attData[i]);
  }
  if (keptAtt.length !== attData.length - 1) rewriteRows_(attendanceSheet, keptAtt);

  return { success: true, message: 'Student deleted' };
}

// ─── ATTENDANCE ───────────────────────────────────────────────
function getAttendance(date, studentId) {
  const sheet = getSheet(SHEETS.ATTENDANCE);
  let data = sheetToObjects(sheet);
  if (date) {
    const isoDate = toISO(date); // normalise filter to ISO
    data = data.filter(r => toISO(r.Date) === isoDate);
  }
  if (studentId) data = data.filter(r => String(r.StudentID) === String(studentId));

  // Display the student's CURRENT name against a historical record. The stored
  // Date and Status - the actual attendance history - are never modified.
  const identity = studentIdentityMap_();
  data = data.map(r => {
    const who = identity[String(r.StudentID)];
    return who && who.name ? Object.assign({}, r, { StudentName: who.name }) : r;
  });

  return { success: true, data };
}

function markAttendance(body) {
  const sheet = getSheet(SHEETS.ATTENDANCE);
  const { records, date } = body;
  if (!Array.isArray(records)) return { success: false, error: 'records must be an array' };

  const isoDate = toISO(date); // always store as YYYY-MM-DD

  // PERF: this used to call deleteRow() for every existing row on this date
  // and appendRow() for every student - up to 2N remote round trips, which is
  // why saving a full class took tens of seconds. Now the sheet is read once,
  // rebuilt in memory, and written back in a single setValues call.
  const raw = sheetData_(sheet);
  const dateCol = raw[0].indexOf('Date');
  const kept = [];
  for (let i = 1; i < raw.length; i++) {
    if (toISO(raw[i][dateCol]) !== isoDate) kept.push(raw[i]);
  }
  records.forEach(r => {
    kept.push([generateId('ATT'), r.studentId, r.studentName, isoDate, r.status]);
  });
  rewriteRows_(sheet, kept);

  return { success: true, message: `Attendance saved for ${records.length} students on ${isoDate}` };
}

// ─── FEES ─────────────────────────────────────────────────────
// `cycle` (monthly/quarterly/half-yearly/yearly) comes from the institute's
// Fee Collection Cycle setting. Each student's cycle is anchored to their
// OWN CycleStart (their last successful payment date, or enrollment date
// before any payment) rather than a shared calendar month/quarter — so the
// due date and Period label are always "start + cycle months", independent
// per student.
//
// STATUS IS NEVER TRUSTED FROM THE SHEET. A row saved as "Paid" only
// reflects the cycle that was active when it was saved — if the next due
// date has since arrived with no new payment recorded, that "Paid" is
// stale. computeEffectiveFeeRows() recomputes Status (and PaidAmount /
// PendingAmount) fresh on every read from three facts only: LastPaymentDate,
// DueDate, and today's date — exactly as specified. Nothing is written back
// to the sheet by a read; the stored row only changes when a real payment
// is recorded via updateFees().
function computeEffectiveFeeRows(cycle) {
  const months = cycleMonths(cycle);
  const today = todayISO();
  const rawRows = sheetToObjects(getSheet(SHEETS.FEES));

  // Identity is resolved from the Students sheet on every read, so the Fees
  // page shows the CURRENT name even for rows written before the rename (and
  // even if a propagation write ever fails). Money, dates, status and cycle
  // still come only from the fee row itself.
  const identity = studentIdentityMap_();

  // Guard against a duplicate / ID-less fee row producing a phantom entry.
  const seenFee = {};
  const raw = rawRows.filter(f => {
    const sid = String(f.StudentID === null || f.StudentID === undefined ? '' : f.StudentID).trim();
    if (!sid) return false;
    if (seenFee[sid]) return false;
    seenFee[sid] = true;
    return true;
  });

  return raw.map(f => {
    const totalFee = parseFloat(f.TotalFee) || 0;
    const paidAmount = parseFloat(f.PaidAmount) || 0;
    const storedPending = parseFloat(f.PendingAmount);
    const pendingAmount = isNaN(storedPending) ? (totalFee - paidAmount) : storedPending;
    const dueDate = f.DueDate || '';

    // The stored row shows fully paid, but if today is on/after the due
    // date that was set for the NEXT cycle, no payment has been recorded
    // for that new cycle yet — the fee is due again, in full.
    const rolledOver = pendingAmount <= 0 && dueDate && dueDate <= today;

    const effectivePaid = rolledOver ? 0 : paidAmount;
    const effectivePending = rolledOver ? totalFee : pendingAmount;

    let status;
    if (effectivePending <= 0) status = 'Paid';
    else if (dueDate && dueDate < today) status = 'Overdue';
    else status = 'Pending';

    // Backfill Period/CycleStart on the fly for rows saved before these
    // columns existed — display-only, never persisted by a read.
    const cycleStart = f.CycleStart || (dueDate ? addMonthsISO(dueDate, -months) : '');

    const who = identity[String(f.StudentID)] || {};

    return Object.assign({}, f, {
      StudentName: who.name || f.StudentName,
      Course: who.course || f.Course,
      PaidAmount: effectivePaid,
      PendingAmount: effectivePending,
      Status: status,
      CycleStart: cycleStart,
      Period: f.Period || periodLabel(cycleStart, dueDate || today),
    });
  });
}

function getFees(cycle) {
  return { success: true, data: computeEffectiveFeeRows(cycle) };
}

function addFeeRecord(studentId, studentName, course, totalFee, cycle) {
  const months = cycleMonths(cycle);
  // No payment has happened yet — the first cycle is anchored to today
  // (enrollment), same as before.
  const cycleStart = todayISO();
  const dueDate = addMonthsISO(cycleStart, months);
  const period = periodLabel(cycleStart, dueDate);
  getSheet(SHEETS.FEES).appendRow([studentId, studentName, course, totalFee, 0, totalFee, dueDate, '', 'Pending', period, cycleStart]);
}

function updateFees(body) {
  const sheet = getSheet(SHEETS.FEES);
  const rowIndex = findRowByField(sheet, 'StudentID', body.studentId);
  if (rowIndex === -1) return { success: false, error: 'Fee record not found' };
  const rowData = sheetData_(sheet);
  const headers = rowData[0];
  const totalFee = parseFloat(body.totalFee) || 0;
  const paidAmount = parseFloat(body.paidAmount) || 0;
  const pendingAmount = totalFee - paidAmount;
  const cycle = body.cycle || 'monthly';
  const months = cycleMonths(cycle);

  // PERF: read from the single in-memory snapshot instead of one round trip
  // per cell.
  const readCol = (colName) => {
    const i = headers.indexOf(colName);
    return i === -1 ? '' : toISO((rowData[rowIndex - 1] || [])[i]);
  };

  let dueDate, cycleStart, status;

  if (pendingAmount <= 0) {
    // Fully paid — this IS a successful payment, so it becomes the new
    // CycleStart, and the next due date is exactly "this payment date +
    // cycle months" (e.g. quarterly: pay 15 Feb -> next due 15 May; pay
    // again 15 May -> next due 15 Aug). Genuinely independent per student.
    cycleStart = body.lastPaymentDate || todayISO();
    dueDate = addMonthsISO(cycleStart, months);
    status = 'Paid';
  } else {
    // Still pending: honour an explicit due date from the Edit Fee form.
    // Otherwise, keep the record's existing due date if it already has one,
    // and only auto-calculate a fresh one (from today, per the cycle) when
    // there truly isn't one yet — so a genuine future date is never
    // silently overwritten. CycleStart follows the same "keep unless there
    // truly isn't one" rule, estimated from the due date as a last resort.
    const existingDueDate = readCol('DueDate');
    const existingCycleStart = readCol('CycleStart');
    dueDate = body.dueDate || existingDueDate || addMonthsISO(todayISO(), months);
    cycleStart = existingCycleStart || (existingDueDate ? addMonthsISO(existingDueDate, -months) : todayISO());
    status = (dueDate && dueDate < todayISO()) ? 'Overdue' : 'Pending';
  }

  const period = periodLabel(cycleStart, dueDate);

  const updates = {
    TotalFee: totalFee, PaidAmount: paidAmount, PendingAmount: pendingAmount,
    DueDate: dueDate || '', LastPaymentDate: body.lastPaymentDate || '', Status: status,
    Period: period, CycleStart: cycleStart || ''
  };
  // PERF: one write for the whole row instead of one per column.
  writeRowUpdates_(sheet, rowIndex, updates);
  return { success: true, message: 'Fee updated', status, dueDate, period };
}

// ─── ENQUIRIES ────────────────────────────────────────────────
function getEnquiries() {
  return { success: true, data: sheetToObjects(getSheet(SHEETS.ENQUIRIES)) };
}

function addEnquiry(body) {
  const sheet = getSheet(SHEETS.ENQUIRIES);
  const enquiryId = generateId('ENQ');
  sheet.appendRow([
    enquiryId, body.name || '', body.phone || '', body.email || '',
    body.course || '', body.status || 'New', body.notes || '',
    todayISO(), body.followUpDate || ''
  ]);
  return { success: true, enquiryId, message: 'Enquiry added' };
}

function updateEnquiry(body) {
  const sheet = getSheet(SHEETS.ENQUIRIES);
  const rowIndex = findRowByField(sheet, 'EnquiryID', body.enquiryId);
  if (rowIndex === -1) return { success: false, error: 'Enquiry not found' };
  const updates = {
    Name: body.name, Phone: body.phone, Email: body.email,
    Course: body.course, Status: body.status, Notes: body.notes,
    FollowUpDate: body.followUpDate
  };
  // PERF: one write for the whole row instead of one per column.
  writeRowUpdates_(sheet, rowIndex, updates);
  return { success: true, message: 'Enquiry updated' };
}

// ─── EMAIL ────────────────────────────────────────────────────
function sendEmail(body) {
  const { type, to, studentName, amount, dueDate, course, name } = body;
  const instituteName = body.instituteName || SpreadsheetApp.getActiveSpreadsheet().getName();

  if (!to || !to.includes('@')) return { success: false, error: 'Invalid email address' };

  let template;
  switch (type) {
    case 'absentee':
      template = EMAIL_TEMPLATES.absentee(studentName, todayISO(), instituteName);
      break;
    case 'feeReminder':
      template = EMAIL_TEMPLATES.feeReminder(studentName, dueDate || 'as soon as possible', instituteName);
      break;
    case 'enquiryResponse':
      template = EMAIL_TEMPLATES.enquiryResponse(name, course, instituteName);
      break;
    case 'followUp':
      template = EMAIL_TEMPLATES.followUp(name, course, instituteName);
      break;
    default:
      return { success: false, error: 'Unknown email type' };
  }

  GmailApp.sendEmail(to, template.subject, '', {
    name: 'SYNCOPTRAC',  // Display name shown to recipient instead of personal Gmail name
    htmlBody: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">
        <div style="background:#1a73e8;padding:15px 20px;border-radius:6px 6px 0 0;margin:-20px -20px 20px -20px;">
          <h2 style="color:white;margin:0;font-size:20px;">${instituteName}</h2>
        </div>
        <div style="line-height:1.8;color:#333;font-size:15px;">
          ${template.body}
        </div>
        <div style="margin-top:30px;padding-top:15px;border-top:1px solid #eee;color:#888;font-size:12px;">
          This is an automated message from ${instituteName} Management System.
        </div>
      </div>
    `
  });

  return { success: true, message: `Email sent to ${to}` };
}

// ─── DASHBOARD SUMMARY ────────────────────────────────────────
// ─── ONE EXECUTION FOR THE WHOLE APP ────────────────────────────────
// Opening the app used to mean SEVEN separate Web App calls. Google runs only
// one execution per script project at a time, so they ran back to back and the
// last page waited for every earlier one to finish.
// Bundling them is nearly free: sheetData_ memoises each sheet for the life of
// one execution, so all seven datasets share the SAME reads. One call now costs
// about what a single call used to.
function getBundle(cycle, date) {
  // Every dataset is produced by the SAME function the individual action uses,
  // so a bundled payload and a single-action payload can never disagree.
  const studentsRes  = getStudents();
  const feesRes      = getFees(cycle);
  const enquiriesRes = getEnquiries();

  // Attendance is deliberately NOT bundled any more. It is the only sheet that
  // grows without bound, and dumping the whole history pushed this response
  // past the ~100KB CacheService ceiling - which silently made the ENTIRE
  // bundle uncacheable, so the most expensive read in the app was the one read
  // that never got cached, on every single call, forever. The Attendance page
  // asks for the date it needs on its own: cheaper, and always complete.
  return {
    success: true,
    data: {
      students:   studentsRes,
      fees:       feesRes,
      enquiries:  enquiriesRes,
      batches:    getBatches(),
      schedule:   getSchedule(),
      // Hands over what was just computed instead of re-reading Enquiries and
      // re-running the whole fee projection a second time in one execution.
      dashboard:  getDashboardSummary(cycle, {
        students:  studentsRes  && studentsRes.data,
        fees:      feesRes      && feesRes.data,
        enquiries: enquiriesRes && enquiriesRes.data
      })
    }
  };
}

// PERF: today's present/absent counts WITHOUT materialising the whole
// attendance history. Uses the same raw snapshot sheetToObjects would read, but
// touches only the Date and Status columns and allocates nothing per row.
// Identical semantics to the filter it replaces - toISO on the stored value,
// case-insensitive status match.
function attendanceTodayCounts_() {
  var out = { present: 0, absent: 0 };
  var data = sheetData_(getSheet(SHEETS.ATTENDANCE));
  if (!data || data.length < 2) return out;
  var headers = data[0];
  var dateIdx = headers.indexOf('Date');
  var statusIdx = headers.indexOf('Status');
  if (dateIdx === -1 || statusIdx === -1) return out;
  var today = todayISO();
  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    if (toISO(row[dateIdx]) !== today) continue;
    var st = String(row[statusIdx]).toLowerCase();
    if (st === 'present') out.present += 1;
    else if (st === 'absent') out.absent += 1;
  }
  return out;
}

function getDashboardSummary(cycle, pre) {
  // Same canonical list the Students page renders, so the dashboard total
  // and the Students page can never disagree.
  // Reuse anything the caller already computed in this same execution; each
  // falls back to computing itself when called directly. An empty array is
  // truthy in JS, so a genuinely empty sheet is NOT re-read.
  const students   = (pre && pre.students)  || canonicalStudents_();
  // Same dynamic Status/PaidAmount/PendingAmount as the Fees page — a
  // student who rolled into an unpaid new cycle is counted as unpaid here
  // too, without needing a separate write to "reset" the sheet.
  const fees       = (pre && pre.fees)      || computeEffectiveFeeRows(cycle);
  const enquiries  = (pre && pre.enquiries) || sheetToObjects(getSheet(SHEETS.ENQUIRIES));

  // Was: read EVERY attendance row ever recorded, build an object per row,
  // format every date cell, then throw all but today away. That single line
  // grew unbounded with the institute's history.
  const att = attendanceTodayCounts_();
  const presentToday = att.present;
  const absentToday  = att.absent;

  const totalFees     = fees.reduce((s, f) => s + (parseFloat(f.TotalFee) || 0), 0);
  const collectedFees = fees.reduce((s, f) => s + (parseFloat(f.PaidAmount) || 0), 0);
  const pendingFees   = fees.reduce((s, f) => s + (parseFloat(f.PendingAmount) || 0), 0);
  const overdueStudents = fees.filter(f => f.Status === 'Overdue').length;

  return {
    success: true,
    data: {
      totalStudents: students.length,
      presentToday, absentToday,
      totalFees, collectedFees, pendingFees, overdueStudents,
      newEnquiries:       enquiries.filter(e => e.Status === 'New').length,
      followUpEnquiries:  enquiries.filter(e => e.Status === 'Follow-Up').length,
      convertedEnquiries: enquiries.filter(e => e.Status === 'Converted').length
    }
  };
}


// ─── BATCHES ──────────────────────────────────────────────────
function getBatches() {
  return { success: true, data: sheetToObjects(getSheet(SHEETS.BATCHES)) };
}

function addBatch(body) {
  const sheet = getSheet(SHEETS.BATCHES);
  const batchId = generateId('BAT');
  sheet.appendRow([
    batchId,
    body.batchName || '',
    body.course || '',
    body.teacher || '',
    body.description || '',
    '' // students - empty initially
  ]);
  return { success: true, batchId, message: 'Batch created' };
}

function updateBatch(body) {
  const sheet = getSheet(SHEETS.BATCHES);
  const rowIndex = findRowByField(sheet, 'BatchID', body.batchId);
  if (rowIndex === -1) return { success: false, error: 'Batch not found' };
  const updates = {
    BatchName: body.batchName,
    Course: body.course,
    Teacher: body.teacher,
    Description: body.description
  };
  // PERF: one write for the whole row instead of one per column.
  writeRowUpdates_(sheet, rowIndex, updates);
  return { success: true, message: 'Batch updated' };
}

function assignStudents(body) {
  const sheet = getSheet(SHEETS.BATCHES);
  const rowIndex = findRowByField(sheet, 'BatchID', body.batchId);
  if (rowIndex === -1) return { success: false, error: 'Batch not found' };
  writeRowUpdates_(sheet, rowIndex, { Students: body.students || '' });
  return { success: true, message: 'Students assigned' };
}

function deleteBatch(batchId) {
  // Delete batch row
  const bSheet = getSheet(SHEETS.BATCHES);
  const bRow = findRowByField(bSheet, 'BatchID', batchId);
  if (bRow !== -1) bSheet.deleteRow(bRow);

  // Delete all schedule slots for this batch
  const sSheet = getSheet(SHEETS.SCHEDULE);
  const data = sheetData_(sSheet);
  const batchCol = data[0].indexOf('BatchID');
  // PERF: one rewrite instead of a deleteRow() per slot.
  const keptSlots = [];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][batchCol]) !== String(batchId)) keptSlots.push(data[i]);
  }
  if (keptSlots.length !== data.length - 1) rewriteRows_(sSheet, keptSlots);

  return { success: true, message: 'Batch and its schedule deleted' };
}

// ─── SCHEDULE ─────────────────────────────────────────────────
// ─── TIME HELPER ─────────────────────────────────────
// Google Sheets auto-converts "09:00" into a Date serial number.
// When read back via sheetToObjects it becomes a JS Date object,
// which JSON.stringify turns into "1899-12-30T06:39:50.000Z".
// formatTime() converts any time value back to a clean "HH:MM" string.
function formatTime(val) {
  if (!val && val !== 0) return '';
  if (val instanceof Date) {
    var hh = String(val.getHours()).padStart(2, '0');
    var mm = String(val.getMinutes()).padStart(2, '0');
    return hh + ':' + mm;
  }
  if (typeof val === 'number') {
    var totalMinutes = Math.round(val * 24 * 60);
    var hh2 = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
    var mm2 = String(totalMinutes % 60).padStart(2, '0');
    return hh2 + ':' + mm2;
  }
  if (typeof val === 'string') {
    if (/^\d{1,2}:\d{2}$/.test(val.trim())) return val.trim();
    var d = new Date(val);
    if (!isNaN(d.getTime())) {
      return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0');
    }
    return val;
  }
  return String(val);
}

function getSchedule() {
  var raw = sheetToObjects(getSheet(SHEETS.SCHEDULE));
  // Normalise StartTime/EndTime so the frontend always gets clean "HH:MM" strings
  // regardless of how Google Sheets decided to store the time value.
  var data = raw.map(function(slot) {
    return Object.assign({}, slot, {
      StartTime: formatTime(slot.StartTime),
      EndTime:   formatTime(slot.EndTime)
    });
  });
  return { success: true, data: data };
}

function addSlot(body) {
  const sheet = getSheet(SHEETS.SCHEDULE);
  const slotId = generateId('SLT');
  sheet.appendRow([
    slotId,
    body.batchId || '',
    body.day || '',
    body.startTime || '',
    body.endTime || '',
    body.subject || ''
  ]);
  return { success: true, slotId, message: 'Slot added' };
}

function updateSlot(body) {
  const sheet = getSheet(SHEETS.SCHEDULE);
  const rowIndex = findRowByField(sheet, 'SlotID', body.slotId);
  if (rowIndex === -1) return { success: false, error: 'Slot not found' };
  const updates = {
    BatchID: body.batchId,
    Day: body.day,
    StartTime: body.startTime,
    EndTime: body.endTime,
    Subject: body.subject
  };
  // PERF: one write for the whole row instead of one per column.
  writeRowUpdates_(sheet, rowIndex, updates);
  return { success: true, message: 'Slot updated' };
}

function deleteSlot(slotId) {
  const sheet = getSheet(SHEETS.SCHEDULE);
  const rowIndex = findRowByField(sheet, 'SlotID', slotId);
  if (rowIndex === -1) return { success: false, error: 'Slot not found' };
  sheet.deleteRow(rowIndex);
  return { success: true, message: 'Slot deleted' };
}

// ─── ONE-TIME SETUP ───────────────────────────────────────────
function setupSheets() {
  Object.values(SHEETS).forEach(name => {
    if (!SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name)) {
      createSheet(name);
      Logger.log('Created: ' + name);
    }
  });
  Logger.log('Setup complete!');
}