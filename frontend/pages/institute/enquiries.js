import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import InstituteLayout from '../../components/layout/InstituteLayout';
import LiquidSearch from '../../components/ui/LiquidSearch';
import Modal from '../../components/ui/Modal';
import api, { getUser } from '../../lib/api';

const fmtDate = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return String(val);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = d.toLocaleString('en-IN', { month: 'short', timeZone: 'UTC' });
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
};
import toast from 'react-hot-toast';

const EMPTY = { name: '', phone: '', email: '', course: '', status: 'New', notes: '', followUpDate: '' };

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
  }, []);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/sheets/enquiries');
      setEnquiries(res.data.data || []);
    } catch { toast.error('Failed to load enquiries'); }
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
    if (failed.length === 0) toast.success(`✅ Follow-up emails sent to ${sent} enquiries`);
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

  const statusColor = { New: 'badge-blue', 'Follow-Up': 'badge-yellow', Converted: 'badge-green', Lost: 'badge-red' };

  return (
    <InstituteLayout title="Enquiries">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'New',        status: 'New',        color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Follow-Up',  status: 'Follow-Up',  color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
          { label: 'Converted',  status: 'Converted',  color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Lost',       status: 'Lost',        color: 'bg-red-50 text-red-700 border-red-100' },
        ].map(s => (
          <div key={s.label} className={`card border text-center py-4 ${s.color}`}>
            <p className="text-2xl font-bold">{enquiries.filter(e => e.Status === s.status).length}</p>
            <p className="text-sm mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-between mb-4">
        <div className="flex gap-2 flex-wrap">
          <LiquidSearch
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search enquiries..."
            ariaLabel="Search enquiries"
            expandedWidth={260}
          />
          {['all', 'New', 'Follow-Up', 'Converted', 'Lost'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>{f === 'all' ? 'All' : f}</button>
          ))}
        </div>
        <button onClick={openNew} className="btn-primary whitespace-nowrap">➕ Add Enquiry</button>
        {enquiries.some(e => e.Status === 'Follow-Up' && e.Email) && (
          <button
            onClick={sendFollowUpBulk}
            disabled={sending === 'bulk'}
            className="btn-secondary whitespace-nowrap"
            style={{ borderColor: 'rgba(245,158,11,0.4)', color: '#92400e', background: 'rgba(245,158,11,0.07)' }}
          >
            {sending === 'bulk' ? 'Sending...' : `📧 Send Follow-Up Email (${enquiries.filter(e => e.Status === 'Follow-Up' && e.Email).length})`}
          </button>
        )}
      </div>

      {loading ? (
        <div className="card text-center py-12 text-gray-400">Loading enquiries...</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Name', 'Phone', 'Email', 'Course', 'Status', 'Date', 'Follow-Up', 'Actions'].map(h => (
                    <th key={h} className="text-left text-gray-500 font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((e, i) => (
                  <tr key={e.EnquiryID} className="hover:bg-gray-50 stagger-row-fade" style={{ '--i': i }}>
                    <td className="px-4 py-3 font-medium text-gray-900">{e.Name}</td>
                    <td className="px-4 py-3 text-gray-600">{e.Phone}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{e.Email || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="badge-gray">{e.Course}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={statusColor[e.Status] || 'badge-gray'}>{e.Status || 'New'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{e.CreatedAt || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{fmtDate(e.FollowUpDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(e)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    {search ? 'No matching enquiries' : 'No enquiries yet. Add one!'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)}
        title={editId ? 'Edit Enquiry' : 'Add Enquiry'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input className="input-field" value={form.name}
                onChange={e => set('name', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input className="input-field" value={form.phone}
                onChange={e => set('phone', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="input-field" value={form.email}
                onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
              <input className="input-field" value={form.course}
                onChange={e => set('course', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="input-field" value={form.status} onChange={e => set('status', e.target.value)}>
                <option>New</option>
                <option>Follow-Up</option>
                <option>Converted</option>
                <option>Lost</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Follow-Up Date</label>
              <input type="date" className="input-field" value={form.followUpDate}
                onChange={e => set('followUpDate', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea className="input-field h-20 resize-none" value={form.notes}
                onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Saving...' : editId ? 'Update' : 'Add Enquiry'}
            </button>
          </div>
        </form>
      </Modal>
    </InstituteLayout>
  );
}