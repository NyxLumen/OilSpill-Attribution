import { vesselStateAt } from './kinematics';
import type { SimVessel, TrailGenOptions } from './types';
import type { VesselTrail } from '@/types/vessel';

/** Default historical window: 72 points × 20 sim-minutes = 24 sim-hours. */
const DEFAULT_POINT_COUNT = 72;
const DEFAULT_INTERVAL_SECONDS = 1200;
const MAX_POINT_COUNT = 120;

/**
 * Generate a deterministic historical AIS trail for a vessel, sampled
 * backwards from the current position along the vessel's own route. The trail
 * is geographically coherent with where the vessel is and the direction it is
 * travelling, and is consumable directly by the existing deck.gl PathLayer.
 *
 * Stationary (anchored) vessels return an empty trail so no degenerate
 * zero-length path is drawn.
 */
export function generateTrailPoints(
  def: SimVessel,
  atMs: number,
  options?: TrailGenOptions
): VesselTrail['points'] {
  if (def.route.totalKm <= 0) {
    return [];
  }

  const count = Math.max(2, Math.min(options?.pointCount ?? DEFAULT_POINT_COUNT, MAX_POINT_COUNT));
  const intervalSeconds = options?.intervalSeconds ?? DEFAULT_INTERVAL_SECONDS;

  const points: VesselTrail['points'] = [];
  for (let i = count - 1; i >= 0; i--) {
    const t = atMs - i * intervalSeconds * 1000;
    const state = vesselStateAt(def, t);
    points.push({
      lat: state.lat,
      lng: state.lng,
      timestamp: new Date(t).toISOString(),
      speed: state.speed,
      heading: state.heading,
    });
  }
  return points;
}
