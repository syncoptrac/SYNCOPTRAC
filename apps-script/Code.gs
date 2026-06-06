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
  try {
    let result;
    switch (params.action) {
      case 'getStudents':         result = getStudents(); break;
      case 'getAttendance':       result = getAttendance(params.date, params.studentId); break;
      case 'getFees':             result = getFees(); break;
      case 'getEnquiries':        result = getEnquiries(); break;
      case 'getDashboardSummary': result = getDashboardSummary(); break;
      case 'getBatches':         result = getBatches(); break;
      case 'getSchedule':         result = getSchedule(); break;
      default: result = { error: 'Unknown action' };
    }
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function doPost(e) {
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
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ error: err.message });
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

// ─── SHEET HELPERS ────────────────────────────────────────────
function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = createSheet(name);
  return sheet;
}

function createSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.insertSheet(name);
  const headers = {
    Students:   ['StudentID', 'StudentName', 'Phone', 'ParentContact', 'Course', 'JoiningDate', 'Email', 'Address'],
    Attendance: ['AttendanceID', 'StudentID', 'StudentName', 'Date', 'Status'],
    Fees:       ['StudentID', 'StudentName', 'Course', 'TotalFee', 'PaidAmount', 'PendingAmount', 'DueDate', 'LastPaymentDate', 'Status'],
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
  const data = sheet.getDataRange().getValues();
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
var DATE_COLS = ['Date','JoiningDate','DueDate','LastPaymentDate','CreatedAt','FollowUpDate'];

function sheetToObjects(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) {
      var val = row[i];
      // Convert any Date object in a known date column to YYYY-MM-DD (IST)
      if (val instanceof Date && !isNaN(val.getTime()) && DATE_COLS.indexOf(h) !== -1) {
        val = Utilities.formatDate(val, 'Asia/Kolkata', 'yyyy-MM-dd');
      }
      obj[h] = val;
    });
    return obj;
  });
}

function findRowByField(sheet, fieldName, value) {
  const data = sheet.getDataRange().getValues();
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
  return { success: true, data: sheetToObjects(getSheet(SHEETS.STUDENTS)) };
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
  addFeeRecord(studentId, body.studentName, body.course, body.totalFee || 0);
  return { success: true, studentId, message: 'Student added successfully' };
}

function updateStudent(body) {
  const sheet = getSheet(SHEETS.STUDENTS);
  const rowIndex = findRowByField(sheet, 'StudentID', body.studentId);
  if (rowIndex === -1) return { success: false, error: 'Student not found' };
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const updates = {
    StudentName: body.studentName, Phone: body.phone,
    ParentContact: body.parentContact, Course: body.course,
    Email: body.email, Address: body.address
  };
  headers.forEach((h, i) => {
    if (updates[h] !== undefined) sheet.getRange(rowIndex, i + 1).setValue(updates[h]);
  });
  return { success: true, message: 'Student updated' };
}

function deleteStudent(studentId) {
  const sheet = getSheet(SHEETS.STUDENTS);
  const rowIndex = findRowByField(sheet, 'StudentID', studentId);
  if (rowIndex === -1) return { success: false, error: 'Student not found' };
  sheet.deleteRow(rowIndex);
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
  return { success: true, data };
}

function markAttendance(body) {
  const sheet = getSheet(SHEETS.ATTENDANCE);
  const { records, date } = body;
  if (!Array.isArray(records)) return { success: false, error: 'records must be an array' };

  const isoDate = toISO(date); // always store as YYYY-MM-DD

  // Remove existing records for this date
  const raw = sheet.getDataRange().getValues();
  const dateCol = raw[0].indexOf('Date');
  const toDelete = [];
  for (let i = raw.length - 1; i >= 1; i--) {
    if (toISO(raw[i][dateCol]) === isoDate) toDelete.push(i + 1);
  }
  toDelete.forEach(r => sheet.deleteRow(r));

  // Write new records
  records.forEach(r => {
    sheet.appendRow([generateId('ATT'), r.studentId, r.studentName, isoDate, r.status]);
  });

  return { success: true, message: `Attendance saved for ${records.length} students on ${isoDate}` };
}

// ─── FEES ─────────────────────────────────────────────────────
function getFees() {
  return { success: true, data: sheetToObjects(getSheet(SHEETS.FEES)) };
}

function addFeeRecord(studentId, studentName, course, totalFee) {
  getSheet(SHEETS.FEES).appendRow([studentId, studentName, course, totalFee, 0, totalFee, '', '', 'Pending']);
}

function updateFees(body) {
  const sheet = getSheet(SHEETS.FEES);
  const rowIndex = findRowByField(sheet, 'StudentID', body.studentId);
  if (rowIndex === -1) return { success: false, error: 'Fee record not found' };
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const totalFee = parseFloat(body.totalFee) || 0;
  const paidAmount = parseFloat(body.paidAmount) || 0;
  const pendingAmount = totalFee - paidAmount;
  const status = pendingAmount <= 0 ? 'Paid'
    : (body.dueDate && body.dueDate < todayISO() ? 'Overdue' : 'Pending');
  const updates = {
    TotalFee: totalFee, PaidAmount: paidAmount, PendingAmount: pendingAmount,
    DueDate: body.dueDate || '', LastPaymentDate: body.lastPaymentDate || '', Status: status
  };
  headers.forEach((h, i) => {
    if (updates[h] !== undefined) sheet.getRange(rowIndex, i + 1).setValue(updates[h]);
  });
  return { success: true, message: 'Fee updated', status };
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
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const updates = {
    Name: body.name, Phone: body.phone, Email: body.email,
    Course: body.course, Status: body.status, Notes: body.notes,
    FollowUpDate: body.followUpDate
  };
  headers.forEach((h, i) => {
    if (updates[h] !== undefined) sheet.getRange(rowIndex, i + 1).setValue(updates[h]);
  });
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
function getDashboardSummary() {
  const students   = sheetToObjects(getSheet(SHEETS.STUDENTS));
  const fees       = sheetToObjects(getSheet(SHEETS.FEES));
  const enquiries  = sheetToObjects(getSheet(SHEETS.ENQUIRIES));
  const attendance = sheetToObjects(getSheet(SHEETS.ATTENDANCE));

  const today = todayISO(); // ISO date — matches stored attendance
  const todayAtt     = attendance.filter(a => toISO(a.Date) === today);
  const presentToday = todayAtt.filter(a => String(a.Status).toLowerCase() === 'present').length;
  const absentToday  = todayAtt.filter(a => String(a.Status).toLowerCase() === 'absent').length;

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
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const updates = {
    BatchName: body.batchName,
    Course: body.course,
    Teacher: body.teacher,
    Description: body.description
  };
  headers.forEach((h, i) => {
    if (updates[h] !== undefined) sheet.getRange(rowIndex, i + 1).setValue(updates[h]);
  });
  return { success: true, message: 'Batch updated' };
}

function assignStudents(body) {
  const sheet = getSheet(SHEETS.BATCHES);
  const rowIndex = findRowByField(sheet, 'BatchID', body.batchId);
  if (rowIndex === -1) return { success: false, error: 'Batch not found' };
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const col = headers.indexOf('Students') + 1;
  if (col > 0) sheet.getRange(rowIndex, col).setValue(body.students || '');
  return { success: true, message: 'Students assigned' };
}

function deleteBatch(batchId) {
  // Delete batch row
  const bSheet = getSheet(SHEETS.BATCHES);
  const bRow = findRowByField(bSheet, 'BatchID', batchId);
  if (bRow !== -1) bSheet.deleteRow(bRow);

  // Delete all schedule slots for this batch
  const sSheet = getSheet(SHEETS.SCHEDULE);
  const data = sSheet.getDataRange().getValues();
  const batchCol = data[0].indexOf('BatchID');
  const toDelete = [];
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][batchCol]) === String(batchId)) toDelete.push(i + 1);
  }
  toDelete.forEach(r => sSheet.deleteRow(r));

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
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const updates = {
    BatchID: body.batchId,
    Day: body.day,
    StartTime: body.startTime,
    EndTime: body.endTime,
    Subject: body.subject
  };
  headers.forEach((h, i) => {
    if (updates[h] !== undefined) sheet.getRange(rowIndex, i + 1).setValue(updates[h]);
  });
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