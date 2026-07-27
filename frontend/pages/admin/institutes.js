import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/ui/Modal';
import api, { getUser } from '../../lib/api';
import toast from 'react-hot-toast';
import { T } from '../../components/ds/tokens';

const RUPEE = '\u20B9';

const EMPTY_FORM = {
  instituteName: '', ownerName: '', email: '', phone: '',
  instituteType: 'Coaching Centre', googleSheetId: '', appsScriptUrl: '',
  planAmount: '', paymentStatus: 'paid', dueDate: '', billingDay: 1, password: ''
};

const initials = (name) =>
  String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('') || '?';

const fmtJoin = (val) => {
  if (!val) return '\u2014';
  const d = new Date(val);
  if (isNaN(d)) return String(val);
  return `${String(d.getUTCDate()).padStart(2,'0')} ${d.toLocaleString('en-IN',{month:'short',timeZone:'UTC'})} ${d.getUTCFullYear()}`;
};

function EyeIcon({ off }) {
  return off ? (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 3l14 14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M7.2 5.5A7.6 7.6 0 0 1 10 5c4 0 7 5 7 5a12 12 0 0 1-1.9 2.4M5.3 7.1A12.6 12.6 0 0 0 3 10s3 5 7 5a7.4 7.4 0 0 0 2.4-.4"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 5c4 0 7 5 7 5s-3 5-7 5-7-5-7-5 3-5 7-5Z" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="10" cy="10" r="2.1" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

// ---- Separate credentials modal so it can't be accidentally dismissed ----
function CredsModal({ creds, onClose }) {
  const [copied, setCopied] = useState(false);

  const copyAll = () => {
    const text = `Login ID: ${creds.loginId}\nPassword: ${creds.password}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="host" role="dialog" aria-modal="true" aria-label="Institute Created">
      <div className="scrim" />
      <div className="panel">
        <div className="seal">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
            <path d="M6 13.4 L10.6 18 L20 8.6" stroke="currentColor" strokeWidth="2.4"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h2 className="ctitle">Institute Created!</h2>
        <p className="cwarn">
          Save these credentials now &mdash; password cannot be recovered later
        </p>

        <div className="credbox">
          <div className="credrow">
            <p className="credk">Login ID</p>
            <p className="credv">{creds.loginId}</p>
          </div>
          <div className="credrow credrow-b">
            <p className="credk">Password</p>
            <p className="credv">{creds.password}</p>
          </div>
        </div>

        <div className="cacts">
          <button onClick={copyAll} className="sc-btn sc-btn-secondary grow">
            {copied ? 'Copied!' : 'Copy Both'}
          </button>
          <button onClick={onClose} className="sc-btn sc-btn-primary grow">
            I&apos;ve Saved These
          </button>
        </div>
      </div>

      <style jsx>{`
        .host {
          position: fixed;
          inset: 0;
          z-index: 70;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .scrim {
          position: absolute;
          inset: 0;
          background: rgba(11, 31, 77, 0.5);
          backdrop-filter: blur(3px);
          animation: cs 220ms ease both;
        }
        @keyframes cs { from { opacity: 0; } to { opacity: 1; } }
        .panel {
          position: relative;
          width: 100%;
          max-width: 26rem;
          padding: 26px 24px 24px;
          text-align: center;
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 20px;
          box-shadow: 0 24px 60px rgba(11, 31, 77, 0.2);
          animation: cp 320ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes cp {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .seal {
          width: 52px;
          height: 52px;
          margin: 0 auto 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: #ffffff;
          background: linear-gradient(140deg, #22c55e, #15803d);
          box-shadow: 0 8px 20px rgba(34, 197, 94, 0.3);
        }
        .ctitle {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: -0.015em;
          color: ${T.navy};
        }
        .cwarn {
          margin: 8px 0 18px;
          font-size: 0.8125rem;
          font-weight: 500;
          line-height: 1.5;
          color: #b91c1c;
        }
        .credbox {
          text-align: left;
          background: ${T.bg};
          border: 1px solid ${T.border};
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 18px;
        }
        .credrow { padding: 13px 15px; }
        .credrow-b { border-top: 1px solid ${T.border}; }
        .credk {
          margin: 0 0 4px;
          font-size: 0.625rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: ${T.muted};
        }
        .credv {
          margin: 0;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 1.0625rem;
          font-weight: 700;
          color: ${T.text};
          word-break: break-all;
        }
        .cacts { display: flex; gap: 10px; }
        .grow { flex: 1; }
        @media (max-width: 420px) {
          .cacts { flex-direction: column-reverse; }
        }
      `}</style>
    </div>
  );
}

// ---- Reset Password Modal ----
function ResetPasswordModal({ institute, onConfirm, onClose }) {
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pw.length < 6) { alert('Password must be at least 6 characters'); return; }
    setSaving(true);
    await onConfirm(pw);
    setSaving(false);
  };

  return (
    <div className="host" role="dialog" aria-modal="true" aria-label="Reset Password">
      <div className="scrim" onClick={onClose} />
      <div className="panel">
        <h2 className="rtitle">Reset Password</h2>
        <p className="rname">{institute.name}</p>

        <form onSubmit={handleSubmit} className="rform">
          <div className="pwwrap">
            <input
              type={showPw ? 'text' : 'password'}
              className="sc-field haspad"
              placeholder="New password (min 6 chars)"
              value={pw}
              onChange={e => setPw(e.target.value)}
              required minLength={6} autoFocus
            />
            <button type="button" onClick={() => setShowPw(p => !p)} className="eye"
              aria-label={showPw ? 'Hide password' : 'Show password'}>
              <EyeIcon off={showPw} />
            </button>
          </div>
          <div className="racts">
            <button type="button" className="sc-btn sc-btn-secondary grow" onClick={onClose}>Cancel</button>
            <button type="submit" className="sc-btn sc-btn-primary grow" disabled={saving}>
              {saving ? 'Saving...' : 'Set Password'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .host {
          position: fixed;
          inset: 0;
          z-index: 70;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .scrim {
          position: absolute;
          inset: 0;
          background: rgba(11, 31, 77, 0.45);
          backdrop-filter: blur(3px);
          animation: rs 200ms ease both;
        }
        @keyframes rs { from { opacity: 0; } to { opacity: 1; } }
        .panel {
          position: relative;
          width: 100%;
          max-width: 23rem;
          padding: 22px;
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 20px;
          box-shadow: 0 24px 60px rgba(11, 31, 77, 0.2);
          animation: rp 300ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes rp {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .rtitle {
          margin: 0;
          font-size: 1.0625rem;
          font-weight: 700;
          color: ${T.navy};
        }
        .rname { margin: 5px 0 17px; font-size: 0.875rem; color: ${T.muted}; }
        .rform { display: flex; flex-direction: column; gap: 15px; }
        .pwwrap { position: relative; }
        .haspad { padding-right: 46px; }
        .eye {
          position: absolute;
          right: 5px;
          top: 50%;
          transform: translateY(-50%);
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          background: transparent;
          border: 0;
          border-radius: 9px;
          cursor: pointer;
          transition: color 160ms ease, background 160ms ease;
        }
        .eye:hover { color: ${T.accent}; background: ${T.hover}; }
        .racts { display: flex; gap: 10px; }
        .grow { flex: 1; }
      `}</style>
    </div>
  );
}

export default function AdminInstitutes() {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [newCreds, setNewCreds] = useState(null);
  const [search, setSearch] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [resetModal, setResetModal] = useState(null); // { id, name }
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== 'admin') { router.push('/admin/login'); return; }
    fetchInstitutes();
    if (router.query.action === 'new') openNew();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInstitutes = async () => {
    try {
      const res = await api.get('/api/admin/institutes');
      setInstitutes(res.data);
    } catch { toast.error('Failed to load institutes'); }
    finally { setLoading(false); }
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openNew = () => { setEditId(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (inst) => {
    setEditId(inst._id);
    setForm({
      instituteName: inst.instituteName, ownerName: inst.ownerName,
      email: inst.email, phone: inst.phone,
      instituteType: inst.instituteType || 'Coaching Centre',
      googleSheetId: inst.googleSheetId, appsScriptUrl: inst.appsScriptUrl,
      planAmount: inst.planAmount, paymentStatus: inst.paymentStatus,
      billingDay: inst.billingDay || 1,
      dueDate: inst.dueDate ? inst.dueDate.substring(0, 10) : ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/api/admin/institutes/${editId}`, form);
        toast.success('Institute updated');
        setShowModal(false);
      } else {
        const res = await api.post('/api/admin/institutes', form);
        setShowModal(false); // close form first
        setNewCreds(res.data.credentials); // then show creds modal
        toast.success('Institute created!');
      }
      fetchInstitutes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleToggleActive = async (id, name, currentlyActive) => {
    const action = currentlyActive ? 'deactivate' : 'activate';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} "${name}"?`)) return;
    try {
      await api.patch(`/api/admin/institutes/${id}`, { isActive: !currentlyActive });
      toast.success(`Institute ${action}d`);
      fetchInstitutes();
    } catch { toast.error(`Failed to ${action} institute`); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/admin/institutes/${id}`);
      toast.success('Institute deleted');
      fetchInstitutes();
    } catch { toast.error('Delete failed'); }
  };

  const resetPassword = async (password) => {
    if (!resetModal) return;
    try {
      const res = await api.patch(`/api/admin/institutes/${resetModal.id}/reset-password`, { password });
      setResetModal(null);
      setNewCreds({ loginId: institutes.find(i => i._id === resetModal.id)?.loginId, password: res.data.newPassword });
    } catch { toast.error('Failed to reset password'); }
  };

  const filtered = institutes.filter(i =>
    i.instituteName.toLowerCase().includes(search.toLowerCase()) ||
    i.ownerName.toLowerCase().includes(search.toLowerCase()) ||
    i.email.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = institutes.filter(i => i.isActive !== false).length;
  const overdueCount = institutes.filter(i => i.paymentStatus !== 'paid').length;

  return (
    <AdminLayout title="Institutes">

      {/* Credentials Modal - shown after create or reset password */}
      {newCreds && <CredsModal creds={newCreds} onClose={() => setNewCreds(null)} />}

      {/* ---- Masthead ---- */}
      <div className="mast">
        <div>
          <p className="sc-eyebrow">Tenants</p>
          <h1 className="sc-h1">Institutes</h1>
          <p className="sub">
            {institutes.length} total &middot; {activeCount} active
            {overdueCount > 0 ? ` \u00B7 ${overdueCount} overdue` : ''}
          </p>
        </div>

        <div className="mast-r">
          <div className="search">
            <span className="s-ico" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="4.6" stroke="currentColor" strokeWidth="1.6" />
                <path d="M10.6 10.6 14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
            <input
              className="s-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search institutes..."
              aria-label="Search institutes"
            />
            {search && (
              <button className="s-clear" onClick={() => setSearch('')} aria-label="Clear search">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <path d="M2.6 2.6l7.8 7.8M10.4 2.6l-7.8 7.8" stroke="currentColor"
                    strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          <button onClick={openNew} className="sc-btn sc-btn-primary nowrap">
            Add Institute
          </button>
        </div>
      </div>

      {loading ? (
        <div className="sc-card sc-i tablecard" role="status" aria-label="Loading institutes...">
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
                  {['Institute Name','Owner Name','Login ID','Email','Phone','Institute Type','Plan','Bill Day','Status','Payment Status','Join Date','Actions'].map(h => (
                    <th key={h} className={h === 'Actions' ? 'th-act' : undefined}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inst, i) => (
                  <tr key={inst._id} className="row" style={{ animationDelay: `${Math.min(i, 12) * 28}ms` }}>
                    <td>
                      <div className="who">
                        <span className="av">{initials(inst.instituteName)}</span>
                        <span className="who-n">{inst.instituteName}</span>
                      </div>
                    </td>
                    <td className="nm">{inst.ownerName}</td>
                    <td><code className="idchip">{inst.loginId}</code></td>
                    <td className="em">
                      {inst.email
                        ? <a className="vlink" href={`mailto:${inst.email}`}>{inst.email}</a>
                        : '\u2014'}
                    </td>
                    <td className="dim">
                      {inst.phone
                        ? <a className="vlink" href={`tel:${inst.phone}`}>{inst.phone}</a>
                        : '\u2014'}
                    </td>
                    <td className="dim">{inst.instituteType || '\u2014'}</td>
                    <td className="plan">{RUPEE}{inst.planAmount?.toLocaleString('en-IN')}</td>
                    <td className="dim num">{inst.billingDay || 1}</td>
                    <td>
                      <span className={inst.isActive !== false ? 'b b-ok' : 'b b-off'}>
                        {inst.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <span className={inst.paymentStatus === 'paid' ? 'b b-ok' : 'b b-bad'}>
                        {inst.paymentStatus === 'paid' ? 'Paid' : 'Overdue'}
                      </span>
                    </td>
                    <td className="date">{fmtJoin(inst.createdAt)}</td>
                    <td className="th-act">
                      <div className="acts">
                        <button onClick={() => openEdit(inst)} className="act">Edit</button>
                        <button
                          onClick={() => handleToggleActive(inst._id, inst.instituteName, inst.isActive !== false)}
                          className={inst.isActive !== false ? 'act act-warn' : 'act act-ok'}>
                          {inst.isActive !== false ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => setResetModal({ id: inst._id, name: inst.instituteName })}
                          className="act">Reset PW</button>
                        <button onClick={() => handleDelete(inst._id, inst.instituteName)}
                          className="act act-danger">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={12} className="nores">
                    {search ? 'No institutes match your search' : 'No institutes yet. Add one!'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="cards">
            {filtered.length === 0 ? (
              <p className="nores">
                {search ? 'No institutes match your search' : 'No institutes yet. Add one!'}
              </p>
            ) : filtered.map((inst, i) => (
              <div className="icard" key={inst._id} style={{ animationDelay: `${Math.min(i, 12) * 28}ms` }}>
                <div className="icard-top">
                  <span className="av">{initials(inst.instituteName)}</span>
                  <div className="icard-t">
                    <p className="who-n">{inst.instituteName}</p>
                    <p className="who-o">{inst.ownerName}</p>
                  </div>
                  <div className="icard-b">
                    <span className={inst.isActive !== false ? 'b b-ok' : 'b b-off'}>
                      {inst.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                    <span className={inst.paymentStatus === 'paid' ? 'b b-ok' : 'b b-bad'}>
                      {inst.paymentStatus === 'paid' ? 'Paid' : 'Overdue'}
                    </span>
                  </div>
                </div>

                <div className="icard-grid">
                  <div><span className="k">Login ID</span><span className="v"><code className="idchip">{inst.loginId}</code></span></div>
                  <div><span className="k">Plan</span><span className="v plan">{RUPEE}{inst.planAmount?.toLocaleString('en-IN')}</span></div>
                  <div className="span2"><span className="k">Email</span>
                    <span className="v vtrunc">
                      {inst.email ? <a className="vlink" href={`mailto:${inst.email}`}>{inst.email}</a> : '\u2014'}
                    </span>
                  </div>
                  <div><span className="k">Phone</span>
                    <span className="v">
                      {inst.phone ? <a className="vlink" href={`tel:${inst.phone}`}>{inst.phone}</a> : '\u2014'}
                    </span>
                  </div>
                  <div><span className="k">Bill Day</span><span className="v">{inst.billingDay || 1}</span></div>
                  <div><span className="k">Institute Type</span><span className="v">{inst.instituteType || '\u2014'}</span></div>
                  <div><span className="k">Join Date</span><span className="v">{fmtJoin(inst.createdAt)}</span></div>
                </div>

                <div className="icard-acts">
                  <button onClick={() => openEdit(inst)} className="sc-btn sc-btn-secondary sc-btn-sm grow">Edit</button>
                  <button
                    onClick={() => handleToggleActive(inst._id, inst.instituteName, inst.isActive !== false)}
                    className="sc-btn sc-btn-secondary sc-btn-sm grow">
                    {inst.isActive !== false ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => setResetModal({ id: inst._id, name: inst.instituteName })}
                    className="sc-btn sc-btn-secondary sc-btn-sm grow">Reset PW</button>
                  <button onClick={() => handleDelete(inst._id, inst.instituteName)}
                    className="sc-btn sc-btn-danger sc-btn-sm grow">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModal && (
        <ResetPasswordModal
          institute={resetModal}
          onConfirm={resetPassword}
          onClose={() => setResetModal(null)}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}
        title={editId ? 'Edit Institute' : 'Add New Institute'} size="lg">
        <form onSubmit={handleSubmit} className="fm">
          <div className="fgrid">
            <div className="f">
              <label className="fl">Institute Name *</label>
              <input className="sc-field" value={form.instituteName}
                onChange={e => set('instituteName', e.target.value)} required />
            </div>
            <div className="f">
              <label className="fl">Owner Name *</label>
              <input className="sc-field" value={form.ownerName}
                onChange={e => set('ownerName', e.target.value)} required />
            </div>
            <div className="f">
              <label className="fl">Email *</label>
              <input type="email" className="sc-field" value={form.email}
                onChange={e => set('email', e.target.value)} required />
            </div>
            <div className="f">
              <label className="fl">Phone *</label>
              <input className="sc-field" value={form.phone}
                onChange={e => set('phone', e.target.value)} required />
            </div>
            <div className="f">
              <label className="fl">Institute Type</label>
              <select className="sc-field" value={form.instituteType} onChange={e => set('instituteType', e.target.value)}>
                <option>Coaching Centre</option>
                <option>Tuition Centre</option>
                <option>Training Academy</option>
                <option>Skill Development</option>
                <option>Other</option>
              </select>
            </div>
            <div className="f span2">
              <label className="fl">
                {editId ? 'Password (leave blank to keep unchanged)' : 'Password *'}
              </label>
              <div className="pwwrap">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="sc-field haspad"
                  placeholder={editId ? 'Leave blank to keep existing password' : 'Set a password (min 6 chars)'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  required={!editId}
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPw(p => !p)} className="eye"
                  aria-label={showPw ? 'Hide password' : 'Show password'}>
                  <EyeIcon off={showPw} />
                </button>
              </div>
            </div>
            <div className="f">
              <label className="fl">{`Plan Amount (${RUPEE}) *`}</label>
              <input type="number" className="sc-field" value={form.planAmount}
                onChange={e => set('planAmount', e.target.value)} required />
            </div>
            <div className="f span2">
              <label className="fl">Google Sheet ID *</label>
              <input className="sc-field mono" placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                value={form.googleSheetId} onChange={e => set('googleSheetId', e.target.value)} required />
            </div>
            <div className="f span2">
              <label className="fl">Apps Script Web App URL *</label>
              <input className="sc-field mono" placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                value={form.appsScriptUrl} onChange={e => set('appsScriptUrl', e.target.value)} required />
            </div>
            <div className="f">
              <label className="fl">Payment Status</label>
              <select className="sc-field" value={form.paymentStatus} onChange={e => set('paymentStatus', e.target.value)}>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div className="f">
              <label className="fl">Due Date</label>
              <input type="date" className="sc-field" value={form.dueDate}
                onChange={e => set('dueDate', e.target.value)} />
            </div>
            <div className="f">
              <label className="fl">Payment Date (day of month) *</label>
              <input type="number" min="1" max="31" className="sc-field" value={form.billingDay}
                onChange={e => set('billingDay', e.target.value)} required placeholder="e.g. 5" />
              <p className="fh">Invoice auto-sends on this day of every month (1-31).</p>
            </div>
          </div>

          <div className="facts">
            <button type="button" className="sc-btn sc-btn-secondary grow" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="sc-btn sc-btn-primary grow" disabled={saving}>
              {saving ? 'Saving...' : editId ? 'Update Institute' : 'Create Institute'}
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
          margin-bottom: 16px;
        }
        .sub { margin: 5px 0 0; font-size: 0.875rem; color: ${T.muted}; }
        .mast-r { display: flex; align-items: center; gap: 9px; }
        .nowrap { white-space: nowrap; }

        /* ---- Search ---- */
        .search {
          position: relative;
          display: flex;
          align-items: center;
          width: 17rem;
        }
        .s-ico {
          position: absolute;
          left: 13px;
          display: flex;
          color: #9ca3af;
          pointer-events: none;
        }
        .s-input {
          width: 100%;
          min-height: 42px;
          padding: 0 36px 0 36px;
          font-size: 0.875rem;
          font-family: inherit;
          color: ${T.text};
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 12px;
          outline: none;
          transition: border-color 180ms ease, box-shadow 180ms ease;
        }
        .s-input::placeholder { color: #9ca3af; }
        .s-input:focus {
          border-color: ${T.accent};
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14);
        }
        .s-clear {
          position: absolute;
          right: 6px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          background: transparent;
          border: 0;
          border-radius: 8px;
          cursor: pointer;
        }
        .s-clear:hover { color: ${T.text}; background: ${T.bg}; }

        /* ---- Table ---- */
        .tablecard { overflow: hidden; }
        .row { animation: rise 380ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes rise {
          from { opacity: 0; transform: translateY(7px); }
          to   { opacity: 1; transform: translateY(0); }
        }
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
        .who-n {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: ${T.text};
          white-space: nowrap;
        }
        .who-o { margin: 2px 0 0; font-size: 0.75rem; color: ${T.muted}; }
        .nm { color: #4b5563; white-space: nowrap; }
        .em { font-size: 0.8125rem; color: ${T.muted}; }
        .dim { font-size: 0.8125rem; color: ${T.muted}; white-space: nowrap; }
        .num { font-variant-numeric: tabular-nums; }
        .date { font-size: 0.75rem; color: #9ca3af; white-space: nowrap; }
        .plan {
          font-weight: 600;
          color: ${T.text};
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }
        .idchip {
          padding: 3px 8px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.75rem;
          color: #4b5563;
          background: ${T.bg};
          border: 1px solid #eef2f7;
          border-radius: 7px;
        }
        .vlink { color: inherit; text-decoration: none; }
        .vlink:hover { color: ${T.accent}; text-decoration: underline; }

        .b {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 999px;
          white-space: nowrap;
        }
        .b-ok { color: #15803d; background: rgba(34, 197, 94, 0.12); }
        .b-bad { color: #b91c1c; background: rgba(239, 68, 68, 0.1); }
        .b-off { color: #4b5563; background: #eef2f7; }

        .acts { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
        .act {
          min-height: 30px;
          padding: 0 10px;
          font-size: 0.75rem;
          font-weight: 600;
          color: ${T.muted};
          background: ${T.bg};
          border: 1px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          white-space: nowrap;
          transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
        }
        .act:hover { background: ${T.hover}; color: ${T.accent}; border-color: rgba(37, 99, 235, 0.2); }
        .act-warn { color: #b45309; }
        .act-warn:hover { background: rgba(245, 158, 11, 0.1); color: #92400e; border-color: rgba(245, 158, 11, 0.3); }
        .act-ok { color: #15803d; }
        .act-ok:hover { background: rgba(34, 197, 94, 0.1); color: #14532d; border-color: rgba(34, 197, 94, 0.3); }
        .act-danger { color: ${T.danger}; }
        .act-danger:hover { background: rgba(239, 68, 68, 0.08); color: #b91c1c; border-color: rgba(239, 68, 68, 0.28); }

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
        .sk-l1 { height: 11px; width: 38%; border-radius: 6px; }
        .sk-l2 { height: 9px; width: 20%; border-radius: 6px; margin-top: 7px; }
        .sk-pill { width: 5rem; height: 26px; border-radius: 999px; flex: none; }
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
        .icard {
          padding: 14px;
          border-bottom: 1px solid #f1f5f9;
          animation: rise 380ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .icard:last-child { border-bottom: none; }
        .icard-top { display: flex; align-items: flex-start; gap: 10px; }
        .icard-t { flex: 1; min-width: 0; }
        .icard-b { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }
        .icard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 11px;
          margin-top: 13px;
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
        .icard-acts {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 13px;
        }

        /* ---- Form ---- */
        .fm { display: flex; flex-direction: column; gap: 16px; }
        .fgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .f { display: flex; flex-direction: column; min-width: 0; }
        .fl { margin-bottom: 6px; font-size: 0.8125rem; font-weight: 600; color: #374151; }
        .fh { margin: 7px 0 0; font-size: 0.75rem; color: #9ca3af; }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.8125rem; }
        .pwwrap { position: relative; }
        .haspad { padding-right: 46px; }
        .eye {
          position: absolute;
          right: 5px;
          top: 50%;
          transform: translateY(-50%);
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          background: transparent;
          border: 0;
          border-radius: 9px;
          cursor: pointer;
          transition: color 160ms ease, background 160ms ease;
        }
        .eye:hover { color: ${T.accent}; background: ${T.hover}; }
        .facts { display: flex; gap: 10px; }
        .grow { flex: 1; }

        /* ---- Responsive ---- */
        @media (max-width: 900px) {
          .mast-r { width: 100%; flex-wrap: wrap; }
          .search { width: 100%; }
          .mast-r > :global(button) { width: 100%; }
        }
        @media (max-width: 720px) {
          .tablescroll { display: none; }
          .cards { display: block; }
          .fgrid { grid-template-columns: 1fr; }
          .facts { flex-direction: column-reverse; }
        }
      `}</style>
    </AdminLayout>
  );
}
