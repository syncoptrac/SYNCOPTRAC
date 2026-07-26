const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const http = require('http');
const https = require('https');

// PERF: without an agent, every call to Apps Script opened a brand new TLS
// connection to Google (DNS + TCP + TLS handshake = roughly 200-500ms of pure
// overhead per request, paid on every page load and every save). Re-using warm
// sockets removes that entirely.
const keepAliveHttp = new http.Agent({ keepAlive: true, keepAliveMsecs: 15000, maxSockets: 32 });
const keepAliveHttps = new https.Agent({ keepAlive: true, keepAliveMsecs: 15000, maxSockets: 32 });
const agentFor = (url) => (String(url).startsWith('http://') ? keepAliveHttp : keepAliveHttps);
const { requireInstitute } = require('../middleware/auth');
const Institute = require('../models/Institute');

// Fee Collection Cycle isn't stored in the JWT (it can change anytime without
// forcing re-login), so fee-related routes below fetch it fresh from Mongo
// and forward it to Apps Script as `cycle` so due dates/periods/status stay
// in sync with whatever the institute has selected in Settings.
// PERF: this used to hit MongoDB on EVERY fees/dashboard request, adding a
// database round trip in front of the (already slow) Sheets read. The cycle
// changes very rarely, so it is memoised per institute for 60s. A change made
// in Settings is picked up within a minute, and the fee maths is unchanged.
const feeCycleCache = new Map();
const FEE_CYCLE_TTL = 60 * 1000;

async function getFeeCycle(instituteId) {
  const key = String(instituteId);
  const hit = feeCycleCache.get(key);
  if (hit && Date.now() - hit.ts < FEE_CYCLE_TTL) return hit.value;
  try {
    const inst = await Institute.findById(instituteId)
      .select('feeCollectionCycle')
      .lean();
    const value = (inst && inst.feeCollectionCycle) || 'monthly';
    feeCycleCache.set(key, { value, ts: Date.now() });
    return value;
  } catch {
    return (hit && hit.value) || 'monthly';
  }
}

// ─── IN-MEMORY CACHE (stale-while-revalidate) ─────────────────────────────────────────
// The old cache had a 30s hard TTL, so anything older than 30s cost a full
// Apps Script + Sheets round trip (1-4s) with the user watching a spinner.
// Entries now have two ages:
//   FRESH - served instantly, no upstream call at all.
//   STALE - still served instantly, and refreshed in the background so the
//           next visit is fresh. The user never waits on a slow read.
// Only a genuine cold miss blocks on the upstream call.
const cache = new Map();
const CACHE_TTL = 60 * 1000;        // fresh window
const STALE_TTL = 10 * 60 * 1000;   // servable-while-revalidating window
const inFlight = new Map();         // request coalescing

const isUsable = (data) => !!data && !data.error && data.success !== false;

function cacheEntry(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.mustRevalidate) return null; // invalidated by a write
  const age = Date.now() - entry.ts;
  if (age <= CACHE_TTL) return { data: entry.data, state: 'fresh' };
  if (age <= STALE_TTL) return { data: entry.data, state: 'stale' };
  cache.delete(key);
  return null;
}

function getCached(key) {
  const entry = cacheEntry(key);
  return entry && entry.state === 'fresh' ? entry.data : null;
}

function setCached(key, data, url) {
  const prev = cache.get(key);
  cache.set(key, {
    data,
    ts: Date.now(),
    url: url || (prev && prev.url) || null,
    mustRevalidate: false,
  });
}

// PERF: two identical requests arriving together (e.g. the Fees page asking
// for students while the dashboard is still loading them) used to each trigger
// their own Apps Script call. Now they share one.
async function fetchUpstream(key, url) {
  const pending = inFlight.get(key);
  if (pending) return pending;
  const promise = proxyToAppsScript(url).finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

// PERF: a write used to DELETE every cached key for the institute, so the
// refetch that follows every save always paid full price - a main reason
// saving felt slow. Instead the entries are flagged for revalidation and
// re-warmed immediately in the background, while the user is still looking at
// the success toast. By the time the page refetches, data is already in
// memory. Correctness is unchanged: a flagged entry is never served.
function bustCache(instituteId) {
  const prefix = String(instituteId);
  const toWarm = [];
  for (const [key, entry] of cache.entries()) {
    if (!key.startsWith(prefix)) continue;
    entry.mustRevalidate = true;
    if (entry.url) toWarm.push({ key, url: entry.url });
  }
  warmKeys(toWarm);
}

// Sequential on purpose: Google throttles concurrent executions of a single
// Apps Script project, so a burst of parallel warms would be slower than one
// at a time.
function warmKeys(entries) {
  if (!entries.length) return;
  (async () => {
    for (const { key, url } of entries) {
      try {
        const data = await fetchUpstream(key, url);
        if (isUsable(data)) setCached(key, data, url);
      } catch (err) {
        console.error('Cache warm failed for', key, err.message);
      }
    }
  })();
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
    headers: { 'Content-Type': 'application/json', 'Accept-Encoding': 'gzip,deflate' },
    redirect: 'manual', // handle redirects manually
    agent: agentFor(url), // PERF: re-use the warm TLS connection
    compress: true,       // PERF: gzip the (often large) JSON payload in transit
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
        headers: { 'Content-Type': 'application/json', 'Accept-Encoding': 'gzip,deflate' },
        redirect: 'follow',
        agent: agentFor(redirectUrl), // PERF: re-use the warm TLS connection
        compress: true,
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
  const entry = cacheEntry(cacheKey);

  // Fresh: answer in microseconds, no upstream call.
  if (entry && entry.state === 'fresh') return entry.data;

  // Stale: answer instantly from cache and refresh in the background, so the
  // page paints now instead of after a 1-4s Sheets read.
  if (entry && entry.state === 'stale') {
    warmKeys([{ key: cacheKey, url }]);
    return entry.data;
  }

  // Cold miss (or invalidated by a save): the only path that waits.
  const data = await fetchUpstream(cacheKey, url);
  if (isUsable(data)) setCached(cacheKey, data, url);
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
    const cycle = await getFeeCycle(id);
    const data = await proxyToAppsScript(appsScriptUrl, 'POST', { action: 'addStudent', cycle, ...req.body });
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
    const cycle = await getFeeCycle(id);
    // Cache key includes the cycle so a settings change is reflected immediately
    // instead of serving a stale 30s-cached response computed under the old cycle.
    const data = await cachedGet(`${id}:fees:${cycle}`, `${appsScriptUrl}?action=getFees&cycle=${cycle}`);
    res.json({ ...data, feeCollectionCycle: cycle });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch fees' });
  }
});

router.put('/fees/:studentId', requireInstitute, async (req, res) => {
  try {
    const { appsScriptUrl, id } = req.user;
    const cycle = await getFeeCycle(id);
    const data = await proxyToAppsScript(appsScriptUrl, 'POST', {
      action: 'updateFees', studentId: req.params.studentId, cycle, ...req.body
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
    const cycle = await getFeeCycle(id);
    // Cache key includes the cycle (and, implicitly via the 30s TTL, today's
    // date) so a fee status that just rolled over from Paid to Unpaid is
    // reflected here within the normal cache window, not stuck stale.
    const data = await cachedGet(`${id}:dashboard:${cycle}`, `${appsScriptUrl}?action=getDashboardSummary&cycle=${cycle}`);
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