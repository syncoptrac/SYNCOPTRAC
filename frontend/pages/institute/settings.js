import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import InstituteLayout from '../../components/layout/InstituteLayout';
import api, { getUser, setStoredUser } from '../../lib/api';
import toast from 'react-hot-toast';

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

  return (
    <InstituteLayout title="Account Settings">
      <div className="max-w-2xl mx-auto space-y-6 pb-4">

        {/* Account Information */}
        <section className="card">
          <div className="flex items-center gap-3 mb-1">
            <span className="w-1.5 h-5 rounded-full bg-brand-gold" />
            <h2 className="text-lg font-bold text-brand-dark">Account Information</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4 ml-4">Your institute details. These stay in sync with the admin dashboard.</p>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-5 bg-gray-100 rounded" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {infoRows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 py-3">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-semibold text-brand-dark text-right">{value || '—'}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Change Username */}
        <section className="card">
          <div className="flex items-center gap-3 mb-1">
            <span className="w-1.5 h-5 rounded-full bg-brand-gold" />
            <h2 className="text-lg font-bold text-brand-dark">Change Username</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4 ml-4">This is the username you use to sign in. You can change it anytime.</p>
          <form onSubmit={handleUsernameSave} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Current Username</label>
              <input className="input-field bg-gray-50 text-gray-500 cursor-not-allowed" value={loading ? '' : (profile?.loginId || '')} readOnly disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">New Username</label>
              <input
                className="input-field"
                placeholder="Enter a new username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                autoComplete="off"
                name="new-institute-username"
              />
              <p className="text-xs text-gray-400 mt-1.5">Must be unique and at least 4 characters. Letters, numbers, dots, underscores and hyphens only.</p>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn-primary" disabled={savingUsername || loading}>
                {savingUsername ? 'Saving...' : 'Update Username'}
              </button>
            </div>
          </form>
        </section>

        {/* Change Password */}
        <section className="card">
          <div className="flex items-center gap-3 mb-1">
            <span className="w-1.5 h-5 rounded-full bg-brand-gold" />
            <h2 className="text-lg font-bold text-brand-dark">Change Password</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4 ml-4">Choose a strong password you do not use anywhere else.</p>
          <form onSubmit={handlePasswordSave} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Current Password</label>
              <input
                type={showPw ? 'text' : 'password'}
                className="input-field"
                placeholder="Enter your current password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">New Password</label>
              <input
                type={showPw ? 'text' : 'password'}
                className="input-field"
                placeholder="At least 8 characters"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                autoComplete="new-password"
              />
              <p className="text-xs text-gray-400 mt-1.5">Minimum 8 characters.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Confirm New Password</label>
              <input
                type={showPw ? 'text' : 'password'}
                className="input-field"
                placeholder="Re-enter your new password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                autoComplete="new-password"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
              <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} className="rounded border-gray-300" />
              Show passwords
            </label>
            <div className="flex justify-end">
              <button type="submit" className="btn-primary" disabled={savingPassword}>
                {savingPassword ? 'Saving...' : 'Update Password'}
              </button>
            </div>
          </form>
        </section>

        {/* Fee Collection Cycle */}
        <section className="card">
          <div className="flex items-center gap-3 mb-1">
            <span className="w-1.5 h-5 rounded-full bg-brand-gold" />
            <h2 className="text-lg font-bold text-brand-dark">Fee Collection Cycle</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4 ml-4">
            Choose how often your institute collects fees. Each student&apos;s next due date is calculated from their own last successful payment date — not a shared calendar month or quarter — so due dates, pending fees, status, and collection periods stay independent per student.
          </p>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FEE_CYCLES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setFeeCycle(c.value)}
                    className={`text-left rounded-xl border px-4 py-3 transition-colors ${
                      feeCycle === c.value
                        ? 'border-brand-gold bg-brand-gold/5 ring-1 ring-brand-gold'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-brand-dark">{c.label}</span>
                      {feeCycle === c.value && (
                        <span className="w-2 h-2 rounded-full bg-brand-gold" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{c.hint}</p>
                  </button>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={handleFeeCycleSave}
                  className="btn-primary"
                  disabled={savingCycle || (profile && feeCycle === profile.feeCollectionCycle)}
                >
                  {savingCycle ? 'Saving...' : 'Save Fee Cycle'}
                </button>
              </div>
            </>
          )}
        </section>

      </div>
    </InstituteLayout>
  );
}