import { useMemo } from 'react';
import type { Layer } from '@deck.gl/core';
import { useMapStore } from '@/store';

/**
 * Hook to construct and manage the active deck.gl layers.
 *
 * Centralizes layer construction according to layer visibility settings
 * and data state. Memoizes layer arrays to prevent unnecessary recreation
 * during high-frequency map navigation or React state changes.
 *
 * See AGENTS.md §14: Keep layer construction stable and memoized.
 */
export function useDeckLayers(): Layer[] {
  const layerVisibility = useMapStore((state) => state.layerVisibility);

  // Memoize layer list based on visibility and underlying dataset references
  const layers = useMemo<Layer[]>(() => {
    const activeLayers: Layer[] = [];

    // Layer construction for Phase 3+ milestones (vessels, spills, trails, etc.)
    // will check layerVisibility flags and register layers accordingly.
    if (!layerVisibility) {
      return activeLayers;
    }

    return activeLayers;
  }, [layerVisibility]);

  return layers;
}
