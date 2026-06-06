const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { requireInstitute } = require('../middleware/auth');

// ─── IN-MEMORY CACHE ─────────────────────────────────────────────────────────
const cache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
  return entry.data;
}

function setCached(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

function bustCache(instituteId) {
  for (const key of cache.keys()) {
    if (key.startsWith(instituteId)) cache.delete(key);
  }
}

// ─── PROXY TO APPS SCRIPT ────────────────────────────────────────────────────
// FIX: Apps Script redirects POST → 302. Following the redirect as another POST
// causes Google to process the request but return a bad status, so the backend
// throws "Apps Script error: 405/500" even though the data WAS saved to Sheets.
// Solution: follow the redirect as GET — Apps Script already handled the POST.
// Also: parse text safely so a non-JSON response never throws an unhandled error.
async function proxyToAppsScript(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
    redirect: 'manual', // handle redirects manually
  };
  if (body) options.body = JSON.stringify(body);

  let response = await fetch(url, options);

  // Follow redirect — but as GET, not POST.
  // Google's Apps Script infrastructure processes the POST before redirecting;
  // the redirect URL just returns the JSON result via GET.
  if (response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308) {
    const redirectUrl = response.headers.get('location');
    if (redirectUrl) {
      response = await fetch(redirectUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        redirect: 'follow',
      });
    }
  }

  // Safely parse — Apps Script can return non-JSON on quota/auth errors
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    // Return a structured error instead of throwing, so the route handler
    // can respond with a meaningful message rather than a 500 crash.
    console.error('Apps Script non-JSON response:', text.slice(0, 500));
    return { success: false, error: `Apps Script error: ${text.slice(0, 200)}` };
  }
}

// ─── CACHED GET HELPER ───────────────────────────────────────────────────────
async function cachedGet(cacheKey, url) {
  const hit = getCached(cacheKey);
  if (hit) return hit;
  const data = await proxyToAppsScript(url);
  setCached(cacheKey, data);
  return data;
}

// ─── STUDENTS ────────────────────────────────────────────────────────────────

router.get('/students', requireInstitute, async (req, res) => {
  try {
    const { appsScriptUrl, id } = req.user;
    const data = await cachedGet(`${id}:students`, `${appsScriptUrl}?action=getStudents`);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

router.post('/students', requireInstitute, async (req, res) => {
  try {
    const { appsScriptUrl, id } = req.user;
    const data = await proxyToAppsScript(appsScriptUrl, 'POST', { action: 'addStudent', ...req.body });
    bustCache(id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add student' });
  }
});

router.put('/students/:sid', requireInstitute, async (req, res) => {
  try {
    const { appsScriptUrl, id } = req.user;
    const data = await proxyToAppsScript(appsScriptUrl, 'POST', {
      action: 'updateStudent', studentId: req.params.sid, ...req.body
    });
    bustCache(id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

router.delete('/students/:sid', requireInstitute, async (req, res) => {
  try {
    const { appsScriptUrl, id } = req.user;
    const data = await proxyToAppsScript(appsScriptUrl, 'POST', {
      action: 'deleteStudent', studentId: req.params.sid
    });
    bustCache(id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// ─── ATTENDANCE ──────────────────────────────────────────────────────────────

router.get('/attendance', requireInstitute, async (req, res) => {
  try {
    const { date, studentId } = req.query;
    const { appsScriptUrl, id } = req.user;
    let url = `${appsScriptUrl}?action=getAttendance`;
    if (date) url += `&date=${date}`;
    if (studentId) url += `&studentId=${studentId}`;
    const cacheKey = `${id}:attendance:${date || 'all'}`;
    const data = await cachedGet(cacheKey, url);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

router.post('/attendance', requireInstitute, async (req, res) => {
  try {
    const { appsScriptUrl, id } = req.user;
    const data = await proxyToAppsScript(appsScriptUrl, 'POST', {
      action: 'markAttendance', ...req.body
    });
    bustCache(id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// ─── FEES ─────────────────────────────────────────────────────────────────────

router.get('/fees', requireInstitute, async (req, res) => {
  try {
    const { appsScriptUrl, id } = req.user;
    const data = await cachedGet(`${id}:fees`, `${appsScriptUrl}?action=getFees`);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch fees' });
  }
});

router.put('/fees/:studentId', requireInstitute, async (req, res) => {
  try {
    const { appsScriptUrl, id } = req.user;
    const data = await proxyToAppsScript(appsScriptUrl, 'POST', {
      action: 'updateFees', studentId: req.params.studentId, ...req.body
    });
    bustCache(id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update fees' });
  }
});

// ─── ENQUIRIES ───────────────────────────────────────────────────────────────

router.get('/enquiries', requireInstitute, async (req, res) => {
  try {
    const { appsScriptUrl, id } = req.user;
    const data = await cachedGet(`${id}:enquiries`, `${appsScriptUrl}?action=getEnquiries`);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch enquiries' });
  }
});

router.post('/enquiries', requireInstitute, async (req, res) => {
  try {
    const { appsScriptUrl, id } = req.user;
    const data = await proxyToAppsScript(appsScriptUrl, 'POST', { action: 'addEnquiry', ...req.body });
    bustCache(id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add enquiry' });
  }
});

router.put('/enquiries/:eid', requireInstitute, async (req, res) => {
  try {
    const { appsScriptUrl, id } = req.user;
    const data = await proxyToAppsScript(appsScriptUrl, 'POST', {
      action: 'updateEnquiry', enquiryId: req.params.eid, ...req.body
    });
    bustCache(id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update enquiry' });
  }
});

// ─── EMAIL ────────────────────────────────────────────────────────────────────

router.post('/send-email', requireInstitute, async (req, res) => {
  try {
    const { appsScriptUrl, instituteName, phone, contactNumber } = req.user;
    const { type, to, name, studentName, dueDate, course } = req.body;
    const data = await proxyToAppsScript(appsScriptUrl, 'POST', {
      action: 'sendEmail',
      type, to, name, studentName, dueDate, course,
      instituteName,
      contactNumber: phone || contactNumber || '',
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// ─── DASHBOARD SUMMARY ────────────────────────────────────────────────────────

router.get('/dashboard-summary', requireInstitute, async (req, res) => {
  try {
    const { appsScriptUrl, id } = req.user;
    const data = await cachedGet(`${id}:dashboard`, `${appsScriptUrl}?action=getDashboardSummary`);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// ─── BATCHES ─────────────────────────────────────────────────────────────────

router.get('/batches', requireInstitute, async (req, res) => {
  try {
    const { appsScriptUrl, id } = req.user;
    const data = await cachedGet(`${id}:batches`, `${appsScriptUrl}?action=getBatches`);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

router.post('/batches', requireInstitute, async (req, res) => {
  try {
    const { appsScriptUrl, id } = req.user;
    const data = await proxyToAppsScript(appsScriptUrl, 'POST', { action: 'addBatch', ...req.body });
    bustCache(id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add batch' });
  }
});

router.put('/batches/:bid', requireInstitute, async (req, res) => {
  try {
    const { appsScriptUrl, id } = req.user;
    const data = await proxyToAppsScript(appsScriptUrl, 'POST', {
      action: 'updateBatch', batchId: req.params.bid, ...req.body
    });
    bustCache(id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update batch' });
  }
});

router.put('/batches/:bid/students', requireInstitute, async (req, res) => {
  try {
    const { appsScriptUrl, id } = req.user;
    const data = await proxyToAppsScript(appsScriptUrl, 'POST', {
      action: 'assignStudents', batchId: req.params.bid, students: req.body.students
    });
    bustCache(id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to assign students' });
  }
});

router.delete('/batches/:bid', requireInstitute, async (req, res) => {
  try {
    const { appsScriptUrl, id } = req.user;
    const data = await proxyToAppsScript(appsScriptUrl, 'POST', {
      action: 'deleteBatch', batchId: req.params.bid
    });
    bustCache(id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete batch' });
  }
});

// ─── SCHEDULE ────────────────────────────────────────────────────────────────

router.get('/schedule', requireInstitute, async (req, res) => {
  try {
    const { appsScriptUrl, id } = req.user;
    const data = await cachedGet(`${id}:schedule`, `${appsScriptUrl}?action=getSchedule`);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

router.post('/schedule', requireInstitute, async (req, res) => {
  try {
    const { appsScriptUrl, id } = req.user;
    const data = await proxyToAppsScript(appsScriptUrl, 'POST', { action: 'addSlot', ...req.body });
    bustCache(id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add slot' });
  }
});

router.put('/schedule/:sid', requireInstitute, async (req, res) => {
  try {
    const { appsScriptUrl, id } = req.user;
    const data = await proxyToAppsScript(appsScriptUrl, 'POST', {
      action: 'updateSlot', slotId: req.params.sid, ...req.body
    });
    bustCache(id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update slot' });
  }
});

router.delete('/schedule/:sid', requireInstitute, async (req, res) => {
  try {
    const { appsScriptUrl, id } = req.user;
    const data = await proxyToAppsScript(appsScriptUrl, 'POST', {
      action: 'deleteSlot', slotId: req.params.sid
    });
    bustCache(id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete slot' });
  }
});

module.exports = router;