import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import InstituteLayout from '../../components/layout/InstituteLayout';
import Modal from '../../components/ui/Modal';
import api, { getUser, notifyError, errorMessage } from '../../lib/api';
import { T } from '../../components/ds/tokens';

const fmtDate = (val) => {
  if (!val) return '\u2014';
  const d = new Date(val);
  if (isNaN(d)) return String(val);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = d.toLocaleString('en-IN', { month: 'short', timeZone: 'UTC' });
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
};
import toast from 'react-hot-toast';

const EMPTY = { name: '', phone: '', email: '', course: '', status: 'New', notes: '', followUpDate: '' };

// Pipeline stages, in funnel order. Drives both the stat strip and the filters.
const STAGES = [
  { status: 'New',       label: 'New',       fg: '#1D4ED8', bg: 'rgba(37, 99, 235, 0.08)',  bd: 'rgba(37, 99, 235, 0.18)' },
  { status: 'Follow-Up', label: 'Follow-Up', fg: '#B45309', bg: 'rgba(245, 158, 11, 0.10)', bd: 'rgba(245, 158, 11, 0.22)' },
  { status: 'Converted', label: 'Converted', fg: '#15803D', bg: 'rgba(34, 197, 94, 0.10)',  bd: 'rgba(34, 197, 94, 0.22)' },
  { status: 'Lost',      label: 'Lost',      fg: '#B91C1C', bg: 'rgba(239, 68, 68, 0.08)',  bd: 'rgba(239, 68, 68, 0.20)' },
];
const STAGE_BY_STATUS = STAGES.reduce((a, s) => { a[s.status] = s; return a; }, {});

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== 'institute') { router.push('/institute/login'); return; }
    fetchEnquiries();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/sheets/enquiries');
      setEnquiries(res.data.data || []);
    } catch (err) { notifyError('enquiries-load', errorMessage(err, 'Failed to load enquiries')); }
    finally { setLoading(false); }
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openNew = () => { setEditId(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (e) => {
    setEditId(e.EnquiryID);
    setForm({
      name: e.Name, phone: e.Phone, email: e.Email || '',
      course: e.Course, status: e.Status || 'New',
      notes: e.Notes || '', followUpDate: e.FollowUpDate || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/api/sheets/enquiries/${editId}`, { ...form, enquiryId: editId });
        toast.success('Enquiry updated');
      } else {
        await api.post('/api/sheets/enquiries', form);
        toast.success('Enquiry added');
      }
      setShowModal(false);
      fetchEnquiries();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const sendResponse = async (e) => {
    if (!e.Email) { toast.error('No email for this enquiry'); return; }
    setSending(e.EnquiryID);
    try {
      await api.post('/api/sheets/send-email', {
        type: 'enquiryResponse',
        to: e.Email,
        name: e.Name,
        course: e.Course
      });
      toast.success('Response email sent!');
    } catch { toast.error('Failed to send email'); }
    finally { setSending(null); }
  };

  const sendFollowUpBulk = async () => {
    const followUps = enquiries.filter(e => e.Status === 'Follow-Up' && e.Email);
    if (followUps.length === 0) { toast.error('No Follow-Up enquiries with email found'); return; }
    setSending('bulk');
    let sent = 0; const failed = [];
    for (const e of followUps) {
      try {
        await api.post('/api/sheets/send-email', {
          type: 'followUp',
          to: e.Email,
          name: e.Name,
          studentName: e.Name,
          course: e.Course,
        });
        sent++;
      } catch { failed.push(e.Name); }
    }
    setSending(null);
    if (failed.length === 0) toast.success(`\u2705 Follow-up emails sent to ${sent} enquiries`);
    else toast.error(`Sent ${sent}, failed: ${failed.join(', ')}`);
  };

  const filtered = enquiries.filter(e => {
    const matchSearch =
      (e.Name || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.Phone || '').includes(search) ||
      (e.Course || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (e.Status || 'New') === filter;
    return matchSearch && matchFilter;
  });

  const followUpCount = enquiries.filter(e => e.Status === 'Follow-Up' && e.Email).length;
  const total = enquiries.length;
  const convertedPct = total ? Math.round((enquiries.filter(e => e.Status === 'Converted').length / total) * 100) : 0;

  const badgeStyle = (status) => {
    const s = STAGE_BY_STATUS[status] || STAGE_BY_STATUS.New;
    return { color: s.fg, background: s.bg, borderColor: s.bd };
  };

  return (
    <InstituteLayout title="Enquiries">
      {/* ---- Masthead ---- */}
      <div className="mast">
        <div>
          <p className="sc-eyebrow">Admissions pipeline</p>
          <h1 className="sc-h1">Enquiries</h1>
          <p className="sub">
            {loading
              ? 'Loading enquiries...'
              : `${total} enquir${total !== 1 ? 'ies' : 'y'} tracked \u00B7 ${convertedPct}% converted`}
          </p>
        </div>

        <div className="mast-r">
          <button onClick={openNew} className="sc-btn sc-btn-primary add">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <path d="M7.5 3v9M3 7.5h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Add Enquiry
          </button>
          {enquiries.some(e => e.Status === 'Follow-Up' && e.Email) && (
            <button
              onClick={sendFollowUpBulk}
              disabled={sending === 'bulk'}
              className="sc-btn warnbtn"
            >
              {sending === 'bulk' ? 'Sending...' : `\u{1F4E7} Send Follow-Up Email (${followUpCount})`}
            </button>
          )}
        </div>
      </div>

      {/* ---- Pipeline stat strip: also the filter control ---- */}
      <div className="stages">
        {STAGES.map((s, i) => {
          const count = enquiries.filter(e => e.Status === s.status).length;
          const pct = total ? Math.round((count / total) * 100) : 0;
          const active = filter === s.status;
          return (
            <button
              key={s.status}
              className={active ? 'stage is-active' : 'stage'}
              onClick={() => setFilter(active ? 'all' : s.status)}
              style={{ animationDelay: `${i * 55}ms`, borderColor: active ? s.bd : undefined }}
              aria-pressed={active}
            >
              <span className="stage-top">
                <span className="stage-dot" style={{ background: s.fg }} />
                <span className="stage-l">{s.label}</span>
              </span>
              <span className="stage-v" style={{ color: s.fg }}>{count}</span>
              <span className="stage-track">
                <span className="stage-fill" style={{ width: `${pct}%`, background: s.fg }} />
              </span>
            </button>
          );
        })}
      </div>

      {/* ---- Toolbar ---- */}
      <div className="bar">
        <div className="search">
          <svg className="s-ico" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="4.6" stroke="currentColor" strokeWidth="1.6" />
            <path d="M10.6 10.6L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            className="s-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search enquiries..."
            aria-label="Search enquiries"
          />
          {search && (
            <button className="s-clear" onClick={() => setSearch('')} aria-label="Clear search">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        <div className="sc-seg segwrap" role="group" aria-label="Filter by status">
          {['all', 'New', 'Follow-Up', 'Converted', 'Lost'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={filter === f ? 'seg is-on' : 'seg'}
              aria-pressed={filter === f}
            >{f === 'all' ? 'All' : f}</button>
          ))}
        </div>
      </div>

      {/* ---- Content ---- */}
      {loading ? (
        <div className="sc-card" role="status" aria-label="Loading enquiries...">
          {[0, 1, 2, 3, 4].map(i => (
            <div className="sk-row" key={i} style={{ animationDelay: `${i * 55}ms` }}>
              <div className="sk-lines">
                <div className="sc-skel sk-l1" />
                <div className="sc-skel sk-l2" />
              </div>
              <div className="sc-skel sk-pill" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="sc-card sc-empty">
          <div className="sc-empty-ico">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <path d="M3.5 6.5h15v11h-15z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M3.5 7l7.5 5.5L18.5 7" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="empty-t">
            {search ? 'No matching enquiries' : 'No enquiries yet. Add one!'}
          </p>
          {search ? (
            <button className="sc-btn sc-btn-secondary sc-btn-sm" onClick={() => setSearch('')}>Clear search</button>
          ) : (
            <button className="sc-btn sc-btn-primary sc-btn-sm" onClick={openNew}>Add Enquiry</button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="sc-card sc-i tablecard">
            <div className="sc-table-scroll">
              <table className="sc-table">
                <thead>
                  <tr>
                    {['Name', 'Phone', 'Email', 'Course', 'Status', 'Date', 'Follow-Up', 'Actions'].map(h => (
                      <th key={h} className={h === 'Actions' ? 'th-act' : undefined}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e, i) => (
                    <tr key={e.EnquiryID} className="row" style={{ animationDelay: `${Math.min(i, 12) * 28}ms` }}>
                      <td className="nm">{e.Name}</td>
                      <td className="num">{e.Phone}</td>
                      <td className="em">{e.Email || '\u2014'}</td>
                      <td><span className="sc-badge course">{e.Course}</span></td>
                      <td>
                        <span className="sc-badge" style={badgeStyle(e.Status)}>{e.Status || 'New'}</span>
                      </td>
                      <td className="dim">{e.CreatedAt || '\u2014'}</td>
                      <td className="dim">{fmtDate(e.FollowUpDate)}</td>
                      <td className="th-act">
                        <div className="acts">
                          <button onClick={() => openEdit(e)} className="act">Edit</button>
                          {e.Email ? (
                            <button
                              onClick={() => sendResponse(e)}
                              disabled={sending === e.EnquiryID}
                              className="act"
                            >{sending === e.EnquiryID ? 'Sending...' : 'Respond'}</button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="foot">
              {filtered.length} of {total} shown
            </div>
          </div>

          {/* Mobile cards */}
          <div className="cards">
            {filtered.map((e, i) => (
              <div className="ecard" key={e.EnquiryID} style={{ animationDelay: `${Math.min(i, 10) * 32}ms` }}>
                <div className="ecard-top">
                  <div className="ecard-id">
                    <p className="ecard-n">{e.Name}</p>
                    <span className="sc-badge course">{e.Course}</span>
                  </div>
                  <span className="sc-badge" style={badgeStyle(e.Status)}>{e.Status || 'New'}</span>
                </div>

                <div className="ecard-grid">
                  <div>
                    <span className="k">Phone</span>
                    <a className="v vlink" href={`tel:${e.Phone}`}>{e.Phone}</a>
                  </div>
                  <div>
                    <span className="k">Follow-Up</span>
                    <span className="v">{fmtDate(e.FollowUpDate)}</span>
                  </div>
                  {e.Email ? (
                    <div className="span2">
                      <span className="k">Email</span>
                      <span className="v vtrunc">{e.Email}</span>
                    </div>
                  ) : null}
                  {e.Notes ? (
                    <div className="span2">
                      <span className="k">Notes</span>
                      <span className="v vnote">{e.Notes}</span>
                    </div>
                  ) : null}
                </div>

                <div className="ecard-acts">
                  <button onClick={() => openEdit(e)} className="sc-btn sc-btn-secondary sc-btn-sm grow">Edit</button>
                  {e.Email ? (
                    <button
                      onClick={() => sendResponse(e)}
                      disabled={sending === e.EnquiryID}
                      className="sc-btn sc-btn-primary sc-btn-sm grow"
                    >{sending === e.EnquiryID ? 'Sending...' : 'Respond'}</button>
                  ) : null}
                </div>
              </div>
            ))}
            <p className="cards-foot">{filtered.length} of {total} shown</p>
          </div>
        </>
      )}

      {/* ---- Add / Edit ---- */}
      <Modal open={showModal} onClose={() => setShowModal(false)}
        title={editId ? 'Edit Enquiry' : 'Add Enquiry'} size="md">
        <form onSubmit={handleSubmit} className="fm">
          <div className="fgrid">
            <div className="f">
              <label className="fl">Name *</label>
              <input className="sc-field" value={form.name}
                onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="f">
              <label className="fl">Phone *</label>
              <input className="sc-field" inputMode="tel" value={form.phone}
                onChange={e => set('phone', e.target.value)} required />
            </div>
            <div className="f">
              <label className="fl">Email</label>
              <input type="email" className="sc-field" value={form.email}
                onChange={e => set('email', e.target.value)} />
            </div>
            <div className="f">
              <label className="fl">Course *</label>
              <input className="sc-field" value={form.course}
                onChange={e => set('course', e.target.value)} required />
            </div>
            <div className="f">
              <label className="fl">Status</label>
              <select className="sc-field" value={form.status} onChange={e => set('status', e.target.value)}>
                <option>New</option>
                <option>Follow-Up</option>
                <option>Converted</option>
                <option>Lost</option>
              </select>
            </div>
            <div className="f">
              <label className="fl">Follow-Up Date</label>
              <input type="date" className="sc-field" value={form.followUpDate}
                onChange={e => set('followUpDate', e.target.value)} />
            </div>
            <div className="f span2">
              <label className="fl">Notes</label>
              <textarea className="sc-field ta" value={form.notes}
                onChange={e => set('notes', e.target.value)} />
            </div>
          </div>

          <div className="facts">
            <button type="button" className="sc-btn sc-btn-secondary grow" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="sc-btn sc-btn-primary grow" disabled={saving}>
              {saving ? 'Saving...' : editId ? 'Update' : 'Add Enquiry'}
            </button>
          </div>
        </form>
      </Modal>

      <style jsx>{`
        .mast {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }
        .sub { margin: 5px 0 0; font-size: 0.875rem; color: ${T.muted}; }
        .mast-r { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .add { white-space: nowrap; }
        .warnbtn {
          white-space: nowrap;
          color: #92400e;
          background: rgba(245, 158, 11, 0.09);
          border: 1px solid rgba(245, 158, 11, 0.28);
        }
        .warnbtn:hover:not(:disabled) { background: rgba(245, 158, 11, 0.15); }

        /* ---- Pipeline strip ---- */
        .stages {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .stage {
          display: block;
          text-align: left;
          padding: 13px 14px 12px;
          background: ${T.card};
          border: 1.5px solid ${T.border};
          border-radius: 14px;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(11, 31, 77, 0.04);
          transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 180ms ease, border-color 180ms ease;
          animation: rowIn 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @media (hover: hover) and (pointer: fine) {
          .stage:hover { transform: translateY(-2px); box-shadow: 0 8px 18px rgba(11, 31, 77, 0.08); }
        }
        .stage.is-active { box-shadow: 0 6px 16px rgba(11, 31, 77, 0.07); }
        .stage:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.28); }
        .stage-top { display: flex; align-items: center; gap: 7px; }
        .stage-dot { width: 7px; height: 7px; border-radius: 999px; flex: none; }
        .stage-l {
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: ${T.muted};
        }
        .stage-v {
          display: block;
          margin: 7px 0 9px;
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          font-variant-numeric: tabular-nums;
        }
        .stage-track {
          display: block;
          height: 4px;
          border-radius: 999px;
          background: #f1f5f9;
          overflow: hidden;
        }
        .stage-fill {
          display: block;
          height: 100%;
          border-radius: 999px;
          transition: width 620ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* ---- Toolbar ---- */
        .bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }
        .search { position: relative; display: flex; align-items: center; width: 18rem; max-width: 100%; }
        .s-ico { position: absolute; left: 13px; color: ${T.muted}; pointer-events: none; }
        .s-input {
          width: 100%;
          height: 44px;
          padding: 0 38px 0 36px;
          font-size: 0.9375rem;
          color: ${T.text};
          background: ${T.card};
          border: 1.5px solid ${T.border};
          border-radius: 12px;
          outline: none;
          transition: border-color 160ms ease, box-shadow 160ms ease;
        }
        .s-input::placeholder { color: #9ca3af; }
        .s-input:focus { border-color: ${T.accent}; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12); }
        .s-clear {
          position: absolute;
          right: 6px;
          width: 30px;
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 0;
          background: transparent;
          border-radius: 999px;
          color: ${T.muted};
          cursor: pointer;
        }
        .s-clear:hover { background: ${T.hover}; color: ${T.text}; }

        .segwrap { flex-wrap: wrap; }
        .seg {
          min-height: 36px;
          padding: 0 13px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: ${T.muted};
          background: transparent;
          border: 0;
          border-radius: 9px;
          cursor: pointer;
          transition: background 160ms ease, color 160ms ease;
        }
        .seg:hover { color: ${T.text}; }
        .seg.is-on { background: ${T.card}; color: ${T.accent}; box-shadow: 0 1px 3px rgba(11, 31, 77, 0.09); }
        .seg:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.28); }

        /* ---- Table ---- */
        .tablecard { overflow: hidden; }
        .row { animation: rowIn 380ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes rowIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .th-act { text-align: right; }
        .nm { font-weight: 600; color: ${T.text}; }
        .num { font-variant-numeric: tabular-nums; color: #4b5563; }
        .em { font-size: 0.8125rem; color: ${T.muted}; max-width: 14rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .dim { color: ${T.muted}; font-size: 0.8125rem; white-space: nowrap; }
        .course {
          background: rgba(37, 99, 235, 0.06);
          border-color: rgba(37, 99, 235, 0.16);
          color: #1d4ed8;
        }
        .acts { display: flex; gap: 6px; justify-content: flex-end; }
        .act {
          min-height: 32px;
          padding: 0 10px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: ${T.accent};
          background: transparent;
          border: 1px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: background 150ms ease, border-color 150ms ease;
        }
        .act:hover:not(:disabled) { background: ${T.hover}; border-color: rgba(37, 99, 235, 0.2); }
        .act:disabled { opacity: 0.55; cursor: default; }
        .foot {
          padding: 12px 16px;
          font-size: 0.8125rem;
          color: ${T.muted};
          background: ${T.bg};
          border-top: 1px solid ${T.border};
        }
        .empty-t { margin: 0 0 14px; font-size: 0.9375rem; font-weight: 600; color: ${T.text}; }

        /* ---- Skeleton ---- */
        .sk-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
          animation: skIn 400ms ease both;
        }
        .sk-row:last-child { border-bottom: 0; }
        @keyframes skIn { from { opacity: 0; } to { opacity: 1; } }
        .sk-lines { flex: 1; display: flex; flex-direction: column; gap: 7px; }
        .sk-l1 { height: 11px; width: 34%; border-radius: 6px; }
        .sk-l2 { height: 9px; width: 20%; border-radius: 6px; }
        .sk-pill { width: 78px; height: 22px; border-radius: 999px; flex: none; }

        /* ---- Mobile cards ---- */
        .cards { display: none; }
        .ecard {
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 16px;
          padding: 14px;
          box-shadow: 0 1px 2px rgba(11, 31, 77, 0.04);
          animation: rowIn 400ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .ecard + .ecard { margin-top: 10px; }
        .ecard-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .ecard-id { min-width: 0; }
        .ecard-n {
          margin: 0 0 5px;
          font-size: 0.9375rem;
          font-weight: 700;
          color: ${T.text};
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ecard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 11px 12px;
          margin: 13px 0 0;
          padding: 13px 0 0;
          border-top: 1px solid #f1f5f9;
        }
        .span2 { grid-column: 1 / -1; }
        .k {
          display: block;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #9ca3af;
          margin-bottom: 3px;
        }
        .v { display: block; font-size: 0.875rem; color: ${T.text}; font-variant-numeric: tabular-nums; }
        .vlink { color: ${T.accent}; text-decoration: none; font-weight: 600; }
        .vtrunc { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vnote { color: #4b5563; line-height: 1.5; }
        .ecard-acts { display: flex; gap: 8px; margin-top: 13px; }
        .cards-foot { margin: 12px 2px 0; font-size: 0.8125rem; color: ${T.muted}; }

        /* ---- Form ---- */
        .fm { display: flex; flex-direction: column; gap: 16px; }
        .fgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .f { display: flex; flex-direction: column; min-width: 0; }
        .fl { margin-bottom: 6px; font-size: 0.8125rem; font-weight: 600; color: #374151; }
        .ta { min-height: 84px; resize: vertical; padding-top: 10px; line-height: 1.5; }
        .facts { display: flex; gap: 10px; }
        .grow { flex: 1; }

        /* ---- Responsive ---- */
        @media (max-width: 900px) {
          .stages { grid-template-columns: repeat(2, 1fr); }
          .search { width: 100%; }
          .mast-r { width: 100%; }
          .add, .warnbtn { flex: 1; justify-content: center; }
        }
        @media (max-width: 720px) {
          .tablecard { display: none; }
          .cards { display: block; }
          .fgrid { grid-template-columns: 1fr; }
          .facts { flex-direction: column-reverse; }
          .segwrap { width: 100%; overflow-x: auto; }
        }
        @media (max-width: 380px) {
          .ecard-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </InstituteLayout>
  );
}
