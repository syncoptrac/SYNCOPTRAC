import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import InstituteLayout from '../../components/layout/InstituteLayout';
import api, { getUser, prefetch, notifyError, errorMessage } from '../../lib/api';
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

// Get today's date in IST (not UTC) as YYYY-MM-DD
const getTodayIST = () => {
  const now = new Date();
  // IST = UTC + 5:30
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return ist.toISOString().substring(0, 10);
};

const initials = (name) =>
  String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('') || '?';

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
    // PERF: warm today's records in the background so opening the History tab
    // is instant instead of triggering a fresh Sheets read on click.
    prefetch(`/api/sheets/attendance?date=${getTodayIST()}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/api/sheets/students');
      const list = res.data.data || [];
      setStudents(list);
      // Default: neutral \u2014 no status set, staff must explicitly mark each student
      setAttendance({});
    } catch (err) {
      notifyError('students-load', errorMessage(err, 'Failed to load students'));
    }
    finally { setLoading(false); }
  };

  // Reset attendance marks to neutral whenever date changes (new day = fresh slate)
  useEffect(() => {
    setAttendance({});
  }, [date]);

  const fetchHistory = useCallback(async () => {
    setHistLoading(true);
    // PERF/UX: keep the previous rows visible while reloading instead of
    // blanking the table, which read as "slow" even when it wasn't.
    try {
      const res = await api.get(`/api/sheets/attendance?date=${histDate}`);
      const data = res.data.data || [];
      setHistory(data);
      if (data.length === 0) {
        toast('No records found for this date', { icon: '\u2139\uFE0F' });
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

  const markedPct = students.length
    ? Math.round(((presentCount + absentCount) / students.length) * 100)
    : 0;
  const histPct = history.length ? Math.round((histPresent / history.length) * 100) : 0;

  return (
    <InstituteLayout title="Attendance">
      {/* ---- Masthead ---- */}
      <div className="mast">
        <div>
          <p className="sc-eyebrow">Daily register</p>
          <h1 className="sc-h1">Attendance</h1>
          <p className="sub">
            {loading
              ? 'Loading students...'
              : mode === 'mark'
                ? `${students.length} student${students.length !== 1 ? 's' : ''} \u00B7 ${markedPct}% marked`
                : `${history.length} record${history.length !== 1 ? 's' : ''} on this date`}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="sc-seg tabs" role="group" aria-label="Attendance view">
          <button onClick={() => setMode('mark')}
            className={mode === 'mark' ? 'tab is-on' : 'tab'}
            aria-pressed={mode === 'mark'}>
            Mark Attendance
          </button>
          <button onClick={() => setMode('history')}
            className={mode === 'history' ? 'tab is-on' : 'tab'}
            aria-pressed={mode === 'history'}>
            View History
          </button>
        </div>
      </div>

      {/* ---- MARK ATTENDANCE ---- */}
      {mode === 'mark' && (
        <>
          <div className="sc-card ctrl">
            <div className="ctrl-l">
              <label className="dl" htmlFor="att-date">Date:</label>
              <input id="att-date" type="date" className="sc-field dinput"
                value={date} onChange={e => setDate(e.target.value)} />
            </div>

            <div className="ctrl-r">
              <button onClick={() => toggleAll('Present')} className="bulk bulk-p">
                All Present
              </button>
              <button onClick={() => toggleAll('Absent')} className="bulk bulk-a">
                All Absent
              </button>
            </div>
          </div>

          {/* Live tally */}
          <div className="tally">
            <div className="tl tl-p">
              <span className="tl-v">{presentCount}</span>
              <span className="tl-l">Present</span>
            </div>
            <div className="tl tl-a">
              <span className="tl-v">{absentCount}</span>
              <span className="tl-l">Absent</span>
            </div>
            {unmarked > 0 && (
              <div className="tl tl-u">
                <span className="tl-v">{unmarked}</span>
                <span className="tl-l">Not marked</span>
              </div>
            )}
            <div className="prog" aria-hidden="true">
              <span className="prog-fill" style={{ width: `${markedPct}%` }} />
            </div>
          </div>

          {loading ? (
            <div className="sc-card" role="status" aria-label="Loading students...">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <div className="sk-row" key={i} style={{ animationDelay: `${i * 55}ms` }}>
                  <div className="sc-skel sk-av" />
                  <div className="sk-lines">
                    <div className="sc-skel sk-l1" />
                    <div className="sc-skel sk-l2" />
                  </div>
                  <div className="sc-skel sk-tog" />
                </div>
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="sc-card sc-empty">
              <div className="sc-empty-ico">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <circle cx="11" cy="7.5" r="3.4" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M4.5 18c0-3.3 2.9-5.2 6.5-5.2s6.5 1.9 6.5 5.2" stroke="currentColor"
                    strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <p className="empty-t">No students found. Add students first.</p>
              <button className="sc-btn sc-btn-primary sc-btn-sm"
                onClick={() => router.push('/institute/students')}>
                Add Student
              </button>
            </div>
          ) : (
            <div className="roster">
              {students.map((s, i) => {
                const mark = attendance[s.StudentID];
                return (
                  <div
                    key={s.StudentID}
                    className={`rrow ${mark === 'Present' ? 'is-p' : ''} ${mark === 'Absent' ? 'is-a' : ''}`}
                    style={{ animationDelay: `${Math.min(i, 14) * 26}ms` }}
                  >
                    <span className="rav">{initials(s.StudentName)}</span>

                    <div className="rmeta">
                      <p className="rname">{s.StudentName}</p>
                      <p className="rsub">
                        <span>{s.Course}</span>
                        <span className="rdot">&middot;</span>
                        <span className="rphone">{s.Phone}</span>
                      </p>
                    </div>

                    <div className="tog" role="group" aria-label={`Attendance for ${s.StudentName}`}>
                      <button
                        onClick={() => setAttendance(p => ({ ...p, [s.StudentID]: 'Present' }))}
                        className={mark === 'Present' ? 'tg tg-p is-on' : 'tg tg-p'}
                        aria-pressed={mark === 'Present'}
                        aria-label={`Mark ${s.StudentName} present`}
                      >P</button>
                      <button
                        onClick={() => setAttendance(p => ({ ...p, [s.StudentID]: 'Absent' }))}
                        className={mark === 'Absent' ? 'tg tg-a is-on' : 'tg tg-a'}
                        aria-pressed={mark === 'Absent'}
                        aria-label={`Mark ${s.StudentName} absent`}
                      >A</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {students.length > 0 && (
            <div className="savebar">
              <button onClick={handleSave} disabled={saving} className="sc-btn sc-btn-primary sbtn">
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
              <button onClick={sendAbsenteeReminders} disabled={sending} className="sc-btn warnbtn sbtn">
                {sending ? 'Sending...' : 'Send Absent Reminders'}
              </button>
            </div>
          )}
        </>
      )}

      {/* ---- VIEW HISTORY ---- */}
      {mode === 'history' && (
        <>
          <div className="sc-card ctrl">
            <div className="ctrl-l">
              <label className="dl" htmlFor="hist-date">Date:</label>
              <input id="hist-date" type="date" className="sc-field dinput"
                value={histDate} onChange={e => setHistDate(e.target.value)} />
            </div>
            <div className="ctrl-r">
              <button onClick={fetchHistory} disabled={histLoading}
                className="sc-btn sc-btn-secondary sc-btn-sm">
                {histLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Summary bar for the selected date */}
          {!histLoading && history.length > 0 && (
            <div className="tally">
              <div className="tl tl-p">
                <span className="tl-v">{histPresent}</span>
                <span className="tl-l">Present</span>
              </div>
              <div className="tl tl-a">
                <span className="tl-v">{histAbsent}</span>
                <span className="tl-l">Absent</span>
              </div>
              <div className="tl tl-t">
                <span className="tl-v">{history.length}</span>
                <span className="tl-l">Total</span>
              </div>
              <div className="prog" aria-hidden="true">
                <span className="prog-fill prog-ok" style={{ width: `${histPct}%` }} />
              </div>
            </div>
          )}

          {histLoading ? (
            <div className="sc-card" role="status" aria-label="Loading attendance records...">
              {[0, 1, 2, 3].map(i => (
                <div className="sk-row" key={i} style={{ animationDelay: `${i * 55}ms` }}>
                  <div className="sk-lines">
                    <div className="sc-skel sk-l1" />
                    <div className="sc-skel sk-l2" />
                  </div>
                  <div className="sc-skel sk-pill" />
                </div>
              ))}
            </div>
          ) : history.length > 0 ? (
            <>
              <div className="sc-card sc-i tablecard">
                <div className="sc-table-scroll">
                  <table className="sc-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Date</th>
                        <th className="th-c">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((r, i) => {
                        const isPresent = String(r.Status).toLowerCase() === 'present';
                        return (
                          <tr key={i} className="row" style={{ animationDelay: `${Math.min(i, 12) * 26}ms` }}>
                            <td className="nm">{r.StudentName}</td>
                            <td className="dim">{fmtDate(r.Date)}</td>
                            <td className="th-c">
                              <span className={isPresent ? 'sc-badge b-ok' : 'sc-badge b-bad'}>
                                {r.Status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="cards">
                {history.map((r, i) => {
                  const isPresent = String(r.Status).toLowerCase() === 'present';
                  return (
                    <div className="hcard" key={i} style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
                      <span className="rav">{initials(r.StudentName)}</span>
                      <div className="hmeta">
                        <p className="rname">{r.StudentName}</p>
                        <p className="rsub">{fmtDate(r.Date)}</p>
                      </div>
                      <span className={isPresent ? 'sc-badge b-ok' : 'sc-badge b-bad'}>{r.Status}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="sc-card sc-empty">
              <div className="sc-empty-ico">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <rect x="3.5" y="5" width="15" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M3.5 9h15M7.5 3v3.5M14.5 3v3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <p className="empty-t">No attendance records for {histDate}</p>
              <p className="empty-s">
                Make sure attendance was saved for this date and Code.gs is redeployed
              </p>
            </div>
          )}
        </>
      )}

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

        /* ---- Tabs ---- */
        .tabs { flex: none; }
        .tab {
          min-height: 38px;
          padding: 0 15px;
          font-size: 0.875rem;
          font-weight: 600;
          color: ${T.muted};
          background: transparent;
          border: 0;
          border-radius: 9px;
          cursor: pointer;
          white-space: nowrap;
          transition: background 180ms ease, color 180ms ease;
        }
        .tab:hover { color: ${T.text}; }
        .tab.is-on {
          background: ${T.card};
          color: ${T.accent};
          box-shadow: 0 1px 3px rgba(11, 31, 77, 0.1);
        }
        .tab:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.28); }

        /* ---- Control row ---- */
        .ctrl {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }
        .ctrl-l { display: flex; align-items: center; gap: 10px; }
        .ctrl-r { display: flex; align-items: center; gap: 8px; }
        .dl { font-size: 0.875rem; font-weight: 600; color: #374151; }
        .dinput { width: auto; min-width: 10.5rem; }
        .bulk {
          min-height: 38px;
          padding: 0 13px;
          font-size: 0.8125rem;
          font-weight: 600;
          background: ${T.card};
          border: 1.5px solid ${T.border};
          border-radius: 10px;
          cursor: pointer;
          transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;
        }
        .bulk:active { transform: scale(0.98); }
        .bulk-p { color: #15803d; }
        .bulk-p:hover { background: rgba(34, 197, 94, 0.08); border-color: rgba(34, 197, 94, 0.32); }
        .bulk-a { color: #b91c1c; }
        .bulk-a:hover { background: rgba(239, 68, 68, 0.07); border-color: rgba(239, 68, 68, 0.3); }

        /* ---- Tally ---- */
        .tally {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }
        .tl {
          display: inline-flex;
          align-items: baseline;
          gap: 7px;
          padding: 9px 14px;
          border-radius: 11px;
          border: 1px solid;
        }
        .tl-v { font-size: 1.0625rem; font-weight: 700; font-variant-numeric: tabular-nums; }
        .tl-l { font-size: 0.8125rem; font-weight: 500; }
        .tl-p { background: rgba(34, 197, 94, 0.08); border-color: rgba(34, 197, 94, 0.22); color: #15803d; }
        .tl-a { background: rgba(239, 68, 68, 0.07); border-color: rgba(239, 68, 68, 0.2); color: #b91c1c; }
        .tl-u { background: ${T.bg}; border-color: ${T.border}; color: ${T.muted}; }
        .tl-t { background: rgba(37, 99, 235, 0.07); border-color: rgba(37, 99, 235, 0.18); color: #1d4ed8; }
        .prog {
          flex: 1;
          min-width: 6rem;
          height: 6px;
          border-radius: 999px;
          background: #eef2f7;
          overflow: hidden;
        }
        .prog-fill {
          display: block;
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, ${T.accent}, ${T.accent2});
          transition: width 620ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .prog-ok { background: linear-gradient(90deg, #22c55e, #4ade80); }

        /* ---- Roster ---- */
        .roster { display: flex; flex-direction: column; gap: 8px; }
        .rrow {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          background: ${T.card};
          border: 1px solid ${T.border};
          border-left: 3px solid ${T.border};
          border-radius: 14px;
          box-shadow: 0 1px 2px rgba(11, 31, 77, 0.04);
          animation: rowIn 400ms cubic-bezier(0.16, 1, 0.3, 1) both;
          transition: border-color 200ms ease, background 200ms ease, transform 200ms ease;
        }
        @keyframes rowIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .rrow.is-p { border-left-color: ${T.success}; background: rgba(34, 197, 94, 0.03); }
        .rrow.is-a { border-left-color: ${T.danger}; background: rgba(239, 68, 68, 0.03); }
        .rav {
          flex: none;
          width: 36px;
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          background: ${T.bg};
          border: 1px solid ${T.border};
          color: #4b5563;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .rmeta { flex: 1; min-width: 0; }
        .rname {
          margin: 0;
          font-size: 0.9375rem;
          font-weight: 600;
          color: ${T.text};
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .rsub {
          margin: 2px 0 0;
          font-size: 0.8125rem;
          color: ${T.muted};
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }
        .rdot { color: #cbd5e1; }
        .rphone { font-variant-numeric: tabular-nums; }

        /* ---- P/A toggle ---- */
        .tog {
          flex: none;
          display: inline-flex;
          padding: 3px;
          background: ${T.bg};
          border: 1px solid ${T.border};
          border-radius: 11px;
          gap: 3px;
        }
        .tg {
          width: 42px;
          height: 34px;
          font-size: 0.8125rem;
          font-weight: 700;
          color: #9ca3af;
          background: transparent;
          border: 0;
          border-radius: 8px;
          cursor: pointer;
          transition: background 180ms ease, color 180ms ease, transform 180ms ease;
        }
        .tg:active { transform: scale(0.94); }
        .tg-p:hover { color: #15803d; background: rgba(34, 197, 94, 0.1); }
        .tg-a:hover { color: #b91c1c; background: rgba(239, 68, 68, 0.09); }
        .tg-p.is-on {
          color: #ffffff;
          background: ${T.success};
          box-shadow: 0 2px 7px rgba(34, 197, 94, 0.32);
        }
        .tg-a.is-on {
          color: #ffffff;
          background: ${T.danger};
          box-shadow: 0 2px 7px rgba(239, 68, 68, 0.3);
        }
        .tg:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3); }

        /* ---- Save bar ---- */
        .savebar {
          position: sticky;
          bottom: 0;
          z-index: 2;
          display: flex;
          gap: 10px;
          margin-top: 16px;
          padding: 12px 0 14px;
          background: linear-gradient(180deg, rgba(248, 250, 252, 0) 0%, ${T.bg} 42%);
        }
        .sbtn { flex: 1; }
        .warnbtn {
          color: #92400e;
          background: rgba(245, 158, 11, 0.09);
          border: 1px solid rgba(245, 158, 11, 0.28);
        }
        .warnbtn:hover:not(:disabled) { background: rgba(245, 158, 11, 0.15); }

        /* ---- History table ---- */
        .tablecard { overflow: hidden; }
        .row { animation: rowIn 380ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        .th-c { text-align: center; }
        .nm { font-weight: 600; color: ${T.text}; }
        .dim { color: ${T.muted}; font-size: 0.875rem; white-space: nowrap; }
        .b-ok {
          background: rgba(34, 197, 94, 0.1);
          border-color: rgba(34, 197, 94, 0.22);
          color: #15803d;
        }
        .b-bad {
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(239, 68, 68, 0.2);
          color: #b91c1c;
        }

        /* ---- History mobile cards ---- */
        .cards { display: none; }
        .hcard {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 11px 13px;
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 14px;
          box-shadow: 0 1px 2px rgba(11, 31, 77, 0.04);
          animation: rowIn 400ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .hcard + .hcard { margin-top: 8px; }
        .hmeta { flex: 1; min-width: 0; }

        /* ---- Empty / skeleton ---- */
        .empty-t { margin: 0; font-size: 0.9375rem; font-weight: 600; color: ${T.text}; }
        .empty-s { margin: 7px 0 0; font-size: 0.8125rem; color: ${T.muted}; max-width: 26rem; }
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
        .sk-av { width: 36px; height: 36px; border-radius: 11px; flex: none; }
        .sk-lines { flex: 1; display: flex; flex-direction: column; gap: 7px; }
        .sk-l1 { height: 11px; width: 36%; border-radius: 6px; }
        .sk-l2 { height: 9px; width: 22%; border-radius: 6px; }
        .sk-tog { width: 90px; height: 34px; border-radius: 11px; flex: none; }
        .sk-pill { width: 74px; height: 22px; border-radius: 999px; flex: none; }

        /* ---- Responsive ---- */
        @media (max-width: 900px) {
          .tabs { width: 100%; }
          .tab { flex: 1; }
          .ctrl { gap: 10px; }
          .ctrl-l, .ctrl-r { width: 100%; }
          .dinput { flex: 1; }
          .bulk { flex: 1; }
        }
        @media (max-width: 720px) {
          .tablecard { display: none; }
          .cards { display: block; }
          .prog { display: none; }
          .tl { flex: 1; justify-content: center; }
          .savebar { flex-direction: column-reverse; }
          .rsub .rphone { display: none; }
          .rsub .rdot { display: none; }
        }
      `}</style>
    </InstituteLayout>
  );
}
