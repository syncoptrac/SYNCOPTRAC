import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import InstituteLayout from '../../components/layout/InstituteLayout';
import Modal from '../../components/ui/Modal';
import api, { getUser, notifyError, errorMessage } from '../../lib/api';
import toast from 'react-hot-toast';
import { T } from '../../components/ds/tokens';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4','#84cc16'];

const EMPTY_BATCH = { batchName: '', course: '', teacher: '', description: '' };
const EMPTY_SLOT  = { batchId: '', day: 'Monday', startTime: '09:00', endTime: '10:00', subject: '' };

// Converts any time value Google Sheets might return into a clean "9:00 AM" string.
// Handles: "09:00" (clean HH:MM), "1899-12-30T06:39:50.000Z" (Sheets ISO artifact).
function fmtTime(val) {
  if (!val) return '';
  let hh, mm;
  if (typeof val === 'string' && val.includes('T')) {
    // ISO datetime artifact \u2014 extract UTC time components
    const d = new Date(val);
    if (!isNaN(d.getTime())) { hh = d.getUTCHours(); mm = d.getUTCMinutes(); }
  } else if (typeof val === 'string' && /^\d{1,2}:\d{2}$/.test(val.trim())) {
    [hh, mm] = val.trim().split(':').map(Number);
  }
  if (hh === undefined) return val;
  const suffix = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 || 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${suffix}`;
}

const initials = (name) =>
  String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('') || '?';

export default function BatchesPage() {
  const [tab, setTab] = useState('batches'); // 'batches' | 'schedule'
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  // Batch modal
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editBatchId, setEditBatchId] = useState(null);
  const [batchForm, setBatchForm] = useState(EMPTY_BATCH);

  // Assign students modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignBatch, setAssignBatch] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [assignSearch, setAssignSearch] = useState('');

  // Schedule slot modal
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showListView, setShowListView] = useState(false);
  const [editSlotId, setEditSlotId] = useState(null);
  const [slotForm, setSlotForm] = useState(EMPTY_SLOT);

  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== 'institute') { router.replace('/institute/login'); return; }
    loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async () => {
    setLoading(true);
    // FIX: Promise.all fails everything if ONE request fails (e.g. schedule times out).
    // Promise.allSettled lets each request succeed or fail independently, so students
    // still load even if the schedule endpoint is slow.
    const [bRes, sRes, slRes] = await Promise.allSettled([
      api.get('/api/sheets/batches'),
      api.get('/api/sheets/students'),
      api.get('/api/sheets/schedule'),
    ]);

    if (bRes.status === 'fulfilled') {
      setBatches(bRes.value.data.data || []);
    } else {
      notifyError('batches-load', errorMessage(bRes.reason, 'Failed to load batches'));
      console.error('Batches error:', bRes.reason);
    }

    if (sRes.status === 'fulfilled') {
      setStudents(sRes.value.data.data || []);
    } else {
      notifyError('students-load', errorMessage(sRes.reason, 'Failed to load students'));
      console.error('Students error:', sRes.reason);
    }

    if (slRes.status === 'fulfilled') {
      setSlots(slRes.value.data.data || []);
    } else {
      notifyError('schedule-load', errorMessage(slRes.reason, 'Failed to load schedule'));
      console.error('Schedule error:', slRes.reason);
    }

    setLoading(false);
  };

  // ---- Batch CRUD ----
  const openNewBatch = () => {
    setEditBatchId(null);
    setBatchForm(EMPTY_BATCH);
    setShowBatchModal(true);
  };

  const openEditBatch = (b) => {
    setEditBatchId(b.BatchID);
    setBatchForm({ batchName: b.BatchName, course: b.Course, teacher: b.Teacher || '', description: b.Description || '' });
    setShowBatchModal(true);
  };

  const saveBatch = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editBatchId) {
        await api.put(`/api/sheets/batches/${editBatchId}`, batchForm);
        toast.success('Batch updated');
      } else {
        await api.post('/api/sheets/batches', batchForm);
        toast.success('Batch created');
      }
      setShowBatchModal(false);
      loadAll();
    } catch (err) {
      // FIX: show the actual error from Apps Script, not just a generic message
      const msg = err.response?.data?.error || err.message || 'Failed to save batch';
      toast.error(msg);
    } finally { setSaving(false); }
  };

  const deleteBatch = async (id, name) => {
    if (!confirm(`Delete batch "${name}"? This will also remove its schedule.`)) return;
    try {
      await api.delete(`/api/sheets/batches/${id}`);
      toast.success('Batch deleted');
      loadAll();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to delete batch';
      toast.error(msg);
    }
  };

  // ---- Assign students ----
  const openAssign = (b) => {
    setAssignBatch(b);
    // FIX: Google Sheets returns empty cells as 0 (number), not '' (string).
    // String() ensures .split() never throws "b.Students.split is not a function"
    // which was causing the client-side crash shown in the screenshot.
    const current = String(b.Students || '').split(',').map(s => s.trim()).filter(Boolean);
    setSelectedStudents(current);
    setAssignSearch('');
    setShowAssignModal(true);
  };

  const toggleStudent = (id) => {
    const sid = String(id);
    setSelectedStudents(prev =>
      prev.includes(sid) ? prev.filter(s => s !== sid) : [...prev, sid]
    );
  };

  const saveAssignment = async () => {
    setSaving(true);
    try {
      await api.put(`/api/sheets/batches/${assignBatch.BatchID}/students`, {
        students: selectedStudents.join(',')
      });
      toast.success('Students assigned');
      setShowAssignModal(false);
      loadAll();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to assign students';
      toast.error(msg);
    } finally { setSaving(false); }
  };

  // ---- Schedule CRUD ----
  const openNewSlot = (batchId = '') => {
    setEditSlotId(null);
    setSlotForm({ ...EMPTY_SLOT, batchId: batchId || (batches[0]?.BatchID || '') });
    setShowSlotModal(true);
  };

  const openEditSlot = (slot) => {
    setEditSlotId(slot.SlotID);
    setSlotForm({
      batchId: slot.BatchID,
      day: slot.Day,
      startTime: slot.StartTime,
      endTime: slot.EndTime,
      subject: slot.Subject || '',
    });
    setShowSlotModal(true);
  };

  const saveSlot = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editSlotId) {
        await api.put(`/api/sheets/schedule/${editSlotId}`, slotForm);
        toast.success('Slot updated');
      } else {
        await api.post('/api/sheets/schedule', slotForm);
        toast.success('Class added to schedule');
      }
      setShowSlotModal(false);
      loadAll();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to save slot';
      toast.error(msg);
    } finally { setSaving(false); }
  };

  const deleteSlot = async (id) => {
    if (!confirm('Remove this class from schedule?')) return;
    try {
      await api.delete(`/api/sheets/schedule/${id}`);
      toast.success('Slot removed');
      loadAll();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to delete slot';
      toast.error(msg);
    }
  };

  // ---- Helpers ----
  const getBatchColor = (batchId) => {
    const idx = batches.findIndex(b => String(b.BatchID) === String(batchId));
    return COLORS[idx % COLORS.length] || COLORS[0];
  };

  const getBatchName = (batchId) =>
    batches.find(b => String(b.BatchID) === String(batchId))?.BatchName || 'Unknown';

  const getStudentsOfBatch = (b) => {
    // FIX: String() wrap prevents crash when Sheets returns 0 or null for empty Students cell
    const ids = String(b.Students || '').split(',').map(s => s.trim()).filter(Boolean);
    return students.filter(s => ids.includes(String(s.StudentID)));
  };

  const getSlotsForDay = (day) =>
    slots
      .filter(s => s.Day === day)
      .sort((a, b) => a.StartTime.localeCompare(b.StartTime));

  const assignFiltered = students.filter(s => {
    if (!assignSearch) return true;
    const q = assignSearch.toLowerCase();
    return String(s.StudentName || '').toLowerCase().includes(q)
      || String(s.Course || '').toLowerCase().includes(q)
      || String(s.StudentID || '').toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <InstituteLayout title="Batches & Schedule">
        <div className="mast">
          <div>
            <p className="sc-eyebrow">Cohorts</p>
            <h1 className="sc-h1">Batches &amp; Schedule</h1>
            <p className="sub">Loading batches...</p>
          </div>
        </div>
        <div className="skgrid" role="status" aria-label="Loading batches...">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div className="skcard" key={i} style={{ animationDelay: `${i * 60}ms` }}>
              <div className="sc-skel sk-rail" />
              <div className="skbody">
                <div className="sc-skel sk-l1" />
                <div className="sc-skel sk-l2" />
                <div className="sk-stats">
                  <div className="sc-skel sk-tile" />
                  <div className="sc-skel sk-tile" />
                </div>
                <div className="sc-skel sk-l3" />
              </div>
            </div>
          ))}
        </div>
        <style jsx>{`
          .mast { margin-bottom: 18px; }
          .sub { margin: 5px 0 0; font-size: 0.875rem; color: ${T.muted}; }
          .skgrid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(19rem, 1fr));
            gap: 14px;
          }
          .skcard {
            background: ${T.card};
            border: 1px solid ${T.border};
            border-radius: 18px;
            overflow: hidden;
            animation: skIn 420ms ease both;
          }
          @keyframes skIn { from { opacity: 0; } to { opacity: 1; } }
          .sk-rail { height: 5px; border-radius: 0; }
          .skbody { padding: 18px; }
          .sk-l1 { height: 13px; width: 55%; border-radius: 6px; }
          .sk-l2 { height: 10px; width: 32%; border-radius: 6px; margin-top: 10px; }
          .sk-stats { display: flex; gap: 11px; margin-top: 16px; }
          .sk-tile { flex: 1; height: 52px; border-radius: 12px; }
          .sk-l3 { height: 34px; border-radius: 10px; margin-top: 16px; }
        `}</style>
      </InstituteLayout>
    );
  }

  return (
    <InstituteLayout title="Batches & Schedule">

      {/* ---- Masthead ---- */}
      <div className="mast">
        <div>
          <p className="sc-eyebrow">Cohorts</p>
          <h1 className="sc-h1">Batches &amp; Schedule</h1>
          <p className="sub">
            {batches.length} batch{batches.length !== 1 ? 'es' : ''} &middot; {slots.length} class{slots.length !== 1 ? 'es' : ''} a week
          </p>
        </div>

        <div className="mast-r">
          {tab === 'batches' ? (
            <button onClick={openNewBatch} className="sc-btn sc-btn-primary">
              New Batch
            </button>
          ) : (
            <button onClick={() => openNewSlot()} className="sc-btn sc-btn-primary"
              disabled={batches.length === 0}>
              Add Class
            </button>
          )}
        </div>
      </div>

      {/* ---- Tab bar ---- */}
      <div className="sc-seg tabs" role="group" aria-label="Batches view">
        {[
          { key: 'batches', label: '\uD83D\uDC65 Batches', count: batches.length },
          { key: 'schedule', label: '\uD83D\uDCC5 Weekly Timetable' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={tab === t.key ? 'tab is-on' : 'tab'}
            aria-pressed={tab === t.key}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={tab === t.key ? 'cnt cnt-on' : 'cnt'}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ==================== TAB: BATCHES ==================== */}
      {tab === 'batches' && (
        <>
          {batches.length === 0 ? (
            <div className="sc-card sc-empty">
              <div className="sc-empty-ico">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="15" cy="9" r="2.3" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M2.5 18c0-3 2.6-4.6 5.5-4.6s5.5 1.6 5.5 4.6" stroke="currentColor"
                    strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <p className="empty-t">No batches yet</p>
              <p className="empty-s">Create your first batch to group students</p>
              <button onClick={openNewBatch} className="sc-btn sc-btn-primary sc-btn-sm">Create First Batch</button>
            </div>
          ) : (
            <div className="bgrid">
              {batches.map((b, i) => {
                const color = COLORS[i % COLORS.length];
                const batchStudents = getStudentsOfBatch(b);
                const batchSlots = slots.filter(s => String(s.BatchID) === String(b.BatchID));

                return (
                  <div key={b.BatchID} className="bcard" style={{ animationDelay: `${Math.min(i, 10) * 55}ms` }}>
                    {/* Colour rail */}
                    <div className="rail" style={{ background: color }} />

                    <div className="bbody">
                      {/* Header */}
                      <div className="bhead">
                        <div className="bhead-l">
                          <h3 className="bname">{b.BatchName}</h3>
                          <span className="bcourse"
                            style={{ background: `${color}15`, color: color }}>
                            {b.Course}
                          </span>
                        </div>
                        <div className="bacts">
                          <button onClick={() => openEditBatch(b)} className="act">Edit</button>
                          <button onClick={() => deleteBatch(b.BatchID, b.BatchName)} className="act act-danger">
                            Delete
                          </button>
                        </div>
                      </div>

                      {b.Teacher && (
                        <div className="teacher">
                          <span className="tav" style={{ background: `${color}18`, color }}>
                            {initials(b.Teacher)}
                          </span>
                          <span>{b.Teacher}</span>
                        </div>
                      )}

                      {/* Stats row */}
                      <div className="bstats">
                        <div className="btile">
                          <div className="btile-v" style={{ color }}>{batchStudents.length}</div>
                          <div className="btile-k">Students</div>
                        </div>
                        <div className="btile">
                          <div className="btile-v" style={{ color }}>{batchSlots.length}</div>
                          <div className="btile-k">Classes/week</div>
                        </div>
                      </div>

                      {/* Student chips */}
                      {batchStudents.length > 0 && (
                        <div className="sect">
                          <div className="sect-h">Students</div>
                          <div className="chips">
                            {batchStudents.slice(0, 5).map(s => (
                              <span key={s.StudentID} className="chip">{s.StudentName}</span>
                            ))}
                            {batchStudents.length > 5 && (
                              <span className="chip chip-more"
                                style={{ background: `${color}15`, color: color }}>
                                +{batchStudents.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Schedule preview */}
                      {batchSlots.length > 0 && (
                        <div className="sect">
                          <div className="sect-h">Schedule</div>
                          <div className="prev">
                            {batchSlots.slice(0, 3).map(slot => (
                              <div key={slot.SlotID} className="prow">
                                <span className="pday" style={{ color }}>
                                  {DAY_SHORT[DAYS.indexOf(slot.Day)] || slot.Day.slice(0, 3)}
                                </span>
                                <span className="ptime">{fmtTime(slot.StartTime)} &ndash; {fmtTime(slot.EndTime)}</span>
                                {slot.Subject && <span className="psub">&middot; {slot.Subject}</span>}
                              </div>
                            ))}
                            {batchSlots.length > 3 && (
                              <div className="pmore">+{batchSlots.length - 3} more classes</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="bfoot">
                        <button onClick={() => openAssign(b)} className="bbtn bbtn-tint"
                          style={{ border: `1px solid ${color}30`, background: `${color}10`, color }}>
                          Assign Students
                        </button>
                        <button onClick={() => openNewSlot(b.BatchID)} className="bbtn bbtn-plain">
                          Add Class
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ==================== TAB: WEEKLY TIMETABLE ==================== */}
      {tab === 'schedule' && (
        <>
          <p className="across">
            {slots.length} classes across {batches.length} batches
          </p>

          {batches.length === 0 ? (
            <div className="sc-card sc-empty">
              <p className="empty-t">Create batches first before adding a schedule.</p>
            </div>
          ) : (
            <>
              {/* Batch colour legend */}
              <div className="legend">
                {batches.map((b, i) => (
                  <div key={b.BatchID} className="lg"
                    style={{
                      background: `${COLORS[i % COLORS.length]}12`,
                      border: `1px solid ${COLORS[i % COLORS.length]}30`,
                    }}>
                    <span className="lgdot" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="lgn" style={{ color: COLORS[i % COLORS.length] }}>{b.BatchName}</span>
                  </div>
                ))}
              </div>

              {/* Weekly grid \u2014 7 columns on desktop, stacked days on mobile */}
              <div className="week">
                {DAYS.map(day => {
                  const daySlots = getSlotsForDay(day);
                  return (
                    <div className="col" key={day}>
                      <div className="dayh">
                        <div className="dayh-s">{DAY_SHORT[DAYS.indexOf(day)]}</div>
                        <div className="dayh-l">{day}</div>
                        {daySlots.length > 0 && (
                          <span className="dayh-n">{daySlots.length}</span>
                        )}
                      </div>

                      <div className="cell">
                        {daySlots.length === 0 ? (
                          <div className="noclass">No class</div>
                        ) : (
                          daySlots.map(slot => {
                            const color = getBatchColor(slot.BatchID);
                            return (
                              <div
                                key={slot.SlotID}
                                className="slot"
                                style={{
                                  background: `${color}12`,
                                  border: `1px solid ${color}30`,
                                  borderLeft: `3px solid ${color}`,
                                }}
                                onClick={() => openEditSlot(slot)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEditSlot(slot); } }}
                                aria-label={`Edit class ${getBatchName(slot.BatchID)} on ${day}`}
                              >
                                <div className="stime" style={{ color }}>
                                  {fmtTime(slot.StartTime)} &ndash; {fmtTime(slot.EndTime)}
                                </div>
                                <div className="sname">{getBatchName(slot.BatchID)}</div>
                                {slot.Subject && <div className="ssub">{slot.Subject}</div>}
                                <button
                                  onClick={e => { e.stopPropagation(); deleteSlot(slot.SlotID); }}
                                  className="srem"
                                >
                                  Remove
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* All Classes: toggle list view */}
              <div className="all">
                <div className="all-h">
                  <h3 className="all-t">All Classes</h3>
                  <button onClick={() => setShowListView(v => !v)}
                    className={showListView ? 'toggle is-on' : 'toggle'}
                    aria-expanded={showListView}>
                    {showListView ? 'Hide List' : 'View All Classes'}
                  </button>
                </div>

                {showListView && (
                  <div className="sc-card sc-i listcard">
                    {slots.length === 0 ? (
                      <div className="nolist">
                        No classes scheduled yet. Add a class from a batch card or the button above.
                      </div>
                    ) : (
                      <>
                        <div className="sc-table-scroll listtable">
                          <table className="sc-table">
                            <thead>
                              <tr>
                                {['Batch', 'Day', 'Time', 'Subject', ''].map(h => (
                                  <th key={h} className={h === '' ? 'th-act' : undefined}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {DAYS.flatMap(day =>
                                slots
                                  .filter(s => s.Day === day)
                                  .sort((a, b) => a.StartTime.localeCompare(b.StartTime))
                                  .map(slot => {
                                    const color = getBatchColor(slot.BatchID);
                                    return (
                                      <tr key={slot.SlotID} className="row">
                                        <td>
                                          <span className="bpill"
                                            style={{ background: `${color}12`, color }}>
                                            <span className="bpdot" style={{ background: color }} />
                                            {getBatchName(slot.BatchID)}
                                          </span>
                                        </td>
                                        <td className="nm">{slot.Day}</td>
                                        <td className="tm">{fmtTime(slot.StartTime)} &ndash; {fmtTime(slot.EndTime)}</td>
                                        <td className="dim">{slot.Subject || '\u2014'}</td>
                                        <td className="th-act">
                                          <div className="acts">
                                            <button onClick={() => openEditSlot(slot)} className="act">Edit</button>
                                            <button onClick={() => deleteSlot(slot.SlotID)} className="act act-danger">Remove</button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile list */}
                        <div className="lcards">
                          {DAYS.flatMap(day =>
                            slots
                              .filter(s => s.Day === day)
                              .sort((a, b) => a.StartTime.localeCompare(b.StartTime))
                              .map(slot => {
                                const color = getBatchColor(slot.BatchID);
                                return (
                                  <div className="lcard" key={slot.SlotID}
                                    style={{ borderLeft: `3px solid ${color}` }}>
                                    <div className="lcard-top">
                                      <span className="bpill" style={{ background: `${color}12`, color }}>
                                        <span className="bpdot" style={{ background: color }} />
                                        {getBatchName(slot.BatchID)}
                                      </span>
                                      <span className="lcard-day">{slot.Day}</span>
                                    </div>
                                    <p className="lcard-tm">{fmtTime(slot.StartTime)} &ndash; {fmtTime(slot.EndTime)}</p>
                                    {slot.Subject && <p className="lcard-sub">{slot.Subject}</p>}
                                    <div className="lcard-acts">
                                      <button onClick={() => openEditSlot(slot)}
                                        className="sc-btn sc-btn-secondary sc-btn-sm grow">Edit</button>
                                      <button onClick={() => deleteSlot(slot.SlotID)}
                                        className="sc-btn sc-btn-danger sc-btn-sm grow">Remove</button>
                                    </div>
                                  </div>
                                );
                              })
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ---- Create/Edit Batch Modal ---- */}
      <Modal open={showBatchModal} onClose={() => setShowBatchModal(false)}
        title={editBatchId ? 'Edit Batch' : 'Create New Batch'}>
        <form onSubmit={saveBatch} className="fm">
          <div className="f">
            <label className="fl">Batch Name *</label>
            <input className="sc-field" placeholder="e.g. JEE Morning Batch"
              value={batchForm.batchName} onChange={e => setBatchForm(p => ({ ...p, batchName: e.target.value }))} required />
          </div>
          <div className="f">
            <label className="fl">Course *</label>
            <input className="sc-field" placeholder="e.g. JEE Mains, NEET, Class 10"
              value={batchForm.course} onChange={e => setBatchForm(p => ({ ...p, course: e.target.value }))} required />
          </div>
          <div className="f">
            <label className="fl">Teacher / Faculty</label>
            <input className="sc-field" placeholder="e.g. Mr. Sharma"
              value={batchForm.teacher} onChange={e => setBatchForm(p => ({ ...p, teacher: e.target.value }))} />
          </div>
          <div className="f">
            <label className="fl">Description</label>
            <input className="sc-field" placeholder="Optional notes about this batch"
              value={batchForm.description} onChange={e => setBatchForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="facts">
            <button type="button" className="sc-btn sc-btn-secondary grow" onClick={() => setShowBatchModal(false)}>Cancel</button>
            <button type="submit" className="sc-btn sc-btn-primary grow" disabled={saving}>
              {saving ? 'Saving...' : editBatchId ? 'Update Batch' : 'Create Batch'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ---- Assign Students Modal ---- */}
      <Modal open={showAssignModal} onClose={() => setShowAssignModal(false)}
        title={`Assign Students \u2014 ${assignBatch?.BatchName || ''}`} size="lg">
        <div className="asg">
          <p className="asg-note">
            Select students to add to this batch. Students can be in multiple batches.
          </p>

          {students.length > 3 && (
            <input
              className="sc-field asg-search"
              placeholder="Search students..."
              aria-label="Search students to assign"
              value={assignSearch}
              onChange={e => setAssignSearch(e.target.value)}
            />
          )}

          <div className="asg-list">
            {students.length === 0 ? (
              <p className="asg-none">No students found. Add students first.</p>
            ) : assignFiltered.length === 0 ? (
              <p className="asg-none">No students match your search</p>
            ) : (
              assignFiltered.map(s => {
                const checked = selectedStudents.includes(String(s.StudentID));
                return (
                  <label key={s.StudentID} className={checked ? 'srow is-on' : 'srow'}>
                    <input type="checkbox" checked={checked}
                      onChange={() => toggleStudent(s.StudentID)}
                      className="scb" />
                    <span className="sav">{initials(s.StudentName)}</span>
                    <div className="smeta">
                      <div className="sname2">{s.StudentName}</div>
                      <div className="ssub2">{s.Course} &middot; ID: {s.StudentID}</div>
                    </div>
                    {checked && <span className="stag">Selected</span>}
                  </label>
                );
              })
            )}
          </div>

          <div className="asg-foot">
            <span className="asg-count">
              {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
            </span>
            <div className="asg-acts">
              <button className="sc-btn sc-btn-secondary" onClick={() => setShowAssignModal(false)}>Cancel</button>
              <button className="sc-btn sc-btn-primary" onClick={saveAssignment} disabled={saving}>
                {saving ? 'Saving...' : 'Save Assignment'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ---- Add/Edit Schedule Slot Modal ---- */}
      <Modal open={showSlotModal} onClose={() => setShowSlotModal(false)}
        title={editSlotId ? 'Edit Class' : 'Add Class to Schedule'}>
        <form onSubmit={saveSlot} className="fm">
          <div className="f">
            <label className="fl">Batch *</label>
            <select className="sc-field" value={slotForm.batchId}
              onChange={e => setSlotForm(p => ({ ...p, batchId: e.target.value }))} required>
              <option value="">Select batch...</option>
              {batches.map(b => (
                <option key={b.BatchID} value={b.BatchID}>{b.BatchName} ({b.Course})</option>
              ))}
            </select>
          </div>
          <div className="f">
            <label className="fl">Day *</label>
            <select className="sc-field" value={slotForm.day}
              onChange={e => setSlotForm(p => ({ ...p, day: e.target.value }))}>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="fgrid">
            <div className="f">
              <label className="fl">Start Time *</label>
              <input type="time" className="sc-field" value={slotForm.startTime}
                onChange={e => setSlotForm(p => ({ ...p, startTime: e.target.value }))} required />
            </div>
            <div className="f">
              <label className="fl">End Time *</label>
              <input type="time" className="sc-field" value={slotForm.endTime}
                onChange={e => setSlotForm(p => ({ ...p, endTime: e.target.value }))} required />
            </div>
          </div>
          <div className="f">
            <label className="fl">Subject / Topic</label>
            <input className="sc-field" placeholder="e.g. Physics, Mathematics"
              value={slotForm.subject} onChange={e => setSlotForm(p => ({ ...p, subject: e.target.value }))} />
          </div>
          <div className="facts">
            <button type="button" className="sc-btn sc-btn-secondary grow" onClick={() => setShowSlotModal(false)}>Cancel</button>
            <button type="submit" className="sc-btn sc-btn-primary grow" disabled={saving}>
              {saving ? 'Saving...' : editSlotId ? 'Update Class' : 'Add to Schedule'}
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
        .mast-r { display: flex; gap: 8px; }

        /* ---- Tabs ---- */
        .tabs { margin-bottom: 18px; }
        .tab {
          display: inline-flex;
          align-items: center;
          gap: 7px;
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
        .cnt {
          padding: 1px 7px;
          font-size: 0.6875rem;
          font-weight: 700;
          border-radius: 999px;
          background: #e5e7eb;
          color: ${T.muted};
        }
        .cnt-on { background: ${T.accent}; color: #ffffff; }

        /* ---- Batch cards ---- */
        .bgrid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(19rem, 1fr));
          gap: 14px;
        }
        .bcard {
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(11, 31, 77, 0.04);
          animation: rise 460ms cubic-bezier(0.16, 1, 0.3, 1) both;
          transition: box-shadow 220ms ease, transform 220ms ease, border-color 220ms ease;
        }
        @keyframes rise {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (hover: hover) and (pointer: fine) {
          .bcard:hover {
            transform: translateY(-3px);
            border-color: #d9e2ef;
            box-shadow: 0 14px 32px rgba(11, 31, 77, 0.1);
          }
        }
        .rail { height: 5px; }
        .bbody { padding: 17px 18px 18px; }
        .bhead {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }
        .bhead-l { min-width: 0; }
        .bname {
          margin: 0 0 7px;
          font-size: 1.0625rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: ${T.text};
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .bcourse {
          display: inline-block;
          padding: 3px 10px;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 999px;
        }
        .bacts { display: flex; gap: 6px; flex: none; }
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
          transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
        }
        .act:hover { background: ${T.hover}; color: ${T.accent}; border-color: rgba(37, 99, 235, 0.2); }
        .act-danger { color: ${T.danger}; }
        .act-danger:hover {
          background: rgba(239, 68, 68, 0.07);
          color: #b91c1c;
          border-color: rgba(239, 68, 68, 0.28);
        }

        .teacher {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 13px;
          font-size: 0.8125rem;
          color: #4b5563;
        }
        .tav {
          width: 24px;
          height: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          font-size: 0.625rem;
          font-weight: 700;
        }

        .bstats { display: flex; gap: 11px; margin-top: 15px; }
        .btile {
          flex: 1;
          padding: 11px 12px;
          text-align: center;
          background: ${T.bg};
          border: 1px solid #eef2f7;
          border-radius: 12px;
        }
        .btile-v {
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          font-variant-numeric: tabular-nums;
        }
        .btile-k {
          margin-top: 3px;
          font-size: 0.6875rem;
          font-weight: 600;
          color: #9ca3af;
        }

        .sect { margin-top: 15px; }
        .sect-h {
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #9ca3af;
          margin-bottom: 7px;
        }
        .chips { display: flex; flex-wrap: wrap; gap: 5px; }
        .chip {
          padding: 3px 9px;
          font-size: 0.6875rem;
          font-weight: 500;
          color: #374151;
          background: ${T.bg};
          border: 1px solid #eef2f7;
          border-radius: 999px;
        }
        .chip-more { font-weight: 600; border-color: transparent; }

        .prev { display: flex; flex-direction: column; gap: 5px; }
        .prow {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          color: #374151;
          min-width: 0;
        }
        .pday { width: 2rem; flex: none; font-size: 0.6875rem; font-weight: 700; }
        .ptime { font-variant-numeric: tabular-nums; white-space: nowrap; }
        .psub {
          color: #9ca3af;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pmore { font-size: 0.6875rem; color: #9ca3af; }

        .bfoot { display: flex; gap: 8px; margin-top: 16px; }
        .bbtn {
          flex: 1;
          min-height: 40px;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 10px;
          cursor: pointer;
          transition: filter 160ms ease, background 160ms ease, transform 160ms ease;
        }
        .bbtn:active { transform: scale(0.98); }
        .bbtn-tint:hover { filter: brightness(0.97); }
        .bbtn-plain {
          background: ${T.bg};
          border: 1px solid ${T.border};
          color: #374151;
        }
        .bbtn-plain:hover { background: ${T.hover}; border-color: rgba(37, 99, 235, 0.2); color: ${T.accent}; }

        /* ---- Empty ---- */
        .empty-t { margin: 0; font-size: 0.9375rem; font-weight: 600; color: ${T.text}; }
        .empty-s { margin: 7px 0 16px; font-size: 0.8125rem; color: ${T.muted}; }

        /* ---- Timetable ---- */
        .across { margin: 0 0 14px; font-size: 0.8125rem; color: ${T.muted}; }
        .legend { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
        .lg { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 999px; }
        .lgdot { width: 8px; height: 8px; border-radius: 50%; }
        .lgn { font-size: 0.75rem; font-weight: 600; }

        .week {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 10px;
        }
        .col { min-width: 0; }
        .dayh {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          flex-wrap: wrap;
          padding: 10px 8px;
          text-align: center;
          color: #ffffff;
          background: linear-gradient(135deg, ${T.navy}, #12306e);
          border-radius: 12px 12px 0 0;
        }
        .dayh-s { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.03em; }
        .dayh-l { display: none; }
        .dayh-n {
          padding: 0 6px;
          font-size: 0.625rem;
          font-weight: 700;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.2);
        }
        .cell {
          min-height: 7.5rem;
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          background: ${T.card};
          border: 1px solid ${T.border};
          border-top: none;
          border-radius: 0 0 12px 12px;
        }
        .noclass {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 4px;
          font-size: 0.6875rem;
          color: #cbd5e1;
          text-align: center;
        }
        .slot {
          padding: 7px 8px;
          border-radius: 9px;
          cursor: pointer;
          transition: filter 180ms ease, transform 180ms ease;
        }
        .slot:hover { filter: brightness(0.97); }
        .slot:active { transform: scale(0.99); }
        .slot:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3); }
        .stime { font-size: 0.625rem; font-weight: 700; font-variant-numeric: tabular-nums; }
        .sname {
          margin-top: 2px;
          font-size: 0.6875rem;
          font-weight: 600;
          line-height: 1.25;
          color: ${T.text};
        }
        .ssub { margin-top: 1px; font-size: 0.625rem; color: ${T.muted}; }
        .srem {
          margin-top: 5px;
          padding: 0;
          font-size: 0.625rem;
          font-weight: 600;
          color: ${T.danger};
          background: transparent;
          border: none;
          cursor: pointer;
        }
        .srem:hover { text-decoration: underline; }

        /* ---- All classes ---- */
        .all { margin-top: 26px; }
        .all-h {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }
        .all-t { margin: 0; font-size: 1.0625rem; font-weight: 700; color: ${T.text}; }
        .toggle {
          min-height: 36px;
          padding: 0 15px;
          font-size: 0.75rem;
          font-weight: 600;
          color: ${T.navy};
          background: ${T.card};
          border: 1px solid rgba(11, 31, 77, 0.16);
          border-radius: 999px;
          cursor: pointer;
          transition: background 200ms ease, color 200ms ease, border-color 200ms ease;
        }
        .toggle:hover { background: ${T.hover}; border-color: rgba(37, 99, 235, 0.28); color: ${T.accent}; }
        .toggle.is-on {
          color: #ffffff;
          background: linear-gradient(135deg, ${T.navy}, #12306e);
          border-color: transparent;
        }
        .listcard { overflow: hidden; }
        .nolist { padding: 32px; text-align: center; color: ${T.muted}; font-size: 0.875rem; }
        .row { animation: rise 380ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        .th-act { text-align: right; }
        .nm { font-weight: 500; color: #374151; }
        .tm { color: #374151; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .dim { color: ${T.muted}; }
        .bpill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 999px;
        }
        .bpdot { width: 6px; height: 6px; border-radius: 50%; }
        .acts { display: flex; gap: 6px; justify-content: flex-end; }

        .lcards { display: none; }
        .lcard {
          padding: 13px 14px;
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 14px;
        }
        .lcard + .lcard { margin-top: 9px; }
        .lcard-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .lcard-day { font-size: 0.8125rem; font-weight: 600; color: #374151; }
        .lcard-tm {
          margin: 9px 0 0;
          font-size: 0.9375rem;
          font-weight: 600;
          color: ${T.text};
          font-variant-numeric: tabular-nums;
        }
        .lcard-sub { margin: 3px 0 0; font-size: 0.8125rem; color: ${T.muted}; }
        .lcard-acts { display: flex; gap: 8px; margin-top: 12px; }

        /* ---- Assign modal ---- */
        .asg { display: flex; flex-direction: column; gap: 13px; }
        .asg-note { margin: 0; font-size: 0.8125rem; color: ${T.muted}; }
        .asg-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 20rem;
          overflow-y: auto;
          padding: 2px;
        }
        .asg-none { margin: 0; padding: 20px; text-align: center; color: ${T.muted}; }
        .srow {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 13px;
          background: ${T.bg};
          border: 1px solid ${T.border};
          border-radius: 12px;
          cursor: pointer;
          transition: background 160ms ease, border-color 160ms ease;
        }
        .srow:hover { background: ${T.hover}; }
        .srow.is-on {
          background: rgba(37, 99, 235, 0.06);
          border-color: rgba(37, 99, 235, 0.28);
        }
        .scb { width: 17px; height: 17px; flex-shrink: 0; accent-color: ${T.accent}; cursor: pointer; }
        .sav {
          width: 30px;
          height: 30px;
          flex: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: ${T.card};
          border: 1px solid ${T.border};
          font-size: 0.6875rem;
          font-weight: 700;
          color: #4b5563;
        }
        .smeta { flex: 1; min-width: 0; }
        .sname2 {
          font-size: 0.875rem;
          font-weight: 600;
          color: ${T.text};
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ssub2 { margin-top: 2px; font-size: 0.6875rem; color: #9ca3af; }
        .stag {
          flex: none;
          padding: 3px 9px;
          font-size: 0.6875rem;
          font-weight: 600;
          color: ${T.accent};
          background: ${T.hover};
          border-radius: 999px;
        }
        .asg-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-top: 13px;
          border-top: 1px solid ${T.border};
        }
        .asg-count { font-size: 0.8125rem; color: ${T.muted}; }
        .asg-acts { display: flex; gap: 8px; }

        /* ---- Forms ---- */
        .fm { display: flex; flex-direction: column; gap: 14px; }
        .f { display: flex; flex-direction: column; min-width: 0; }
        .fgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .fl { margin-bottom: 6px; font-size: 0.8125rem; font-weight: 600; color: #374151; }
        .facts { display: flex; gap: 10px; padding-top: 2px; }
        .grow { flex: 1; }

        /* ---- Responsive ---- */
        @media (max-width: 1080px) {
          .week { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        }
        @media (max-width: 900px) {
          .mast-r { width: 100%; }
          .mast-r > :global(button) { width: 100%; }
          .tabs { width: 100%; }
          .tab { flex: 1; justify-content: center; }
          .week { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 720px) {
          .listtable { display: none; }
          .lcards { display: block; padding: 12px; }
          .week { grid-template-columns: 1fr; gap: 8px; }
          .dayh {
            justify-content: flex-start;
            border-radius: 12px 12px 0 0;
            padding: 9px 14px;
          }
          .dayh-l { display: block; font-size: 0.6875rem; font-weight: 500; opacity: 0.72; }
          .dayh-s { display: none; }
          .dayh-n { margin-left: auto; }
          .cell { min-height: 0; padding: 8px; }
          .noclass { padding: 8px 4px; }
          .slot { padding: 10px 11px; }
          .stime { font-size: 0.75rem; }
          .sname { font-size: 0.8125rem; }
          .ssub { font-size: 0.6875rem; }
          .srem { min-height: 28px; }
          .all-h { flex-direction: column; align-items: stretch; }
          .facts { flex-direction: column-reverse; }
          .fgrid { grid-template-columns: 1fr; }
          .asg-foot { flex-direction: column; align-items: stretch; }
          .asg-acts > :global(button) { flex: 1; }
        }
        @media (max-width: 420px) {
          .bgrid { grid-template-columns: 1fr; }
          .bfoot { flex-direction: column; }
        }
      `}</style>
    </InstituteLayout>
  );
}
