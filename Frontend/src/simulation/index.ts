/**
 * Deterministic maritime simulation for OceanWatch mock mode.
 *
 * The simulation owns the mock vessel world: a seeded fleet generator, a
 * centralized simulation clock, and deterministic historical trail
 * generation. It is consumed exclusively through the data provider boundary
 * (`MockDataProvider`) — UI components never touch it directly.
 */
export { SimulationEngine, simulationEngine } from './simulationEngine';
export { generateSimVessels, SIMULATION_SEED, VESSEL_COUNT } from './vesselGenerator';
export { SCENARIO_START_ISO, SCENARIO_START_MS, TIME_SCALE } from './kinematics';
export type { SimVessel, TrafficPattern, TrailGenOptions } from './types';
export type { SimRoute, RoutePoint, RouteState } from './geo';
