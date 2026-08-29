import { useRef, useCallback, useState } from 'react';
import Map, { type MapRef, type ViewStateChangeEvent } from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
import maplibreglWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { Plus, Minus, Compass, Crosshair } from 'lucide-react';
import { useMapStore } from '@/store';

// Explicitly configure MapLibre worker URL for Vite dev/prod bundling
maplibregl.setWorkerUrl(maplibreglWorkerUrl);
maplibregl.config.WORKER_URL = maplibreglWorkerUrl;

/**
 * Standard Positron basemap style (light maritime theme)
 */
const BASEMAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

/**
 * Map Controls Component
 *
 * Floating zoom, compass, and viewport controls for the map.
 */
function MapControls({ mapRef }: { mapRef: React.RefObject<MapRef | null> }) {
  const { viewport, resetViewport, setViewport } = useMapStore();
  const [is3D, setIs3D] = useState(false);

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    } else {
      setViewport({ zoom: Math.min(viewport.zoom + 1, 18) });
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    } else {
      setViewport({ zoom: Math.max(viewport.zoom - 1, 1) });
    }
  };

  const handleResetView = () => {
    resetViewport();
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [67.0, 18.0],
        zoom: 6,
        pitch: 0,
        bearing: 0,
        duration: 1200,
      });
      setIs3D(false);
    }
  };

  const handleToggle3D = () => {
    if (mapRef.current) {
      const nextPitch = is3D ? 0 : 60;
      mapRef.current.easeTo({
        pitch: nextPitch,
        duration: 800,
      });
      setIs3D(!is3D);
    }
  };

  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
      {/* Zoom Controls */}
      <div className="flex rounded-xl bg-surface-transparent backdrop-blur-md border border-border-subtle shadow-floating overflow-hidden">
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-3 text-ocean-600 hover:text-ocean-900 hover:bg-ocean-50 transition-smooth"
          aria-label="Zoom out"
        >
          <Minus className="w-5 h-5" />
        </button>
        <div className="w-px bg-border-subtle" />
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-3 text-ocean-600 hover:text-ocean-900 hover:bg-ocean-50 transition-smooth"
          aria-label="Zoom in"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Compass & Reset */}
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={handleResetView}
          className="w-12 h-12 rounded-xl bg-surface-transparent backdrop-blur-md border border-border-subtle shadow-floating flex items-center justify-center text-ocean-600 hover:text-ocean-900 hover:bg-ocean-50 transition-smooth"
          aria-label="Reset view"
        >
          <Compass className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={handleToggle3D}
          className={`w-12 h-12 rounded-xl bg-surface-transparent backdrop-blur-md border border-border-subtle shadow-floating flex items-center justify-center transition-smooth ${
            is3D ? 'text-blue-accent font-bold bg-blue-50' : 'text-ocean-600 hover:text-ocean-900 hover:bg-ocean-50'
          }`}
          aria-label="Toggle 3D view"
        >
          <span className="text-xs font-medium">3D</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Crosshair / Center Indicator
 */
function CrosshairOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0">
      <div className="relative">
        <Crosshair className="w-8 h-8 text-blue-accent/20" />
      </div>
    </div>
  );
}

/**
 * OceanWatch Map Area Component
 *
 * Main interactive MapLibre map viewport with controls.
 */
export function MapArea() {
  const mapRef = useRef<MapRef | null>(null);
  const { viewport, setViewport } = useMapStore();

  const handleMove = useCallback((evt: ViewStateChangeEvent) => {
    setViewport({
      longitude: evt.viewState.longitude,
      latitude: evt.viewState.latitude,
      zoom: evt.viewState.zoom,
      bearing: evt.viewState.bearing,
      pitch: evt.viewState.pitch,
    });
  }, [setViewport]);

  return (
    <main className="w-full h-full absolute inset-0 overflow-hidden bg-ocean-50">
      {/* MapLibre Map Container */}
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        initialViewState={{
          longitude: viewport.longitude,
          latitude: viewport.latitude,
          zoom: viewport.zoom,
          bearing: viewport.bearing ?? 0,
          pitch: viewport.pitch ?? 0,
        }}
        mapStyle={BASEMAP_STYLE}
        onMove={handleMove}
        onLoad={(evt) => {
          (window as unknown as { mapInstance?: unknown }).mapInstance = evt.target;
          console.log('[MapArea] Map loaded successfully', evt.target);
        }}
        onError={(err) => {
          console.error('[MapArea] Map error event:', err);
        }}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      />

      {/* Crosshair */}
      <CrosshairOverlay />

      {/* Map Controls */}
      <MapControls mapRef={mapRef} />

      {/* Scale Indicator */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-transparent backdrop-blur-md border border-border-subtle text-xs text-ocean-600 z-10 shadow-floating">
        <div className="w-16 h-0.5 bg-ocean-500 rounded-full" />
        <span className="font-mono text-ocean-800">~10 km</span>
      </div>
    </main>
  );
}