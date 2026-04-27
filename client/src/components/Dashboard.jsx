import React, { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import Masonry from "react-masonry-css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import {
  Plus,
  Search,
  Clock,
  Share2,
  CheckCircle2,
  XCircle,
  Video,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Play,
  Eye,
  X,
  Lock,
} from "lucide-react";
import apiClient from "../utils/apiClient";
import ComposerModal from "./ComposerModal";
import PostPreviewModal from "./PostPreviewModal";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ── token shortcuts ── */
const css = {
  canvas: "var(--canvas)",
  lifted: "var(--canvas-lifted)",
  ink: "var(--ink)",
  white: "var(--white)",
  slate: "var(--slate)",
  dust: "var(--dust)",
  arc: "var(--arc)",
  shadow: "var(--shadow-card)",
  r_btn: "var(--r-btn)",
  r_hero: "var(--r-hero)",
  r_pill: "var(--r-pill)",
};

/* ── Platform helpers ── */
function getPlatformIcon(id) {
  const s = { width: 14, height: 14, objectFit: "contain" };
  switch (id) {
    case "facebook":
      return (
        <img
          src="/icons/facebook-round-color-icon.svg"
          style={s}
          alt="Facebook"
        />
      );
    case "instagram":
      return (
        <img src="/icons/ig-instagram-icon.svg" style={s} alt="Instagram" />
      );
    case "x":
      return (
        <img src="/icons/x-social-media-round-icon.svg" style={s} alt="X" />
      );
    case "linkedin":
      return <img src="/icons/linkedin-icon.svg" style={s} alt="LinkedIn" />;

    case "youtube":
      return (
        <img src="/icons/youtube-color-icon.svg" style={s} alt="YouTube" />
      );
    case "pinterest":
      return (
        <img
          src="/icons/pinterest-round-color-icon.svg"
          style={s}
          alt="Pinterest"
        />
      );
    case "threads":
      return <img src="/icons/threads-icon.svg" style={s} alt="Threads" />;
    case "mastodon":
      return (
        <img src="/icons/mastodon-round-icon.svg" style={s} alt="Mastodon" />
      );
    case "bluesky":
      return (
        <img
          src="/icons/bluesky-circle-color-icon.svg"
          style={s}
          alt="Bluesky"
        />
      );
    case "reddit":
      return <img src="/icons/reddit-icon.svg" style={s} alt="Reddit" />;
    case "google-business":
      return <img src="/icons/google-icon.svg" style={s} alt="Google" />;
    default:
      return <Share2 size={14} />;
  }
}

function buildPlatforms(post) {
  return [
    {
      id: "linkedin",
      name: "LinkedIn",
      success: post.linkedin_success,
      error: post.linkedin_error,
      url: post.linkedin_url,
    },
    {
      id: "youtube",
      name: "YouTube",
      success: post.youtube_success,
      error: post.youtube_error,
      url: post.youtube_shorts_url || post.youtube_url,
    },
    {
      id: "instagram",
      name: "Instagram",
      success: post.instagram_success,
      error: post.instagram_error,
      url: post.instagram_url,
    },
    {
      id: "facebook",
      name: "Facebook",
      success: post.facebook_success,
      error: post.facebook_error,
      url: post.facebook_url,
    },

    {
      id: "mastodon",
      name: "Mastodon",
      success: post.mastodon_success,
      error: post.mastodon_error,
      url: post.mastodon_url,
    },
    {
      id: "bluesky",
      name: "Bluesky",
      success: post.bluesky_success,
      error: post.bluesky_error,
      url: post.bluesky_url,
    },
    {
      id: "pinterest",
      name: "Pinterest",
      success: post.pinterest_success,
      error: post.pinterest_error,
      url: post.pinterest_url,
    },
    {
      id: "threads",
      name: "Threads",
      success: post.threads_success,
      error: post.threads_error,
      url: post.threads_url,
    },
    {
      id: "x",
      name: "X",
      success: post.x_success,
      error: post.x_error,
      url: post.x_url,
    },
    {
      id: "reddit",
      name: "Reddit",
      success: post.reddit_success,
      error: post.reddit_error,
      url: post.reddit_url,
    },
  ].filter((p) => p.success || (p.error && p.error !== "Not selected"));
}

/* ── Media thumbnail ── */
function MediaThumb({ post, className = "", style = {} }) {
  const isImage =
    post.media_type === "image" ||
    /\.(jpg|jpeg|png|gif|webp)$/i.test(post.video_filename || "");
  const displayUrl = post.thumbnail_url || (isImage ? post.media_url : null);
  return (
    <div
      className={className}
      style={{
        background: "#e8e2da",
        overflow: "hidden",
        position: "relative",
        borderBottom: "1px solid rgba(20,20,19,0.05)",
        ...style,
      }}
    >
      {displayUrl ? (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
          <img
            src={displayUrl}
            alt="Preview"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.5s",
              display: "block",
            }}
            onMouseEnter={(e) => (e.target.style.transform = "scale(1.06)")}
            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
            onError={(e) => {
              e.target.src = "https://placehold.co/300x300?text=Preview";
            }}
          />
          {post.youtube_success && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.12)",
                backdropFilter: "blur(1px)",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  background: "#FF0000",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 24px rgba(255,0,0,0.3)",
                  border: "2px solid rgba(255,255,255,0.2)",
                }}
              >
                <Play
                  size={20}
                  style={{ color: "#fff", fill: "#fff", marginLeft: 3 }}
                />
              </div>
            </div>
          )}
          {/* Subtle bottom gradient for card transition */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 40,
              background:
                "linear-gradient(to top, rgba(20,20,19,0.04), transparent)",
            }}
          />
        </div>
      ) : post.media_type === "image" ? (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            background: "#e8e2da",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(20,20,19,0.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ImageIcon size={22} style={{ color: "#9a9088" }} />
          </div>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "#9a9088",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            No Media
          </span>
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            background: css.ink,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Video size={22} style={{ color: "rgba(243,240,238,0.5)" }} />
          </div>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "rgba(243,240,238,0.4)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            No Video
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Platform badge ── */
function PlatformBadge({ platform }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: "var(--r-chip)",
        fontSize: 10,
        fontWeight: 600,
        background: "rgba(20,20,19,0.03)",
        color: css.ink,
        border: "1px solid rgba(20,20,19,0.06)",
        transition: "all 0.2s",
      }}
    >
      {getPlatformIcon(platform.id)}
      <span style={{ opacity: 0.8 }}>{platform.name}</span>
      <div
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: platform.success ? "#22c55e" : "#ef4444",
          marginLeft: 2,
        }}
      />
    </div>
  );
}

/* ── Pinterest Masonry Card ── */
function PinterestCard({ post, onOpen, formatDate }) {
  const [hovered, setHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const platforms = buildPlatforms(post);
  const isScheduled = post.status === "scheduled";
  const isImage =
    post.media_type === "image" ||
    /\.(jpg|jpeg|png|gif|webp)$/i.test(post.video_filename || "");
  const displayUrl = post.thumbnail_url || (isImage ? post.media_url : null);
  const hasMedia = !!displayUrl;
  const allSuccess = platforms.length > 0 && platforms.every((p) => p.success);

  const ICON_MAP = {
    instagram: "ig-instagram-icon.svg",
    x: "x-social-media-round-icon.svg",
    linkedin: "linkedin-icon.svg",
    youtube: "youtube-color-icon.svg",
    facebook: "facebook-round-color-icon.svg",

    pinterest: "pinterest-round-color-icon.svg",
    threads: "threads-icon.svg",
    mastodon: "mastodon-round-icon.svg",
    bluesky: "bluesky-circle-color-icon.svg",
    reddit: "reddit-icon.svg",
  };

  // Multi-media / carousel detection
  const mediaUrls =
    Array.isArray(post.media_urls) && post.media_urls.length > 1
      ? post.media_urls
      : null;
  const isCarousel = !!mediaUrls;
  const carouselCount = mediaUrls?.length || 1;

  return (
    <div
      className="masonry-card"
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        borderRadius: 20,
        overflow: "hidden",
        cursor: "pointer",
        background: hasMedia ? "transparent" : css.lifted,
        boxShadow: hovered
          ? "0 24px 48px rgba(20,20,19,0.15), 0 4px 12px rgba(20,20,19,0.06)"
          : "0 2px 12px rgba(20,20,19,0.06)",
        transform: hovered ? "translateY(-5px) scale(1.01)" : "none",
        transition:
          "box-shadow 0.35s cubic-bezier(0.2,0.8,0.2,1), transform 0.35s cubic-bezier(0.2,0.8,0.2,1)",
        border: "1px solid rgba(20,20,19,0.07)",
        willChange: "transform",
      }}
    >
      {hasMedia ? (
        /* ─── Image-first: no fixed height, aspect ratio preserved ─── */
        <div
          style={{
            position: "relative",
            lineHeight: 0,
            minHeight: imgLoaded ? 0 : 180,
          }}
        >
          {/* Shimmer shown until image loads */}
          {!imgLoaded && (
            <div
              className="skeleton-shimmer"
              style={{
                position: "absolute",
                inset: 0,
                minHeight: 180,
                zIndex: 1,
              }}
            />
          )}
          <img
            src={displayUrl}
            alt={post.caption || "Post"}
            loading="lazy"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              opacity: imgLoaded ? 1 : 0,
              transition:
                "opacity 0.5s ease, transform 0.55s cubic-bezier(0.2,0.8,0.2,1)",
              transform: hovered ? "scale(1.05)" : "scale(1)",
            }}
            onLoad={() => setImgLoaded(true)}
            onError={(e) => {
              setImgLoaded(true);
              e.target.src =
                "https://placehold.co/400x300/e8e2da/9a9088?text=Preview";
            }}
          />

          {/* ── Carousel: 2-up split preview ── */}
          {isCarousel && mediaUrls[1] && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                pointerEvents: "none",
              }}
            >
              {/* Divider line */}
              <div
                style={{
                  position: "absolute",
                  left: "66.6%",
                  top: 0,
                  bottom: 0,
                  width: 2,
                  background: "rgba(255,255,255,0.6)",
                  zIndex: 2,
                }}
              />
              {/* Second image peek (right 33%) */}
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: "33.3%",
                  overflow: "hidden",
                  zIndex: 1,
                }}
              >
                <img
                  src={mediaUrls[1]}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: 0.85,
                  }}
                />
              </div>
            </div>
          )}

          {/* ── Multi-media count badge (top-left) ── */}
          {isCarousel && (
            <div
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "rgba(10,8,6,0.72)",
                backdropFilter: "blur(8px)",
                borderRadius: 20,
                padding: "3px 8px 3px 6px",
                zIndex: 4,
                pointerEvents: "none",
              }}
            >
              <Layers size={11} style={{ color: "#fff" }} />
              <span
                style={{
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                }}
              >
                {carouselCount}
              </span>
            </div>
          )}

          {/* ── Carousel dot strip (bottom) ── */}
          {isCarousel && (
            <div
              style={{
                position: "absolute",
                bottom: 8,
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                gap: 4,
                zIndex: 4,
                pointerEvents: "none",
              }}
            >
              {Array.from({ length: Math.min(carouselCount, 5) }).map(
                (_, i) => (
                  <div
                    key={i}
                    style={{
                      width: i === 0 ? 14 : 5,
                      height: 5,
                      borderRadius: 3,
                      background: i === 0 ? "#fff" : "rgba(255,255,255,0.45)",
                      transition: "width 0.2s",
                    }}
                  />
                ),
              )}
              {carouselCount > 5 && (
                <span
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 8,
                    fontWeight: 700,
                  }}
                >
                  +{carouselCount - 5}
                </span>
              )}
            </div>
          )}

          {/* YouTube play badge */}
          {post.youtube_success && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
                width: 48,
                height: 48,
                background: "#FF0000",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(255,0,0,0.4)",
                pointerEvents: "none",
              }}
            >
              <Play
                size={20}
                style={{ color: "#fff", fill: "#fff", marginLeft: 3 }}
              />
            </div>
          )}

          {/* ── Hover overlay ── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(10,8,6,0.9) 0%, rgba(10,8,6,0.4) 50%, transparent 100%)",
              opacity: hovered ? 1 : 0,
              transition: "opacity 0.3s ease",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: 14,
              gap: 8,
              pointerEvents: "none",
            }}
          >
            {/* Caption */}
            {post.caption && (
              <p
                style={{
                  color: "rgba(255,255,255,0.93)",
                  fontSize: 12,
                  fontWeight: 500,
                  lineHeight: 1.5,
                  margin: 0,
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  letterSpacing: "-0.01em",
                }}
              >
                {post.caption}
              </p>
            )}

            {/* Bottom row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              {/* Platform icons */}
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                {platforms.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    title={`${p.name}: ${p.success ? "Success" : "Failed"}`}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "#ffffff",
                      boxShadow: "0 1px 6px rgba(0,0,0,0.18)",
                      border: `2px solid ${p.success ? "rgba(34,197,94,0.85)" : "rgba(239,68,68,0.85)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {ICON_MAP[p.id] ? (
                      <img
                        src={`/icons/${ICON_MAP[p.id]}`}
                        alt={p.name}
                        style={{ width: 13, height: 13, objectFit: "contain" }}
                      />
                    ) : (
                      <Share2 size={9} style={{ color: "#fff" }} />
                    )}
                  </div>
                ))}
                {platforms.length > 5 && (
                  <span
                    style={{
                      color: "rgba(255,255,255,0.6)",
                      fontSize: 9,
                      fontWeight: 700,
                    }}
                  >
                    +{platforms.length - 5}
                  </span>
                )}
              </div>

              {/* Date + status dot */}
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: isScheduled
                      ? "#f97316"
                      : allSuccess
                        ? "#22c55e"
                        : "#ef4444",
                    boxShadow: isScheduled
                      ? "0 0 6px rgba(249,115,22,0.7)"
                      : allSuccess
                        ? "0 0 6px rgba(34,197,94,0.7)"
                        : "0 0 6px rgba(239,68,68,0.7)",
                  }}
                />
                <span
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  {new Date(
                    isScheduled ? post.scheduled_for : post.posted_at,
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Media type chip */}
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              padding: "3px 8px",
              borderRadius: 6,
              background: "rgba(10,8,6,0.65)",
              backdropFilter: "blur(12px)",
              color: "rgba(255,255,255,0.9)",
              fontSize: 8,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              border: "1px solid rgba(255,255,255,0.12)",
              pointerEvents: "none",
            }}
          >
            {post.media_type || "media"}
          </div>
        </div>
      ) : (
        /* ─── No media fallback: text card ─── */
        <div style={{ padding: "18px 18px 16px" }}>
          <div
            style={{
              width: "100%",
              paddingBottom: "45%",
              position: "relative",
              borderRadius: 12,
              background:
                post.media_type === "video"
                  ? "linear-gradient(135deg, #1e1c1a 0%, #2a2724 100%)"
                  : "#ede9e4",
              marginBottom: 14,
              overflow: "hidden",
              transition: "opacity 0.3s",
              opacity: hovered ? 0.85 : 1,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {post.media_type === "video" ? (
                <>
                  <Video size={26} style={{ color: "rgba(243,240,238,0.3)" }} />
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: "rgba(243,240,238,0.25)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Video
                  </span>
                </>
              ) : (
                <>
                  <ImageIcon size={26} style={{ color: "#b8b0a6" }} />
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: "#b8b0a6",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    No Media
                  </span>
                </>
              )}
            </div>
          </div>

          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: css.ink,
              margin: "0 0 12px",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {post.caption || (
              <span style={{ color: css.dust, fontStyle: "italic" }}>
                Untitled post
              </span>
            )}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {platforms.slice(0, 3).map((p) => (
              <PlatformBadge key={p.id} platform={p} />
            ))}
            {platforms.length > 3 && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: css.slate,
                  padding: "3px 8px",
                  background: "rgba(20,20,19,0.04)",
                  borderRadius: 6,
                }}
              >
                +{platforms.length - 3}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── List row ── */
function ListRow({ post, expanded, onToggle, formatDate }) {
  const platforms = buildPlatforms(post);
  const isScheduled = post.status === "scheduled";

  return (
    <div
      style={{
        background: css.lifted,
        borderRadius: css.r_hero,
        border: `1.5px solid ${expanded ? "rgba(243, 115, 56, 0.25)" : "rgba(20,20,19,0.06)"}`,
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: expanded ? css.shadow : "0 4px 15px rgba(0,0,0,0.01)",
      }}
    >
      <div
        style={{
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          gap: 20,
          cursor: "pointer",
        }}
        onClick={onToggle}
      >
        <MediaThumb
          post={post}
          style={{
            width: 84,
            height: 84,
            borderRadius: "var(--r-btn)",
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <div className="eyebrow" style={{ fontSize: 9 }}>
              {formatDate(isScheduled ? post.scheduled_for : post.posted_at)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {isScheduled && (
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color: css.arc,
                    background: "rgba(243, 115, 56, 0.08)",
                    padding: "2px 8px",
                    borderRadius: css.r_pill,
                    textTransform: "uppercase",
                  }}
                >
                  Scheduled
                </div>
              )}
              {expanded ? (
                <ChevronUp size={16} style={{ color: css.arc }} />
              ) : (
                <ChevronDown size={16} style={{ color: css.slate }} />
              )}
            </div>
          </div>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: css.ink,
              margin: "0 0 10px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              letterSpacing: "-0.01em",
            }}
          >
            {post.caption || (
              <span style={{ fontStyle: "italic", color: css.dust }}>
                No caption
              </span>
            )}
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {platforms.slice(0, 5).map((p) => (
              <PlatformBadge key={p.id} platform={p} />
            ))}
            {platforms.length > 5 && (
              <div
                style={{
                  padding: "4px 10px",
                  borderRadius: css.r_pill,
                  background: "rgba(20,20,19,0.04)",
                  color: css.slate,
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                +{platforms.length - 5}
              </div>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div
          style={{
            borderTop: "1.5px solid rgba(243, 115, 56, 0.1)",
            background:
              "linear-gradient(to bottom, rgba(243, 115, 56, 0.02), transparent)",
            padding: "24px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {platforms.map((p) => (
              <div
                key={p.id}
                style={{
                  background: css.white,
                  padding: "16px",
                  borderRadius: css.r_btn,
                  border: "1.2px solid rgba(20,20,19,0.06)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: PLATFORM_COLORS[p.id] || css.slate,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {getPlatformIcon(p.id)}
                    </div>
                    <span
                      style={{ fontSize: 13, fontWeight: 600, color: css.ink }}
                    >
                      {p.name}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: css.r_pill,
                      background: p.success
                        ? "rgba(34,197,94,0.08)"
                        : "rgba(239,68,68,0.08)",
                      color: p.success ? "#15803d" : "#b91c1c",
                      border: `1px solid ${p.success ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                    }}
                  >
                    {p.success ? "Success" : "Failed"}
                  </span>
                </div>
                {p.success ? (
                  p.url ? (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 11,
                        color: css.arc,
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      View Live Post <ExternalLink size={12} />
                    </a>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 11,
                        color: css.slate,
                        fontWeight: 600,
                      }}
                    >
                      <Clock size={12} /> Pending Sync
                    </div>
                  )
                ) : (
                  <p
                    style={{
                      fontSize: 11,
                      color: "#ef4444",
                      fontStyle: "italic",
                      margin: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    {p.error || "Connection error"}
                  </p>
                )}
              </div>
            ))}
          </div>
          {post.caption && (
            <div
              style={{
                background: css.white,
                padding: "20px",
                borderRadius: css.r_btn,
                border: "1.2px solid rgba(243, 115, 56, 0.1)",
                boxShadow: "0 8px 24px rgba(243, 115, 56, 0.05)",
              }}
            >
              <div
                className="eyebrow"
                style={{ marginBottom: 10, fontSize: 10 }}
              >
                Full Caption
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: css.ink,
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {post.caption}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Skeleton card for loading state ── */
const SKELETON_HEIGHTS = [
  280, 180, 350, 220, 315, 260, 385, 200, 295, 340, 170, 235,
];

function SkeletonCard({ height }) {
  return (
    <div className="masonry-card skeleton-card">
      <div className="skeleton-shimmer" style={{ height }} />
      <div
        style={{
          padding: "12px 14px 14px",
          background: "var(--canvas-lifted)",
        }}
      >
        <div
          className="skeleton-shimmer"
          style={{
            height: 11,
            borderRadius: 6,
            marginBottom: 8,
            width: "75%",
          }}
        />
        <div
          className="skeleton-shimmer"
          style={{
            height: 9,
            borderRadius: 6,
            marginBottom: 6,
            width: "55%",
          }}
        />
        <div
          className="skeleton-shimmer"
          style={{ height: 9, borderRadius: 6, width: "35%" }}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN DASHBOARD
   ══════════════════════════════════════════════════════ */
function Dashboard() {
  const { user, refreshAccounts } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("sent");
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedPost, setSelectedPost] = useState(null);
  const [queueCount, setQueueCount] = useState(0);

  const BATCH_SIZE = 20;
  const [displayCount, setDisplayCount] = useState(BATCH_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef(null);

  const tabs = [
    {
      id: "sent",
      label: "Sent",
      count: activeTab === "sent" ? broadcasts.length : 0,
    },
    {
      id: "queue",
      label: "Queue",
      count:
        activeTab === "queue"
          ? broadcasts.length
          : activeTab === "sent"
            ? queueCount
            : 0,
    },
    { id: "drafts", label: "Drafts", count: 0 },
    {
      id: "history",
      label: "History",
      count: activeTab === "history" ? broadcasts.length : 0,
    },
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    const verifyPayment = async () => {
      const paymentLinkStatus = params.get("razorpay_payment_link_status");
      const paymentLinkId = params.get("razorpay_payment_link_id");
      
      if (params.get("payment") === "success" && paymentLinkId) {
        try {
          const { data, error } = await supabase.functions.invoke('verify-subscription', {
            body: { razorpayPaymentLinkId: paymentLinkId }
          });
          
          if (error) throw error;
          
          if (data.success) {
            if (data.status === "paid") {
              await supabase.auth.refreshSession();
              navigate('/dashboard/payment-success');
              return; // Exit so we don't replaceState below
            } else {
              alert("Payment status is: " + data.status + ". Your plan was not upgraded.");
            }
          } else {
            throw new Error(data.error || "Unknown verification error");
          }
        } catch (err) {
          console.error("Payment verification error:", err);
          alert("Payment verification failed: " + (err.message || JSON.stringify(err)));
        } finally {
          window.history.replaceState({}, "", "/dashboard");
        }
      }
    };

    if (params.get("payment") === "success") {
      verifyPayment();
    }

    if (params.get("success")) {
      refreshAccounts();
      window.history.replaceState({}, "", "/dashboard");
    }
    
    apiClient
      .get("/api/broadcasts/stats")
      .then((r) => setQueueCount(r.data.pending || 0))
      .catch(() => {});
  }, [refreshAccounts]);

  useEffect(() => {
    fetchBroadcasts();
    setDisplayCount(BATCH_SIZE);
  }, [activeTab]);

  useEffect(() => {
    setDisplayCount(BATCH_SIZE);
  }, [searchTerm]);

  const fetchBroadcasts = async () => {
    try {
      setLoading(true);
      let params = {};
      if (activeTab === "sent") params.status = "sent";
      else if (activeTab === "queue") params.status = "scheduled";

      const response = await apiClient.get("/api/broadcasts", { params });
      setBroadcasts(response.data.broadcasts || []);
    } catch (err) {
      setBroadcasts([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = useCallback((dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      year: 'numeric', hour: '2-digit', minute: '2-digit',
    }), []);

  const toggleExpand = (id) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const selectedPlatform = searchParams.get("platform") || "all";

  const filtered = broadcasts.filter((b) => {
    const matchesSearch = (b.caption || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    if (selectedPlatform === "all") return matchesSearch;
    const matchesPlatform = buildPlatforms(b).some(
      (p) => p.id === selectedPlatform,
    );
    return matchesSearch && matchesPlatform;
  });

  const displayedItems = filtered.slice(0, displayCount);
  const hasMore = displayCount < filtered.length;

  useEffect(() => {
    if (!hasMore || isLoadingMore) return;
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setDisplayCount(prev => Math.min(prev + BATCH_SIZE, filtered.length));
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { rootMargin: '400px', threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, filtered.length]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: css.canvas,
        fontFamily: "var(--font)",
      }}
    >
      {/* ── Top header ── */}
      <div
        style={{
          background: css.lifted,
          borderBottom: "1px solid rgba(20,20,19,0.08)",
          padding: "clamp(14px, 3vw, 20px) 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            flex: 1,
            minWidth: 200,
          }}
        >
          <div>
            <div className="eyebrow" style={{ marginBottom: 2 }}>
              Overview
            </div>
            <h1
              style={{
                fontSize: "clamp(20px, 4vw, 26px)",
                fontWeight: 600,
                color: css.ink,
                margin: 0,
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              Analytics
            </h1>
          </div>
          {selectedPlatform !== "all" && (
            <div
              style={{
                padding: "4px 10px",
                background: "rgba(20,20,19,0.05)",
                borderRadius: css.r_btn,
                border: "1px solid rgba(20,20,19,0.1)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: css.ink }}>
                {selectedPlatform.charAt(0).toUpperCase() +
                  selectedPlatform.slice(1)}
              </span>
              <button
                onClick={() => navigate("/dashboard")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                }}
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => setComposerOpen(true)}
            className="btn-ink"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 14,
              padding: "10px 20px",
              borderRadius: css.r_pill,
            }}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New Post</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div
        style={{
          background: css.lifted,
          borderBottom: "1px solid rgba(20,20,19,0.08)",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          gap: "clamp(16px, 4vw, 32px)",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "queue" && activeTab !== "queue") {
                  navigate("/dashboard/queue");
                  return;
                }
                setActiveTab(tab.id);
              }}
              style={{
                padding: "14px 0",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: active ? css.ink : css.slate,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                borderBottom: `2.5px solid ${active ? css.ink : "transparent"}`,
                marginBottom: -1,
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  style={{
                    padding: "1px 6px",
                    borderRadius: css.r_pill,
                    fontSize: 9,
                    fontWeight: 800,
                    background: active ? css.ink : "rgba(20,20,19,0.06)",
                    color: active ? css.canvas : css.slate,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Toolbar ── */}
      {(activeTab === "sent" ||
        activeTab === "queue" ||
        activeTab === "history") &&
        !loading &&
        broadcasts.length > 0 && (
          <div
            style={{
              background: css.canvas,
              borderBottom: "1px solid rgba(20,20,19,0.06)",
              padding: "12px 16px",
              display: "flex",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
              alignItems: window.innerWidth < 768 ? "stretch" : "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                overflowX: "auto",
                paddingBottom: window.innerWidth < 768 ? 4 : 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexShrink: 0,
                }}
              >
                <Clock size={14} style={{ color: css.arc }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: css.ink }}>
                  {filtered.length}
                </span>
                <span style={{ fontSize: 12, color: css.slate }}>
                  {activeTab === "queue" ? "scheduled" : "total"}
                </span>
              </div>
              <div
                style={{
                  width: 1,
                  height: 16,
                  background: "rgba(20,20,19,0.1)",
                  flexShrink: 0,
                }}
              />
              {activeTab !== "queue" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle2 size={14} style={{ color: "#22c55e" }} />
                  <span
                    style={{ fontSize: 13, fontWeight: 700, color: css.ink }}
                  >
                    {
                      filtered.filter((b) =>
                        buildPlatforms(b).some((p) => p.success),
                      ).length
                    }
                  </span>
                  <span style={{ fontSize: 12, color: css.slate }}>
                    success
                  </span>
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                alignSelf: window.innerWidth < 768 ? "stretch" : "auto",
              }}
            >
              <div style={{ position: "relative", flex: 1 }}>
                <Search
                  size={14}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: css.slate,
                  }}
                />
                <input
                  type="text"
                  placeholder="Search…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: "8px 16px 8px 32px",
                    background: css.lifted,
                    border: "1px solid rgba(20,20,19,0.1)",
                    borderRadius: css.r_pill,
                    fontSize: 13,
                    color: css.ink,
                    fontFamily: "var(--font)",
                    outline: "none",
                    width: "100%",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  background: css.lifted,
                  border: "1px solid rgba(20,20,19,0.08)",
                  borderRadius: css.r_pill,
                  padding: 3,
                  gap: 2,
                }}
              >
                {[
                  { mode: "grid", icon: <LayoutGrid size={13} /> },
                  { mode: "list", icon: <List size={13} /> },
                ].map(({ mode, icon }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    title={`${mode} view`}
                    style={{
                      padding: "6px 10px",
                      borderRadius: css.r_pill,
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      background: viewMode === mode ? css.ink : "transparent",
                      color: viewMode === mode ? css.canvas : css.slate,
                      transition: "all 0.2s",
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* ── Main content ── */}
      <div
        style={{
          padding: "clamp(16px, 3vw, 28px) clamp(16px, 3vw, 28px) 40px",
        }}
      >
        {loading ? (
          <Masonry
            breakpointCols={{
              default: 4,
              1400: 3,
              1100: 3,
              768: 2,
              480: 1,
            }}
            className="masonry-grid"
            columnClassName="masonry-grid_column"
          >
            {SKELETON_HEIGHTS.map((h, i) => (
              <SkeletonCard key={i} height={h} />
            ))}
          </Masonry>
        ) : (activeTab === "sent" ||
            activeTab === "queue" ||
            activeTab === "history") &&
          filtered.length > 0 ? (
          <>
            {viewMode === "grid" ? (
              <Masonry
                breakpointCols={{
                  default: 4,
                  1400: 3,
                  1100: 3,
                  768: 2,
                  480: 1,
                }}
                className="masonry-grid"
                columnClassName="masonry-grid_column"
              >
                {displayedItems.map((post) => (
                  <PinterestCard
                    key={post.id}
                    post={post}
                    onOpen={() => setSelectedPost(post)}
                    formatDate={formatDate}
                  />
                ))}
              </Masonry>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  maxWidth: 860,
                  margin: "0 auto",
                }}
              >
                {displayedItems.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    style={{ cursor: "pointer" }}
                  >
                    <ListRow
                      post={post}
                      expanded={expandedId === post.id}
                      onToggle={(e) => {
                        e?.stopPropagation();
                        toggleExpand(post.id);
                      }}
                      formatDate={formatDate}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* ── Infinite scroll sentinel + skeletons ── */}
            <div ref={loadMoreRef} style={{ marginTop: 8 }} />

            {isLoadingMore && viewMode === "grid" && (
              <Masonry
                breakpointCols={{
                  default: 4,
                  1400: 3,
                  1100: 3,
                  768: 2,
                  480: 1,
                }}
                className="masonry-grid"
                columnClassName="masonry-grid_column"
              >
                {SKELETON_HEIGHTS.slice(0, 8).map((h, i) => (
                  <SkeletonCard key={i} height={h} />
                ))}
              </Masonry>
            )}
            {isLoadingMore && viewMode === "list" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  maxWidth: 860,
                  margin: "0 auto",
                }}
              >
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="skeleton-card"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 20,
                      padding: "20px 24px",
                    }}
                  >
                    <div
                      className="skeleton-shimmer"
                      style={{
                        width: 84,
                        height: 84,
                        borderRadius: 12,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        className="skeleton-shimmer"
                        style={{
                          height: 14,
                          borderRadius: 6,
                          marginBottom: 10,
                          width: "60%",
                        }}
                      />
                      <div
                        className="skeleton-shimmer"
                        style={{
                          height: 11,
                          borderRadius: 6,
                          marginBottom: 8,
                          width: "85%",
                        }}
                      />
                      <div
                        className="skeleton-shimmer"
                        style={{ height: 10, borderRadius: 6, width: "40%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!hasMore && displayedItems.length > 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px 0 48px",
                  color: css.slate,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  opacity: 0.5,
                }}
              >
                ✦ All posts loaded
              </div>
            )}
          </>
        ) : (
          /* ── Empty state ── */
          <div
            style={{
              background: css.lifted,
              borderRadius: css.r_hero,
              border: "1px dashed rgba(20,20,19,0.15)",
              padding: "80px 40px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                position: "relative",
                display: "inline-block",
                marginBottom: 24,
              }}
            >
              <div
                className="watermark"
                style={{
                  fontSize: 80,
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%,-50%)",
                  whiteSpace: "nowrap",
                }}
              >
                ✦
              </div>
              <div
                style={{
                  position: "relative",
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: css.ink,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                }}
              >
                <Share2 size={26} style={{ color: css.canvas }} />
              </div>
            </div>
            <h3
              style={{
                fontSize: 22,
                fontWeight: 500,
                color: css.ink,
                margin: "0 0 10px",
                letterSpacing: "-0.02em",
              }}
            >
              {activeTab === "queue"
                ? "Your queue is empty"
                : activeTab === "drafts"
                  ? "No drafts yet"
                  : activeTab === "history"
                    ? "No broadcast history yet"
                    : "Ready for your first boost?"}
            </h3>
            <p
              style={{
                fontSize: 14,
                color: css.slate,
                margin: "0 0 28px",
                maxWidth: 300,
                marginLeft: "auto",
                marginRight: "auto",
                lineHeight: 1.5,
              }}
            >
              {activeTab === "sent" || activeTab === "history"
                ? "Create a post and broadcast it across your social channels to see analytics here."
                : "Schedule posts to see them appear here."}
            </p>
            {(activeTab === "sent" || activeTab === "history") && (
              <button
                className="btn-ink"
                onClick={() => setComposerOpen(true)}
                style={{ fontSize: 15, padding: "12px 32px" }}
              >
                Launch your first post
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  style={{ marginLeft: 6 }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 12h14M12 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      <ComposerModal
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPostCreated={fetchBroadcasts}
      />
      <AnimatePresence>
        {selectedPost && (
          <PostPreviewModal
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default Dashboard;
