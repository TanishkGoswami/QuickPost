'use client';

import React from 'react';
import { InteractiveGradientBackground } from './InteractiveGradientBackground';

export default function InteractiveButton({ 
  children, 
  onClick, 
  className = '', 
  style = {},
  ...props 
}) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        padding: 0,
        overflow: 'hidden',
        border: 'none',
        background: 'transparent',
        borderRadius: 'var(--r-btn)',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.2s ease',
        ...style
      }}
      onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
      onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
      {...props}
    >
      <InteractiveGradientBackground
        intensity={1.4}
        dark={false}
        style={{
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          color: 'white',
          fontWeight: 600,
          fontSize: '15px',
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap'
        }}
      >
        {children}
      </InteractiveGradientBackground>
    </button>
  );
}
