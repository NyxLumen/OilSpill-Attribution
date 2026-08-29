import { useMapStore } from '@/store';

/**
 * OceanWatch Status Bar Component
 *
 * Bottom status bar showing viewport coordinates, zoom, and data counts.
 * Follows the glass-panel aesthetic from PRD §31.
 */
export function StatusBar() {
  const { viewport } = useMapStore();

  // Format coordinates for display
  const latStr = `${Math.abs(viewport.latitude).toFixed(2)}°${viewport.latitude >= 0 ? 'N' : 'S'}`;
  const lngStr = `${Math.abs(viewport.longitude).toFixed(2)}°${viewport.longitude >= 0 ? 'E' : 'W'}`;

  return (
    <footer className="h-8 flex items-center justify-between px-4 bg-ocean-800/95 backdrop-blur-sm border-t border-ocean-700/50 text-xs text-ocean-400">
      {/* Left: Viewport Info */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className="text-ocean-500">Position:</span>
          <span className="text-ocean-300 font-mono">
            {latStr}, {lngStr}
          </span>
        </span>
        <span className="text-ocean-600">|</span>
        <span className="flex items-center gap-1.5">
          <span className="text-ocean-500">Zoom:</span>
          <span className="text-ocean-300 font-mono">{viewport.zoom.toFixed(1)}</span>
        </span>
      </div>

      {/* Center: Connection Status */}
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-green-live" />
        <span className="text-ocean-500">Connected</span>
      </div>

      {/* Right: Data Counts */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className="text-ocean-500">Vessels:</span>
          <span className="text-ocean-300 font-mono">--</span>
        </span>
        <span className="text-ocean-600">|</span>
        <span className="flex items-center gap-1.5">
          <span className="text-ocean-500">Incidents:</span>
          <span className="text-ocean-300 font-mono">--</span>
        </span>
      </div>
    </footer>
  );
}
