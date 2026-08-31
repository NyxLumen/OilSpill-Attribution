import { useMapStore } from '@/store';
import { SCENARIO_START_MS, environmentAt } from '@/simulation';

/**
 * OceanWatch Status Bar Component
 *
 * Floating telemetry strip with maritime data.
 * Wind/current are derived from the deterministic simulation environment at
 * scenario start (INC-2026-001 baseline) so the strip never contradicts the
 * drift narrative — an E/ENE wind reinforcing the WSW ebb outflow. The vessel/
 * spill/alert counters are global Arabian-Sea telemetry, not the demo fleet.
 */
const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
const MS_TO_KN = 1.94384;

/** Compass point for a direction in degrees (wind: coming-from; current: flow). */
function compass(dir: number): string {
  return COMPASS[Math.round(dir / 22.5) % 16];
}

export function StatusBar() {
  const { viewport } = useMapStore();
  const env = environmentAt(SCENARIO_START_MS);

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
          <span className="font-mono text-ocean-800">
            {(env.wind.speed * MS_TO_KN).toFixed(1)} kn, {compass(env.wind.direction)}
          </span>
        </div>

        {/* Separator */}
        <span className="text-ocean-400">|</span>

        {/* Current */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-ocean-600 uppercase tracking-wider">Current</span>
          <span className="font-mono text-ocean-800">
            {(env.current.speed * MS_TO_KN).toFixed(1)} kn, {compass(env.current.direction)}
          </span>
        </div>
      </div>
    </div>
  );
}
