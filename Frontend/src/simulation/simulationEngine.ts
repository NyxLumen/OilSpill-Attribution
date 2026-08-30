import { generateSimVessels, SIMULATION_SEED, VESSEL_COUNT } from './vesselGenerator';
import { SCENARIO_START_MS, TIME_SCALE, vesselStateAt } from './kinematics';
import { generateTrailPoints } from './trailGenerator';
import type { SimVessel, TrailGenOptions } from './types';
import type { Vessel, VesselTrail } from '@/types/vessel';

/**
 * Centralized deterministic vessel simulation.
 *
 * One clock drives the whole traffic field: `getSimTimeMs()` maps real
 * elapsed time onto the simulated scenario epoch. Vessel positions are pure
 * functions of (vessel definition, simulated time), so the same seed always
 * yields the same fleet and the same trajectory for a given elapsed time.
 *
 * The engine holds no per-vessel timers and no React state — deck.gl renders
 * whatever the provider returns on each poll, so the map can animate without
 * re-rendering the application once per vessel.
 */
export class SimulationEngine {
  readonly vessels: SimVessel[];
  private timeOriginMs: number;

  constructor(count = VESSEL_COUNT, seed = SIMULATION_SEED) {
    this.vessels = generateSimVessels(count, seed);
    this.timeOriginMs = performance.now();
  }

  /** Current simulated epoch (ms since Unix epoch), advanced from real time. */
  getSimTimeMs(): number {
    return SCENARIO_START_MS + (performance.now() - this.timeOriginMs) * TIME_SCALE;
  }

  /** Re-anchor the clock to the scenario start (identical initial scenario). */
  reset(): void {
    this.timeOriginMs = performance.now();
  }

  /** Map a simulation vessel onto the domain `Vessel` model. */
  private toDomain(def: SimVessel, atMs: number): Vessel {
    const state = vesselStateAt(def, atMs);
    return {
      id: def.id,
      imo: def.imo,
      name: def.name,
      type: def.type,
      position: { lat: state.lat, lng: state.lng },
      heading: state.heading,
      speed: state.speed,
      lastUpdated: new Date(atMs).toISOString(),
      status: def.status,
      modelType: def.type,
    };
  }

  /** All vessels at a simulated time (defaults to the current clock). */
  getVessels(atMs: number = this.getSimTimeMs()): Vessel[] {
    return this.vessels.map((def) => this.toDomain(def, atMs));
  }

  /** A single vessel at a simulated time, or null if unknown. */
  getVessel(id: string, atMs: number = this.getSimTimeMs()): Vessel | null {
    const def = this.vessels.find((v) => v.id === id);
    return def ? this.toDomain(def, atMs) : null;
  }

  /** Historical trail for a vessel at a simulated time, or null. */
  getVesselTrail(
    id: string,
    options?: TrailGenOptions,
    atMs: number = this.getSimTimeMs()
  ): VesselTrail | null {
    const def = this.vessels.find((v) => v.id === id);
    if (!def) return null;
    return { vesselId: id, points: generateTrailPoints(def, atMs, options) };
  }
}

/**
 * Singleton shared by the mock provider so every consumer (map layer, fleet
 * list, telemetry) reads the same clock.
 */
export const simulationEngine = new SimulationEngine();
