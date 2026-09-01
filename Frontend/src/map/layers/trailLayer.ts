import { PathLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import type { VesselTrail } from '@/types/vessel';

export interface TrailLayerOptions {
  trails: VesselTrail[];
  selectedVesselId: string | null;
}

/**
 * Creates deck.gl layers for rendering historical vessel trails.
 *
 * Trails are rendered using PathLayer with screen-space minimum pixel width
 * so they remain readable at all operational zoom levels without becoming hairlines.
 * The active selected vessel's trail is highlighted with high contrast.
 */
export function createTrailLayers(options: TrailLayerOptions): Layer[] {
  const { trails, selectedVesselId } = options;

  const layers: Layer[] = [];

  if (!trails || trails.length === 0) {
    return layers;
  }

  // Filter out any trails with fewer than 2 points
  const validTrails = trails.filter((t) => t.points && t.points.length >= 2);

  if (validTrails.length === 0) {
    return layers;
  }

  layers.push(
    new PathLayer<VesselTrail>({
      id: 'vessel-trails-layer',
      data: validTrails,
      pickable: false, // Trails remain subordinate to vessel icons for picking
      widthScale: 1,
      widthMinPixels: 1.5,
      widthMaxPixels: 5,
      capRounded: true,
      jointRounded: true,
      getPath: (d: VesselTrail) => d.points.map((p): [number, number] => [p.lng, p.lat]),
      getColor: (d) => {
        const isSelected = d.vesselId === selectedVesselId;
        // Selected trail: bright golden accent; normal background trails: subtle translucent blue
        return isSelected ? [245, 158, 11, 235] : [59, 130, 246, 85];
      },
      getWidth: (d) => (d.vesselId === selectedVesselId ? 3.5 : 1.5),
      updateTriggers: {
        getColor: [selectedVesselId],
        getWidth: [selectedVesselId],
      },
    })
  );

  return layers;
}
