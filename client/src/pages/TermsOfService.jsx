import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LandingNav } from '../features/landing';
import { 
  ChevronRight, 
  Shield, 
  Lock, 
  FileText, 
  Mail, 
  AlertCircle,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Scale,
  UserCheck,
  Zap,
  Youtube,
  Info
} from 'lucide-react';

const SECTIONS = [
  { id: 'acceptance', title: '1. Acceptance', icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: 'service', title: '2. Service Description', icon: <Zap className="w-4 h-4" /> },
  { id: 'responsibilities', title: '3. User Responsibilities', icon: <UserCheck className="w-4 h-4" /> },
  { id: 'platforms', title: '4. API & Platform Terms', icon: <Youtube className="w-4 h-4" /> },
  { id: 'termination', title: '5. Account Termination', icon: <Trash2 className="w-4 h-4" /> },
  { id: 'liability', title: '6. Limitation of Liability', icon: <Scale className="w-4 h-4" /> },
  { id: 'contact', title: '7. Contact Us', icon: <Mail className="w-4 h-4" /> },
];

export default function TermsOfService() {
  const [activeSection, setActiveSection] = useState('acceptance');

  useEffect(() => {
    window.scrollTo(0, 0);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.2, rootMargin: '-10% 0px -70% 0px' }
    );

    SECTIONS.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <LandingNav />
      
      <main className="flex-grow container mx-auto px-4 md:px-6 py-12 lg:py-24 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          
          {/* Sidebar */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              <Link to="/" className="inline-flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline mb-4">
                ← Back to Home
              </Link>

              <nav className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <p className="px-4 py-3 text-[10px] uppercase tracking-widest font-black text-gray-400 bg-gray-50 border-b border-gray-200">Legal Contents</p>
                <div className="p-2 space-y-1">
                  {SECTIONS.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-[13px] font-bold transition-all ${
                        activeSection === section.id 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {section.title}
                    </button>
                  ))}
                </div>
              </nav>

              <div className="p-6 bg-gray-900 rounded-2xl text-white shadow-xl shadow-gray-200/50">
                <p className="text-xs font-bold text-blue-400 mb-2 uppercase tracking-wide">Legal Affairs</p>
                <p className="text-sm mb-4 text-gray-300">Need clarification on our terms? Our team is available.</p>
                <a href="mailto:0127cs211072@gmail.com" className="block text-center bg-white text-gray-900 text-xs font-black py-3 rounded-xl hover:bg-blue-50 transition-colors">
                  Contact Legal
                </a>
              </div>
            </div>
          </aside>

          {/* Content */}
          <article className="flex-1 bg-white border border-gray-200 rounded-[2.5rem] shadow-xl shadow-gray-200/40 p-8 md:p-16 lg:p-20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
            
            <header className="mb-16 border-b border-gray-100 pb-12 relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200">QP</div>
                <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">Service Terms</div>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">Terms of Service</h1>
              <p className="text-gray-500 font-medium flex items-center gap-2 text-sm italic">
                <RefreshCw className="w-3 h-3" />
                Last updated: <span className="text-gray-900 font-bold not-italic">April 18, 2026</span>
              </p>
            </header>

            <div className="space-y-16 relative z-10">
              
              <section id="acceptance" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">1. Acceptance of Terms</h2>
                </div>
                <div className="text-gray-700 leading-relaxed space-y-4 font-medium">
                  <p>By accessing or using <strong>QuickPost</strong>, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, you are prohibited from using the service.</p>
                  <p>We reserve the right to modify these terms at any time. Your continued use of the service after changes are posted constitutes your acceptance of the new terms.</p>
                </div>
              </section>

              <section id="service" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">2. Service Description</h2>
                </div>
                <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100 italic font-medium text-gray-600">
                   "QuickPost provides a unified platform for multi-channel social media broadcasting, automation, and management across supported platforms including YouTube, Meta, Pinterest, and Bluesky."
                </div>
              </section>

              <section id="responsibilities" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">3. User Responsibilities</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { title: 'Account Security', desc: 'Maintaining the confidentiality of your login credentials.' },
                    { title: 'Content Legality', desc: 'Ensuring broadcasted content complies with all applicable laws.' },
                    { title: 'API Compliance', desc: 'Following the terms of connected third-party social platforms.' },
                    { title: 'Authorized Use', desc: 'Not using the service for spam or unauthorized automation.' }
                  ].map((item, i) => (
                    <div key={i} className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
                      <h3 className="font-black text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-500 font-medium">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section id="platforms" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Youtube className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">4. API & Platform Terms</h2>
                </div>
                <p className="text-gray-700 font-medium mb-8">QuickPost integrates with third-party APIs. By using these integrations, you agree to their respective terms:</p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-6 bg-red-50/30 rounded-2xl border border-red-100">
                    <Info className="w-5 h-5 text-red-600 mt-1" />
                    <p className="text-gray-700 text-sm font-bold leading-relaxed">
                      <strong>YouTube:</strong> By using YouTube broadcasting, you agree to the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-red-600 underline">YouTube Terms of Service</a>.
                    </p>
                  </div>
                  <div className="flex items-start gap-4 p-6 bg-blue-50/30 rounded-2xl border border-blue-100">
                    <Info className="w-5 h-5 text-blue-600 mt-1" />
                    <p className="text-gray-700 text-sm font-bold leading-relaxed">
                      <strong>Meta:</strong> Access to Facebook and Instagram is subject to <a href="https://www.facebook.com/terms.php" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Meta's Terms</a> and Developer Policies.
                    </p>
                  </div>
                </div>
              </section>

              <section id="termination" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">5. Account Termination</h2>
                </div>
                <div className="p-8 bg-gray-900 rounded-[2rem] text-white">
                  <p className="text-gray-300 font-medium leading-relaxed mb-6">
                    We reserve the right to suspend or terminate your access to QuickPost at any time, without notice, for conduct that we believe violates these Terms or is harmful to our business interests.
                  </p>
                  <div className="flex items-center gap-2 text-red-400 font-black text-xs uppercase tracking-widest">
                    <AlertCircle className="w-4 h-4" /> Policy Enforcement active
                  </div>
                </div>
              </section>

              <section id="liability" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Scale className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">6. Limitation of Liability</h2>
                </div>
                <p className="text-gray-700 font-bold leading-relaxed p-8 border border-gray-100 rounded-3xl bg-gray-50/50">
                  QuickPost shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or the inability to use the service, including but not limited to damages for loss of profits or data.
                </p>
              </section>

              <section id="contact" className="scroll-mt-32 pt-12 border-t border-gray-100">
                <div className="bg-blue-600 rounded-[2.5rem] p-12 text-center text-white shadow-2xl shadow-blue-200">
                  <h2 className="text-3xl font-black mb-6">Legal Questions?</h2>
                  <p className="text-blue-100 font-medium mb-10 max-w-lg mx-auto">
                    If you have any questions regarding these terms, please reach out to our legal department.
                  </p>
                  <a href="mailto:0127cs211072@gmail.com" className="inline-flex items-center gap-3 px-12 py-5 bg-white text-blue-600 font-black rounded-2xl hover:bg-blue-50 transition-all shadow-xl">
                    <Mail className="w-5 h-5" />
                    Contact Legal
                  </a>
                </div>
              </section>

            </div>
          </article>
        </div>
      </main>

      <footer className="bg-white py-12 border-t border-gray-100 mt-auto">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-gray-900 font-black text-lg">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs">QP</div>
            QuickPost
          </div>
          <div className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
            © 2026 QuickPost - LEGAL COMPLIANCE SYSTEM
          </div>
          <div className="flex gap-6">
             <Link to="/terms" className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Terms</Link>
             <Link to="/privacy" className="text-[10px] font-bold text-gray-400 hover:text-blue-600 uppercase tracking-widest">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
