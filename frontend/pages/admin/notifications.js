import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import AdminLayout from "../../components/layout/AdminLayout";
import Modal from "../../components/ui/Modal";
import api, { getUser } from "../../lib/api";

/* ============================================================================
   ADMIN - PLATFORM ANNOUNCEMENTS

   Create an announcement, target it, send it now or schedule it, and manage
   what has already gone out. Reuses the existing Modal (which portals inside
   the .sc-app token scope and reserves room for the bottom dock) and the
   existing .sc-* design system classes, so nothing new is introduced visually.
   ========================================================================== */

const TYPES = [
  { value: "maintenance", label: "Maintenance" },
  { value: "system_update", label: "System Update" },
  { value: "important", label: "Important" },
  { value: "announcement", label: "Announcement" },
  { value: "feature_update", label: "Feature Update" },
];

const PRIORITIES = [
  { value: "normal", label: "Normal" },
  { value: "important", label: "Important" },
  { value: "urgent", label: "Urgent" },
];

const TYPE_LABEL = TYPES.reduce((a, t) => ({ ...a, [t.value]: t.label }), {});
const PRIORITY_LABEL = PRIORITIES.reduce(
  (a, p) => ({ ...a, [p.value]: p.label }),
  {},
);

const STATUS_META = {
  published: { label: "Published", fg: "#15803D", bg: "rgba(34,197,94,0.10)" },
  scheduled: { label: "Scheduled", fg: "#B45309", bg: "rgba(245,158,11,0.12)" },
  cancelled: { label: "Cancelled", fg: "#6B7280", bg: "rgba(11,31,77,0.06)" },
  expired: { label: "Expired", fg: "#6B7280", bg: "rgba(11,31,77,0.06)" },
  draft: { label: "Draft", fg: "#6B7280", bg: "rgba(11,31,77,0.06)" },
};
const statusMeta = (s) => STATUS_META[s] || STATUS_META.draft;

const PRIORITY_META = {
  urgent: { fg: "#B91C1C", bg: "rgba(239,68,68,0.12)" },
  important: { fg: "#B45309", bg: "rgba(245,158,11,0.14)" },
};

const EMPTY_FORM = {
  title: "",
  message: "",
  type: "announcement",
  priority: "normal",
  targetType: "all",
  targetInstituteIds: [],
  scheduleAt: "",
  expiresAt: "",
};

function fmtDate(value) {
  if (!value) return "\u2014";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "\u2014";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// A datetime-local input yields "2026-09-06T23:00" with no timezone. Sending
// that raw would make the server parse it in ITS timezone (UTC in production),
// shifting every scheduled time by 5.5 hours. Converting in the browser pins
// the exact instant the admin actually picked.
function toIsoOrEmpty(localValue) {
  if (!localValue) return "";
  const d = new Date(localValue);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

// Inverse, for loading an existing record back into the form.
function toLocalInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes())
  );
}

export default function AdminNotifications() {
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [busyId, setBusyId] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const fetchAll = useCallback(async () => {
    setError("");
    try {
      const [listRes, metaRes] = await Promise.all([
        api.get("/api/admin/notifications"),
        api.get("/api/admin/notifications/meta"),
      ]);
      setItems(listRes?.data?.notifications || []);
      setInstitutes(metaRes?.data?.institutes || []);
    } catch (err) {
      setError(err?.response?.data?.error || "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "admin") {
      router.replace("/admin/login");
      return;
    }
    fetchAll();
  }, [router, fetchAll]);

  const openNew = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowSchedule(false);
    setPickerSearch("");
    setShowModal(true);
  };

  const openEdit = (n) => {
    setEditId(n._id);
    setForm({
      title: n.title || "",
      message: n.message || "",
      type: n.type || "announcement",
      priority: n.priority || "normal",
      targetType: n.targetType || "all",
      targetInstituteIds: (n.targetInstituteIds || []).map(String),
      scheduleAt: toLocalInput(n.publishedAt),
      expiresAt: toLocalInput(n.expiresAt),
    });
    setShowSchedule(!!n.expiresAt || n.effectiveStatus === "scheduled");
    setPickerSearch("");
    setShowModal(true);
  };

  const toggleInstitute = (id) => {
    setForm((f) => {
      const has = f.targetInstituteIds.includes(id);
      return {
        ...f,
        targetInstituteIds: has
          ? f.targetInstituteIds.filter((x) => x !== id)
          : [...f.targetInstituteIds, id],
      };
    });
  };

  const filteredInstitutes = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return institutes;
    return institutes.filter(
      (i) =>
        (i.instituteName || "").toLowerCase().includes(q) ||
        (i.loginId || "").toLowerCase().includes(q),
    );
  }, [institutes, pickerSearch]);

  const isScheduled =
    showSchedule && !!form.scheduleAt && new Date(form.scheduleAt) > new Date();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.message.trim()) return toast.error("Message is required");
    if (
      form.targetType === "specific" &&
      form.targetInstituteIds.length === 0
    ) {
      return toast.error("Select at least one institute");
    }

    const payload = {
      title: form.title.trim(),
      message: form.message.trim(),
      type: form.type,
      priority: form.priority,
      targetType: form.targetType,
      targetInstituteIds:
        form.targetType === "specific" ? form.targetInstituteIds : [],
      scheduleAt: showSchedule ? toIsoOrEmpty(form.scheduleAt) : "",
      expiresAt: showSchedule ? toIsoOrEmpty(form.expiresAt) : "",
    };

    setSaving(true);
    try {
      const res = editId
        ? await api.put("/api/admin/notifications/" + editId, payload)
        : await api.post("/api/admin/notifications", payload);
      setShowModal(false);
      toast.success(res?.data?.message || "Notification sent");
      await fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not save notification");
    } finally {
      setSaving(false);
    }
  };

  const rowAction = async (id, run, okMsg) => {
    if (busyId) return;
    setBusyId(id);
    try {
      await run();
      toast.success(okMsg);
      await fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const publishNow = (n) =>
    rowAction(
      n._id,
      () => api.patch("/api/admin/notifications/" + n._id + "/publish"),
      "Notification published",
    );

  const cancelOne = (n) => {
    if (!window.confirm('Withdraw "' + n.title + '" from all institutes?'))
      return;
    rowAction(
      n._id,
      () => api.patch("/api/admin/notifications/" + n._id + "/cancel"),
      "Notification cancelled",
    );
  };

  const deleteOne = (n) => {
    if (
      !window.confirm(
        'Permanently delete "' + n.title + '"? This cannot be undone.',
      )
    )
      return;
    rowAction(
      n._id,
      () => api.delete("/api/admin/notifications/" + n._id),
      "Notification deleted",
    );
  };

  return (
    <AdminLayout title="Notifications">
      <div className="sc-mast">
        <div>
          <p className="sc-eyebrow">Platform</p>
          <h1 className="sc-h1">Announcements</h1>
          <p className="sub">
            Send maintenance notices, system updates and announcements to
            institutes.
          </p>
        </div>
        <button onClick={openNew} className="sc-btn sc-btn-primary nowrap">
          New Notification
        </button>
      </div>

      {loading ? (
        <div
          className="grid"
          role="status"
          aria-label="Loading notifications..."
        >
          {[0, 1, 2].map((i) => (
            <div
              className="sc-card"
              key={i}
              style={{ animationDelay: i * 70 + "ms" }}
            >
              <div className="sc-skel sk-l1" />
              <div className="sc-skel sk-l2" />
              <div className="sc-skel sk-pill" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="sc-card state">
          <p className="state-t">{error}</p>
          <button
            className="sc-btn sc-btn-secondary sc-btn-sm"
            onClick={fetchAll}
          >
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="sc-card state">
          <p className="state-t">No notifications yet</p>
          <p className="state-s">
            Announcements you send will appear here with their delivery status.
          </p>
          <button className="sc-btn sc-btn-primary sc-btn-sm" onClick={openNew}>
            Create the first one
          </button>
        </div>
      ) : (
        <div className="grid">
          {items.map((n) => {
            const sm = statusMeta(n.effectiveStatus);
            const pm = PRIORITY_META[n.priority];
            const busy = busyId === n._id;
            const editable =
              n.effectiveStatus === "scheduled" ||
              n.effectiveStatus === "cancelled";
            const live =
              n.effectiveStatus === "published" ||
              n.effectiveStatus === "scheduled";
            return (
              <article className="sc-card" key={n._id}>
                <div className="row1">
                  <h2 className="ttl">{n.title}</h2>
                  <span
                    className="sc-badge"
                    style={{ color: sm.fg, background: sm.bg }}
                  >
                    <span className="sc-badge-dot" />
                    {sm.label}
                  </span>
                </div>

                <div className="chips">
                  <span className="chip chip-type">
                    {TYPE_LABEL[n.type] || "Announcement"}
                  </span>
                  {pm && (
                    <span
                      className="chip"
                      style={{ color: pm.fg, background: pm.bg }}
                    >
                      {PRIORITY_LABEL[n.priority]}
                    </span>
                  )}
                  <span className="chip chip-quiet">
                    {n.targetType === "all"
                      ? "All institutes" +
                        (n.recipients ? " (" + n.recipients + ")" : "")
                      : n.targetNames && n.targetNames.length === 1
                        ? n.targetNames[0]
                        : (n.recipients || 0) + " institutes"}
                  </span>
                </div>

                <p className="msg">{n.message}</p>

                {n.targetType === "specific" &&
                  n.targetNames &&
                  n.targetNames.length > 1 && (
                    <p className="targets">
                      Sent to: {n.targetNames.join(", ")}
                    </p>
                  )}

                <dl className="facts">
                  <div>
                    <dt>
                      {n.effectiveStatus === "scheduled"
                        ? "Publishes"
                        : "Published"}
                    </dt>
                    <dd>{fmtDate(n.publishedAt)}</dd>
                  </div>
                  <div>
                    <dt>Expires</dt>
                    <dd>{n.expiresAt ? fmtDate(n.expiresAt) : "Never"}</dd>
                  </div>
                  <div>
                    <dt>Read</dt>
                    <dd>
                      {n.readCount || 0}
                      {n.recipients ? " of " + n.recipients : ""}
                    </dd>
                  </div>
                </dl>

                <div className="acts">
                  {n.effectiveStatus === "scheduled" && (
                    <button
                      className="sc-btn sc-btn-primary sc-btn-sm grow"
                      onClick={() => publishNow(n)}
                      disabled={busy}
                    >
                      {busy ? "Working\u2026" : "Send now"}
                    </button>
                  )}
                  {editable && (
                    <button
                      className="sc-btn sc-btn-secondary sc-btn-sm grow"
                      onClick={() => openEdit(n)}
                      disabled={busy}
                    >
                      Edit
                    </button>
                  )}
                  {live && (
                    <button
                      className="sc-btn sc-btn-secondary sc-btn-sm grow"
                      onClick={() => cancelOne(n)}
                      disabled={busy}
                    >
                      {busy ? "Working\u2026" : "Withdraw"}
                    </button>
                  )}
                  <button
                    className="sc-btn sc-btn-danger sc-btn-sm grow"
                    onClick={() => deleteOne(n)}
                    disabled={busy}
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editId ? "Edit Notification" : "Create Notification"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="fm">
          <div className="f">
            <label className="fl" htmlFor="n-title">
              Title *
            </label>
            <input
              id="n-title"
              className="fi"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Scheduled Maintenance"
              maxLength={140}
              required
            />
          </div>

          <div className="f">
            <label className="fl" htmlFor="n-msg">
              Message *
            </label>
            <textarea
              id="n-msg"
              className="fi fta"
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              placeholder="Syncoptrac will undergo scheduled maintenance on Saturday from 11:00 PM to 12:00 AM. Some services may be temporarily unavailable during this period."
              rows={4}
              maxLength={4000}
              required
            />
            <p className="fh">{form.message.length} / 4000</p>
          </div>

          <div className="fgrid">
            <div className="f">
              <label className="fl" htmlFor="n-type">
                Type
              </label>
              <select
                id="n-type"
                className="fi"
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="f">
              <label className="fl" htmlFor="n-prio">
                Priority
              </label>
              <select
                id="n-prio"
                className="fi"
                value={form.priority}
                onChange={(e) => set("priority", e.target.value)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="f">
            <span className="fl">Send To</span>
            <div className="radios">
              <label
                className={
                  "radio" + (form.targetType === "all" ? " is-on" : "")
                }
              >
                <input
                  type="radio"
                  name="targetType"
                  checked={form.targetType === "all"}
                  onChange={() => set("targetType", "all")}
                />
                <span>All Institutes</span>
              </label>
              <label
                className={
                  "radio" + (form.targetType === "specific" ? " is-on" : "")
                }
              >
                <input
                  type="radio"
                  name="targetType"
                  checked={form.targetType === "specific"}
                  onChange={() => set("targetType", "specific")}
                />
                <span>Specific Institutes</span>
              </label>
            </div>
          </div>

          {form.targetType === "specific" && (
            <div className="f">
              <label className="fl" htmlFor="n-search">
                Choose institutes ({form.targetInstituteIds.length} selected)
              </label>
              <input
                id="n-search"
                className="fi"
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                placeholder="Search institutes..."
              />
              <div className="picker">
                {filteredInstitutes.length === 0 ? (
                  <p className="picker-empty">
                    No institutes match that search.
                  </p>
                ) : (
                  filteredInstitutes.map((i) => {
                    const id = String(i._id);
                    const on = form.targetInstituteIds.includes(id);
                    return (
                      <label key={id} className={"opt" + (on ? " is-on" : "")}>
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggleInstitute(id)}
                        />
                        <span className="opt-name">{i.instituteName}</span>
                        {i.isActive === false && (
                          <span className="opt-tag">Inactive</span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <div className="f">
            <button
              type="button"
              className="sc-link toggle"
              onClick={() => setShowSchedule((v) => !v)}
            >
              {showSchedule
                ? "Hide scheduling options"
                : "Schedule for later / set expiry"}
            </button>
          </div>

          {showSchedule && (
            <div className="fgrid">
              <div className="f">
                <label className="fl" htmlFor="n-when">
                  Publish at
                </label>
                <input
                  id="n-when"
                  type="datetime-local"
                  className="fi"
                  value={form.scheduleAt}
                  onChange={(e) => set("scheduleAt", e.target.value)}
                />
                <p className="fh">Leave empty to send immediately.</p>
              </div>
              <div className="f">
                <label className="fl" htmlFor="n-exp">
                  Expires at
                </label>
                <input
                  id="n-exp"
                  type="datetime-local"
                  className="fi"
                  value={form.expiresAt}
                  onChange={(e) => set("expiresAt", e.target.value)}
                />
                <p className="fh">
                  Optional. Hidden from institutes afterwards.
                </p>
              </div>
            </div>
          )}

          <div className="facts-btns">
            <button
              type="button"
              className="sc-btn sc-btn-secondary grow"
              onClick={() => setShowModal(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="sc-btn sc-btn-primary grow"
              disabled={saving}
            >
              {saving
                ? isScheduled
                  ? "Scheduling\u2026"
                  : "Sending\u2026"
                : isScheduled
                  ? "Schedule"
                  : editId
                    ? "Save & Send"
                    : "Send Now"}
            </button>
          </div>
        </form>
      </Modal>

      <style jsx>{`
        .sub {
          margin: 6px 0 0;
          font-size: var(--sc-f-sm);
          color: var(--sc-muted);
        }
        .nowrap {
          white-space: nowrap;
        }
        .grid {
          display: grid;
          gap: 14px;
        }
        .row1 {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .ttl {
          margin: 0;
          font-size: var(--sc-f-h3);
          font-weight: 700;
          letter-spacing: -0.01em;
          color: var(--sc-text);
          overflow-wrap: anywhere;
        }
        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 10px 0 0;
        }
        .chip {
          display: inline-flex;
          align-items: center;
          padding: 3px 9px;
          border-radius: var(--sc-r-pill);
          font-size: var(--sc-f-micro);
          font-weight: 700;
        }
        .chip-type {
          color: #1d4ed8;
          background: var(--sc-accent-tint);
        }
        .chip-quiet {
          color: var(--sc-muted);
          background: var(--sc-navy-tint);
        }
        .msg {
          margin: 11px 0 0;
          font-size: var(--sc-f-sm);
          line-height: 1.6;
          color: var(--sc-muted);
          white-space: pre-line;
          overflow-wrap: anywhere;
        }
        .targets {
          margin: 8px 0 0;
          font-size: var(--sc-f-xs);
          color: var(--sc-muted);
          overflow-wrap: anywhere;
        }
        .facts {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          margin: 14px 0 0;
          padding: 12px 0 0;
          border-top: 1px solid var(--sc-border);
        }
        .facts dt {
          font-size: 0.625rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #9ca3af;
        }
        .facts dd {
          margin: 3px 0 0;
          font-size: var(--sc-f-xs);
          font-weight: 600;
          color: var(--sc-text);
        }
        .acts {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 14px 0 0;
        }
        .grow {
          flex: 1 1 auto;
        }
        .state {
          display: grid;
          justify-items: center;
          gap: 9px;
          padding: 44px 22px;
          text-align: center;
        }
        .state-t {
          margin: 0;
          font-size: var(--sc-f-sm);
          font-weight: 650;
          color: var(--sc-text);
        }
        .state-s {
          margin: 0;
          font-size: var(--sc-f-xs);
          color: var(--sc-muted);
        }
        .sk-l1 {
          height: 15px;
          width: 46%;
          border-radius: 7px;
        }
        .sk-l2 {
          height: 12px;
          width: 82%;
          border-radius: 7px;
          margin-top: 12px;
        }
        .sk-pill {
          height: 26px;
          width: 140px;
          border-radius: 999px;
          margin-top: 16px;
        }

        .fm {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .fgrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .f {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .fl {
          margin-bottom: 6px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #374151;
        }
        .fh {
          margin: 7px 0 0;
          font-size: 0.75rem;
          color: #9ca3af;
        }
        /* Same border, radius and focus ring the design system gives fields. */
        .fi {
          width: 100%;
          min-height: var(--sc-tap);
          padding: 11px 14px;
          font: inherit;
          font-size: var(--sc-f-body);
          color: var(--sc-text);
          background: var(--sc-card);
          border: 1px solid var(--sc-border);
          border-radius: var(--sc-r-md);
          outline: none;
          transition:
            border-color var(--sc-d-base) var(--sc-ease),
            box-shadow var(--sc-d-base) var(--sc-ease);
        }
        .fi:focus {
          border-color: var(--sc-accent);
          box-shadow: 0 0 0 4px var(--sc-accent-ring);
        }
        .fta {
          min-height: 104px;
          line-height: 1.6;
          resize: vertical;
        }
        .radios {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .radio,
        .opt {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 13px;
          border: 1px solid var(--sc-border);
          border-radius: var(--sc-r-md);
          background: var(--sc-card);
          font-size: var(--sc-f-sm);
          font-weight: 600;
          color: var(--sc-text);
          cursor: pointer;
          transition:
            border-color var(--sc-d-base) var(--sc-ease),
            background var(--sc-d-base) var(--sc-ease);
        }
        .radio {
          flex: 1 1 180px;
        }
        .radio.is-on,
        .opt.is-on {
          border-color: var(--sc-accent);
          background: var(--sc-accent-tint);
        }
        .radio input,
        .opt input {
          width: 17px;
          height: 17px;
          flex: none;
          accent-color: var(--sc-accent);
          cursor: pointer;
        }
        .picker {
          display: grid;
          gap: 7px;
          max-height: 232px;
          overflow-y: auto;
          overscroll-behavior: contain;
          margin-top: 10px;
          padding: 3px;
        }
        .picker-empty {
          margin: 0;
          padding: 14px 4px;
          font-size: var(--sc-f-xs);
          color: var(--sc-muted);
        }
        .opt-name {
          flex: 1 1 auto;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .opt-tag {
          flex: none;
          font-size: var(--sc-f-micro);
          font-weight: 700;
          color: var(--sc-muted);
        }
        .toggle {
          align-self: flex-start;
        }
        .facts-btns {
          display: flex;
          gap: 10px;
        }

        @media (max-width: 640px) {
          .fgrid {
            grid-template-columns: 1fr;
          }
          .facts-btns {
            flex-direction: column-reverse;
          }
          .row1 {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }
      `}</style>
    </AdminLayout>
  );
}
