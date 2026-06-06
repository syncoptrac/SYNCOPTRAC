import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { FadeUp } from '../components/ui/ScrollReveal';

const sections = [
  {
    title: 'What Information We Collect',
    icon: '📋',
    content: [
      'When you submit the Get Started form, we may collect: Institute Name, Owner / Contact Name, Email Address, Institute Type, Number of Students, Phone Number (if provided), and any additional information included in your message.',
      'When your institute account is active, information entered into the system may include student records, attendance records, fee records, batch information, schedules, and enquiry records.',
    ],
  },
  {
    title: 'How We Use Information',
    icon: '🔍',
    content: [
      'Information submitted through the Get Started form is used to: review your request, contact you regarding onboarding and setup, provide information about our services, and configure and maintain your institute account.',
      'We do not sell institute data or use it for unrelated third-party marketing purposes.',
    ],
  },
  {
    title: 'Data Storage',
    icon: '🗄️',
    content: [
      'Institute operational data is stored in the Google Sheet connected to your institute account. The storage, availability, and security of that data are also subject to Google\'s services and policies.',
      'Information submitted through this website for onboarding, support, or account management may be stored and processed as required to operate and maintain the service.',
    ],
  },
  {
    title: 'Data Access & Ownership',
    icon: '🔐',
    content: [
      'Institutes retain ownership of the information they enter into the system.',
      'Access to institute data is restricted to authorised users of the respective institute and to SYNCOPTRAC personnel when reasonably required for setup, support, maintenance, troubleshooting, or operation of the service.',
    ],
  },
  {
    title: 'Email Communication',
    icon: '📧',
    content: [
      'The system may send automated emails on behalf of an institute for operational purposes such as attendance notifications and fee reminders.',
      'These communications are sent using the email configuration connected to the institute account and are intended only for recipients designated by the institute.',
    ],
  },
  {
    title: 'Third-Party Services',
    icon: '🔗',
    content: [
      'SYNCOPTRAC relies on third-party services, including Google Sheets and Gmail, to provide certain features of the platform.',
      'Use of these services is subject to the applicable terms, policies, and practices of the respective providers.',
    ],
  },
  {
    title: 'Account Closure & Data Requests',
    icon: '📁',
    content: [
      'Institutes may contact us regarding account closure or requests related to their information by emailing us at syncoptrac@gmail.com.',
      'We will review and process deletion requests within 7 working days of receiving the request.',
    ],
  },
  {
    title: 'Changes to This Policy',
    icon: '📝',
    content: [
      'This Privacy & Data Handling statement may be updated from time to time to reflect changes in the service, operational requirements, or legal obligations.',
      'The version published on this page represents the current policy.',
    ],
  },
  {
    title: 'Contact',
    icon: '💬',
    content: [
      'For any questions, concerns, or requests regarding privacy, data handling, or your account, please contact: syncoptrac@gmail.com',
      'We are committed to handling all privacy matters transparently and promptly.',
    ],
  },
];

export default function PrivacyPage() {
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
            Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4" style={{ letterSpacing: '-0.02em' }}>
            Privacy & Data Handling
          </h1>
          <p className="text-base" style={{ color: 'rgba(200,215,255,0.6)', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
            How SYNCOPTRAC collects, uses, and handles your institute's information.
          </p>
          <p style={{ color: 'rgba(200,215,255,0.35)', fontSize: '0.8rem', marginTop: '12px' }}>
            Last updated: May 2026
          </p>
        </div>
      </section>

      {/* Privacy sections */}
      <section className="py-16 px-4" style={{ background: '#f4f6ff', flex: 1 }}>
        <div className="max-w-2xl mx-auto">

          {/* Intro block */}
          <FadeUp>
            <div style={{
              background: 'white',
              borderRadius: '20px',
              border: '1px solid rgba(92,225,230,0.12)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              padding: '28px 32px',
              marginBottom: '24px',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ height: 3, background: 'linear-gradient(90deg, #5ce1e6, transparent)', position: 'absolute', top: 0, left: 0, right: 0 }} />
              <p style={{ color: '#374151', lineHeight: 1.8, fontSize: '0.925rem', margin: 0 }}>
                SYNCOPTRAC is built for coaching centres and training institutes. We understand that institute, student, and parent information is sensitive and should be handled responsibly. This page explains what information we collect, how it is used, and how it is handled within the system.
              </p>
            </div>
          </FadeUp>

          {/* Sections */}
          {sections.map((section, i) => (
            <FadeUp key={section.title} delay={i * 60}>
              <div style={{
                background: 'white',
                borderRadius: '18px',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
                padding: '24px 28px',
                marginBottom: '16px',
                transition: 'box-shadow 0.3s ease',
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.07)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 8px rgba(0,0,0,0.04)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '1.5rem' }}>{section.icon}</span>
                  <h2 style={{
                    fontWeight: 700, color: '#111827',
                    fontSize: '1rem', letterSpacing: '-0.01em', margin: 0,
                  }}>
                    {section.title}
                  </h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {section.content.map((para, j) => (
                    <p key={j} style={{ color: '#4b5563', fontSize: '0.875rem', lineHeight: 1.75, margin: 0 }}>
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            </FadeUp>
          ))}

          {/* Contact block */}
          <FadeUp delay={sections.length * 60}>
            <div style={{
              marginTop: '12px',
              background: 'rgba(92,225,230,0.04)',
              borderRadius: '16px',
              border: '1px solid rgba(92,225,230,0.14)',
              padding: '20px 24px',
              textAlign: 'center',
            }}>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                Questions about this policy?{' '}
                <a
                  href="mailto:syncoptrac@gmail.com"
                  style={{ color: '#5ce1e6', fontWeight: 600, textDecoration: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                  onMouseLeave={e => e.currentTarget.style.color = '#5ce1e6'}
                >
                  syncoptrac@gmail.com
                </a>
              </p>
            </div>
          </FadeUp>
        </div>
      </section>

      <Footer />
    </div>
  );
}