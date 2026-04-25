/**
 * useSmartSizes.js
 * ─────────────────────────────────────────────────────────────────
 * React hook that wraps SmartSizeEngine.
 * Handles auto-switching when the current preset becomes incompatible.
 */

import { useMemo, useEffect } from "react";
import {
  SmartSizeEngine,
  getBestDefaultPreset,
  isPresetCompatible,
} from "../engines/SmartSizeEngine.js";
import { PLATFORM_LAYOUT_PRESETS } from "../data/platforms.js";

/**
 * @param {object} params
 * @param {string[]} params.selectedChannels
 * @param {string}   params.activePlatform       — currently previewed platform
 * @param {string}   params.selectedSizePreset    — current preset ID
 * @param {function} params.setSelectedSizePreset — setter
 * @param {function} params.onAutoFixed           — optional callback when auto-fix fires
 *
 * @returns {{ smartSizes, availablePresets, selectedRatio }}
 */
export function useSmartSizes({
  selectedChannels,
  activePlatform,
  selectedSizePreset,
  setSelectedSizePreset,
  onAutoFixed,
}) {
  /** Enriched ratio list with badges */
  const smartSizes = useMemo(
    () => SmartSizeEngine(selectedChannels),
    [JSON.stringify(selectedChannels)]
  );

  /** Layout presets for the currently previewed platform */
  const availablePresets = useMemo(
    () => (PLATFORM_LAYOUT_PRESETS[activePlatform] || []).map((preset) => {
      // Enrich each preset with its badge from the smart size list
      const sizeInfo = smartSizes.find((s) => s.id === preset.ratio);
      return { ...preset, badge: sizeInfo?.badge || null };
    }),
    [activePlatform, smartSizes]
  );

  /** The aspect ratio string that corresponds to the selected preset */
  const selectedRatio = useMemo(() => {
    const preset = availablePresets.find((p) => p.id === selectedSizePreset);
    return preset?.ratio || availablePresets[0]?.ratio || "1:1";
  }, [availablePresets, selectedSizePreset]);

  /**
   * Auto-fix: when the selected preset becomes incompatible with the
   * current platform selection, silently switch to the best available one.
   */
  useEffect(() => {
    if (!activePlatform || selectedChannels.length === 0) return;

    const compatible = isPresetCompatible(
      selectedSizePreset,
      activePlatform,
      selectedChannels
    );

    if (!compatible) {
      const bestId = getBestDefaultPreset(activePlatform, selectedChannels);
      if (bestId && bestId !== selectedSizePreset) {
        setSelectedSizePreset(bestId);
        onAutoFixed?.("Size auto-adjusted for best platform compatibility");
      }
    }
  }, [
    JSON.stringify(selectedChannels),
    activePlatform,
    selectedSizePreset,
  ]);

  return { smartSizes, availablePresets, selectedRatio };
}
