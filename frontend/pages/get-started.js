import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { FadeUp } from '../components/ui/ScrollReveal';

const instituteTypes = [
  'Coaching Institute',
  'Tuition / Academic Classes',
  'Computer Training Centre',
  'Skill Development Institute',
  'Competitive Exam Coaching',
  'Language Training Institute',
  'Other',
];

const studentCounts = [
  'Up to 50 students',
  '51–100 students',
  '101–150 students',
  '151–300 students',
  '300+ students',
];

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '12px',
  border: '1px solid rgba(0,0,0,0.1)',
  fontSize: '0.9rem',
  color: '#111827',
  background: '#fafafa',
  outline: 'none',
  transition: 'border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '6px',
};

export default function GetStartedPage() {
  const [form, setForm] = useState({
    instituteName: '',
    ownerName: '',
    email: '',
    instituteType: '',
    numberOfStudents: '',
    phone: '',
    message: '',
  });
  const [focused, setFocused] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const getFieldStyle = (name) => ({
    ...inputStyle,
    borderColor: focused === name ? '#5ce1e6' : 'rgba(0,0,0,0.1)',
    boxShadow: focused === name ? '0 0 0 3px rgba(92,225,230,0.1)' : 'none',
    background: focused === name ? 'white' : '#fafafa',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please try emailing us directly at syncoptrac@gmail.com');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ overflowX: 'hidden' }}>
      <Navbar />

      {/* Page header */}
      <section
        className="relative py-20 px-4 text-center overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0a1844 0%, #11245d 50%, #0a1844 100%)',
          color: 'white',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(92,225,230,0.07) 0%, transparent 70%)',
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(92,225,230,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(92,225,230,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
        <div className="relative z-10">
          <div
            className="inline-block text-xs font-bold px-3.5 py-1.5 rounded-full mb-6 uppercase tracking-widest"
            style={{
              background: 'rgba(92,225,230,0.08)',
              color: '#f0c040',
              border: '1px solid rgba(92,225,230,0.2)',
            }}
          >
            Get Started
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4" style={{ letterSpacing: '-0.02em' }}>
            Tell Us About Your Institute
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: 'rgba(200,215,255,0.7)', maxWidth: '520px', margin: '0 auto' }}>
            Fill in your institute details. We will review your request and contact you within 24 hours.
          </p>
        </div>
      </section>

      {/* Form section */}
      <section className="py-16 px-4" style={{ background: '#f4f6ff', flex: 1 }}>
        <div className="max-w-xl mx-auto">
          {submitted ? (
            <FadeUp>
              <div
                style={{
                  background: 'white',
                  borderRadius: '24px',
                  border: '1px solid rgba(22,163,74,0.2)',
                  boxShadow: '0 8px 40px rgba(22,163,74,0.08)',
                  padding: '52px 40px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>✅</div>
                <h2 style={{ fontWeight: 800, color: '#111827', fontSize: '1.5rem', marginBottom: '12px', letterSpacing: '-0.02em' }}>
                  Request Received
                </h2>
                <p style={{ color: '#6b7280', lineHeight: 1.75, fontSize: '0.95rem' }}>
                  Thank you for reaching out. We have received your details and will review your request and contact you within <strong style={{ color: '#111827' }}>24 hours</strong>.
                </p>
                <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '16px' }}>
                  If you need to reach us sooner, email us at{' '}
                  <a href="mailto:syncoptrac@gmail.com" style={{ color: '#5ce1e6' }}>syncoptrac@gmail.com</a>
                </p>
              </div>
            </FadeUp>
          ) : (
            <FadeUp>
              <div
                style={{
                  background: 'white',
                  borderRadius: '24px',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 4px 32px rgba(0,0,0,0.06)',
                  padding: '40px',
                }}
              >
                <form onSubmit={handleSubmit}>

                  {/* Required fields section */}
                  <div style={{ marginBottom: '8px' }}>
                    <div
                      style={{
                        fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                        color: '#9ca3af', marginBottom: '20px', paddingBottom: '10px',
                        borderBottom: '1px solid rgba(0,0,0,0.06)',
                      }}
                    >
                      Institute Details
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      <div>
                        <label style={labelStyle} htmlFor="instituteName">
                          Institute Name <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          id="instituteName"
                          name="instituteName"
                          type="text"
                          required
                          placeholder="e.g. Sharma Coaching Centre"
                          value={form.instituteName}
                          onChange={handleChange}
                          onFocus={() => setFocused('instituteName')}
                          onBlur={() => setFocused('')}
                          style={getFieldStyle('instituteName')}
                        />
                      </div>

                      <div>
                        <label style={labelStyle} htmlFor="ownerName">
                          Owner / Contact Name <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          id="ownerName"
                          name="ownerName"
                          type="text"
                          required
                          placeholder="Your full name"
                          value={form.ownerName}
                          onChange={handleChange}
                          onFocus={() => setFocused('ownerName')}
                          onBlur={() => setFocused('')}
                          style={getFieldStyle('ownerName')}
                        />
                      </div>

                      <div>
                        <label style={labelStyle} htmlFor="email">
                          Email Address <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          placeholder="you@example.com"
                          value={form.email}
                          onChange={handleChange}
                          onFocus={() => setFocused('email')}
                          onBlur={() => setFocused('')}
                          style={getFieldStyle('email')}
                        />
                      </div>

                      <div>
                        <label style={labelStyle} htmlFor="instituteType">
                          Institute Type <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <select
                          id="instituteType"
                          name="instituteType"
                          required
                          value={form.instituteType}
                          onChange={handleChange}
                          onFocus={() => setFocused('instituteType')}
                          onBlur={() => setFocused('')}
                          style={{ ...getFieldStyle('instituteType'), cursor: 'pointer' }}
                        >
                          <option value="">Select institute type...</option>
                          {instituteTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>

                      <div>
                        <label style={labelStyle} htmlFor="studentCount">
                          Number of Students <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <select
                          id="studentCount"
                          name="numberOfStudents"
                          required
                          value={form.numberOfStudents}
                          onChange={handleChange}
                          onFocus={() => setFocused('studentCount')}
                          onBlur={() => setFocused('')}
                          style={{ ...getFieldStyle('studentCount'), cursor: 'pointer' }}
                        >
                          <option value="">Select student count...</option>
                          {studentCounts.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Optional fields */}
                  <div style={{ marginTop: '28px' }}>
                    <div
                      style={{
                        fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                        color: '#9ca3af', marginBottom: '20px', paddingBottom: '10px',
                        borderBottom: '1px solid rgba(0,0,0,0.06)',
                      }}
                    >
                      Optional
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      <div>
                        <label style={labelStyle} htmlFor="phone">Phone Number</label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder=""
                          value={form.phone}
                          onChange={handleChange}
                          onFocus={() => setFocused('phone')}
                          onBlur={() => setFocused('')}
                          style={getFieldStyle('phone')}
                        />
                      </div>

                      <div>
                        <label style={labelStyle} htmlFor="message">Message</label>
                        <textarea
                          id="message"
                          name="message"
                          rows={4}
                          placeholder="Anything else you'd like us to know about your institute..."
                          value={form.message}
                          onChange={handleChange}
                          onFocus={() => setFocused('message')}
                          onBlur={() => setFocused('')}
                          style={{ ...getFieldStyle('message'), resize: 'vertical', minHeight: '100px' }}
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div style={{
                      marginTop: '16px', padding: '12px 16px',
                      background: 'rgba(239,68,68,0.07)', borderRadius: '10px',
                      border: '1px solid rgba(239,68,68,0.2)',
                      color: '#dc2626', fontSize: '0.875rem',
                    }}>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      marginTop: '28px',
                      width: '100%',
                      padding: '14px',
                      borderRadius: '14px',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      background: loading ? 'rgba(92,225,230,0.5)' : 'linear-gradient(135deg, #d4af37 0%, #f0c040 50%, #d4af37 100%)',
                      backgroundSize: '200% auto',
                      color: '#11245d',
                      fontWeight: 700,
                      fontSize: '1rem',
                      letterSpacing: '0.01em',
                      boxShadow: loading ? 'none' : '0 0 24px rgba(92,225,230,0.3), inset 0 1px 0 rgba(255,255,255,0.25)',
                      transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                    }}
                    onMouseEnter={e => {
                      if (!loading) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 0 48px rgba(92,225,230,0.45), inset 0 1px 0 rgba(255,255,255,0.3)';
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = loading ? 'none' : '0 0 24px rgba(92,225,230,0.3), inset 0 1px 0 rgba(255,255,255,0.25)';
                    }}
                  >
                    {loading ? 'Submitting...' : 'Submit Request →'}
                  </button>

                  <p style={{ textAlign: 'center', marginTop: '14px', fontSize: '0.8rem', color: '#9ca3af' }}>
                    We review every request and respond within 24 hours.
                  </p>
                </form>
              </div>
            </FadeUp>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}