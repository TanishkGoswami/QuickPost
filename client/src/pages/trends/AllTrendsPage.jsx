import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  Suspense,
  lazy,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, RefreshCw, Sparkles, LayoutGrid, Search as SearchIcon } from "lucide-react";
import FiltersBar from "./components/FiltersBar";
import TrendGrid from "./components/TrendGrid";
import { useAllTrends } from "./hooks/useAllTrends";

// Lazy-load the ComposerModal so the page doesn't bloat initial bundle
const ComposerModal = lazy(() => import("../../components/ComposerModal"));

/* ─────────────────────────────────────────────────────────────────
   "Idea Injected" toast notification
   ───────────────────────────────────────────────────────────────── */
function InjectedToast({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: "fixed",
            bottom: 28,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--ink)",
            color: "white",
            borderRadius: "var(--r-pill)",
            padding: "12px 24px",
            fontSize: 13,
            fontWeight: 700,
            zIndex: 200,
            boxShadow: "0 12px 48px rgba(20,20,19,0.3)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            whiteSpace: "nowrap",
          }}
        >
          <Sparkles size={14} style={{ color: "var(--arc)" }} />
          Idea loaded into Composer!
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────────────────────────────────── */
export default function AllTrendsPage() {
  /* ── Filter state ── */
  const [activeNiche, setActiveNiche] = useState("All");
  const [activePlatform, setActivePlatform] = useState("All");
  const [activeType, setActiveType] = useState("All");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("score");

  /* ── UI state ── */
  const [toastVisible, setToastVisible] = useState(false);

  /* ── Composer inject state ── */
  const [composerOpen, setComposerOpen] = useState(false);
  const [injectedData, setInjectedData] = useState(null);

  /* ── API Data Hook ── */
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
    imageLimit: 24,
    newsCategories: 'technology,business,entertainment,sports,finance,science',
  });

  /* ── Derived Trends Logic ── */
  const processedTrends = useMemo(() => {
    // We map news articles to "Trends"
    let result = news.map((n, i) => {
      // Basic niche detection logic
      const title = (n.title || "").toLowerCase();
      let niche = "General";
      if (title.includes("crypto") || title.includes("bitcoin")) niche = "Crypto";
      else if (title.includes("ai") || title.includes("tech") || title.includes("chatgpt")) niche = "AI & Tech";
      else if (title.includes("stock") || title.includes("market") || title.includes("trading")) niche = "Trading";
      else if (title.includes("fit") || title.includes("gym") || title.includes("workout")) niche = "Fitness";

      return {
        id: `trend-${i}-${n.title?.substring(0, 5)}`,
        topic: niche,
        score: 80 + Math.floor(Math.random() * 19), // Derived score 80-99
        ideas: [
          `Share your perspective on: ${n.title}`,
          `What this means for the ${niche} industry`,
          `3 things you didn't know about this ${niche} trend`,
        ],
        hashtags: [
          `#${niche.replace(/\s/g, "")}`,
          "#trending",
          "#viralnews",
          `#${(n.source || "news").toLowerCase().replace(/\s/g, "")}`,
        ],
        newsItem: n,
      };
    });

    // 2. Map Memes as first-class citizens
    const memeItems = memes.map((m, i) => ({
      ...m,
      discoveryType: 'meme',
      id: `meme-${m.id || i}`,
      score: 85 + Math.floor(Math.random() * 15), // High priority scores
    }));

    // 3. Interleave them for a dynamic discovery experience
    const combined = [];
    const maxLen = Math.max(result.length, memeItems.length);
    
    for (let i = 0; i < maxLen; i++) {
      if (i < result.length) {
        combined.push({ ...result[i], discoveryType: 'trend' });
      }
      // Insert a meme every 2 news articles or if we run out of news
      if (i < memeItems.length && (i % 2 === 0 || i >= result.length)) {
        combined.push(memeItems[i]);
      }
    }

    // Apply Niche filter (Memes are usually General but we can categorize them if needed)
    let filtered = combined;
    if (activeNiche !== "All") {
      filtered = combined.filter(t => 
        t.discoveryType === 'trend' ? t.topic === activeNiche : true
      );
    }

    // Apply sorting
    if (sortOrder === "score") {
      filtered.sort((a, b) => b.score - a.score);
    }

    return filtered;
  }, [news, memes, activeNiche, sortOrder]);

  /* ── Handlers ── */
  const handleUseIdea = useCallback((data) => {
    setInjectedData(data);
    setComposerOpen(true);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "var(--canvas)", 
      padding: "24px 32px",
      maxWidth: 1600,
      margin: "0 auto",
    }}>
      {/* ── HEADER ── */}
      <header style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
           <div style={{ 
             background: "var(--ink)", 
             color: "var(--white)", 
             width: 32, 
             height: 32, 
             borderRadius: 10, 
             display: "flex", 
             alignItems: "center", 
             justifyContent: "center",
             boxShadow: "0 8px 16px rgba(20,20,19,0.15)"
           }}>
             <Flame size={18} style={{ color: "var(--arc)" }} />
           </div>
           <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)", margin: 0, letterSpacing: "-0.03em" }}>
             All Trends
           </h1>
        </div>
        <p style={{ fontSize: 16, color: "var(--slate)", margin: 0, fontWeight: 450 }}>
          The ultimate content discovery engine. Find what's viral and post in seconds.
        </p>

        {/* Stats Strip */}
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
           {[
             { label: "Trending Now", val: news.length, color: "rgba(243,115,56,0.1)", text: "var(--arc)" },
             { label: "Memes Found", val: memes.length, color: "rgba(99,102,241,0.1)", text: "#6366f1" },
             { label: "Visual Inspo", val: images.length, color: "rgba(5,150,105,0.1)", text: "#059669" },
           ].map(stat => (
             <div key={stat.label} style={{ 
               background: "var(--white)", 
               padding: "10px 16px", 
               borderRadius: 14, 
               display: "flex", 
               alignItems: "center", 
               gap: 10,
               border: "1px solid rgba(20,20,19,0.06)",
               boxShadow: "0 2px 10px rgba(20,20,19,0.02)"
             }}>
               <div style={{ width: 6, height: 6, borderRadius: "50%", background: stat.text }} />
               <div style={{ display: "flex", flexDirection: "column" }}>
                 <span style={{ fontSize: 10, fontWeight: 800, color: "var(--dust)", textTransform: "uppercase" }}>{stat.label}</span>
                 <span style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>{stat.val}+</span>
               </div>
             </div>
           ))}
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "300px 1fr", 
        gap: 32,
        alignItems: "flex-start",
      }} className="trends-layout">
        
        {/* Left Sidebar: Filters */}
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
          
          <motion.div 
            whileHover={{ y: -4 }}
            style={{ 
              marginTop: 32, 
              padding: '24px 20px', 
              background: "linear-gradient(135deg, rgba(243,115,56,0.06), rgba(243,115,56,0.02))", 
              borderRadius: 24, 
              border: "1px solid rgba(243,115,56,0.12)",
              boxShadow: "0 12px 30px rgba(243,115,56,0.04)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
               <div style={{
                 width: 28,
                 height: 28,
                 borderRadius: 8,
                 background: "var(--arc)",
                 color: "white",
                 display: "flex",
                 alignItems: "center",
                 justifyContent: "center"
               }}>
                 <Sparkles size={14} />
               </div>
               <span style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>Pro Tip</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--slate)", margin: 0, lineHeight: 1.6, fontWeight: 500 }}>
              Use memes to increase engagement by <span style={{ color: "var(--arc)", fontWeight: 800 }}>up to 40%</span>. Our engine suggests relevant humor for every trend.
            </p>
          </motion.div>
        </aside>

        {/* Right Section: Grid & Controls */}
        <main>
          {/* Top Controls */}
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: 24,
            background: "var(--white)",
            padding: "12px 20px",
            borderRadius: 16,
            border: "1px solid rgba(20,20,19,0.06)",
            boxShadow: "0 2px 12px rgba(20,20,19,0.02)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <LayoutGrid size={16} style={{ color: "var(--dust)" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
                {processedTrends.length} Discoveries
              </span>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
               <select 
                 value={sortOrder}
                 onChange={e => setSortOrder(e.target.value)}
                 style={{
                   padding: "8px 12px",
                   borderRadius: 10,
                   border: "1.5px solid rgba(20,20,19,0.08)",
                   background: "var(--canvas)",
                   fontSize: 12,
                   fontWeight: 700,
                   outline: "none",
                   cursor: "pointer",
                 }}
               >
                 <option value="score">🔥 Top Score</option>
                 <option value="latest">🕐 Latest First</option>
               </select>

               <motion.button
                 whileHover={{ rotate: 180 }}
                 transition={{ duration: 0.5 }}
                 onClick={handleRefresh}
                 style={{
                   width: 36,
                   height: 36,
                   borderRadius: 10,
                   border: "1.5px solid rgba(20,20,19,0.08)",
                   background: "var(--white)",
                   display: "flex",
                   alignItems: "center",
                   justifyContent: "center",
                   cursor: "pointer",
                   color: "var(--slate)"
                 }}
               >
                 <RefreshCw size={16} />
               </motion.button>
            </div>
          </div>

          {/* Grid */}
          <TrendGrid
            trends={processedTrends}
            apiData={{ news, memes, images }}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onLoadMore={loadMore}
            onUseIdea={handleUseIdea}
          />
        </main>
      </div>

      {/* ── MODALS & TOASTS ── */}
      <InjectedToast visible={toastVisible} />

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
            initialMediaUrls={[...(injectedData?.images || []), ...(injectedData?.memes || [])].slice(0, 5)}
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
            margin-bottom: 24px;
          }
        }
      `}</style>
    </div>
  );
}
