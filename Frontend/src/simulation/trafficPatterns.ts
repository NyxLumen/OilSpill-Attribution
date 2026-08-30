import { destinationPoint, type RoutePoint } from './geo';
import { randomRange } from './rng';

/**
 * Deterministic traffic-pattern geometry for the Arabian Sea demo region
 * (Gulf of Kutch / Saurashtra coast).
 *
 * The region is populated with a small number of broad patterns rather than
 * a uniform scatter: coastal traffic, a few major shipping corridors,
 * offshore lanes, localized fishing grounds, and patrol circuits.
 */

export type LaneName = 'gulf' | 'north' | 'south' | 'coastal1' | 'coastal2';

export interface LaneSpec {
  name: LaneName;
  waypoints: RoutePoint[];
}

/** Centerline of the main Gulf of Kutch shipping corridor (SW–NE). */
const GULF_LANE: RoutePoint[] = [
  { lat: 22.22, lng: 68.62 },
  { lat: 22.4, lng: 69.05 },
  { lat: 22.52, lng: 69.55 },
  { lat: 22.66, lng: 70.02 },
  { lat: 22.86, lng: 70.58 },
  { lat: 23.1, lng: 71.15 },
];

/** Deep-water tanker lane north of the gulf. */
const NORTH_LANE: RoutePoint[] = [
  { lat: 23.3, lng: 67.75 },
  { lat: 23.48, lng: 68.6 },
  { lat: 23.44, lng: 69.7 },
  { lat: 23.22, lng: 70.75 },
  { lat: 22.98, lng: 71.6 },
];

/** Container/cargo lane in the open Arabian Sea to the south. */
const SOUTH_LANE: RoutePoint[] = [
  { lat: 20.98, lng: 67.6 },
  { lat: 21.12, lng: 68.55 },
  { lat: 21.18, lng: 69.55 },
  { lat: 21.08, lng: 70.6 },
  { lat: 20.88, lng: 71.65 },
];

/** Coastal feeder lanes along the Saurashtra and Kutch shores. */
const COASTAL_1: RoutePoint[] = [
  { lat: 21.62, lng: 69.85 },
  { lat: 21.86, lng: 70.25 },
  { lat: 22.14, lng: 70.5 },
  { lat: 22.42, lng: 70.58 },
];

const COASTAL_2: RoutePoint[] = [
  { lat: 22.95, lng: 68.6 },
  { lat: 23.06, lng: 68.95 },
  { lat: 23.16, lng: 69.35 },
  { lat: 23.12, lng: 69.75 },
];

export const LINEAR_LANES: LaneSpec[] = [
  { name: 'gulf', waypoints: GULF_LANE },
  { name: 'north', waypoints: NORTH_LANE },
  { name: 'south', waypoints: SOUTH_LANE },
  { name: 'coastal1', waypoints: COASTAL_1 },
  { name: 'coastal2', waypoints: COASTAL_2 },
];

export const LANES_BY_NAME: Record<LaneName, LaneSpec> = Object.fromEntries(
  LINEAR_LANES.map((lane) => [lane.name, lane])
) as Record<LaneName, LaneSpec>;

/** Fishing grounds where slow, scattered small-vessel activity occurs. */
export const FISHING_CENTERS: RoutePoint[] = [
  { lat: 22.55, lng: 69.35 },
  { lat: 22.2, lng: 69.95 },
  { lat: 21.8, lng: 70.35 },
  { lat: 22.9, lng: 69.05 },
  { lat: 21.4, lng: 70.15 },
  { lat: 23.05, lng: 69.6 },
  { lat: 22.3, lng: 68.9 },
  { lat: 21.1, lng: 69.9 },
];

/** Localized patrol circuit centres (ports, coast, incident area). */
export const PATROL_CENTERS: RoutePoint[] = [
  { lat: 23.03, lng: 70.22 },
  { lat: 22.84, lng: 69.72 },
  { lat: 21.64, lng: 69.6 },
  { lat: 22.48, lng: 69.55 },
  { lat: 23.15, lng: 69.2 },
];

/**
 * Build an open-lane route: optionally reversed, translated by a small
 * deterministic offset, and given light per-vertex noise so vessels on the
 * same corridor do not sit on an identical line.
 */
export function buildLinearRoute(rng: () => number, lane: LaneSpec): RoutePoint[] {
  const reverse = rng() < 0.5;
  const dLat = randomRange(rng, -0.05, 0.05);
  const dLng = randomRange(rng, -0.06, 0.06);
  const source = reverse ? lane.waypoints.slice().reverse() : lane.waypoints;
  return source.map((p) => ({
    lat: p.lat + dLat + randomRange(rng, -0.006, 0.006),
    lng: p.lng + dLng + randomRange(rng, -0.008, 0.008),
  }));
}

/**
 * Build a small closed circuit (fishing / patrol / mixed) around a centre.
 * The loop is open-ended — the kinematics wrap progress around `totalKm`,
 * which closes it naturally.
 */
export function buildCircuitRoute(
  rng: () => number,
  center: RoutePoint,
  minRadiusKm: number,
  maxRadiusKm: number,
  vertices: number
): RoutePoint[] {
  const phase = randomRange(rng, 0, Math.PI * 2);
  const radius = randomRange(rng, minRadiusKm, maxRadiusKm);
  const points: RoutePoint[] = [];
  for (let k = 0; k < vertices; k++) {
    const angle = phase + (k / vertices) * Math.PI * 2;
    const r = radius * (0.7 + rng() * 0.5);
    points.push(destinationPoint(center, (angle * 180) / Math.PI, r));
  }
  return points;
}
