import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LandingNav } from '../features/landing';
import logo from '/logo.png';
import {
  ChevronRight,
  Shield,
  Lock,
  Eye,
  FileText,
  ExternalLink,
  Mail,
  AlertCircle,
  Trash2,
  UserCheck,
  Facebook,
  Youtube,
  Share2,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink as ExternalLinkIcon,
  RefreshCw
} from 'lucide-react';

const SECTIONS = [
  { id: 'introduction', title: '1. Introduction', icon: <Shield className="w-4 h-4" /> },
  { id: 'collection', title: '2. Information Collection', icon: <Eye className="w-4 h-4" /> },
  { id: 'usage', title: '3. Data Usage', icon: <FileText className="w-4 h-4" /> },
  { id: 'platforms', title: '4. Platform Specifics', icon: <Share2 className="w-4 h-4" /> },
  { id: 'deletion', title: '5. Data Deletion', icon: <Trash2 className="w-4 h-4" /> },
  { id: 'security', title: '6. Data Security', icon: <Lock className="w-4 h-4" /> },
  { id: 'rights', title: '7. Your Rights', icon: <UserCheck className="w-4 h-4" /> },
  { id: 'contact', title: '8. Contact Us', icon: <Mail className="w-4 h-4" /> },
];

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState('introduction');

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
                <p className="px-4 py-3 text-[10px] uppercase tracking-widest font-black text-gray-400 bg-gray-50 border-b border-gray-200">Contents</p>
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
                <p className="text-xs font-bold text-blue-400 mb-2 uppercase tracking-wide">Support</p>
                <p className="text-sm mb-4 text-gray-300">Questions? Contact our legal team for assistance.</p>
                <a href="mailto:0127cs211072@gmail.com" className="block text-center bg-white text-gray-900 text-xs font-black py-3 rounded-xl hover:bg-blue-50 transition-colors">
                  Contact Us
                </a>
              </div>
            </div>
          </aside>

          {/* Content */}
          <article className="flex-1 bg-white border border-gray-200 rounded-[2.5rem] shadow-xl shadow-gray-200/40 p-8 md:p-16 lg:p-20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>

            <header className="mb-16 border-b border-gray-100 pb-12 relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <img src={logo} alt="QuickPost" className="w-12 h-12 object-contain" />
                <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">Privacy First</div>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">Privacy Policy</h1>
              <p className="text-gray-500 font-medium flex items-center gap-2 text-sm italic">
                <RefreshCw className="w-3 h-3" />
                Last updated: <span className="text-gray-900 font-bold not-italic">December 29, 2025</span>
              </p>
            </header>

            <div className="space-y-16 relative z-10">

              <section id="introduction" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">1. Introduction</h2>
                </div>
                <div className="text-gray-700 leading-relaxed space-y-4 font-medium">
                  <p>Welcome to <strong>QuickPost</strong>. We are a social publishing tool that allows you to connect your social media accounts and broadcast content. We are committed to protecting your personal information and your right to privacy.</p>
                  <p>When you visit our website and use our services, you trust us with your personal information. This privacy policy describes what information we collect, how we use it, and what rights you have in relation to it.</p>
                </div>
              </section>

              <section id="collection" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Eye className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">2. Information Collection</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 transition-hover hover:border-blue-200 hover:bg-blue-50/30 group">
                    <h3 className="font-black text-gray-900 mb-3 flex items-center gap-2">
                       <CheckCircle2 className="w-4 h-4 text-blue-600" />
                       Account Identity
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">We store your Email, Name, and unique User ID provided by authentication services for account management.</p>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 transition-hover hover:border-blue-200 hover:bg-blue-50/30 group">
                    <h3 className="font-black text-gray-900 mb-3 flex items-center gap-2">
                       <CheckCircle2 className="w-4 h-4 text-blue-600" />
                       OAuth Tokens
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">Secure access and refresh tokens for connected social platforms to allow automated posting on your behalf.</p>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 transition-hover hover:border-blue-200 hover:bg-blue-50/30 group">
                    <h3 className="font-black text-gray-900 mb-3 flex items-center gap-2">
                       <CheckCircle2 className="w-4 h-4 text-blue-600" />
                       Content Data
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">Captions, images, videos, and page IDs required to facilitate broadcasting to your selected social channels.</p>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 transition-hover hover:border-blue-200 hover:bg-blue-50/30 group">
                    <h3 className="font-black text-gray-900 mb-3 flex items-center gap-2">
                       <CheckCircle2 className="w-4 h-4 text-blue-600" />
                       Diagnostics
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">Error logs and timestamps to ensure service reliability and debug application issues.</p>
                  </div>
                </div>
              </section>

              <section id="usage" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">3. Data Usage</h2>
                </div>
                <p className="text-gray-700 font-medium mb-8">We utilize the collected information strictly for service operations:</p>
                <div className="space-y-4">
                  {[
                    'Authenticating your sessions and maintaining account security.',
                    'Posting media and text content to third-party social APIs.',
                    'Monitoring post performance and broadcasting status.',
                    'Responding to support queries and technical issues.'
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-white text-[10px] font-black mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-gray-700 font-bold text-sm leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section id="platforms" className="scroll-mt-32 space-y-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">4. Platform Specifics</h2>
                </div>

                <div className="space-y-6">
                  <div className="p-8 border border-blue-100 bg-blue-50/20 rounded-[2rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Youtube className="w-12 h-12" />
                    </div>
                    <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest mb-4">
                      <Youtube className="w-4 h-4" /> Google & YouTube
                    </div>
                    <p className="text-gray-700 text-sm font-bold leading-relaxed relative z-10">
                      QuickPost uses YouTube API Services. By using our tool, you agree to the <a href="https://policies.google.com/privacy" className="text-blue-600 underline">Google Privacy Policy</a> and <a href="https://www.youtube.com/t/terms" className="text-blue-600 underline">YouTube Terms of Service</a>. We only access data you explicitly grant during authorization.
                    </p>
                  </div>

                  <div className="p-8 border border-indigo-100 bg-indigo-50/20 rounded-[2rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Facebook className="w-12 h-12" />
                    </div>
                    <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest mb-4">
                      <Facebook className="w-4 h-4" /> Meta (Facebook/Instagram/Threads)
                    </div>
                    <p className="text-gray-700 text-sm font-bold leading-relaxed relative z-10">
                      We comply strictly with Meta Platform Policies. Access is limited to tokens specifically granted for publishing and managing pages/accounts linked to your workspace.
                    </p>
                  </div>

                  <div className="p-8 border border-red-100 bg-red-50/20 rounded-[2rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                    <div className="flex items-center gap-2 text-red-600 font-black text-xs uppercase tracking-widest mb-4">
                      <ImageIcon className="w-4 h-4" /> Pinterest & Others
                    </div>
                    <p className="text-gray-700 text-sm font-bold leading-relaxed relative z-10">
                      We use official APIs for Pinterest and Bluesky to automate content delivery. No data is sold or shared with external parties beyond what is required for the integration to function.
                    </p>
                  </div>
                </div>
              </section>

              <section id="deletion" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">5. Data Deletion</h2>
                </div>
                <div className="p-10 bg-gray-900 rounded-[2.5rem] text-white relative overflow-hidden">
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-red-600/20 rounded-full blur-3xl"></div>
                  <p className="font-black text-xl mb-6 flex items-center gap-2">
                    <AlertCircle className="text-red-400" />
                    Right to be forgotten
                  </p>
                  <p className="text-gray-300 font-medium mb-8 leading-relaxed">
                    You have full control over your data. You can disconnect any platform or request full account deletion at any time.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 p-6 bg-white/5 border border-white/10 rounded-2xl">
                      <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2">Option 1</p>
                      <p className="text-sm font-bold">Disconnect accounts via the Dashboard.</p>
                    </div>
                    <div className="flex-1 p-6 bg-white/5 border border-white/10 rounded-2xl">
                      <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2">Option 2</p>
                      <p className="text-sm font-bold">Email <a href="mailto:0127cs211072@gmail.com" className="text-blue-400 hover:underline">0127cs211072@gmail.com</a> for full deletion.</p>
                    </div>
                  </div>
                </div>
              </section>

              <section id="security" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">6. Data Security</h2>
                </div>
                <div className="p-8 border-2 border-dashed border-gray-100 rounded-3xl">
                  <p className="text-gray-700 font-bold leading-relaxed">
                    We implement industry-standard security measures, including <strong>AES-256 encryption</strong> for all OAuth tokens and secure HTTPS communication for all data transfers. Access to our internal database is strictly limited and audited.
                  </p>
                </div>
              </section>

              <section id="rights" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">7. Your Rights</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  {['Access Info', 'Correct Errors', 'Request Deletion', 'Data Portability', 'Withdraw Consent'].map(r => (
                    <div key={r} className="px-6 py-3 bg-white border border-gray-200 rounded-full text-xs font-black text-gray-700 shadow-sm flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-blue-600" />
                      {r}
                    </div>
                  ))}
                </div>
              </section>

              <section id="contact" className="scroll-mt-32 pt-12 border-t border-gray-100">
                <div className="bg-blue-600 rounded-[2.5rem] p-12 text-center text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent"></div>
                  <h2 className="text-3xl md:text-4xl font-black mb-6 relative z-10">Have more questions?</h2>
                  <p className="text-blue-100 font-medium mb-10 max-w-lg mx-auto relative z-10">
                    Our team is here to help you understand how we protect your data. Reach out to us anytime.
                  </p>
                  <a href="mailto:0127cs211072@gmail.com" className="inline-flex items-center gap-3 px-12 py-5 bg-white text-blue-600 font-black rounded-2xl hover:bg-blue-50 transition-all shadow-xl hover:-translate-y-1 relative z-10">
                    <Mail className="w-5 h-5" />
                    Shoot an Email
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
            <img src={logo} alt="QuickPost" className="w-8 h-8 object-contain" />
            QuickPost
          </div>
          <div className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
            © 2026 QuickPost - SECURE BROADCASTING SYSTEM
          </div>
          <div className="flex gap-6">
             <Link to="/terms" className="text-[10px] font-bold text-gray-400 hover:text-blue-600 uppercase tracking-widest">Terms</Link>
             <Link to="/privacy" className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
