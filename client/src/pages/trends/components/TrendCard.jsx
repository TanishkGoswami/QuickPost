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
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }} className="custom-scrollbar">
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
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--arc)", fontSize: 10, fontWeight: 800 }}>
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
        x: 4,
        background: "white",
        borderColor: "rgba(243,115,56,0.3)",
      }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onUse(idea)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 14,
        background: "rgba(255,255,255,0.6)",
        border: "1.5px solid rgba(20,20,19,0.06)",
        textAlign: "left",
        cursor: "pointer",
        transition: "all 0.2s",
        width: "100%",
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          background: "var(--arc)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          fontWeight: 900,
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        {index + 1}
      </div>
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--ink)",
            margin: 0,
            lineHeight: 1.4,
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
      
      images.forEach(img => allImages.push(img.url));

      onUseIdea({
        caption,
        hashtags,
        topic,
        images: allImages,
        memes: memes.map((m) => m.image),
      });
    },
    [hashtags, topic, images, memes, onUseIdea, newsItem?.image, newsItem?.videoUrl, newsItem?.isVideo],
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.05, 0.5),
        ease: [0.23, 1, 0.32, 1],
      }}
      style={{
        background: "var(--canvas-lifted)",
        borderRadius: 24,
        overflow: "hidden",
        border: "1px solid rgba(20,20,19,0.08)",
        boxShadow: "0 4px 24px rgba(20,20,19,0.04)",
        display: "flex",
        flexDirection: "column",
        marginBottom: 20,
        position: "relative",
      }}
      className="feature-card"
    >
      {/* ── HEADER IMAGE (FROM NEWS) ── */}
      {newsItem?.image && (
        <LazyImage
          src={newsItem.image}
          alt={topic}
          style={{ height: 180, width: "100%" }}
        />
      )}

      {/* ── HEADER ── */}
      <div style={{ padding: "20px 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              background: "rgba(243,115,56,0.1)",
              color: "var(--arc)",
              padding: "4px 8px",
              borderRadius: 8,
              fontSize: 10,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: 4
            }}>
              <Flame size={12} />
              {topic}
            </div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, color: scoreColor }}>
            {score}% Viral
          </div>
        </div>

        <h3 style={{
          fontSize: 18,
          fontWeight: 800,
          color: "var(--ink)",
          margin: "0 0 8px",
          lineHeight: 1.2,
          letterSpacing: "-0.02em"
        }}>
          {newsItem?.title || trend.topic}
        </h3>
        
        {newsItem?.source && (
          <div style={{ fontSize: 10, color: "var(--slate)", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--arc)" }} />
            {newsItem.source}
          </div>
        )}
      </div>

      {/* ── IDEAS ── */}
      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Sparkles size={13} style={{ color: "var(--arc)" }} />
          <span style={{ fontSize: 10, fontWeight: 900, color: "var(--ink)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Content Ideas
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ideas.slice(0, 2).map((idea, i) => (
            <ContentIdea key={i} idea={idea} index={i} onUse={handleUse} />
          ))}
        </div>
      </div>

      {/* ── MEDIA SECTIONS ── */}
      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
        <ImageSection images={images} />
      </div>

      {/* ── HASHTAGS & PLATFORMS ── */}
      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Hashtags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {hashtags.slice(0, 3).map((tag, i) => (
            <div key={i} style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--slate)",
              background: "rgba(20,20,19,0.04)",
              padding: "3px 8px",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              gap: 2
            }}>
              <Hash size={10} style={{ color: "var(--dust)" }} />
              {tag.replace('#', '')}
            </div>
          ))}
        </div>

        {/* Platforms */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
           <span style={{ fontSize: 10, fontWeight: 800, color: "var(--dust)", textTransform: "uppercase" }}>Best for:</span>
           <div style={{ display: "flex", gap: 6 }}>
             {['Instagram', 'LinkedIn'].map(p => (
               <div key={p} style={{ 
                 fontSize: 10, 
                 fontWeight: 700, 
                 color: "var(--ink)", 
                 display: "flex", 
                 alignItems: "center", 
                 gap: 4,
                 background: "var(--white)",
                 padding: "2px 8px",
                 borderRadius: 6,
                 border: "1px solid rgba(20,20,19,0.04)"
               }}>
                 <Layout size={10} style={{ color: "var(--arc)" }} />
                 {p}
               </div>
             ))}
           </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ 
        padding: "16px 20px", 
        background: "rgba(20,20,19,0.02)", 
        borderTop: "1px solid rgba(20,20,19,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", gap: 12 }}>
          <button style={{ background: "none", border: "none", color: "var(--slate)", cursor: "pointer", padding: 0 }} title="Save">
            <Bookmark size={18} />
          </button>
          <button style={{ background: "none", border: "none", color: "var(--slate)", cursor: "pointer", padding: 0 }} title="Share">
            <Share2 size={18} />
          </button>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleUse(ideas[0])}
          style={{
            background: "var(--ink)",
            color: "var(--white)",
            border: "none",
            borderRadius: 12,
            padding: "8px 16px",
            fontSize: 12,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 8px 16px rgba(20,20,19,0.1)"
          }}
        >
          Use this Idea
          <ChevronRight size={14} />
        </motion.button>
      </div>
    </motion.div>
  );
});

export default TrendCard;
