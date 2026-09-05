import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../lib/api";
import toast from "react-hot-toast";

/* ============================================================================
   NOTIFICATION BELL + DRAWER  (institute portal)

   Sits in the existing header next to the institute chip. Nothing else in the
   header moves.

   PERFORMANCE NOTES - this component is mounted by InstituteLayout, which
   REMOUNTS on every navigation (see the session-poll comment in that file).
   Naively fetching on mount would therefore fire a request per page change.
   Instead:
     - The unread COUNT is cached at module scope with a timestamp, exactly
       like lastSessionCheck in InstituteLayout, so walking between tabs costs
       zero extra requests.
     - The notification LIST (the only payload with message bodies in it) is
       fetched when the drawer is opened, never on portal load.
     - There is NO polling. The count refreshes when the tab regains focus,
       throttled by the same timestamp.
   ========================================================================== */

// Shared across mounts so remounting the layout does not re-trigger the fetch.
const COUNT_TTL_MS = 60 * 1000;
let lastCountFetch = 0;
let cachedCount = null;
let inFlight = null;

const TYPE_META = {
  maintenance: {
    label: "Maintenance",
    tone: "#B45309",
    bg: "rgba(245,158,11,0.12)",
  },
  system_update: {
    label: "System Update",
    tone: "#1D4ED8",
    bg: "rgba(37,99,235,0.10)",
  },
  important: {
    label: "Important",
    tone: "#B91C1C",
    bg: "rgba(239,68,68,0.10)",
  },
  announcement: {
    label: "Announcement",
    tone: "#1D4ED8",
    bg: "rgba(37,99,235,0.10)",
  },
  feature_update: {
    label: "Feature Update",
    tone: "#15803D",
    bg: "rgba(34,197,94,0.10)",
  },
};
const typeMeta = (t) => TYPE_META[t] || TYPE_META.announcement;

const PRIORITY_META = {
  urgent: { label: "Urgent", tone: "#B91C1C", bg: "rgba(239,68,68,0.12)" },
  important: {
    label: "Important",
    tone: "#B45309",
    bg: "rgba(245,158,11,0.14)",
  },
};

const TYPE_ICON = {
  maintenance: (
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  ),
  system_update: (
    <>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </>
  ),
  important: (
    <>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),
  announcement: (
    <>
      <path d="M3 11l18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </>
  ),
  feature_update: (
    <path d="M12 2l2.4 7.2H22l-6 4.4 2.3 7.1-6.3-4.6-6.3 4.6L7.9 13.6 2 9.2h7.6z" />
  ),
};

function TypeIcon({ type, size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {TYPE_ICON[type] || TYPE_ICON.announcement}
    </svg>
  );
}

// "2 Sept, 4:15 PM" / "Just now" / "12 min ago"
function fmtWhen(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  if (diff >= 0 && diff < 60 * 1000) return "Just now";
  if (diff >= 0 && diff < 60 * 60 * 1000) {
    const m = Math.floor(diff / 60000);
    return m + (m === 1 ? " min ago" : " mins ago");
  }
  if (diff >= 0 && diff < 24 * 60 * 60 * 1000) {
    const h = Math.floor(diff / 3600000);
    return h + (h === 1 ? " hour ago" : " hours ago");
  }
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const preview = (msg, max = 108) => {
  const t = String(msg || "")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > max ? t.slice(0, max).trimEnd() + "\u2026" : t;
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(cachedCount === null ? 0 : cachedCount);
  const [items, setItems] = useState(null); // null = not loaded yet
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [portalHost, setPortalHost] = useState(null);

  const aliveRef = useRef(true);
  const btnRef = useRef(null);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  /* The design tokens are declared on .sc-app (see components/ds/DesignSystem.js),
     NOT on :root. Portalling to document.body would put this drawer outside
     that scope and every var(--sc-*) would resolve to nothing, so the drawer
     is mounted inside the portal shell instead. */
  useEffect(() => {
    setPortalHost(document.querySelector(".app-shell.sc-app") || document.body);
  }, []);

  // ---- unread count: module-throttled, survives layout remounts ----------
  const loadCount = useCallback(async (force) => {
    if (!force && Date.now() - lastCountFetch < COUNT_TTL_MS) {
      if (cachedCount !== null) setCount(cachedCount);
      return;
    }
    if (inFlight) {
      try {
        const shared = await inFlight;
        if (aliveRef.current && shared !== null) setCount(shared);
      } catch {
        /* handled by the original caller */
      }
      return;
    }

    lastCountFetch = Date.now();
    inFlight = (async () => {
      try {
        const res = await api.get("/api/notifications/unread-count", {
          timeout: 8000,
        });
        const n = Number(res?.data?.count) || 0;
        cachedCount = n;
        return n;
      } catch {
        // Silent by design: a failed badge must never interrupt the portal.
        return null;
      } finally {
        inFlight = null;
      }
    })();

    const n = await inFlight;
    if (aliveRef.current && n !== null) setCount(n);
  }, []);

  useEffect(() => {
    loadCount(false);
  }, [loadCount]);

  // Refresh when the tab regains focus. Throttled by the same timestamp, so
  // switching tabs repeatedly does not generate requests. No polling.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") loadCount(false);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [loadCount]);

  // ---- list: fetched only when the drawer opens --------------------------
  const loadList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/notifications?limit=20", {
        timeout: 12000,
      });
      if (!aliveRef.current) return;
      const list = Array.isArray(res?.data?.notifications)
        ? res.data.notifications
        : [];
      setItems(list);
      const unread = list.filter((n) => !n.read).length;
      cachedCount = unread;
      lastCountFetch = Date.now();
      setCount(unread);
    } catch (err) {
      if (!aliveRef.current) return;
      setError(
        err?.response?.data?.error ||
          (err?.code === "ECONNABORTED"
            ? "The server took too long to respond."
            : "Could not load notifications."),
      );
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, []);

  const openDrawer = () => {
    setOpen(true);
    setExpandedId(null);
    loadList();
  };

  const closeDrawer = useCallback(() => {
    setOpen(false);
    setExpandedId(null);
  }, []);

  // Escape to close + lock background scroll while the sheet is up.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, closeDrawer]);

  // ---- read state --------------------------------------------------------
  const openItem = async (n) => {
    const nextId = expandedId === n._id ? null : n._id;
    setExpandedId(nextId);
    if (nextId === null || n.read) return;

    // Optimistic: the badge updates immediately, as required.
    setItems((prev) =>
      (prev || []).map((x) => (x._id === n._id ? { ...x, read: true } : x)),
    );
    setCount((c) => {
      const next = Math.max(0, c - 1);
      cachedCount = next;
      return next;
    });

    try {
      await api.post("/api/notifications/" + n._id + "/read");
    } catch {
      // Roll back so the badge never lies about server state.
      setItems((prev) =>
        (prev || []).map((x) => (x._id === n._id ? { ...x, read: false } : x)),
      );
      setCount((c) => {
        const next = c + 1;
        cachedCount = next;
        return next;
      });
      toast.error("Could not mark as read");
    }
  };

  const markAll = async () => {
    if (markingAll) return;
    const snapshot = items;
    const prevCount = count;
    setMarkingAll(true);
    setItems((prev) => (prev || []).map((x) => ({ ...x, read: true })));
    setCount(0);
    cachedCount = 0;
    try {
      await api.post("/api/notifications/read-all");
      toast.success("All notifications marked as read");
    } catch {
      setItems(snapshot);
      setCount(prevCount);
      cachedCount = prevCount;
      toast.error("Could not mark all as read");
    } finally {
      setMarkingAll(false);
    }
  };

  const hasUnread = count > 0;
  const badgeText = count > 9 ? "9+" : String(count);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="nb-bell"
        onClick={openDrawer}
        aria-label={
          hasUnread ? count + " unread notifications" : "Notifications"
        }
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {hasUnread && (
          <span className="nb-badge" aria-hidden="true">
            {badgeText}
          </span>
        )}
      </button>

      {open &&
        portalHost &&
        createPortal(
          <div
            className="nb-host"
            role="presentation"
            onMouseDown={closeDrawer}
          >
            <aside
              className="nb-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Notifications"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <header className="nb-head">
                <div className="nb-grip" aria-hidden="true" />
                <div className="nb-head-row">
                  <div>
                    <h2 className="nb-title">Notifications</h2>
                    <p className="nb-sub">
                      {count > 0 ? count + " unread" : "You are all caught up"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="nb-close"
                    onClick={closeDrawer}
                    aria-label="Close notifications"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </header>

              <div className="nb-body">
                {loading && items === null && (
                  <div
                    className="nb-skwrap"
                    role="status"
                    aria-label="Loading notifications"
                  >
                    {[0, 1, 2].map((i) => (
                      <div
                        className="nb-sk-row"
                        key={i}
                        style={{ animationDelay: i * 70 + "ms" }}
                      >
                        <div className="sc-skel nb-sk-dot" />
                        <div className="nb-sk-lines">
                          <div className="sc-skel nb-sk-l1" />
                          <div className="sc-skel nb-sk-l2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!loading && error && (
                  <div className="nb-state">
                    <div
                      className="nb-state-ico nb-state-err"
                      aria-hidden="true"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                    <p className="nb-state-t">{error}</p>
                    <button
                      type="button"
                      className="sc-btn sc-btn-secondary sc-btn-sm"
                      onClick={loadList}
                    >
                      Try again
                    </button>
                  </div>
                )}

                {!loading && !error && items && items.length === 0 && (
                  <div className="nb-state">
                    <div className="nb-state-ico" aria-hidden="true">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    </div>
                    <p className="nb-state-t">No new notifications</p>
                    <p className="nb-state-s">
                      Announcements from Syncoptrac will appear here.
                    </p>
                  </div>
                )}

                {!error && items && items.length > 0 && (
                  <ul className="nb-list">
                    {items.map((n) => {
                      const tm = typeMeta(n.type);
                      const pm = PRIORITY_META[n.priority];
                      const isOpen = expandedId === n._id;
                      return (
                        <li
                          key={n._id}
                          className={
                            "nb-item" +
                            (n.read ? "" : " is-unread") +
                            (n.priority === "urgent" ? " is-urgent" : "") +
                            (isOpen ? " is-open" : "")
                          }
                        >
                          <button
                            type="button"
                            className="nb-item-btn"
                            onClick={() => openItem(n)}
                            aria-expanded={isOpen}
                          >
                            <span
                              className="nb-ico"
                              style={{ color: tm.tone, background: tm.bg }}
                              aria-hidden="true"
                            >
                              <TypeIcon type={n.type} />
                            </span>

                            <span className="nb-item-main">
                              <span className="nb-item-top">
                                <span className="nb-item-title">{n.title}</span>
                                {!n.read && (
                                  <span
                                    className="nb-dot"
                                    aria-label="Unread"
                                  />
                                )}
                              </span>

                              <span className="nb-meta">
                                <span
                                  className="nb-chip"
                                  style={{ color: tm.tone, background: tm.bg }}
                                >
                                  {tm.label}
                                </span>
                                {pm && (
                                  <span
                                    className="nb-chip"
                                    style={{
                                      color: pm.tone,
                                      background: pm.bg,
                                    }}
                                  >
                                    {pm.label}
                                  </span>
                                )}
                                <span className="nb-when">
                                  {fmtWhen(n.publishedAt)}
                                </span>
                              </span>

                              <span
                                className={
                                  "nb-msg" + (isOpen ? " nb-msg-full" : "")
                                }
                              >
                                {isOpen ? n.message : preview(n.message)}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {items && items.length > 0 && !error && (
                <footer className="nb-foot">
                  <button
                    type="button"
                    className="sc-btn sc-btn-secondary sc-btn-sm nb-foot-btn"
                    onClick={markAll}
                    disabled={markingAll || count === 0}
                  >
                    {markingAll ? "Marking\u2026" : "Mark all as read"}
                  </button>
                </footer>
              )}
            </aside>

            <style jsx>{`
              .nb-host {
                position: fixed;
                inset: 0;
                z-index: 70;
                display: flex;
                justify-content: flex-end;
                background: rgba(11, 31, 77, 0.42);
                backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px);
                animation: nb-fade var(--sc-d-base, 240ms) var(--sc-ease, ease)
                  both;
                /* The fixed dock stays exactly where it is. The drawer simply
                   ends above it, so its action row can never be covered. */
                padding-bottom: max(
                  var(--sc-dock-h, 0px),
                  env(safe-area-inset-bottom, 0px)
                );
              }
              .nb-panel {
                display: flex;
                flex-direction: column;
                width: 100%;
                max-width: 26rem;
                height: 100%;
                min-height: 0;
                background: var(--sc-card, #fff);
                border-left: 1px solid var(--sc-border, #e5e7eb);
                box-shadow: var(--sc-sh-4, 0 24px 48px rgba(11, 31, 77, 0.1));
                animation: nb-slide var(--sc-d-slow, 420ms) var(--sc-ease, ease)
                  both;
              }
              .nb-head {
                flex: none;
                padding: 16px 16px 12px;
                border-bottom: 1px solid var(--sc-border, #e5e7eb);
                background: var(--sc-card, #fff);
              }
              .nb-grip {
                display: none;
              }
              .nb-head-row {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 12px;
              }
              .nb-title {
                margin: 0;
                font-size: var(--sc-f-h3, 1.0625rem);
                font-weight: 700;
                letter-spacing: -0.01em;
                color: var(--sc-text, #111827);
              }
              .nb-sub {
                margin: 3px 0 0;
                font-size: var(--sc-f-xs, 0.8125rem);
                color: var(--sc-muted, #6b7280);
              }
              .nb-close {
                flex: none;
                display: grid;
                place-items: center;
                width: 34px;
                height: 34px;
                border-radius: 50%;
                border: 1px solid var(--sc-border, #e5e7eb);
                background: var(--sc-card, #fff);
                color: var(--sc-muted, #6b7280);
                cursor: pointer;
                transition: background var(--sc-d-base, 240ms)
                  var(--sc-ease, ease);
              }
              .nb-close:hover {
                background: var(--sc-hover, #eff6ff);
                color: var(--sc-navy, #0b1f4d);
              }
              .nb-body {
                flex: 1 1 auto;
                min-height: 0;
                overflow-y: auto;
                overscroll-behavior: contain;
                -webkit-overflow-scrolling: touch;
              }
              .nb-list {
                list-style: none;
                margin: 0;
                padding: 0;
              }
              .nb-item {
                position: relative;
                border-bottom: 1px solid var(--sc-border, #e5e7eb);
              }
              .nb-item.is-unread {
                background: var(--sc-accent-tint, rgba(37, 99, 235, 0.08));
              }
              .nb-item.is-unread::before {
                content: "";
                position: absolute;
                inset: 0 auto 0 0;
                width: 3px;
                background: var(--sc-accent, #2563eb);
              }
              .nb-item.is-urgent::before {
                content: "";
                position: absolute;
                inset: 0 auto 0 0;
                width: 3px;
                background: var(--sc-danger, #ef4444);
              }
              .nb-item-btn {
                display: flex;
                gap: 11px;
                width: 100%;
                padding: 14px 16px;
                background: none;
                border: 0;
                font: inherit;
                text-align: left;
                cursor: pointer;
                color: inherit;
              }
              .nb-item-btn:hover {
                background: rgba(37, 99, 235, 0.05);
              }
              .nb-ico {
                flex: none;
                display: grid;
                place-items: center;
                width: 30px;
                height: 30px;
                border-radius: 9px;
                margin-top: 1px;
              }
              .nb-item-main {
                display: block;
                min-width: 0;
                flex: 1 1 auto;
              }
              .nb-item-top {
                display: flex;
                align-items: center;
                gap: 8px;
              }
              .nb-item-title {
                font-size: var(--sc-f-sm, 0.875rem);
                font-weight: 700;
                letter-spacing: -0.01em;
                color: var(--sc-text, #111827);
                overflow-wrap: anywhere;
              }
              .nb-dot {
                flex: none;
                width: 7px;
                height: 7px;
                border-radius: 50%;
                background: var(--sc-accent, #2563eb);
              }
              .nb-meta {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 6px;
                margin: 5px 0 0;
              }
              .nb-chip {
                display: inline-flex;
                align-items: center;
                padding: 2px 8px;
                border-radius: var(--sc-r-pill, 999px);
                font-size: var(--sc-f-micro, 0.6875rem);
                font-weight: 700;
                white-space: nowrap;
              }
              .nb-when {
                font-size: var(--sc-f-micro, 0.6875rem);
                color: var(--sc-muted, #6b7280);
                white-space: nowrap;
              }
              .nb-msg {
                display: block;
                margin: 7px 0 0;
                font-size: var(--sc-f-xs, 0.8125rem);
                line-height: 1.55;
                color: var(--sc-muted, #6b7280);
                overflow-wrap: anywhere;
              }
              .nb-msg-full {
                color: var(--sc-text, #111827);
                white-space: pre-line;
              }
              .nb-foot {
                flex: none;
                display: flex;
                justify-content: flex-end;
                padding: 12px 16px;
                border-top: 1px solid var(--sc-border, #e5e7eb);
                background: var(--sc-card, #fff);
              }
              .nb-state {
                display: grid;
                justify-items: center;
                gap: 9px;
                padding: 52px 26px;
                text-align: center;
              }
              .nb-state-ico {
                display: grid;
                place-items: center;
                width: 46px;
                height: 46px;
                border-radius: 50%;
                background: var(--sc-accent-tint, rgba(37, 99, 235, 0.08));
                color: var(--sc-accent, #2563eb);
              }
              .nb-state-err {
                background: var(--sc-danger-tint, rgba(239, 68, 68, 0.1));
                color: var(--sc-danger, #ef4444);
              }
              .nb-state-t {
                margin: 0;
                font-size: var(--sc-f-sm, 0.875rem);
                font-weight: 650;
                color: var(--sc-text, #111827);
              }
              .nb-state-s {
                margin: 0;
                font-size: var(--sc-f-xs, 0.8125rem);
                color: var(--sc-muted, #6b7280);
              }
              .nb-skwrap {
                padding: 8px 0;
              }
              .nb-sk-row {
                display: flex;
                gap: 11px;
                padding: 14px 16px;
                animation: nb-fade var(--sc-d-base, 240ms) var(--sc-ease, ease)
                  both;
              }
              .nb-sk-dot {
                flex: none;
                width: 30px;
                height: 30px;
                border-radius: 9px;
              }
              .nb-sk-lines {
                flex: 1 1 auto;
                display: grid;
                gap: 7px;
              }
              .nb-sk-l1 {
                height: 11px;
                width: 62%;
                border-radius: 6px;
              }
              .nb-sk-l2 {
                height: 11px;
                width: 88%;
                border-radius: 6px;
              }

              @keyframes nb-fade {
                from {
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }
              }
              @keyframes nb-slide {
                from {
                  opacity: 0;
                  transform: translate3d(18px, 0, 0);
                }
                to {
                  opacity: 1;
                  transform: translate3d(0, 0, 0);
                }
              }
              @keyframes nb-rise {
                from {
                  opacity: 0;
                  transform: translate3d(0, 16px, 0);
                }
                to {
                  opacity: 1;
                  transform: translate3d(0, 0, 0);
                }
              }

              /* Mobile: bottom sheet instead of a side drawer. It ends above the
                 dock and the safe-area inset, so the action row stays tappable. */
              @media (max-width: 640px) {
                .nb-host {
                  align-items: flex-end;
                  justify-content: stretch;
                }
                .nb-panel {
                  max-width: none;
                  height: auto;
                  max-height: 82vh;
                  max-height: 82dvh;
                  border-left: 0;
                  border-top-left-radius: var(--sc-r-xl, 24px);
                  border-top-right-radius: var(--sc-r-xl, 24px);
                  animation-name: nb-rise;
                }
                .nb-grip {
                  display: block;
                  width: 38px;
                  height: 4px;
                  margin: 0 auto 10px;
                  border-radius: 999px;
                  background: var(--sc-border, #e5e7eb);
                }
                .nb-foot-btn {
                  width: 100%;
                }
              }

              @media (prefers-reduced-motion: reduce) {
                .nb-host,
                .nb-panel,
                .nb-sk-row {
                  animation: none;
                }
              }
            `}</style>
          </div>,
          portalHost,
        )}

      <style jsx>{`
        .nb-bell {
          position: relative;
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          flex: none;
          border-radius: 50%;
          border: 1px solid rgba(92, 225, 230, 0.15);
          background: rgba(92, 225, 230, 0.07);
          color: rgba(220, 235, 255, 0.9);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transition:
            background 240ms cubic-bezier(0.16, 1, 0.3, 1),
            border-color 240ms cubic-bezier(0.16, 1, 0.3, 1),
            transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nb-bell:hover {
          background: rgba(92, 225, 230, 0.14);
          border-color: rgba(92, 225, 230, 0.3);
          color: #fff;
        }
        .nb-bell:active {
          transform: scale(0.94);
        }
        .nb-bell:focus-visible {
          outline: 2px solid #5ce1e6;
          outline-offset: 2px;
        }
        .nb-badge {
          position: absolute;
          top: -3px;
          right: -3px;
          min-width: 17px;
          height: 17px;
          padding: 0 4px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
          border: 1.5px solid #11245d;
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        @media (prefers-reduced-motion: reduce) {
          .nb-bell {
            transition: none;
          }
        }
      `}</style>
    </>
  );
}
