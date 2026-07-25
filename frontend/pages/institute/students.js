import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import InstituteLayout from '../../components/layout/InstituteLayout';
import Modal from '../../components/ui/Modal';
import api, { getUser } from '../../lib/api';


import toast from 'react-hot-toast';
import { todayIST, fmtDate } from '../../lib/dateUtils';

const EMPTY = {
  studentName: '', phone: '', parentContact: '', email: '',
  course: '', joiningDate: todayIST(),
  address: '', totalFee: ''
};

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

  return (
    <InstituteLayout title="Students">
      <div className="flex flex-col sm:flex-row gap-3 justify-between mb-6">
        <input className="input-field max-w-sm" placeholder="Search by name, phone, course..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <button onClick={openNew} className="btn-primary whitespace-nowrap">➕ Add Student</button>
      </div>

      {loading ? (
        <div className="card text-center py-12 text-gray-400">Loading students...</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['ID', 'Name', 'Phone', 'Parent Contact', 'Course', 'Joining Date', 'Actions'].map(h => (
                    <th key={h} className="text-left text-gray-500 font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s, i) => (
                  <tr key={s.StudentID} className="hover:bg-gray-50 stagger-row-fade" style={{ '--i': i }}>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{s.StudentID}</code>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.StudentName}</td>
                    <td className="px-4 py-3 text-gray-600">{s.Phone}</td>
                    <td className="px-4 py-3 text-gray-600">{s.ParentContact}</td>
                    <td className="px-4 py-3">
                      <span className="badge-blue">{s.Course}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{fmtDate(s.JoiningDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(s)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
                        <button onClick={() => handleDelete(s.StudentID, s.StudentName)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    {search ? 'No students match your search' : 'No students yet. Add one!'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-500">
            {filtered.length} student{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)}
        title={editId ? 'Edit Student' : 'Add New Student'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label>
              <input className="input-field" value={form.studentName}
                onChange={e => set('studentName', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input className="input-field" value={form.phone}
                onChange={e => set('phone', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Contact *</label>
              <input className="input-field" value={form.parentContact}
                onChange={e => set('parentContact', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="input-field" value={form.email}
                onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
              <input className="input-field" placeholder="e.g. JEE Mains, NEET, Class 10"
                value={form.course} onChange={e => set('course', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
              <input type="date" className="input-field" value={form.joiningDate}
                onChange={e => set('joiningDate', e.target.value)} />
            </div>
            {!editId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Course Fee (₹)</label>
                <input type="number" className="input-field" placeholder="15000"
                  value={form.totalFee} onChange={e => set('totalFee', e.target.value)} />
              </div>
            )}
            <div className={editId ? 'sm:col-span-2' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input className="input-field" value={form.address}
                onChange={e => set('address', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Saving...' : editId ? 'Update Student' : 'Add Student'}
            </button>
          </div>
        </form>
      </Modal>
    </InstituteLayout>
  );
}