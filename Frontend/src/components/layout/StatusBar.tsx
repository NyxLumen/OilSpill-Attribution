import { useMapStore } from '@/store';

/**
 * OceanWatch Status Bar Component
 *
 * Floating telemetry strip with maritime data.
 * Light aesthetic for Phase 1.2.
 */
export function StatusBar() {
  const { viewport } = useMapStore();

  // Format coordinates for display
  const latStr = `${Math.abs(viewport.latitude).toFixed(2)}°${viewport.latitude >= 0 ? 'N' : 'S'}`;
  const lngStr = `${Math.abs(viewport.longitude).toFixed(2)}°${viewport.longitude >= 0 ? 'E' : 'W'}`;

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30">
      <div className="flex items-center gap-6 px-6 py-3 rounded-full bg-surface-transparent backdrop-blur-md border border-border-subtle shadow-floating-lg text-sm">
        {/* Vessel Count */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-ocean-600 uppercase tracking-wider">Vessels</span>
          <span className="font-bold text-ocean-900">12,482</span>
        </div>

        {/* Separator */}
        <span className="text-ocean-400">|</span>

        {/* Active Spills */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-ocean-600 uppercase tracking-wider">Spills</span>
          <span className="font-bold text-red-alert">7</span>
        </div>

        {/* Separator */}
        <span className="text-ocean-400">|</span>

        {/* Alerts */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-ocean-600 uppercase tracking-wider">Alerts</span>
          <span className="font-bold text-amber-warning">3</span>
        </div>

        {/* Separator */}
        <span className="text-ocean-400">|</span>

        {/* Region */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-ocean-600 uppercase tracking-wider">Region</span>
          <span className="font-medium text-ocean-800">Arabian Sea</span>
        </div>

        {/* Separator */}
        <span className="text-ocean-400">|</span>

        {/* Coordinates */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-ocean-600 uppercase tracking-wider">Position</span>
          <span className="font-mono text-ocean-800">
            {latStr}, {lngStr}
          </span>
        </div>

        {/* Separator */}
        <span className="text-ocean-400">|</span>

        {/* Wind */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-ocean-600 uppercase tracking-wider">Wind</span>
          <span className="font-mono text-ocean-800">14.6 kn, NW</span>
        </div>

        {/* Separator */}
        <span className="text-ocean-400">|</span>

        {/* Current */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-ocean-600 uppercase tracking-wider">Current</span>
          <span className="font-mono text-ocean-800">0.8 kn, SE</span>
        </div>
      </div>
    </div>
  );
}
