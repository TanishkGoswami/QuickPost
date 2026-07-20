import React, {
  useState, useMemo, useCallback, useEffect, useRef, Suspense, lazy, memo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, BookmarkCheck, RefreshCw, X, Bookmark, CheckCircle2, Filter } from "lucide-react";
import { useAllTrends } from "./hooks/useAllTrends";
import { SearchBar, StatsBar, Empty, Toast } from "./components/TrendUI";
import { NormalizedTrendCard, Skeleton } from "./components/TrendCards";
import { Sentinel, BalancedMasonry } from "./components/Masonry";

const ComposerModal = lazy(() => import("../../components/ComposerModal"));

const TABS = ["For You", "Trending Now", "Rising", "Social", "News", "Technology", "Saved"];
const WINDOWS = [
  { id: "all", label: "Any time", hours: null },
  { id: "1h", label: "1 hour", hours: 1 },
  { id: "6h", label: "6 hours", hours: 6 },
  { id: "24h", label: "24 hours", hours: 24 },
  { id: "7d", label: "7 days", hours: 168 },
];
const EMPTY = "All";
const SOCIAL_SOURCES = new Set(["reddit", "bluesky", "mastodon", "lemmy", "youtube"]);
const NEWS_SOURCES = new Set(["news", "google-news"]);
const TECH_SOURCES = new Set(["hacker-news", "github", "dev", "stack-overflow"]);
const SKH = [180, 260, 220, 300, 190, 240, 280, 210];

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

function displaySource(source = "") {
  return String(source || "trend").split("-").map(part => part ? part[0].toUpperCase() + part.slice(1) : "").join(" ");
}

function unique(items, get) {
  return [...new Set(items.map(get).filter(Boolean))].sort();
}

function sourceKeys(item) {
  const badges = Array.isArray(item.platformBadges) ? item.platformBadges : [];
  return [item.source, ...badges].filter(Boolean).map(source => String(source).toLowerCase());
}

function toCardItem(item, i) {
  const source = item.source || "trend";
  const sourceLabel = displaySource(source);
  const platformBadges = Array.isArray(item.platformBadges) && item.platformBadges.length
    ? item.platformBadges.map(displaySource)
    : [sourceLabel];

  return {
    ...item,
    _sid: item.id || `${source}-${i}`,
    _sourceKeys: sourceKeys(item),
    source: sourceLabel,
    platformBadges,
    title: item.title || "Untitled trend",
    summary: item.description || "",
    url: item.originalUrl || "",
    image: item.imageUrl || "",
    score: Number.isFinite(item.trendScore) ? item.trendScore : null,
    opportunityScore: Number.isFinite(item.opportunityScore) ? item.opportunityScore : null,
    niche: item.category || "Trending",
    hashtags: Array.isArray(item.tags) ? item.tags : [],
    crossPlatformCount: item.crossPlatformCount || platformBadges.length || 1,
  };
}

function matchesTab(item, tab, savedIds) {
  if (tab === "Saved") return savedIds.has(item._sid);
  if (tab === "Rising") return item.lifecycle === "rising";
  if (tab === "Trending Now") return item.lifecycle === "hot" || (item.score ?? 0) >= 70;
  if (tab === "Social") return item._sourceKeys.some(source => SOCIAL_SOURCES.has(source));
  if (tab === "News") return item._sourceKeys.some(source => NEWS_SOURCES.has(source)) || item.type === "article";
  if (tab === "Technology") return item.category === "AI & Tech" || item._sourceKeys.some(source => TECH_SOURCES.has(source));
  return true;
}

function withinWindow(item, windowId) {
  const window = WINDOWS.find(w => w.id === windowId);
  if (!window?.hours || !item.publishedAt) return true;
  return Date.now() - new Date(item.publishedAt).getTime() <= window.hours * 60 * 60 * 1000;
}

function SelectFilter({ label, value, options, onChange }) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium text-zinc-600">
      <span>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className="h-9 rounded-lg border border-[#d3cec6] bg-white px-3 text-xs font-medium text-zinc-900 outline-none transition-colors hover:border-zinc-900 focus:border-zinc-900">
        <option value={EMPTY}>{EMPTY}</option>
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

const SavedPanel = memo(function SavedPanel({ open, onClose, savedIds, allItems, onUse, onSave }) {
  const items = allItems.filter(x => savedIds.has(x._sid));
  return (
    <AnimatePresence>
      {open && <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[300]" />
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="fixed bottom-0 right-0 top-0 z-[301] flex w-[min(420px,94vw)] flex-col border-l border-[#d3cec6] bg-[#f5f1ec]">
          <div className="flex items-center justify-between border-b border-[#d3cec6] bg-white px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 m-0 tracking-tight">Saved Trends</h2>
              <p className="text-xs text-zinc-500 mt-1 font-medium">{items.length} item{items.length !== 1 ? "s" : ""}</p>
            </div>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d3cec6] bg-white text-zinc-600 hover:border-zinc-900 hover:text-zinc-900" aria-label="Close saved trends">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {items.length === 0 ? (
              <div className="text-center py-20 px-5 max-w-[280px] mx-auto">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg border border-[#d3cec6] bg-white">
                  <Bookmark className="w-6 h-6 text-zinc-500" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900 mb-2">Nothing saved yet</h3>
                <p className="text-zinc-500 text-sm">Save a trend to keep it here.</p>
              </div>
            ) : items.map((item, i) => (
              <NormalizedTrendCard key={item._sid} item={item} idx={i} onUse={onUse} saved={savedIds.has(item._sid)} onSave={onSave} />
            ))}
          </div>
        </motion.div>
      </>}
    </AnimatePresence>
  );
});

export default function AllTrendsPage() {
  const [activeTab, setActiveTab] = useState("For You");
  const [search, setSearch] = useState("");
  const [source, setSource] = useState(EMPTY);
  const [category, setCategory] = useState(EMPTY);
  const [country, setCountry] = useState(EMPTY);
  const [language, setLanguage] = useState(EMPTY);
  const [timeWindow, setTimeWindow] = useState("all");
  const [composerOpen, setComposerOpen] = useState(false);
  const [injected, setInjected] = useState(null);
  const [toast, setToast] = useState(false);
  const [savedPanel, setSavedPanel] = useState(false);
  const toastRef = useRef(null);
  const { ids: savedIds, toggle: toggleSave } = useSaved();

  const backendCategory = category !== EMPTY ? category : "All";
  const backendSort = activeTab === "Rising" || activeTab === "Trending Now" || activeTab === "For You" ? "score" : "latest";
  const { items, counts, loading, loadingMore, error, hasMore, refetch, loadMore } = useAllTrends(search, {
    limit: 60,
    niche: backendCategory,
    sort: backendSort,
    enrich: false,
    newsCategories: "technology,business,entertainment,sports,finance,science,world,health,politics",
  });

  const allFlat = useMemo(() => items.map(toCardItem), [items]);
  const options = useMemo(() => ({
    sources: unique(allFlat.flatMap(item => item.platformBadges || []), x => x),
    categories: unique(allFlat, item => item.category),
    countries: unique(allFlat, item => item.country),
    languages: unique(allFlat, item => item.language),
  }), [allFlat]);

  const feed = useMemo(() => allFlat
    .filter(item => matchesTab(item, activeTab, savedIds))
    .filter(item => source === EMPTY || item.platformBadges?.includes(source))
    .filter(item => category === EMPTY || item.category === category)
    .filter(item => country === EMPTY || item.country === country)
    .filter(item => language === EMPTY || item.language === language)
    .filter(item => withinWindow(item, timeWindow))
    .sort((a, b) => backendSort === "latest"
      ? new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0)
      : (b.score ?? -1) - (a.score ?? -1)),
  [allFlat, activeTab, savedIds, source, category, country, language, timeWindow, backendSort]);

  const masonryFeed = useMemo(() => {
    const cards = feed.map(item => ({ type: "item", item }));
    if (!loadingMore) return cards;
    return [...cards, ...SKH.slice(0, 4).map((height, index) => ({ type: "skeleton", height, key: `trend-load-${index}` }))];
  }, [feed, loadingMore]);

  const handleUse = useCallback((data) => {
    setInjected(data);
    setComposerOpen(true);
    clearTimeout(toastRef.current);
    setToast(true);
    toastRef.current = setTimeout(() => setToast(false), 3000);
  }, []);

  useEffect(() => () => clearTimeout(toastRef.current), []);

  return (
    <div className="min-h-screen bg-[#f5f1ec] font-sans text-zinc-900 antialiased selection:bg-[#ebe7e1]">
      <div className="sticky top-0 z-50 border-b border-[#d3cec6] bg-[#f5f1ec]/95 px-4 py-3 backdrop-blur md:px-8">
        <div className="mb-3 flex flex-col items-start gap-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="m-0 text-[19px] font-semibold leading-tight text-zinc-900">Trend Intelligence</h1>
              <p className="m-0 mt-0.5 text-[12px] font-medium text-zinc-600">Live discovery desk</p>
            </div>
          </div>
          <div className="w-full lg:flex-1 lg:ml-4">
            <SearchBar value={search} onChange={setSearch} onClear={() => setSearch("")} />
          </div>
          <div className="flex w-full shrink-0 justify-end gap-2.5 lg:w-auto">
            <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} onClick={() => setSavedPanel(true)} className={`flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors ${savedIds.size > 0 ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-[#d3cec6] bg-white text-zinc-700 hover:border-zinc-900 hover:text-zinc-900'}`}>
              <BookmarkCheck className="w-4 h-4" />
              {savedIds.size > 0 ? savedIds.size : "Saved"}
            </motion.button>
            <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.95 }} onClick={refetch} disabled={loading} className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#d3cec6] bg-white text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900 disabled:opacity-50" aria-label="Refresh trends">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </motion.button>
          </div>
        </div>

        <div className="no-scrollbar flex gap-1.5 overflow-x-auto py-1" role="tablist" aria-label="Trend tabs">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} role="tab" aria-selected={activeTab === tab} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === tab ? 'bg-zinc-900 text-white' : 'bg-[#ebe7e1] text-zinc-700 hover:bg-white hover:text-zinc-900'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1920px] px-4 py-5 md:px-8">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col justify-between gap-4 border-b border-[#d3cec6] pb-4 xl:flex-row xl:items-center">
            <StatsBar {...counts} videos={counts.youtube} total={feed.length} loading={loading} />
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 inline-flex items-center gap-1 text-xs font-medium text-zinc-600"><Filter className="h-3.5 w-3.5" /> Filters</span>
              <SelectFilter label="Source" value={source} options={options.sources} onChange={setSource} />
              <SelectFilter label="Category" value={category} options={options.categories} onChange={setCategory} />
              <SelectFilter label="Country" value={country} options={options.countries} onChange={setCountry} />
              <SelectFilter label="Language" value={language} options={options.languages} onChange={setLanguage} />
              <select value={timeWindow} onChange={e => setTimeWindow(e.target.value)} className="h-9 rounded-lg border border-[#d3cec6] bg-white px-3 text-xs font-medium text-zinc-900 outline-none transition-colors hover:border-zinc-900 focus:border-zinc-900" aria-label="Time window">
                {WINDOWS.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {error && !loading && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center gap-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <span className="text-xl">!</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800 mb-1">Couldn't load some sources</p>
              <p className="text-xs text-red-600/80 m-0">{error}</p>
            </div>
            <button onClick={refetch} className="rounded-lg border border-red-700 bg-red-700 px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-800">Retry</button>
          </motion.div>
        )}

        {loading && feed.length === 0 && (
          <BalancedMasonry items={SKH.map((height, index) => ({ type: "skeleton", height, key: `initial-${index}` }))} renderItem={(entry, index, columnIndex) => (
            <Skeleton key={entry.key} dark={(index + columnIndex) % 3 === 1} imgH={entry.height} />
          )} />
        )}

        {!loading && feed.length === 0 && <Empty search={search || "current filters"} onClear={() => { setSearch(""); setSource(EMPTY); setCategory(EMPTY); setCountry(EMPTY); setLanguage(EMPTY); setTimeWindow("all"); }} />}

        {feed.length > 0 && (
          <BalancedMasonry items={masonryFeed} renderItem={(entry, index, columnIndex) => (
            entry.type === "skeleton"
              ? <Skeleton key={entry.key} imgH={entry.height} dark={(index + columnIndex) % 2 === 1} />
              : <NormalizedTrendCard key={entry.item._sid} item={entry.item} idx={index} onUse={handleUse} saved={savedIds.has(entry.item._sid)} onSave={toggleSave} />
          )} />
        )}

        <Sentinel hasMore={hasMore && activeTab !== "Saved"} loading={loading || loadingMore} onMore={loadMore} count={feed.length} />

        {!hasMore && feed.length > 0 && (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#d3cec6] bg-white">
              <CheckCircle2 className="w-5 h-5 text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-500 font-medium m-0">You've seen everything</p>
          </div>
        )}
      </div>

      <SavedPanel open={savedPanel} onClose={() => setSavedPanel(false)} savedIds={savedIds} allItems={allFlat} onUse={handleUse} onSave={toggleSave} />

      {composerOpen && (
        <Suspense fallback={null}>
          <ComposerModal isOpen={composerOpen} onClose={() => { setComposerOpen(false); setInjected(null); }} initialCaption={injected?.caption || ""} initialHashtags={injected?.hashtags || []} initialMediaUrls={[
            ...(injected?.images || []),
            ...(injected?.memes || []),
            ...(injected?.videoUrls || []),
          ].slice(0, 5)} />
        </Suspense>
      )}

      <Toast show={toast} />
    </div>
  );
}
