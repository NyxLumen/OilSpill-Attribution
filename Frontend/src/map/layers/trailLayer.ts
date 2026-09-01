import { PathLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import type { VesselTrail } from '@/types/vessel';

export interface TrailLayerOptions {
  trails: VesselTrail[];
  selectedVesselId: string | null;
  candidateVesselIds?: string[];
  topCandidateId?: string | null;
  isCorrelating?: boolean;
  isAttributed?: boolean;
}

/**
 * Creates deck.gl layers for rendering historical vessel trails.
 *
 * Provides clear visual hierarchy:
 * 1. Active selected vessel: prominent golden highlight (3.6px)
 * 2. Top attributed candidate: prominent golden/amber evidence track (3.6px)
 * 3. Correlated candidate vessels: cyan correlation highlight (2.2px)
 * 4. General background traffic: restrained translucent blue (1.2px)
 */
export function createTrailLayers(options: TrailLayerOptions): Layer[] {
  const {
    trails,
    selectedVesselId,
    candidateVesselIds = [],
    topCandidateId = null,
    isCorrelating = false,
    isAttributed = false,
  } = options;

  const layers: Layer[] = [];

  if (!trails || trails.length === 0) {
    return layers;
  }

  const validTrails = trails.filter((t) => t.points && t.points.length >= 2);

  if (validTrails.length === 0) {
    return layers;
  }

  const candidateSet = new Set(candidateVesselIds);
  const isInvestigationActive = isCorrelating || isAttributed;

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
          return [245, 158, 11, 245]; // Golden selected trail
        }
        if (isAttributed && d.vesselId === topCandidateId) {
          return [245, 158, 11, 235]; // Prominent golden/amber top candidate track
        }
        if (isInvestigationActive && candidateSet.has(d.vesselId)) {
          return [6, 182, 212, 175]; // Cyan candidate correlation trail
        }
        return [59, 130, 246, isInvestigationActive ? 45 : 80]; // Subdued background trail
      },
      getWidth: (d) => {
        if (d.vesselId === selectedVesselId) return 3.6;
        if (isAttributed && d.vesselId === topCandidateId) return 3.6;
        if (isInvestigationActive && candidateSet.has(d.vesselId)) return 2.2;
        return 1.2;
      },
      updateTriggers: {
        getColor: [selectedVesselId, topCandidateId, Array.from(candidateSet).join(','), isInvestigationActive, isAttributed],
        getWidth: [selectedVesselId, topCandidateId, Array.from(candidateSet).join(','), isInvestigationActive, isAttributed],
      },
    })
  );

  return layers;
}
