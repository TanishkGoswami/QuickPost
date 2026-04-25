/**
 * SmartSizeEngine.js
 * ─────────────────────────────────────────────────────────────────
 * Pure functions — no React, no side effects.
 * Computes which aspect ratios are compatible with selected platforms,
 * assigns support badges, and recommends the best default.
 */

import { ASPECT_RATIOS, PLATFORM_SUPPORTED_RATIOS, PLATFORM_LAYOUT_PRESETS } from "../data/platforms.js";

/**
 * Badge types:
 *   "best"    → all selected platforms support this ratio
 *   "partial" → some platforms support it
 *   "none"    → no selected platform supports it
 */

/**
 * Core engine — returns enriched ratio list sorted by compatibility.
 *
 * @param {string[]} selectedChannels
 * @returns {EnrichedRatio[]}
 */
export function SmartSizeEngine(selectedChannels) {
  if (selectedChannels.length === 0) {
    // No platforms selected: return all ratios with no badge
    return ASPECT_RATIOS.map((r) => ({
      ...r,
      badge: null,
      supportedBy: [],
      unsupportedBy: [],
      isRecommended: false,
    }));
  }

  const enriched = ASPECT_RATIOS.map((ratio) => {
    const supportedBy = selectedChannels.filter((p) =>
      (PLATFORM_SUPPORTED_RATIOS[p] || []).includes(ratio.id)
    );
    const unsupportedBy = selectedChannels.filter(
      (p) => !(PLATFORM_SUPPORTED_RATIOS[p] || []).includes(ratio.id)
    );

    let badge;
    if (supportedBy.length === selectedChannels.length) {
      badge = "best";
    } else if (supportedBy.length > 0) {
      badge = "partial";
    } else {
      badge = "none";
    }

    return { ...ratio, badge, supportedBy, unsupportedBy };
  });

  // Sort: best → partial → none
  const ORDER = { best: 0, partial: 1, none: 2 };
  const sorted = [...enriched].sort((a, b) => ORDER[a.badge] - ORDER[b.badge]);

  // Mark the top "best" ratio as recommended
  const recommended = sorted.find((r) => r.badge === "best") || sorted[0];
  return sorted.map((r) => ({ ...r, isRecommended: r.id === recommended.id }));
}

/**
 * Find the best default preset ID for a given platform + ratio.
 * Used for auto-switching when the current preset becomes incompatible.
 *
 * @param {string}   platformId
 * @param {string[]} selectedChannels  — for cross-platform awareness
 * @returns {string} presetId
 */
export function getBestDefaultPreset(platformId, selectedChannels = []) {
  const presets = PLATFORM_LAYOUT_PRESETS[platformId] || [];
  if (presets.length === 0) return "";

  const sizes = SmartSizeEngine(selectedChannels);
  const bestRatio = sizes.find((s) => s.badge === "best")?.id;

  // Find a preset matching the best ratio
  const match = presets.find((p) => p.ratio === bestRatio) || presets[0];
  return match.id;
}

/**
 * Check whether a given preset ID is still valid for the current
 * set of platforms. Returns false when the user should be auto-switched.
 *
 * @param {string}   presetId
 * @param {string}   platformId
 * @param {string[]} selectedChannels
 */
export function isPresetCompatible(presetId, platformId, selectedChannels) {
  const presets = PLATFORM_LAYOUT_PRESETS[platformId] || [];
  const preset  = presets.find((p) => p.id === presetId);
  if (!preset) return false;

  // Check that at least one selected platform supports this ratio
  return selectedChannels.some((p) =>
    (PLATFORM_SUPPORTED_RATIOS[p] || []).includes(preset.ratio)
  );
}
