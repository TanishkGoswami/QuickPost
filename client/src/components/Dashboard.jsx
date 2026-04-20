import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Plus,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
  Share2,
  CheckCircle2,
  XCircle,
  Video,
  Image as ImageIcon,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import apiClient from "../utils/apiClient";
import ComposerModal from "./ComposerModal";
import PostPreviewModal from "./PostPreviewModal";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ── Platform helpers ──────────────────────────────────────────────────── */
function getPlatformIcon(id) {
  const iconClass = "w-4 h-4 object-contain";
  switch (id) {
    case "facebook":
      return (
        <img
          src="/icons/facebook-round-color-icon.svg"
          className={iconClass}
          alt="Facebook"
        />
      );
    case "instagram":
      return (
        <img
          src="/icons/ig-instagram-icon.svg"
          className={iconClass}
          alt="Instagram"
        />
      );
    case "x":
      return (
        <img
          src="/icons/x-social-media-round-icon.svg"
          className={iconClass}
          alt="X"
        />
      );
    case "linkedin":
      return (
        <img
          src="/icons/linkedin-icon.svg"
          className={iconClass}
          alt="LinkedIn"
        />
      );
    case "tiktok":
      return (
        <img
          src="/icons/tiktok-circle-icon.svg"
          className={iconClass}
          alt="TikTok"
        />
      );
    case "youtube":
      return (
        <img
          src="/icons/youtube-color-icon.svg"
          className={iconClass}
          alt="YouTube"
        />
      );
    case "pinterest":
      return (
        <img
          src="/icons/pinterest-round-color-icon.svg"
          className={iconClass}
          alt="Pinterest"
        />
      );
    case "threads":
      return (
        <img
          src="/icons/threads-icon.svg"
          className={iconClass}
          alt="Threads"
        />
      );
    case "mastodon":
      return (
        <img
          src="/icons/mastodon-round-icon.svg"
          className={iconClass}
          alt="Mastodon"
        />
      );
    case "bluesky":
      return (
        <img
          src="/icons/bluesky-circle-color-icon.svg"
          className={iconClass}
          alt="Bluesky"
        />
      );
    case "reddit":
      return (
        <img src="/icons/reddit-icon.svg" className={iconClass} alt="Reddit" />
      );
    case "google-business":
      return (
        <img
          src="/icons/google-icon.svg"
          className={iconClass}
          alt="GoogleProfile"
        />
      );
    default:
      return <Share2 className="w-4 h-4" />;
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
      id: "tiktok",
      name: "TikTok",
      success: post.tiktok_success,
      error: post.tiktok_error,
      url: null,
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

function MediaThumb({ post, className = "" }) {
  const isImage =
    post.media_type === "image" ||
    /\.(jpg|jpeg|png|gif|webp)$/i.test(post.video_filename || "");
  return (
    <div className={`bg-gray-100 overflow-hidden ${className}`}>
      {post.media_url ? (
        <img
          src={post.media_url}
          alt="Preview"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = "https://placehold.co/300x300?text=Preview";
          }}
        />
      ) : isImage ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50">
          <ImageIcon className="w-8 h-8 text-blue-200 mb-1" />
          <span className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">
            Image
          </span>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900">
          <Video className="w-8 h-8 text-white/40 mb-1" />
          <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
            Video
          </span>
        </div>
      )}
    </div>
  );
}

function PlatformBadge({ platform }) {
  return (
    <div
      className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${
        platform.success
          ? "bg-green-50 text-green-700 border-green-100"
          : "bg-red-50 text-red-700 border-red-100"
      }`}
    >
      {getPlatformIcon(platform.id)}
      <span>{platform.name}</span>
      {platform.success ? (
        <CheckCircle2 className="w-3 h-3" />
      ) : (
        <XCircle className="w-3 h-3" />
      )}
    </div>
  );
}

/* ── Grid Card (click → modal) ────────────────────────────────────────── */
function GridCard({ post, onOpen, formatDate }) {
  const platforms = buildPlatforms(post);
  const successCount = platforms.filter((p) => p.success).length;
  return (
    <div
      onClick={onOpen}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer group"
    >
      <div className="relative">
        <MediaThumb post={post} className="w-full h-44" />
        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          {post.media_type || "media"}
        </div>
        {successCount > 0 && (
          <div className="absolute bottom-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {successCount} platform{successCount > 1 ? "s" : ""}
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
          <Calendar className="w-3 h-3" />
          {post.status === "scheduled"
            ? formatDate(post.scheduled_for)
            : formatDate(post.posted_at || post.created_at)}
        </div>
        <p className="text-sm font-bold text-gray-900 line-clamp-2 mb-3 leading-normal flex-1">
          {post.caption || (
            <span className="text-gray-300 italic">No caption</span>
          )}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {platforms.map((p) => (
            <PlatformBadge key={p.id} platform={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── List Row ──────────────────────────────────────────────────────────── */
function ListRow({ post, expanded, onToggle, formatDate }) {
  const platforms = buildPlatforms(post);
  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${
        expanded ? "border-blue-200 ring-1 ring-blue-100" : "border-gray-100"
      }`}
    >
      <div
        className="p-5 flex items-start gap-5 cursor-pointer"
        onClick={onToggle}
      >
        <MediaThumb
          post={post}
          className="w-20 h-20 rounded-xl flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              <Calendar className="w-3 h-3" />
              {post.status === "scheduled"
                ? formatDate(post.scheduled_for)
                : formatDate(post.posted_at || post.created_at)}
            </div>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <h3 className="text-sm font-bold text-gray-900 line-clamp-1 mb-2 leading-normal">
            {post.caption || "Untitled Broadcast"}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {platforms.map((p) => (
              <PlatformBadge key={p.id} platform={p} />
            ))}
          </div>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/30 px-5 pb-5 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {platforms.map((p) => (
              <div
                key={p.id}
                className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getPlatformIcon(p.id)}
                    <span className="text-xs font-bold text-gray-800">
                      {p.name}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      p.success
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-red-100 text-red-700 border-red-200"
                    }`}
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
                      className="inline-flex items-center gap-1.5 text-[11px] text-blue-600 font-bold hover:text-blue-800 transition-colors"
                    >
                      View Live Post <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold">
                      <Clock className="w-3 h-3 animate-pulse" /> Pending Sync
                    </div>
                  )
                ) : (
                  <p className="text-[10px] text-red-500 italic font-medium">
                    {p.error || "API error"}
                  </p>
                )}
              </div>
            ))}
          </div>
          {post.caption && (
            <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                Full Caption
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {post.caption}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Dashboard ────────────────────────────────────────────────────── */
function Dashboard() {
  const { user, refreshAccounts } = useAuth();
  const [activeTab, setActiveTab] = useState("sent");
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedPost, setSelectedPost] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const tabs = [
    {
      id: "sent",
      label: "Sent",
      count: activeTab === "sent" ? broadcasts.length : 0,
    },
    {
      id: "queue",
      label: "Queue",
      count: activeTab === "queue" ? broadcasts.length : 0,
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
    if (params.get("success")) {
      refreshAccounts();
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [refreshAccounts]);

  useEffect(() => {
    fetchBroadcasts();
    resetPagination();
  }, [activeTab]);
  useEffect(() => {
    resetPagination();
  }, [searchTerm]);

  const resetPagination = () => setCurrentPage(1);

  const fetchBroadcasts = async () => {
    try {
      setLoading(true);
      // 'history' fetches all broadcasts
      // 'sent' filters by sent status
      // 'queue' filters by scheduled status
      let params = {};
      if (activeTab === "sent") params.status = "sent";
      else if (activeTab === "queue") params.status = "scheduled";

      const response = await apiClient.get("/api/broadcasts", { params });
      setBroadcasts(response.data.broadcasts || []);
    } catch (err) {
      console.error("Failed to fetch broadcasts:", err);
      setBroadcasts([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const toggleExpand = (id) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const filtered = broadcasts.filter((b) =>
    b.caption?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Pagination Logic
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── Pagination Component ── */
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-10 mb-6">
        <button
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
              currentPage === page
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                : "bg-white border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() =>
            handlePageChange(Math.min(totalPages, currentPage + 1))
          }
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top Header ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">Post Analytics</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setComposerOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-sm flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              New Post
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex items-center gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? "bg-blue-100" : "bg-gray-100"}`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sent/Queue/History Tab: search + view toggle ── */}
      {(activeTab === "sent" ||
        activeTab === "queue" ||
        activeTab === "history") &&
        !loading &&
        broadcasts.length > 0 && (
          <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-bold text-gray-700">
                  {broadcasts.length}
                </span>
                <span className="text-xs text-gray-400">
                  {activeTab === "queue" ? "scheduled" : "total"} posts
                </span>
              </div>
              <div className="w-px h-4 bg-gray-200" />
              {activeTab !== "queue" && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-bold text-gray-700">
                    {
                      broadcasts.filter((b) =>
                        buildPlatforms(b).some((p) => p.success),
                      ).length
                    }
                  </span>
                  <span className="text-xs text-gray-400">successful</span>
                </div>
              )}
              {activeTab === "queue" && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs text-indigo-600 font-bold uppercase tracking-tight">
                    Pending Broadcast
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-52 text-sm transition-all"
                />
              </div>
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

      {/* ── Main Content ── */}
      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4" />
            <p className="text-gray-500 text-sm font-medium">Syncing data...</p>
          </div>
        ) : (activeTab === "sent" ||
            activeTab === "queue" ||
            activeTab === "history") &&
          filtered.length > 0 ? (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {paginatedItems.map((post) => (
                  <GridCard
                    key={post.id}
                    post={post}
                    onOpen={() => setSelectedPost(post)}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4 max-w-4xl mx-auto">
                {paginatedItems.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="cursor-pointer"
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
            <Pagination />
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-20 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Share2 className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 font-display">
              {activeTab === "queue"
                ? "Your queue is empty"
                : activeTab === "drafts"
                  ? "No drafts yet"
                  : activeTab === "history"
                    ? "No broadcast history yet"
                    : "Ready for your first boost?"}
            </h3>
            <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto">
              {activeTab === "sent" || activeTab === "history"
                ? "Create a post and broadcast it across your social channels to see analytics here."
                : "Schedule posts to see them appear here."}
            </p>
            {(activeTab === "sent" || activeTab === "history") && (
              <button
                onClick={() => setComposerOpen(true)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-200"
              >
                Launch your first post
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
      <PostPreviewModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
      />
    </div>
  );
}

export default Dashboard;
