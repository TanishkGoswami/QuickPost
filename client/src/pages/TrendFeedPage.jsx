import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Briefcase, ExternalLink, RefreshCw, Sparkles, SlidersHorizontal } from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";
import { useAuth } from "../context/AuthContext";
import apiClient from "../utils/apiClient";

const PAGE_SIZE = 18;
const MAX_SEEN_IDS = 200;

function emptyProfile() {
  return { work: "", interests: "", goal: "" };
}

function profileToInterestQuery(profile) {
  return [profile?.work, profile?.interests, profile?.goal]
    .filter(Boolean)
    .join(",");
}

function getHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

function formatScore(value) {
  const score = Number(value || 0);
  if (score >= 1000000) return `${(score / 1000000).toFixed(1)}M`;
  if (score >= 1000) return `${(score / 1000).toFixed(1)}K`;
  return String(Math.round(score));
}

function formatDate(value) {
  if (!value) return "Fresh";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
}

function getOfficialEmbedSrc(post) {
  const htmlSrc = post.embed_html?.match(/\ssrc=["']([^"']+)["']/i)?.[1];
  const candidates = [htmlSrc, post.source_url];

  for (const value of candidates) {
    try {
      const url = new URL(value);
      const host = url.hostname.replace(/^www\./, "");
      const videoId = host === "youtu.be"
        ? url.pathname.split("/").filter(Boolean)[0]
        : url.pathname.startsWith("/watch")
          ? url.searchParams.get("v")
          : url.pathname.startsWith("/embed/")
            ? url.pathname.split("/").filter(Boolean)[1]
            : null;

      if (!videoId || !/^[a-zA-Z0-9_-]{6,}$/.test(videoId)) continue;
      const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);
      if (window.location?.origin) embedUrl.searchParams.set("origin", window.location.origin);
      return embedUrl.toString();
    } catch {
      // Keep bad source data out of the DOM and fall through to thumbnail rendering.
    }
  }

  return "";
}

function TrendMedia({ post }) {
  const embedSrc = post.source_platform === "youtube" ? getOfficialEmbedSrc(post) : "";

  if (embedSrc) {
    return (
      <div className="trend-feed-media">
        <iframe
          src={embedSrc}
          title={post.caption || "YouTube trend video"}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <a href={post.source_url} target="_blank" rel="noreferrer" className="trend-feed-media">
      {post.thumbnail_url ? (
        <img src={post.thumbnail_url} alt="" loading="lazy" />
      ) : (
        <span>{post.source_platform}</span>
      )}
    </a>
  );
}

function TrendCard({ post }) {
  return (
    <article className="trend-feed-card">
      <TrendMedia post={post} />
      <div className="trend-feed-card-body">
        <div className="trend-feed-card-meta">
          <span>{post.source_platform}</span>
          <span>{formatDate(post.published_at || post.ingested_at)}</span>
          <span>{formatScore(post.rank_score)} velocity</span>
        </div>
        <h2>{post.caption || "Untitled inspiration"}</h2>
        <a href={post.source_url} target="_blank" rel="noreferrer" className="trend-feed-source">
          {getHost(post.source_url)}
          <ExternalLink size={13} />
        </a>
      </div>
    </article>
  );
}

export default function TrendFeedPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(emptyProfile);
  const [draftProfile, setDraftProfile] = useState(emptyProfile);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const sentinelRef = useRef(null);
  const cursorRef = useRef(null);
  const loadingRef = useRef(false);
  const seenRef = useRef(new Set());
  const seenStorageKey = `qp_trend_seen_${user?.userId || user?.email || "anon"}`;
  const profileStorageKey = `qp_trend_profile_${user?.userId || user?.email || "anon"}`;
  const interestQuery = useMemo(() => profileToInterestQuery(profile), [profile]);

  useEffect(() => {
    try {
      seenRef.current = new Set(JSON.parse(localStorage.getItem(seenStorageKey) || "[]"));
    } catch {
      seenRef.current = new Set();
    }
  }, [seenStorageKey]);

  useEffect(() => {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(profileStorageKey) || "null");
    } catch {
      saved = null;
    }

    const nextProfile = saved?.interests ? saved : emptyProfile();
    setProfile(nextProfile);
    setDraftProfile(nextProfile);
    setShowProfilePanel(!saved?.interests);
  }, [profileStorageKey]);

  const rememberSeen = useCallback((posts) => {
    const seen = seenRef.current;
    posts.forEach((post) => {
      if (post?.id) seen.add(post.id);
    });
    const trimmed = Array.from(seen).slice(-MAX_SEEN_IDS);
    seenRef.current = new Set(trimmed);
    localStorage.setItem(seenStorageKey, JSON.stringify(trimmed));
  }, [seenStorageKey]);

  const loadPage = useCallback(async ({ reset = false } = {}) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError("");

    try {
      const nextCursor = reset ? null : cursorRef.current;
      const { data } = await apiClient.get("/api/trends/feed", {
        params: {
          limit: PAGE_SIZE,
          cursor: nextCursor || undefined,
          seen: Array.from(seenRef.current).join(",") || undefined,
          interests: interestQuery || undefined,
        },
      });
      const nextItems = data.items || [];
      rememberSeen(nextItems);
      setItems((current) => (reset ? nextItems : [...current, ...nextItems]));
      setCursor(data.nextCursor || null);
      cursorRef.current = data.nextCursor || null;
      setInitialLoaded(true);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load trends");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [interestQuery, rememberSeen]);

  const saveProfile = useCallback((event) => {
    event.preventDefault();
    const nextProfile = {
      work: draftProfile.work.trim(),
      interests: draftProfile.interests.trim(),
      goal: draftProfile.goal.trim(),
    };
    setProfile(nextProfile);
    localStorage.setItem(profileStorageKey, JSON.stringify(nextProfile));
    setShowProfilePanel(false);
    cursorRef.current = null;
  }, [draftProfile, profileStorageKey]);

  useEffect(() => {
    loadPage({ reset: true });
  }, [loadPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && cursorRef.current && !loadingRef.current) {
          loadPage();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadPage]);

  return (
    <section className="trend-feed-page">
      <style>{`
        .trend-feed-page {
          min-height: 100%;
          padding: 30px clamp(16px, 3vw, 34px) 48px;
          background: #f6f2ec;
          color: #17130f;
        }
        .trend-feed-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 18px;
          margin-bottom: 24px;
        }
        .trend-feed-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #a64000;
          font-size: 12px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .trend-feed-top h1 {
          margin: 8px 0 0;
          font-size: clamp(34px, 5vw, 64px);
          line-height: 0.92;
          letter-spacing: 0;
          max-width: 760px;
        }
        .trend-feed-refresh {
          height: 38px;
          border: 1px solid rgba(23, 19, 15, 0.14);
          border-radius: 8px;
          background: #fffaf4;
          color: #17130f;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 14px;
          font-weight: 700;
          cursor: pointer;
        }
        .trend-feed-actions {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .trend-feed-profile-button {
          width: 38px;
          height: 38px;
          border: 1px solid rgba(23, 19, 15, 0.14);
          border-radius: 8px;
          background: #fffaf4;
          color: #17130f;
          display: inline-grid;
          place-items: center;
          cursor: pointer;
        }
        .trend-feed-pill-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin: -10px 0 20px;
        }
        .trend-feed-pill {
          border: 1px solid rgba(166, 64, 0, 0.2);
          border-radius: 999px;
          padding: 7px 10px;
          background: #fffaf4;
          color: #a64000;
          font-size: 12px;
          font-weight: 750;
        }
        .trend-feed-grid {
          height: min(980px, calc(100vh - 210px));
        }
        .trend-feed-static-grid,
        .trend-feed-virtual-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
          align-items: start;
        }
        .trend-feed-virtual-item {
          min-width: 0;
        }
        .trend-feed-card {
          width: 100%;
          height: 100%;
          border: 1px solid rgba(23, 19, 15, 0.11);
          border-radius: 8px;
          overflow: hidden;
          background: #fffdf9;
          box-shadow: 0 18px 40px rgba(34, 24, 14, 0.07);
        }
        .trend-feed-media {
          display: block;
          aspect-ratio: 16 / 9;
          background: #1d1712;
          color: #fffaf4;
          overflow: hidden;
          text-decoration: none;
        }
        .trend-feed-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .trend-feed-media iframe {
          width: 100%;
          height: 100%;
          border: 0;
          display: block;
        }
        .trend-feed-media span {
          height: 100%;
          display: grid;
          place-items: center;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 12px;
          font-weight: 800;
        }
        .trend-feed-card-body {
          padding: 14px;
        }
        .trend-feed-card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 10px;
          color: rgba(23, 19, 15, 0.58);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .trend-feed-card h2 {
          margin: 0;
          font-size: 15px;
          line-height: 1.35;
          letter-spacing: 0;
          display: -webkit-box;
          -webkit-line-clamp: 5;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .trend-feed-source {
          margin-top: 14px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #a64000;
          font-size: 12px;
          font-weight: 750;
          text-decoration: none;
        }
        .trend-feed-state {
          min-height: 180px;
          display: grid;
          place-items: center;
          border: 1px dashed rgba(23, 19, 15, 0.18);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.5);
          color: rgba(23, 19, 15, 0.62);
          font-weight: 700;
        }
        .trend-feed-sentinel {
          height: 40px;
        }
        .trend-feed-profile-backdrop {
          position: fixed;
          inset: 0;
          z-index: 40;
          display: grid;
          place-items: center;
          padding: 18px;
          background: rgba(23, 19, 15, 0.38);
        }
        .trend-feed-profile-panel {
          width: min(560px, 100%);
          border: 1px solid rgba(23, 19, 15, 0.12);
          border-radius: 8px;
          background: #fffdf9;
          box-shadow: 0 28px 80px rgba(23, 19, 15, 0.22);
          padding: 22px;
        }
        .trend-feed-profile-panel h2 {
          margin: 10px 0 6px;
          font-size: 28px;
          line-height: 1.05;
          letter-spacing: 0;
        }
        .trend-feed-profile-panel p {
          margin: 0 0 18px;
          color: rgba(23, 19, 15, 0.64);
          line-height: 1.45;
        }
        .trend-feed-profile-panel label {
          display: grid;
          gap: 7px;
          margin-bottom: 13px;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          color: rgba(23, 19, 15, 0.62);
        }
        .trend-feed-profile-panel input,
        .trend-feed-profile-panel textarea {
          width: 100%;
          border: 1px solid rgba(23, 19, 15, 0.14);
          border-radius: 8px;
          background: #f8f3ec;
          color: #17130f;
          padding: 12px;
          font: inherit;
          outline: none;
        }
        .trend-feed-profile-panel textarea {
          min-height: 84px;
          resize: vertical;
        }
        .trend-feed-profile-panel input:focus,
        .trend-feed-profile-panel textarea:focus {
          border-color: #a64000;
          box-shadow: 0 0 0 3px rgba(166, 64, 0, 0.12);
        }
        .trend-feed-profile-submit {
          width: 100%;
          height: 42px;
          border: 0;
          border-radius: 8px;
          background: #17130f;
          color: #fffaf4;
          font-weight: 800;
          cursor: pointer;
        }
        @media (max-width: 720px) {
          .trend-feed-top {
            align-items: stretch;
            flex-direction: column;
          }
          .trend-feed-refresh {
            justify-content: center;
            width: 100%;
          }
          .trend-feed-actions {
            justify-content: stretch;
          }
          .trend-feed-profile-button {
            flex: 0 0 38px;
          }
        }
      `}</style>

      <header className="trend-feed-top">
        <div>
          <span className="trend-feed-kicker"><Sparkles size={14} /> Inspiration feed</span>
          <h1>Signals worth remixing today.</h1>
        </div>
        <div className="trend-feed-actions">
          <button className="trend-feed-profile-button" type="button" onClick={() => setShowProfilePanel(true)} aria-label="Edit trend interests" title="Edit trend interests">
            <SlidersHorizontal size={16} />
          </button>
          <button className="trend-feed-refresh" type="button" onClick={() => loadPage({ reset: true })} disabled={loading}>
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      </header>

      {interestQuery && (
        <div className="trend-feed-pill-row" aria-label="Trend personalization">
          {profile.work && <span className="trend-feed-pill">{profile.work}</span>}
          {profile.interests.split(",").map((interest) => interest.trim()).filter(Boolean).slice(0, 8).map((interest) => (
            <span className="trend-feed-pill" key={interest}>{interest}</span>
          ))}
        </div>
      )}

      {showProfilePanel && (
        <div className="trend-feed-profile-backdrop" role="dialog" aria-modal="true" aria-labelledby="trend-profile-title">
          <form className="trend-feed-profile-panel" onSubmit={saveProfile}>
            <span className="trend-feed-kicker"><Briefcase size={14} /> Tune your feed</span>
            <h2 id="trend-profile-title">Tell us what you create around.</h2>
            <p>Kaam aur interests save honge, phir feed matching topics ko upar dikhayega.</p>
            <label>
              Your work
              <input
                value={draftProfile.work}
                onChange={(event) => setDraftProfile((current) => ({ ...current, work: event.target.value }))}
                placeholder="Content creator, football page, F1 analyst"
              />
            </label>
            <label>
              Interests
              <input
                value={draftProfile.interests}
                onChange={(event) => setDraftProfile((current) => ({ ...current, interests: event.target.value }))}
                placeholder="F1, FIFA, AI tools, fitness"
                required
              />
            </label>
            <label>
              Content goal
              <textarea
                value={draftProfile.goal}
                onChange={(event) => setDraftProfile((current) => ({ ...current, goal: event.target.value }))}
                placeholder="Reels ideas, breaking news, memes, tutorials"
              />
            </label>
            <button className="trend-feed-profile-submit" type="submit">Show my trends</button>
          </form>
        </div>
      )}

      {error && <div className="trend-feed-state">{error}</div>}
      {!error && !initialLoaded && <div className="trend-feed-state">Loading trends...</div>}
      {!error && initialLoaded && items.length === 0 && <div className="trend-feed-state">No trend posts yet.</div>}
      {!error && items.length > 0 && items.length <= PAGE_SIZE && (
        <div className="trend-feed-static-grid">
          {items.map((post) => <TrendCard key={post.id} post={post} />)}
        </div>
      )}
      {!error && items.length > PAGE_SIZE && (
        <VirtuosoGrid
          className="trend-feed-grid"
          data={items}
          computeItemKey={(_, post) => post.id}
          listClassName="trend-feed-virtual-list"
          itemClassName="trend-feed-virtual-item"
          components={{
            Footer: () => <div ref={sentinelRef} className="trend-feed-sentinel" aria-hidden="true" />,
          }}
          itemContent={(_, post) => <TrendCard post={post} />}
        />
      )}
      <div ref={sentinelRef} className="trend-feed-sentinel" aria-hidden="true" />
      {loading && initialLoaded && <div className="trend-feed-state">Loading more...</div>}
    </section>
  );
}
