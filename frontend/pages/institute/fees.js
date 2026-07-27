import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import InstituteLayout from '../../components/layout/InstituteLayout';
import Modal from '../../components/ui/Modal';
import api, { getUser } from '../../lib/api';
import toast from 'react-hot-toast';
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

const CYCLE_LABELS = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  'half-yearly': 'Half-Yearly',
  yearly: 'Yearly',
};

const RUPEE = '\u20B9';

export default function FeesPage() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feeCycle, setFeeCycle] = useState('monthly');
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ totalFee: '', paidAmount: '', dueDate: '', lastPaymentDate: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, failed: [] });
  const [filter, setFilter] = useState('all');
  const [marking, setMarking] = useState(null);
  const router = useRouter();

  const getEmail = (f) => {
    const student = students.find(s => String(s.StudentID) === String(f.StudentID));
    return (student && (student.Email || student.email || student.EMAIL)) || f.Email || f.email || '';
  };
  const getPending = (f) => parseFloat(f.PendingAmount || f.pendingAmount || 0);

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== 'institute') { router.push('/institute/login'); return; }
    fetchFees();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFees = async () => {
    setLoading(true);
    try {
      const [feesRes, studentsRes] = await Promise.all([
        api.get('/api/sheets/fees'),
        api.get('/api/sheets/students')
      ]);
      const activeStudents = studentsRes.data.data || [];
      const activeStudentIds = new Set(activeStudents.map(s => String(s.StudentID)));
      // Filter out fee rows for students that have been deleted
      const activeFees = (feesRes.data.data || []).filter(f =>
        activeStudentIds.has(String(f.StudentID))
      );
      setFees(activeFees);
      setStudents(activeStudents);
      if (feesRes.data.feeCollectionCycle) setFeeCycle(feesRes.data.feeCollectionCycle);
    } catch { toast.error('Failed to load fees'); }
    finally { setLoading(false); }
  };

  const openEdit = (f) => {
    setSelected(f);
    setForm({
      totalFee: f.TotalFee || '',
      paidAmount: f.PaidAmount || '',
      dueDate: f.DueDate || '',
      lastPaymentDate: f.LastPaymentDate || '',
      notes: f.Notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/api/sheets/fees/${selected.StudentID}`, form);
      toast.success('Fee record updated');
      setShowModal(false);
      fetchFees();
    } catch { toast.error('Failed to update fee'); }
    finally { setSaving(false); }
  };

  // ---- Mark Paid shortcut ----
  const markPaid = async (f) => {
    setMarking(f.StudentID);
    try {
      await api.put(`/api/sheets/fees/${f.StudentID}`, {
        totalFee: f.TotalFee,
        paidAmount: f.TotalFee,
        dueDate: f.DueDate || '',
        lastPaymentDate: new Date().toISOString().substring(0, 10),
        notes: f.Notes || '',
      });
      toast.success(`${f.StudentName} marked as Paid`);
      fetchFees();
    } catch { toast.error('Failed to mark as paid'); }
    finally { setMarking(null); }
  };

  // ---- Bulk reminder ----
  const unpaidWithEmail = fees.filter(f => f.Status !== 'Paid' && getPending(f) > 0 && getEmail(f));
  const unpaidNoEmail   = fees.filter(f => f.Status !== 'Paid' && getPending(f) > 0 && !getEmail(f));

  const sendBulkReminders = async () => {
    if (unpaidWithEmail.length === 0) { toast.error('No unpaid students with email addresses found'); return; }
    setBulkSending(true);
    setBulkProgress({ done: 0, total: unpaidWithEmail.length, failed: [] });
    const failed = [];
    for (let i = 0; i < unpaidWithEmail.length; i++) {
      const f = unpaidWithEmail[i];
      try {
        await api.post('/api/sheets/send-email', {
          type: 'feeReminder', to: getEmail(f),
          studentName: f.StudentName, amount: getPending(f),
          dueDate: f.DueDate || 'as soon as possible'
        });
      } catch { failed.push(f.StudentName); }
      setBulkProgress({ done: i + 1, total: unpaidWithEmail.length, failed });
    }
    setBulkSending(false);
    if (failed.length === 0) {
      toast.success(`\u2705 Reminders sent to ${unpaidWithEmail.length} students!`);
      setShowBulkModal(false);
    } else {
      toast.error(`Sent ${unpaidWithEmail.length - failed.length}, failed: ${failed.join(', ')}`);
    }
  };

  const filtered = fees.filter(f => {
    if (filter === 'overdue') return f.Status === 'Overdue';
    if (filter === 'paid') return f.Status === 'Paid';
    if (filter === 'unpaid') return f.Status !== 'Paid' && f.Status !== 'Overdue';
    return true;
  });

  const totalCollected = fees.reduce((s, f) => s + (parseFloat(f.PaidAmount) || 0), 0);
  const totalOverdue   = fees.filter(f => f.Status === 'Overdue').reduce((s, f) => s + getPending(f), 0);
  const fmt = n => (n || 0).toLocaleString('en-IN');

  const totalBilled = fees.reduce((s, f) => s + (parseFloat(f.TotalFee) || 0), 0);
  const collectRate = totalBilled ? Math.round((totalCollected / totalBilled) * 100) : 0;

  const statusBadge = (status) => {
    if (status === 'Paid') return 'sc-badge b-ok';
    if (status === 'Overdue') return 'sc-badge b-bad';
    return 'sc-badge b-warn';
  };
  const statusLabel = (status) =>
    status === 'Paid' ? 'Paid' : status === 'Overdue' ? 'Overdue' : 'Unpaid';

  const STATS = [
    { k: 'Fees Collected', v: `${RUPEE}${fmt(totalCollected)}`, fg: '#15803D', bg: 'rgba(34, 197, 94, 0.09)', bd: 'rgba(34, 197, 94, 0.2)' },
    { k: 'Overdue Fees',   v: `${RUPEE}${fmt(totalOverdue)}`,   fg: '#B91C1C', bg: 'rgba(239, 68, 68, 0.07)', bd: 'rgba(239, 68, 68, 0.18)' },
    { k: 'Total Students', v: String(fees.length),              fg: T.text,    bg: T.card,                   bd: T.border },
  ];

  return (
    <InstituteLayout title="Fee Management">
      {/* ---- Masthead ---- */}
      <div className="mast">
        <div>
          <p className="sc-eyebrow">Revenue</p>
          <h1 className="sc-h1">Fee Management</h1>
          <p className="sub">
            {loading
              ? 'Loading fees...'
              : `${collectRate}% of ${RUPEE}${fmt(totalBilled)} billed has been collected`}
          </p>
        </div>

        <button onClick={() => setShowBulkModal(true)} disabled={loading}
          className="sc-btn sc-btn-primary remind">
          Send Fee Reminders
          {unpaidWithEmail.length > 0 && (
            <span className="pill">{unpaidWithEmail.length}</span>
          )}
        </button>
      </div>

      {/* ---- Summary ---- */}
      <div className="stats">
        {STATS.map((s, i) => (
          <div className="stat" key={s.k}
            style={{ background: s.bg, borderColor: s.bd, animationDelay: `${i * 60}ms` }}>
            <p className="stat-k">{s.k}</p>
            <p className="stat-v" style={{ color: s.fg }}>{s.v}</p>
          </div>
        ))}

        <div className="stat rate" style={{ animationDelay: '180ms' }}>
          <p className="stat-k">Collection rate</p>
          <p className="stat-v rate-v">{collectRate}%</p>
          <span className="track" aria-hidden="true">
            <span className="fill" style={{ width: `${collectRate}%` }} />
          </span>
        </div>
      </div>

      {/* ---- Toolbar ---- */}
      <div className="bar">
        <div className="sc-seg segwrap" role="group" aria-label="Filter fees">
          {[['all', 'All'], ['overdue', 'Overdue'], ['paid', 'Paid']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={filter === v ? 'seg is-on' : 'seg'}
              aria-pressed={filter === v}>{l}</button>
          ))}
        </div>

        <span className="cycle">Cycle: {CYCLE_LABELS[feeCycle] || 'Monthly'}</span>
      </div>

      {/* ---- Content ---- */}
      {loading ? (
        <div className="sc-card" role="status" aria-label="Loading fees...">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div className="sk-row" key={i} style={{ animationDelay: `${i * 55}ms` }}>
              <div className="sk-lines">
                <div className="sc-skel sk-l1" />
                <div className="sc-skel sk-l2" />
              </div>
              <div className="sc-skel sk-amt" />
              <div className="sc-skel sk-pill" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="sc-card sc-empty">
          <div className="sc-empty-ico">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <rect x="3" y="6" width="16" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="11" cy="11.5" r="2.4" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </div>
          <p className="empty-t">No records for this filter</p>
          {filter !== 'all' && (
            <button className="sc-btn sc-btn-secondary sc-btn-sm" onClick={() => setFilter('all')}>
              Show all
            </button>
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
                    {['Student Name', 'Course', 'Fee Amount', 'Paid Amount', 'Last Payment Date', 'Next Due Date', 'Collection Period', 'Status', 'Actions'].map(h => (
                      <th key={h} className={h === 'Actions' ? 'th-act' : undefined}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f, i) => {
                    const pending = getPending(f);
                    const paid = parseFloat(f.PaidAmount) || 0;
                    const tot = parseFloat(f.TotalFee) || 0;
                    const pct = tot ? Math.min(100, Math.round((paid / tot) * 100)) : 0;
                    return (
                      <tr key={f.StudentID}
                        className={f.Status === 'Overdue' ? 'row is-over' : 'row'}
                        style={{ animationDelay: `${Math.min(i, 12) * 26}ms` }}>
                        <td className="nm">{f.StudentName}</td>
                        <td className="dim">{f.Course}</td>
                        <td className="amt">{RUPEE}{fmt(f.TotalFee)}</td>
                        <td>
                          <span className="paid">{RUPEE}{fmt(f.PaidAmount)}</span>
                          <span className="minitrack" aria-hidden="true">
                            <span className="minifill" style={{ width: `${pct}%` }} />
                          </span>
                          {pending > 0 && (
                            <span className="due">{RUPEE}{fmt(pending)} due</span>
                          )}
                        </td>
                        <td className="dim">{fmtDate(f.LastPaymentDate)}</td>
                        <td className="dim">{fmtDate(f.DueDate)}</td>
                        <td className="dim">{f.Period || '\u2014'}</td>
                        <td>
                          <span className={statusBadge(f.Status)}>{statusLabel(f.Status)}</span>
                        </td>
                        <td className="th-act">
                          <div className="acts">
                            <button onClick={() => openEdit(f)} className="act">Edit</button>
                            {f.Status !== 'Paid' && (
                              <button onClick={() => markPaid(f)}
                                disabled={marking === f.StudentID}
                                className="act act-ok">
                                {marking === f.StudentID ? 'Saving...' : 'Mark Paid'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="cards">
            {filtered.map((f, i) => {
              const pending = getPending(f);
              const paid = parseFloat(f.PaidAmount) || 0;
              const tot = parseFloat(f.TotalFee) || 0;
              const pct = tot ? Math.min(100, Math.round((paid / tot) * 100)) : 0;
              return (
                <div className={f.Status === 'Overdue' ? 'fcard is-over' : 'fcard'}
                  key={f.StudentID} style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
                  <div className="fcard-top">
                    <div className="fcard-id">
                      <p className="fcard-n">{f.StudentName}</p>
                      <p className="fcard-c">{f.Course}</p>
                    </div>
                    <span className={statusBadge(f.Status)}>{statusLabel(f.Status)}</span>
                  </div>

                  <div className="fcard-money">
                    <span className="fm-paid">{RUPEE}{fmt(f.PaidAmount)}</span>
                    <span className="fm-of">of {RUPEE}{fmt(f.TotalFee)}</span>
                  </div>
                  <span className="track" aria-hidden="true">
                    <span className="fill" style={{ width: `${pct}%` }} />
                  </span>
                  {pending > 0 && (
                    <p className="fm-due">{RUPEE}{fmt(pending)} pending</p>
                  )}

                  <div className="fcard-grid">
                    <div>
                      <span className="k">Next Due Date</span>
                      <span className="v">{fmtDate(f.DueDate)}</span>
                    </div>
                    <div>
                      <span className="k">Last Payment Date</span>
                      <span className="v">{fmtDate(f.LastPaymentDate)}</span>
                    </div>
                    <div>
                      <span className="k">Collection Period</span>
                      <span className="v">{f.Period || '\u2014'}</span>
                    </div>
                  </div>

                  <div className="fcard-acts">
                    <button onClick={() => openEdit(f)} className="sc-btn sc-btn-secondary sc-btn-sm grow">Edit</button>
                    {f.Status !== 'Paid' && (
                      <button onClick={() => markPaid(f)} disabled={marking === f.StudentID}
                        className="sc-btn sc-btn-primary sc-btn-sm grow">
                        {marking === f.StudentID ? 'Saving...' : 'Mark Paid'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ---- Bulk Reminder Modal ---- */}
      <Modal open={showBulkModal} onClose={() => !bulkSending && setShowBulkModal(false)}
        title="Send Fee Reminders" size="md">
        <div className="bulk">
          <div className="bulk-stats">
            <div className="bs bs-go">
              <p className="bs-v">{unpaidWithEmail.length}</p>
              <p className="bs-l">Will receive email</p>
            </div>
            <div className="bs bs-skip">
              <p className="bs-v">{unpaidNoEmail.length}</p>
              <p className="bs-l">No email &mdash; skipped</p>
            </div>
          </div>

          {unpaidWithEmail.length > 0 && (
            <div className="list">
              <div className="list-h">Reminders will be sent to</div>
              <div className="list-b">
                {unpaidWithEmail.map(f => (
                  <div key={f.StudentID} className="li">
                    <div className="li-l">
                      <p className="li-n">{f.StudentName}</p>
                      <p className="li-e">{getEmail(f)}</p>
                    </div>
                    <div className="li-r">
                      <p className="li-a">{RUPEE}{fmt(getPending(f))}</p>
                      <span className={f.Status === 'Overdue' ? 'li-s over' : 'li-s'}>{f.Status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {unpaidNoEmail.length > 0 && (
            <div className="sc-notice sc-notice-warn">
              {unpaidNoEmail.map(f => f.StudentName).join(', ')} &mdash; no email address, will be skipped.
            </div>
          )}

          {bulkSending && (
            <div className="prog-wrap">
              <div className="prog-top">
                <span>Sending reminders...</span>
                <span className="prog-n">{bulkProgress.done} / {bulkProgress.total}</span>
              </div>
              <div className="track">
                <span className="fill"
                  style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }} />
              </div>
            </div>
          )}

          {unpaidWithEmail.length === 0 ? (
            <p className="none">No unpaid students with email addresses found.</p>
          ) : (
            <div className="facts">
              <button onClick={() => setShowBulkModal(false)} disabled={bulkSending}
                className="sc-btn sc-btn-secondary grow">Cancel</button>
              <button onClick={sendBulkReminders} disabled={bulkSending}
                className="sc-btn sc-btn-primary grow">
                {bulkSending
                  ? `Sending ${bulkProgress.done}/${bulkProgress.total}...`
                  : `Send to ${unpaidWithEmail.length} Students`}
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* ---- Edit Fee Modal ---- */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Update Fee Record">
        {selected && (
          <form onSubmit={handleSave} className="fm">
            <div className="who">
              <p className="who-n">{selected.StudentName}</p>
              <p className="who-c">{selected.Course}</p>
            </div>

            <div className="fgrid">
              <div className="f">
                <label className="fl">Fee Amount ({RUPEE})</label>
                <input type="number" className="sc-field" value={form.totalFee}
                  onChange={e => setForm(p => ({ ...p, totalFee: e.target.value }))} required />
              </div>
              <div className="f">
                <label className="fl">Paid Amount ({RUPEE})</label>
                <input type="number" className="sc-field" value={form.paidAmount}
                  onChange={e => setForm(p => ({ ...p, paidAmount: e.target.value }))} required />
              </div>
              <div className="f">
                <label className="fl">Last Payment Date</label>
                <input type="date" className="sc-field" value={form.lastPaymentDate}
                  onChange={e => setForm(p => ({ ...p, lastPaymentDate: e.target.value }))} />
              </div>
              <div className="f">
                <label className="fl">Next Due Date</label>
                <input type="date" className="sc-field" value={form.dueDate}
                  onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
              </div>
              <div className="f span2">
                <label className="fl">Notes (optional)</label>
                <input type="text" className="sc-field" value={form.notes}
                  placeholder="Any additional notes..."
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>

            <div className="facts">
              <button type="button" className="sc-btn sc-btn-secondary grow" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="sc-btn sc-btn-primary grow" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
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
        .remind { white-space: nowrap; }
        .pill {
          margin-left: 4px;
          padding: 1px 7px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #ffffff;
          background: rgba(255, 255, 255, 0.24);
          border-radius: 999px;
        }

        /* ---- Stats ---- */
        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .stat {
          padding: 14px 15px;
          border: 1px solid ${T.border};
          border-radius: 14px;
          box-shadow: 0 1px 2px rgba(11, 31, 77, 0.04);
          animation: rowIn 440ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes rowIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .stat-k {
          margin: 0;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: ${T.muted};
        }
        .stat-v {
          margin: 8px 0 0;
          font-size: 1.375rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          font-variant-numeric: tabular-nums;
        }
        .rate { background: ${T.card}; }
        .rate-v { color: ${T.accent}; }
        .track {
          display: block;
          height: 6px;
          margin-top: 9px;
          border-radius: 999px;
          background: #eef2f7;
          overflow: hidden;
        }
        .fill {
          display: block;
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, ${T.accent}, ${T.accent2});
          transition: width 640ms cubic-bezier(0.16, 1, 0.3, 1);
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
        .segwrap { flex-wrap: wrap; }
        .seg {
          min-height: 36px;
          padding: 0 15px;
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
        .cycle {
          padding: 6px 12px;
          font-size: 0.75rem;
          font-weight: 600;
          color: ${T.navy};
          background: rgba(11, 31, 77, 0.05);
          border: 1px solid rgba(11, 31, 77, 0.1);
          border-radius: 999px;
        }

        /* ---- Table ---- */
        .tablecard { overflow: hidden; }
        .row { animation: rowIn 380ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        .row.is-over { background: rgba(239, 68, 68, 0.025); }
        .th-act { text-align: right; }
        .nm { font-weight: 600; color: ${T.text}; }
        .dim { color: ${T.muted}; font-size: 0.875rem; white-space: nowrap; }
        .amt { font-variant-numeric: tabular-nums; color: #374151; white-space: nowrap; }
        .paid {
          display: block;
          font-weight: 600;
          color: #15803d;
          font-variant-numeric: tabular-nums;
        }
        .minitrack {
          display: block;
          width: 76px;
          height: 4px;
          margin: 5px 0 3px;
          border-radius: 999px;
          background: #eef2f7;
          overflow: hidden;
        }
        .minifill {
          display: block;
          height: 100%;
          border-radius: 999px;
          background: ${T.success};
          transition: width 560ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .due { font-size: 0.75rem; color: #b45309; font-variant-numeric: tabular-nums; }
        .b-ok { background: rgba(34, 197, 94, 0.1); border-color: rgba(34, 197, 94, 0.22); color: #15803d; }
        .b-bad { background: rgba(239, 68, 68, 0.08); border-color: rgba(239, 68, 68, 0.2); color: #b91c1c; }
        .b-warn { background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.22); color: #b45309; }
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
          white-space: nowrap;
          transition: background 150ms ease, border-color 150ms ease;
        }
        .act:hover:not(:disabled) { background: ${T.hover}; border-color: rgba(37, 99, 235, 0.2); }
        .act:disabled { opacity: 0.55; cursor: default; }
        .act-ok { color: #15803d; }
        .act-ok:hover:not(:disabled) { background: rgba(34, 197, 94, 0.08); border-color: rgba(34, 197, 94, 0.28); }
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
        .sk-l1 { height: 11px; width: 32%; border-radius: 6px; }
        .sk-l2 { height: 9px; width: 18%; border-radius: 6px; }
        .sk-amt { width: 72px; height: 12px; border-radius: 6px; flex: none; }
        .sk-pill { width: 68px; height: 22px; border-radius: 999px; flex: none; }

        /* ---- Mobile cards ---- */
        .cards { display: none; }
        .fcard {
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 16px;
          padding: 14px;
          box-shadow: 0 1px 2px rgba(11, 31, 77, 0.04);
          animation: rowIn 400ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .fcard + .fcard { margin-top: 10px; }
        .fcard.is-over { border-left: 3px solid ${T.danger}; }
        .fcard-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .fcard-id { min-width: 0; }
        .fcard-n {
          margin: 0;
          font-size: 0.9375rem;
          font-weight: 700;
          color: ${T.text};
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .fcard-c { margin: 3px 0 0; font-size: 0.8125rem; color: ${T.muted}; }
        .fcard-money { display: flex; align-items: baseline; gap: 7px; margin: 13px 0 0; }
        .fm-paid {
          font-size: 1.25rem;
          font-weight: 700;
          color: #15803d;
          letter-spacing: -0.02em;
          font-variant-numeric: tabular-nums;
        }
        .fm-of { font-size: 0.8125rem; color: ${T.muted}; font-variant-numeric: tabular-nums; }
        .fm-due { margin: 7px 0 0; font-size: 0.8125rem; font-weight: 600; color: #b45309; }
        .fcard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 11px 12px;
          margin: 13px 0 0;
          padding: 13px 0 0;
          border-top: 1px solid #f1f5f9;
        }
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
        .fcard-acts { display: flex; gap: 8px; margin-top: 13px; }

        /* ---- Bulk modal ---- */
        .bulk { display: flex; flex-direction: column; gap: 15px; }
        .bulk-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; }
        .bs { padding: 15px; text-align: center; border-radius: 14px; border: 1px solid; }
        .bs-go { background: rgba(245, 158, 11, 0.08); border-color: rgba(245, 158, 11, 0.22); }
        .bs-skip { background: ${T.bg}; border-color: ${T.border}; }
        .bs-v {
          margin: 0;
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          font-variant-numeric: tabular-nums;
          color: #b45309;
        }
        .bs-skip .bs-v { color: #9ca3af; }
        .bs-l { margin: 4px 0 0; font-size: 0.8125rem; color: #92400e; }
        .bs-skip .bs-l { color: ${T.muted}; }
        .list { border: 1px solid ${T.border}; border-radius: 14px; overflow: hidden; }
        .list-h {
          padding: 9px 14px;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: ${T.muted};
          background: ${T.bg};
          border-bottom: 1px solid ${T.border};
        }
        .list-b { max-height: 13rem; overflow-y: auto; }
        .li {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 14px;
        }
        .li + .li { border-top: 1px solid #f1f5f9; }
        .li-l { min-width: 0; }
        .li-n {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: ${T.text};
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .li-e {
          margin: 2px 0 0;
          font-size: 0.75rem;
          color: #9ca3af;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .li-r { text-align: right; flex: none; }
        .li-a {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 700;
          color: ${T.danger};
          font-variant-numeric: tabular-nums;
        }
        .li-s { font-size: 0.75rem; color: #b45309; }
        .li-s.over { color: ${T.danger}; }
        .prog-wrap { display: flex; flex-direction: column; gap: 7px; }
        .prog-top {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          color: #4b5563;
        }
        .prog-n { font-variant-numeric: tabular-nums; }
        .none { margin: 0; padding: 14px 0; text-align: center; color: ${T.muted}; }

        /* ---- Forms ---- */
        .fm { display: flex; flex-direction: column; gap: 16px; }
        .who {
          padding: 12px 14px;
          background: ${T.hover};
          border: 1px solid rgba(37, 99, 235, 0.14);
          border-radius: 12px;
        }
        .who-n { margin: 0; font-size: 0.9375rem; font-weight: 700; color: ${T.navy}; }
        .who-c { margin: 3px 0 0; font-size: 0.8125rem; color: ${T.accent}; }
        .fgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .f { display: flex; flex-direction: column; min-width: 0; }
        .span2 { grid-column: 1 / -1; }
        .fl { margin-bottom: 6px; font-size: 0.8125rem; font-weight: 600; color: #374151; }
        .facts { display: flex; gap: 10px; }
        .grow { flex: 1; }

        /* ---- Responsive ---- */
        @media (max-width: 1080px) {
          .stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 900px) {
          .remind { width: 100%; justify-content: center; }
        }
        @media (max-width: 720px) {
          .tablecard { display: none; }
          .cards { display: block; }
          .fgrid { grid-template-columns: 1fr; }
          .facts { flex-direction: column-reverse; }
          .bar { flex-direction: column-reverse; align-items: stretch; }
          .cycle { align-self: flex-start; }
        }
        @media (max-width: 420px) {
          .stats { grid-template-columns: 1fr; }
          .fcard-grid { grid-template-columns: 1fr; }
          .bulk-stats { grid-template-columns: 1fr; }
        }
      `}</style>
    </InstituteLayout>
  );
}
