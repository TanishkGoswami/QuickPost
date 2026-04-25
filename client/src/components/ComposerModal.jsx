/**
 * ComposerModal.jsx — v3.0 (Modular Architecture)
 * ─────────────────────────────────────────────────────────────────
 * ORCHESTRATOR ONLY — no business logic inline.
 *
 * Architecture:
 *   /data/platforms.js              — constants
 *   /engines/PostIntelligenceEngine — analysis logic
 *   /engines/SmartSizeEngine        — size compatibility logic
 *   /hooks/usePostIntelligence      — memoized engine wrapper
 *   /hooks/useSmartSizes            — memoized size wrapper
 *   /components/IntelligencePanel   — "What will happen?" UI
 *   /components/MediaUploader       — drag/drop + reorder
 *   /components/PreviewPanel        — live platform previews
 */

import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
  memo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  Sparkles,
  ChevronDown,
  AtSign,
  Calendar,
  Clock,
  AlertCircle,
  Zap,
  CheckCircle2,
  Monitor,
  Smartphone,
  Square,
  RectangleVertical,
} from "lucide-react";
import { Reorder } from "framer-motion";

import apiClient from "../utils/apiClient";
import { useAuth } from "../context/AuthContext";
import { useUploadJobs } from "../context/UploadJobContext";
import { useDialog } from "../context/DialogContext";
import ChannelSelector from "./ChannelSelector";
import PlatformCustomization from "./PlatformCustomization";

// Modular imports
import {
  PLATFORM_META,
  PLATFORM_POST_TYPES,
  PLATFORM_LAYOUT_PRESETS,
  getPresetsForPlatform,
} from "./composer/data/platforms.js";
import { usePostIntelligence } from "./composer/hooks/usePostIntelligence.js";
import { useSmartSizes } from "./composer/hooks/useSmartSizes.js";
import IntelligencePanel from "./composer/components/IntelligencePanel.jsx";
import MediaUploader from "./composer/components/MediaUploader.jsx";
import PreviewPanel from "./composer/components/PreviewPanel.jsx";

/* ─────────────────────────────────────────────────────────────────
   CONSTANTS
   ───────────────────────────────────────────────────────────────── */
const QUICK_SUGGESTIONS = [
  "Hell yeh !! 🔥",
  "Excited to share this! ✨",
  "What do you think? 💭",
  "Check it out! 👀",
  "Behind the scenes 🎬",
  "New update! 🚀",
  "Link in bio! 🔗",
  "Weekend vibes 🌴",
  "Stay tuned! 📢",
  "New update! 🚀",
];

const SUGGESTED_HASHTAGS = [
  "#productivity",
  "#marketing",
  "#socialmedia",
  "#growth",
  "#creator",
  "#digitalmarketing",
  "#branding",
];

/* ─────────────────────────────────────────────────────────────────
   CALENDAR / CLOCK PICKERS
   (Self-contained — kept here since they are small and modal-specific)
   ───────────────────────────────────────────────────────────────── */
const ClockView = memo(function ClockView({ value, onChange }) {
  const [mode, setMode] = useState("hours"); // 'hours' or 'minutes'
  const initialH = parseInt(value.split(":")[0]) || 0;
  const initialM = parseInt(value.split(":")[1]) || 0;
  
  const [hour, setHour] = useState(initialH % 12 || 12);
  const [minute, setMinute] = useState(initialM);
  const [meridiem, setMeridiem] = useState(initialH >= 12 ? "PM" : "AM");
  const [isDragging, setIsDragging] = useState(false);
  const faceRef = useRef(null);

  const hours = [
    { v: 12, x: 0, y: -80 }, { v: 1, x: 40, y: -69 }, { v: 2, x: 69, y: -40 },
    { v: 3, x: 80, y: 0 }, { v: 4, x: 69, y: 40 }, { v: 5, x: 40, y: 69 },
    { v: 6, x: 0, y: 80 }, { v: 7, x: -40, y: 69 }, { v: 8, x: -69, y: 40 },
    { v: 9, x: -80, y: 0 }, { v: 10, x: -69, y: -40 }, { v: 11, x: -40, y: -69 }
  ];

  const minutes = [
    { v: 0, x: 0, y: -80 }, { v: 5, x: 40, y: -69 }, { v: 10, x: 69, y: -40 },
    { v: 15, x: 80, y: 0 }, { v: 20, x: 69, y: 40 }, { v: 25, x: 40, y: 69 },
    { v: 30, x: 0, y: 80 }, { v: 35, x: -40, y: 69 }, { v: 40, x: -69, y: 40 },
    { v: 45, x: -80, y: 0 }, { v: 50, x: -69, y: -40 }, { v: 55, x: -40, y: -69 }
  ];

  const to24h = (h, m, ampm) => {
    let hh = h;
    if (ampm === "PM" && hh < 12) hh += 12;
    if (ampm === "AM" && hh === 12) hh = 0;
    return `${String(hh).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const handleSelectHour = (h) => {
    setHour(h);
    onChange(to24h(h, minute, meridiem));
    setMode("minutes");
  };

  const handleSelectMinute = (m) => {
    setMinute(m);
    onChange(to24h(hour, m, meridiem));
  };

  const calculateValueFromCoords = (clientX, clientY) => {
    if (!faceRef.current) return;
    const rect = faceRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    if (mode === "hours") {
      let h = Math.round(angle / 30) % 12 || 12;
      if (h !== hour) {
        setHour(h);
        onChange(to24h(h, minute, meridiem));
      }
    } else {
      let m = Math.round(angle / 6) % 60;
      if (m !== minute) {
        setMinute(m);
        onChange(to24h(hour, m, meridiem));
      }
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      calculateValueFromCoords(e.clientX, e.clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && e.touches[0]) {
      calculateValueFromCoords(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    const handleStop = () => {
      if (isDragging) {
        setIsDragging(false);
        if (mode === "hours") setMode("minutes");
      }
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleStop);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleStop);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleStop);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleStop);
    };
  }, [isDragging, mode, hour, minute, meridiem]);

  const handleMeridiemChange = (m) => {
    setMeridiem(m);
    onChange(to24h(hour, minute, m));
  };

  const currentList = mode === "hours" ? hours : minutes;
  const currentVal = mode === "hours" ? hour : minute;

  // Calculate hand angle
  const getAngle = () => {
    if (mode === "hours") {
      const h = hour % 12;
      return (h * 30);
    } else {
      return (minute * 6);
    }
  };

  return (
    <div style={{ width: 260, padding: "20px 10px", display: "flex", flexDirection: "column", alignItems: "center", userSelect: "none" }}>
      {/* Header / Mode Switcher */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, background: "rgba(20,20,19,0.04)", padding: 4, borderRadius: 10 }}>
        <button
          onClick={() => setMode("hours")}
          style={{
            padding: "6px 16px",
            borderRadius: 8,
            fontSize: 18,
            fontWeight: 800,
            border: "none",
            background: mode === "hours" ? "white" : "transparent",
            color: mode === "hours" ? "var(--arc)" : "var(--slate)",
            boxShadow: mode === "hours" ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
            cursor: "pointer",
            transition: "0.2s"
          }}
        >
          {String(hour).padStart(2, "0")}
        </button>
        <span style={{ fontSize: 18, fontWeight: 800, color: "var(--slate)", alignSelf: "center" }}>:</span>
        <button
          onClick={() => setMode("minutes")}
          style={{
            padding: "6px 16px",
            borderRadius: 8,
            fontSize: 18,
            fontWeight: 800,
            border: "none",
            background: mode === "minutes" ? "white" : "transparent",
            color: mode === "minutes" ? "var(--arc)" : "var(--slate)",
            boxShadow: mode === "minutes" ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
            cursor: "pointer",
            transition: "0.2s"
          }}
        >
          {String(minute).padStart(2, "0")}
        </button>
      </div>

      {/* Clock Face */}
      <div 
        ref={faceRef}
        onMouseDown={(e) => {
          setIsDragging(true);
          calculateValueFromCoords(e.clientX, e.clientY);
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          if (e.touches[0]) calculateValueFromCoords(e.touches[0].clientX, e.touches[0].clientY);
        }}
        style={{ position: "relative", width: 200, height: 200, background: "rgba(20,20,19,0.03)", borderRadius: "50%", display: "flex", alignItems: "center", justifyCenter: "center", marginBottom: 20, cursor: "pointer" }}
      >
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 6, height: 6, margin: -3, background: "var(--arc)", borderRadius: "50%", zIndex: 10 }} />
        
        <motion.div
          animate={{ rotate: getAngle() }}
          transition={isDragging ? { type: "just" } : { type: "spring", stiffness: 300, damping: 30 }}
          style={{
            position: "absolute",
            left: "50%",
            bottom: "50%",
            width: 2,
            height: 80,
            background: "var(--arc)",
            transformOrigin: "bottom center",
            zIndex: 5,
            pointerEvents: "none"
          }}
        >
          <div style={{ position: "absolute", top: 0, left: "50%", width: 30, height: 30, margin: "-15px", background: "var(--arc)", borderRadius: "50%", opacity: 0.2 }} />
          <div style={{ position: "absolute", top: 0, left: "50%", width: 6, height: 6, margin: "-3px", background: "var(--arc)", borderRadius: "50%" }} />
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          >
            {currentList.map((item) => {
              const isSelected = item.v === currentVal;
              return (
                <div
                  key={item.v}
                  style={{
                    position: "absolute",
                    left: `calc(50% + ${item.x}px)`,
                    top: `calc(50% + ${item.y}px)`,
                    width: 32,
                    height: 32,
                    margin: -16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    background: isSelected ? "var(--arc)" : "transparent",
                    color: isSelected ? "white" : "var(--ink)",
                    fontSize: 11,
                    fontWeight: isSelected ? 800 : 500,
                    zIndex: 10,
                    transition: "0.2s"
                  }}
                >
                  {item.v}
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* AM/PM Switcher */}
      <div style={{ display: "flex", gap: 4, background: "rgba(20,20,19,0.04)", padding: 3, borderRadius: 8 }}>
        {["AM", "PM"].map((m) => (
          <button
            key={m}
            onClick={(e) => {
              e.stopPropagation();
              handleMeridiemChange(m);
            }}
            style={{
              padding: "4px 12px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 800,
              border: "none",
              background: meridiem === m ? "white" : "transparent",
              color: meridiem === m ? "var(--arc)" : "var(--slate)",
              boxShadow: meridiem === m ? "0 2px 6px rgba(0,0,0,0.05)" : "none",
              cursor: "pointer",
              transition: "0.2s"
            }}
          >
            {m}
          </button>
        ))}
      </div>

      <p style={{ marginTop: 12, fontSize: 10, color: "var(--slate)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {isDragging ? "Dragging..." : `Select ${mode}`}
      </p>
    </div>
  );
});

const CalendarView = memo(function CalendarView({ value, onChange }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(
    value ? new Date(value + "T00:00:00") : today,
  );
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div style={{ width: 220, padding: 4 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <button
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            color: "var(--slate)",
          }}
        >
          <ChevronDown size={14} style={{ transform: "rotate(90deg)" }} />
        </button>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink)" }}>
          {monthNames[month]} {year}
        </span>
        <button
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            color: "var(--slate)",
          }}
        >
          <ChevronDown size={14} style={{ transform: "rotate(-90deg)" }} />
        </button>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
        }}
      >
        {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
          <span
            key={d}
            style={{
              fontSize: 9,
              fontWeight: 800,
              textAlign: "center",
              color: "var(--slate)",
              opacity: 0.5,
            }}
          >
            {d}
          </span>
        ))}
        {days.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const isSelected = value === dateStr;
          const isToday =
            d === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();
          const isPast = new Date(year, month, d) < today && !isToday;

          return (
            <button
              key={i}
              onClick={() => !isPast && onChange(dateStr)}
              style={{
                border: "none",
                background: isSelected
                  ? "var(--arc,#f37338)"
                  : isToday
                    ? "rgba(243,115,56,0.1)"
                    : "none",
                borderRadius: 6,
                fontSize: 10,
                fontWeight: isSelected || isToday ? 700 : 500,
                color: isSelected
                  ? "white"
                  : isPast
                    ? "#ccc"
                    : isToday
                      ? "var(--arc)"
                      : "var(--ink)",
                padding: "4px 0",
                cursor: isPast ? "default" : "pointer",
              }}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
});

const CustomSelect = memo(function CustomSelect({
  value,
  options,
  onChange,
  icon: Icon,
  isCalendar = false,
  isTime = false,
  minTime,
  align = "left",
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const fn = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setOpen(false);
    };
    window.addEventListener("mousedown", fn);
    return () => window.removeEventListener("mousedown", fn);
  }, []);

  const label = isCalendar
    ? new Date(value + "T00:00:00").toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : value;

  return (
    <div ref={containerRef} style={{ position: "relative", flex: 1 }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: "7px 10px",
          background: "white",
          border: "1px solid rgba(20,20,19,0.1)",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {Icon && <Icon size={12} style={{ color: "var(--slate)" }} />}
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink)" }}>
            {label}
          </span>
        </div>
        <ChevronDown
          size={11}
          style={{
            color: "var(--slate)",
            transform: open ? "rotate(180deg)" : "none",
            transition: "0.2s",
          }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            style={{
              position: "absolute",
              top: "100%",
              marginTop: 8,
              [align]: 0,
              zIndex: 1000,
              background: "white",
              borderRadius: 12,
              border: "1px solid rgba(20,20,19,0.08)",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            {isCalendar ? (
              <CalendarView
                value={value}
                onChange={(v) => {
                  onChange(v);
                  setOpen(false);
                }}
              />
            ) : isTime ? (
              <ClockView
                value={value}
                onChange={(v) => {
                  onChange(v);
                  // Don't close immediately on hour select, wait for minutes
                }}
              />
            ) : (
              <div
                style={{
                  maxHeight: 200,
                  overflowY: "auto",
                  width: 120,
                  padding: 4,
                }}
              >
                {options.map((opt) => {
                  const val = typeof opt === "string" ? opt : opt.value;
                  const lbl = typeof opt === "string" ? opt : opt.label;
                  const disabled = minTime && val < minTime;
                  return (
                    <button
                      key={val}
                      onClick={() => {
                        if (!disabled) {
                          onChange(val);
                          setOpen(false);
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "6px 10px",
                        textAlign: "left",
                        background: value === val ? "rgba(243,115,56,0.08)" : "none",
                        border: "none",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: value === val ? 700 : 500,
                        color: disabled
                          ? "#ccc"
                          : value === val
                            ? "var(--arc)"
                            : "var(--ink)",
                        cursor: disabled ? "default" : "pointer",
                      }}
                    >
                      {lbl}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────
   SIZE BUTTONS
   ───────────────────────────────────────────────────────────────── */
const SizeButton = memo(function SizeButton({ size, isSelected, onClick }) {
  const Icon = size.ratio === "1:1" ? Square : RectangleVertical;
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        border: "1.5px solid",
        borderColor: isSelected ? "var(--ink)" : "rgba(20,20,19,0.08)",
        background: isSelected ? "var(--ink)" : "white",
        color: isSelected ? "white" : "var(--slate)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        flex: 1,
        minWidth: 70,
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <Icon
        size={14}
        style={{ opacity: isSelected ? 1 : 0.6 }}
        strokeWidth={isSelected ? 2.5 : 2}
      />
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontSize: 10,
            fontWeight: 800,
            margin: 0,
            letterSpacing: "0.02em",
          }}
        >
          {size.ratio}
        </p>
        <p style={{ fontSize: 8, margin: 0, opacity: 0.6, fontWeight: 600 }}>
          {size.label}
        </p>
      </div>
      {size.badge !== "none" && !isSelected && (
        <span
          style={{
            fontSize: 7,
            fontWeight: 800,
            background:
              size.badge === "safe"
                ? "rgba(5,150,105,0.1)"
                : "rgba(243,115,56,0.1)",
            color: size.badge === "safe" ? "#059669" : "#f37338",
            padding: "1px 4px",
            borderRadius: 4,
            marginTop: 2,
            textTransform: "uppercase",
          }}
        >
          {size.badge}
        </span>
      )}
    </motion.button>
  );
});

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────────── */
function ComposerModal({ isOpen, onClose, initialData = null }) {
  const { user, connectedAccounts } = useAuth();
  const { addJob } = useUploadJobs();
  const { alert, confirm } = useDialog();
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  /* ── State ── */
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [caption, setCaption] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [postType, setPostType] = useState("post");
  const [platformData, setPlatformData] = useState({
    instagram: { type: "post" },
    youtube: { type: "short" },
    facebook: { type: "post" },
    pinterest: { boardId: "", title: "", link: "" },
    reddit: { subreddit: "", title: "", flairId: "" },
  });
  const [youtubeThumbnail, setYoutubeThumbnail] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activePreviewPlatform, setActivePreviewPlatform] =
    useState("instagram");
  const [selectedSizePreset, setSelectedSizePreset] = useState("li_sq"); // default
  const [customizationExpanded, setCustomizationExpanded] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [mobileActiveTab, setMobileActiveTab] = useState("compose"); // compose, preview, insights
  const [autoFixMsg, setAutoFixMsg] = useState(null);

  const isMobile = windowWidth < 768;

  useEffect(() => {
    const fn = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  /* ── Intelligence engine ── */
  const { panelItems, hasBlockingError, totalIssues } = usePostIntelligence({
    selectedChannels,
    mediaFiles,
    platformData,
    youtubeThumbnail,
    postType,
    caption,
    scheduledAt,
    isScheduled,
    connectedAccounts,
  });

  /* ── Smart size engine ── */
  const { smartSizes, availablePresets, selectedRatio } = useSmartSizes({
    selectedChannels,
    activePlatform: activePreviewPlatform,
    selectedSizePreset,
    setSelectedSizePreset,
    onAutoFixed: (msg) => {
      setAutoFixMsg(msg);
      setTimeout(() => setAutoFixMsg(null), 3500);
    },
  });

  /* ── Available post types (intersection) ── */
  const availablePostTypes = useMemo(() => {
    if (selectedChannels.length === 0) return ["post", "story", "reel"];
    let common = PLATFORM_POST_TYPES[selectedChannels[0]] || ["post"];
    for (let i = 1; i < selectedChannels.length; i++) {
      const types = PLATFORM_POST_TYPES[selectedChannels[i]] || ["post"];
      common = common.filter((t) => types.includes(t));
    }
    return common.length > 0 ? common : ["post"];
  }, [JSON.stringify(selectedChannels)]);

  useEffect(() => {
    if (!availablePostTypes.includes(postType))
      setPostType(availablePostTypes[0] || "post");
  }, [availablePostTypes, postType]);

  /* ── Platform preview sync ── */
  useEffect(() => {
    if (selectedChannels.length === 0) {
      setActivePreviewPlatform("instagram");
      return;
    }
    if (!selectedChannels.includes(activePreviewPlatform))
      setActivePreviewPlatform(selectedChannels[0]);
  }, [JSON.stringify(selectedChannels), activePreviewPlatform]);

  /* ── Auto-select connected channels on open ── */
  useEffect(() => {
    if (isOpen && selectedChannels.length === 0) {
      const connected = Object.keys(connectedAccounts).filter(
        (k) => connectedAccounts[k]?.connected && PLATFORM_META[k],
      );
      setSelectedChannels(connected);
    }
  }, [isOpen]);

  /* ── Scheduling helpers ── */
  const toLocalDT = (date) => {
    const l = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return l.toISOString().slice(0, 16);
  };
  const minDT = useMemo(
    () => toLocalDT(new Date(Date.now() + 2 * 60 * 1000)),
    [],
  );
  const minDate = minDT.slice(0, 10);
  const minTime = minDT.slice(11, 16);
  const datePart = scheduledAt ? scheduledAt.slice(0, 10) : "";
  const timePart = scheduledAt ? scheduledAt.slice(11, 16) : "";

  const scheduleDateOptions = useMemo(() => {
    const opts = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    for (let i = 0; i < 30; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      opts.push({
        value: toLocalDT(d).slice(0, 10),
        label: d.toLocaleDateString(undefined, {
          weekday: "short",
          day: "2-digit",
          month: "short",
        }),
      });
    }
    return opts;
  }, []);

  const buildTimeOpts = (dp) => {
    const min = dp !== minDate ? "00:00" : minTime;
    const opts = [];
    for (let h = 0; h < 24; h++)
      for (let m = 0; m < 60; m += 15) {
        const v = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        if (v >= min) opts.push(v);
      }
    return opts;
  };
  const scheduleTimeOpts = useMemo(
    () => buildTimeOpts(datePart || minDate),
    [datePart, minDate, minTime],
  );

  useEffect(() => {
    if (!isScheduled) return;
    const dv = datePart || minDate;
    const opts = buildTimeOpts(dv);
    const nt = timePart && opts.includes(timePart) ? timePart : opts[0] || "";
    if (!nt) return;
    const nv = `${dv}T${nt}`;
    if (scheduledAt !== nv) setScheduledAt(nv);
  }, [isScheduled, datePart, minDate, minTime]);

  /* ── Handlers ── */
  const handleChannelToggle = useCallback((id) => {
    setSelectedChannels((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
    setError(null);
  }, []);

  const handleBulkSelect = useCallback((ids) => {
    setSelectedChannels(ids);
    setError(null);
  }, []);

  /* ── Validation ── */
  const validateForm = useCallback(() => {
    if (selectedChannels.length === 0) {
      setError("Please select at least one platform");
      return false;
    }
    if (!caption.trim()) {
      setError("Please add a caption");
      return false;
    }
    if (mediaFiles.length === 0) {
      setError("Please upload at least one file");
      return false;
    }

    const hasImg = mediaFiles.some((m) => m.file?.type?.startsWith("image/"));
    const hasVid = mediaFiles.some((m) => m.file?.type?.startsWith("video/"));

    if (selectedChannels.includes("youtube") && hasImg && !hasVid) {
      setError(
        "YouTube only supports video — please upload a video or deselect YouTube.",
      );
      return false;
    }
    if (
      selectedChannels.includes("pinterest") &&
      !platformData.pinterest?.title?.trim()
    ) {
      setError("Pinterest requires a title in Platform Customization.");
      return false;
    }
    if (
      selectedChannels.includes("pinterest") &&
      !platformData.pinterest?.boardId
    ) {
      setError("Pinterest requires a board selection.");
      return false;
    }
    if (
      selectedChannels.includes("reddit") &&
      !platformData.reddit?.subreddit?.trim()
    ) {
      setError("Reddit requires a subreddit.");
      return false;
    }
    if (isScheduled) {
      if (!scheduledAt) {
        setError("Please select a date and time for scheduling.");
        return false;
      }
      if (new Date(scheduledAt).getTime() < Date.now() + 2 * 60 * 1000) {
        setError("Scheduled time must be at least 2 minutes in the future.");
        return false;
      }
    }
    return true;
  }, [
    selectedChannels,
    caption,
    mediaFiles,
    platformData,
    isScheduled,
    scheduledAt,
  ]);

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Prep data
      const formData = new FormData();
      formData.append("caption", caption);
      formData.append("platforms", JSON.stringify(selectedChannels));
      formData.append("postType", postType);
      formData.append("platformData", JSON.stringify(platformData));

      if (isScheduled) {
        formData.append("scheduledAt", new Date(scheduledAt).toISOString());
      }

      mediaFiles.forEach((m) => {
        formData.append("media", m.file);
      });

      if (youtubeThumbnail) {
        formData.append("youtubeThumbnail", youtubeThumbnail);
      }

      // 2. Start broadcast via API
      const res = await apiClient.post("/broadcasts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // 3. Add to background manager
      addJob({
        id: res.data.broadcastId,
        meta: {
          caption,
          channels: selectedChannels,
          fileCount: mediaFiles.length,
          mediaType: mediaFiles[0]?.file.type.startsWith("video/")
            ? "video"
            : "image",
          previewUrl: URL.createObjectURL(mediaFiles[0].file),
        },
      });

      // 4. Reset & Close
      onClose();
      setCaption("");
      setMediaFiles([]);
      setSelectedChannels([]);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to start broadcast");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (caption || mediaFiles.length > 0) {
      confirm(
        "Discard post?",
        "You have unsaved changes. Are you sure you want to discard this post?",
        {
          confirmLabel: "Discard",
          intent: "danger",
        },
      ).then((ok) => ok && onClose());
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const publishDisabled = loading || hasBlockingError;

  const MOBILE_TABS = [
    { id: "compose", label: "Compose" },
    { id: "preview", label: "Preview" },
    { id: "insights", label: "Insights" },
  ];

  /* ── JSX ── */
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          style={{
            width: "100%",
            maxWidth: isMobile ? "100%" : 960,
            height: isMobile ? "100%" : "90vh",
            background: "var(--canvas,#fff)",
            borderRadius: isMobile ? 0 : "var(--r-hero,20px)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            border: isMobile ? "none" : "1px solid rgba(20,20,19,0.08)",
          }}
        >
          {/* ── HEADER ── */}
          <div
            style={{
              padding: "16px 22px",
              borderBottom: "1px solid rgba(20,20,19,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "white",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "var(--ink,#141413)",
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                Create Post
              </h2>
              {selectedChannels.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "3px 8px",
                    borderRadius: 20,
                    background: "rgba(20,20,19,0.05)",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--slate,#8a8a82)",
                  }}
                >
                  <Zap size={9} /> {selectedChannels.length} platform
                  {selectedChannels.length > 1 ? "s" : ""}
                </motion.div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 12px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--slate,#8a8a82)",
                  background: "transparent",
                  border: "1px solid rgba(20,20,19,0.1)",
                  borderRadius: "var(--r-btn,10px)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <Sparkles size={12} />
                {!isMobile && "AI Assistant"}
              </motion.button>
              <motion.button
                type="button"
                onClick={handleClose}
                whileHover={{ scale: 1.05, background: "rgba(20,20,19,0.06)" }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  border: "1px solid rgba(20,20,19,0.1)",
                  background: "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--slate,#8a8a82)",
                }}
              >
                <X size={13} />
              </motion.button>
            </div>
          </div>

          {/* ── MOBILE TABS ── */}
          {isMobile && (
            <div
              style={{
                display: "flex",
                background: "var(--canvas-lifted,#fafaf9)",
                borderBottom: "1px solid rgba(20,20,19,0.08)",
                flexShrink: 0,
              }}
            >
              {MOBILE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMobileActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    padding: "11px 4px",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    border: "none",
                    background: "transparent",
                    color:
                      mobileActiveTab === tab.id
                        ? "var(--ink,#141413)"
                        : "var(--slate,#8a8a82)",
                    borderBottom: `2.5px solid ${mobileActiveTab === tab.id ? "var(--ink,#141413)" : "transparent"}`,
                    transition: "all 0.2s",
                    cursor: "pointer",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* ── AUTO-FIX TOAST ── */}
          <AnimatePresence>
            {autoFixMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  position: "absolute",
                  top: 60,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 200,
                  background: "rgba(5,150,105,0.92)",
                  color: "white",
                  padding: "7px 14px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 8px 20px rgba(5,150,105,0.25)",
                }}
              >
                <CheckCircle2 size={12} /> {autoFixMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── BODY ── */}
          <div
            style={{
              display: "flex",
              flex: 1,
              overflow: "hidden",
              height: isMobile ? "calc(100vh - 105px)" : "calc(90vh - 115px)",
            }}
          >
            {/* ── PREVIEW PANEL (right column on desktop, tab on mobile) ── */}
            {(!isMobile || mobileActiveTab === "preview") && (
              <div
                style={{
                  width: isMobile ? "100%" : 300,
                  flexShrink: 0,
                  borderLeft: isMobile
                    ? "none"
                    : "1px solid rgba(20,20,19,0.08)",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  background: "var(--canvas-lifted,#fafaf9)",
                  order: 1,
                }}
              >
                <div
                  style={{
                    padding: "11px 14px",
                    borderBottom: "1px solid rgba(20,20,19,0.08)",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      color: "var(--slate,#8a8a82)",
                      textTransform: "uppercase",
                    }}
                  >
                    Live Preview
                  </span>
                </div>
                <PreviewPanel
                  user={user}
                  selectedChannels={selectedChannels}
                  caption={caption}
                  mediaFiles={mediaFiles}
                  selectedRatio={selectedRatio}
                  youtubeThumbnail={youtubeThumbnail}
                  activePlatform={activePreviewPlatform}
                  onActivePlatformChange={setActivePreviewPlatform}
                  connectedAccounts={connectedAccounts}
                />
              </div>
            )}

            {/* ── COMPOSER (main content) ── */}
            {(!isMobile ||
              mobileActiveTab === "compose" ||
              mobileActiveTab === "insights") && (
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "24px 28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 24,
                  scrollbarWidth: "none",
                }}
              >
                {/* ── Top row ── */}
                {(!isMobile || mobileActiveTab === "compose") && (
                  <div style={{ flexShrink: 0 }}>
                    <Section label="Post to" mb={12}>
                      <ChannelSelector
                        selectedChannels={selectedChannels}
                        onChannelToggle={handleChannelToggle}
                        onBulkSelect={handleBulkSelect}
                        connectedAccounts={connectedAccounts}
                      />
                    </Section>

                    {/* Caption */}
                    <div style={{ position: "relative", marginBottom: 16 }}>
                      <textarea
                        value={caption}
                        onChange={(e) => {
                          setCaption(e.target.value);
                          setError(null);
                        }}
                        placeholder="What's on your mind?"
                        style={{
                          width: "100%",
                          minHeight: 120,
                          padding: 14,
                          background: "white",
                          border: "1px solid rgba(20,20,19,0.1)",
                          borderRadius: "var(--r-hero,16px)",
                          fontSize: 14,
                          fontFamily: "inherit",
                          resize: "none",
                          color: "var(--ink,#141413)",
                          outline: "none",
                          transition: "border-color 0.2s",
                        }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = "var(--ink)")
                        }
                        onBlur={(e) =>
                          (e.target.style.borderColor = "rgba(20,20,19,0.1)")
                        }
                      />
                      {/* Caption helpers */}
                      {!isMobile && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: 12,
                            right: 12,
                            display: "flex",
                            gap: 8,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setCaption((p) =>
                                p ? `${p} {{MENTION_SELF}}` : "{{MENTION_SELF}}",
                              )
                            }
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: "#4f46e5",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                              letterSpacing: "0.05em",
                              textTransform: "uppercase",
                            }}
                          >
                            <AtSign size={9} /> Mention
                          </button>
                          <button
                            onClick={() => setCaption("")}
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: "var(--slate,#8a8a82)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              letterSpacing: "0.05em",
                              textTransform: "uppercase",
                            }}
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Quick suggestions */}
                    <div style={{ marginTop: 10 }}>
                      <RowLabel>Quick Ideas</RowLabel>
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          overflowX: "auto",
                          paddingBottom: 4,
                          scrollbarWidth: "none",
                        }}
                      >
                        {QUICK_SUGGESTIONS.map((s, i) => (
                          <motion.button
                            key={i}
                            type="button"
                            whileHover={{
                              scale: 1.03,
                              background: "var(--ink,#141413)",
                              color: "white",
                            }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() =>
                              setCaption((p) => (p ? `${p} ${s}` : s))
                            }
                            style={{
                              flexShrink: 0,
                              padding: "4px 11px",
                              background: "var(--canvas-lifted,#f5f5f4)",
                              border: "1px solid rgba(20,20,19,0.1)",
                              borderRadius: 20,
                              fontSize: 11,
                              color: "var(--slate,#8a8a82)",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              fontFamily: "inherit",
                              fontWeight: 500,
                              transition: "all 0.15s",
                            }}
                          >
                            {s}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Hashtags */}
                    <div style={{ marginTop: 10 }}>
                      <RowLabel>Hashtags</RowLabel>
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          overflowX: "auto",
                          alignItems: "center",
                          scrollbarWidth: "none",
                        }}
                      >
                        <input
                          type="text"
                          placeholder="+ Add tag (Enter)"
                          style={{
                            fontSize: 11,
                            padding: "4px 12px",
                            border: "1px dashed rgba(20,20,19,0.2)",
                            borderRadius: 20,
                            background: "transparent",
                            outline: "none",
                            width: 120,
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const val = e.target.value.trim();
                              if (val) {
                                const tag = val.startsWith("#")
                                  ? val
                                  : `#${val}`;
                                setCaption((p) => (p ? `${p} ${tag}` : tag));
                                e.target.value = "";
                              }
                            }
                          }}
                        />
                        {SUGGESTED_HASHTAGS.map((h, i) => (
                          <button
                            key={i}
                            onClick={() =>
                              setCaption((p) => (p ? `${p} ${h}` : h))
                            }
                            style={{
                              flexShrink: 0,
                              fontSize: 10,
                              fontWeight: 700,
                              color: "#4f46e5",
                              background: "rgba(79,70,229,0.06)",
                              border: "none",
                              padding: "4px 10px",
                              borderRadius: 20,
                              cursor: "pointer",
                            }}
                          >
                            {h}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setCaption((p) =>
                              p ? `${p} #getaipilot` : "#getaipilot",
                            )
                          }
                          className="btn-signal"
                          style={{
                            fontSize: 10,
                            padding: "4px 10px",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            flexShrink: 0,
                          }}
                        >
                          #getaipilot <Sparkles size={9} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Media ── */}
                <Section
                  label={`Media${mediaFiles.length > 0 ? ` (${mediaFiles.length}/10)` : ""}`}
                  mb={20}
                >
                  <MediaUploader
                    mediaFiles={mediaFiles}
                    setMediaFiles={setMediaFiles}
                    onError={setError}
                    isMobile={isMobile}
                  />
                </Section>

                {/* ── Smart Size ── */}
                <Section
                  label="Post Size"
                  hint={
                    selectedChannels.length > 1
                      ? "Smart-filtered for your platforms"
                      : ""
                  }
                  mb={20}
                >
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {smartSizes
                      .filter(
                        (s) =>
                          s.badge !== "none" || selectedChannels.length <= 1,
                      )
                      .map((size) => {
                        const matchingPreset = availablePresets.find(
                          (p) => p.ratio === size.id,
                        );
                        const isSelected =
                          matchingPreset?.id === selectedSizePreset;
                        return (
                          <SizeButton
                            key={size.id}
                            size={size}
                            isSelected={isSelected}
                            onClick={() =>
                              matchingPreset &&
                              setSelectedSizePreset(matchingPreset.id)
                            }
                          />
                        );
                      })}
                  </div>
                </Section>

                {/* ── Schedule ── */}
                <Section mb={20}>
                  <div
                    onClick={() => setIsScheduled(!isScheduled)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      padding: "10px 13px",
                      borderRadius: isScheduled ? "11px 11px 0 0" : 11,
                      background: "var(--canvas-lifted,#f5f5f4)",
                      border: "1px solid rgba(20,20,19,0.08)",
                      borderBottom: isScheduled ? "1px solid rgba(20,20,19,0.04)" : "1px solid rgba(20,20,19,0.08)",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <Calendar
                        size={13}
                        style={{
                          color: isScheduled
                            ? "var(--arc,#f37338)"
                            : "var(--slate,#8a8a82)",
                        }}
                      />
                      <div>
                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: isScheduled
                              ? "var(--arc,#f37338)"
                              : "var(--ink,#141413)",
                            margin: 0,
                          }}
                        >
                          {isScheduled ? "Scheduled" : "Schedule for later"}
                        </p>
                        {isScheduled && scheduledAt && (
                          <p
                            style={{
                              fontSize: 10,
                              color: "var(--arc,#f37338)",
                              margin: 0,
                              opacity: 0.8,
                            }}
                          >
                            {new Date(scheduledAt).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: isScheduled ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown
                        size={13}
                        style={{ color: "var(--slate,#8a8a82)" }}
                      />
                    </motion.div>
                  </div>

                  <AnimatePresence>
                    {isScheduled && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, overflow: "hidden" }}
                        animate={{
                          opacity: 1,
                          height: "auto",
                          transitionEnd: { overflow: "visible" },
                        }}
                        exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                        transition={{ duration: 0.25 }}
                      >
                        <div
                          style={{
                            padding: "12px 13px",
                            background: "var(--canvas-lifted,#f5f5f4)",
                            border: "1px solid rgba(20,20,19,0.08)",
                            borderTop: "none",
                            borderRadius: "0 0 11px 11px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: 8,
                            }}
                          >
                            <CustomSelect
                              value={datePart || minDate}
                              options={scheduleDateOptions}
                              onChange={(v) =>
                                setScheduledAt(
                                  `${v}T${timePart || buildTimeOpts(v)[0] || ""}`,
                                )
                              }
                              icon={Calendar}
                              isCalendar
                            />
                            <CustomSelect
                              value={
                                timePart ||
                                buildTimeOpts(datePart || minDate)[0] ||
                                ""
                              }
                              options={scheduleTimeOpts}
                              onChange={(v) =>
                                setScheduledAt(`${datePart || minDate}T${v}`)
                              }
                              icon={Clock}
                              isTime
                              minTime={
                                datePart === minDate ? minTime : undefined
                              }
                              align="right"
                            />
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 6,
                            }}
                          >
                            {[
                              { l: "+15m", m: 15 },
                              { l: "+1h", m: 60 },
                              { l: "Tomorrow 9AM", m: null },
                            ].map((q) => (
                              <button
                                key={q.l}
                                type="button"
                                onClick={() => {
                                  if (q.m !== null) {
                                    const d = new Date(
                                      Date.now() + q.m * 60000,
                                    );
                                    setScheduledAt(toLocalDT(d));
                                  } else {
                                    const t = new Date();
                                    t.setDate(t.getDate() + 1);
                                    t.setHours(9, 0, 0, 0);
                                    setScheduledAt(toLocalDT(t));
                                  }
                                }}
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: 8,
                                  border: "1px solid rgba(20,20,19,0.1)",
                                  background: "var(--canvas,#fff)",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: "var(--slate,#8a8a82)",
                                  cursor: "pointer",
                                }}
                              >
                                {q.l}
                              </button>
                            ))}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "7px 10px",
                              background: "rgba(243,115,56,0.05)",
                              borderRadius: 8,
                              border: "1px solid rgba(243,115,56,0.1)",
                            }}
                          >
                            <Clock
                              size={11}
                              style={{ color: "var(--arc,#f37338)" }}
                            />
                            <span
                              style={{
                                fontSize: 10,
                                color: "var(--arc,#f37338)",
                                fontWeight: 600,
                              }}
                            >
                              Timezone: {userTimezone}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Section>

                {/* ── Platform Customization ── */}
                <PlatformCustomization
                  selectedChannels={selectedChannels}
                  platformData={platformData}
                  onPlatformDataChange={setPlatformData}
                  expanded={customizationExpanded}
                  onToggleExpanded={() =>
                    setCustomizationExpanded(!customizationExpanded)
                  }
                  youtubeThumbnail={youtubeThumbnail}
                  onYoutubeThumbnailChange={setYoutubeThumbnail}
                />

                {/* ── Error ── */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      style={{
                        marginTop: 12,
                        padding: "10px 13px",
                        borderRadius: 10,
                        background: "rgba(239,68,68,0.06)",
                        border: "1px solid rgba(239,68,68,0.15)",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <AlertCircle
                        size={13}
                        style={{
                          color: "#dc2626",
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      />
                      <p
                        style={{
                          fontSize: 12,
                          color: "#dc2626",
                          fontWeight: 600,
                          margin: 0,
                        }}
                      >
                        {error}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ── INSIGHTS TAB (mobile only) ── */}
            {isMobile && mobileActiveTab === "insights" && (
              <div
                style={{
                  flex: 1,
                  overflow: "auto",
                  padding: 16,
                  background: "var(--canvas,#fff)",
                }}
              >
                {panelItems.length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      textAlign: "center",
                      opacity: 0.4,
                    }}
                  >
                    <CheckCircle2
                      size={32}
                      style={{ marginBottom: 10, color: "#059669" }}
                    />
                    <p style={{ fontWeight: 700, color: "#111", margin: 0 }}>
                      All clear!
                    </p>
                    <p style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                      No issues detected with your post.
                    </p>
                  </div>
                ) : (
                  <IntelligencePanel panelItems={panelItems} />
                )}
              </div>
            )}
          </div>

          {/* ── FOOTER ── */}
          <div
            style={{
              borderTop: "1px solid rgba(20,20,19,0.08)",
              padding: "14px 22px",
              background: "var(--canvas-lifted,#fafaf9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
              borderBottomLeftRadius: isMobile ? 0 : "var(--r-hero,20px)",
              borderBottomRightRadius: isMobile ? 0 : "var(--r-hero,20px)",
            }}
          >
            <motion.button
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={handleClose}
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--slate,#8a8a82)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                padding: "7px 13px",
                borderRadius: 20,
              }}
            >
              Cancel
            </motion.button>

            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* Scheduled badge */}
              {isScheduled && scheduledAt && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    fontSize: 10,
                    color: "var(--arc,#f37338)",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    background: "rgba(243,115,56,0.06)",
                    padding: "5px 12px",
                    borderRadius: 20,
                    border: "1px solid rgba(243,115,56,0.15)",
                  }}
                >
                  <Clock size={11} />
                  {new Date(scheduledAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </motion.div>
              )}

              {/* Blocking issue hint */}
              {hasBlockingError && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    fontSize: 10,
                    color: "#dc2626",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <AlertCircle size={11} /> Fix errors above
                </motion.span>
              )}

              {/* PUBLISH BUTTON */}
              <motion.button
                whileHover={
                  !publishDisabled
                    ? {
                        scale: 1.02,
                        y: -2,
                        boxShadow: isScheduled
                          ? "0 10px 24px rgba(243,115,56,0.3)"
                          : "0 10px 24px rgba(20,20,19,0.22)",
                      }
                    : {}
                }
                whileTap={!publishDisabled ? { scale: 0.97 } : {}}
                type="button"
                onClick={handleSubmit}
                disabled={publishDisabled}
                style={{
                  background: publishDisabled
                    ? "rgba(20,20,19,0.18)"
                    : isScheduled
                      ? "linear-gradient(135deg,var(--arc,#f37338) 0%,#ff8c5a 100%)"
                      : "linear-gradient(135deg,var(--ink,#141413) 0%,#3a3a37 100%)",
                  height: 46,
                  borderRadius: "var(--r-btn,10px)",
                  padding: "0 26px",
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  color: "white",
                  border: "none",
                  cursor: publishDisabled ? "not-allowed" : "pointer",
                  transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                  fontFamily: "inherit",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span style={{ fontWeight: 700, fontSize: 13 }}>
                      Publishing…
                    </span>
                  </>
                ) : (
                  <>
                    <div className="svg-wrapper-1">
                      <div className="svg-wrapper">
                        {isScheduled ? (
                          <Calendar size={16} strokeWidth={2.5} />
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width={16}
                            height={16}
                            fill="white"
                          >
                            <path d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {isScheduled ? "Schedule Post" : "Publish Now"}
                    </span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Small layout helpers ── */
const Section = memo(function Section({ label, hint, mb = 16, children }) {
  return (
    <div style={{ marginBottom: mb }}>
      {label && (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "var(--slate,#8a8a82)",
              textTransform: "uppercase",
            }}
          >
            {label}
          </span>
          {hint && (
            <span
              style={{
                fontSize: 9,
                color: "var(--slate,#8a8a82)",
                opacity: 0.45,
                fontWeight: 500,
              }}
            >
              {hint}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
});

const RowLabel = memo(function RowLabel({ children }) {
  return (
    <p
      style={{
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: "0.08em",
        color: "var(--slate,#8a8a82)",
        textTransform: "uppercase",
        margin: "0 0 5px",
      }}
    >
      {children}
    </p>
  );
});

export default ComposerModal;
