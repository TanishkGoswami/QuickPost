/**
 * FiltersBar.jsx — Horizontal filter bar (updated)
 * ────────────────────────────────────────────────────────────────
 * NOTE: The new AllTrendsPage renders its own filter pills in the
 * sticky header. This file provides a standalone FiltersBar for
 * pages / layouts that still use the sidebar pattern.
 *
 * Replace: client/src/pages/trends/components/FiltersBar.jsx
 * ────────────────────────────────────────────────────────────────
 */

import React, { memo, useRef } from "react";
import { motion } from "framer-motion";
import { Search, X, Zap, Cpu, BarChart2, Activity, Trophy, Tv2, TrendingUp, Music, Globe, Flame } from "lucide-react";
import { NICHES, PLATFORMS, CONTENT_TYPES } from "../data/trendsData";

const C = { ink: "#141413", canvas: "#f2f0ed", white: "#ffffff", slate: "#6b6b68", dust: "#c4bfb8", arc: "#f37338", border: "rgba(20,20,19,0.09)" };

const NICHE_ICONS = {
  "All": <Zap size={13} />, "AI & Tech": <Cpu size={13} />, "Trading": <BarChart2 size={13} />,
  "Crypto": <Activity size={13} />, "Sports": <Trophy size={13} />, "Entertainment": <Tv2 size={13} />,
  "Business": <TrendingUp size={13} />, "Music": <Music size={13} />, "Politics": <Globe size={13} />,
  "Fitness": <Flame size={13} />, "Lifestyle": <Zap size={13} />,
};

const Chip = memo(function Chip({ label, active, icon, onClick }) {
  return (
    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 15px", borderRadius: 99, flexShrink: 0, whiteSpace: "nowrap",
        background: active ? C.ink : C.white, border: `1.5px solid ${active ? C.ink : C.border}`,
        color: active ? C.canvas : C.slate, fontSize: 12, fontWeight: active ? 700 : 500,
        cursor: "pointer", fontFamily: "inherit", transition: "all 0.14s",
        boxShadow: active ? "0 3px 12px rgba(20,20,19,0.18)" : "none",
      }}>
      {icon && <span style={{ color: active ? C.arc : C.dust }}>{icon}</span>}
      {label}
    </motion.button>
  );
});

const Section = ({ title, children }) => (
  <div>
    <p style={{ fontSize: 11, fontWeight: 800, color: C.slate, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.arc, display: "inline-block" }} />
      {title}
    </p>
    <div style={{ display: "flex", flexWrap: "nowrap", gap: 6, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
      {children}
    </div>
  </div>
);

const FiltersBar = memo(function FiltersBar({
  activeNiche, setActiveNiche,
  activePlatform, setActivePlatform,
  activeType, setActiveType,
  search, setSearch,
}) {
  const inputRef = useRef(null);

  return (
    <div style={{
      background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 20,
      padding: "24px", display: "flex", flexDirection: "column", gap: 28,
      boxShadow: "0 2px 16px rgba(20,20,19,0.06)",
    }}>
      {/* Search */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 800, color: C.slate, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.arc, display: "inline-block" }} />
          Search
        </p>
        <div style={{ position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: C.dust, pointerEvents: "none" }} />
          <input ref={inputRef} type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search topics…"
            style={{ width: "100%", padding: "11px 36px 11px 42px", borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.canvas, color: C.ink, fontSize: 13, fontWeight: 500, outline: "none", fontFamily: "inherit", transition: "border-color 0.18s" }}
            onFocus={e => { e.target.style.borderColor = C.arc; e.target.style.boxShadow = `0 0 0 3px ${C.arc}12`; }}
            onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }} />
          {search && (
            <button onClick={() => { setSearch(""); inputRef.current?.focus(); }}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(20,20,19,0.08)", border: "none", borderRadius: "50%", cursor: "pointer", color: C.slate }}>
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Niche */}
      <Section title="Niche">
        {NICHES.map(n => (
          <Chip key={n} label={n} active={activeNiche === n} icon={NICHE_ICONS[n]} onClick={() => setActiveNiche(n)} />
        ))}
      </Section>

      {/* Platform */}
      <Section title="Platform">
        {PLATFORMS.map(p => <Chip key={p} label={p} active={activePlatform === p} onClick={() => setActivePlatform(p)} />)}
      </Section>

      {/* Content Type */}
      <Section title="Type">
        {CONTENT_TYPES.map(t => <Chip key={t} label={t} active={activeType === t} onClick={() => setActiveType(t)} />)}
      </Section>
    </div>
  );
});

export default FiltersBar;
