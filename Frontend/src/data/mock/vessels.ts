import type { Vessel, VesselTrail } from '../../types/vessel';

/**
 * Deterministic mock vessel fleet.
 *
 * Timestamps are fixed so the mock scenario is reproducible. The crew:
 * "Ocean Guardian" (tanker) is the planned top candidate for INC-2026-001.
 */

export const MOCK_VESSELS: Vessel[] = [
  {
    id: 'vsl-001',
    imo: 'IMO-XXXX1',
    name: 'Ocean Guardian',
    type: 'tanker',
    position: { lat: 22.483, lng: 69.681 },
    heading: 258,
    speed: 9.4,
    lastUpdated: '2026-08-27T09:10:00Z',
    status: 'active',
    modelType: 'tanker',
  },
  {
    id: 'vsl-002',
    imo: 'IMO-XXXX2',
    name: 'Sagar Pratham',
    type: 'cargo',
    position: { lat: 23.012, lng: 69.057 },
    heading: 42,
    speed: 12.1,
    lastUpdated: '2026-08-27T09:10:00Z',
    status: 'active',
    modelType: 'cargo',
  },
  {
    id: 'vsl-003',
    imo: 'IMO-XXXX3',
    name: 'Arabian Star',
    type: 'container',
    position: { lat: 20.884, lng: 71.286 },
    heading: 318,
    speed: 10.4,
    lastUpdated: '2026-08-27T09:10:00Z',
    status: 'active',
    modelType: 'container',
  },
  {
    id: 'vsl-004',
    imo: 'IMO-XXXX4',
    name: 'Kutch Fisher',
    type: 'fishing',
    position: { lat: 22.552, lng: 69.441 },
    heading: 0,
    speed: 3.2,
    lastUpdated: '2026-08-27T09:10:00Z',
    status: 'stopped',
    modelType: 'fishing',
  },
  {
    id: 'vsl-005',
    imo: 'IMO-XXXX5',
    name: 'Coast Guard 07',
    type: 'patrol',
    position: { lat: 22.391, lng: 69.912 },
    heading: 142,
    speed: 15.6,
    lastUpdated: '2026-08-27T09:10:00Z',
    status: 'active',
    modelType: 'patrol',
  },
];

/** Historical trails per vessel, keyed by vessel id. */
export const MOCK_VESSEL_TRAILS: Record<string, VesselTrail> = {
  'vsl-001': {
    vesselId: 'vsl-001',
    points: [
      { lat: 22.821, lng: 68.221, timestamp: '2026-08-26T06:00:00Z', speed: 11.9, heading: 258 },
      { lat: 22.746, lng: 68.417, timestamp: '2026-08-26T12:00:00Z', speed: 11.7, heading: 258 },
      { lat: 22.667, lng: 68.621, timestamp: '2026-08-26T18:00:00Z', speed: 11.2, heading: 258 },
      { lat: 22.588, lng: 68.831, timestamp: '2026-08-27T00:00:00Z', speed: 10.9, heading: 258 },
      { lat: 22.535, lng: 69.241, timestamp: '2026-08-27T06:00:00Z', speed: 10.1, heading: 258 },
      { lat: 22.512, lng: 69.504, timestamp: '2026-08-27T08:00:00Z', speed: 9.6, heading: 258 },
      { lat: 22.483, lng: 69.681, timestamp: '2026-08-27T09:10:00Z', speed: 9.4, heading: 258 },
    ],
  },
  'vsl-002': {
    vesselId: 'vsl-002',
    points: [
      { lat: 21.902, lng: 68.021, timestamp: '2026-08-26T06:00:00Z', speed: 12.4, heading: 42 },
      { lat: 22.014, lng: 68.112, timestamp: '2026-08-26T12:00:00Z', speed: 12.7, heading: 42 },
      { lat: 22.521, lng: 68.612, timestamp: '2026-08-26T18:00:00Z', speed: 12.3, heading: 42 },
      { lat: 22.884, lng: 68.903, timestamp: '2026-08-27T00:00:00Z', speed: 12.1, heading: 42 },
      { lat: 23.012, lng: 69.057, timestamp: '2026-08-27T09:10:00Z', speed: 12.1, heading: 42 },
    ],
  },
  'vsl-004': {
    vesselId: 'vsl-004',
    points: [
      { lat: 22.458, lng: 69.214, timestamp: '2026-08-27T00:00:00Z', speed: 4.8, heading: 12 },
      { lat: 22.511, lng: 69.287, timestamp: '2026-08-27T03:00:00Z', speed: 4.1, heading: 18 },
      { lat: 22.558, lng: 69.352, timestamp: '2026-08-27T06:00:00Z', speed: 3.4, heading: 9 },
      { lat: 22.552, lng: 69.441, timestamp: '2026-08-27T09:10:00Z', speed: 3.2, heading: 0 },
    ],
  },
};