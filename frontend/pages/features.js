import Link from 'next/link';
import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { FadeUp } from '../components/ui/ScrollReveal';

const features = [
  {
    id: 'enquiry',
    icon: '📊',
    title: 'Enquiry Management',
    description: 'Never lose track of a prospective student. Every enquiry stays organised from first contact to final outcome.',
    howItWorks: [
      'Add new enquiries manually as they are received',
      'Update enquiry status (New, Follow-Up, Converted)',
      'Track follow-up dates',
      'Search and filter enquiries easily',
    ],
    howItHelps: [
      'Prevents enquiries from being forgotten after the first conversation',
      'Gives a clear view of who needs follow-up and when',
      'Reduces dependence on memory, notebooks, and scattered messages',
      'Helps prevent potential admissions from slipping through the cracks',
    ],
    accent: '#5ce1e6',
  },
  {
    id: 'attendance',
    icon: '👥',
    title: 'Attendance & Absentee Tracking',
    description: 'Mark attendance in seconds and automatically notify absent students or parents.',
    howItWorks: [
      'Teachers mark daily attendance',
      'Automated emails are sent to absent students or parents',
      'Reasons for absence can be recorded manually',
      'Attendance records and reports remain available for review',
    ],
    howItHelps: [
      'Makes absentees visible immediately instead of days later',
      'Encourages timely communication with students and parents',
      'Helps identify recurring attendance issues early',
      'Keeps attendance records organised and easy to review',
    ],
    note: 'Attendance notifications are sent to the email address provided by the institute (parent, guardian, or student).',
    accent: '#5ce1e6',
  },
  {
    id: 'fees',
    icon: '💰',
    title: 'Fee Tracking & Reminders',
    description: 'Keep track of paid and overdue fees while reducing manual follow-up work.',
    howItWorks: [
      'Teachers update fee status on the due date',
      'Fees are marked as Paid or Overdue',
      'Automated reminder emails are sent for overdue fees',
      'Payment records remain organised for reference',
    ],
    howItHelps: [
      'Makes overdue payments visible before they become larger collection problems',
      'Removes the need to manually send every reminder',
      'Provides clear visibility into overdue payments',
      'Keeps fee follow-ups structured and consistent',
    ],
    accent: '#5ce1e6',
  },
  {
    id: 'batches',
    icon: '📅',
    title: 'Batch & Schedule Management',
    description: 'Organise batches, assign teachers, and manage schedules from one structured view.',
    howItWorks: [
      'View batch details, assigned teachers, and courses',
      'Track student count and joining dates',
      'Maintain weekly schedules and class plans',
      'Update or reschedule classes whenever required',
    ],
    howItHelps: [
      'Reduces confusion around batch planning and coordination',
      'Makes important information easy to find when needed',
      'Reduces the mental load of managing batches and schedules',
      'Keeps daily operations structured and easier to manage',
    ],
    accent: '#5ce1e6',
  },
];

function FeatureSection({ feature, index }) {
  const [activeTab, setActiveTab] = useState('works');

  return (
    <FadeUp delay={index * 80}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        border: '1px solid rgba(92,225,230,0.14)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        marginBottom: '24px',
        transition: 'box-shadow 0.3s ease',
      }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 12px 40px rgba(92,225,230,0.09), 0 2px 8px rgba(0,0,0,0.04)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.04)'}
      >
        {/* Gold accent bar */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, #5ce1e6, #f0c040, transparent)' }} />

        <div style={{ padding: '28px 32px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
            <span style={{ fontSize: '1.6rem' }}>{feature.icon}</span>
            <h2 style={{
              fontWeight: 800, color: '#111827',
              fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)',
              letterSpacing: '-0.02em', margin: 0,
            }}>
              {feature.title}
            </h2>
          </div>

          {/* Description */}
          <p style={{ color: '#4b5563', fontSize: '0.925rem', lineHeight: 1.75, marginBottom: '24px' }}>
            {feature.description}
          </p>

          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {[
              { key: 'works', label: 'How it works' },
              { key: 'helps', label: 'How it helps you' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '7px 18px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: activeTab === tab.key ? 'none' : '1px solid rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: activeTab === tab.key
                    ? 'linear-gradient(135deg, #d4af37, #f0c040)'
                    : 'transparent',
                  color: activeTab === tab.key ? '#11245d' : '#6b7280',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{
            background: 'rgba(92,225,230,0.04)',
            borderRadius: '14px',
            padding: '20px 24px',
            border: '1px solid rgba(92,225,230,0.12)',
          }}>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '11px' }}>
              {(activeTab === 'works' ? feature.howItWorks : feature.howItHelps).map((point, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#5ce1e6', flexShrink: 0, marginTop: '7px',
                  }} />
                  <span style={{ color: '#374151', fontSize: '0.875rem', lineHeight: 1.7 }}>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Note (if any) */}
          {feature.note && (
            <p style={{
              marginTop: '14px',
              color: '#9ca3af', fontSize: '0.8rem', fontStyle: 'italic',
              padding: '10px 14px',
              background: 'rgba(0,0,0,0.02)',
              borderRadius: '8px',
              borderLeft: '2px solid rgba(92,225,230,0.3)',
            }}>
              Recommended Practice: {feature.note}
            </p>
          )}
        </div>
      </div>
    </FadeUp>
  );
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ overflowX: 'hidden' }}>
      <Navbar />

      {/* Page header */}
      <section className="relative py-24 px-4 text-center overflow-hidden" style={{
        background: 'linear-gradient(160deg, #0a1844 0%, #11245d 50%, #0a1844 100%)',
        color: 'white',
      }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(92,225,230,0.07) 0%, transparent 70%)',
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(92,225,230,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(92,225,230,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-block text-xs font-bold px-3.5 py-1.5 rounded-full mb-6 uppercase tracking-widest" style={{
            background: 'rgba(92,225,230,0.08)', color: '#f0c040',
            border: '1px solid rgba(92,225,230,0.2)',
          }}>
            Features
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-5" style={{ letterSpacing: '-0.02em' }}>
            Everything Your Institute Needs
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: 'rgba(200,215,255,0.7)', maxWidth: '560px', margin: '0 auto' }}>
            Four focused features that cover the core operational needs of any coaching centre or training institute.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4" style={{ background: '#f4f6ff' }}>
        <div className="max-w-3xl mx-auto">
          {features.map((feature, i) => (
            <FeatureSection key={feature.id} feature={feature} index={i} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center relative overflow-hidden" style={{
        background: 'linear-gradient(160deg, #0a1844 0%, #11245d 50%, #0a1844 100%)',
      }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 55% 55% at 50% 50%, rgba(92,225,230,0.07) 0%, transparent 70%)',
        }} />
        <FadeUp className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-5" style={{ letterSpacing: '-0.02em' }}>
            Ready to Start Using These Features?
          </h2>
          <p className="mb-10 text-base max-w-lg mx-auto leading-relaxed" style={{ color: 'rgba(200,215,255,0.65)' }}>
            Get started by telling us about your institute. We will take it from there.
          </p>
          <Link href="/get-started" className="inline-flex items-center gap-2.5 font-bold px-9 py-4 rounded-xl text-base"
            style={{
              background: 'linear-gradient(135deg, #d4af37 0%, #f0c040 50%, #d4af37 100%)',
              color: '#11245d',
              boxShadow: '0 0 36px rgba(92,225,230,0.32), 0 4px 20px rgba(0,0,0,0.3)',
              transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
              textDecoration: 'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}
          >
            Get Started →
          </Link>
        </FadeUp>
      </section>

      <Footer />
    </div>
  );
}