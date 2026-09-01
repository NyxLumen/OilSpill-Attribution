import { PathLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import type { VesselTrail } from '@/types/vessel';

export interface TrailLayerOptions {
  trails: VesselTrail[];
  selectedVesselId: string | null;
  candidateVesselIds?: string[];
  isCorrelating?: boolean;
}

/**
 * Creates deck.gl layers for rendering historical vessel trails.
 *
 * Provides clear visual hierarchy:
 * 1. Active selected vessel: prominent golden highlight (3.5px)
 * 2. Correlated candidate vessels: cyan correlation highlight (2.2px)
 * 3. General background traffic: restrained translucent blue (1.2px)
 */
export function createTrailLayers(options: TrailLayerOptions): Layer[] {
  const { trails, selectedVesselId, candidateVesselIds = [], isCorrelating = false } = options;

  const layers: Layer[] = [];

  if (!trails || trails.length === 0) {
    return layers;
  }

  const validTrails = trails.filter((t) => t.points && t.points.length >= 2);

  if (validTrails.length === 0) {
    return layers;
  }

  const candidateSet = new Set(candidateVesselIds);

  layers.push(
    new PathLayer<VesselTrail>({
      id: 'vessel-trails-layer',
      data: validTrails,
      pickable: false,
      widthScale: 1,
      widthMinPixels: 1.2,
      widthMaxPixels: 5,
      capRounded: true,
      jointRounded: true,
      getPath: (d: VesselTrail) => d.points.map((p): [number, number] => [p.lng, p.lat]),
      getColor: (d) => {
        if (d.vesselId === selectedVesselId) {
          return [245, 158, 11, 235]; // Golden selected trail
        }
        if (isCorrelating && candidateSet.has(d.vesselId)) {
          return [6, 182, 212, 190]; // Cyan candidate correlation trail
        }
        return [59, 130, 246, isCorrelating ? 50 : 80]; // Subdued background trail
      },
      getWidth: (d) => {
        if (d.vesselId === selectedVesselId) return 3.5;
        if (isCorrelating && candidateSet.has(d.vesselId)) return 2.2;
        return 1.2;
      },
      updateTriggers: {
        getColor: [selectedVesselId, Array.from(candidateSet).join(','), isCorrelating],
        getWidth: [selectedVesselId, Array.from(candidateSet).join(','), isCorrelating],
      },
    })
  );

  return layers;
}
