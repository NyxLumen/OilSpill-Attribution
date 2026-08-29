import { Plus, Minus, Compass, Crosshair } from 'lucide-react';
import { useMapStore } from '@/store';

/**
 * Map Controls Component
 *
 * Floating zoom, compass, and viewport controls for the map.
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
          className="w-12 h-12 rounded-xl bg-surface-transparent backdrop-blur-md border border-border-subtle shadow-floating flex items-center justify-center text-ocean-600 hover:text-ocean-900 hover:bg-ocean-50 transition-smooth"
          aria-label="3D view"
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
 * Map Placeholder Component
 *
 * Light maritime map placeholder for Phase 1.2 visual design.
 */
function MapPlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-cyan-accent/5 via-blue-accent/3 to-ocean-50">
      <div className="text-center max-w-md">
        {/* Map Icon */}
        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-surface-transparent backdrop-blur-md border border-border-subtle flex items-center justify-center shadow-floating">
          <svg
            className="w-12 h-12 text-blue-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 13V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-lg font-medium text-ocean-800 mb-2">
          Interactive Maritime Map
        </h2>

        {/* Tech Stack */}
        <p className="text-sm text-ocean-600 mb-4">
          MapLibre GL + deck.gl
        </p>

        {/* Features List */}
        <div className="flex flex-wrap justify-center gap-2 text-xs text-ocean-700">
          <span className="px-3 py-1 rounded-full bg-surface-transparent border border-border-subtle">
            Vessel Tracking
          </span>
          <span className="px-3 py-1 rounded-full bg-surface-transparent border border-border-subtle">
            Oil Spill Detection
          </span>
          <span className="px-3 py-1 rounded-full bg-surface-transparent border border-border-subtle">
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
 * Light maritime aesthetic for Phase 1.2.
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
      <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-transparent backdrop-blur-md border border-border-subtle text-xs text-ocean-600 z-10 shadow-floating">
        <div className="w-16 h-0.5 bg-ocean-500 rounded-full" />
        <span className="font-mono text-ocean-800">~10 km</span>
      </div>
    </main>
  );
}