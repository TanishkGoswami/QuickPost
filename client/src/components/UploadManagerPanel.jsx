import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, ChevronDown, X, RefreshCw, 
  CheckCircle2, AlertCircle, Loader2, 
  Image as ImageIcon, Video, Layers 
} from 'lucide-react';
import { useUploadJobs } from '../context/UploadJobContext';

/* ─────────────────────────────────────────────────────────────────────────── */
/* DESIGN DIRECTION: "Mission Control"                                         */
/* Dark obsidian panels • electric cyan/emerald progress • Geist Mono font    */
/* Each job card feels like a live telemetry readout from a launch dashboard  */
/* ─────────────────────────────────────────────────────────────────────────── */

const PLATFORM_ICONS = {
  instagram: '/icons/ig-instagram-icon.svg',
  youtube: '/icons/youtube-color-icon.svg',
  facebook: '/icons/facebook-round-color-icon.svg',
  x: '/icons/x-social-media-round-icon.svg',
  linkedin: '/icons/linkedin-icon.svg',
  tiktok: '/icons/tiktok-circle-icon.svg',
  pinterest: '/icons/pinterest-round-color-icon.svg',
  threads: '/icons/threads-icon.svg',
  mastodon: '/icons/mastodon-round-icon.svg',
  bluesky: '/icons/bluesky-circle-color-icon.svg',
  reddit: '/icons/reddit-icon.svg',
};

function phase(progress, status) {
  if (status === 'failed') return { label: 'FAILED', bar: '#f43f5e', glow: 'rgba(244,63,94,0.4)', text: '#f43f5e' };
  if (status === 'completed' || progress >= 100) return { label: 'DONE', bar: '#10b981', glow: 'rgba(16,185,129,0.35)', text: '#10b981' };
  if (progress < 30) return { label: 'UPLOADING', bar: '#6366f1', glow: 'rgba(99,102,241,0.3)', text: '#6366f1' };
  if (progress < 70) return { label: 'PUBLISHING', bar: '#8e4cfb', glow: 'rgba(142,76,251,0.35)', text: '#8e4cfb' };
  return { label: 'FINALIZING', bar: '#94a3b8', glow: 'rgba(148,163,184,0.35)', text: '#94a3b8' };
}

/* Pulsing dot indicator */
function StatusDot({ color }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8, flexShrink: 0 }}>
      <motion.span
        style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: color, opacity: 0.4,
        }}
        animate={{ scale: [1, 2, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: 'easeOut' }}
      />
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color }} />
    </span>
  );
}

/* Single job card */
function JobCard({ job, onRetry, onDismiss }) {
  const { progress, status, step, error, meta } = job;
  const p = phase(progress, status);
  const isActive = status === 'pending' || status === 'processing';
  const isDone = status === 'completed';
  const isFailed = status === 'failed';
  const channels = meta?.channels || [];
  const caption = meta?.caption || '';
  const mediaType = meta?.mediaType || 'image';
  const fileCount = meta?.fileCount || 1;
  const previewUrl = meta?.previewUrl || null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      style={{
        position: 'relative',
        borderRadius: 12,
        padding: '12px 13px',
        background: isFailed
          ? 'linear-gradient(135deg, rgba(255,59,92,0.07), rgba(10,10,16,0.95))'
          : isDone
          ? 'linear-gradient(135deg, rgba(0,229,160,0.07), rgba(10,10,16,0.95))'
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isFailed ? 'rgba(255,59,92,0.18)' : isDone ? 'rgba(0,229,160,0.18)' : 'rgba(255,255,255,0.06)'}`,
        overflow: 'hidden',
        fontFamily: "'Geist Mono', 'JetBrains Mono', 'Fira Code', monospace",
      }}
    >
      {/* Active scan-line shimmer */}
      {isActive && (
        <motion.div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '100%',
            background: 'linear-gradient(90deg, transparent 0%, rgba(0,180,255,0.03) 50%, transparent 100%)',
            pointerEvents: 'none',
          }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: 'linear' }}
        />
      )}

      <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
        {/* Thumbnail */}
        <div style={{
          width: 42, height: 42, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${p.bar}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 12px ${p.glow}`,
        }}>
          {previewUrl ? (
            <img src={previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : mediaType === 'video' ? (
            <Video size={16} color={p.bar} />
          ) : (
            <ImageIcon size={16} color={p.bar} />
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Top row: caption + controls */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.88)',
                letterSpacing: '0.01em', lineHeight: 1.3,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {caption || `${fileCount} file${fileCount !== 1 ? 's' : ''}`}
              </p>
              {/* Status label + dot */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                {isActive && <StatusDot color={p.bar} />}
                {isDone && <CheckCircle2 size={10} color="#10b981" />}
                {isFailed && <AlertCircle size={10} color="#f43f5e" />}
                <span style={{ 
                  fontSize: 9.5, 
                  fontWeight: 700, 
                  color: p.text, 
                  letterSpacing: '0.06em', 
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {p.label}
                </span>
              </div>
            </div>

            {/* Dismiss */}
            <button
              onClick={() => onDismiss(job.id)}
              style={{
                flexShrink: 0, width: 22, height: 22, borderRadius: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.2)', transition: 'all 0.15s',
                padding: 0,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'rgba(244,63,94,0.8)';
                e.currentTarget.style.background = 'rgba(244,63,94,0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.background = 'none';
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Step message or error */}
          <p style={{
            fontSize: 10, color: isFailed ? '#ff3b5c' : 'rgba(255,255,255,0.3)',
            marginTop: 4, letterSpacing: '0.01em', lineHeight: 1.4,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {isFailed ? (error || 'Upload failed') : (step || '—')}
          </p>

          {/* Progress bar */}
          <div style={{
            height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)',
            marginTop: 8, overflow: 'hidden', position: 'relative',
          }}>
            <motion.div
              style={{
                height: '100%', borderRadius: 99,
                background: isFailed
                  ? '#ff3b5c'
                  : isDone
                  ? '#00e5a0'
                  : `linear-gradient(90deg, ${p.bar}, ${p.bar}cc)`,
                boxShadow: `0 0 8px ${p.glow}`,
              }}
              animate={{ width: `${isFailed ? 100 : Math.max(progress, 0)}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
            {/* Animated leading edge on active */}
            {isActive && progress > 0 && progress < 100 && (
              <motion.div
                style={{
                  position: 'absolute', top: 0, height: '100%', width: 30,
                  background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)`,
                  left: `${progress}%`,
                }}
                animate={{ opacity: [0.6, 0, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              />
            )}
          </div>

          {/* Bottom row: % + platforms */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{
              fontSize: 9.5, fontWeight: 700,
              color: isDone ? '#00e5a0' : isFailed ? '#ff3b5c' : 'rgba(255,255,255,0.25)',
              fontVariantNumeric: 'tabular-nums', letterSpacing: '0.05em',
            }}>
              {isDone ? '100%' : isFailed ? 'ERR' : `${progress}%`}
            </span>

            <div style={{ display: 'flex' }}>
              {channels.slice(0, 6).map((ch, i) => {
                const src = PLATFORM_ICONS[ch];
                return src ? (
                  <img key={ch} src={src} alt={ch} style={{
                    width: 15, height: 15, borderRadius: '50%', objectFit: 'cover',
                    border: '1.5px solid rgba(10,10,16,0.9)',
                    marginLeft: i > 0 ? -5 : 0, position: 'relative', zIndex: 6 - i,
                  }} />
                ) : null;
              })}
              {channels.length > 6 && (
                <div style={{
                  width: 15, height: 15, borderRadius: '50%', marginLeft: -5,
                  background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(10,10,16,0.9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>
                    +{channels.length - 6}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Retry button */}
          {isFailed && (
            <button
              onClick={() => onRetry(job.id)}
              style={{
                marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 8, padding: '5px 12px', cursor: 'pointer', color: '#818cf8',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
            >
              <RefreshCw size={10} className={isActive ? 'animate-spin' : ''} />
              Retry
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main Panel ─────────────────────────────────────────────────────────── */
export default function UploadManagerPanel() {
  const { jobs, retryJob, clearCompleted, dismissJob, activeCount } = useUploadJobs();
  const [collapsed, setCollapsed] = useState(false);

  if (jobs.length === 0) return null;

  const completedCount = jobs.filter(j => j.status === 'completed').length;
  const failedCount = jobs.filter(j => j.status === 'failed').length;
  const anyFinished = completedCount > 0 || failedCount > 0;

  // Average progress of active jobs
  const activeJobs = jobs.filter(j => j.status === 'pending' || j.status === 'processing');
  const avgProgress = activeJobs.length > 0
    ? Math.round(activeJobs.reduce((s, j) => s + j.progress, 0) / activeJobs.length)
    : 0;

  return (
    <>
      {/* Google Fonts for Geist Mono equivalent */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');`}</style>

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 99999,
          width: 'clamp(300px, 90vw, 360px)',
          borderRadius: 20,
          background: 'rgba(10, 10, 18, 0.98)',
          backdropFilter: 'blur(32px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(32px) saturate(1.8)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: [
            '0 40px 100px rgba(0,0,0,0.8)',
            '0 0 0 1px rgba(255,255,255,0.03) inset',
            activeCount > 0 ? '0 0 60px rgba(99,102,241,0.08)' : '',
          ].filter(Boolean).join(', '),
          fontFamily: 'var(--font-ui)',
          overflow: 'hidden',
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div
          onClick={() => setCollapsed(c => !c)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '11px 13px 11px 12px', cursor: 'pointer',
            borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.05)',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0 }}>
            {/* Icon */}
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: activeCount > 0
                ? 'linear-gradient(135deg, #6366f1, #8e4cfb)'
                : 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: activeCount > 0 ? '0 4px 20px rgba(99,102,241,0.4)' : '0 4px 20px rgba(16,185,129,0.3)',
            }}>
              {activeCount > 0 ? (
                <motion.div
                  animate={{ y: [-1, 1, -1] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                >
                  <Upload size={14} color="white" strokeWidth={2.5} />
                </motion.div>
              ) : (
                <CheckCircle2 size={14} color="white" strokeWidth={2.5} />
              )}
            </div>

            {/* Title block */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeCount > 0 ? `Broadcasting ${activeCount}…` : 'Broadcast Manager'}
              </div>
              <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.35)', marginTop: 2, letterSpacing: '0.04em', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                {jobs.length} JOB{jobs.length !== 1 ? 'S' : ''}
                {completedCount > 0 && <span style={{ color: '#10b981' }}> · {completedCount} DONE</span>}
                {failedCount > 0 && <span style={{ color: '#f43f5e' }}> · {failedCount} FAILED</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
            {anyFinished && !collapsed && (
              <button
                onClick={e => { e.stopPropagation(); clearCompleted(); }}
                style={{
                  fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.28)',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 5, padding: '3px 8px', cursor: 'pointer',
                  letterSpacing: '0.05em', textTransform: 'uppercase', transition: 'all 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.28)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              >
                Clear
              </button>
            )}
            <motion.div
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <ChevronDown size={16} color="rgba(255,255,255,0.35)" />
            </motion.div>
          </div>
        </div>

        {/* Summary progress strip (always visible, only when active) */}
        {activeCount > 0 && (
          <div style={{ height: 2, background: 'rgba(255,255,255,0.04)' }}>
            <motion.div
              style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #8e4cfb, #10b981)', backgroundSize: '200% 100%' }}
              animate={{ width: `${avgProgress}%`, backgroundPosition: ['0% 0%', '100% 0%'] }}
              transition={{ width: { duration: 0.6, ease: [0.16,1,0.3,1] }, backgroundPosition: { repeat: Infinity, duration: 3, ease: 'linear' } }}
            />
          </div>
        )}

        {/* ── Job list ────────────────────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="list"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                padding: '10px 10px 10px',
                display: 'flex', flexDirection: 'column', gap: 7,
                maxHeight: 'min(420px, 60vh)',
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.07) transparent',
              }}>
                <AnimatePresence mode="popLayout">
                  {jobs.map(job => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onRetry={retryJob}
                      onDismiss={dismissJob}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
