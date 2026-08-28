import type { OceanConditions } from '../../types/environment';

/**
 * Deterministic mock environmental conditions.
 *
 * A gale out of the northwest is consistent with the drift prediction in
 * INC-2026-001's mock timeline (spill pushed east-southeast).
 */
export const MOCK_ENVIRONMENT: OceanConditions = {
  wind: {
    speed: 7.2, // m/s (~14 kn, Force 4-5)
    direction: 315, // degrees: from the NW
  },
  current: {
    speed: 0.6, // m/s
    direction: 128, // degrees: flowing SE
  },
  timestamp: '2026-08-27T09:10:00Z',
};

/** A deterministic spot-condition for any queried point. */
export function getMockEnvironmentPoint(): OceanConditions {
  return {
    wind: { ...MOCK_ENVIRONMENT.wind },
    current: { ...MOCK_ENVIRONMENT.current },
    timestamp: MOCK_ENVIRONMENT.timestamp,
  };
}