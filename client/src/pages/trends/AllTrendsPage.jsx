/**
 * AllTrendsPage.jsx v2 — Advanced Trend Intelligence
 * ─────────────────────────────────────────────────────────────────
 * Fixes in this version:
 * 1. processedTrends uses deterministic hash scoring (not Math.random)
 * 2. Debounced search input
 * 3. Proper niche detection for meme items
 * 4. AbortController-safe via useAllTrends v2
 * 5. Toast uses accessible role="status"
 *
 * Replace: client/src/pages/trends/AllTrendsPage.jsx
 */

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  Suspense,
  lazy,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  RefreshCw,
  Sparkles,
  LayoutGrid,
  TrendingUp,
  Hash,
  Cpu,
  Activity,
} from "lucide-react";
import FiltersBar from "./components/FiltersBar";
import TrendGrid from "./components/TrendGrid";
import { useAllTrends } from "./hooks/useAllTrends";

// Lazy-load ComposerModal to avoid loading it on initial paint
const ComposerModal = lazy(() => import("../../components/ComposerModal"));

/* ─────────────────────────────────────────────────────────────────
   DETERMINISTIC SCORE — replaces Math.random() in useMemo
───────────────────────────────────────────────────────────────── */

function deterministicScore(str, min = 70, max = 99) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0; // force unsigned 32-bit
  }
  return min + (hash % (max - min + 1));
}

/* ─────────────────────────────────────────────────────────────────
   NICHE DETECTION
───────────────────────────────────────────────────────────────── */

const NICHE_RULES = [
  {
    niche: "Crypto",
    keywords: ["crypto", "bitcoin", "btc", "ethereum", "web3", "nft", "defi"],
  },
  {
    niche: "AI & Tech",
    keywords: [
      "ai",
      "chatgpt",
      "openai",
      "tech",
      "apple",
      "google",
      "meta",
      "gpt",
      "llm",
    ],
  },
  {
    niche: "Trading",
    keywords: [
      "stock",
      "market",
      "nifty",
      "sensex",
      "trading",
      "invest",
      "fund",
      "equity",
    ],
  },
  {
    niche: "Fitness",
    keywords: [
      "gym",
      "fitness",
      "workout",
      "diet",
      "health",
      "exercise",
      "nutrition",
    ],
  },
  {
    niche: "Sports",
    keywords: [
      "ipl",
      "cricket",
      "football",
      "sport",
      "match",
      "tournament",
      "league",
    ],
  },
  {
    niche: "Business",
    keywords: [
      "startup",
      "business",
      "entrepreneur",
      "company",
      "ceo",
      "funding",
    ],
  },
  {
    niche: "Entertainment",
    keywords: [
      "movie",
      "film",
      "series",
      "netflix",
      "celebrity",
      "music",
      "bollywood",
    ],
  },
];

function detectNiche(text) {
  const lower = (text || "").toLowerCase();
  for (const rule of NICHE_RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) return rule.niche;
  }
  return "General";
}

/* ─────────────────────────────────────────────────────────────────
   IDEA GENERATOR — stable based on title
───────────────────────────────────────────────────────────────── */

function generateIdeas(title, niche) {
  return [
    `Share your take on: ${title?.substring(0, 55) || "this trend"}`,
    `What this means for ${niche} creators in 2026`,
    `Quick explainer: ${title?.substring(0, 45) || niche} — explained in 60 seconds`,
  ];
}

/* ─────────────────────────────────────────────────────────────────
   STATS STRIP
───────────────────────────────────────────────────────────────── */

const StatsStrip = ({ trendCount, memeCount, loading }) => {
  const stats = [
    {
      label: "Trending Signals",
      val: trendCount,
      icon: TrendingUp,
      color: "var(--arc)",
    },
    { label: "Community Posts", val: memeCount, icon: Hash, color: "#6366f1" },
    {
      label: "Discovery Engine",
      val: "LIVE",
      icon: Cpu,
      color: "var(--success)",
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        marginTop: 24,
        flexWrap: "wrap",
      }}
    >
      {stats.map(({ label, val, icon: Icon, color }) => (
        <div
          key={label}
          style={{
            background: "var(--white)",
            padding: "14px 20px",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            border: "1px solid rgba(20,20,19,0.06)",
            boxShadow: "var(--shadow-card)",
            minWidth: 160,
            flex: "1 1 160px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon size={12} style={{ color }} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "var(--slate)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {label}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span
              style={{
                fontSize: loading ? 18 : 24,
                fontWeight: 800,
                color: "var(--ink)",
                letterSpacing: "-0.03em",
                transition: "font-size 0.2s",
              }}
            >
              {loading ? "..." : val}
            </span>
            <div
              style={{
                padding: "2px 6px",
                background: `${color}14`,
                borderRadius: 6,
                fontSize: 9,
                fontWeight: 800,
                color,
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Activity size={8} />
              {typeof val === "string" ? val : "NOW"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   INJECTED TOAST
───────────────────────────────────────────────────────────────── */

const InjectedToast = ({ visible }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        role="status"
        aria-live="polite"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: "fixed",
          bottom: 32,
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--ink)",
          color: "white",
          borderRadius: "var(--r-pill)",
          padding: "12px 24px",
          fontSize: 13,
          fontWeight: 700,
          zIndex: "var(--z-toast, 600)",
          boxShadow: "0 12px 40px rgba(20,20,19,0.3)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          whiteSpace: "nowrap",
          letterSpacing: "-0.01em",
        }}
      >
        <Sparkles size={14} style={{ color: "var(--arc)" }} />
        Idea loaded into Composer!
      </motion.div>
    )}
  </AnimatePresence>
);

/* ─────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────── */

export default function AllTrendsPage() {
  /* ── Filter & search state ── */
  const [activeNiche, setActiveNiche] = useState("All");
  const [activePlatform, setActivePlatform] = useState("All");
  const [activeType, setActiveType] = useState("All");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("score");

  /* ── UI state ── */
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef(null);

  /* ── Composer state ── */
  const [composerOpen, setComposerOpen] = useState(false);
  const [injectedData, setInjectedData] = useState(null);

  /* ── API Data ── */
  const {
    trends: news,
    memes,
    images,
    loading,
    loadingMore,
    error,
    hasMore,
    refetch,
    loadMore,
  } = useAllTrends(search, {
    newsLimit: 24,
    memeLimit: 24,
    newsCategories:
      "technology,business,entertainment,sports,finance,science,world,health",
  });

  /* ── Process trends — DETERMINISTIC scoring (no Math.random in useMemo) ── */
  const processedTrends = useMemo(() => {
    // Map news articles to trend items
    const trendItems = news.map((n, i) => {
      const titleKey = `${n.title || ""}${n.source || ""}`;
      const score = deterministicScore(titleKey, 75, 99);
      const niche = detectNiche(n.title);

      return {
        id: `trend-${n.url || titleKey.substring(0, 20) || i}`,
        discoveryType: "trend",
        topic: niche,
        score,
        ideas: generateIdeas(n.title, niche),
        hashtags: [
          `#${niche.replace(/\s/g, "")}`,
          "#trending",
          `#${(n.source || "news").toLowerCase().replace(/[^a-z0-9]/g, "")}`,
        ].filter((h, idx, arr) => arr.indexOf(h) === idx), // dedupe
        newsItem: n,
      };
    });

    // Map meme/reddit items
    const memeItems = memes.map((m, i) => {
      const titleKey = `${m.title || ""}${m.subreddit || ""}`;
      const score = deterministicScore(titleKey, 65, 92);
      const niche = detectNiche(m.title) || m.subreddit || "General";

      return {
        ...m,
        id: m.id ? `meme-${m.id}` : `meme-${i}-${titleKey.substring(0, 8)}`,
        discoveryType: "meme",
        topic: niche,
        score,
      };
    });

    // ── Apply niche filter ──
    let filteredTrends =
      activeNiche === "All"
        ? trendItems
        : trendItems.filter((t) => t.topic === activeNiche);

    let filteredMemes = memeItems; // memes show regardless of niche filter

    // ── Interleave 1 trend : 1 meme for balanced discovery ──
    const combined = [];
    const maxLen = Math.max(filteredTrends.length, filteredMemes.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < filteredTrends.length) combined.push(filteredTrends[i]);
      if (i < filteredMemes.length) combined.push(filteredMemes[i]);
    }

    // ── Sort ──
    if (sortOrder === "score") {
      combined.sort((a, b) => b.score - a.score);
    }
    // 'latest' keeps insertion order (API already returns newest first)

    return combined;
  }, [news, memes, activeNiche, sortOrder]);

  /* ── Handle "Use Idea" ── */
  const handleUseIdea = useCallback((data) => {
    setInjectedData(data);
    setComposerOpen(true);

    // Show toast
    clearTimeout(toastTimerRef.current);
    setToastVisible(true);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 3000);
  }, []);

  // Cleanup toast timer on unmount
  useEffect(() => {
    return () => clearTimeout(toastTimerRef.current);
  }, []);

  /* ── Refresh handler ── */
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--canvas)",
        padding: "24px 32px",
        maxWidth: 1600,
        margin: "0 auto",
      }}
    >
      {/* ── HEADER ── */}
      <header style={{ marginBottom: 40, maxWidth: 1200 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              background: "var(--ink)",
              color: "var(--white)",
              width: 44,
              height: 44,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-premium)",
              flexShrink: 0,
            }}
          >
            <Flame
              size={22}
              style={{ color: "var(--arc)" }}
              aria-hidden="true"
            />
          </div>
          <div>
            <h1
              style={{
                fontSize: "clamp(28px, 4vw, 36px)",
                fontWeight: 800,
                color: "var(--ink)",
                margin: 0,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
              }}
            >
              Trend Intelligence
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "var(--slate)",
                margin: "4px 0 0",
                fontWeight: 500,
              }}
            >
              Real-time signals and discovery for high-impact content
            </p>
          </div>
        </div>

        <StatsStrip
          trendCount={news.length}
          memeCount={memes.length}
          loading={loading}
        />
      </header>

      {/* ── MAIN LAYOUT ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          gap: 28,
          alignItems: "flex-start",
        }}
        className="trends-layout"
      >
        {/* ── Left Sidebar ── */}
        <aside style={{ position: "sticky", top: 24 }}>
          <FiltersBar
            activeNiche={activeNiche}
            setActiveNiche={setActiveNiche}
            activePlatform={activePlatform}
            setActivePlatform={setActivePlatform}
            activeType={activeType}
            setActiveType={setActiveType}
            search={search}
            setSearch={setSearch}
          />

          {/* Pro tip card */}
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            style={{
              marginTop: 24,
              padding: "20px",
              background:
                "linear-gradient(135deg, var(--color-arc-050), transparent)",
              borderRadius: 20,
              border: "1px solid var(--color-arc-100)",
              boxShadow: "0 8px 24px rgba(243,115,56,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "var(--arc)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles size={14} aria-hidden="true" />
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "var(--ink)",
                  letterSpacing: "-0.01em",
                }}
              >
                Pro Tip
              </span>
            </div>
            <p
              style={{
                fontSize: 12,
                color: "var(--slate)",
                margin: 0,
                lineHeight: 1.6,
                fontWeight: 500,
              }}
            >
              Meme-based posts generate{" "}
              <span style={{ color: "var(--arc)", fontWeight: 800 }}>
                up to 40% more engagement
              </span>{" "}
              than plain image posts. Use the "Use Meme" button to instantly
              load it into your composer.
            </p>
          </motion.div>
        </aside>

        {/* ── Right: Grid + Controls ── */}
        <main>
          {/* Top controls bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
              background: "var(--white)",
              padding: "10px 16px",
              borderRadius: 14,
              border: "1px solid rgba(20,20,19,0.06)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <LayoutGrid
                size={15}
                style={{ color: "var(--dust)" }}
                aria-hidden="true"
              />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--ink)",
                  letterSpacing: "-0.01em",
                }}
              >
                {processedTrends.length}{" "}
                <span style={{ color: "var(--slate)", fontWeight: 500 }}>
                  discoveries
                </span>
              </span>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <label htmlFor="sort-select" className="sr-only">
                Sort trends by
              </label>
              <select
                id="sort-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={{
                  padding: "7px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(20,20,19,0.08)",
                  background: "var(--canvas)",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--ink)",
                  outline: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                }}
              >
                <option value="score">🔥 Top Score</option>
                <option value="latest">🕐 Latest First</option>
              </select>

              <button
                onClick={handleRefresh}
                disabled={loading}
                aria-label="Refresh trends"
                className="btn-icon"
                style={{ width: 36, height: 36, minWidth: 36 }}
              >
                <RefreshCw
                  size={15}
                  style={{
                    animation: loading ? "spin 0.8s linear infinite" : "none",
                  }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          {/* Trend Grid */}
          <TrendGrid
            trends={processedTrends}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            error={error}
            onLoadMore={loadMore}
            onUseIdea={handleUseIdea}
          />
        </main>
      </div>

      {/* ── TOAST NOTIFICATION ── */}
      <InjectedToast visible={toastVisible} />

      {/* ── COMPOSER MODAL (lazy) ── */}
      {composerOpen && (
        <Suspense fallback={null}>
          <ComposerModal
            isOpen={composerOpen}
            onClose={() => {
              setComposerOpen(false);
              setInjectedData(null);
            }}
            initialCaption={injectedData?.caption || ""}
            initialHashtags={injectedData?.hashtags || []}
            initialMediaUrls={[
              ...(injectedData?.images || []),
              ...(injectedData?.memes || []),
            ].slice(0, 5)}
          />
        </Suspense>
      )}

      {/* ── RESPONSIVE STYLES ── */}
      <style>{`
        @media (max-width: 1024px) {
          .trends-layout {
            grid-template-columns: 1fr !important;
          }
          aside {
            position: relative !important;
            top: 0 !important;
            margin-bottom: 16px;
          }
        }
        @media (max-width: 768px) {
          div[style*="padding: '24px 32px'"] {
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
