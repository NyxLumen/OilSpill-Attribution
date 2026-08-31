import type { RoutePoint } from './geo';

/**
 * Maritime network for the Arabian Sea demo region (Gulf of Kutch / Saurashtra
 * coast). Real geography → maritime network → origin/destination → route.
 *
 * Ports, shipping corridors, fishing grounds, patrol zones and anchorages are
 * hand-placed from real-world coordinates (ports) and verified against the
 * offline Natural Earth land mask (see `landMask.ts`). Every corridor and
 * approach point below was validated as safe water; `routeBuilder` re-asserts
 * navigability for every route it builds so a regression can never put a
 * vessel on land.
 *
 * Vessels never route to a port berth itself — they terminate at the port's
 * offshore `approach` point (deep-draft vessels anchor offshore; also keeps
 * route endpoints comfortably off the land mask).
 */

export interface Port {
  id: string;
  name: string;
  kind: 'major' | 'minor';
  /** On-shore facility reference coordinate. */
  lat: number;
  lng: number;
  /** Offshore approach/anchorage point used as the route endpoint. */
  approach: RoutePoint;
}

export const PORTS: Record<string, Port> = {
  karachi: { id: 'karachi', name: 'Karachi', kind: 'major', lat: 24.81, lng: 67.04, approach: { lat: 24.7, lng: 66.95 } },
  kandla: { id: 'kandla', name: 'Kandla', kind: 'major', lat: 23.0, lng: 70.22, approach: { lat: 22.75, lng: 70.05 } },
  mundra: { id: 'mundra', name: 'Mundra', kind: 'major', lat: 22.83, lng: 69.73, approach: { lat: 22.72, lng: 69.62 } },
  vadinar: { id: 'vadinar', name: 'Vadinar', kind: 'major', lat: 22.4, lng: 69.72, approach: { lat: 22.52, lng: 69.8 } },
  sikka: { id: 'sikka', name: 'Sikka', kind: 'minor', lat: 22.43, lng: 69.84, approach: { lat: 22.56, lng: 69.9 } },
  okha: { id: 'okha', name: 'Okha', kind: 'minor', lat: 22.47, lng: 69.08, approach: { lat: 22.47, lng: 68.96 } },
  porbandar: { id: 'porbandar', name: 'Porbandar', kind: 'major', lat: 21.63, lng: 69.62, approach: { lat: 21.63, lng: 69.52 } },
  mandvi: { id: 'mandvi', name: 'Mandvi', kind: 'minor', lat: 22.82, lng: 69.35, approach: { lat: 22.72, lng: 69.36 } },
  veraval: { id: 'veraval', name: 'Veraval', kind: 'major', lat: 20.91, lng: 70.37, approach: { lat: 20.91, lng: 70.27 } },
  diu: { id: 'diu', name: 'Diu', kind: 'minor', lat: 20.71, lng: 70.98, approach: { lat: 20.66, lng: 70.9 } },
  mumbai: { id: 'mumbai', name: 'Mumbai', kind: 'major', lat: 18.95, lng: 72.83, approach: { lat: 18.9, lng: 72.72 } },
};

/** Look up a port by id, throwing on unknown ids so typos fail loudly. */
export function port(id: string): Port {
  const p = PORTS[id];
  if (!p) throw new Error(`Unknown port '${id}'`);
  return p;
}

// ---------------------------------------------------------------------------
// Shipping corridors (centerlines, all validated safe water). Interior points
// only — routeBuilder prepends the origin approach and appends the destination
// approach. Directions are given "south → north" / "open sea → gulf head".
// ---------------------------------------------------------------------------

/** Deep-water lane Karachi ↔ Mumbai, routed west of the Rann of Kutch. */
export const CORRIDOR_DEEP_LANE: RoutePoint[] = [
  { lat: 23.9, lng: 66.8 },
  { lat: 23.2, lng: 66.9 },
  { lat: 22.5, lng: 67.4 },
  { lat: 21.8, lng: 68.1 },
  { lat: 20.8, lng: 69.3 },
  { lat: 19.8, lng: 70.6 },
  { lat: 19.3, lng: 71.8 },
];

/** Offshore connector Karachi ↔ Veraval / Porbandar (west of the Rann and Saurashtra). */
export const CORRIDOR_WEST_OFFSHORE: RoutePoint[] = [
  { lat: 23.9, lng: 66.8 },
  { lat: 23.2, lng: 66.9 },
  { lat: 22.5, lng: 67.4 },
  { lat: 21.8, lng: 68.1 },
  { lat: 21.35, lng: 69.8 },
];

/** Coastal feeder Mumbai ↔ Veraval ↔ Porbandar ↔ Okha (SW Saurashtra coast). */
export const CORRIDOR_WEST_COAST: RoutePoint[] = [
  { lat: 19.6, lng: 71.6 },
  { lat: 20.3, lng: 70.9 },
  { lat: 20.91, lng: 70.27 },
  { lat: 21.35, lng: 69.8 },
  { lat: 21.63, lng: 69.52 },
  { lat: 21.8, lng: 69.2 },
  { lat: 22.05, lng: 69.05 },
  { lat: 22.3, lng: 68.9 },
];

/** Gulf of Kutch approach: open sea → gulf head (Kandla). */
export const CORRIDOR_GULF_APPROACH: RoutePoint[] = [
  { lat: 22.2, lng: 68.75 },
  { lat: 22.5, lng: 68.95 },
  { lat: 22.55, lng: 69.15 },
  { lat: 22.6, lng: 69.45 },
  { lat: 22.65, lng: 69.8 },
];

/** Gulf of Kutch interior chain: Kandla ↔ Mundra ↔ Mandvi ↔ gulf mouth. */
export const CORRIDOR_GULF_INNER: RoutePoint[] = [
  { lat: 22.7, lng: 69.85 },
  { lat: 22.72, lng: 69.62 },
  { lat: 22.66, lng: 69.35 },
  { lat: 22.6, lng: 69.1 },
  { lat: 22.52, lng: 69.05 },
];

/** Gulf interior branch to the Saurashtra-north-shore ports (Vadinar / Sikka). */
export const CORRIDOR_GULF_SOUTH_SHORE: RoutePoint[] = [
  { lat: 22.66, lng: 69.7 },
  { lat: 22.6, lng: 69.78 },
  { lat: 22.52, lng: 69.8 },
];

// ---------------------------------------------------------------------------
// Fishing grounds (centers; the small loiter circuit is built in routeBuilder).
// ---------------------------------------------------------------------------

export const FISHING_GROUNDS: Record<string, RoutePoint> = {
  offPorbandar: { lat: 21.5, lng: 69.4 },
  offVeraval: { lat: 20.75, lng: 70.35 },
  offMandvi: { lat: 22.6, lng: 69.3 },
  offOkha: { lat: 22.45, lng: 68.95 },
  gulfMouth: { lat: 22.45, lng: 69.35 },
  offDiu: { lat: 20.6, lng: 70.9 },
  southOffshore: { lat: 20.9, lng: 69.6 },
};

// ---------------------------------------------------------------------------
// Patrol zones (circuit centres) and anchorages (stationary holding points).
// ---------------------------------------------------------------------------

export const PATROL_CENTERS: Record<string, RoutePoint> = {
  kandla: { lat: 22.75, lng: 70.0 },
  mundra: { lat: 22.7, lng: 69.65 },
  // Porbandar patrol works ~14 km WSW of the port where the 1.8 km circuit
  // keeps the whole loop in safe water.
  porbandar: { lat: 21.52, lng: 69.38 },
};

export const ANCHORAGES: Record<string, RoutePoint> = {
  kandla: { lat: 22.78, lng: 70.02 },
  porbandar: { lat: 21.6, lng: 69.5 },
  mumbai: { lat: 18.92, lng: 72.72 },
};
