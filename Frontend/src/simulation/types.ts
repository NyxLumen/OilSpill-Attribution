import type { VesselStatus, VesselType } from '@/types/vessel';
import type { SimRoute } from './geo';

/**
 * Broad traffic pattern a generated vessel belongs to. Used only for
 * bookkeeping/debugging; the visible behaviour is encoded in the route.
 */
export type TrafficPattern =
  | 'gulf-lane'
  | 'north-lane'
  | 'south-lane'
  | 'coastal'
  | 'fishing'
  | 'patrol'
  | 'anchored';

/**
 * Internal simulation vessel definition.
 *
 * This is deliberately *not* the domain `Vessel` model: the simulation owns
 * routes and kinematics; the provider maps `SimVessel` → `Vessel` at the
 * boundary so UI code never sees simulation internals.
 */
export interface SimVessel {
  id: string;
  imo: string;
  name: string;
  type: VesselType;
  /** Cruise speed in knots. */
  speed: number;
  status: VesselStatus;
  route: SimRoute;
  /** Distance along the route at simulation time zero. */
  startProgressKm: number;
  pattern: TrafficPattern;
  /**
   * When true, the vessel reflects at the ends of an open lane instead of
   * wrapping around (which would look like teleporting).
   */
  pingPong: boolean;
}

/** Options controlling generated historical trail density. */
export interface TrailGenOptions {
  /** Number of historical points including the current position. */
  pointCount?: number;
  /** Simulated seconds between consecutive trail points. */
  intervalSeconds?: number;
}
