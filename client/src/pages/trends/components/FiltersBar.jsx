import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { NICHES, PLATFORMS, CONTENT_TYPES } from '../data/trendsData';

/**
 * FilterChip — a single pill toggle button.
 */
const FilterChip = memo(function FilterChip({ label, active, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, background: active ? 'var(--ink)' : 'rgba(20,20,19,0.03)' }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: '12px',
        border: active ? '1.5px solid var(--ink)' : '1.5px solid rgba(20,20,19,0.06)',
        background: active ? 'var(--ink)' : 'var(--white)',
        color: active ? 'var(--canvas)' : 'var(--slate)',
        fontSize: 12, 
        fontWeight: 700,
        cursor: 'pointer', 
        whiteSpace: 'nowrap',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: 'inherit',
        boxShadow: active ? '0 8px 20px rgba(20,20,19,0.12)' : 'none',
      }}
    >
      {label}
    </motion.button>
  );
});

/**
 * ScrollContainer — wrapper to hide scrollbars and add fade masks.
 */
const ScrollContainer = ({ children }) => (
  <div style={{ position: 'relative' }}>
    <div 
      style={{ 
        display: 'flex', 
        flexWrap: 'nowrap', 
        gap: 8, 
        overflowX: 'auto', 
        paddingBottom: '4px',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }} 
      className="hide-scrollbar"
    >
      {children}
    </div>
    {/* Fade mask for scroll hint */}
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 4,
      width: 40,
      background: 'linear-gradient(to right, transparent, var(--canvas-lifted))',
      pointerEvents: 'none'
    }} />
  </div>
);

/**
 * FiltersBar — niche + platform + content-type chips + search.
 */
const FiltersBar = memo(function FiltersBar({
  activeNiche, setActiveNiche,
  activePlatform, setActivePlatform,
  activeType, setActiveType,
  search, setSearch,
}) {
  return (
    <div style={{
      background: 'var(--canvas-lifted)',
      border: '1px solid rgba(20,20,19,0.08)',
      borderRadius: '24px',
      padding: '24px',
      display: 'flex', 
      flexDirection: 'column', 
      gap: 28,
      boxShadow: '0 4px 32px rgba(20,20,19,0.03)',
    }}>

      {/* Search Section */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 900, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 12px' }}>
          Search Trends
        </p>
        <div style={{ position: 'relative' }}>
          <Search 
            size={18} 
            style={{
              position: 'absolute', 
              left: 14, 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: 'var(--dust)',
              pointerEvents: 'none',
            }} 
          />
          <input
            type="text"
            placeholder="Search topics..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px 14px 44px',
              borderRadius: '16px',
              border: '1.5px solid rgba(20,20,19,0.08)',
              background: 'var(--white)',
              color: 'var(--ink)',
              fontSize: 14, 
              fontWeight: 600,
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onFocus={e => { 
              e.target.style.borderColor = 'var(--ink)';
              e.target.style.boxShadow = '0 12px 30px rgba(20,20,19,0.06)';
            }}
            onBlur={e => { 
              e.target.style.borderColor = 'rgba(20,20,19,0.08)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {/* Filter Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Niche filter */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 900, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 12px' }}>
            Niche
          </p>
          <ScrollContainer>
            {NICHES.map(n => (
              <FilterChip
                key={n}
                label={n}
                active={activeNiche === n}
                onClick={() => setActiveNiche(n)}
              />
            ))}
          </ScrollContainer>
        </div>

        {/* Platform filter */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 900, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 12px' }}>
            Platform
          </p>
          <ScrollContainer>
            {PLATFORMS.map(p => (
              <FilterChip
                key={p}
                label={p}
                active={activePlatform === p}
                onClick={() => setActivePlatform(p)}
              />
            ))}
          </ScrollContainer>
        </div>

        {/* Content type filter */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 900, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 12px' }}>
            Content Type
          </p>
          <ScrollContainer>
            {CONTENT_TYPES.map(t => (
              <FilterChip
                key={t}
                label={t}
                active={activeType === t}
                onClick={() => setActiveType(t)}
              />
            ))}
          </ScrollContainer>
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
});

export default FiltersBar;
