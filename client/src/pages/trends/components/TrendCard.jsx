import React, { memo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Flame,
  ChevronRight,
  Sparkles,
  Share2,
  Bookmark,
  ArrowUpCircle,
  Hash,
  Layout,
  ExternalLink,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────
   LazyImage — Visual core with beautiful fade-in
   ───────────────────────────────────────────────────────────────── */
export const LazyImage = memo(function LazyImage({
  src,
  alt = "",
  style = {},
  onClick,
  priority = false,
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const fallback = `https://placehold.co/600x400/f3f0ee/d1cdc7?text=${encodeURIComponent(alt || "Visual")}`;

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        overflow: "hidden",
        background: "rgba(20,20,19,0.03)",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {!loaded && !errored && (
        <div
          className="skeleton-shimmer"
          style={{ position: "absolute", inset: 0 }}
        />
      )}
      <img
        src={errored ? fallback : src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setErrored(true);
          setLoaded(true);
        }}
        style={{
          width: "100%",
          height: style.height === "auto" ? "auto" : "100%",
          objectFit: style.objectFit || "cover",
          display: "block",
          opacity: loaded ? 1 : 0,
          transition:
            "opacity 0.5s ease-out, transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: loaded ? "scale(1)" : "scale(1.05)",
        }}
      />
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────
   MemeSection
   ───────────────────────────────────────────────────────────────── */
const MemeSection = memo(function MemeSection({ memes }) {
  if (!memes?.length) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 900,
            color: "var(--slate)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Trending Memes
        </span>
      </div>
      <div
        style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}
        className="custom-scrollbar"
      >
        {memes.slice(0, 2).map((meme, i) => (
          <div
            key={i}
            style={{
              flexShrink: 0,
              width: 140,
              borderRadius: 12,
              overflow: "hidden",
              border: "1.px solid rgba(20,20,19,0.08)",
              background: "var(--white)",
              position: "relative",
            }}
          >
            <LazyImage
              src={meme.image}
              alt="Meme"
              style={{ height: 100, width: "100%" }}
            />
            <div
              style={{
                padding: "6px 8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--canvas-lifted)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  color: "var(--arc)",
                  fontSize: 10,
                  fontWeight: 800,
                }}
              >
                <ArrowUpCircle size={10} />
                {meme.upvotes || "1.2k"}
              </div>
              <ExternalLink size={10} style={{ color: "var(--dust)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────
   ImageSection
   ───────────────────────────────────────────────────────────────── */
const ImageSection = memo(function ImageSection({ images }) {
  if (!images?.length) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 900,
          color: "var(--slate)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        Inspiration Gallery
      </span>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 6,
        }}
      >
        {images.slice(0, 3).map((img, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05, zIndex: 1 }}
            style={{
              height: 60,
              borderRadius: 8,
              overflow: "hidden",
              border: "1px solid rgba(20,20,19,0.08)",
            }}
          >
            <LazyImage src={img.url} alt="Inspo" style={{ height: "100%" }} />
          </motion.div>
        ))}
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────
   ContentIdea — A single, actionable post starter
   ───────────────────────────────────────────────────────────────── */
const ContentIdea = memo(function ContentIdea({ idea, index, onUse }) {
  return (
    <motion.button
      whileHover={{
        x: 8,
        background: "var(--white)",
        borderColor: "var(--arc)",
      }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onUse(idea)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        padding: "16px 20px",
        borderRadius: "20px",
        background: "var(--canvas-lifted)",
        border: "1.5px solid rgba(20,20,19,0.06)",
        textAlign: "left",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
        width: "100%",
        boxShadow: "var(--shadow-barely)",
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "var(--ink)",
          color: "var(--canvas)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        {index + 1}
      </div>
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontSize: 14,
            fontWeight: 450,
            color: "var(--ink)",
            margin: 0,
            lineHeight: 1.5,
            letterSpacing: "var(--tracking-tight)",
          }}
        >
          {idea}
        </p>
      </div>
    </motion.button>
  );
});

/* ─────────────────────────────────────────────────────────────────
   TrendCard
   ───────────────────────────────────────────────────────────────── */
const TrendCard = memo(function TrendCard({
  trend,
  newsItem,
  memes = [],
  images = [],
  onUseIdea,
  index,
}) {
  const { topic, score, ideas = [], hashtags = [], platforms = [] } = trend;

  const scoreColor =
    score >= 90 ? "var(--arc)" : score >= 75 ? "#059669" : "#6366f1";

  const handleUse = useCallback(
    (idea) => {
      const caption = `${idea}\n\n${hashtags.join(" ")}`;
      // Include news image (or video) and any other available media
      const allImages = [];
      if (newsItem?.isVideo && newsItem?.videoUrl) {
        allImages.push(newsItem.videoUrl);
      } else if (newsItem?.image) {
        allImages.push(newsItem.image);
      }

      images.forEach((img) => allImages.push(img.url));

      onUseIdea({
        caption,
        hashtags,
        topic,
        images: allImages,
        memes: memes.map((m) => m.image),
      });
    },
    [
      hashtags,
      topic,
      images,
      memes,
      onUseIdea,
      newsItem?.image,
      newsItem?.videoUrl,
      newsItem?.isVideo,
    ],
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: Math.min(index * 0.05, 0.5),
        ease: [0.23, 1, 0.32, 1],
      }}
      style={{
        background: "var(--white)",
        borderRadius: "var(--r-card)",
        overflow: "hidden",
        border: "1.5px solid rgba(20,20,19,0.05)",
        boxShadow: "var(--shadow-atmospheric)",
        display: "flex",
        flexDirection: "column",
        marginBottom: 32,
        position: "relative",
        transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-8px)";
        e.currentTarget.style.boxShadow = "var(--shadow-deep)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "var(--shadow-atmospheric)";
      }}
    >
      {/* ── HEADER IMAGE ── */}
      {newsItem?.image && (
        <div style={{ position: "relative", padding: "12px 12px 0" }}>
          <LazyImage
            src={newsItem.image}
            alt={topic}
            style={{ height: 220, width: "100%", borderRadius: "28px" }}
          />
          <div
            style={{
              position: "absolute",
              top: 28,
              left: 28,
              background: "var(--white)",
              padding: "8px 16px",
              borderRadius: "var(--r-pill)",
              fontSize: 12,
              fontWeight: 700,
              color: "var(--ink)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "var(--shadow-barely)",
              letterSpacing: "0.02em",
            }}
          >
            <Flame size={14} style={{ color: "var(--arc)" }} />
            {topic.toUpperCase()}
          </div>
        </div>
      )}

      {/* ── CONTENT ── */}
      <div style={{ padding: "32px 32px 24px" }}>
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
              background: scoreColor,
              boxShadow: `0 0 8px ${scoreColor}`,
            }}
          />
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: scoreColor,
              letterSpacing: "0.04em",
            }}
          >
            {score}% VIRAL POTENTIAL
          </div>
        </div>

        <h3
          style={{
            fontSize: 24,
            fontWeight: 500,
            color: "var(--ink)",
            margin: "0 0 16px",
            lineHeight: 1.2,
            letterSpacing: "var(--tracking-tight)",
          }}
        >
          {newsItem?.title || trend.topic}
        </h3>

        {newsItem?.source && (
          <div
            style={{
              fontSize: 13,
              color: "var(--slate)",
              fontWeight: 450,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ color: "var(--dust)" }}>via</span>
            <span style={{ color: "var(--ink)", fontWeight: 500 }}>
              {newsItem.source}
            </span>
          </div>
        )}
      </div>

      {/* ── IDEAS ── */}
      <div
        style={{
          padding: "0 32px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={16} style={{ color: "var(--arc)" }} />
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--ink)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Discovery Insights
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {ideas.slice(0, 2).map((idea, i) => (
            <ContentIdea key={i} idea={idea} index={i} onUse={handleUse} />
          ))}
        </div>
      </div>

      {/* ── FOOTER ACTIONS ── */}
      <div
        style={{
          padding: "0 32px 32px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "auto",
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          <motion.button
            whileHover={{ scale: 1.1, background: "var(--canvas)" }}
            style={{
              background: "var(--white)",
              border: "1.5px solid rgba(20,20,19,0.08)",
              color: "var(--ink)",
              cursor: "pointer",
              width: 44,
              height: 44,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Bookmark"
          >
            <Bookmark size={18} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1, background: "var(--canvas)" }}
            style={{
              background: "var(--white)",
              border: "1.5px solid rgba(20,20,19,0.08)",
              color: "var(--ink)",
              cursor: "pointer",
              width: 44,
              height: 44,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Share"
          >
            <Share2 size={18} />
          </motion.button>
        </div>

        <motion.button
          whileHover={{ x: 4, background: "var(--ink)" }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleUse(ideas[0])}
          style={{
            background: "var(--ink)",
            color: "var(--canvas)",
            border: "none",
            borderRadius: "var(--r-btn)",
            padding: "12px 32px",
            fontSize: 16,
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "var(--shadow-atmospheric)",
            letterSpacing: "var(--tracking-tight)",
          }}
        >
          Draft Post
          <ChevronRight size={20} />
        </motion.button>
      </div>
    </motion.div>
  );
});

export default TrendCard;
