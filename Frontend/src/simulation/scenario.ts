import type { RoutePoint } from './geo';
import type { TrafficPattern } from './types';

/**
 * Seed definition for the fixed operational scenario vessels.
 *
 * These five vessels are hand-authored (not seeded) so the deterministic
 * INC-2026-001 attribution narrative — Ocean Guardian as the top candidate —
 * stays exactly as designed. Every generated vessel is layered on top of
 * this fixed core. Each route includes the t=0 position as a vertex so the
 * initial scenario exactly matches the historical mock fleet.
 */
export interface ScenarioVesselSeed {
  id: string;
  imo: string;
  name: string;
  type: 'tanker' | 'cargo' | 'container' | 'fishing' | 'patrol';
  speed: number;
  status: 'active' | 'stopped';
  pattern: TrafficPattern;
  waypoints: RoutePoint[];
  /** Index of the t=0 position vertex within `waypoints`. */
  startIndex: number;
  /** Reflect at lane ends (default true; closed circuits set false). */
  pingPong?: boolean;
}

export const SCENARIO_VESSELS: ScenarioVesselSeed[] = [
  {
    id: 'vsl-001',
    imo: '9300283',
    name: 'Ocean Guardian',
    type: 'tanker',
    speed: 9.4,
    status: 'active',
    pattern: 'gulf-lane',
    // Outbound down the Gulf of Kutch heading WSW, passing near the spill.
    waypoints: [
      { lat: 22.512, lng: 69.795 },
      { lat: 22.483, lng: 69.681 },
      { lat: 22.448, lng: 69.555 },
      { lat: 22.418, lng: 69.39 },
      { lat: 22.375, lng: 69.13 },
      { lat: 22.32, lng: 68.82 },
      { lat: 22.255, lng: 68.48 },
    ],
    startIndex: 1,
    pingPong: true,
  },
  {
    id: 'vsl-002',
    imo: '9154236',
    name: 'Sagar Pratham',
    type: 'cargo',
    speed: 12.1,
    status: 'active',
    pattern: 'gulf-lane',
    // North-east bound through the outer gulf.
    waypoints: [
      { lat: 22.82, lng: 68.86 },
      { lat: 23.012, lng: 69.057 },
      { lat: 23.17, lng: 69.22 },
      { lat: 23.34, lng: 69.44 },
      { lat: 23.52, lng: 69.7 },
      { lat: 23.68, lng: 70.0 },
    ],
    startIndex: 1,
    pingPong: true,
  },
  {
    id: 'vsl-003',
    imo: '9407721',
    name: 'Arabian Star',
    type: 'container',
    speed: 10.4,
    status: 'active',
    pattern: 'south-lane',
    // South-east region heading north-west along the southern lane.
    waypoints: [
      { lat: 20.72, lng: 71.45 },
      { lat: 20.884, lng: 71.286 },
      { lat: 21.05, lng: 71.15 },
      { lat: 21.2, lng: 71.02 },
      { lat: 21.36, lng: 70.88 },
      { lat: 21.5, lng: 70.73 },
    ],
    startIndex: 1,
    pingPong: true,
  },
  {
    id: 'vsl-004',
    imo: '8123459',
    name: 'Kutch Fisher',
    type: 'fishing',
    speed: 3.2,
    status: 'stopped',
    pattern: 'fishing',
    // Small coastal circuit; reported as stopped so it only drifts slowly.
    waypoints: [
      { lat: 22.552, lng: 69.441 },
      { lat: 22.566, lng: 69.441 },
      { lat: 22.568, lng: 69.462 },
      { lat: 22.548, lng: 69.47 },
      { lat: 22.542, lng: 69.445 },
    ],
    startIndex: 0,
    pingPong: false,
  },
  {
    id: 'vsl-005',
    imo: '9674832',
    name: 'Coast Guard 07',
    type: 'patrol',
    speed: 15.6,
    status: 'active',
    pattern: 'patrol',
    // Localized patrol circuit near the incident area.
    waypoints: [
      { lat: 22.391, lng: 69.912 },
      { lat: 22.383, lng: 69.92 },
      { lat: 22.375, lng: 69.946 },
      { lat: 22.39, lng: 69.97 },
      { lat: 22.41, lng: 69.958 },
      { lat: 22.406, lng: 69.928 },
    ],
    startIndex: 0,
    pingPong: false,
  },
];
