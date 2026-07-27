import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import InstituteLayout from '../../components/layout/InstituteLayout';
import api, { getUser, setStoredUser } from '../../lib/api';
import toast from 'react-hot-toast';
import { T } from '../../components/ds/tokens';

export default function InstituteSettings() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [newUsername, setNewUsername] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const [feeCycle, setFeeCycle] = useState('monthly');
  const [savingCycle, setSavingCycle] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== 'institute') { router.push('/institute/login'); return; }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/institute/profile');
      setProfile(res.data);
      if (res.data?.feeCollectionCycle) setFeeCycle(res.data.feeCollectionCycle);
    } catch (e) {
      toast.error('Failed to load account details');
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameSave = async (e) => {
    e.preventDefault();
    const value = newUsername.trim();
    if (!value) { toast.error('Please enter a new username'); return; }
    if (value.length < 4) { toast.error('Username must be at least 4 characters'); return; }
    if (value === profile?.loginId) { toast.error('This is already your current username'); return; }
    setSavingUsername(true);
    try {
      const res = await api.patch('/api/institute/change-username', { newUsername: value });
      const current = getUser() || {};
      setStoredUser({ ...current, loginId: res.data.loginId });
      setProfile((p) => ({ ...p, loginId: res.data.loginId }));
      setNewUsername('');
      toast.success('Username updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update username');
    } finally {
      setSavingUsername(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = pwForm;
    if (!currentPassword || !newPassword || !confirmPassword) { toast.error('Please fill in all password fields'); return; }
    if (newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('New password and confirm password do not match'); return; }
    setSavingPassword(true);
    try {
      await api.patch('/api/institute/change-password', pwForm);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const FEE_CYCLES = [
    { value: 'monthly', label: 'Monthly', hint: 'Fees become due every month' },
    { value: 'quarterly', label: 'Quarterly', hint: 'Fees become due every 3 months' },
    { value: 'half-yearly', label: 'Half-Yearly', hint: 'Fees become due every 6 months' },
    { value: 'yearly', label: 'Yearly', hint: 'Fees become due once every year' },
  ];

  const handleFeeCycleSave = async () => {
    if (profile && feeCycle === profile.feeCollectionCycle) return;
    setSavingCycle(true);
    try {
      const res = await api.patch('/api/institute/fee-cycle', { feeCollectionCycle: feeCycle });
      setProfile((p) => ({ ...p, feeCollectionCycle: res.data.feeCollectionCycle }));
      toast.success('Fee collection cycle updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update fee collection cycle');
    } finally {
      setSavingCycle(false);
    }
  };

  const infoRows = [
    ['Institute Name', profile?.instituteName],
    ['Owner Name', profile?.ownerName],
    ['Email', profile?.email],
    ['Phone Number', profile?.phone],
    ['Institute Type', profile?.instituteType],
  ];

  // Local-only strength hint for the new password field (no validation change).
  const pwLen = pwForm.newPassword.length;
  const pwScore = pwLen === 0 ? 0
    : pwLen < 8 ? 1
    : /[A-Z]/.test(pwForm.newPassword) && /[0-9]/.test(pwForm.newPassword) && pwLen >= 12 ? 4
    : /[A-Z]/.test(pwForm.newPassword) || /[0-9]/.test(pwForm.newPassword) ? 3
    : 2;
  const PW_TONE = ['#E5E7EB', '#EF4444', '#F59E0B', '#3B82F6', '#22C55E'];
  const matchState = !pwForm.confirmPassword ? 'idle'
    : pwForm.newPassword === pwForm.confirmPassword ? 'ok' : 'bad';

  return (
    <InstituteLayout title="Account Settings">
      <div className="wrap">

        {/* ---- Masthead ---- */}
        <div className="mast">
          <p className="sc-eyebrow">Preferences</p>
          <h1 className="sc-h1">Account Settings</h1>
          <p className="sub">Manage your sign-in details and how fees are collected.</p>
        </div>

        {/* ---- Account Information ---- */}
        <section className="sc-card panel">
          <div className="phead">
            <span className="rail" />
            <div>
              <h2 className="ptitle">Account Information</h2>
              <p className="pnote">Your institute details. These stay in sync with the admin dashboard.</p>
            </div>
          </div>

          {loading ? (
            <div className="rows" role="status" aria-label="Loading account details">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="row">
                  <div className="sc-skel sk-k" />
                  <div className="sc-skel sk-v" />
                </div>
              ))}
            </div>
          ) : (
            <div className="rows">
              {infoRows.map(([label, value]) => (
                <div key={label} className="row">
                  <span className="rk">{label}</span>
                  <span className="rv">{value || '\u2014'}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ---- Change Username ---- */}
        <section className="sc-card panel">
          <div className="phead">
            <span className="rail" />
            <div>
              <h2 className="ptitle">Change Username</h2>
              <p className="pnote">This is the username you use to sign in. You can change it anytime.</p>
            </div>
          </div>

          <form onSubmit={handleUsernameSave} className="form" autoComplete="off">
            <div className="f">
              <label className="fl">Current Username</label>
              <input className="sc-field is-locked" value={loading ? '' : (profile?.loginId || '')} readOnly disabled />
            </div>
            <div className="f">
              <label className="fl">New Username</label>
              <input
                className="sc-field"
                placeholder="Enter a new username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                autoComplete="off"
                name="new-institute-username"
              />
              <p className="fh">Must be unique and at least 4 characters. Letters, numbers, dots, underscores and hyphens only.</p>
            </div>
            <div className="pfoot">
              <button type="submit" className="sc-btn sc-btn-primary" disabled={savingUsername || loading}>
                {savingUsername ? 'Saving...' : 'Update Username'}
              </button>
            </div>
          </form>
        </section>

        {/* ---- Change Password ---- */}
        <section className="sc-card panel">
          <div className="phead">
            <span className="rail" />
            <div>
              <h2 className="ptitle">Change Password</h2>
              <p className="pnote">Choose a strong password you do not use anywhere else.</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSave} className="form" autoComplete="off">
            <div className="f">
              <label className="fl">Current Password</label>
              <input
                type={showPw ? 'text' : 'password'}
                className="sc-field"
                placeholder="Enter your current password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                autoComplete="current-password"
              />
            </div>

            <div className="f">
              <label className="fl">New Password</label>
              <input
                type={showPw ? 'text' : 'password'}
                className="sc-field"
                placeholder="At least 8 characters"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                autoComplete="new-password"
              />
              <div className="meter" aria-hidden="true">
                {[1, 2, 3, 4].map((n) => (
                  <span key={n} className="mseg"
                    style={{ background: pwScore >= n ? PW_TONE[pwScore] : '#EEF2F7' }} />
                ))}
              </div>
              <p className="fh">Minimum 8 characters.</p>
            </div>

            <div className="f">
              <label className="fl">Confirm New Password</label>
              <input
                type={showPw ? 'text' : 'password'}
                className={matchState === 'bad' ? 'sc-field is-error' : 'sc-field'}
                placeholder="Re-enter your new password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                autoComplete="new-password"
              />
              {matchState === 'bad' && <p className="fh fh-bad">Passwords do not match yet</p>}
              {matchState === 'ok' && <p className="fh fh-ok">Passwords match</p>}
            </div>

            <label className="showpw">
              <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} className="cb" />
              Show passwords
            </label>

            <div className="pfoot">
              <button type="submit" className="sc-btn sc-btn-primary" disabled={savingPassword}>
                {savingPassword ? 'Saving...' : 'Update Password'}
              </button>
            </div>
          </form>
        </section>

        {/* ---- Fee Collection Cycle ---- */}
        <section className="sc-card panel">
          <div className="phead">
            <span className="rail" />
            <div>
              <h2 className="ptitle">Fee Collection Cycle</h2>
              <p className="pnote">
                Choose how often your institute collects fees. Each student&apos;s next due date is calculated from their own last successful payment date &mdash; not a shared calendar month or quarter &mdash; so due dates, pending fees, status, and collection periods stay independent per student.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="cyc" role="status" aria-label="Loading fee cycle">
              {[1, 2].map((i) => (
                <div key={i} className="sc-skel sk-cyc" />
              ))}
            </div>
          ) : (
            <>
              <div className="cyc">
                {FEE_CYCLES.map((c) => {
                  const on = feeCycle === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFeeCycle(c.value)}
                      className={on ? 'cbtn is-on' : 'cbtn'}
                      aria-pressed={on}
                    >
                      <span className="ctop">
                        <span className="clabel">{c.label}</span>
                        <span className={on ? 'cdot is-on' : 'cdot'} />
                      </span>
                      <span className="chint">{c.hint}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pfoot">
                <button
                  type="button"
                  onClick={handleFeeCycleSave}
                  className="sc-btn sc-btn-primary"
                  disabled={savingCycle || (profile && feeCycle === profile.feeCollectionCycle)}
                >
                  {savingCycle ? 'Saving...' : 'Save Fee Cycle'}
                </button>
              </div>
            </>
          )}
        </section>

      </div>

      <style jsx>{`
        .wrap {
          max-width: 44rem;
          margin: 0 auto;
          padding-bottom: 8px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .mast { margin-bottom: 2px; }
        .sub { margin: 5px 0 0; font-size: 0.875rem; color: ${T.muted}; }

        /* ---- Panels ---- */
        .panel { padding: 20px; }
        .phead { display: flex; gap: 13px; margin-bottom: 17px; }
        .rail {
          flex: none;
          width: 4px;
          border-radius: 999px;
          background: linear-gradient(180deg, ${T.accent}, ${T.accent2});
        }
        .ptitle {
          margin: 0;
          font-size: 1.0625rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: ${T.navy};
        }
        .pnote { margin: 6px 0 0; font-size: 0.8125rem; line-height: 1.55; color: ${T.muted}; }

        /* ---- Info rows ---- */
        .rows { display: flex; flex-direction: column; }
        .row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 12px 0;
        }
        .row + .row { border-top: 1px solid #f1f5f9; }
        .rk { font-size: 0.875rem; color: ${T.muted}; }
        .rv {
          font-size: 0.875rem;
          font-weight: 600;
          color: ${T.text};
          text-align: right;
          word-break: break-word;
        }
        .sk-k { height: 11px; width: 7rem; border-radius: 6px; }
        .sk-v { height: 11px; width: 9rem; border-radius: 6px; }

        /* ---- Forms ---- */
        .form { display: flex; flex-direction: column; gap: 15px; }
        .f { display: flex; flex-direction: column; min-width: 0; }
        .fl { margin-bottom: 6px; font-size: 0.8125rem; font-weight: 600; color: #374151; }
        .fh { margin: 7px 0 0; font-size: 0.75rem; color: #9ca3af; line-height: 1.5; }
        .fh-bad { color: #b91c1c; font-weight: 500; }
        .fh-ok { color: #15803d; font-weight: 500; }
        .is-locked {
          background: ${T.bg};
          color: ${T.muted};
          cursor: not-allowed;
        }

        .meter { display: flex; gap: 4px; margin-top: 8px; }
        .mseg {
          flex: 1;
          height: 4px;
          border-radius: 999px;
          transition: background 280ms ease;
        }

        .showpw {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 11px 0;
          margin: -11px 0;
          font-size: 0.875rem;
          color: ${T.muted};
          cursor: pointer;
          user-select: none;
        }
        .cb {
          width: 17px;
          height: 17px;
          accent-color: ${T.accent};
          cursor: pointer;
        }

        .pfoot { display: flex; justify-content: flex-end; margin-top: 3px; }

        /* ---- Fee cycle ---- */
        .cyc {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 11px;
        }
        .sk-cyc { height: 4.25rem; border-radius: 14px; }
        .cbtn {
          display: flex;
          flex-direction: column;
          gap: 5px;
          text-align: left;
          padding: 13px 15px;
          background: ${T.card};
          border: 1.5px solid ${T.border};
          border-radius: 14px;
          cursor: pointer;
          transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
        }
        .cbtn:hover { background: ${T.hover}; border-color: #cbd5e1; }
        .cbtn.is-on {
          background: rgba(37, 99, 235, 0.05);
          border-color: ${T.accent};
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        .cbtn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.28); }
        .ctop { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .clabel { font-size: 0.875rem; font-weight: 600; color: ${T.navy}; }
        .cdot {
          width: 9px;
          height: 9px;
          flex: none;
          border-radius: 50%;
          border: 1.5px solid ${T.border};
          transition: background 180ms ease, border-color 180ms ease;
        }
        .cdot.is-on { background: ${T.accent}; border-color: ${T.accent}; }
        .chint { font-size: 0.75rem; color: #9ca3af; }

        /* ---- Responsive ---- */
        @media (max-width: 720px) {
          .panel { padding: 17px; }
          .cyc { grid-template-columns: 1fr; }
          .pfoot { margin-top: 5px; }
          .pfoot > :global(button) { width: 100%; }
          .row { flex-direction: column; align-items: flex-start; gap: 4px; }
          .rv { text-align: left; }
        }
      `}</style>
    </InstituteLayout>
  );
}
