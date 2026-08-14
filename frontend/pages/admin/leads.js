import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import api, { getUser } from '../../lib/api';
import toast from 'react-hot-toast';
import { T } from '../../components/ds/tokens';

const STATUSES = [
  { value: 'new',                  label: 'New',                  color: '#1D4ED8' },
  { value: 'under_review',         label: 'Under Review',         color: '#0B1F4D' },
  { value: 'awaiting_confirmation',label: 'Awaiting Confirmation', color: '#B45309' },
  { value: 'setup_in_progress',    label: 'Setup In Progress',    color: '#2563EB' },
  { value: 'converted',            label: 'Converted',            color: '#15803D' },
  { value: 'not_proceeding',       label: 'Not Proceeding',       color: '#B91C1C' },
];

const statusStyle = (val) => {
  if (val === 'converted')       return { color: '#15803D', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.28)' };
  if (val === 'not_proceeding')  return { color: '#B91C1C', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.28)' };
  if (val === 'awaiting_confirmation') return { color: '#B45309', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' };
  return { color: '#1D4ED8', bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.24)' };
};

const fmtDate = (val) => {
  if (!val) return '\u2014';
  const d = new Date(val);
  if (isNaN(d)) return String(val);
  return `${String(d.getUTCDate()).padStart(2,'0')} ${d.toLocaleString('en-IN',{month:'short',timeZone:'UTC'})} ${d.getUTCFullYear()}`;
};

const initials = (name) =>
  String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('') || '?';

export default function AdminLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== 'admin') { router.replace('/admin/login'); return; }
    fetchLeads();
  }, []);

  const fetchLeads = async (attempt = 1) => {
    try {
      const res = await api.get('/api/admin/leads');
      setLeads(res.data);
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.error || err?.message || 'Unknown error';
      if (!err?.response && attempt === 1) {
        setTimeout(() => fetchLeads(2), 3000);
        return;
      }
      if (status === 401 || status === 403) { toast.error('Session expired.'); router.replace('/admin/login'); }
      else toast.error(`Failed to load leads: ${msg}`);
    } finally { setLoading(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/api/admin/leads/${id}`, { status });
      setLeads(prev => prev.map(l => l._id === id ? { ...l, status } : l));
      toast.success('Status updated');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Update failed');
    }
  };

  const deleteLead = async (id) => {
    if (!confirm('Delete this lead? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await api.delete(`/api/admin/leads/${id}`);
      setLeads(prev => prev.filter(l => l._id !== id));
      toast.success('Lead deleted');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Delete failed');
    } finally { setDeleting(null); }
  };

  // Stats using new statuses
  const statCounts = STATUSES.map(s => ({
    ...s,
    count: leads.filter(l => l.status === s.value).length,
  }));

  const total = leads.length;
  const convertedPct = total ? Math.round((statCounts.find(s => s.value === 'converted')?.count || 0) / total * 100) : 0;

  return (
    <AdminLayout title="Leads">

      {/* ---- Masthead ---- */}
      <div className="mast">
        <div>
          <p className="sc-eyebrow">Acquisition</p>
          <h1 className="sc-h1">Leads</h1>
          <p className="sub">
            {total} lead{total !== 1 ? 's' : ''} in total &middot; {convertedPct}% converted
          </p>
        </div>
      </div>

      {/* ---- Pipeline stats ---- */}
      <div className="stats">
        {statCounts.map((s, i) => {
          const pct = total ? Math.round((s.count / total) * 100) : 0;
          return (
            <div className="stat" key={s.value} style={{ animationDelay: `${i * 45}ms` }}>
              <div className="stat-v" style={{ color: s.color }}>{s.count}</div>
              <div className="stat-k">{s.label}</div>
              <div className="track">
                <div className="fill" style={{ width: `${pct}%`, background: s.color }} />
              </div>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="sc-card sc-i tablecard" role="status" aria-label="Loading leads...">
          <div className="skwrap">
            {[0, 1, 2, 3, 4].map(i => (
              <div className="sk-row" key={i} style={{ animationDelay: `${i * 60}ms` }}>
                <div className="sc-skel sk-av" />
                <div className="sk-lines">
                  <div className="sc-skel sk-l1" />
                  <div className="sc-skel sk-l2" />
                </div>
                <div className="sc-skel sk-pill" />
              </div>
            ))}
          </div>
          <p className="sronly">Loading...</p>
        </div>
      ) : (
        <div className="sc-card sc-i tablecard">
          {/* Desktop table */}
          <div className="sc-table-scroll tablescroll">
            <table className="sc-table">
              <thead>
                <tr>
                  {['Institute', 'Owner', 'Contact', 'Type', 'Students', 'Date', 'Status', ''].map(h => (
                    <th key={h} className={h === '' ? 'th-act' : undefined}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, i) => {
                  const st = statusStyle(lead.status);
                  return (
                    <tr key={lead._id} className="row" style={{ animationDelay: `${Math.min(i, 12) * 28}ms` }}>
                      <td>
                        <div className="who">
                          <span className="av">{initials(lead.instituteName)}</span>
                          <div className="who-t">
                            <p className="who-n">{lead.instituteName}</p>
                            {lead.message && <p className="who-m">{lead.message}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="nm">{lead.ownerName}</td>
                      <td>
                        <p className="ct">
                          {lead.phone
                            ? <a className="vlink" href={`tel:${lead.phone}`}>{lead.phone}</a>
                            : '\u2014'}
                        </p>
                        <p className="ce">
                          {lead.email
                            ? <a className="vlink" href={`mailto:${lead.email}`}>{lead.email}</a>
                            : null}
                        </p>
                      </td>
                      <td className="dim">{lead.instituteType || '\u2014'}</td>
                      <td className="num">{lead.numberOfStudents || '\u2014'}</td>
                      <td className="date">{fmtDate(lead.createdAt)}</td>
                      <td>
                        <select
                          className="sel"
                          aria-label={`Status for ${lead.instituteName}`}
                          style={{ background: st.bg, color: st.color, borderColor: st.border }}
                          value={lead.status || 'new'}
                          onChange={e => updateStatus(lead._id, e.target.value)}>
                          {STATUSES.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="th-act">
                        <button onClick={() => deleteLead(lead._id)} disabled={deleting === lead._id}
                          className="act act-danger">
                          {deleting === lead._id ? '...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {leads.length === 0 && (
                  <tr><td colSpan={8} className="nores">No leads yet</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="cards">
            {leads.length === 0 ? (
              <p className="nores">No leads yet</p>
            ) : leads.map((lead, i) => {
              const st = statusStyle(lead.status);
              return (
                <div className="lcard" key={lead._id} style={{ animationDelay: `${Math.min(i, 12) * 28}ms` }}>
                  <div className="lcard-top">
                    <span className="av">{initials(lead.instituteName)}</span>
                    <div className="lcard-t">
                      <p className="who-n">{lead.instituteName}</p>
                      <p className="who-o">{lead.ownerName}</p>
                    </div>
                    <span className="date">{fmtDate(lead.createdAt)}</span>
                  </div>

                  {lead.message && <p className="lcard-msg">{lead.message}</p>}

                  <div className="lcard-grid">
                    <div><span className="k">Phone</span>
                      <span className="v">
                        {lead.phone ? <a className="vlink" href={`tel:${lead.phone}`}>{lead.phone}</a> : '\u2014'}
                      </span>
                    </div>
                    <div><span className="k">Type</span><span className="v">{lead.instituteType || '\u2014'}</span></div>
                    <div className="span2"><span className="k">Email</span>
                      <span className="v vtrunc">
                        {lead.email ? <a className="vlink" href={`mailto:${lead.email}`}>{lead.email}</a> : '\u2014'}
                      </span>
                    </div>
                    <div><span className="k">Students</span><span className="v">{lead.numberOfStudents || '\u2014'}</span></div>
                  </div>

                  <div className="lcard-acts">
                    <select
                      className="sel grow"
                      aria-label={`Status for ${lead.instituteName}`}
                      style={{ background: st.bg, color: st.color, borderColor: st.border }}
                      value={lead.status || 'new'}
                      onChange={e => updateStatus(lead._id, e.target.value)}>
                      {STATUSES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <button onClick={() => deleteLead(lead._id)} disabled={deleting === lead._id}
                      className="sc-btn sc-btn-danger sc-btn-sm">
                      {deleting === lead._id ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        .mast { margin-bottom: 16px; }
        .sub { margin: 5px 0 0; font-size: 0.875rem; color: ${T.muted}; }

        /* ---- Stats ---- */
        .stats {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 16px;
        }
        .stat {
          padding: 13px 12px 12px;
          text-align: center;
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 14px;
          animation: rise 460ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes rise {
          from { opacity: 0; transform: translateY(7px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .stat-v {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          font-variant-numeric: tabular-nums;
        }
        .stat-k {
          margin-top: 3px;
          font-size: 0.6875rem;
          font-weight: 600;
          line-height: 1.3;
          color: ${T.muted};
        }
        .track {
          height: 3px;
          margin-top: 9px;
          border-radius: 999px;
          background: #eef2f7;
          overflow: hidden;
        }
        .fill { height: 100%; border-radius: 999px; transition: width 700ms cubic-bezier(0.16, 1, 0.3, 1); }

        /* ---- Table ---- */
        .tablecard { overflow: hidden; }
        .row { animation: rise 380ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        .th-act { text-align: right; }
        .who { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .av {
          width: 32px;
          height: 32px;
          flex: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: ${T.hover};
          color: ${T.accent};
          font-size: 0.6875rem;
          font-weight: 700;
        }
        .who-t { min-width: 0; }
        .who-n {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: ${T.text};
          white-space: nowrap;
        }
        .who-m {
          margin: 2px 0 0;
          max-width: 11rem;
          font-size: 0.75rem;
          color: #9ca3af;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .who-o { margin: 2px 0 0; font-size: 0.75rem; color: ${T.muted}; }
        .nm { color: #4b5563; white-space: nowrap; }
        .ct { margin: 0; font-size: 0.8125rem; color: #374151; white-space: nowrap; }
        .ce { margin: 2px 0 0; font-size: 0.75rem; color: #9ca3af; }
        .dim { color: ${T.muted}; font-size: 0.8125rem; white-space: nowrap; }
        .num { color: ${T.muted}; font-variant-numeric: tabular-nums; }
        .date { color: #9ca3af; font-size: 0.75rem; white-space: nowrap; }
        .vlink { color: inherit; text-decoration: none; }
        .vlink:hover { color: ${T.accent}; text-decoration: underline; }

        .sel {
          min-height: 34px;
          padding: 0 9px;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid;
          border-radius: 9px;
          cursor: pointer;
          appearance: none;
          background-image: none;
          transition: filter 160ms ease;
        }
        .sel:hover { filter: brightness(0.97); }
        .sel:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.26); }

        .act {
          min-height: 32px;
          padding: 0 11px;
          font-size: 0.75rem;
          font-weight: 600;
          background: ${T.bg};
          border: 1px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
        }
        .act:disabled { opacity: 0.5; cursor: default; }
        .act-danger { color: ${T.danger}; }
        .act-danger:hover:enabled {
          background: rgba(239, 68, 68, 0.08);
          color: #b91c1c;
          border-color: rgba(239, 68, 68, 0.28);
        }

        .nores {
          padding: 44px 16px;
          text-align: center;
          color: ${T.muted};
          font-size: 0.875rem;
        }

        /* ---- Skeleton ---- */
        .skwrap { padding: 8px 4px; }
        .sk-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 16px;
          animation: skIn 420ms ease both;
        }
        @keyframes skIn { from { opacity: 0; } to { opacity: 1; } }
        .sk-av { width: 32px; height: 32px; border-radius: 10px; flex: none; }
        .sk-lines { flex: 1; }
        .sk-l1 { height: 11px; width: 40%; border-radius: 6px; }
        .sk-l2 { height: 9px; width: 22%; border-radius: 6px; margin-top: 7px; }
        .sk-pill { width: 6rem; height: 30px; border-radius: 9px; flex: none; }
        .sronly {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          white-space: nowrap;
        }

        /* ---- Mobile cards ---- */
        .cards { display: none; }
        .lcard {
          padding: 14px;
          border-bottom: 1px solid #f1f5f9;
          animation: rise 380ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .lcard:last-child { border-bottom: none; }
        .lcard-top { display: flex; align-items: center; gap: 10px; }
        .lcard-t { flex: 1; min-width: 0; }
        .lcard-msg {
          margin: 10px 0 0;
          padding: 9px 11px;
          font-size: 0.8125rem;
          line-height: 1.5;
          color: #4b5563;
          background: ${T.bg};
          border-radius: 10px;
        }
        .lcard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 11px;
          margin-top: 12px;
        }
        .span2 { grid-column: span 2; }
        .k {
          display: block;
          font-size: 0.625rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #9ca3af;
        }
        .v { display: block; margin-top: 3px; font-size: 0.8125rem; color: ${T.text}; }
        .vtrunc { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .lcard-acts { display: flex; gap: 8px; margin-top: 13px; }
        .grow { flex: 1; }

        /* ---- Responsive ---- */
        @media (max-width: 1080px) {
          .stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 720px) {
          .tablescroll { display: none; }
          .cards { display: block; }
          .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .lcard-acts > .sel { min-height: 40px; }
        }
      `}</style>
    </AdminLayout>
  );
}
