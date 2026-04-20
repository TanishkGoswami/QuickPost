import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Check } from 'lucide-react';
import apiClient from '../utils/apiClient';

/* ── Floating social icons for welcome screen ── */
const FLOAT_ICONS = [
  { src: 'https://cdn.simpleicons.org/youtube/FF0000',   style: { top: '18%',  left: '6%',   opacity: 0.35, width: 36 } },
  { src: 'https://cdn.simpleicons.org/x/000000',        style: { top: '35%',  left: '14%',  opacity: 0.30, width: 28 } },
  { src: 'https://cdn.simpleicons.org/instagram/E4405F',style: { top: '65%',  left: '8%',   opacity: 0.35, width: 32 } },
  { src: 'https://cdn.simpleicons.org/pinterest/BD081C',style: { top: '80%',  left: '90%',  opacity: 0.35, width: 34 } },
  { src: 'https://cdn.simpleicons.org/bluesky/0085FF',  style: { top: '25%',  right: '8%',  opacity: 0.30, width: 30 } },
  { src: 'https://cdn.simpleicons.org/mastodon/6364FF', style: { top: '55%',  right: '12%', opacity: 0.30, width: 32 } },
  { src: 'https://cdn.simpleicons.org/tiktok/000000',   style: { bottom:'18%',left: '18%',  opacity: 0.25, width: 28 } },
  { src: 'https://cdn.simpleicons.org/linkedin/0A66C2', style: { bottom:'30%',right: '20%', opacity: 0.25, width: 28 } },
];

/* ── Platform data ── */
const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: 'https://cdn.simpleicons.org/instagram/E4405F' },
  { id: 'facebook',  label: 'Facebook',  icon: 'https://cdn.simpleicons.org/facebook/1877F2' },
  { id: 'x',         label: 'Twitter / X', icon: 'https://cdn.simpleicons.org/x/000000' },
  { id: 'linkedin',  label: 'LinkedIn',  icon: 'https://cdn.simpleicons.org/linkedin/0A66C2' },
  { id: 'tiktok',    label: 'TikTok',    icon: 'https://cdn.simpleicons.org/tiktok/000000' },
  { id: 'youtube',   label: 'YouTube',   icon: 'https://cdn.simpleicons.org/youtube/FF0000' },
  { id: 'pinterest', label: 'Pinterest', icon: 'https://cdn.simpleicons.org/pinterest/BD081C' },
  { id: 'threads',   label: 'Threads',   icon: 'https://cdn.simpleicons.org/threads/000000' },
  { id: 'bluesky',   label: 'Bluesky',   icon: 'https://cdn.simpleicons.org/bluesky/0085FF' },
  { id: 'mastodon',  label: 'Mastodon',  icon: 'https://cdn.simpleicons.org/mastodon/6364FF' },
  { id: 'google',    label: 'Google Business', icon: 'https://cdn.simpleicons.org/google/4285F4' },
];

/* ── Tools data ── */
const TOOLS = [
  { id: 'none',     label: 'None – I post to social platforms directly', sub: null,                          emoji: '🖥️', bg: '#EDE9FF' },
  { id: 'meta',     label: 'Meta Business Suite',                        sub: null,                          emoji: '🔵', bg: '#E8F0FF' },
  { id: 'smm',      label: 'An existing Social Media Management tool',   sub: 'e.g. Hootsuite, Sprout Social, Later', emoji: '🔧', bg: '#E8FFF0' },
  { id: 'specific', label: 'Tools that focus on specific social platform(s)', sub: 'e.g. Typefully, Hypefury', emoji: '🎯', bg: '#FFF3E8' },
  { id: 'ai',       label: 'AI Platforms',                               sub: 'ChatGPT/Claude/etc.',         emoji: '🤖', bg: '#FFF0F5' },
  { id: 'other',    label: 'Other',                                      sub: null,                          emoji: '✨', bg: '#FFF8E8' },
];

/* ── User types ── */
const USER_TYPES = [
  { id: 'solo',      label: 'Solo creator',                  emoji: '🔥' },
  { id: 'small_biz', label: 'Small business owner',          emoji: '🤝' },
  { id: 'marketing', label: 'Part of a company marketing team', emoji: '🎨' },
  { id: 'freelance', label: 'Freelancer/consultant',         emoji: '⭐' },
  { id: 'agency',    label: 'Marketing agency',              emoji: '🎯' },
  { id: 'nonprofit', label: 'Non-profit organization',       emoji: '💝' },
  { id: 'other',     label: 'Other',                         emoji: '🦄' },
];

/* ── Step indicator ── */
function StepDots({ current, total }) {
  return (
    <div className="flex items-center gap-2 mb-10">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`rounded-full transition-all duration-300 ${
          i === current ? 'w-6 h-2 bg-green-500' : i < current ? 'w-2 h-2 bg-green-300' : 'w-2 h-2 bg-gray-200'
        }`} />
      ))}
    </div>
  );
}

/* ── Continue button ── */
function ContinueBtn({ onClick, disabled, active }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 w-72 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
        active
          ? 'bg-green-400 hover:bg-green-500 text-white shadow-md shadow-green-200 cursor-pointer'
          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
      }`}
    >
      Continue <ArrowRight className="w-4 h-4" />
    </button>
  );
}

/* ═══════════════════════════════════════════════════════ */
export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0=welcome, 1=channels, 2=tools, 3=usertype

  // Step 1 state
  const [selectedChannels, setSelectedChannels] = useState([]);
  // Step 2 state
  const [selectedTools, setSelectedTools] = useState([]);
  // Step 3 state
  const [selectedType, setSelectedType] = useState(null);

  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  // Check DB on mount — if already completed, skip to dashboard
  useEffect(() => {
    const check = async () => {
      try {
        const res = await apiClient.get('/api/onboarding');
        if (res.data.completed) {
          localStorage.setItem('qp_onboarding_done', 'true');
          navigate('/dashboard', { replace: true });
        }
      } catch (e) {
        // If API fails, fall back to localStorage
        if (localStorage.getItem('qp_onboarding_done')) {
          navigate('/dashboard', { replace: true });
        }
      }
    };
    check();
  }, [navigate]);

  const finish = async (finalType = selectedType) => {
    try {
      await apiClient.post('/api/onboarding', {
        channels:  selectedChannels,
        tools:     selectedTools,
        user_type: finalType,
        completed: true,
      });
    } catch (e) {
      console.error('Failed to save onboarding:', e);
    } finally {
      localStorage.setItem('qp_onboarding_done', 'true');
      navigate('/dashboard', { replace: true });
    }
  };

  const skip = () => finish(null);

  const toggleChannel = (id) =>
    setSelectedChannels(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleTool = (id) =>
    setSelectedTools(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  /* ── WELCOME ── */
  if (step === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#F5F2ED' }}>
        {FLOAT_ICONS.map((icon, i) => (
          <img key={i} src={icon.src} alt="" style={{ position: 'absolute', ...icon.style, pointerEvents: 'none', filter: 'grayscale(20%)' }} />
        ))}
        <div className="text-center z-10 px-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Hey there {firstName} 👋
          </h1>
          <p className="text-2xl font-bold text-gray-900 mb-8">Welcome to QuickPost</p>
          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-2 mx-auto bg-green-400 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-xl shadow-md shadow-green-200 transition-all"
          >
            Let's start <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  /* ── STEP 1: Social Channels ── */
  if (step === 1) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#F5F2ED' }}>
        <StepDots current={0} total={3} />
        <h1 className="text-2xl font-bold text-gray-900 mb-10 text-center">
          What social channel(s) are in focus?
        </h1>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 mb-10 max-w-3xl w-full justify-items-center">
          {PLATFORMS.map(p => {
            const sel = selectedChannels.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleChannel(p.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 bg-white transition-all w-24 h-24 justify-center hover:shadow-md ${
                  sel ? 'border-gray-800 shadow-md' : 'border-transparent shadow-sm'
                }`}
              >
                <img src={p.icon} alt={p.label} className="w-9 h-9 object-contain" />
                <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">{p.label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-col items-center gap-3">
          <ContinueBtn onClick={() => setStep(2)} active={selectedChannels.length > 0} disabled={false} />
          <button onClick={skip} className="text-sm font-semibold text-gray-500 hover:text-gray-700 underline-offset-2 hover:underline">Skip</button>
        </div>
      </div>
    );
  }

  /* ── STEP 2: Tools ── */
  if (step === 2) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#F5F2ED' }}>
        <StepDots current={1} total={3} />
        <h1 className="text-2xl font-bold text-gray-900 mb-10 text-center max-w-sm">
          What tools do you use to manage your social media?
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10 w-full max-w-xl">
          {TOOLS.map(t => {
            const sel = selectedTools.includes(t.id);
            return (
              <button
                key={t.id}
                onClick={() => toggleTool(t.id)}
                className={`flex items-start gap-3 p-4 rounded-2xl bg-white border-2 text-left transition-all hover:shadow-md ${
                  sel ? 'border-gray-800' : 'border-transparent shadow-sm'
                }`}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: t.bg }}>
                  {t.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 leading-snug">{t.label}</p>
                  {t.sub && <p className="text-xs text-gray-400 mt-0.5">{t.sub}</p>}
                </div>
                <div className={`w-4 h-4 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                  sel ? 'bg-gray-800 border-gray-800' : 'border-gray-300'
                }`}>
                  {sel && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex flex-col items-center gap-3">
          <ContinueBtn onClick={() => setStep(3)} active={selectedTools.length > 0} disabled={false} />
          <button onClick={skip} className="text-sm font-semibold text-gray-500 hover:text-gray-700 underline-offset-2 hover:underline">Skip</button>
        </div>
      </div>
    );
  }

  /* ── STEP 3: User Type ── */
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#F5F2ED' }}>
      <StepDots current={2} total={3} />
      <h1 className="text-2xl font-bold text-gray-900 mb-10 text-center">
        How would you describe yourself?
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10 w-full max-w-xl">
        {USER_TYPES.map(u => {
          const sel = selectedType === u.id;
          return (
            <button
              key={u.id}
              onClick={() => setSelectedType(u.id)}
              className={`flex items-center gap-3 p-4 rounded-2xl bg-white border-2 text-left transition-all hover:shadow-md ${
                sel ? 'border-gray-800 shadow-md' : 'border-transparent shadow-sm'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">
                {u.emoji}
              </div>
              <span className="text-sm font-semibold text-gray-800">{u.label}</span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-col items-center gap-3">
        <ContinueBtn onClick={() => finish(selectedType)} active={!!selectedType} disabled={false} />
        <button onClick={skip} className="text-sm font-semibold text-gray-500 hover:text-gray-700 underline-offset-2 hover:underline">Skip</button>
      </div>
    </div>
  );
}
