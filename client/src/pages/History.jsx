import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Image as ImageIcon,
  Video,
  Search,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
  Share2,
} from "lucide-react";
import apiClient from "../utils/apiClient";
import { Skeleton } from "boneyard-js/react";

const API_BASE_URL = "/";

function History() {
  const { user } = useAuth();
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/broadcasts");
      setBroadcasts(response.data.broadcasts || []);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPlatformIcon = (id) => {
    const iconClass = "w-4 h-4 object-contain";
    switch (id.toLowerCase()) {
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
          <img
            src="/icons/reddit-icon.svg"
            className={iconClass}
            alt="Reddit"
          />
        );
      default:
        return <Share2 className="w-4 h-4" />;
    }
  };

  const filteredBroadcasts = broadcasts.filter((b) =>
    b.caption?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-0 mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Post History
          </h1>
          <p className="text-gray-600">
            Review and track your multi-platform broadcasts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 shadow-sm transition-all"
            />
          </div>
          <button className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all">
            <Filter className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <Skeleton
        name="history-list"
        loading={loading}
        fixture={
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-white rounded-2xl border border-gray-100 shadow-sm"
              />
            ))}
          </div>
        }
      >
        {filteredBroadcasts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No posts found
            </h3>
            <p className="text-gray-600 mb-8">
              You haven't broadcasted anything yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBroadcasts.map((post) => {
              const platforms = [
                {
                  id: "linkedin",
                  success: post.linkedin_success,
                  name: "LinkedIn",
                  error: post.linkedin_error,
                  url: post.linkedin_url,
                },
                {
                  id: "youtube",
                  success: post.youtube_success,
                  name: "YouTube",
                  error: post.youtube_error,
                  url: post.youtube_shorts_url || post.youtube_url,
                },
                {
                  id: "instagram",
                  success: post.instagram_success,
                  name: "Instagram",
                  error: post.instagram_error,
                  url: post.instagram_url,
                },
                {
                  id: "facebook",
                  success: post.facebook_success,
                  name: "Facebook",
                  error: post.facebook_error,
                  url: post.facebook_url,
                },

                {
                  id: "mastodon",
                  success: post.mastodon_success,
                  name: "Mastodon",
                  error: post.mastodon_error,
                  url: post.mastodon_url,
                },
                {
                  id: "bluesky",
                  success: post.bluesky_success,
                  name: "Bluesky",
                  error: post.bluesky_error,
                  url: post.bluesky_url,
                },
                {
                  id: "pinterest",
                  success: post.pinterest_success,
                  name: "Pinterest",
                  error: post.pinterest_error,
                  url: post.pinterest_url,
                },
                {
                  id: "threads",
                  success: post.threads_success,
                  name: "Threads",
                  error: post.threads_error,
                  url: post.threads_url,
                },
                {
                  id: "x",
                  success: post.x_success,
                  name: "X",
                  error: post.x_error,
                  url: post.x_url,
                },
                {
                  id: "reddit",
                  success: post.reddit_success,
                  name: "Reddit",
                  error: post.reddit_error,
                  url: post.reddit_url,
                },
              ].filter(
                (p) => p.success || (p.error && p.error !== "Not selected"),
              ); // FILTER OUT NOT SELECTED

              return (
                <div
                  key={post.id}
                  className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md ${
                    expandedId === post.id
                      ? "border-blue-200 ring-1 ring-blue-100"
                      : "border-gray-100"
                  }`}
                >
                  <div
                    className="p-5 flex items-start gap-5 cursor-pointer"
                    onClick={() => toggleExpand(post.id)}
                  >
                    {/* Media Preview */}
                    <div className="w-24 h-24 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 relative border border-gray-100">
                      {post.media_url ? (
                        <img
                          src={post.media_url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://placehold.co/150x150?text=Invalid+Image";
                          }}
                        />
                      ) : post.media_type === "image" ||
                        (post.video_filename &&
                          /\.(jpg|jpeg|png|gif|webp)$/i.test(
                            post.video_filename,
                          )) ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50">
                          <ImageIcon className="w-8 h-8 text-blue-200 mb-1" />
                          <span className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">
                            Image
                          </span>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900">
                          <Video className="w-8 h-8 text-white opacity-50 mb-1" />
                          <span className="text-[10px] text-white/50 font-bold uppercase">
                            Video
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content Summary */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                          <Calendar className="w-3.5 h-3.5" />
                          {post.status === "scheduled"
                            ? `Scheduled for ${formatDate(post.scheduled_for)}`
                            : formatDate(post.posted_at || post.created_at)}
                        </div>
                        <div className="flex items-center gap-2">
                          {post.status === "scheduled" && (
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[9px] font-bold uppercase tracking-tighter border border-indigo-200 shadow-sm animate-pulse">
                              Scheduled
                            </span>
                          )}
                          <div className="p-1 bg-gray-50 rounded-full">
                            {expandedId === post.id ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 line-clamp-1 mb-3 pr-8">
                        {post.caption || "Untitled Broadcast"}
                      </h3>

                      {/* Platform Quick Status (Only show attempted ones) */}
                      <div className="flex flex-wrap gap-2">
                        {platforms.map((platform) => (
                          <div
                            key={platform.id}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                              platform.success
                                ? "bg-green-50 text-green-700 border border-green-100"
                                : "bg-red-50 text-red-700 border border-red-100"
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
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Breakdown */}
                  {expandedId === post.id && (
                    <div className="px-5 pb-6 pt-2 border-t border-gray-50 bg-gray-50/20 animate-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {platforms.map((platform) => (
                          <div
                            key={platform.id}
                            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition-transform hover:scale-[1.02]"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2 text-sm">
                                {getPlatformIcon(platform.id)}
                                <span className="font-bold text-gray-800">
                                  {platform.name}
                                </span>
                              </div>
                              {platform.success ? (
                                <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter shadow-sm border border-green-200">
                                  Success
                                </span>
                              ) : (
                                <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter shadow-sm border border-red-200">
                                  Failed
                                </span>
                              )}
                            </div>

                            {platform.success ? (
                              <div className="space-y-3">
                                {platform.url && (
                                  <a
                                    href={platform.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 font-bold transition-colors group"
                                  >
                                    <span>View Live Post</span>
                                    <ExternalLink className="w-3 h-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <div className="text-[10px] text-red-600 bg-red-50/50 p-2 rounded-lg border border-red-50 italic">
                                {platform.error ||
                                  "Connection timeout or API error"}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Meta Data */}
                      <div className="mt-6 flex flex-col md:flex-row gap-4">
                        <div className="flex-1 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-50 pb-2">
                            Full Caption
                          </h4>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {post.caption || "(Empty caption)"}
                          </p>
                        </div>

                        <div className="w-full md:w-64 p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 w-full border-b border-gray-50 pb-2">
                            Media Data
                          </h4>
                          {post.media_type === "image" ||
                          (post.video_filename &&
                            /\.(jpg|jpeg|png|gif|webp)$/i.test(
                              post.video_filename,
                            )) ? (
                            <ImageIcon className="w-8 h-8 text-blue-100 mb-2" />
                          ) : (
                            <Video className="w-8 h-8 text-blue-100 mb-2" />
                          )}
                          <span className="text-xs font-bold text-gray-600 uppercase">
                            {post.media_type}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono mt-1 break-all">
                            {post.video_filename}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Skeleton>
    </div>
  );
}

export default History;
