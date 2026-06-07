import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import InstituteLayout from '../../components/layout/InstituteLayout';
import Modal from '../../components/ui/Modal';
import api, { getUser } from '../../lib/api';
import toast from 'react-hot-toast';

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
    // ISO datetime artifact — extract UTC time components
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

  // Schedule slot modal
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showListView, setShowListView] = useState(false);
  const [editSlotId, setEditSlotId] = useState(null);
  const [slotForm, setSlotForm] = useState(EMPTY_SLOT);

  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== 'institute') { router.push('/institute/login'); return; }
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
      toast.error('Failed to load batches');
      console.error('Batches error:', bRes.reason);
    }

    if (sRes.status === 'fulfilled') {
      setStudents(sRes.value.data.data || []);
    } else {
      toast.error('Failed to load students');
      console.error('Students error:', sRes.reason);
    }

    if (slRes.status === 'fulfilled') {
      setSlots(slRes.value.data.data || []);
    } else {
      toast.error('Failed to load schedule');
      console.error('Schedule error:', slRes.reason);
    }

    setLoading(false);
  };

  // ── Batch CRUD ────────────────────────────────────────────
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

  // ── Assign students ───────────────────────────────────────
  const openAssign = (b) => {
    setAssignBatch(b);
    // FIX: Google Sheets returns empty cells as 0 (number), not '' (string).
    // String() ensures .split() never throws "b.Students.split is not a function"
    // which was causing the client-side crash shown in the screenshot.
    const current = String(b.Students || '').split(',').map(s => s.trim()).filter(Boolean);
    setSelectedStudents(current);
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

  // ── Schedule CRUD ─────────────────────────────────────────
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

  // ── Helpers ───────────────────────────────────────────────
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

  if (loading) {
    return (
      <InstituteLayout title="Batches & Schedule">
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
          Loading batches...
        </div>
      </InstituteLayout>
    );
  }

  return (
    <InstituteLayout title="Batches & Schedule">

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e5e7eb', paddingBottom: 0 }}>
        {[
          { key: 'batches', label: '👥 Batches', count: batches.length },
          { key: 'schedule', label: '📅 Weekly Timetable' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 18px',
              fontSize: '0.875rem',
              fontWeight: 600,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderBottom: tab === t.key ? '2px solid #1a73e8' : '2px solid transparent',
              color: tab === t.key ? '#1a73e8' : '#6b7280',
              transition: 'all 0.2s ease',
              marginBottom: -1,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {t.label}
            {t.count !== undefined && (
              <span style={{
                background: tab === t.key ? '#1a73e8' : '#e5e7eb',
                color: tab === t.key ? 'white' : '#6b7280',
                fontSize: '11px', fontWeight: 700,
                padding: '1px 7px', borderRadius: 10,
              }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB: BATCHES
         ══════════════════════════════════════════════════════ */}
      {tab === 'batches' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button onClick={openNewBatch} className="btn-primary">
              ➕ New Batch
            </button>
          </div>

          {batches.length === 0 ? (
            <div style={{
              background: 'white', borderRadius: 16, border: '1px solid #e5e7eb',
              textAlign: 'center', padding: '60px 20px',
            }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>👥</div>
              <p style={{ color: '#374151', fontWeight: 600, marginBottom: 6 }}>No batches yet</p>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: 20 }}>
                Create your first batch to group students
              </p>
              <button onClick={openNewBatch} className="btn-primary text-sm">Create First Batch</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {batches.map((b, i) => {
                const color = COLORS[i % COLORS.length];
                const batchStudents = getStudentsOfBatch(b);
                const batchSlots = slots.filter(s => String(s.BatchID) === String(b.BatchID));

                return (
                  <div key={b.BatchID} style={{
                    background: 'white', borderRadius: 16,
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    overflow: 'hidden',
                    transition: 'box-shadow 0.2s ease',
                  }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'}
                  >
                    {/* Color bar */}
                    <div style={{ height: 5, background: color }} />

                    <div style={{ padding: 20 }}>
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <h3 style={{ fontWeight: 700, color: '#111827', fontSize: '1rem', marginBottom: 4 }}>
                            {b.BatchName}
                          </h3>
                          <span style={{
                            fontSize: '12px', padding: '2px 10px', borderRadius: 20,
                            background: `${color}15`, color: color, fontWeight: 600,
                          }}>
                            {b.Course}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => openEditBatch(b)}
                            style={{ fontSize: '12px', color: '#6b7280', background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>
                            Edit
                          </button>
                          <button onClick={() => deleteBatch(b.BatchID, b.BatchName)}
                            style={{ fontSize: '12px', color: '#ef4444', background: '#fef2f2', border: 'none', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>
                            Delete
                          </button>
                        </div>
                      </div>

                      {b.Teacher && (
                        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                          👨‍🏫 <span>{b.Teacher}</span>
                        </div>
                      )}

                      {/* Stats row */}
                      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                        <div style={{ flex: 1, background: '#f4f6ff', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: color }}>{batchStudents.length}</div>
                          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: 2 }}>Students</div>
                        </div>
                        <div style={{ flex: 1, background: '#f4f6ff', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: color }}>{batchSlots.length}</div>
                          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: 2 }}>Classes/week</div>
                        </div>
                      </div>

                      {/* Student chips */}
                      {batchStudents.length > 0 && (
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Students
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {batchStudents.slice(0, 5).map(s => (
                              <span key={s.StudentID} style={{
                                fontSize: '11px', padding: '2px 8px', borderRadius: 20,
                                background: '#f3f4f6', color: '#374151', fontWeight: 500,
                              }}>
                                {s.StudentName}
                              </span>
                            ))}
                            {batchStudents.length > 5 && (
                              <span style={{
                                fontSize: '11px', padding: '2px 8px', borderRadius: 20,
                                background: `${color}15`, color: color, fontWeight: 600,
                              }}>
                                +{batchStudents.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Schedule preview */}
                      {batchSlots.length > 0 && (
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Schedule
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {batchSlots.slice(0, 3).map(slot => (
                              <div key={slot.SlotID} style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                fontSize: '12px', color: '#374151',
                              }}>
                                <span style={{
                                  width: 32, fontSize: '11px', fontWeight: 600,
                                  color: color,
                                }}>
                                  {DAY_SHORT[DAYS.indexOf(slot.Day)] || slot.Day.slice(0, 3)}
                                </span>
                                <span>{fmtTime(slot.StartTime)} – {fmtTime(slot.EndTime)}</span>
                                {slot.Subject && <span style={{ color: '#9ca3af' }}>· {slot.Subject}</span>}
                              </div>
                            ))}
                            {batchSlots.length > 3 && (
                              <div style={{ fontSize: '11px', color: '#9ca3af' }}>+{batchSlots.length - 3} more classes</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openAssign(b)}
                          style={{
                            flex: 1, fontSize: '12px', fontWeight: 600,
                            padding: '8px', borderRadius: 10, border: `1px solid ${color}30`,
                            background: `${color}10`, color: color, cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = `${color}20`}
                          onMouseLeave={e => e.currentTarget.style.background = `${color}10`}
                        >
                          👥 Assign Students
                        </button>
                        <button onClick={() => openNewSlot(b.BatchID)}
                          style={{
                            flex: 1, fontSize: '12px', fontWeight: 600,
                            padding: '8px', borderRadius: 10, border: '1px solid #e5e7eb',
                            background: '#f9fafb', color: '#374151', cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                          onMouseLeave={e => e.currentTarget.style.background = '#f9fafb'}
                        >
                          📅 Add Class
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

      {/* ══════════════════════════════════════════════════════
          TAB: WEEKLY TIMETABLE
         ══════════════════════════════════════════════════════ */}
      {tab === 'schedule' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>
                {slots.length} classes across {batches.length} batches
              </p>
            </div>
            <button onClick={() => openNewSlot()} className="btn-primary text-sm" disabled={batches.length === 0}>
              ➕ Add Class
            </button>
          </div>

          {batches.length === 0 ? (
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', textAlign: 'center', padding: 40 }}>
              <p style={{ color: '#9ca3af' }}>Create batches first before adding a schedule.</p>
            </div>
          ) : (
            <>
              {/* Batch color legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {batches.map((b, i) => (
                  <div key={b.BatchID} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 12px', borderRadius: 20,
                    background: `${COLORS[i % COLORS.length]}12`,
                    border: `1px solid ${COLORS[i % COLORS.length]}30`,
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: COLORS[i % COLORS.length] }}>
                      {b.BatchName}
                    </span>
                  </div>
                ))}
              </div>

              {/* Weekly grid — horizontally scrollable on narrow screens */}
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 4, borderRadius: 10, paddingBottom: 4 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(130px, 1fr))', gap: 10, minWidth: 700 }}>
                {DAYS.map(day => {
                  const daySlots = getSlotsForDay(day);
                  return (
                    <div key={day}>
                      {/* Day header */}
                      <div style={{
                        background: 'linear-gradient(135deg, #11245d, #1a3a7a)',
                        color: 'white',
                        borderRadius: '10px 10px 0 0',
                        padding: '10px 8px',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: 700,
                        letterSpacing: '0.03em',
                      }}>
                        <div>{DAY_SHORT[DAYS.indexOf(day)]}</div>
                        <div style={{ fontSize: '9px', fontWeight: 500, opacity: 0.7, marginTop: 2 }}>{day}</div>
                      </div>

                      {/* Slots */}
                      <div style={{
                        background: 'white',
                        borderRadius: '0 0 10px 10px',
                        border: '1px solid #e5e7eb',
                        borderTop: 'none',
                        minHeight: 120,
                        padding: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 5,
                      }}>
                        {daySlots.length === 0 ? (
                          <div style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#d1d5db', fontSize: '11px', textAlign: 'center',
                            padding: '12px 4px',
                          }}>
                            No class
                          </div>
                        ) : (
                          daySlots.map(slot => {
                            const color = getBatchColor(slot.BatchID);
                            return (
                              <div
                                key={slot.SlotID}
                                style={{
                                  background: `${color}12`,
                                  border: `1px solid ${color}30`,
                                  borderLeft: `3px solid ${color}`,
                                  borderRadius: 7,
                                  padding: '6px 7px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = `${color}22`}
                                onMouseLeave={e => e.currentTarget.style.background = `${color}12`}
                                onClick={() => openEditSlot(slot)}
                              >
                                <div style={{ fontSize: '10px', fontWeight: 700, color }}>
                                  {fmtTime(slot.StartTime)} – {fmtTime(slot.EndTime)}
                                </div>
                                <div style={{ fontSize: '11px', fontWeight: 600, color: '#111827', marginTop: 2, lineHeight: 1.2 }}>
                                  {getBatchName(slot.BatchID)}
                                </div>
                                {slot.Subject && (
                                  <div style={{ fontSize: '10px', color: '#6b7280', marginTop: 1 }}>
                                    {slot.Subject}
                                  </div>
                                )}
                                <button
                                  onClick={e => { e.stopPropagation(); deleteSlot(slot.SlotID); }}
                                  style={{
                                    marginTop: 4, fontSize: '10px', color: '#ef4444',
                                    background: 'transparent', border: 'none', cursor: 'pointer',
                                    padding: 0,
                                  }}
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
              </div>{/* end scroll wrapper */}

              {/* All Classes: toggle list view */}
              <div style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem', margin: 0 }}>
                    📋 All Classes
                  </h3>
                  <button
                    onClick={() => setShowListView(v => !v)}
                    style={{
                      fontSize: '12px', fontWeight: 600,
                      padding: '6px 14px', borderRadius: 20,
                      border: '1px solid rgba(17,36,93,0.2)',
                      background: showListView ? 'linear-gradient(135deg,#11245d,#1a3a7a)' : 'white',
                      color: showListView ? 'white' : '#11245d',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                    }}
                  >
                    {showListView ? 'Hide List' : 'View All Classes'}
                  </button>
                </div>
                {showListView && (
                <div style={{
                  background: 'white', borderRadius: 14, border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                }}>
                  {slots.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
                      No classes scheduled yet. Add a class from a batch card or the button above.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#f4f6ff', borderBottom: '1px solid #e5e7eb' }}>
                          {['Batch', 'Day', 'Time', 'Subject', ''].map(h => (
                            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '12px' }}>{h}</th>
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
                                <tr key={slot.SlotID} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                  <td style={{ padding: '10px 14px' }}>
                                    <span style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 6,
                                      padding: '3px 10px', borderRadius: 20,
                                      background: `${color}12`, color, fontSize: '12px', fontWeight: 600,
                                    }}>
                                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                                      {getBatchName(slot.BatchID)}
                                    </span>
                                  </td>
                                  <td style={{ padding: '10px 14px', color: '#374151', fontWeight: 500 }}>{slot.Day}</td>
                                  <td style={{ padding: '10px 14px', color: '#374151' }}>{fmtTime(slot.StartTime)} – {fmtTime(slot.EndTime)}</td>
                                  <td style={{ padding: '10px 14px', color: '#6b7280' }}>{slot.Subject || '—'}</td>
                                  <td style={{ padding: '10px 14px' }}>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                      <button onClick={() => openEditSlot(slot)} style={{ fontSize: '11px', color: '#1a73e8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                                      <button onClick={() => deleteSlot(slot.SlotID)} style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Remove</button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Create/Edit Batch Modal ── */}
      <Modal open={showBatchModal} onClose={() => setShowBatchModal(false)}
        title={editBatchId ? 'Edit Batch' : 'Create New Batch'}>
        <form onSubmit={saveBatch} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name *</label>
            <input className="input-field" placeholder="e.g. JEE Morning Batch"
              value={batchForm.batchName} onChange={e => setBatchForm(p => ({ ...p, batchName: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
            <input className="input-field" placeholder="e.g. JEE Mains, NEET, Class 10"
              value={batchForm.course} onChange={e => setBatchForm(p => ({ ...p, course: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teacher / Faculty</label>
            <input className="input-field" placeholder="e.g. Mr. Sharma"
              value={batchForm.teacher} onChange={e => setBatchForm(p => ({ ...p, teacher: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input className="input-field" placeholder="Optional notes about this batch"
              value={batchForm.description} onChange={e => setBatchForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="button" className="btn-secondary flex-1" onClick={() => setShowBatchModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Saving...' : editBatchId ? 'Update Batch' : 'Create Batch'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Assign Students Modal ── */}
      <Modal open={showAssignModal} onClose={() => setShowAssignModal(false)}
        title={`Assign Students — ${assignBatch?.BatchName || ''}`} size="lg">
        <div>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: 14 }}>
            Select students to add to this batch. Students can be in multiple batches.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto', marginBottom: 16 }}>
            {students.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: 20 }}>No students found. Add students first.</p>
            ) : (
              students.map(s => {
                const checked = selectedStudents.includes(String(s.StudentID));
                return (
                  <label key={s.StudentID} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                    background: checked ? 'rgba(26,115,232,0.06)' : '#f4f6ff',
                    border: checked ? '1px solid rgba(26,115,232,0.2)' : '1px solid #e5e7eb',
                    transition: 'all 0.15s ease',
                  }}>
                    <input type="checkbox" checked={checked}
                      onChange={() => toggleStudent(s.StudentID)}
                      style={{ width: 16, height: 16, accentColor: '#1a73e8', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{s.StudentName}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>{s.Course} · ID: {s.StudentID}</div>
                    </div>
                    {checked && <span style={{ fontSize: '11px', color: '#1a73e8', fontWeight: 600 }}>✓ Selected</span>}
                  </label>
                );
              })
            )}
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: 12, borderTop: '1px solid #e5e7eb',
          }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>
              {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-secondary" onClick={() => setShowAssignModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveAssignment} disabled={saving}>
                {saving ? 'Saving...' : 'Save Assignment'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Add/Edit Schedule Slot Modal ── */}
      <Modal open={showSlotModal} onClose={() => setShowSlotModal(false)}
        title={editSlotId ? 'Edit Class' : 'Add Class to Schedule'}>
        <form onSubmit={saveSlot} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch *</label>
            <select className="input-field" value={slotForm.batchId}
              onChange={e => setSlotForm(p => ({ ...p, batchId: e.target.value }))} required>
              <option value="">Select batch...</option>
              {batches.map(b => (
                <option key={b.BatchID} value={b.BatchID}>{b.BatchName} ({b.Course})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Day *</label>
            <select className="input-field" value={slotForm.day}
              onChange={e => setSlotForm(p => ({ ...p, day: e.target.value }))}>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
              <input type="time" className="input-field" value={slotForm.startTime}
                onChange={e => setSlotForm(p => ({ ...p, startTime: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
              <input type="time" className="input-field" value={slotForm.endTime}
                onChange={e => setSlotForm(p => ({ ...p, endTime: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject / Topic</label>
            <input className="input-field" placeholder="e.g. Physics, Mathematics"
              value={slotForm.subject} onChange={e => setSlotForm(p => ({ ...p, subject: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="button" className="btn-secondary flex-1" onClick={() => setShowSlotModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Saving...' : editSlotId ? 'Update Class' : 'Add to Schedule'}
            </button>
          </div>
        </form>
      </Modal>

    </InstituteLayout>
  );
}