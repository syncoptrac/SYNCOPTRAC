import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import InstituteLayout from '../../components/layout/InstituteLayout';
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

// Get today's date in IST (not UTC) as YYYY-MM-DD
const getTodayIST = () => {
  const now = new Date();
  // IST = UTC + 5:30
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return ist.toISOString().substring(0, 10);
};

export default function AttendancePage() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(getTodayIST);
  const [mode, setMode] = useState('mark');
  const [history, setHistory] = useState([]);
  const [histDate, setHistDate] = useState(getTodayIST);
  const [loading, setLoading] = useState(true);
  const [histLoading, setHistLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== 'institute') { router.push('/institute/login'); return; }
    fetchStudents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/api/sheets/students');
      const list = res.data.data || [];
      setStudents(list);
      // Default: neutral — no status set, staff must explicitly mark each student
      setAttendance({});
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to load students';
      toast.error(msg);
    }
    finally { setLoading(false); }
  };

  // Reset attendance marks to neutral whenever date changes (new day = fresh slate)
  useEffect(() => {
    setAttendance({});
  }, [date]);

  const fetchHistory = useCallback(async () => {
    setHistLoading(true);
    setHistory([]);
    try {
      const res = await api.get(`/api/sheets/attendance?date=${histDate}`);
      const data = res.data.data || [];
      setHistory(data);
      if (data.length === 0) {
        toast('No records found for this date', { icon: 'ℹ️' });
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to load attendance history';
      toast.error(msg);
    } finally {
      setHistLoading(false);
    }
  }, [histDate]);

  // Fetch history whenever date changes OR when switching to history tab
  useEffect(() => {
    if (mode === 'history') fetchHistory();
  }, [mode, histDate, fetchHistory]);

  const toggleAll = (status) => {
    const att = {};
    students.forEach(s => { att[s.StudentID] = status; });
    setAttendance(att);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = students.map(s => ({
        studentId: s.StudentID,
        studentName: s.StudentName,
        status: attendance[s.StudentID] || 'Absent'
      }));
      await api.post('/api/sheets/attendance', { date, records });
      toast.success(`Attendance saved for ${date}`);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to save attendance';
      toast.error(msg);
    }
    finally { setSaving(false); }
  };

  const sendAbsenteeReminders = async () => {
    const absentStudents = students.filter(s => attendance[s.StudentID] === 'Absent');
    if (!absentStudents.length) { toast('No absent students today!'); return; }
    const withEmail = absentStudents.filter(s => s.Email);
    if (!withEmail.length) { toast.error('No absent students have email addresses'); return; }
    setSending(true);
    let sent = 0;
    for (const s of withEmail) {
      try {
        await api.post('/api/sheets/send-email', {
          type: 'absentee',
          to: s.Email,
          studentName: s.StudentName
        });
        sent++;
      } catch { /* continue */ }
    }
    toast.success(`Sent ${sent} reminder email${sent !== 1 ? 's' : ''}`);
    setSending(false);
  };

  const presentCount = Object.values(attendance).filter(v => v === 'Present').length;
  const absentCount  = Object.values(attendance).filter(v => v === 'Absent').length;
  const unmarked     = students.length - presentCount - absentCount;

  // Summary for history view
  const histPresent = history.filter(r => String(r.Status).toLowerCase() === 'present').length;
  const histAbsent  = history.filter(r => String(r.Status).toLowerCase() === 'absent').length;

  return (
    <InstituteLayout title="Attendance">
      {/* Tab switcher */}
      <div className="flex gap-3 mb-6">
        <button onClick={() => setMode('mark')}
          className={mode === 'mark' ? 'btn-primary' : 'btn-secondary'}>
          ✅ Mark Attendance
        </button>
        <button onClick={() => setMode('history')}
          className={mode === 'history' ? 'btn-primary' : 'btn-secondary'}>
          📋 View History
        </button>
      </div>

      {/* ── MARK ATTENDANCE ─────────────────────────────────── */}
      {mode === 'mark' && (
        <>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Date:</label>
              <input type="date" className="input-field w-auto"
                value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="flex gap-2 ml-auto">
              <button onClick={() => toggleAll('Present')}
                className="btn-secondary text-sm py-1.5 px-3 text-green-600">
                ✓ All Present
              </button>
              <button onClick={() => toggleAll('Absent')}
                className="btn-secondary text-sm py-1.5 px-3 text-red-600">
                ✗ All Absent
              </button>
            </div>
          </div>

          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-4 py-2">
              <span className="text-green-600 font-bold">{presentCount}</span>
              <span className="text-green-700 text-sm">Present</span>
            </div>
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
              <span className="text-red-600 font-bold">{absentCount}</span>
              <span className="text-red-700 text-sm">Absent</span>
            </div>
            {unmarked > 0 && (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                <span className="text-gray-500 font-bold">{unmarked}</span>
                <span className="text-gray-500 text-sm">Not marked</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="card text-center py-12 text-gray-400">Loading students...</div>
          ) : (
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left text-gray-500 font-medium px-4 py-3">Student</th>
                      <th className="text-left text-gray-500 font-medium px-4 py-3">Course</th>
                      <th className="text-left text-gray-500 font-medium px-4 py-3">Phone</th>
                      <th className="text-center text-gray-500 font-medium px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {students.map(s => (
                      <tr key={s.StudentID}
                        className={attendance[s.StudentID] === 'Absent' ? 'bg-red-50/30' : ''}>
                        <td className="px-4 py-3 font-medium text-gray-900">{s.StudentName}</td>
                        <td className="px-4 py-3 text-gray-500">{s.Course}</td>
                        <td className="px-4 py-3 text-gray-500">{s.Phone}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
                            <button
                              onClick={() => setAttendance(p => ({ ...p, [s.StudentID]: 'Present' }))}
                              className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                                attendance[s.StudentID] === 'Present'
                                  ? 'bg-green-500 text-white'
                                  : 'bg-white text-gray-400 hover:bg-green-50'
                              }`}>P</button>
                            <button
                              onClick={() => setAttendance(p => ({ ...p, [s.StudentID]: 'Absent' }))}
                              className={`px-4 py-1.5 text-xs font-medium transition-colors border-l border-gray-200 ${
                                attendance[s.StudentID] === 'Absent'
                                  ? 'bg-red-500 text-white'
                                  : 'bg-white text-gray-400 hover:bg-red-50'
                              }`}>A</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                        No students found. Add students first.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {students.length > 0 && (
            <div className="flex gap-3 mt-4">
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : '💾 Save Attendance'}
              </button>
              <button onClick={sendAbsenteeReminders} disabled={sending}
                className="btn-secondary text-orange-600 border-orange-200 hover:bg-orange-50">
                {sending ? 'Sending...' : '📧 Send Absent Reminders'}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── VIEW HISTORY ─────────────────────────────────────── */}
      {mode === 'history' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-6">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Date:</label>
              <input type="date" className="input-field w-auto"
                value={histDate} onChange={e => setHistDate(e.target.value)} />
            </div>
            <button
              onClick={fetchHistory}
              disabled={histLoading}
              className="btn-secondary text-sm py-1.5 px-4">
              {histLoading ? '⏳ Loading...' : '🔄 Refresh'}
            </button>
          </div>

          {/* Summary bar for the selected date */}
          {!histLoading && history.length > 0 && (
            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-4 py-2">
                <span className="text-green-600 font-bold">{histPresent}</span>
                <span className="text-green-700 text-sm">Present</span>
              </div>
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
                <span className="text-red-600 font-bold">{histAbsent}</span>
                <span className="text-red-700 text-sm">Absent</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                <span className="text-gray-600 font-bold">{history.length}</span>
                <span className="text-gray-500 text-sm">Total</span>
              </div>
            </div>
          )}

          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left text-gray-500 font-medium px-4 py-3">Student</th>
                    <th className="text-left text-gray-500 font-medium px-4 py-3">Date</th>
                    <th className="text-center text-gray-500 font-medium px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {histLoading ? (
                    <tr><td colSpan={3} className="px-4 py-12 text-center text-gray-400">
                      ⏳ Loading attendance records...
                    </td></tr>
                  ) : history.length > 0 ? (
                    history.map((r, i) => (
                      <tr key={i} className={`stagger-row-fade ${String(r.Status).toLowerCase() === 'absent' ? 'bg-red-50/30' : ''}`} style={{ '--i': i }}>
                        <td className="px-4 py-3 font-medium text-gray-900">{r.StudentName}</td>
                        <td className="px-4 py-3 text-gray-500">{fmtDate(r.Date)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={
                            String(r.Status).toLowerCase() === 'present' ? 'badge-green' : 'badge-red'
                          }>
                            {r.Status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={3} className="px-4 py-12 text-center">
                      <p className="text-gray-400 font-medium">No attendance records for {histDate}</p>
                      <p className="text-gray-300 text-xs mt-1">
                        Make sure attendance was saved for this date and Code.gs is redeployed
                      </p>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </InstituteLayout>
  );
}