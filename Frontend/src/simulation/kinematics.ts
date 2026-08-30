import { pointAlongRoute } from './geo';
import type { SimVessel } from './types';

/**
 * Kinematics: pure, deterministic position/heading math shared by the
 * simulation engine and the trail generator.
 *
 * Real wall-clock time is deliberately separated from scenario state: vessel
 * identities, routes and speeds are fully determined by the seed, and
 * position is a pure function of (definition, simulated time). This keeps the
 * world reproducible while still animating in real time.
 */

/** Fixed scenario epoch (matches the INC-2026-001 mock timeline). */
export const SCENARIO_START_ISO = '2026-08-27T09:10:00Z';
export const SCENARIO_START_MS = Date.parse(SCENARIO_START_ISO);

/**
 * Simulated seconds that pass per real second (1 real s = 2 sim min).
 *
 * Tuned for believable on-screen AIS motion: a 9.4 kn tanker then advances
 * ~0.6 km per real second (≈12 px/s at the demo zoom), clearly visible but
 * not a fast-forward blur. Higher values make the whole fleet zip across the
 * map; lower ones make movement imperceptible in a live demo.
 */
export const TIME_SCALE = 120;

/** Knots → kilometres per second. */
export const KNOT_TO_KM_S = 1.852 / 3600;

export interface VesselKinematicState {
  lat: number;
  lng: number;
  /** Bearing of travel in degrees (0° north, clockwise), rounded. */
  heading: number;
  /** Effective speed in knots (accounts for stopped/drifting vessels). */
  speed: number;
}

/** Stopped vessels are allowed a slow drift so they do not look frozen. */
const STOPPED_DRIFT_FACTOR = 0.12;

function effectiveSpeedKn(def: SimVessel): number {
  if (def.route.totalKm <= 0) return 0;
  if (def.status === 'stopped') return def.speed * STOPPED_DRIFT_FACTOR;
  return def.speed;
}

/**
 * Compute a vessel's kinematic state at an arbitrary simulated time.
 *
 * Movement advances the vessel along its route by `speed × elapsed`; ping-pong
 * lanes reflect at the ends instead of wrapping. The destination-point math in
 * `geo.ts` accounts for latitude when converting distance into lat/lng deltas.
 */
export function vesselStateAt(def: SimVessel, simTimeMs: number): VesselKinematicState {
  const elapsedS = (simTimeMs - SCENARIO_START_MS) / 1000;
  const effectiveSpeed = effectiveSpeedKn(def);

  let progress = def.startProgressKm + effectiveSpeed * KNOT_TO_KM_S * elapsedS;
  let direction = 1;
  const totalKm = def.route.totalKm;

  if (totalKm > 0) {
    if (def.pingPong) {
      const period = 2 * totalKm;
      const mod = ((progress % period) + period) % period;
      if (mod > totalKm) {
        progress = 2 * totalKm - mod;
        direction = -1;
      } else {
        progress = mod;
      }
    } else {
      progress = ((progress % totalKm) + totalKm) % totalKm;
    }
  } else {
    progress = 0;
  }

  const state = pointAlongRoute(def.route, progress);
  const heading = direction === 1 ? state.heading : (state.heading + 180) % 360;

  return {
    lat: state.lat,
    lng: state.lng,
    heading: Math.round(heading),
    speed: Math.round(effectiveSpeed * 10) / 10,
  };
}
