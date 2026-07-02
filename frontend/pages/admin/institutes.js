import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/ui/Modal';
import api, { getUser } from '../../lib/api';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  instituteName: '', ownerName: '', email: '', phone: '',
  instituteType: 'Coaching Centre', googleSheetId: '', appsScriptUrl: '',
  planAmount: '', paymentStatus: 'paid', dueDate: '', billingDay: 1, password: ''
};

// ── Separate credentials modal so it can't be accidentally dismissed ──────────
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">🎉</div>
          <h2 className="text-xl font-bold text-gray-900">Institute Created!</h2>
          <p className="text-sm text-red-600 font-medium mt-1">
            ⚠️ Save these credentials now — password cannot be recovered later
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 mb-5">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Login ID</p>
            <p className="text-lg font-bold text-gray-900 font-mono">{creds.loginId}</p>
          </div>
          <div className="border-t border-gray-200 pt-3">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Password</p>
            <p className="text-lg font-bold text-gray-900 font-mono">{creds.password}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={copyAll}
            className="flex-1 btn-secondary text-sm font-medium">
            {copied ? '✅ Copied!' : '📋 Copy Both'}
          </button>
          <button onClick={onClose}
            className="flex-1 btn-primary text-sm font-medium">
            I've Saved These ✓
          </button>
        </div>
      </div>
    </div>
  );
}


// ── Reset Password Modal ───────────────────────────────────────────────────────
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Reset Password</h2>
        <p className="text-sm text-gray-500 mb-4">{institute.name}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              className="input-field pr-12"
              placeholder="New password (min 6 chars)"
              value={pw}
              onChange={e => setPw(e.target.value)}
              required minLength={6} autoFocus
            />
            <button type="button" onClick={() => setShowPw(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Saving...' : 'Set Password'}
            </button>
          </div>
        </form>
      </div>
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

  return (
    <AdminLayout title="Institutes">

      {/* Credentials Modal — shown after create or reset password */}
      {newCreds && <CredsModal creds={newCreds} onClose={() => setNewCreds(null)} />}

      <div className="flex flex-col sm:flex-row gap-3 justify-between mb-6">
        <input className="input-field max-w-sm" placeholder="Search institutes..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <button onClick={openNew} className="btn-primary whitespace-nowrap">
          ➕ Add Institute
        </button>
      </div>

      {loading ? (
        <div className="card text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Institute Name','Owner Name','Login ID','Email','Phone','Institute Type','Plan','Bill Day','Status','Payment Status','Join Date','Actions'].map(h => (
                    <th key={h} className="text-left text-gray-500 font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(inst => (
                  <tr key={inst._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{inst.instituteName}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{inst.ownerName}</td>
                    <td className="px-4 py-3"><code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{inst.loginId}</code></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{inst.email}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{inst.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{inst.instituteType || '—'}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">₹{inst.planAmount?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{inst.billingDay || 1}</td>
                    <td className="px-4 py-3">
                      <span className={inst.isActive !== false ? 'badge-green' : 'badge-red'}>
                        {inst.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={inst.paymentStatus === 'paid' ? 'badge-green' : 'badge-red'}>
                        {inst.paymentStatus === 'paid' ? 'Paid' : 'Overdue'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {inst.createdAt ? (() => { const d = new Date(inst.createdAt); return `${String(d.getUTCDate()).padStart(2,'0')} ${d.toLocaleString('en-IN',{month:'short',timeZone:'UTC'})} ${d.getUTCFullYear()}`; })() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => openEdit(inst)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
                        <button
                          onClick={() => handleToggleActive(inst._id, inst.instituteName, inst.isActive !== false)}
                          className={`text-xs font-medium ${inst.isActive !== false ? 'text-orange-500 hover:text-orange-700' : 'text-green-600 hover:text-green-800'}`}>
                          {inst.isActive !== false ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => setResetModal({ id: inst._id, name: inst.instituteName })} className="text-yellow-600 hover:text-yellow-800 text-xs font-medium">Reset PW</button>
                        <button onClick={() => handleDelete(inst._id, inst.instituteName)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={12} className="px-4 py-12 text-center text-gray-400">
                    {search ? 'No institutes match your search' : 'No institutes yet. Add one!'}
                  </td></tr>
                )}
              </tbody>
            </table>
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Institute Name *</label>
              <input className="input-field" value={form.instituteName}
                onChange={e => set('instituteName', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
              <input className="input-field" value={form.ownerName}
                onChange={e => set('ownerName', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" className="input-field" value={form.email}
                onChange={e => set('email', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input className="input-field" value={form.phone}
                onChange={e => set('phone', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Institute Type</label>
              <select className="input-field" value={form.instituteType} onChange={e => set('instituteType', e.target.value)}>
                <option>Coaching Centre</option>
                <option>Tuition Centre</option>
                <option>Training Academy</option>
                <option>Skill Development</option>
                <option>Other</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {editId ? 'Password (leave blank to keep unchanged)' : 'Password *'}
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder={editId ? 'Leave blank to keep existing password' : 'Set a password (min 6 chars)'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  required={!editId}
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan Amount (₹) *</label>
              <input type="number" className="input-field" value={form.planAmount}
                onChange={e => set('planAmount', e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Google Sheet ID *</label>
              <input className="input-field font-mono text-xs" placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                value={form.googleSheetId} onChange={e => set('googleSheetId', e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Apps Script Web App URL *</label>
              <input className="input-field font-mono text-xs" placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                value={form.appsScriptUrl} onChange={e => set('appsScriptUrl', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <select className="input-field" value={form.paymentStatus} onChange={e => set('paymentStatus', e.target.value)}>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" className="input-field" value={form.dueDate}
                onChange={e => set('dueDate', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date (day of month) *</label>
              <input type="number" min="1" max="31" className="input-field" value={form.billingDay}
                onChange={e => set('billingDay', e.target.value)} required placeholder="e.g. 5" />
              <p className="text-xs text-gray-400 mt-1">Invoice auto-sends on this day of every month (1-31).</p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Saving...' : editId ? 'Update Institute' : 'Create Institute'}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}