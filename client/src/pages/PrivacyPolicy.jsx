import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LandingNav } from '../features/landing';
import { 
  ChevronRight, 
  Shield, 
  Lock, 
  Eye, 
  FileText, 
  ExternalLink, 
  Mail, 
  AlertCircle,
  Delete,
  UserCheck,
  Facebook,
  Youtube,
  Share2,
  Image as ImageIcon
} from 'lucide-react';

const SECTIONS = [
  { id: 'introduction', title: '1. Introduction', icon: <Shield className="w-4 h-4" /> },
  { id: 'collection', title: '2. Information Collection', icon: <Eye className="w-4 h-4" /> },
  { id: 'usage', title: '3. Data Usage', icon: <FileText className="w-4 h-4" /> },
  { id: 'platforms', title: '4. Platform Specifics', icon: <Share2 className="w-4 h-4" /> },
  { id: 'deletion', title: '5. Data Deletion', icon: <Delete className="w-4 h-4" /> },
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
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <LandingNav />
      
      <main className="flex-grow container mx-auto px-4 md:px-6 py-12 lg:py-24 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          
          {/* Sidebar */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              <Link to="/" className="inline-flex items-center gap-2 text-violet-600 font-bold text-sm hover:underline mb-4">
                ← Back to Home
              </Link>

              <nav className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                <p className="px-4 py-3 text-[10px] uppercase tracking-widest font-black text-gray-400 bg-gray-100 border-b border-gray-200">Contents</p>
                <div className="p-2 space-y-1">
                  {SECTIONS.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-[13px] font-bold transition-all ${
                        activeSection === section.id 
                          ? 'bg-violet-600 text-white shadow-md' 
                          : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {section.title}
                    </button>
                  ))}
                </div>
              </nav>

              <div className="p-6 bg-gray-900 rounded-2xl text-white">
                <p className="text-xs font-bold text-violet-400 mb-2 uppercase">Support</p>
                <p className="text-sm mb-4">Questions? Contact our legal team.</p>
                <a href="mailto:support@quickpost.app" className="block text-center bg-white text-gray-900 text-xs font-black py-3 rounded-xl hover:bg-violet-50 transition-colors">
                  Contact Us
                </a>
              </div>
            </div>
          </aside>

          {/* Content */}
          <article className="flex-1 bg-white border border-gray-200 rounded-[2rem] shadow-sm p-8 md:p-16">
            <header className="mb-16 border-b border-gray-100 pb-12">
              <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">Privacy Policy</h1>
              <p className="text-gray-500 font-medium">Last updated: <span className="text-gray-900 font-bold">April 18, 2026</span></p>
            </header>

            <div className="space-y-16">
              
              <section id="introduction" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="text-violet-600 w-6 h-6" />
                  <h2 className="text-2xl font-black text-gray-900">1. Introduction</h2>
                </div>
                <div className="text-gray-800 leading-relaxed space-y-4 font-medium">
                  <p>Welcome to <strong>QuickPost</strong>. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us.</p>
                  <p>When you visit our website and use any of our services, you trust us with your personal information. We take your privacy very seriously.</p>
                </div>
              </section>

              <section id="collection" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <Eye className="text-orange-600 w-6 h-6" />
                  <h2 className="text-2xl font-black text-gray-900">2. Information Collection</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-2 font-black">Personal Info</h3>
                    <p className="text-sm text-gray-700">Name, email, and social profile visuals for personalization.</p>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-2 font-black">OAuth Tokens</h3>
                    <p className="text-sm text-gray-700">Encrypted authentication tokens for cross-platform access.</p>
                  </div>
                </div>
              </section>

              <section id="usage" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="text-blue-600 w-6 h-6" />
                  <h2 className="text-2xl font-black text-gray-900">3. Data Usage</h2>
                </div>
                <p className="text-gray-800 font-medium mb-6">We use your information for strictly functional purposes:</p>
                <ul className="space-y-3">
                  {['Authenticate accounts', 'Post media to APIs', 'Monitor post status', 'Support requests'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-700 font-bold bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <ChevronRight className="w-4 h-4 text-violet-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section id="platforms" className="scroll-mt-32 space-y-8">
                <div className="flex items-center gap-3 mb-2">
                  <Share2 className="text-indigo-600 w-6 h-6" />
                  <h2 className="text-2xl font-black text-gray-900">4. Platform Specifics</h2>
                </div>
                
                <div className="p-6 border-2 border-red-50 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-red-600 font-black text-xs uppercase tracking-widest"><Youtube className="w-4 h-4" /> Google & YouTube</div>
                  <p className="text-gray-800 text-sm font-bold">QuickPost uses YouTube API Services. By using our tool, you agree to the Google Privacy Policy and YouTube Terms of Service.</p>
                </div>

                <div className="p-6 border-2 border-blue-50 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest"><Facebook className="w-4 h-4" /> Meta (Facebook/IG/Threads)</div>
                  <p className="text-gray-800 text-sm font-bold">We comply with Meta Platform Policies. Access is limited to tokens specifically granted by your authorization.</p>
                </div>

                <div className="p-6 border-2 border-red-50 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-red-500 font-black text-xs uppercase tracking-widest"><ImageIcon className="w-4 h-4" /> Pinterest</div>
                  <p className="text-gray-800 text-sm font-bold">We use Pinterest API to automate board Pinning. We do not sell or share Pinterest data. Subject to Pinterest's TOS and Privacy Policy.</p>
                </div>
              </section>

              <section id="deletion" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <Delete className="text-red-600 w-6 h-6" />
                  <h2 className="text-2xl font-black text-gray-900">5. Data Deletion</h2>
                </div>
                <div className="p-8 bg-red-50 border border-red-200 rounded-3xl">
                  <p className="font-black text-red-700 mb-4">How to delete your data:</p>
                  <ul className="list-disc pl-5 space-y-2 text-gray-800 font-bold text-sm">
                    <li>Disconnect platforms via the Sidebar Dashboard.</li>
                    <li>Email support@quickpost.app for full account deletion.</li>
                  </ul>
                </div>
              </section>

              <section id="security" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <Lock className="text-green-600 w-6 h-6" />
                  <h2 className="text-2xl font-black text-gray-900">6. Data Security</h2>
                </div>
                <p className="text-gray-800 font-bold leading-relaxed">We use AES-256 encryption for all stored tokens and secure socket layers for all communications. Your security is our highest priority.</p>
              </section>

              <section id="rights" className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6">
                  <UserCheck className="text-violet-600 w-6 h-6" />
                  <h2 className="text-2xl font-black text-gray-900">7. Your Rights</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Access', 'Correction', 'Deletion', 'Portability'].map(r => (
                    <span key={r} className="px-4 py-2 bg-gray-100 rounded-full text-xs font-black text-gray-600 border border-gray-200">{r}</span>
                  ))}
                </div>
              </section>

              <section id="contact" className="scroll-mt-32 pt-12 border-t border-gray-100">
                <h2 className="text-3xl font-black text-gray-900 mb-6">Questions?</h2>
                <a href="mailto:support@quickpost.app" className="inline-block px-10 py-4 bg-violet-600 text-white font-black rounded-2xl hover:bg-violet-700 shadow-lg shadow-violet-200">
                  Email Support
                </a>
              </section>

            </div>
          </article>
        </div>
      </main>

      <footer className="bg-gray-50 py-12 border-t border-gray-200 mt-auto">
        <div className="container mx-auto px-6 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
          © 2026 QuickPost - Professional Content Broadcasting
        </div>
      </footer>
    </div>
  );
}
