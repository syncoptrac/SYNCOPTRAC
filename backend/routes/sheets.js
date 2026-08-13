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

// A write flags this institute's cached reads for revalidation.
// It used to ALSO re-fetch every flagged key immediately (warmKeys), which is a
// large part of why saving a student was slow: one save kicked off sequential
// re-reads of students + attendance + fees + dashboard + enquiries + batches +
// schedule, and Google serialises concurrent executions of a single Apps Script
// project, so the user's own next request queued behind all of them. The client
// now revalidates just the list it is showing, in the background.
function bustCache(instituteId) {
  const prefix = String(instituteId);
  for (const [key, entry] of cache.entries()) {
    if (key.startsWith(prefix)) entry.mustRevalidate = true;
  }
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

// \u2500\u2500\u2500 PROXY TO APPS SCRIPT \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// WHY THE RENDER LOG WAS FULL OF "Apps Script non-JSON response: <!DOCTYPE html>":
//
// Google never returns an HTML page from a healthy /exec Web App - it returns
// JSON from ContentService. An HTML body means the request never reached
// doGet/doPost, and there are only a handful of causes, all of which produce a
// full HTML document:
//   * the deployment's "Who has access" is not "Anyone", so Google answers with
//     the accounts.google.com sign-in page,
//   * the saved URL is a /dev URL (editor-bound, requires the owner's session),
//     an /edit link, or a stale deployment id that no longer resolves,
//   * the 302 to script.googleusercontent.com was not followed to completion,
//     so the interstitial HTML was read as the body,
//   * the script hit a quota/permission error and Google served an error page.
//
// The old code could not tell these apart: it ignored response.status, ignored
// Content-Type, followed only ONE redirect, then dumped 500 characters of HTML
// into the log and returned that HTML *as the error message* - once per
// request, which is why the same error repeated endlessly.
//
// This version validates the response properly (status -> Content-Type -> JSON
// parseability), identifies WHICH of the causes above happened, logs one
// actionable line per cause per minute with the deployment id masked, and never
// treats HTML as data. The JSON contract itself is unchanged.
const APPS_SCRIPT_EXEC = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;
const UPSTREAM_TIMEOUT_MS = 20000;      // per attempt; below the client's 30s
const UPSTREAM_TOTAL_BUDGET_MS = 26000; // all attempts, so we always answer
const MAX_REDIRECTS = 5;

function normaliseAppsScriptUrl(rawUrl) {
  return String(rawUrl || '').trim().replace(/[?#].*$/, '').replace(/\/+$/, '');
}

// Classifies the configured URL WITHOUT calling it, so a misconfigured
// deployment fails instantly with a clear reason instead of burning 20s.
function classifyAppsScriptUrl(url) {
  if (!url) return 'MISSING_URL';
  if (APPS_SCRIPT_EXEC.test(url)) return 'OK';
  if (/\/dev$/.test(url)) return 'DEV_URL';
  if (/script\.google\.com\/.*\/edit/.test(url) || /\/macros\/d\//.test(url)) return 'EDITOR_URL';
  if (!/^https:\/\/script\.google\.com\/macros\/s\//.test(url)) return 'NOT_APPS_SCRIPT';
  return 'NOT_EXEC';
}

// Logs are safe to share: the deployment id is a credential-like secret, so
// only its last 4 characters are ever printed.
function safeUrlLabel(url) {
  const m = String(url || '').match(/\/macros\/s\/([A-Za-z0-9_-]+)\/(exec|dev)/);
  if (m) return `script.google.com/macros/s/\u2026${m[1].slice(-4)}/${m[2]}`;
  if (!url) return '(not set)';
  try { return new URL(url).host; } catch { return '(unparseable url)'; }
}

// Identifies the specific Google HTML page that came back.
function classifyHtmlBody(body, status) {
  const b = String(body || '').slice(0, 4000);
  if (/accounts\.google\.com|ServiceLogin|signin\/identifier|Sign in - Google/i.test(b)) return 'GOOGLE_LOGIN_PAGE';
  if (/Authorization is required to perform that action/i.test(b)) return 'AUTHORIZATION_REQUIRED';
  if (/You need permission|request access|Request access/i.test(b)) return 'NO_PERMISSION';
  if (/Moved Temporarily|temporarily moved|<TITLE>Moved/i.test(b)) return 'UNFOLLOWED_REDIRECT';
  if (/exceeded (its )?(maximum )?(execution time|quota)|Service invoked too many times/i.test(b)) return 'QUOTA_EXCEEDED';
  if (/Script function not found|not found: doGet|not found: doPost/i.test(b)) return 'MISSING_HANDLER';
  if (/is not (currently )?available|Sorry, unable to open the file|deployment.*not found/i.test(b)) return 'DEPLOYMENT_UNAVAILABLE';
  if (/Google Apps Script|Exception:|TypeError:|ReferenceError:/i.test(b)) return 'SCRIPT_ERROR_PAGE';
  if (status === 404) return 'NOT_FOUND';
  return 'UNEXPECTED_HTML';
}

const DIAGNOSIS = {
  MISSING_URL: 'No Apps Script URL is saved for this institute. Set it in Admin \u2192 Institutes.',
  DEV_URL: 'The saved URL ends in /dev. A /dev URL only works inside the editor with the owner signed in and always returns HTML to a server. Deploy \u2192 New deployment \u2192 Web app and save the /exec URL.',
  EDITOR_URL: 'The saved URL is an editor link, not a Web App endpoint. Use Deploy \u2192 New deployment \u2192 Web app and copy the /exec URL.',
  NOT_APPS_SCRIPT: 'The saved URL is not a script.google.com Web App URL.',
  NOT_EXEC: 'The saved URL is not a deployed Web App endpoint. It must end in /exec.',
  GOOGLE_LOGIN_PAGE: 'Google returned its sign-in page, so the deployment is not public. Re-deploy with "Who has access: Anyone" (Execute as: Me).',
  AUTHORIZATION_REQUIRED: 'The deployment requires authorization. Open the script once, run any function to accept the permission prompt, then re-deploy with Execute as: Me.',
  NO_PERMISSION: 'The deployment is access-restricted. Re-deploy with "Who has access: Anyone".',
  NOT_FOUND: 'Google could not find this deployment (404). The deployment id is stale - create a New deployment and save its /exec URL.',
  DEPLOYMENT_UNAVAILABLE: 'The deployment is not currently available. Confirm it is still active, or create a New deployment.',
  MISSING_HANDLER: 'The deployed version has no doGet/doPost. Re-deploy the current code as a New deployment.',
  SCRIPT_ERROR_PAGE: 'The script threw before it could return JSON. Check the Apps Script execution log.',
  UNFOLLOWED_REDIRECT: 'The redirect chain to script.googleusercontent.com did not complete.',
  QUOTA_EXCEEDED: 'Apps Script quota or execution-time limit was hit. It should recover on its own.',
  UNEXPECTED_HTML: 'Apps Script returned an HTML page instead of JSON. Confirm the deployment is active and public.',
  NON_JSON: 'Apps Script returned a non-JSON body. Every handler must return ContentService JSON.',
  BAD_STATUS: 'Apps Script returned an unexpected HTTP status.',
  TIMEOUT: 'Apps Script did not respond in time. A long-running script or Google-side contention.',
  NETWORK: 'The request to Apps Script failed at the network level.',
};

// Only transient conditions are worth a second attempt. A misconfigured
// deployment is retried zero times - retrying it is what produced the log flood.
const RETRYABLE = new Set(['QUOTA_EXCEEDED', 'DEPLOYMENT_UNAVAILABLE', 'SCRIPT_ERROR_PAGE', 'UNFOLLOWED_REDIRECT', 'BAD_STATUS', 'TIMEOUT', 'NETWORK']);
const CONFIG_ERROR = new Set(['MISSING_URL', 'DEV_URL', 'EDITOR_URL', 'NOT_APPS_SCRIPT', 'NOT_EXEC', 'GOOGLE_LOGIN_PAGE', 'AUTHORIZATION_REQUIRED', 'NO_PERMISSION', 'NOT_FOUND', 'MISSING_HANDLER']);

// One log line per cause per minute, instead of one per failed request.
const logSeen = new Map();
function logOnce(key, message) {
  const now = Date.now();
  const last = logSeen.get(key) || 0;
  if (now - last < 60000) return;
  logSeen.set(key, now);
  if (logSeen.size > 200) for (const [k, t] of logSeen) if (now - t > 300000) logSeen.delete(k);
  console.error(message);
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal, timeout: timeoutMs });
  } finally {
    clearTimeout(timer);
  }
}

// One attempt: send, follow Google's redirect chain as GET, then validate.
async function attemptAppsScript(url, method, body, budgetMs) {
  const startedAt = Date.now();
  const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Accept-Encoding': 'gzip,deflate' };
  let response;
  try {
    response = await fetchWithTimeout(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      redirect: 'manual',
      agent: agentFor(url),
      compress: true,
    }, Math.min(UPSTREAM_TIMEOUT_MS, budgetMs));
  } catch (err) {
    const aborted = err.name === 'AbortError' || err.type === 'request-timeout';
    return { ok: false, code: aborted ? 'TIMEOUT' : 'NETWORK', detail: err.message, finalUrl: url };
  }

  // Apps Script answers a POST with 302 to script.googleusercontent.com and the
  // JSON lives at the target. The original code followed ONE hop; Google
  // sometimes uses more, and the extra hop's HTML interstitial was being read as
  // the response body. Follow the whole chain, as GET, with a hard cap.
  let finalUrl = url;
  let hops = 0;
  while ([301, 302, 303, 307, 308].includes(response.status) && hops < MAX_REDIRECTS) {
    const location = response.headers.get('location');
    if (!location) break;
    finalUrl = new URL(location, finalUrl).toString();
    hops++;
    const remaining = budgetMs - (Date.now() - startedAt);
    if (remaining <= 0) return { ok: false, code: 'TIMEOUT', detail: 'budget exhausted following redirects', finalUrl };
    try {
      response = await fetchWithTimeout(finalUrl, {
        method: 'GET',
        headers,
        redirect: 'manual',
        agent: agentFor(finalUrl),
        compress: true,
      }, Math.min(UPSTREAM_TIMEOUT_MS, remaining));
    } catch (err) {
      const aborted = err.name === 'AbortError' || err.type === 'request-timeout';
      return { ok: false, code: aborted ? 'TIMEOUT' : 'NETWORK', detail: err.message, finalUrl };
    }
  }

  const status = response.status;
  const contentType = String(response.headers.get('content-type') || '');
  const text = await response.text();
  const head = text.slice(0, 512).trimStart();

  // VALIDATION ORDER: HTML sniff -> status -> JSON.parse.
  // HTML is checked first because Google serves its login/error pages with a
  // 200, so trusting the status alone is exactly how HTML got this far before.
  const looksHtml = /^<(?:!doctype|html|\?xml)/i.test(head) || /^text\/html/i.test(contentType);
  if (looksHtml) {
    return { ok: false, code: classifyHtmlBody(text, status), status, contentType, finalUrl };
  }
  if (status < 200 || status >= 300) {
    return { ok: false, code: 'BAD_STATUS', status, contentType, finalUrl, detail: text.slice(0, 200) };
  }
  try {
    return { ok: true, data: JSON.parse(text), status, contentType, finalUrl };
  } catch {
    return { ok: false, code: 'NON_JSON', status, contentType, finalUrl, detail: text.slice(0, 200) };
  }
}

async function proxyToAppsScript(rawUrl, method = 'GET', body = null) {
  const base = normaliseAppsScriptUrl(rawUrl);
  const query = String(rawUrl || '').includes('?') ? String(rawUrl).slice(String(rawUrl).indexOf('?')) : '';
  const urlClass = classifyAppsScriptUrl(base);
  const action = (body && body.action) || (query.match(/action=([A-Za-z]+)/) || [])[1] || method;

  // Fail fast on a bad URL: no network call, no 20s wait, no retry.
  if (urlClass !== 'OK') {
    logOnce(`url:${urlClass}`, `[AppsScript] ${urlClass} endpoint=${safeUrlLabel(base)} action=${action} \u2014 ${DIAGNOSIS[urlClass]}`);
    return { success: false, error: DIAGNOSIS[urlClass], code: urlClass, configurationError: true, upstreamFailure: true };
  }

  const target = base + query;
  const deadline = Date.now() + UPSTREAM_TOTAL_BUDGET_MS;
  let last = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    last = await attemptAppsScript(target, method, body, remaining);
    if (last.ok) return last.data;

    // A write is NEVER replayed. addStudent/updateFees are not idempotent, and
    // a retried POST is how duplicate students and duplicate fee rows appear.
    if (method !== 'GET') break;
    if (!RETRYABLE.has(last.code)) break;
    if (deadline - Date.now() <= 800) break;
    await new Promise((r) => setTimeout(r, 600));
  }

  const code = (last && last.code) || 'NETWORK';
  let finalHost = '';
  try { finalHost = last && last.finalUrl ? new URL(last.finalUrl).host : ''; } catch {}

  // One structured, secret-free line with everything needed to fix it. The HTML
  // body itself is deliberately NOT logged - it is megabytes of Google markup
  // and was the reason the log was unreadable.
  logOnce(`resp:${code}:${action}`, [
    `[AppsScript] ${code}`,
    `action=${action}`,
    `method=${method}`,
    `httpStatus=${last && last.status !== undefined ? last.status : 'n/a'}`,
    `contentType=${(last && last.contentType) || 'n/a'}`,
    `endpoint=${safeUrlLabel(base)}`,
    finalHost ? `finalHost=${finalHost}` : '',
    `\u2014 ${DIAGNOSIS[code] || 'Unexpected Apps Script failure.'}`,
  ].filter(Boolean).join(' '));

  return {
    success: false,
    error: DIAGNOSIS[code] || 'Apps Script request failed.',
    code,
    configurationError: CONFIG_ERROR.has(code),
    upstreamFailure: true,
  };
}

// An upstream failure must NOT look like success.
// Previously every route did res.json(data) with HTTP 200 even when data was
// { success:false, error:'<!DOCTYPE html>...' }. The Students page reads
// res.data.data || [], so a hard failure rendered as "No students yet" - an
// empty list that looked like real, correct data. Now it is a 502 and the UI
// shows one real error.
function respond(res, data, extra) {
  if (data && data.upstreamFailure) {
    return res.status(502).json({ success: false, error: data.error, code: data.code });
  }
  if (data && data.success === false && data.error) {
    return res.status(400).json(data);
  }
  return res.json(extra ? { ...data, ...extra } : data);
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
    respond(res, data);
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
    respond(res, data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add student' });
  }
});

// Exactly ONE upstream call per save. Apps Script now returns the saved row
// (and syncs the denormalised name into Fees/Attendance in the same execution),
// so the client can update its state from this response instead of refetching
// the whole student list.
router.put('/students/:sid', requireInstitute, async (req, res) => {
  try {
    const { appsScriptUrl, id } = req.user;
    const data = await proxyToAppsScript(appsScriptUrl, 'POST', {
      action: 'updateStudent', studentId: req.params.sid, ...req.body
    });
    bustCache(id);
    respond(res, data);
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
    respond(res, data);
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
    respond(res, data);
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
    respond(res, data);
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
    respond(res, data, { feeCollectionCycle: cycle });
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
    respond(res, data);
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
    respond(res, data);
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
    respond(res, data);
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
    respond(res, data);
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
    respond(res, data);
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
    respond(res, data);
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
    respond(res, data);
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
    respond(res, data);
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
    respond(res, data);
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
    respond(res, data);
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
    respond(res, data);
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
    respond(res, data);
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
    respond(res, data);
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
    respond(res, data);
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
    respond(res, data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete slot' });
  }
});


// \u2500\u2500\u2500 APPS SCRIPT HEALTH CHECK \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Answers "is this institute's Apps Script deployment actually reachable, and
// if not, exactly which of the HTML causes is it?" without reading logs.
// Bypasses the cache on purpose. Secrets are masked.
router.get('/apps-script-health', requireInstitute, async (req, res) => {
  const { appsScriptUrl } = req.user;
  const base = normaliseAppsScriptUrl(appsScriptUrl);
  const urlClass = classifyAppsScriptUrl(base);

  if (urlClass !== 'OK') {
    return res.status(200).json({
      ok: false, endpoint: safeUrlLabel(base), urlShape: urlClass,
      usesExec: /\/exec$/.test(base), urlValid: false,
      code: urlClass, diagnosis: DIAGNOSIS[urlClass],
    });
  }

  const startedAt = Date.now();
  const probe = await attemptAppsScript(`${base}?action=getStudents`, 'GET', null, UPSTREAM_TIMEOUT_MS);
  let finalHost = '';
  try { finalHost = probe.finalUrl ? new URL(probe.finalUrl).host : ''; } catch {}

  const rows = probe.ok && probe.data && Array.isArray(probe.data.data) ? probe.data.data.length : null;
  res.status(200).json({
    ok: !!probe.ok,
    endpoint: safeUrlLabel(base),
    urlShape: urlClass,
    usesExec: true,
    urlValid: true,
    elapsedMs: Date.now() - startedAt,
    httpStatus: probe.status !== undefined ? probe.status : null,
    contentType: probe.contentType || null,
    finalHost,
    jsonParsed: !!probe.ok,
    contractOk: !!(probe.ok && probe.data && probe.data.success === true),
    studentRows: rows,
    code: probe.ok ? null : probe.code,
    diagnosis: probe.ok ? 'Apps Script responded with valid JSON.' : (DIAGNOSIS[probe.code] || 'Unexpected failure.'),
  });
});

module.exports = router;