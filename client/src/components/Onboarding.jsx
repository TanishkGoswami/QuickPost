import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight, Check,
  Monitor, BarChart2, Wrench, Target, Bot, MoreHorizontal,
  User, Store, Building2, Briefcase, Megaphone, Heart,
  Zap
} from 'lucide-react';
import apiClient from '../utils/apiClient';
import logo from '/logo.png';

/* ── Platform data ── */
const PLATFORMS = [
  { id: 'instagram', label: 'Instagram',       icon: 'https://cdn.simpleicons.org/instagram/E4405F' },
  { id: 'facebook',  label: 'Facebook',         icon: 'https://cdn.simpleicons.org/facebook/1877F2' },
  { id: 'x',         label: 'X / Twitter',      icon: 'https://cdn.simpleicons.org/x/000000' },
  { id: 'linkedin',  label: 'LinkedIn',         icon: 'https://cdn.simpleicons.org/linkedin/0A66C2' },
  { id: 'tiktok',    label: 'TikTok',           icon: 'https://cdn.simpleicons.org/tiktok/000000' },
  { id: 'youtube',   label: 'YouTube',          icon: 'https://cdn.simpleicons.org/youtube/FF0000' },
  { id: 'pinterest', label: 'Pinterest',        icon: 'https://cdn.simpleicons.org/pinterest/BD081C' },
  { id: 'threads',   label: 'Threads',          icon: 'https://cdn.simpleicons.org/threads/000000' },
  { id: 'bluesky',   label: 'Bluesky',          icon: 'https://cdn.simpleicons.org/bluesky/0085FF' },
  { id: 'mastodon',  label: 'Mastodon',         icon: 'https://cdn.simpleicons.org/mastodon/6364FF' },
  { id: 'google',    label: 'Google Business',  icon: 'https://cdn.simpleicons.org/google/4285F4' },
];

/* ── Tools data ── */
const TOOLS = [
  { id: 'none',     label: 'I post directly to each platform',   sub: null,                                Icon: Monitor   },
  { id: 'meta',     label: 'Meta Business Suite',                 sub: null,                                Icon: BarChart2 },
  { id: 'smm',      label: 'Social Media Management tool',        sub: 'Hootsuite, Sprout Social, Later…',  Icon: Wrench    },
  { id: 'specific', label: 'Platform-specific tools',             sub: 'Typefully, Hypefury…',              Icon: Target    },
  { id: 'ai',       label: 'AI Platforms',                        sub: 'ChatGPT, Claude…',                  Icon: Bot       },
  { id: 'other',    label: 'Other',                               sub: null,                                Icon: MoreHorizontal },
];

/* ── User types ── */
const USER_TYPES = [
  { id: 'solo',      label: 'Solo creator',                    Icon: User        },
  { id: 'small_biz', label: 'Small business owner',            Icon: Store       },
  { id: 'marketing', label: 'Part of a marketing team',        Icon: Building2   },
  { id: 'freelance', label: 'Freelancer / consultant',         Icon: Briefcase   },
  { id: 'agency',    label: 'Marketing agency',                Icon: Megaphone   },
  { id: 'nonprofit', label: 'Non-profit organization',         Icon: Heart       },
  { id: 'other',     label: 'Other',                           Icon: MoreHorizontal },
];

const STEPS = [
  { num: 1, title: 'Your platforms',   desc: 'Which social channels do you want to manage with QuickPost?' },
  { num: 2, title: 'Your workflow',    desc: 'What tools are you currently using to manage social media?' },
  { num: 3, title: 'About you',        desc: 'Help us tailor your experience to your needs.' },
];

/* ── Left Panel ── */
function LeftPanel({ step }) {
  const s = STEPS[step - 1];
  return (
    <div className="hidden lg:flex flex-col justify-between w-80 xl:w-96 flex-shrink-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50 border-r border-gray-100 px-10 py-12">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <img src={logo} alt="QuickPost" className="h-7 w-7 object-contain" />
        <span className="text-base font-bold text-gray-900 tracking-tight">QuickPost</span>
      </div>

      {/* Step info */}
      <div>
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full mb-6 uppercase tracking-wider">
          Step {step} of 3
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-3 leading-tight">{s.title}</h2>
        <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>

        {/* Steps list */}
        <div className="mt-10 space-y-4">
          {STEPS.map(st => (
            <div key={st.num} className={`flex items-center gap-3 transition-all ${st.num === step ? 'opacity-100' : 'opacity-35'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 flex-shrink-0 ${
                st.num < step
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : st.num === step
                  ? 'border-indigo-600 text-indigo-600 bg-white'
                  : 'border-gray-300 text-gray-400 bg-white'
              }`}>
                {st.num < step ? <Check className="w-3.5 h-3.5" /> : st.num}
              </div>
              <span className={`text-sm font-semibold ${st.num === step ? 'text-gray-900' : 'text-gray-400'}`}>
                {st.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom hint */}
      <p className="text-xs text-gray-400">You can always update these later in settings.</p>
    </div>
  );
}

/* ── Progress bar (mobile) ── */
function MobileProgress({ step }) {
  return (
    <div className="lg:hidden px-6 pt-6 pb-2">
      <div className="flex items-center gap-2 mb-1">
        <img src={logo} alt="QuickPost" className="h-5 w-5 object-contain" />
        <span className="text-sm font-bold text-gray-900">QuickPost</span>
        <span className="ml-auto text-xs text-gray-400 font-medium">Step {step}/3</span>
      </div>
      <div className="h-1 bg-gray-100 rounded-full">
        <div
          className="h-1 bg-indigo-600 rounded-full transition-all duration-500"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>
    </div>
  );
}

/* ── Continue Button ── */
function ContinueBtn({ onClick, active, label = 'Continue' }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 h-12 px-8 rounded-xl font-bold text-sm transition-all duration-200 ${
        active
          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 hover:shadow-indigo-300 cursor-pointer'
          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
      }`}
    >
      {label} {active && <ArrowRight className="w-4 h-4" />}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════ */
export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [selectedTools, setSelectedTools]       = useState([]);
  const [selectedType, setSelectedType]         = useState(null);

  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  useEffect(() => {
    const check = async () => {
      try {
        const res = await apiClient.get('/api/onboarding');
        if (res.data.completed) {
          localStorage.setItem('qp_onboarding_done', 'true');
          navigate('/dashboard', { replace: true });
        }
      } catch {
        if (localStorage.getItem('qp_onboarding_done')) navigate('/dashboard', { replace: true });
      }
    };
    check();
  }, [navigate]);

  const finish = async (finalType = selectedType) => {
    try {
      await apiClient.post('/api/onboarding', {
        channels: selectedChannels, tools: selectedTools,
        user_type: finalType, completed: true,
      });
    } catch (e) {
      console.error('Onboarding save failed:', e);
    } finally {
      localStorage.setItem('qp_onboarding_done', 'true');
      navigate('/dashboard', { replace: true });
    }
  };

  const skip = () => finish(null);

  const toggleChannel = (id) =>
    setSelectedChannels(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const toggleTool = (id) =>
    setSelectedTools(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  /* ── WELCOME ── */
  if (step === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-100 rounded-full blur-3xl opacity-50 translate-x-1/3 translate-y-1/3" />

        {/* Floating platform icons */}
        <div className="absolute inset-0 pointer-events-none">
          {[
            { src: 'https://cdn.simpleicons.org/instagram/E4405F', style: { top:'15%', left:'8%',   opacity:0.2, width:40 } },
            { src: 'https://cdn.simpleicons.org/youtube/FF0000',   style: { top:'60%', left:'5%',   opacity:0.2, width:36 } },
            { src: 'https://cdn.simpleicons.org/x/000000',         style: { top:'30%', left:'18%',  opacity:0.15,width:28 } },
            { src: 'https://cdn.simpleicons.org/tiktok/000000',    style: { bottom:'20%',left:'14%',opacity:0.15,width:30 } },
            { src: 'https://cdn.simpleicons.org/bluesky/0085FF',   style: { top:'20%', right:'8%',  opacity:0.2, width:32 } },
            { src: 'https://cdn.simpleicons.org/pinterest/BD081C', style: { top:'55%', right:'5%',  opacity:0.2, width:36 } },
            { src: 'https://cdn.simpleicons.org/linkedin/0A66C2',  style: { bottom:'22%',right:'15%',opacity:0.15,width:30 } },
            { src: 'https://cdn.simpleicons.org/mastodon/6364FF',  style: { top:'42%', right:'20%', opacity:0.15,width:28 } },
          ].map((icon, i) => (
            <img key={i} src={icon.src} alt="" style={{ position:'absolute', ...icon.style, filter:'saturate(0.6)' }} />
          ))}
        </div>

        <div className="relative z-10 text-center px-6 max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-xl shadow-indigo-100 border border-gray-100 mb-8">
            <img src={logo} alt="QuickPost" className="w-9 h-9 object-contain" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
            Welcome, {firstName}
          </h1>
          <p className="text-gray-500 text-base mb-10 leading-relaxed">
            Let's get QuickPost set up for you. <br />It only takes a minute.
          </p>
          <button
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:shadow-indigo-300 hover:-translate-y-0.5"
          >
            Get started <ArrowRight className="w-4 h-4" />
          </button>
          <div className="mt-5">
            <button onClick={skip} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Skip setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── STEP 1: Social Channels ── */
  if (step === 1) {
    return (
      <div className="min-h-screen flex bg-white">
        <LeftPanel step={1} />
        <div className="flex-1 flex flex-col overflow-y-auto">
          <MobileProgress step={1} />
          <div className="flex-1 px-8 py-12 max-w-2xl mx-auto w-full">
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Which channels are you active on?</h1>
            <p className="text-sm text-gray-400 mb-8">Select all that apply. You can connect accounts after setup.</p>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-10">
              {PLATFORMS.map(p => {
                const sel = selectedChannels.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleChannel(p.id)}
                    className={`relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 bg-white transition-all hover:shadow-md ${
                      sel ? 'border-indigo-500 shadow-sm shadow-indigo-100 bg-indigo-50/30' : 'border-gray-100 shadow-sm'
                    }`}
                  >
                    {sel && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      </div>
                    )}
                    <img src={p.icon} alt={p.label} className="w-8 h-8 object-contain" />
                    <span className="text-[11px] font-semibold text-gray-700 text-center leading-tight">{p.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4">
              <ContinueBtn onClick={() => setStep(2)} active={selectedChannels.length > 0} />
              <button onClick={skip} className="text-sm text-gray-400 hover:text-gray-600 transition-colors font-medium">Skip</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── STEP 2: Tools ── */
  if (step === 2) {
    return (
      <div className="min-h-screen flex bg-white">
        <LeftPanel step={2} />
        <div className="flex-1 flex flex-col overflow-y-auto">
          <MobileProgress step={2} />
          <div className="flex-1 px-8 py-12 max-w-2xl mx-auto w-full">
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1">What's your current setup?</h1>
            <p className="text-sm text-gray-400 mb-8">Select all tools you currently use to manage social media.</p>

            <div className="space-y-3 mb-10">
              {TOOLS.map(t => {
                const sel = selectedTools.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => toggleTool(t.id)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all ${
                      sel ? 'border-indigo-500 bg-indigo-50/40' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      sel ? 'bg-indigo-600' : 'bg-gray-100'
                    }`}>
                      <t.Icon className={`w-5 h-5 ${sel ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{t.label}</p>
                      {t.sub && <p className="text-xs text-gray-400 mt-0.5">{t.sub}</p>}
                    </div>
                    <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      sel ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                    }`}>
                      {sel && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4">
              <ContinueBtn onClick={() => setStep(3)} active={selectedTools.length > 0} />
              <button onClick={skip} className="text-sm text-gray-400 hover:text-gray-600 transition-colors font-medium">Skip</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── STEP 3: User Type ── */
  return (
    <div className="min-h-screen flex bg-white">
      <LeftPanel step={3} />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <MobileProgress step={3} />
        <div className="flex-1 px-8 py-12 max-w-2xl mx-auto w-full">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">How would you describe yourself?</h1>
          <p className="text-sm text-gray-400 mb-8">Choose the option that best fits your role.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
            {USER_TYPES.map(u => {
              const sel = selectedType === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => setSelectedType(u.id)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all ${
                    sel ? 'border-indigo-500 bg-indigo-50/40' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    sel ? 'bg-indigo-600' : 'bg-gray-100'
                  }`}>
                    <u.Icon className={`w-5 h-5 ${sel ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <span className="text-sm font-bold text-gray-900">{u.label}</span>
                  {sel && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <ContinueBtn onClick={() => finish(selectedType)} active={!!selectedType} label="Finish setup" />
            <button onClick={skip} className="text-sm text-gray-400 hover:text-gray-600 transition-colors font-medium">Skip</button>
          </div>
        </div>
      </div>
    </div>
  );
}
