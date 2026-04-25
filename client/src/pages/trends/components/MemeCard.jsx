import React, { memo, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  ArrowUpCircle, 
  Share2, 
  Bookmark, 
  ChevronRight,
  ExternalLink,
  Flame
} from "lucide-react";
import { LazyImage } from "./TrendCard";

/**
 * MemeCard — Standalone card for trending memes.
 * Gives memes high priority as requested.
 */
const MemeCard = memo(function MemeCard({ meme, index, onUseIdea }) {
  const { image, title, upvotes, subreddit, url } = meme;

  const handleUse = useCallback(() => {
    onUseIdea({
      caption: `${title || 'Trending Meme'}\n\n#memes #viral #humor`,
      hashtags: ['#memes', '#viral', '#humor'],
      topic: subreddit || 'Trending',
      images: [image],
      memes: [],
    });
  }, [image, title, subreddit, onUseIdea]);

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
      {/* ── VISUAL ── */}
      <div style={{ position: 'relative', overflow: 'hidden', backgroundColor: 'var(--canvas-muted)' }}>
        {meme.isVideo ? (
          <video
            src={meme.videoUrl}
            poster={meme.image}
            autoPlay
            muted
            loop
            playsInline
            style={{ width: '100%', display: 'block' }}
          />
        ) : (
          <LazyImage
            src={image}
            alt={title || "Trending Meme"}
            style={{ height: 'auto', minHeight: 200, width: "100%" }}
          />
        )}
        <div style={{
          position: 'absolute',
          top: 12,
          left: 12,
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(10px)',
          padding: '4px 10px',
          borderRadius: 8,
          fontSize: 10,
          fontWeight: 800,
          color: 'var(--arc)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 2
        }}>
          <Flame size={12} />
          {meme.isVideo ? 'TRENDING VIDEO' : 'TRENDING MEME'}
        </div>
      </div>

      {/* ── DETAILS ── */}
      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "var(--slate)", textTransform: "uppercase" }}>
              r/{subreddit || 'memes'}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--arc)", fontSize: 11, fontWeight: 800 }}>
            <ArrowUpCircle size={12} />
            {upvotes || "1.2k"}
          </div>
        </div>

        <h3 style={{
          fontSize: 15,
          fontWeight: 700,
          color: "var(--ink)",
          margin: "0 0 12px",
          lineHeight: 1.4,
        }}>
          {title || "Check out this trending meme!"}
        </h3>

        <div style={{ display: 'flex', gap: 6 }}>
          {['#humor', '#viral'].map(tag => (
            <span key={tag} style={{ fontSize: 10, color: 'var(--dust)', fontWeight: 700 }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ 
        padding: "16px 20px", 
        background: "rgba(20,20,19,0.02)", 
        borderTop: "1px solid rgba(20,20,19,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 'auto'
      }}>
        <div style={{ display: "flex", gap: 12 }}>
          <button style={{ background: "none", border: "none", color: "var(--slate)", cursor: "pointer", padding: 0 }} title="Save">
            <Bookmark size={18} />
          </button>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: "var(--slate)", display: 'flex', alignItems: 'center' }}
          >
            <ExternalLink size={18} />
          </a>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleUse}
          style={{
            background: "var(--arc)",
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
            boxShadow: "0 8px 16px rgba(243,115,56,0.2)"
          }}
        >
          Use Meme
          <ChevronRight size={14} />
        </motion.button>
      </div>
    </motion.div>
  );
});

export default MemeCard;
