import { PolygonLayer, ScatterplotLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import type { OilSpillIncident, SpillSeverity } from '@/types/incident';

export interface SpillLayerOptions {
  incidents: OilSpillIncident[];
  selectedIncidentId: string | null;
  onSelectIncident?: (incidentId: string) => void;
}

/**
 * Calibrated severity colors for spills
 */
export const SPILL_SEVERITY_COLORS: Record<SpillSeverity, [number, number, number]> = {
  low: [56, 189, 248],       // Sky / Cyan
  medium: [245, 158, 11],     // Amber
  high: [239, 68, 68],       // Red
  critical: [185, 28, 28],    // Deep Red
};

interface SpillPolygonFeature {
  incident: OilSpillIncident;
  polygon: [number, number][];
}

/**
 * Generate a geographically scaled polygon representing the spill extent.
 *
 * Formula:
 *   radiusKm = sqrt(areaKm2 / PI)
 *   latitudeDegrees = radiusKm / 111.32
 *   longitudeDegrees = radiusKm / (111.32 * cos(latitudeRadians))
 */
function createSpillPolygon(incident: OilSpillIncident, vertexCount: number = 48): [number, number][] {
  const { location, areaKm2 } = incident;
  const radiusKm = Math.sqrt(areaKm2 / Math.PI);
  const latDeg = radiusKm / 111.32;
  const latRad = (location.lat * Math.PI) / 180;
  const lngDeg = radiusKm / (111.32 * Math.cos(latRad));

  const coordinates: [number, number][] = [];

  for (let i = 0; i < vertexCount; i++) {
    const angle = (i / vertexCount) * 2 * Math.PI;
    // Subtle organic perturbation (±7%) to make the slick shape natural rather than a sterile circle
    const wobble = 1 + 0.07 * Math.sin(3 * angle) + 0.04 * Math.cos(5 * angle);
    const lng = location.lng + Math.cos(angle) * lngDeg * wobble;
    const lat = location.lat + Math.sin(angle) * latDeg * wobble;
    coordinates.push([lng, lat]);
  }

  // Close the polygon ring
  coordinates.push(coordinates[0]);

  return coordinates;
}

/**
 * Creates deck.gl layers for rendering oil spill geometry:
 * 1. Translucent petroleum slick body (PolygonLayer)
 * 2. High-visibility slick boundary outline (PolygonLayer stroke)
 * 3. Spill origin / initial detection point marker (ScatterplotLayer)
 */
export function createSpillLayers(options: SpillLayerOptions): Layer[] {
  const { incidents, selectedIncidentId, onSelectIncident } = options;

  const layers: Layer[] = [];

  if (!incidents || incidents.length === 0) {
    return layers;
  }

  const spillFeatures: SpillPolygonFeature[] = incidents.map((incident) => ({
    incident,
    polygon: createSpillPolygon(incident),
  }));

  // 1. Spill Polygon Fill & Boundary
  layers.push(
    new PolygonLayer<SpillPolygonFeature>({
      id: 'spill-polygon-layer',
      data: spillFeatures,
      pickable: true,
      autoHighlight: true,
      highlightColor: [239, 68, 68, 40],
      stroked: true,
      filled: true,
      extruded: false,
      wireframe: false,
      lineWidthMinPixels: 2,
      lineWidthMaxPixels: 5,
      getPolygon: (d) => d.polygon,
      getFillColor: (d) => {
        const isSelected = d.incident.id === selectedIncidentId;
        // Translucent petroleum slick fill with subtle dark opacity
        return isSelected ? [24, 24, 27, 160] : [24, 24, 27, 125];
      },
      getLineColor: (d) => {
        const baseColor = SPILL_SEVERITY_COLORS[d.incident.severity] || SPILL_SEVERITY_COLORS.high;
        const isSelected = d.incident.id === selectedIncidentId;
        return isSelected ? [255, 255, 255, 240] : [baseColor[0], baseColor[1], baseColor[2], 210];
      },
      getLineWidth: (d) => (d.incident.id === selectedIncidentId ? 3 : 2),
      onClick: (info) => {
        if (info.object && onSelectIncident) {
          onSelectIncident(info.object.incident.id);
        }
      },
      updateTriggers: {
        getFillColor: [selectedIncidentId],
        getLineColor: [selectedIncidentId],
        getLineWidth: [selectedIncidentId],
      },
    })
  );

  // 2. Spill Origin / Detection Source Marker
  layers.push(
    new ScatterplotLayer<OilSpillIncident>({
      id: 'spill-origin-layer',
      data: incidents,
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 100],
      getPosition: (d) => [d.location.lng, d.location.lat],
      getRadius: 180,
      radiusMinPixels: 6,
      radiusMaxPixels: 14,
      stroked: true,
      filled: true,
      getFillColor: (d) => {
        const color = SPILL_SEVERITY_COLORS[d.severity] || SPILL_SEVERITY_COLORS.high;
        return [color[0], color[1], color[2], 240];
      },
      getLineColor: [255, 255, 255, 255],
      getLineWidth: 2,
      lineWidthMinPixels: 2,
      onClick: (info) => {
        if (info.object && onSelectIncident) {
          onSelectIncident(info.object.id);
        }
      },
      updateTriggers: {
        getFillColor: [selectedIncidentId],
      },
    })
  );

  return layers;
}
