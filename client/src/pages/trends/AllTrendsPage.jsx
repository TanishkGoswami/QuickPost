import React, {
  useState, useMemo, useCallback, useEffect, useRef, Suspense, lazy, memo
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, BookmarkCheck, RefreshCw, X, Bookmark } from "lucide-react";
import { useAllTrends } from "./hooks/useAllTrends";
import { 
  SearchBar, FilterPills, SortToggle, StatsBar, Empty, Toast, detectNiche 
} from "./components/TrendUI";
import { NewsCard, MemeCard, VideoCard, Skeleton } from "./components/TrendCards";
import { Sentinel, BalancedMasonry } from "./components/Masonry";

const ComposerModal = lazy(() => import("../../components/ComposerModal"));

// ─── SAVED HOOK ─────────────────────────────────────────────────
function useSaved() {
  const [ids, setIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("_gap_saved") || "[]")); } catch { return new Set(); }
  });
  const toggle = useCallback((id) => setIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    try { localStorage.setItem("_gap_saved", JSON.stringify([...next])); } catch {}
    return next;
  }), []);
  return { ids, toggle };
}

// ─── CONSTANTS ──────────────────────────────────────────────────
const SKH = [160, 240, 320, 180, 460, 280, 200, 340, 160, 420];
const LOAD_MORE_SKH = [180, 220, 300, 260, 190, 400];

// ─── SAVED PANEL ────────────────────────────────────────────────
const SavedPanel = memo(function SavedPanel({ open, onClose, savedIds, allItems, onUse, onSave }) {
  const items = allItems.filter(x => savedIds.has(x._sid));
  return (
    <AnimatePresence>
      {open && <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[300]" />
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed right-0 top-0 bottom-0 w-[min(420px,94vw)] bg-[#FAFAFA] z-[301] flex flex-col shadow-2xl">
          <div className="px-6 py-5 border-b border-zinc-200 bg-white flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 m-0 tracking-tight">Saved Trends</h2>
              <p className="text-xs text-zinc-500 mt-1 font-medium">{items.length} item{items.length !== 1 ? "s" : ""}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 border-none rounded-lg cursor-pointer text-zinc-500 hover:text-zinc-900 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {items.length === 0
              ? <div className="text-center py-20 px-5 max-w-[280px] mx-auto">
                  <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
                    <Bookmark className="w-6 h-6 text-zinc-300" />
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900 mb-2">Nothing saved yet</h3>
                  <p className="text-zinc-500 text-sm">Tap the save icon on any card to keep track of trends you like.</p>
                </div>
              : items.map((x, i) => x._type === "meme"
                  ? <MemeCard key={x._sid} item={x} idx={i} onUse={onUse} saved={savedIds.has(x._sid)} onSave={onSave} />
                  : x._type === "video"
                    ? <VideoCard key={x._sid} item={x} idx={i} onUse={onUse} saved={savedIds.has(x._sid)} onSave={onSave} />
                    : <NewsCard key={x._sid} item={x} idx={i} onUse={onUse} saved={savedIds.has(x._sid)} onSave={onSave} />
                )
            }
          </div>
        </motion.div>
      </>}
    </AnimatePresence>
  );
});

// ─── MAIN PAGE ──────────────────────────────────────────────────
export default function AllTrendsPage() {
  const [niche, setNiche] = useState("All");
  const [sort, setSort] = useState("score");
  const [search, setSearch] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [injected, setInjected] = useState(null);
  const [toast, setToast] = useState(false);
  const [savedPanel, setSavedPanel] = useState(false);
  const toastRef = useRef(null);

  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      if (y > lastY && y > 100) setHeaderVisible(false);
      else setHeaderVisible(true);
      setLastY(y);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastY]);

  const { ids: savedIds, toggle: toggleSave } = useSaved();

  const {
    trends: news, memes, videos, loading, loadingMore,
    error, hasMore, refetch, loadMore,
  } = useAllTrends(search, {
    newsLimit: 24, memeLimit: 24, videoLimit: 10,
    newsCategories: "technology,business,entertainment,sports,finance,science,world,health,politics",
  });

  const { newsItems, memeItems, videoItems } = useMemo(() => {
    return {
      newsItems: news.map((n, i) => ({ ...n, _type: "news", _sid: n.url || `n-${i}` })),
      memeItems: memes.map((m, i) => ({ ...m, _type: "meme", _sid: m.url || m.link || `m-${i}` })),
      videoItems: videos.map((v, i) => ({ ...v, _type: "video", _sid: v.url || v.id || `v-${i}` })),
    };
  }, [news, memes, videos]);

  const feed = useMemo(() => {
    let fn = niche === "All" ? newsItems : newsItems.filter(n => detectNiche(n.title).id === niche);
    let fm = niche === "All" ? memeItems : memeItems.filter(m => detectNiche(`${m.title} ${m.subreddit}`).id === niche);
    let fv = niche === "All" ? videoItems : videoItems.filter(v => detectNiche(`${v.title} ${v.channel}`).id === niche);

    if (sort === "saved") {
      fn = fn.filter(n => savedIds.has(n._sid));
      fm = fm.filter(m => savedIds.has(m._sid));
      fv = fv.filter(v => savedIds.has(v._sid));
    }

    const combined = [];
    const batches = [...new Set([...fn, ...fm, ...fv].map(item => item._batch ?? 0))].sort((a, b) => a - b);

    for (const batch of batches) {
      const bn = fn.filter(item => (item._batch ?? 0) === batch);
      const bm = fm.filter(item => (item._batch ?? 0) === batch);
      const bv = fv.filter(item => (item._batch ?? 0) === batch);
      const len = Math.max(bn.length, bm.length, bv.length);

      for (let i = 0; i < len; i++) {
        if (i < bn.length) combined.push(bn[i]);
        if (i < bv.length) combined.push(bv[i]);
        if (i < bm.length) combined.push(bm[i]);
      }
    }

    return combined;
  }, [newsItems, memeItems, videoItems, niche, sort, savedIds]);

  const allFlat = useMemo(() => [...newsItems, ...memeItems, ...videoItems], [newsItems, memeItems, videoItems]);
  const masonryFeed = useMemo(() => {
    const cards = feed.map((item) => ({ type: "item", item }));
    if (!loadingMore) return cards;
    return [
      ...cards,
      ...LOAD_MORE_SKH.map((height, index) => ({
        type: "skeleton",
        height,
        key: `trend-load-${feed.length}-${index}`,
      })),
    ];
  }, [feed, loadingMore]);

  const handleUse = useCallback((data) => {
    setInjected(data);
    setComposerOpen(true);
    clearTimeout(toastRef.current);
    setToast(true);
    toastRef.current = setTimeout(() => setToast(false), 3000);
  }, []);

  const handleSave = useCallback((id) => toggleSave(id), [toggleSave]);

  useEffect(() => () => clearTimeout(toastRef.current), []);

  const prevNiche = useRef(niche);
  useEffect(() => {
    if (prevNiche.current !== niche) { window.scrollTo({ top: 0, behavior: "smooth" }); prevNiche.current = niche; }
  }, [niche]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans antialiased text-zinc-900 selection:bg-zinc-200">
      {/* ── STICKY HEADER ── */}
      <div 
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200/60 px-4 md:px-8 py-4 transition-transform duration-300"
        style={{ transform: headerVisible ? "translateY(0)" : "translateY(-100%)" }}
      >
        <div className="flex flex-col md:flex-row items-center gap-5 mb-4">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center shadow-[0_2px_12px_rgba(0,0,0,0.1)]">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[19px] font-bold text-zinc-900 leading-tight tracking-tight m-0">Trend Intelligence</h1>
              <p className="text-[11px] font-semibold text-zinc-400 tracking-[0.03em] mt-0.5 m-0">LIVE DISCOVERY DESK</p>
            </div>
          </div>

          {/* Search */}
          <div className="w-full md:flex-1 md:ml-4">
            <SearchBar value={search} onChange={setSearch} onClear={() => setSearch("")} />
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 shrink-0 w-full md:w-auto justify-end">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setSavedPanel(true)}
              className={`flex items-center gap-2 px-4 h-10 rounded-lg text-sm font-semibold transition-all border
                ${savedIds.size > 0 ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'}`}
            >
              <BookmarkCheck className="w-4 h-4" />
              {savedIds.size > 0 ? savedIds.size : "Saved"}
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={refetch} disabled={loading}
              className="w-10 h-10 flex items-center justify-center bg-white border border-zinc-200 rounded-lg text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </motion.button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="md:ml-2">
          <FilterPills active={niche} onChange={setNiche} />
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="px-4 md:px-8 py-8 max-w-[1920px] mx-auto">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <StatsBar news={newsItems.length} memes={memeItems.length} videos={videoItems.length} total={feed.length} loading={loading} />
          <SortToggle value={sort} onChange={setSort} />
        </div>

        {/* Error */}
        {error && !loading && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50/50 border border-red-100 rounded-2xl mb-8 flex items-center gap-4">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800 mb-1">Couldn't load some data</p>
              <p className="text-xs text-red-600/80 m-0">{error}</p>
            </div>
            <button onClick={refetch} className="px-5 py-2 bg-red-600 text-white border-none rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors shadow-sm">Retry</button>
          </motion.div>
        )}

        {/* Loading skeletons */}
        {loading && feed.length === 0 && (
          <BalancedMasonry
            items={SKH.map((height, index) => ({ type: "skeleton", height, key: `initial-${index}` }))}
            renderItem={(entry, index, columnIndex) => (
              <Skeleton key={entry.key} dark={(index + columnIndex) % 3 === 1} imgH={entry.height} />
            )}
          />
        )}

        {/* Empty state */}
        {!loading && feed.length === 0 && search && <Empty search={search} onClear={() => setSearch("")} />}

        {/* Main feed */}
        {feed.length > 0 && (
          <BalancedMasonry
            items={masonryFeed}
            fillGaps
            renderItem={(entry, index, columnIndex) =>
              entry.type === "skeleton" || entry.type === "filler"
                ? <Skeleton key={entry.key} imgH={entry.height} dark={(index + columnIndex) % 2 === 1} />
                : entry.item._type === "meme"
                  ? <MemeCard key={entry.item._sid} item={entry.item} idx={index} onUse={handleUse} saved={savedIds.has(entry.item._sid)} onSave={handleSave} />
                  : entry.item._type === "video"
                    ? <VideoCard key={entry.item._sid} item={entry.item} idx={index} onUse={handleUse} saved={savedIds.has(entry.item._sid)} onSave={handleSave} />
                    : <NewsCard key={entry.item._sid} item={entry.item} idx={index} onUse={handleUse} saved={savedIds.has(entry.item._sid)} onSave={handleSave} />
            }
          />
        )}

        {/* Infinite scroll */}
        <Sentinel hasMore={hasMore} loading={loading || loadingMore} onMore={loadMore} count={feed.length} />

        {/* End of feed */}
        {!hasMore && feed.length > 0 && (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-zinc-400" />
            </div>
            <p className="text-sm text-zinc-500 font-medium m-0">You've seen everything</p>
            <button onClick={refetch} className="px-6 py-2.5 bg-transparent border border-zinc-200 rounded-lg text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors mt-2">
              Refresh for new trends
            </button>
          </div>
        )}
      </div>

      {/* Saved panel */}
      <SavedPanel open={savedPanel} onClose={() => setSavedPanel(false)} savedIds={savedIds} allItems={allFlat} onUse={handleUse} onSave={handleSave} />

      {/* Composer */}
      {composerOpen && (
        <Suspense fallback={null}>
          <ComposerModal isOpen={composerOpen} onClose={() => { setComposerOpen(false); setInjected(null); }}
            initialCaption={injected?.caption || ""} initialHashtags={injected?.hashtags || []}
            initialMediaUrls={[
              ...(injected?.images || []),
              ...(injected?.memes || []),
              ...(injected?.videoUrls || [])
            ].slice(0, 5)} />
        </Suspense>
      )}

      {/* Toast */}
      <Toast show={toast} />
    </div>
  );
}
