import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import api, { getUser } from '../../lib/api';
import toast from 'react-hot-toast';

const STATUSES = [
  { value: 'new',                  label: 'New',                  color: '#111827' },
  { value: 'under_review',         label: 'Under Review',         color: '#111827' },
  { value: 'awaiting_confirmation',label: 'Awaiting Confirmation', color: '#111827' },
  { value: 'setup_in_progress',    label: 'Setup In Progress',    color: '#111827' },
  { value: 'converted',            label: 'Converted',            color: '#059669' },
  { value: 'not_proceeding',       label: 'Not Proceeding',       color: '#dc2626' },
];

const statusStyle = (val) => {
  if (val === 'converted')       return { color: '#059669', bg: 'rgba(16,185,129,0.09)', border: 'rgba(16,185,129,0.2)' };
  if (val === 'not_proceeding')  return { color: '#dc2626', bg: 'rgba(239,68,68,0.09)',  border: 'rgba(239,68,68,0.2)' };
  return { color: '#111827', bg: 'rgba(0,0,0,0.04)', border: 'rgba(0,0,0,0.1)' };
};

const fmtDate = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return String(val);
  return `${String(d.getUTCDate()).padStart(2,'0')} ${d.toLocaleString('en-IN',{month:'short',timeZone:'UTC'})} ${d.getUTCFullYear()}`;
};

export default function AdminLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== 'admin') { router.push('/admin/login'); return; }
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
      if (status === 401 || status === 403) { toast.error('Session expired.'); router.push('/admin/login'); }
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

  return (
    <AdminLayout title="Leads">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {statCounts.map(s => (
          <div key={s.value} className="card text-center py-3 px-2">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
            <p className="text-xs text-gray-400 mt-1 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="card text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Institute', 'Owner', 'Contact', 'Type', 'Students', 'Date', 'Status', ''].map(h => (
                    <th key={h} className="text-left text-gray-500 font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leads.map(lead => {
                  const st = statusStyle(lead.status);
                  return (
                    <tr key={lead._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{lead.instituteName}</p>
                        {lead.message && (
                          <p className="text-xs text-gray-400 mt-0.5 max-w-[150px] truncate">{lead.message}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{lead.ownerName}</td>
                      <td className="px-4 py-3">
                        <p className="text-gray-700">{lead.phone || '—'}</p>
                        <p className="text-xs text-gray-400">{lead.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{lead.instituteType || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{lead.numberOfStudents || '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDate(lead.createdAt)}</td>
                      <td className="px-4 py-3">
                        <select
                          className="text-xs border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-gold"
                          style={{ background: st.bg, color: st.color, borderColor: st.border, fontWeight: 600 }}
                          value={lead.status || 'new'}
                          onChange={e => updateStatus(lead._id, e.target.value)}>
                          {STATUSES.map(s => (
                            <option key={s.value} value={s.value} style={{ color: s.color }}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => deleteLead(lead._id)} disabled={deleting === lead._id}
                          className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                          {deleting === lead._id ? '...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {leads.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No leads yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}