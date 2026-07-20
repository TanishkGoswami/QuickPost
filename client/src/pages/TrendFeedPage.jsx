import React, { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, RefreshCw, Sparkles } from "lucide-react";
import apiClient from "../utils/apiClient";

const PAGE_SIZE = 18;

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

function TrendCard({ post }) {
  return (
    <article className="trend-feed-card">
      <a href={post.source_url} target="_blank" rel="noreferrer" className="trend-feed-media">
        {post.thumbnail_url ? (
          <img src={post.thumbnail_url} alt="" loading="lazy" />
        ) : (
          <span>{post.source_platform}</span>
        )}
      </a>
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
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState("");
  const sentinelRef = useRef(null);
  const cursorRef = useRef(null);
  const loadingRef = useRef(false);

  const loadPage = useCallback(async ({ reset = false } = {}) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError("");

    try {
      const nextCursor = reset ? null : cursorRef.current;
      const { data } = await apiClient.get("/api/trends/feed", {
        params: { limit: PAGE_SIZE, cursor: nextCursor || undefined },
      });
      const nextItems = data.items || [];
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
  }, []);

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
        .trend-feed-grid {
          column-width: 280px;
          column-gap: 16px;
        }
        .trend-feed-card {
          break-inside: avoid;
          display: inline-block;
          width: 100%;
          margin: 0 0 16px;
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
          height: 1px;
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
        }
      `}</style>

      <header className="trend-feed-top">
        <div>
          <span className="trend-feed-kicker"><Sparkles size={14} /> Inspiration feed</span>
          <h1>Signals worth remixing today.</h1>
        </div>
        <button className="trend-feed-refresh" type="button" onClick={() => loadPage({ reset: true })} disabled={loading}>
          <RefreshCw size={15} />
          Refresh
        </button>
      </header>

      {error && <div className="trend-feed-state">{error}</div>}
      {!error && !initialLoaded && <div className="trend-feed-state">Loading trends...</div>}
      {!error && initialLoaded && items.length === 0 && <div className="trend-feed-state">No trend posts yet.</div>}
      {!error && items.length > 0 && (
        <div className="trend-feed-grid">
          {items.map((post) => (
            <TrendCard key={post.id} post={post} />
          ))}
        </div>
      )}
      <div ref={sentinelRef} className="trend-feed-sentinel" aria-hidden="true" />
      {loading && initialLoaded && <div className="trend-feed-state">Loading more...</div>}
    </section>
  );
}
