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
const lastGood = new Map();          // key -> { data, ts } last successful payload

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
  const ts = Date.now();
  cache.set(key, {
    data,
    ts,
    url: url || (prev && prev.url) || null,
    mustRevalidate: false,
  });
  // Survives TTL eviction on purpose: it is the fallback that stops a dead
  // deployment from rendering the whole app as zeros.
  lastGood.set(key, { data, ts });
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

// ROOT CAUSE of "saving a student takes 30 seconds".
// This used to flag every cached key for the institute AND immediately re-warm
// all of them through warmKeys() — six or more Apps Script calls, run one after
// another. Google serialises concurrent executions of a single Apps Script
// project, so that background storm sat directly in front of the very request
// the user was waiting for (the refetch after Save), and every one of those
// calls hit the same broken deployment and logged the same HTML error.
// Now a write only INVALIDATES. The next read of a given key repopulates it —
// exactly one upstream call, only for data somebody actually asked for.
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

// ─── APPS SCRIPT ENDPOINT CONTRACT ──────────────────────────────────────
// ROOT CAUSE of the repeated Render log line
//   "Apps Script non-JSON response: <!DOCTYPE html>..."
// A deployed Apps Script Web App endpoint is ALWAYS exactly:
//   https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec
// Anything else makes Google serve an HTML page rather than the script:
//   .../dev            → editor-bound URL, requires a Google login → HTML sign-in page
//   .../macros/d/...   → the project URL, not a deployment      → HTML editor page
//   trailing slash     → 404                                     → HTML error page
//   access ≠ "Anyone"  → consent/sign-in wall                    → HTML login page
//   archived/deleted deployment → "unable to open the file"       → HTML error page
// The old code parsed the body, failed, logged the raw HTML and returned it to
// the browser as an "error" string. Nothing validated the HTTP status or the
// Content-Type, nothing timed the request out, and the failure was never
// classified — so the same request was retried forever and the log filled up.
const APPS_SCRIPT_EXEC = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;

// Hard ceiling for one upstream attempt. Deliberately BELOW the browser's
// 30s axios timeout, so a stuck Apps Script call surfaces as a clean 502 from
// our own API instead of the client-side "timeout of 30000ms exceeded".
// This is not "raising a timeout" — previously there was NO timeout at all,
// so a hanging Google request held the socket until the client gave up.
const UPSTREAM_TIMEOUT_MS = 20000;
const UPSTREAM_TOTAL_BUDGET_MS = 26000;
const MAX_REDIRECTS = 5;

function normaliseAppsScriptUrl(raw) {
  let url = String(raw || '').trim().replace(/\s+/g, '');
  url = url.replace(/[?#].*$/, '');   // a query string stored on the URL breaks ?action=
  url = url.replace(/\/+$/, '');      // trailing slash → 404 HTML
  return url;
}

function classifyAppsScriptUrl(url) {
  if (!url) return 'MISSING_URL';
  if (APPS_SCRIPT_EXEC.test(url)) return 'OK';
  if (/\/dev$/.test(url)) return 'DEV_URL';
  if (/script\.google\.com\/macros\/d\//.test(url) || /\/edit$/.test(url)) return 'EDITOR_URL';
  if (!/^https:\/\/script\.google\.com\//.test(url)) return 'NOT_APPS_SCRIPT';
  return 'NOT_EXEC';
}

// Never log or return the full deployment id — it is a capability URL.
function safeUrlLabel(url) {
  const m = String(url || '').match(/^https:\/\/script\.google\.com\/macros\/s\/([A-Za-z0-9_-]+)\/(\w+)$/);
  if (m) return `script.google.com/macros/s/…${m[1].slice(-4)}/${m[2]}`;
  try {
    return new URL(String(url)).host + '/…';
  } catch {
    return '<invalid url>';
  }
}

// Turn an HTML body into a precise, actionable, secret-free diagnosis.
function classifyHtmlBody(body, status, finalUrl) {
  const s = String(body || '').slice(0, 4000);
  const l = s.toLowerCase();
  if (/accounts\.google\.com|servicelogin|signin\/v\d/i.test(s) || /sign in\s*[-–]\s*google accounts/i.test(l)) return 'GOOGLE_LOGIN_PAGE';
  if (/authoriz|authoris/i.test(l) && /required/i.test(l)) return 'AUTHORIZATION_REQUIRED';
  if (/you need permission|request access|do(?:n.t| not) have access/i.test(l)) return 'NO_PERMISSION';
  if (/moved temporarily|the document has moved/i.test(l)) return 'UNFOLLOWED_REDIRECT';
  if (/service invoked too many times|too many times for one day|exceeded.{0,20}quota|rate limit/i.test(l)) return 'QUOTA_EXCEEDED';
  if (/unable to open the file|file at this time/i.test(l)) return 'DEPLOYMENT_UNAVAILABLE';
  if (/script function not found/i.test(l)) return 'MISSING_HANDLER';
  if (/server error occurred|exception:|scripterror/i.test(l)) return 'SCRIPT_ERROR_PAGE';
  // A 404 only means "dead deployment" when Google rejects the /exec id itself
  // on script.google.com. If we were redirected to script.googleusercontent.com
  // first, Google ACCEPTED the deployment - so this 404 is a failed content
  // fetch (the one-shot user_content_key was consumed or expired, or the run
  // produced no retrievable output). That is transient, not configuration.
  if (status === 404) {
    let h = '';
    try { h = new URL(String(finalUrl || '')).host; } catch { h = ''; }
    return h.indexOf('googleusercontent.com') !== -1 ? 'CONTENT_FETCH_404' : 'NOT_FOUND';
  }
  return 'UNEXPECTED_HTML';
}

const DIAGNOSIS = {
  MISSING_URL:            'This institute has no Apps Script Web App URL saved. Add it in Admin → Institutes.',
  DEV_URL:                'The saved Apps Script URL ends in /dev. That is the editor-only URL and it always returns a Google sign-in page. Use the /exec URL from Deploy → Manage deployments.',
  EDITOR_URL:             'The saved URL points at the Apps Script project, not a deployment. Use Deploy → New deployment → Web app and copy the /exec URL.',
  NOT_APPS_SCRIPT:        'The saved Apps Script URL is not a script.google.com address.',
  NOT_EXEC:               'The saved Apps Script URL is not a Web App /exec endpoint.',
  GOOGLE_LOGIN_PAGE:      'Google served a sign-in page. Re-deploy the Web App with Execute as: Me and Who has access: Anyone.',
  AUTHORIZATION_REQUIRED: 'The Apps Script deployment has not been authorised. Open the script, run any function once and accept the Sheets + Gmail permissions, then re-deploy.',
  NO_PERMISSION:          'The Apps Script deployment is not shared publicly. Re-deploy with Who has access: Anyone.',
  UNFOLLOWED_REDIRECT:    'Google returned a redirect that could not be followed to a JSON result.',
  QUOTA_EXCEEDED:         'Google Apps Script quota or rate limit hit. The request was not processed; it will succeed again once the quota window resets.',
  DEPLOYMENT_UNAVAILABLE: 'The Apps Script deployment is archived, deleted or temporarily unavailable. Create a new deployment and update the saved URL.',
  MISSING_HANDLER:        'The deployed Apps Script has no doGet/doPost handler. Re-deploy the current Code.gs.',
  SCRIPT_ERROR_PAGE:      'The Apps Script threw before it could return JSON. Check the script executions log.',
  NOT_FOUND:              'Google rejected the deployment id itself (404 on /exec). That deployment no longer exists — create a New deployment and save its /exec URL.',
  CONTENT_FETCH_404:      'Google accepted the request and redirected, then could not return the result (404 on the content host). The deployment is FINE - the script run produced no retrievable output, normally because several calls hit one script project at once. Retried automatically.',
  UNEXPECTED_HTML:        'Apps Script returned an HTML page instead of JSON.',
  NON_JSON:               'Apps Script returned a body that is not valid JSON.',
  BAD_STATUS:             'Apps Script returned an unexpected HTTP status.',
  TIMEOUT:                'Apps Script did not respond in time. The spreadsheet may be very large or Google may be throttling the script.',
  NETWORK:                'Could not reach Google Apps Script.',
};

// Transient classes are worth exactly one retry; configuration classes are not
// (retrying a wrong URL forever is what flooded the logs).
const RETRYABLE = new Set(['QUOTA_EXCEEDED', 'DEPLOYMENT_UNAVAILABLE', 'SCRIPT_ERROR_PAGE', 'UNFOLLOWED_REDIRECT', 'BAD_STATUS', 'TIMEOUT', 'NETWORK', 'CONTENT_FETCH_404']);
const CONFIG_ERROR = new Set(['MISSING_URL', 'DEV_URL', 'EDITOR_URL', 'NOT_APPS_SCRIPT', 'NOT_EXEC', 'GOOGLE_LOGIN_PAGE', 'AUTHORIZATION_REQUIRED', 'NO_PERMISSION', 'NOT_FOUND', 'MISSING_HANDLER']);

// Log throttling: one line per (code + endpoint) per minute. The same broken
// deployment used to print a 500-character HTML dump on every single request.
const logSeen = new Map();
function logOnce(key, message) {
  const now = Date.now();
  if (now - (logSeen.get(key) || 0) < 60000) return;
  logSeen.set(key, now);
  console.error(message);
}

function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal, timeout: timeoutMs })
    .finally(() => clearTimeout(timer));
}

// One attempt: send, follow redirects manually, then VALIDATE
// status → content-type → JSON-parseability before trusting the body.
async function attemptAppsScript(url, method, body, budgetMs) {
  const started = Date.now();
  const remaining = () => Math.max(1000, Math.min(UPSTREAM_TIMEOUT_MS, budgetMs - (Date.now() - started)));

  const baseHeaders = { 'Accept': 'application/json', 'Accept-Encoding': 'gzip,deflate' };
  let response;
  try {
    response = await fetchWithTimeout(url, {
      method,
      headers: body ? { ...baseHeaders, 'Content-Type': 'application/json' } : baseHeaders,
      body: body ? JSON.stringify(body) : undefined,
      redirect: 'follow',
      follow: MAX_REDIRECTS,
      agent: agentFor(url),
      compress: true,
    }, remaining());
  } catch (err) {
    const code = err && (err.name === 'AbortError' || err.type === 'request-timeout') ? 'TIMEOUT' : 'NETWORK';
    return { ok: false, code, status: 0, contentType: '', finalUrl: url };
  }

  // Apps Script answers /exec with a 302 to script.googleusercontent.com.
  // node-fetch follows that hop itself and downgrades POST -> GET on 301/302,
  // which is exactly what Apps Script requires. Re-issuing the hop by hand
  // risked dropping the one-shot user_content_key that the echo URL carries,
  // so redirect handling is left to the library.
  const finalUrl = response.url || url;

  const status = response.status;
  const contentType = String(response.headers.get('content-type') || '');
  let text;
  try {
    text = await response.text();
  } catch {
    return { ok: false, code: 'NETWORK', status, contentType, finalUrl };
  }
  const head = text.slice(0, 512).trimStart();

  // 1. HTML is never a valid response, whatever the status says.
  if (/^<(?:!doctype|html|\?xml)/i.test(head) || /\btext\/html\b/i.test(contentType)) {
    return { ok: false, code: classifyHtmlBody(text, status, finalUrl), status, contentType, finalUrl };
  }
  // 2. Validate the status.
  if (status < 200 || status >= 300) {
    return { ok: false, code: 'BAD_STATUS', status, contentType, finalUrl };
  }
  // 3. Validate JSON parseability.
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, code: 'NON_JSON', status, contentType, finalUrl };
  }
  return { ok: true, data, status, contentType, finalUrl };
}

// ─── PROXY TO APPS SCRIPT ──────────────────────────────────────────────
// Contract kept exactly as the rest of this file already expects:
//   success → the parsed Apps Script JSON, e.g. { success: true, data: [...] }
//   failure → { success: false, error, code, upstreamFailure: true }
// `upstreamFailure` lets the route reply 502 instead of a 200 that the browser
// would happily render as "0 students".
// ─── CIRCUIT BREAKER ───────────────────────────────────
// ROOT CAUSE of "every page is slow and everything reads zero".
// When the deployment itself is gone (404 / stale id / login wall) EVERY key
// misses, and each miss burned the full 20s ceiling. Opening the dashboard then
// meant seven endpoints x 20s of dead waiting before anything could paint.
// After two consecutive CONFIGURATION-level failures we stop calling Google for
// 45s and answer instantly with the same diagnosis. Any success clears it.
// Transient failures (timeout/quota) never trip it, so a slow-but-alive script
// is still retried normally.
const BREAKER_THRESHOLD = 2;
const BREAKER_COOLDOWN_MS = 45000;
const breaker = new Map();          // endpoint -> { fails, code, until }

function breakerState(key) {
  const b = breaker.get(key);
  if (!b || !b.until || b.until <= Date.now()) return null;
  return b;
}

function breakerRecord(key, code, ok) {
  if (ok) { breaker.delete(key); return; }
  const b = breaker.get(key) || { fails: 0 };
  b.fails += 1;
  b.code = code;
  if (CONFIG_ERROR.has(code) && b.fails >= BREAKER_THRESHOLD) {
    b.until = Date.now() + BREAKER_COOLDOWN_MS;
  }
  breaker.set(key, b);
}

// ─── ONE CALL AT A TIME PER ENDPOINT ─────────────────────────────────
// ROOT CAUSE of the mixed TIMEOUT + 404 log.
// Google runs at most ONE execution per script project at a time. Everything
// else queues inside Google while our 20s clock keeps running. Loading the app
// fired seven GETs at once, which produced BOTH failures seen in the log:
//   • requests stuck in Google's queue blew our timeout      -> TIMEOUT
//   • requests that did run had their one-shot content key go
//     stale before we could fetch the body                   -> 404 on the
//                                                               content host
// SUPERSEDED in round 6. Queueing was the wrong cure - see getBundle below.
// Old note kept for context: it was not thought to be slower in
// practice: repeat reads are answered by CacheService in ~10ms, and the backend
// cache means a warm page makes no upstream call at all.
// The per-endpoint queue that used to live here has been REMOVED.
// It converted "six parallel reads" into "one slow read plus five dropped
// before they were ever sent" - the six httpStatus=0 TIMEOUT lines in the
// Render log, and the 20s dashboard. Requests are issued directly again; the
// pile-up is cured by asking for everything in ONE call (see fetchBundle).

async function proxyToAppsScript(rawUrl, method = 'GET', body = null) {
  const base = normaliseAppsScriptUrl(rawUrl);
  const query = String(rawUrl || '').includes('?') ? String(rawUrl).slice(String(rawUrl).indexOf('?')) : '';
  const urlClass = classifyAppsScriptUrl(base);

  // Fail fast on a misconfigured endpoint. No network call, no 30s wait.
  if (urlClass !== 'OK') {
    logOnce(`url:${urlClass}:${safeUrlLabel(base)}`,
      `[AppsScript] ${urlClass} for ${safeUrlLabel(base)} — ${DIAGNOSIS[urlClass]}`);
    return { success: false, error: DIAGNOSIS[urlClass], code: urlClass, upstreamFailure: true };
  }

  const url = base + query;

  // Breaker open: answer immediately rather than waiting on a known-dead
  // endpoint. This is not hiding the error - it is the SAME diagnosis, just
  // delivered in 1ms instead of 20000ms.
  const tripped = breakerState(base);
  if (tripped) {
    return {
      success: false,
      error: DIAGNOSIS[tripped.code] || 'Apps Script is not reachable.',
      code: tripped.code,
      configurationError: CONFIG_ERROR.has(tripped.code),
      upstreamFailure: true,
      breakerOpen: true,
    };
  }

  // Writes get priority in the lane and are never dropped unsent.
  const isWrite = method !== 'GET';
  const deadline = Date.now() + UPSTREAM_TOTAL_BUDGET_MS;
  let last = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const budget = deadline - Date.now();
    if (budget < 1500) break;
    // Budget is re-read inside the queue: time spent waiting for our turn must
    // count against the deadline, otherwise a queue of seven could run far past
    // the frontend's own timeout. If our turn arrives too late we skip the call
    // entirely so cachedGet can serve last-known-good data instead.
    // Sent immediately, never parked behind another request.
    last = await attemptAppsScript(url, method, body, isWrite ? Math.max(12000, budget) : budget);
    if (last.ok) { breakerRecord(base, null, true); return last.data; }
    if (!RETRYABLE.has(last.code)) break;
    // A write is NOT replayed — Apps Script may already have committed the row,
    // and replaying it could duplicate a student or a fee record.
    if (method !== 'GET') break;
    if (attempt === 0) await new Promise((r) => setTimeout(r, 600));
  }

  const code = (last && last.code) || 'NETWORK';
  breakerRecord(base, code, false);
  const action = /action=([A-Za-z]+)/.exec(query);
  logOnce(`resp:${code}:${action ? action[1] : method}`, [
    '[AppsScript] request failed',
    `code=${code}`,
    `method=${method}`,
    `action=${action ? action[1] : (body && body.action) || 'n/a'}`,
    `httpStatus=${last ? last.status : 0}`,
    // For a write this is the difference between 'definitely did not happen'
    // and 'may have been committed before we gave up'.
    `sent=${last && last.notSent ? 'no' : 'yes'}`,
    `contentType=${last ? (last.contentType || 'n/a') : 'n/a'}`,
    `endpoint=${safeUrlLabel(base)}`,
    `finalHost=${last && last.finalUrl ? (() => { try { return new URL(last.finalUrl).host; } catch { return 'n/a'; } })() : 'n/a'}`,
    `→ ${DIAGNOSIS[code] || 'Unknown Apps Script failure.'}`,
  ].join(' | '));

  return {
    success: false,
    error: DIAGNOSIS[code] || 'Apps Script did not return a valid response.',
    code,
    configurationError: CONFIG_ERROR.has(code),
    upstreamFailure: true,
  };
}

// Every route replies through this, so an upstream failure can never be
// mistaken for an empty-but-successful dataset by the frontend.
function respond(res, data, extra) {
  if (data && data.upstreamFailure) {
    return res.status(502).json({ success: false, error: data.error, code: data.code });
  }
  if (data && data.success === false && data.error) {
    return res.status(400).json({ success: false, error: data.error });
  }
  return res.json(extra ? { ...data, ...extra } : data);
}

// ─── CACHED GET HELPER ───────────────────────────────────────────────────────
// ─── ONE UPSTREAM CALL SERVES EVERY PAGE ─────────────────────────────
// ROOT CAUSE of "the dashboard takes 20 seconds".
// A cold load asked Apps Script for students, attendance, fees, enquiries,
// batches, schedule and the dashboard SEPARATELY. Google runs one execution per
// script project at a time, so those seven calls could only ever run one after
// another. getBundle returns all seven from a single execution, and the result
// is fanned out into the individual cache keys - so the other six routes are
// answered from memory with no upstream call at all.
const bundleInFlight = new Map();
const bundleUnsupported = new Set();   // bases whose deployed script predates getBundle

async function fetchBundle(id, base, cycle) {
  const key = `${id}:__bundle:${cycle}`;
  const pending = bundleInFlight.get(key);
  if (pending) return pending;

  const promise = (async () => {
    const res = await proxyToAppsScript(`${base}?action=getBundle&cycle=${encodeURIComponent(cycle)}`);
    if (!isUsable(res)) {
      // An older deployment replies 'Unknown action'. Remember that and stop
      // asking, so we never pay for a wasted round trip more than once.
      if (res && /unknown action/i.test(String(res.error || ''))) bundleUnsupported.add(base);
      return res;
    }
    if (!res.data) { bundleUnsupported.add(base); return res; }

    const d = res.data;
    const fan = [
      [d.students,   `${id}:students`],
      [d.attendance, `${id}:attendance:all`],
      [d.fees,       `${id}:fees:${cycle}`],
      [d.enquiries,  `${id}:enquiries`],
      [d.batches,    `${id}:batches`],
      [d.schedule,   `${id}:schedule`],
      [d.dashboard,  `${id}:dashboard:${cycle}`],
    ];
    let filled = 0;
    for (const [payload, cacheKey] of fan) {
      if (isUsable(payload)) { setCached(cacheKey, payload, base); filled += 1; }
    }
    if (!filled) bundleUnsupported.add(base);
    return res;
  })().finally(() => bundleInFlight.delete(key));

  bundleInFlight.set(key, promise);
  return promise;
}

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
  // Fill EVERY key from one bundled execution first, so the other pages are
  // already in memory by the time they ask. The fee cycle is resolved the same
  // way the /fees and /dashboard-summary routes resolve it, so the keys written
  // here are exactly the keys those routes look up.
  const bundleBase = normaliseAppsScriptUrl(url);
  if (!bundleUnsupported.has(bundleBase) && !String(cacheKey).includes(':__bundle:')) {
    try {
      const id = String(cacheKey).split(':')[0];
      await fetchBundle(id, bundleBase, await getFeeCycle(id));
      const filled = cacheEntry(cacheKey);
      if (filled && filled.state === 'fresh') return filled.data;
    } catch {
      // Fall through to this key's own single-action call below.
    }
  }

  const data = await fetchUpstream(cacheKey, url);
  if (isUsable(data)) {
    setCached(cacheKey, data, url);
    return data;
  }

  // Upstream failed. If we ever held good data for this key, serve THAT rather
  // than letting the page render as zeros. A broken Sheets connection should
  // degrade to "last known figures", not to a screen of 0s. The response
  // declares stale: true so the UI can say so honestly, and the underlying
  // failure is still logged and still classified.
  const held = lastGood.get(cacheKey);
  if (held && isUsable(held.data)) {
    return {
      ...held.data,
      stale: true,
      staleSince: held.ts,
      upstreamError: data && data.error,
      code: data && data.code,
    };
  }
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

router.put('/students/:sid', requireInstitute, async (req, res) => {
  try {
    const { appsScriptUrl, id } = req.user;
    // ONE upstream call. Apps Script returns the saved row (and how many Fees /
    // Attendance identity cells it synced), so the frontend can update just
    // that student in state instead of refetching the whole list.
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

// ─── APPS SCRIPT DIAGNOSTICS ────────────────────────────────────────────
// Lets the Apps Script integration be verified without reading Render logs.
// Reports the exact facts needed to diagnose an HTML response, with the
// deployment id masked so the capability URL is never exposed.
router.get('/apps-script-health', requireInstitute, async (req, res) => {
  const { appsScriptUrl } = req.user;
  const base = normaliseAppsScriptUrl(appsScriptUrl);
  const urlClass = classifyAppsScriptUrl(base);
  const report = {
    endpoint: safeUrlLabel(base),
    urlShape: urlClass,
    usesExec: /\/exec$/.test(base),
    urlValid: urlClass === 'OK',
  };
  if (urlClass !== 'OK') {
    return res.status(502).json({ success: false, ...report, code: urlClass, diagnosis: DIAGNOSIS[urlClass] });
  }
  const started = Date.now();
  const probe = await attemptAppsScript(`${base}?action=getStudents`, 'GET', null, UPSTREAM_TIMEOUT_MS);
  const elapsedMs = Date.now() - started;
  let finalHost = 'n/a';
  try { finalHost = new URL(probe.finalUrl).host; } catch {}
  if (!probe.ok) {
    return res.status(502).json({
      success: false, ...report, elapsedMs,
      httpStatus: probe.status, contentType: probe.contentType || null, finalHost,
      code: probe.code, diagnosis: DIAGNOSIS[probe.code] || 'Unknown Apps Script failure.',
    });
  }
  return res.json({
    success: true, ...report, elapsedMs,
    httpStatus: probe.status, contentType: probe.contentType || null, finalHost,
    jsonParsed: true,
    contractOk: probe.data && probe.data.success === true && Array.isArray(probe.data.data),
    studentRows: probe.data && Array.isArray(probe.data.data) ? probe.data.data.length : null,
  });
});

module.exports = router;
