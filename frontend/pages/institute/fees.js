import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import InstituteLayout from '../../components/layout/InstituteLayout';
import Modal from '../../components/ui/Modal';
import api, { getUser } from '../../lib/api';
import toast from 'react-hot-toast';

const fmtDate = (val) => {
  if (!val) return '—';
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

  // ── Mark Paid shortcut ─────────────────────────────────────
  const markPaid = async (f) => {
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
  };

  // ── Bulk reminder ──────────────────────────────────────────
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
      toast.success(`✅ Reminders sent to ${unpaidWithEmail.length} students!`);
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

  return (
    <InstituteLayout title="Fee Management">

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <p className="text-sm text-gray-500">Fees Collected</p>
          <p className="text-2xl font-bold text-green-600">₹{fmt(totalCollected)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Overdue Fees</p>
          <p className="text-2xl font-bold text-red-600">₹{fmt(totalOverdue)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Students</p>
          <p className="text-2xl font-bold text-gray-800">{fees.length}</p>
        </div>
      </div>

      {/* Filters + bulk button */}
      <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs px-3 py-1.5 rounded-lg bg-brand-dark/5 text-brand-dark font-medium">
            Cycle: {CYCLE_LABELS[feeCycle] || 'Monthly'}
          </span>
          {[['all','All'],['overdue','Overdue'],['paid','Paid']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-colors ${
                filter === v ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>{l}</button>
          ))}
        </div>
        <button onClick={() => setShowBulkModal(true)} disabled={loading}
          className="btn-primary text-sm flex items-center gap-2">
          📧 Send Fee Reminders
          {unpaidWithEmail.length > 0 && (
            <span className="bg-white/30 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {unpaidWithEmail.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="card text-center py-12 text-gray-400">Loading fees...</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Student Name','Course','Fee Amount','Paid Amount','Last Payment Date','Next Due Date','Collection Period','Status','Actions'].map(h => (
                    <th key={h} className="text-left text-gray-500 font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(f => (
                  <tr key={f.StudentID} className={f.Status === 'Overdue' ? 'bg-red-50/30' : ''}>
                    <td className="px-4 py-3 font-medium text-gray-900">{f.StudentName}</td>
                    <td className="px-4 py-3 text-gray-500">{f.Course}</td>
                    <td className="px-4 py-3 text-gray-700">₹{fmt(f.TotalFee)}</td>
                    <td className="px-4 py-3 text-green-600 font-medium">₹{fmt(f.PaidAmount)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(f.LastPaymentDate)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(f.DueDate)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{f.Period || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={
                        f.Status === 'Paid' ? 'badge-green' :
                        f.Status === 'Overdue' ? 'badge-red' : 'badge-yellow'
                      }>{f.Status === 'Paid' ? 'Paid' : f.Status === 'Overdue' ? 'Overdue' : 'Unpaid'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 items-center">
                        <button onClick={() => openEdit(f)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
                        {f.Status !== 'Paid' && (
                          <button onClick={() => markPaid(f)}
                            className="text-green-600 hover:text-green-800 text-xs font-medium">
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    No records for this filter
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Bulk Reminder Modal ─────────────────────────────── */}
      <Modal open={showBulkModal} onClose={() => !bulkSending && setShowBulkModal(false)}
        title="Send Fee Reminders" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">{unpaidWithEmail.length}</p>
              <p className="text-sm text-orange-700 mt-1">Will receive email</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-gray-400">{unpaidNoEmail.length}</p>
              <p className="text-sm text-gray-500 mt-1">No email — skipped</p>
            </div>
          </div>
          {unpaidWithEmail.length > 0 && (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Reminders will be sent to
              </div>
              <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                {unpaidWithEmail.map(f => (
                  <div key={f.StudentID} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{f.StudentName}</p>
                      <p className="text-xs text-gray-400">{getEmail(f)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">₹{fmt(getPending(f))}</p>
                      <span className={`text-xs ${f.Status === 'Overdue' ? 'text-red-500' : 'text-yellow-600'}`}>
                        {f.Status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {unpaidNoEmail.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-lg px-4 py-3 text-sm text-yellow-700">
              ⚠️ {unpaidNoEmail.map(f => f.StudentName).join(', ')} — no email address, will be skipped.
            </div>
          )}
          {bulkSending && (
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Sending reminders...</span>
                <span>{bulkProgress.done} / {bulkProgress.total}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }} />
              </div>
            </div>
          )}
          {unpaidWithEmail.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No unpaid students with email addresses found.</p>
          ) : (
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowBulkModal(false)} disabled={bulkSending} className="btn-secondary flex-1">Cancel</button>
              <button onClick={sendBulkReminders} disabled={bulkSending} className="btn-primary flex-1">
                {bulkSending ? `Sending ${bulkProgress.done}/${bulkProgress.total}...` : `📧 Send to ${unpaidWithEmail.length} Students`}
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* ── Edit Fee Modal ───────────────────────────────────── */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Update Fee Record">
        {selected && (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-900">{selected.StudentName}</p>
              <p className="text-sm text-blue-600">{selected.Course}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Amount (₹)</label>
                <input type="number" className="input-field" value={form.totalFee}
                  onChange={e => setForm(p => ({ ...p, totalFee: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount (₹)</label>
                <input type="number" className="input-field" value={form.paidAmount}
                  onChange={e => setForm(p => ({ ...p, paidAmount: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Payment Date</label>
                <input type="date" className="input-field" value={form.lastPaymentDate}
                  onChange={e => setForm(p => ({ ...p, lastPaymentDate: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Due Date</label>
                <input type="date" className="input-field" value={form.dueDate}
                  onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <input type="text" className="input-field" value={form.notes}
                  placeholder="Any additional notes..."
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>

    </InstituteLayout>
  );
}