import { Plus, Minus, Compass, Maximize2, Crosshair } from 'lucide-react';
import { useMapStore } from '@/store';

/**
 * Map Controls Component
 *
 * Zoom, compass, and viewport controls for the map.
 */
function MapControls() {
  const { viewport, setViewport, resetViewport } = useMapStore();

  const handleZoomIn = () => {
    setViewport({ zoom: Math.min(viewport.zoom + 1, 18) });
  };

  const handleZoomOut = () => {
    setViewport({ zoom: Math.max(viewport.zoom - 1, 1) });
  };

  const handleResetView = () => {
    resetViewport();
  };

  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
      {/* Zoom Controls */}
      <div className="flex flex-col rounded-lg bg-ocean-800/95 backdrop-blur-sm border border-ocean-700/50 shadow-glass overflow-hidden">
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-2.5 text-ocean-400 hover:text-ocean-200 hover:bg-ocean-700/50 transition-smooth"
          aria-label="Zoom in"
        >
          <Plus className="w-4 h-4" />
        </button>
        <div className="h-px bg-ocean-700/50" />
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-2.5 text-ocean-400 hover:text-ocean-200 hover:bg-ocean-700/50 transition-smooth"
          aria-label="Zoom out"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Compass & Reset */}
      <div className="flex flex-col rounded-lg bg-ocean-800/95 backdrop-blur-sm border border-ocean-700/50 shadow-glass overflow-hidden">
        <button
          type="button"
          onClick={handleResetView}
          className="p-2.5 text-ocean-400 hover:text-ocean-200 hover:bg-ocean-700/50 transition-smooth"
          aria-label="Reset view"
        >
          <Compass className="w-4 h-4" />
        </button>
        <div className="h-px bg-ocean-700/50" />
        <button
          type="button"
          className="p-2.5 text-ocean-400 hover:text-ocean-200 hover:bg-ocean-700/50 transition-smooth"
          aria-label="Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
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
        <Crosshair className="w-8 h-8 text-ocean-500/30" />
      </div>
    </div>
  );
}

/**
 * Map Placeholder Component
 *
 * Temporary placeholder until MapLibre/deck.gl is integrated in Phase 1.2.
 */
function MapPlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-900">
      <div className="text-center max-w-md">
        {/* Map Icon */}
        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-ocean-800/80 border border-ocean-700/50 flex items-center justify-center shadow-glass">
          <svg
            className="w-12 h-12 text-ocean-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-lg font-medium text-ocean-300 mb-2">
          Interactive Maritime Map
        </h2>

        {/* Tech Stack */}
        <p className="text-sm text-ocean-500 mb-4">
          MapLibre GL + deck.gl
        </p>

        {/* Features List */}
        <div className="flex flex-wrap justify-center gap-2 text-xs text-ocean-600">
          <span className="px-2 py-1 rounded-full bg-ocean-800/60 border border-ocean-700/50">
            Vessel Tracking
          </span>
          <span className="px-2 py-1 rounded-full bg-ocean-800/60 border border-ocean-700/50">
            Oil Spill Detection
          </span>
          <span className="px-2 py-1 rounded-full bg-ocean-800/60 border border-ocean-700/50">
            Investigation Paths
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * OceanWatch Map Area Component
 *
 * Main map viewport with controls.
 * Will integrate MapLibre/deck.gl in Phase 1.2.
 */
export function MapArea() {
  return (
    <main className="flex-1 relative overflow-hidden">
      {/* Map Placeholder */}
      <MapPlaceholder />

      {/* Crosshair */}
      <CrosshairOverlay />

      {/* Map Controls */}
      <MapControls />

      {/* Scale Indicator */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ocean-800/95 backdrop-blur-sm border border-ocean-700/50 text-xs text-ocean-400 z-10">
        <div className="w-16 h-0.5 bg-ocean-500 rounded-full" />
        <span className="font-mono">~10 km</span>
      </div>
    </main>
  );
}
