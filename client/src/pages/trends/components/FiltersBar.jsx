import React, { memo } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { NICHES, PLATFORMS, CONTENT_TYPES } from "../data/trendsData";

/**
 * FilterChip — a single pill toggle button.
 */
const FilterChip = memo(function FilterChip({ label, active, onClick }) {
  return (
    <motion.button
      whileHover={{
        scale: 1.02,
        background: active ? "var(--ink)" : "var(--white)",
      }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      style={{
        padding: "10px 20px",
        borderRadius: "var(--r-pill)",
        border: active
          ? "1.5px solid var(--ink)"
          : "1.5px solid rgba(20,20,19,0.08)",
        background: active ? "var(--ink)" : "var(--white)",
        color: active ? "var(--white)" : "var(--slate)",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: active ? "var(--shadow-barely)" : "none",
        letterSpacing: "var(--tracking-tight)",
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
  <div style={{ position: "relative", overflow: "hidden" }}>
    <div
      style={{
        display: "flex",
        flexWrap: "nowrap",
        gap: 8,
        overflowX: "auto",
        padding: "2px 0 8px",
        msOverflowStyle: "none",
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
      }}
      className="hide-scrollbar"
    >
      {children}
    </div>
  </div>
);

/**
 * FiltersBar — niche + platform + content-type chips + search.
 */
const FiltersBar = memo(function FiltersBar({
  activeNiche,
  setActiveNiche,
  activePlatform,
  setActivePlatform,
  activeType,
  setActiveType,
  search,
  setSearch,
}) {
  return (
    <div
      style={{
        background: "var(--white)",
        border: "1.5px solid rgba(20,20,19,0.06)",
        borderRadius: "var(--r-card)",
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        gap: 40,
        boxShadow: "var(--shadow-atmospheric)",
      }}
    >
      {/* Search Section */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--arc)",
            }}
          />
          <p
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--ink)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              margin: 0,
            }}
          >
            Search
          </p>
        </div>
        <div style={{ position: "relative" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: 18,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--slate)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Search topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px 14px 48px",
              borderRadius: "var(--r-pill)",
              border: "1.5px solid rgba(20,20,19,0.1)",
              background: "var(--canvas-lifted)",
              color: "var(--ink)",
              fontSize: 15,
              fontWeight: 450,
              outline: "none",
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "var(--ink)";
              e.target.style.background = "var(--white)";
              e.target.style.boxShadow = "var(--shadow-barely)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(20,20,19,0.1)";
              e.target.style.background = "var(--canvas-lifted)";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>
      </div>

      {/* Filter Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {/* Niche filter */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--arc)",
              }}
            />
            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--ink)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                margin: 0,
              }}
            >
              Niche
            </p>
          </div>
          <ScrollContainer>
            {NICHES.map((n) => (
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--arc)",
              }}
            />
            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--ink)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                margin: 0,
              }}
            >
              Platform
            </p>
          </div>
          <ScrollContainer>
            {PLATFORMS.map((p) => (
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--arc)",
              }}
            />
            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--ink)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                margin: 0,
              }}
            >
              Type
            </p>
          </div>
          <ScrollContainer>
            {CONTENT_TYPES.map((t) => (
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
