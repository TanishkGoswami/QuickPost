'use client';

import React, { useEffect, useRef } from 'react';

export default function InteractiveGradientBackground({
  className = '',
  children,
  intensity = 1,
  interactive = true,
  initialOffset,
  dark = false,
  style = {}
}) {
  const ref = useRef(null);
  const rafRef = useRef(null);
  const pendingRef = useRef(null);

  const schedule = () => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const host = ref.current;
      const ev = pendingRef.current;
      if (!host || !ev) return;
      const rect = host.getBoundingClientRect();
      const px = ('clientX' in ev ? ev.clientX : 0) - rect.left - rect.width / 2;
      const py = ('clientY' in ev ? ev.clientY : 0) - rect.top - rect.height / 2;

      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

      const k = prefersReduced ? 0.1 : intensity;

      host.style.setProperty('--posX', String(px * k));
      host.style.setProperty('--posY', String(py * k));
    });
  };

  useEffect(() => {
    const host = ref.current;
    if (!host) return;

    // set initial vars
    host.style.setProperty('--posX', String(initialOffset?.x ?? 0));
    host.style.setProperty('--posY', String(initialOffset?.y ?? 0));

    if (!interactive) return;

    const onPointer = (e) => {
      pendingRef.current = e;
      schedule();
    };
    const onTouch = (e) => {
      if (!e.touches.length) return;
      pendingRef.current = e.touches[0];
      schedule();
    };
    const reset = () => {
      host.style.setProperty('--posX', '0');
      host.style.setProperty('--posY', '0');
    };

    host.addEventListener('pointermove', onPointer, { passive: true });
    host.addEventListener('touchmove', onTouch, { passive: true });
    host.addEventListener('pointerleave', reset);
    host.addEventListener('touchend', reset);
    host.addEventListener('touchcancel', reset);

    return () => {
      host.removeEventListener('pointermove', onPointer);
      host.removeEventListener('touchmove', onTouch);
      host.removeEventListener('pointerleave', reset);
      host.removeEventListener('touchend', reset);
      host.removeEventListener('touchcancel', reset);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [interactive, intensity, initialOffset?.x, initialOffset?.y]);

  return (
    <div
      ref={ref}
      aria-label="Interactive gradient background"
      role="img"
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        '--posX': '0',
        '--posY': '0',
        ...style
      }}
    >
      {/* Light layer */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: dark ? 0 : 1,
          transition: 'opacity 0.5s ease',
          background: `
            radial-gradient(90% 100% at calc(50% + var(--posX)*1px) calc(0% + var(--posY)*1px), rgba(243, 115, 56, 0.4), rgba(20, 20, 19, 1)),
            radial-gradient(100% 100% at calc(80% - var(--posX)*1px) calc(0% - var(--posY)*1px), rgba(245, 158, 11, 0.3), rgba(36, 0, 0, 1)),
            linear-gradient(60deg, rgba(243, 115, 56, 0.5), rgba(120, 86, 255, 1))
          `,
          backgroundBlendMode: 'overlay, difference, normal',
        }}
      />
      {/* Dark layer */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: dark ? 1 : 0,
          transition: 'opacity 0.5s ease',
          background: `
            radial-gradient(90% 100% at calc(50% + var(--posX)*1px) calc(0% + var(--posY)*1px), rgba(120, 120, 160, 0.4), rgba(20, 0, 50, 1)),
            radial-gradient(100% 100% at calc(80% - var(--posX)*1px) calc(0% - var(--posY)*1px), rgba(150, 180, 0, 0.3), rgba(30, 0, 0, 1)),
            linear-gradient(60deg, rgba(150, 0, 0, 0.5), rgba(90, 60, 220, 1))
          `,
          backgroundBlendMode: 'overlay, difference, normal',
        }}
      />

      {/* Content */}
      {children ? (
        <div style={{ 
          position: 'relative', 
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'inherit',
          width: '100%',
          height: '100%'
        }}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

export { InteractiveGradientBackground };
