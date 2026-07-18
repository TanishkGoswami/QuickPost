import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Flame, Sparkles } from "lucide-react";
import { Btn } from "./components/TrendUI";
import apiClient from "../../utils/apiClient";

const ComposerModal = lazy(() => import("../../components/ComposerModal"));
const BASE = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL || "");
const SELECTS = {
  targetPlatform: ["Instagram", "LinkedIn", "YouTube", "X", "Facebook", "Bluesky"],
  contentLanguage: ["English", "Hindi", "Hinglish"],
  contentFormat: ["Short post", "Carousel", "Reel script", "Thread", "YouTube short"],
  contentGoal: ["Educate", "Engage", "Drive traffic", "Build authority", "Start discussion"],
  tone: ["Clear and practical", "Bold", "Friendly", "Analytical", "Witty"],
  targetAudience: ["Creators", "Founders", "Marketers", "Developers", "General audience"],
};

function fmtNumber(n) {
  const value = Number(n);
  if (!Number.isFinite(value) || value === 0) return null;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}m`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

function fmtDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}

function lifecycleLabel(value) {
  return String(value || "").replace(/^\w/, c => c.toUpperCase());
}

function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function storageItem(id) {
  try { return JSON.parse(sessionStorage.getItem(`trend:${id}`) || sessionStorage.getItem(`trend:${encodeURIComponent(id)}`) || "null"); } catch { return null; }
}

function listText(values) {
  return Array.isArray(values) ? values.join("\n") : "";
}

function setDraftField(draft, key, value) {
  const listFields = new Set(["contentAngles", "hooks", "titles", "hashtags", "claimsRequiringVerification", "sourceReferences"]);
  const nextValue = listFields.has(key) ? value.split("\n").map(line => line.trim()).filter(Boolean) : value;
  return { ...draft, content: { ...draft.content, [key]: nextValue } };
}

function normalizeItem(item = {}) {
  return {
    ...item,
    originalUrl: safeHttpUrl(item.originalUrl || item.url || ""),
    imageUrl: item.imageUrl || item.image || "",
    description: item.description || item.summary || "",
    trendScore: Number.isFinite(item.trendScore) ? item.trendScore : item.score,
    tags: Array.isArray(item.tags) ? item.tags : item.hashtags || [],
    platformBadges: Array.isArray(item.platformBadges) && item.platformBadges.length ? item.platformBadges : [item.source].filter(Boolean),
    clusterItems: Array.isArray(item.clusterItems) ? item.clusterItems : [],
  };
}

function Section({ title, children }) {
  return (
    <section className="bg-white border border-zinc-200/80 rounded-2xl p-5 md:p-6 shadow-sm">
      <h2 className="text-sm font-bold text-zinc-900 tracking-tight mb-4">{title}</h2>
      {children}
    </section>
  );
}

function DraftText({ title, value, onChange, rows = 3 }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-zinc-900">{title}</span>
      <textarea
        value={value || ""}
        onChange={event => onChange(event.target.value)}
        rows={rows}
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-zinc-400"
      />
    </label>
  );
}

function sourceItems(item) {
  const clusterItems = item.clusterItems?.length ? item.clusterItems : [{
    id: item.id,
    source: item.source,
    type: item.type,
    title: item.title,
    originalUrl: safeHttpUrl(item.originalUrl),
    engagement: item.engagement,
    trendScore: item.trendScore,
  }];
  return clusterItems.map(source => ({ ...source, originalUrl: safeHttpUrl(source.originalUrl) })).filter(source => source?.title || source?.originalUrl);
}

function whyTrending(item, sources) {
  const bits = [];
  if (sources.length > 1) bits.push(`${sources.length} stored source items are grouped into this cluster.`);
  if ((item.platformBadges || []).length > 1) bits.push(`It appears across ${(item.platformBadges || []).join(", ")}.`);
  const e = item.engagement || {};
  const engagement = [
    fmtNumber(e.likes) && `${fmtNumber(e.likes)} likes`,
    fmtNumber(e.comments) && `${fmtNumber(e.comments)} comments`,
    fmtNumber(e.shares) && `${fmtNumber(e.shares)} shares`,
    fmtNumber(e.views) && `${fmtNumber(e.views)} views`,
    fmtNumber(e.score) && `${fmtNumber(e.score)} source score`,
  ].filter(Boolean);
  if (engagement.length) bits.push(`Stored engagement includes ${engagement.join(", ")}.`);
  if (item.matchReason && item.matchReason !== "single_item") bits.push(`Cluster match reason: ${item.matchReason}.`);
  return bits.length ? bits : ["This detail is grounded in the stored source item shown below."];
}

export default function TrendDetailPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const [item, setItem] = useState(() => normalizeItem(location.state?.item || storageItem(id) || {}));
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(!item.id);
  const [error, setError] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [form, setForm] = useState({
    targetPlatform: "Instagram",
    contentLanguage: "English",
    contentFormat: "Short post",
    contentGoal: "Educate",
    tone: "Clear and practical",
    targetAudience: "Creators",
  });
  const [draft, setDraft] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`${BASE}/api/trends/cluster/${id}`, { headers: { Accept: "application/json", "ngrok-skip-browser-warning": "true" } })
      .then(res => res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)))
      .then(data => {
        if (!active) return;
        if (data.item) setItem(normalizeItem(data.item));
        setSnapshots(Array.isArray(data.snapshots) ? data.snapshots : []);
      })
      .catch(err => {
        if (active && !item.id) setError(err.message || "Trend detail unavailable");
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    let active = true;
    apiClient.get(`/api/trends/cluster/${id}/content`)
      .then(({ data }) => { if (active && data.draft) setDraft(data.draft); })
      .catch(() => {})
    return () => { active = false; };
  }, [id]);

  const sources = useMemo(() => sourceItems(item), [item]);
  const why = useMemo(() => whyTrending(item, sources), [item, sources]);
  const engagementRows = Object.entries(item.engagement || {}).map(([key, value]) => [key, fmtNumber(value)]).filter(([, value]) => value);
  const breakdown = item.scoreBreakdown || {};
  const hasHistory = snapshots.length > 1;

  const createContent = async () => {
    setGenerating(true);
    setGenerateError("");
    try {
      const { data } = await apiClient.post(`/api/trends/cluster/${id}/content`, form);
      setDraft(data.draft);
    } catch (err) {
      setGenerateError(err.response?.data?.error || err.message || "Failed to generate content");
    } finally {
      setGenerating(false);
    }
  };

  const saveDraft = async () => {
    if (!draft?.id || !draft?.content) return;
    setSavingDraft(true);
    setGenerateError("");
    try {
      const { data } = await apiClient.patch(`/api/trends/content/${draft.id}`, { content: draft.content });
      setDraft(prev => ({ ...prev, ...data.draft }));
    } catch (err) {
      setGenerateError(err.response?.data?.error || err.message || "Failed to save draft");
    } finally {
      setSavingDraft(false);
    }
  };

  if (loading && !item.id) {
    return <div className="min-h-screen bg-[#FAFAFA] p-6"><div className="skeleton-shimmer h-64 rounded-2xl" /></div>;
  }

  if (!item.id) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-6">
        <Link to="/dashboard/trends" className="text-sm font-semibold text-zinc-600">Back to trends</Link>
        <div className="mt-8 bg-white border border-zinc-200 rounded-2xl p-8 text-center">
          <h1 className="text-xl font-bold text-zinc-900">Trend detail unavailable</h1>
          <p className="text-sm text-zinc-500 mt-2">{error || "Open this from a trend card after the feed loads."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900">
      <div className="border-b border-zinc-200 bg-white/85 backdrop-blur-xl px-4 md:px-8 py-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <Link to="/dashboard/trends" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900">
            <ArrowLeft className="w-4 h-4" /> Trends
          </Link>
          <a href="#generate-content" className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-900 text-white text-xs font-medium shadow-sm">
            <Sparkles className="w-3.5 h-3.5" /> Generate Content
          </a>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 grid gap-5">
        <section className="bg-white border border-zinc-200/80 rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-sm font-bold text-zinc-500 mb-3">Trend Summary</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {(item.platformBadges || []).map(source => <span key={source} className="px-2 py-1 rounded-md bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-600">{source}</span>)}
            {item.category && <span className="px-2 py-1 rounded-md bg-white border border-zinc-200 text-xs font-semibold text-zinc-600">{item.category}</span>}
            {item.lifecycle && <span className="px-2 py-1 rounded-md bg-zinc-900 text-white text-xs font-semibold">{lifecycleLabel(item.lifecycle)}</span>}
          </div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-zinc-950 leading-tight">{item.title}</h1>
          {item.description && <p className="mt-4 text-base text-zinc-600 leading-relaxed max-w-3xl">{item.description}</p>}
          <div className="mt-5 flex flex-wrap gap-3 text-xs text-zinc-500">
            {item.publishedAt && <span>Published: <b className="text-zinc-900">{fmtDate(item.publishedAt)}</b></span>}
            {item.crossPlatformCount && <span>Platforms: <b className="text-zinc-900">{item.crossPlatformCount}</b></span>}
            {item.originalUrl && <a href={item.originalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-zinc-900">Primary source <ExternalLink className="w-3 h-3" /></a>}
          </div>
        </section>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-5">
          <Section title="Why It Is Trending">
            <ul className="grid gap-2 text-sm text-zinc-600">
              {why.map(line => <li key={line} className="flex gap-2"><Flame className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />{line}</li>)}
            </ul>
          </Section>

          <Section title="Trend Score Breakdown">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {Number.isFinite(item.trendScore) && <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3"><div className="text-zinc-500">Trend Score</div><b>{item.trendScore}/100</b></div>}
              {Number.isFinite(item.opportunityScore) && <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3"><div className="text-zinc-500">Opportunity</div><b>{item.opportunityScore}/100</b></div>}
              {["engagement", "freshness", "crossPlatformPresence"].map(key => Number.isFinite(breakdown[key]) && (
                <div key={key} className="rounded-xl bg-zinc-50 border border-zinc-200 p-3"><div className="text-zinc-500">{key}</div><b>{breakdown[key]}/100</b></div>
              ))}
            </div>
          </Section>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          <Section title="Available Historical Timeline">
            {hasHistory ? (
              <div className="grid gap-2 text-sm">
                {snapshots.map(s => <div key={`${s.captured_at}-${s.trend_score}`} className="flex justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2"><span>{fmtDate(s.captured_at)}</span><b>{s.trend_score}/100</b></div>)}
              </div>
            ) : <p className="text-sm text-zinc-500">Trend history is being collected.</p>}
          </Section>

          <Section title="Related Keywords">
            {item.tags?.length ? <div className="flex flex-wrap gap-2">{item.tags.map(tag => <span key={tag} className="px-2 py-1 rounded-md bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-600">{tag}</span>)}</div> : <p className="text-sm text-zinc-500">No stored keywords available.</p>}
          </Section>

          <Section title="Cross-Platform Coverage">
            <div className="grid gap-2">
              {(item.platformBadges || []).map(source => <div key={source} className="flex items-center justify-between rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-2 text-sm"><span>{source}</span><b>{sources.filter(s => String(s.source).toLowerCase() === String(source).toLowerCase()).length || 1}</b></div>)}
            </div>
          </Section>
        </div>

        <Section title="Source Posts / Articles">
          <div className="grid gap-3">
            {sources.map((source, index) => (
              <a key={source.id || source.originalUrl || index} href={source.originalUrl || undefined} target="_blank" rel="noreferrer" className="block rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-white p-4 transition-colors">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {source.source && <span className="px-2 py-0.5 rounded-md bg-white border border-zinc-200 text-[10px] font-semibold text-zinc-600">{source.source}</span>}
                  {source.type && <span className="text-[11px] text-zinc-500">{source.type}</span>}
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400 ml-auto" />
                </div>
                <div className="font-semibold text-zinc-900">{source.title}</div>
              </a>
            ))}
          </div>
        </Section>

        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-5">
          <Section title="Real Engagement Values">
            {engagementRows.length ? <div className="flex flex-wrap gap-2">{engagementRows.map(([key, value]) => <span key={key} className="px-2 py-1 rounded-md bg-zinc-50 border border-zinc-200 text-xs text-zinc-600"><b className="text-zinc-900">{value}</b> {key}</span>)}</div> : <p className="text-sm text-zinc-500">No engagement values stored for this trend.</p>}
          </Section>

          <Section title="Content Opportunities">
            <div className="grid gap-3">
              {(item.ideas || []).slice(0, 3).map(idea => <div key={idea} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">{idea}</div>)}
              {item.caption && <div className="rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-700 whitespace-pre-line">{item.caption}</div>}
            </div>
          </Section>
        </div>

        <Section title="Generate Content Action">
          <div id="generate-content" className="grid gap-4">
            <div className="grid md:grid-cols-3 gap-3">
              {Object.entries(SELECTS).map(([key, values]) => (
                <label key={key} className="grid gap-1 text-xs font-semibold text-zinc-500">
                  {key.replace(/([A-Z])/g, " $1").replace(/^\w/, c => c.toUpperCase())}
                  <select value={form[key]} onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 outline-none">
                    {values.map(value => <option key={value} value={value}>{value}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Btn icon={<Sparkles className="w-3.5 h-3.5" />} label={generating ? "Generating..." : "Generate Content"} onClick={createContent} active />
              {draft?.id && <span className="text-xs text-zinc-500">Draft stored: {draft.id}</span>}
              {generateError && <span className="text-xs text-red-600">{generateError}</span>}
            </div>

            {draft?.content && (
              <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <DraftText title="Why this topic matters" value={draft.content.whyThisTopicMatters} onChange={value => setDraft(prev => setDraftField(prev, "whyThisTopicMatters", value))} />
                {[
                  ["Five content angles", draft.content.contentAngles],
                  ["Ten hooks", draft.content.hooks],
                  ["Titles", draft.content.titles],
                  ["Hashtags", draft.content.hashtags],
                  ["Claims requiring verification", draft.content.claimsRequiringVerification],
                  ["Source references", draft.content.sourceReferences],
                ].map(([title, values]) => Array.isArray(values) && values.length > 0 && (
                  <DraftText key={title} title={title} value={listText(values)} rows={Math.min(10, values.length + 1)} onChange={value => setDraft(prev => setDraftField(prev, title === "Five content angles" ? "contentAngles" : title === "Ten hooks" ? "hooks" : title === "Claims requiring verification" ? "claimsRequiringVerification" : title === "Source references" ? "sourceReferences" : title.toLowerCase(), value))} />
                ))}
                {[
                  ["Recommended format", draft.content.recommendedFormat],
                  ["Outline", draft.content.outline],
                  ["Script or post", draft.content.scriptOrPost],
                  ["Caption", draft.content.caption],
                  ["Thumbnail text", draft.content.thumbnailText],
                  ["CTA", draft.content.cta],
                ].map(([title, value]) => value && (
                  <DraftText key={title} title={title} value={value} rows={title === "Script or post" ? 8 : 3} onChange={next => setDraft(prev => setDraftField(prev, title === "Recommended format" ? "recommendedFormat" : title === "Script or post" ? "scriptOrPost" : title === "Thumbnail text" ? "thumbnailText" : title.toLowerCase(), next))} />
                ))}
                <div className="flex flex-wrap gap-2">
                  <button onClick={saveDraft} disabled={savingDraft} className="px-4 py-2 rounded-lg bg-white border border-zinc-200 text-zinc-700 text-xs font-semibold disabled:opacity-60">
                    {savingDraft ? "Saving..." : "Save edits"}
                  </button>
                  <button onClick={() => setComposerOpen(true)} className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-xs font-semibold">
                    Open in Composer
                  </button>
                </div>
              </div>
            )}
          </div>
        </Section>
      </main>

      {composerOpen && (
        <Suspense fallback={null}>
          <ComposerModal isOpen={composerOpen} onClose={() => setComposerOpen(false)} initialCaption={draft?.content?.caption || draft?.content?.scriptOrPost || item.caption || item.title || ""} initialHashtags={draft?.content?.hashtags || item.tags || []} initialMediaUrls={item.imageUrl ? [item.imageUrl] : []} />
        </Suspense>
      )}
    </div>
  );
}
