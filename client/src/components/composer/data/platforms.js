/**
 * platforms.js — Single source of truth for all platform data
 * Imported by engines, hooks, and components. Never duplicated.
 */

export const PLATFORM_META = {
  instagram: {
    label: "Instagram",
    icon: "/icons/ig-instagram-icon.svg",
    color: "#E4405F",
    supportsImage: true,
    supportsVideo: true,
    requiresTitle: false,
    requiresSubreddit: false,
    charLimit: 2200,
    imgAspect: "aspect-square",
  },
  facebook: {
    label: "Facebook",
    icon: "/icons/facebook-round-color-icon.svg",
    color: "#1877F2",
    supportsImage: true,
    supportsVideo: true,
    requiresTitle: false,
    requiresSubreddit: false,
    charLimit: 63206,
    imgAspect: "aspect-video",
  },
  x: {
    label: "X",
    icon: "/icons/x-social-media-round-icon.svg",
    color: "#000000",
    supportsImage: true,
    supportsVideo: true,
    requiresTitle: false,
    requiresSubreddit: false,
    charLimit: 280,
    imgAspect: "aspect-video",
  },
  linkedin: {
    label: "LinkedIn",
    icon: "/icons/linkedin-icon.svg",
    color: "#0A66C2",
    supportsImage: true,
    supportsVideo: true,
    requiresTitle: false,
    requiresSubreddit: false,
    charLimit: 3000,
    imgAspect: "aspect-[1.91/1]",
  },
  youtube: {
    label: "YouTube",
    icon: "/icons/youtube-color-icon.svg",
    color: "#FF0000",
    supportsImage: false,   // YouTube does NOT support image posts
    supportsVideo: true,
    requiresTitle: true,    // YouTube title is mandatory
    requiresSubreddit: false,
    charLimit: 5000,
    imgAspect: "aspect-video",
  },
  threads: {
    label: "Threads",
    icon: "/icons/threads-icon.svg",
    color: "#000000",
    supportsImage: true,
    supportsVideo: true,
    requiresTitle: false,
    requiresSubreddit: false,
    charLimit: 500,
    imgAspect: "aspect-square",
  },
  pinterest: {
    label: "Pinterest",
    icon: "/icons/pinterest-round-color-icon.svg",
    color: "#BD081C",
    supportsImage: true,
    supportsVideo: true,
    requiresTitle: true,     // Pinterest title required
    requiresSubreddit: false,
    charLimit: 500,
    imgAspect: "aspect-[2/3]",
  },
  bluesky: {
    label: "Bluesky",
    icon: "/icons/bluesky-circle-color-icon.svg",
    color: "#0085FF",
    supportsImage: true,
    supportsVideo: false,    // Bluesky doesn't support video
    requiresTitle: false,
    requiresSubreddit: false,
    charLimit: 300,
    imgAspect: "aspect-video",
  },
  mastodon: {
    label: "Mastodon",
    icon: "/icons/mastodon-round-icon.svg",
    color: "#6364FF",
    supportsImage: true,
    supportsVideo: false,    // Mastodon doesn't support video posts via API
    requiresTitle: false,
    requiresSubreddit: false,
    charLimit: 500,
    imgAspect: "aspect-video",
  },
  reddit: {
    label: "Reddit",
    icon: "/icons/reddit-icon.svg",
    color: "#FF4500",
    supportsImage: true,
    supportsVideo: true,
    requiresTitle: true,     // Reddit title required
    requiresSubreddit: true, // Reddit subreddit required
    charLimit: 40000,
    imgAspect: "aspect-video",
    suggestedSubreddits: [
      "Influencersinthewild",
      "StockMarket",
      "indiameme",
      "Cricket",
      "news",
      "technology",
      "IndiaInvestments",
      "jobs",
      "memes",
      "dankmemes",
      "funny"
    ]
  },
};

/** Which aspect ratios each platform supports */
export const PLATFORM_SUPPORTED_RATIOS = {
  instagram: ["1:1", "4:5", "9:16", "16:9"],
  facebook:  ["1:1", "9:16", "16:9"],
  x:         ["1:1", "16:9"],
  linkedin:  ["1:1", "1.91:1"],
  youtube:   ["16:9", "9:16"],
  threads:   ["1:1", "9:16"],
  pinterest: ["2:3", "1:1"],
  bluesky:   ["1:1", "16:9"],
  mastodon:  ["1:1", "16:9"],
  reddit:    ["1:1", "16:9"],
};

/** Post types available per platform */
export const PLATFORM_POST_TYPES = {
  instagram: ["post", "story", "reel"],
  facebook:  ["post", "story", "reel"],
  youtube:   ["post", "reel"],
  x:         ["post"],
  linkedin:  ["post"],
  threads:   ["post"],
  pinterest: ["post"],
  bluesky:   ["post"],
  mastodon:  ["post"],
  reddit:    ["post"],
};

/** Layout presets per platform */
export const PLATFORM_LAYOUT_PRESETS = {
  instagram: [
    { id: "ig-post-square", ratio: "1:1",   title: "Post Square",  subtitle: "1080×1080" },
    { id: "ig-portrait",    ratio: "4:5",   title: "Portrait",     subtitle: "1080×1350" },
    { id: "ig-reel",        ratio: "9:16",  title: "Reel",         subtitle: "1080×1920" },
    { id: "ig-story",       ratio: "9:16",  title: "Story",        subtitle: "1080×1920" },
    { id: "ig-landscape",   ratio: "16:9",  title: "Landscape",    subtitle: "1920×1080" },
  ],
  youtube: [
    { id: "yt-video",     ratio: "16:9", title: "Video",     subtitle: "1920×1080" },
    { id: "yt-shorts",    ratio: "9:16", title: "Shorts",    subtitle: "1080×1920" },
    { id: "yt-thumbnail", ratio: "16:9", title: "Thumbnail", subtitle: "1280×720"  },
  ],
  linkedin: [
    { id: "li-image",    ratio: "1.91:1", title: "Image",    subtitle: "1200×627"  },
    { id: "li-square",   ratio: "1:1",    title: "Square",   subtitle: "1080×1080" },
    { id: "li-carousel", ratio: "1:1",    title: "Carousel", subtitle: "1080×1080" },
  ],
  x: [
    { id: "x-image",  ratio: "16:9", title: "Image",  subtitle: "1200×675"  },
    { id: "x-square", ratio: "1:1",  title: "Square", subtitle: "1080×1080" },
  ],
  facebook: [
    { id: "fb-image", ratio: "1:1",  title: "Image", subtitle: "1200×1200" },
    { id: "fb-reel",  ratio: "9:16", title: "Reel",  subtitle: "1080×1920" },
    { id: "fb-story", ratio: "9:16", title: "Story", subtitle: "1080×1920" },
  ],
  pinterest: [
    { id: "pin-standard", ratio: "2:3", title: "Pin", subtitle: "1000×1500" },
    { id: "pin-square",   ratio: "1:1", title: "Square Pin", subtitle: "1000×1000" },
  ],
  threads: [
    { id: "threads-post",     ratio: "1:1",  title: "Post",     subtitle: "1080×1080" },
    { id: "threads-vertical", ratio: "9:16", title: "Vertical", subtitle: "1080×1920" },
  ],
  bluesky: [
    { id: "bsky-image",  ratio: "16:9", title: "Image",  subtitle: "1200×675"  },
    { id: "bsky-square", ratio: "1:1",  title: "Square", subtitle: "1080×1080" },
  ],
  mastodon: [
    { id: "masto-image",  ratio: "16:9", title: "Image",  subtitle: "1200×675"  },
    { id: "masto-square", ratio: "1:1",  title: "Square", subtitle: "1080×1080" },
  ],
  reddit: [
    { id: "reddit-image",  ratio: "16:9", title: "Image",  subtitle: "1200×675"  },
    { id: "reddit-square", ratio: "1:1",  title: "Square", subtitle: "1080×1080" },
  ],
};

/** All aspect ratio definitions */
export const ASPECT_RATIOS = [
  { id: "1:1",    label: "Square",     desc: "Feed / Post",       cssClass: "aspect-square"   },
  { id: "4:5",    label: "Portrait",   desc: "4:5 Format",        cssClass: "aspect-[4/5]"    },
  { id: "9:16",   label: "Vertical",   desc: "Reel / Story",      cssClass: "aspect-[9/16]"   },
  { id: "1.91:1", label: "Landscape",  desc: "LinkedIn / FB",     cssClass: "aspect-[1.91/1]" },
  { id: "2:3",    label: "Pin",        desc: "Pinterest",         cssClass: "aspect-[2/3]"    },
  { id: "16:9",   label: "Widescreen", desc: "YouTube / Wide",    cssClass: "aspect-video"    },
];

/** Get presets for a given platform */
export function getPresetsForPlatform(platformId) {
  return PLATFORM_LAYOUT_PRESETS[platformId] || [];
}
