import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import InstituteLayout from '../../components/layout/InstituteLayout';
import Modal from '../../components/ui/Modal';
import api, { getUser } from '../../lib/api';
import { T } from '../../components/ds/tokens';

import toast from 'react-hot-toast';
import { todayIST, fmtDate } from '../../lib/dateUtils';

const EMPTY = {
  studentName: '', phone: '', parentContact: '', email: '',
  course: '', joiningDate: todayIST(),
  address: '', totalFee: ''
};

// Deterministic avatar tint from the name, so a student keeps the same colour
// on every visit. Purely presentational.
const TINTS = [T.accent, T.accent2, T.navy, '#0891B2', '#4F46E5', '#0284C7'];
const tintFor = (name) => {
  const s = String(name || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997;
  return TINTS[h % TINTS.length];
};
const initials = (name) =>
  String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('') || '?';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== 'institute') { router.push('/institute/login'); return; }
    fetchStudents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/sheets/students');
      setStudents(res.data.data || []);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openNew = () => { setEditId(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (s) => {
    setEditId(s.StudentID);
    setForm({
      studentName: s.StudentName, phone: s.Phone, parentContact: s.ParentContact,
      email: s.Email || '', course: s.Course, joiningDate: s.JoiningDate,
      address: s.Address || '', totalFee: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/api/sheets/students/${editId}`, form);
        toast.success('Student updated');
      } else {
        await api.post('/api/sheets/students', form);
        toast.success('Student added');
      }
      setShowModal(false);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete student "${name}"?`)) return;
    try {
      await api.delete(`/api/sheets/students/${id}`);
      toast.success('Student deleted');
      fetchStudents();
    } catch { toast.error('Delete failed'); }
  };

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return (
      String(s.StudentName || '').toLowerCase().includes(q) ||
      String(s.Phone || '').includes(search) ||
      String(s.Course || '').toLowerCase().includes(q) ||
      String(s.StudentID || '').includes(search)
    );
  });

  const courses = new Set(students.map(s => s.Course).filter(Boolean));

  return (
    <InstituteLayout title="Students">
      {/* ---- Masthead: identity + primary action ---- */}
      <div className="mast">
        <div>
          <p className="sc-eyebrow">Student directory</p>
          <h1 className="sc-h1">Students</h1>
          <p className="sub">
            {loading
              ? 'Loading students...'
              : `${students.length} enrolled across ${courses.size} course${courses.size !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="mast-r">
          <div className="search">
            <svg className="s-ico" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="4.6" stroke="currentColor" strokeWidth="1.6" />
              <path d="M10.6 10.6L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input
              className="s-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, phone, course..."
              aria-label="Search students"
            />
            {search && (
              <button className="s-clear" onClick={() => setSearch('')} aria-label="Clear search">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          <button onClick={openNew} className="sc-btn sc-btn-primary add">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <path d="M7.5 3v9M3 7.5h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Add Student
          </button>
        </div>
      </div>

      {/* ---- Loading skeleton ---- */}
      {loading ? (
        <div className="sc-card" role="status" aria-label="Loading students...">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div className="sk-row" key={i} style={{ animationDelay: `${i * 55}ms` }}>
              <div className="sc-skel sk-av" />
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
              <circle cx="11" cy="7.5" r="3.4" stroke="currentColor" strokeWidth="1.6" />
              <path d="M4.5 18c0-3.3 2.9-5.2 6.5-5.2s6.5 1.9 6.5 5.2" stroke="currentColor"
                strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <p className="empty-t">
            {search ? 'No students match your search' : 'No students yet. Add one!'}
          </p>
          {search ? (
            <button className="sc-btn sc-btn-secondary sc-btn-sm" onClick={() => setSearch('')}>
              Clear search
            </button>
          ) : (
            <button className="sc-btn sc-btn-primary sc-btn-sm" onClick={openNew}>
              Add Student
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ---- Desktop / tablet: table ---- */}
          <div className="sc-card sc-i tablecard">
            <div className="sc-table-scroll">
              <table className="sc-table">
                <thead>
                  <tr>
                    {['ID', 'Name', 'Phone', 'Parent Contact', 'Course', 'Joining Date', 'Actions'].map(h => (
                      <th key={h} className={h === 'Actions' ? 'th-act' : undefined}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <tr key={s.StudentID} className="row" style={{ animationDelay: `${Math.min(i, 12) * 28}ms` }}>
                      <td><span className="idchip">{s.StudentID}</span></td>
                      <td>
                        <div className="who">
                          <span className="av" style={{ background: tintFor(s.StudentName) }}>
                            {initials(s.StudentName)}
                          </span>
                          <span className="who-t">
                            <span className="who-n">{s.StudentName}</span>
                            {s.Email ? <span className="who-e">{s.Email}</span> : null}
                          </span>
                        </div>
                      </td>
                      <td className="num">{s.Phone}</td>
                      <td className="num">{s.ParentContact}</td>
                      <td><span className="sc-badge course">{s.Course}</span></td>
                      <td className="dim">{fmtDate(s.JoiningDate)}</td>
                      <td className="th-act">
                        <div className="acts">
                          <button onClick={() => openEdit(s)} className="act">Edit</button>
                          <button
                            onClick={() => handleDelete(s.StudentID, s.StudentName)}
                            className="act act-danger"
                          >Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="foot">
              {filtered.length} student{filtered.length !== 1 ? 's' : ''}
              {search ? <span className="foot-dim"> matching &ldquo;{search}&rdquo;</span> : null}
            </div>
          </div>

          {/* ---- Mobile: card list, no horizontal scrolling ---- */}
          <div className="cards">
            {filtered.map((s, i) => (
              <div className="scard" key={s.StudentID} style={{ animationDelay: `${Math.min(i, 10) * 32}ms` }}>
                <div className="scard-top">
                  <span className="av av-lg" style={{ background: tintFor(s.StudentName) }}>
                    {initials(s.StudentName)}
                  </span>
                  <div className="scard-id">
                    <p className="scard-n">{s.StudentName}</p>
                    <span className="sc-badge course">{s.Course}</span>
                  </div>
                  <span className="idchip">{s.StudentID}</span>
                </div>

                <div className="scard-grid">
                  <div>
                    <span className="k">Phone</span>
                    <a className="v vlink" href={`tel:${s.Phone}`}>{s.Phone}</a>
                  </div>
                  <div>
                    <span className="k">Parent Contact</span>
                    <a className="v vlink" href={`tel:${s.ParentContact}`}>{s.ParentContact}</a>
                  </div>
                  <div>
                    <span className="k">Joining Date</span>
                    <span className="v">{fmtDate(s.JoiningDate)}</span>
                  </div>
                  {s.Email ? (
                    <div>
                      <span className="k">Email</span>
                      <span className="v vtrunc">{s.Email}</span>
                    </div>
                  ) : null}
                </div>

                <div className="scard-acts">
                  <button onClick={() => openEdit(s)} className="sc-btn sc-btn-secondary sc-btn-sm grow">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(s.StudentID, s.StudentName)}
                    className="sc-btn sc-btn-danger sc-btn-sm grow"
                  >Delete</button>
                </div>
              </div>
            ))}
            <p className="cards-foot">
              {filtered.length} student{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
        </>
      )}

      {/* ---- Add / Edit ---- */}
      <Modal open={showModal} onClose={() => setShowModal(false)}
        title={editId ? 'Edit Student' : 'Add New Student'} size="lg">
        <form onSubmit={handleSubmit} className="fm">
          <div className="fgrid">
            <div className="f">
              <label className="fl">Student Name *</label>
              <input className="sc-field" value={form.studentName}
                onChange={e => set('studentName', e.target.value)} required />
            </div>
            <div className="f">
              <label className="fl">Phone *</label>
              <input className="sc-field" inputMode="tel" value={form.phone}
                onChange={e => set('phone', e.target.value)} required />
            </div>
            <div className="f">
              <label className="fl">Parent Contact *</label>
              <input className="sc-field" inputMode="tel" value={form.parentContact}
                onChange={e => set('parentContact', e.target.value)} required />
            </div>
            <div className="f">
              <label className="fl">Email</label>
              <input type="email" className="sc-field" value={form.email}
                onChange={e => set('email', e.target.value)} />
            </div>
            <div className="f">
              <label className="fl">Course *</label>
              <input className="sc-field" placeholder="e.g. JEE Mains, NEET, Class 10"
                value={form.course} onChange={e => set('course', e.target.value)} required />
            </div>
            <div className="f">
              <label className="fl">Joining Date</label>
              <input type="date" className="sc-field" value={form.joiningDate}
                onChange={e => set('joiningDate', e.target.value)} />
            </div>
            {!editId && (
              <div className="f">
                <label className="fl">Total Course Fee (₹)</label>
                <input type="number" className="sc-field" placeholder="15000"
                  value={form.totalFee} onChange={e => set('totalFee', e.target.value)} />
                <span className="fh">Creates the fee record for this student.</span>
              </div>
            )}
            <div className={editId ? 'f span2' : 'f'}>
              <label className="fl">Address</label>
              <input className="sc-field" value={form.address}
                onChange={e => set('address', e.target.value)} />
            </div>
          </div>

          <div className="facts">
            <button type="button" className="sc-btn sc-btn-secondary grow" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="sc-btn sc-btn-primary grow" disabled={saving}>
              {saving ? 'Saving...' : editId ? 'Update Student' : 'Add Student'}
            </button>
          </div>
        </form>
      </Modal>

      <style jsx>{`
        /* ---- Masthead ---- */
        .mast {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }
        .sub {
          margin: 5px 0 0;
          font-size: 0.875rem;
          color: ${T.muted};
        }
        .mast-r {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* ---- Search ---- */
        .search {
          position: relative;
          display: flex;
          align-items: center;
          width: 20rem;
          max-width: 100%;
        }
        .s-ico {
          position: absolute;
          left: 13px;
          color: ${T.muted};
          pointer-events: none;
        }
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
        .s-input:focus {
          border-color: ${T.accent};
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
        }
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
        .add { white-space: nowrap; }

        /* ---- Table ---- */
        .tablecard { overflow: hidden; }
        .row {
          animation: rowIn 380ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes rowIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .th-act { text-align: right; }
        .idchip {
          display: inline-block;
          padding: 3px 8px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.75rem;
          color: ${T.muted};
          background: ${T.bg};
          border: 1px solid ${T.border};
          border-radius: 7px;
          white-space: nowrap;
        }
        .who { display: flex; align-items: center; gap: 10px; }
        .av {
          flex: none;
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.01em;
        }
        .av-lg { width: 40px; height: 40px; font-size: 0.875rem; border-radius: 12px; }
        .who-t { display: flex; flex-direction: column; min-width: 0; }
        .who-n { font-weight: 600; color: ${T.text}; }
        .who-e {
          font-size: 0.75rem;
          color: ${T.muted};
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 15rem;
        }
        .num { font-variant-numeric: tabular-nums; color: #4b5563; }
        .dim { color: ${T.muted}; font-size: 0.875rem; white-space: nowrap; }
        .course {
          background: rgba(37, 99, 235, 0.08);
          border-color: rgba(37, 99, 235, 0.18);
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
        .act:hover { background: ${T.hover}; border-color: rgba(37, 99, 235, 0.2); }
        .act-danger { color: ${T.danger}; }
        .act-danger:hover { background: rgba(239, 68, 68, 0.07); border-color: rgba(239, 68, 68, 0.22); }
        .foot {
          padding: 12px 16px;
          font-size: 0.8125rem;
          color: ${T.muted};
          background: ${T.bg};
          border-top: 1px solid ${T.border};
        }
        .foot-dim { color: #9ca3af; }

        /* ---- Empty ---- */
        .empty-t {
          margin: 0 0 14px;
          font-size: 0.9375rem;
          font-weight: 600;
          color: ${T.text};
        }

        /* ---- Skeleton ---- */
        .sk-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 0;
          border-bottom: 1px solid #f1f5f9;
          animation: skIn 400ms ease both;
        }
        .sk-row:last-child { border-bottom: 0; }
        @keyframes skIn { from { opacity: 0; } to { opacity: 1; } }
        .sk-av { width: 32px; height: 32px; border-radius: 10px; flex: none; }
        .sk-lines { flex: 1; display: flex; flex-direction: column; gap: 7px; }
        .sk-l1 { height: 11px; width: 38%; border-radius: 6px; }
        .sk-l2 { height: 9px; width: 22%; border-radius: 6px; }
        .sk-pill { width: 74px; height: 22px; border-radius: 999px; flex: none; }

        /* ---- Mobile cards (hidden on desktop) ---- */
        .cards { display: none; }
        .scard {
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 16px;
          padding: 14px;
          box-shadow: 0 1px 2px rgba(11, 31, 77, 0.04);
          animation: rowIn 400ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .scard + .scard { margin-top: 10px; }
        .scard-top { display: flex; align-items: center; gap: 11px; }
        .scard-id { flex: 1; min-width: 0; }
        .scard-n {
          margin: 0 0 5px;
          font-size: 0.9375rem;
          font-weight: 700;
          color: ${T.text};
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .scard-grid {
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
        .v {
          display: block;
          font-size: 0.875rem;
          color: ${T.text};
          font-variant-numeric: tabular-nums;
        }
        .vlink { color: ${T.accent}; text-decoration: none; font-weight: 600; }
        .vtrunc { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .scard-acts { display: flex; gap: 8px; margin-top: 13px; }
        .cards-foot {
          margin: 12px 2px 0;
          font-size: 0.8125rem;
          color: ${T.muted};
        }

        /* ---- Form ---- */
        .fm { display: flex; flex-direction: column; gap: 16px; }
        .fgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .f { display: flex; flex-direction: column; min-width: 0; }
        .span2 { grid-column: 1 / -1; }
        .fl {
          margin-bottom: 6px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #374151;
        }
        .fh { margin-top: 5px; font-size: 0.75rem; color: ${T.muted}; }
        .facts { display: flex; gap: 10px; }
        .grow { flex: 1; }

        /* ---- Responsive ---- */
        @media (max-width: 900px) {
          .search { width: 100%; }
          .mast-r { width: 100%; flex-wrap: wrap; }
          .add { width: 100%; justify-content: center; }
        }
        @media (max-width: 720px) {
          .tablecard { display: none; }
          .cards { display: block; }
          .fgrid { grid-template-columns: 1fr; }
          .facts { flex-direction: column-reverse; }
        }
        @media (max-width: 380px) {
          .scard-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </InstituteLayout>
  );
}
