import type { VesselStatus, VesselType } from '@/types/vessel';
import { buildRoute, type RoutePoint } from './geo';
import { mulberry32, pick, randomInt, randomRange, shuffle } from './rng';
import { SCENARIO_VESSELS, type ScenarioVesselSeed } from './scenario';
import {
  buildCircuitRoute,
  buildLinearRoute,
  FISHING_CENTERS,
  LANES_BY_NAME,
  PATROL_CENTERS,
  type LaneName,
} from './trafficPatterns';
import type { SimVessel, TrafficPattern } from './types';

/** Fixed seed for the whole deterministic demo world. */
export const SIMULATION_SEED = 20_260_827;

/** Total fleet size (scenario core + generated traffic). */
export const VESSEL_COUNT = 80;

/** Deterministic name pools — no runtime randomness anywhere. */
const NAME_PREFIX = [
  'Ocean', 'Arabian', 'Gulf', 'Sagar', 'Indus', 'Monsoon', 'Mariner', 'Star',
  'Pearl', 'Coral', 'Harbor', 'Kutch', 'Pride', 'Meridian', 'Falcon', 'Dawn',
  'Tide', 'Golden', 'Sapphire', 'Emerald', 'Raj', 'Shakti', 'Deep', 'Blue',
  'Silver', 'Neptune', 'Trident', 'Seas', 'Wave', 'Cliff', 'Sundari', 'Ganga',
  'Narmada', 'Tapi', 'Jumna', 'Gomati', 'Lakshmi', 'Kaveri',
];

const NAME_SUFFIX = [
  'Navigator', 'Trader', 'Voyager', 'Horizon', 'Knight', 'Pride', 'Express',
  'Spirit', 'Rose', 'Comet', 'Dolphin', 'Heron', 'Quest', 'Merchant',
  'Success', 'Fortune', 'Venture', 'Rider', 'Sailor', 'Queen', 'Star',
  'Glory', 'Light', 'Companion', 'Grace', 'Arrow',
];

/** Cruise speed ranges (knots) per vessel type. */
const TYPE_SPEED_RANGE: Record<VesselType, [number, number]> = {
  tanker: [9, 14],
  cargo: [11, 16],
  container: [14, 21],
  fishing: [2, 6],
  patrol: [12, 18],
  other: [3, 9],
};

/** Which corridor lanes each type prefers (weights = repetition). */
function laneNamesFor(type: VesselType): LaneName[] {
  switch (type) {
    case 'tanker':
      return ['north', 'north', 'south'];
    case 'cargo':
      return ['gulf', 'coastal1', 'coastal2', 'south'];
    case 'container':
      return ['south', 'south', 'gulf'];
    default:
      return ['gulf'];
  }
}

/** Type slots for the generated (non-scenario) part of the fleet. */
const GENERATED_TYPE_SLOTS: VesselType[] = [
  ...new Array(11).fill('tanker'),
  ...new Array(17).fill('cargo'),
  ...new Array(13).fill('container'),
  ...new Array(19).fill('fishing'),
  ...new Array(7).fill('patrol'),
  ...new Array(8).fill('other'),
];

function lanePattern(name: LaneName): TrafficPattern {
  switch (name) {
    case 'north':
      return 'north-lane';
    case 'south':
      return 'south-lane';
    case 'gulf':
      return 'gulf-lane';
    default:
      return 'coastal';
  }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function resolveScenarioVessel(seed: ScenarioVesselSeed): SimVessel {
  const route = buildRoute(seed.waypoints);
  return {
    id: seed.id,
    imo: seed.imo,
    name: seed.name,
    type: seed.type,
    speed: seed.speed,
    status: seed.status,
    route,
    startProgressKm: route.cumKm[seed.startIndex],
    pattern: seed.pattern,
    pingPong: seed.pingPong ?? true,
  };
}

function generateName(rng: () => number, used: Set<string>): string {
  const prefix = pick(rng, NAME_PREFIX);
  const suffix = pick(rng, NAME_SUFFIX);
  let name = `${prefix} ${suffix}`;
  let counter = 2;
  while (used.has(name)) {
    name = `${prefix} ${suffix} ${counter++}`;
  }
  used.add(name);
  return name;
}

/**
 * Generate one deterministic vessel (not part of the fixed scenario core).
 * RNG calls are consumed in a fixed order so the whole fleet is reproducible.
 */
function generateGeneratedVessel(
  type: VesselType,
  index: number,
  rng: () => number,
  usedNames: Set<string>
): SimVessel {
  const id = `vsl-${String(index).padStart(3, '0')}`;
  const name = generateName(rng, usedNames);
  // IMO number (7 digits, leading 9 block reserved for new builds).
  const imo = `${9000000 + index}`;
  const [minSpeed, maxSpeed] = TYPE_SPEED_RANGE[type];

  let pattern: TrafficPattern;
  let waypoints: RoutePoint[];
  let status: VesselStatus = 'active';
  let pingPong = true;
  let speed = round1(randomRange(rng, minSpeed, maxSpeed));

  if (type === 'fishing') {
    pattern = 'fishing';
    waypoints = buildCircuitRoute(
      rng,
      pick(rng, FISHING_CENTERS),
      4,
      10,
      randomInt(rng, 5, 7)
    );
    pingPong = false;
    if (rng() < 0.2) status = 'stopped';
  } else if (type === 'patrol') {
    pattern = 'patrol';
    waypoints = buildCircuitRoute(
      rng,
      pick(rng, PATROL_CENTERS),
      5,
      12,
      randomInt(rng, 5, 7)
    );
    pingPong = false;
  } else if (type === 'other') {
    if (rng() < 0.35) {
      // Anchored/support craft: stationary at a single point.
      pattern = 'anchored';
      waypoints = [pick(rng, FISHING_CENTERS)];
      status = 'stopped';
      pingPong = false;
      speed = round1(randomRange(rng, 0.4, 1.5));
    } else {
      pattern = 'coastal';
      const coastalLanes: LaneName[] = ['coastal1', 'coastal2'];
      waypoints = buildLinearRoute(rng, LANES_BY_NAME[pick(rng, coastalLanes)]);
    }
  } else {
    // tanker / cargo / container — corridor traffic.
    const lane = LANES_BY_NAME[pick(rng, laneNamesFor(type))];
    pattern = lanePattern(lane.name);
    waypoints = buildLinearRoute(rng, lane);
  }

  const route = buildRoute(waypoints);
  // Spread vessels along the route so they are not clustered at one end.
  const startProgressKm = route.totalKm > 0 ? randomRange(rng, 0, route.totalKm) : 0;

  return {
    id,
    imo,
    name,
    type,
    speed,
    status,
    route,
    startProgressKm,
    pattern,
    pingPong,
  };
}

/**
 * Generate the full deterministic fleet: the fixed scenario core followed by
 * seeded traffic. Given the same seed and count this always returns the same
 * vessels in the same order.
 */
export function generateSimVessels(count = VESSEL_COUNT, seed = SIMULATION_SEED): SimVessel[] {
  const rng = mulberry32(seed);
  const vessels: SimVessel[] = SCENARIO_VESSELS.map(resolveScenarioVessel);
  const usedNames = new Set(vessels.map((v) => v.name));
  const typeSlots = shuffle(rng, GENERATED_TYPE_SLOTS);

  let index = vessels.length + 1; // scenario core occupies vsl-001..vsl-005
  for (const type of typeSlots) {
    if (vessels.length >= count) break;
    vessels.push(generateGeneratedVessel(type, index, rng, usedNames));
    index++;
  }
  return vessels;
}
