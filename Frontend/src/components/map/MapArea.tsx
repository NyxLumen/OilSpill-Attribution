import { useRef, useCallback, useEffect } from 'react';
import Map, { Source, Layer, type MapRef, type ViewStateChangeEvent } from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
import maplibreglWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { Plus, Minus, Compass, Crosshair } from 'lucide-react';
import { useMapStore } from '@/store';
import { DeckGLOverlay, useDeckLayers } from '@/map';

// Explicitly configure MapLibre worker URL for Vite dev/prod bundling
maplibregl.setWorkerUrl(maplibreglWorkerUrl);
maplibregl.config.WORKER_URL = maplibreglWorkerUrl;

// Ensure MapLibre map.transform is aliased to painter/camera transform for @deck.gl/mapbox compatibility
if (typeof window !== 'undefined') {
  try {
    Object.defineProperty(maplibregl.Map.prototype, 'transform', {
      get() {
        return (
          (this as unknown as { painter?: { transform?: unknown } }).painter?.transform ??
          (this as unknown as { _camera?: { transform?: unknown } })._camera?.transform
        );
      },
      configurable: true,
      enumerable: true,
    });
  } catch {
    // Ignore if already configured
  }
}

/**
 * Standard Positron basemap style (light maritime theme)
 */
const BASEMAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

/**
 * AWS Open Data Global Elevation (Terrarium RGB DEM)
 * Using separate source IDs for 3D terrain mesh vs hillshade layer
 * prevents MapLibre GL JS source cache conflicts.
 */
const TERRAIN_SOURCE_ID = 'terrain-dem-3d';
const HILLSHADE_SOURCE_ID = 'terrain-dem-hillshade';
const TERRAIN_TILES_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';

/**
 * Apply terrain mode directly to a MapLibre Map instance
 */
function applyTerrainMode(mode: 'flat' | 'hillshade' | '3d', map: maplibregl.Map | undefined | null) {
  if (!map) return;
  try {
    // 1. Manage Hillshade layer visibility
    if (map.getLayer('terrain-hillshade')) {
      map.setLayoutProperty(
        'terrain-hillshade',
        'visibility',
        mode === 'hillshade' || mode === '3d' ? 'visible' : 'none'
      );
    }

    // 2. Manage 3D DEM Terrain mesh & camera pitch
    if (mode === '3d') {
      if (!map.getSource(TERRAIN_SOURCE_ID)) {
        map.addSource(TERRAIN_SOURCE_ID, {
          type: 'raster-dem',
          tiles: [TERRAIN_TILES_URL],
          encoding: 'terrarium',
          tileSize: 256,
          maxzoom: 14,
        });
      }
      map.setTerrain({ source: TERRAIN_SOURCE_ID, exaggeration: 2.5 });
      map.easeTo({ pitch: 60, duration: 800 });
    } else {
      map.setTerrain(null);
      if (map.getPitch() > 10) {
        map.easeTo({ pitch: 0, duration: 600 });
      }
    }
  } catch (err) {
    console.error('[MapArea] Error applying terrain mode:', err);
  }
}

/**
 * Map Controls Component
 *
 * Floating zoom, compass, and terrain mode controls for the map.
 */
function MapControls({ mapRef }: { mapRef: React.RefObject<MapRef | null> }) {
  const { viewport, resetViewport, setViewport, terrainMode, setTerrainMode } = useMapStore();

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
        center: [69.6, 22.4],
        zoom: 7.5,
        pitch: terrainMode === '3d' ? 60 : 0,
        bearing: 0,
        duration: 1200,
      });
    }
  };

  const handleSelectMode = (mode: 'flat' | 'hillshade' | '3d') => {
    setTerrainMode(mode);
    const map = mapRef.current?.getMap();
    applyTerrainMode(mode, map);
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
          title="Reset to Arabian Sea"
        >
          <Compass className="w-5 h-5" />
        </button>
      </div>

      {/* Terrain Mode Controls (Flat, Hillshade, 3D) */}
      <div className="flex flex-col rounded-xl bg-surface-transparent backdrop-blur-md border border-border-subtle shadow-floating overflow-hidden p-1 gap-1">
        <button
          type="button"
          onClick={() => handleSelectMode('flat')}
          className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-smooth text-center ${
            terrainMode === 'flat'
              ? 'bg-blue-accent text-white shadow-xs'
              : 'text-ocean-600 hover:text-ocean-900 hover:bg-ocean-50'
          }`}
          aria-label="Flat terrain mode"
          title="Flat 2D Basemap"
        >
          2D
        </button>
        <button
          type="button"
          onClick={() => handleSelectMode('hillshade')}
          className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-smooth text-center ${
            terrainMode === 'hillshade'
              ? 'bg-blue-accent text-white shadow-xs'
              : 'text-ocean-600 hover:text-ocean-900 hover:bg-ocean-50'
          }`}
          aria-label="Hillshade relief mode"
          title="Topographic Shaded Relief"
        >
          Relief
        </button>
        <button
          type="button"
          onClick={() => handleSelectMode('3d')}
          className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-smooth text-center ${
            terrainMode === '3d'
              ? 'bg-blue-accent text-white shadow-xs'
              : 'text-ocean-600 hover:text-ocean-900 hover:bg-ocean-50'
          }`}
          aria-label="3D terrain mode"
          title="3D Elevation DEM Mesh"
        >
          3D
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
 * Main interactive MapLibre map viewport with controls, terrain modes,
 * and deck.gl overlay integration.
 */
export function MapArea() {
  const mapRef = useRef<MapRef | null>(null);
  const viewport = useMapStore((state) => state.viewport);
  const setViewport = useMapStore((state) => state.setViewport);
  const terrainMode = useMapStore((state) => state.terrainMode);
  const deckLayers = useDeckLayers();

  const handleMove = useCallback((evt: ViewStateChangeEvent) => {
    setViewport({
      longitude: evt.viewState.longitude,
      latitude: evt.viewState.latitude,
      zoom: evt.viewState.zoom,
      bearing: evt.viewState.bearing,
      pitch: evt.viewState.pitch,
    });
  }, [setViewport]);

  // Synchronize 3D terrain, hillshade layer visibility, and pitch with terrainMode
  useEffect(() => {
    const map = mapRef.current?.getMap();
    applyTerrainMode(terrainMode, map);
  }, [terrainMode]);

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
          applyTerrainMode(terrainMode, evt.target);
        }}
        onError={(err) => {
          console.error('[MapArea] Map error event:', err);
        }}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        {/* Hillshade DEM Source & Layer */}
        <Source
          id={HILLSHADE_SOURCE_ID}
          type="raster-dem"
          tiles={[TERRAIN_TILES_URL]}
          encoding="terrarium"
          tileSize={256}
          maxzoom={14}
        >
          <Layer
            id="terrain-hillshade"
            type="hillshade"
            source={HILLSHADE_SOURCE_ID}
            beforeId="water"
            layout={{
              visibility: terrainMode === 'hillshade' || terrainMode === '3d' ? 'visible' : 'none',
            }}
            paint={{
              'hillshade-shadow-color': '#0f172a',
              'hillshade-highlight-color': '#ffffff',
              'hillshade-accent-color': '#475569',
              'hillshade-illumination-direction': 315,
              'hillshade-exaggeration': 0.35,
            }}
          />
        </Source>

        {/* Deck.gl WebGL Layer Overlay */}
        <DeckGLOverlay layers={deckLayers} />
      </Map>

      {/* Crosshair */}
      <CrosshairOverlay />

      {/* Map Controls */}
      <MapControls mapRef={mapRef} />

      {/* Scale Indicator */}
      <div className="absolute bottom-6 left-6 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-transparent backdrop-blur-md border border-border-subtle text-xs text-ocean-600 z-10 shadow-floating">
        <div className="w-16 h-0.5 bg-ocean-500 rounded-full" />
        <span className="font-mono text-ocean-800">~10 km</span>
      </div>
    </main>
  );
}