import { IconLayer, ScatterplotLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import type { Vessel, VesselType } from '@/types/vessel';

/**
 * Calibrated maritime color palette for vessel types
 */
export const VESSEL_TYPE_COLORS: Record<VesselType, string> = {
  tanker: '#f59e0b',    // Amber
  cargo: '#3b82f6',     // Blue
  container: '#06b6d4', // Cyan
  fishing: '#10b981',   // Emerald
  patrol: '#8b5cf6',    // Purple
  other: '#64748b',     // Slate
};

/**
 * Generate a clean SVG directional maritime vessel icon Data URI.
 * The vessel silhouette points North (UP / 0°).
 */
function createVesselSvg(fillColor: string, isSelected: boolean = false, isCandidate: boolean = false): string {
  const strokeColor = '#ffffff';
  const strokeWidth = isSelected ? '3' : '2';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    ${isSelected ? `<circle cx="32" cy="32" r="30" fill="${fillColor}" fill-opacity="0.25" stroke="${fillColor}" stroke-width="2" stroke-dasharray="4 2"/>` : ''}
    ${!isSelected && isCandidate ? `<circle cx="32" cy="32" r="28" fill="none" stroke="#06b6d4" stroke-width="2" stroke-dasharray="3 2"/>` : ''}
    <path d="M32 6 C37 18 47 32 47 50 C47 54 44 58 32 54 C20 58 17 54 17 50 C17 32 27 18 32 6 Z"
          fill="${fillColor}"
          stroke="${strokeColor}"
          stroke-width="${strokeWidth}"
          stroke-linejoin="round"/>
    <rect x="27" y="34" width="10" height="12" rx="2" fill="#ffffff" fill-opacity="0.95"/>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Pre-generated static icon map per vessel type, selection, and candidate state
 */
const ICON_CACHE: Record<string, string> = {};

function getVesselIconUrl(type: VesselType, isSelected: boolean, isCandidate: boolean): string {
  const key = `${type}_${isSelected ? 'sel' : 'norm'}_${isCandidate ? 'cand' : 'norm'}`;
  if (!ICON_CACHE[key]) {
    const color = VESSEL_TYPE_COLORS[type] || VESSEL_TYPE_COLORS.other;
    ICON_CACHE[key] = createVesselSvg(color, isSelected, isCandidate);
  }
  return ICON_CACHE[key];
}

export interface VesselLayerOptions {
  vessels: Vessel[];
  selectedVesselId: string | null;
  candidateVesselIds?: string[];
  isCorrelating?: boolean;
  onSelectVessel?: (vesselId: string) => void;
}

/**
 * Creates deck.gl layers for rendering 2D directional vessels with
 * restrained visual hierarchy during investigation correlation.
 */
export function createVesselLayers(options: VesselLayerOptions): Layer[] {
  const {
    vessels,
    selectedVesselId,
    candidateVesselIds = [],
    isCorrelating = false,
    onSelectVessel,
  } = options;

  const layers: Layer[] = [];

  if (!vessels || vessels.length === 0) {
    return layers;
  }

  const candidateSet = new Set(candidateVesselIds);

  // 1. Candidate correlation indicator halos (subtle cyan/teal ring around investigated vessels)
  if (isCorrelating && candidateVesselIds.length > 0) {
    const candidateVessels = vessels.filter((v) => candidateSet.has(v.id) && v.id !== selectedVesselId);
    if (candidateVessels.length > 0) {
      layers.push(
        new ScatterplotLayer({
          id: 'vessels-candidate-halos',
          data: candidateVessels,
          getPosition: (d: Vessel) => [d.position.lng, d.position.lat],
          getRadius: 320,
          radiusMinPixels: 16,
          radiusMaxPixels: 36,
          stroked: true,
          filled: true,
          getFillColor: [6, 182, 212, 20],   // Restrained cyan fill
          getLineColor: [6, 182, 212, 180],  // Cyan indicator stroke
          getLineWidth: 1.5,
          lineWidthMinPixels: 1.5,
          transitions: {
            getPosition: { duration: 150, easing: (t: number) => t },
          },
          pickable: false,
        })
      );
    }
  }

  // 2. Active Vessel Selection Halo
  if (selectedVesselId) {
    const selectedVessel = vessels.find((v) => v.id === selectedVesselId);
    if (selectedVessel) {
      layers.push(
        new ScatterplotLayer({
          id: 'vessels-selected-halo',
          data: [selectedVessel],
          getPosition: (d: Vessel) => [d.position.lng, d.position.lat],
          getRadius: 400,
          radiusMinPixels: 22,
          radiusMaxPixels: 48,
          stroked: true,
          filled: true,
          getFillColor: [59, 130, 246, 35],
          getLineColor: [59, 130, 246, 220],
          getLineWidth: 2,
          lineWidthMinPixels: 2,
          transitions: {
            getPosition: { duration: 150, easing: (t: number) => t },
          },
          pickable: false,
        })
      );
    }
  }

  // 3. Primary 2D Directional Vessel Icon Layer
  layers.push(
    new IconLayer<Vessel>({
      id: 'vessels-2d-layer',
      data: vessels,
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 80],
      getPosition: (d: Vessel) => [d.position.lng, d.position.lat],
      getIcon: (d: Vessel) => {
        const isSelected = d.id === selectedVesselId;
        const isCandidate = isCorrelating && candidateSet.has(d.id);
        return {
          url: getVesselIconUrl(d.type, isSelected, isCandidate),
          width: 64,
          height: 64,
          anchorX: 32,
          anchorY: 32,
        };
      },
      getSize: (d: Vessel) => {
        if (d.id === selectedVesselId) return 36;
        if (isCorrelating && candidateSet.has(d.id)) return 32;
        return isCorrelating ? 24 : 28; // Slightly subdued background vessels during active investigation
      },
      getColor: (d: Vessel) => {
        if (!isCorrelating) return [255, 255, 255, 255];
        if (d.id === selectedVesselId || candidateSet.has(d.id)) return [255, 255, 255, 255];
        return [255, 255, 255, 175]; // Restrained background opacity
      },
      sizeScale: 1,
      sizeMinPixels: 16,
      sizeMaxPixels: 44,
      getAngle: (d: Vessel) => (360 - (d.heading % 360)) % 360,
      transitions: {
        getPosition: { duration: 150, easing: (t: number) => t },
        getAngle: { duration: 150, easing: (t: number) => t },
      },
      onClick: (info) => {
        if (info.object && onSelectVessel) {
          onSelectVessel(info.object.id);
        }
      },
      updateTriggers: {
        getIcon: [selectedVesselId, Array.from(candidateSet).join(','), isCorrelating],
        getSize: [selectedVesselId, Array.from(candidateSet).join(','), isCorrelating],
        getColor: [selectedVesselId, Array.from(candidateSet).join(','), isCorrelating],
      },
    })
  );

  return layers;
}
