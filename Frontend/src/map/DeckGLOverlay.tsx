import { useControl } from 'react-map-gl/maplibre';
import { MapboxOverlay, type MapboxOverlayProps } from '@deck.gl/mapbox';

/**
 * DeckGLOverlay Component
 *
 * Integrates deck.gl MapboxOverlay as an IControl into react-map-gl / MapLibre.
 * Coordinates WebGL overlay rendering for high-performance dynamic layers
 * (vessels, trails, spills, analytics) while preserving MapLibre's basemap.
 *
 * See AGENTS.md §8: MapLibre owns geography/basemap; deck.gl owns dynamic data.
 */
export function DeckGLOverlay(props: MapboxOverlayProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}
