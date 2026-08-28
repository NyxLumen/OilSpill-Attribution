import type {
  Evidence,
  OilSpillIncident,
  SuspectVessel,
  TimelineEvent,
} from '../../types/incident';

/**
 * Deterministic mock incident scenario.
 *
 * Spill detected near the Gulf of Kutch; "Ocean Guardian" (vsl-001) is the
 * deliberate top candidate, so the station trail and its candidate ranking
 * stay causally consistent.
 */

export const MOCK_INCIDENTS: OilSpillIncident[] = [
  {
    id: 'INC-2026-001',
    detectedAt: '2026-08-27T07:42:00Z',
    location: { lat: 22.514, lng: 69.554 },
    areaKm2: 18.6,
    confidence: 0.92,
    severity: 'high',
    source: 'sar',
    status: 'investigating',
  },
];

export const MOCK_CANDIDATES: Record<string, SuspectVessel[]> = {
  'INC-2026-001': [
    {
      vesselId: 'vsl-001',
      matchScore: 0.91,
      distanceFromOriginKm: 42.3,
      temporalCorrelation: 0.94,
      routeCorrelation: 0.89,
      behavioralCorrelation: 0.91,
      evidence: [
        {
          type: 'temporal',
          description: 'Vessel crossed within 1 km of the spill origin during the probable release window.',
          score: 0.94,
        },
        {
          type: 'route',
          description: 'GMT incoming lane (~258°) passes directly through the detected spill extent.',
          score: 0.89,
        },
        {
          type: 'behavioral',
          description: 'Vessel reduced speed from 11.9 kn to 9.4 kn after passing the spill location.',
          score: 0.91,
        },
        {
          type: 'distance',
          description: 'Closest approach to the spill origin: ~1.8 km.',
          score: 0.72,
        },
      ],
    },
    {
      vesselId: 'vsl-002',
      matchScore: 0.34,
      distanceFromOriginKm: 128.4,
      temporalCorrelation: 0.22,
      routeCorrelation: 0.41,
      behavioralCorrelation: 0.28,
      evidence: [
        {
          type: 'distance',
          description: 'Never closer than ~128 km during the window; route stays outside the spill region.',
          score: 0.41,
        },
      ],
    },
    {
      vesselId: 'vsl-004',
      matchScore: 0.21,
      distanceFromOriginKm: 20.6,
      temporalCorrelation: 0.18,
      routeCorrelation: 0.25,
      behavioralCorrelation: 0.19,
      evidence: [
        {
          type: 'behavioral',
          description: 'Stopped/low-speed vessel; no discharge trajectory matches drift.',
          score: 0.19,
        },
      ],
    },
  ],
};

export const MOCK_TIMELINES: Record<string, TimelineEvent[]> = {
  'INC-2026-001': [
    {
      id: 'evt-001',
      incidentId: 'INC-2026-001',
      timestamp: '2026-08-27T07:20:00Z',
      type: 'satellite_pass',
      description: 'SAR satellite pass captured 20 km swath over region AU-7.',
    },
    {
      id: 'evt-002',
      incidentId: 'INC-2026-001',
      timestamp: '2026-08-27T07:42:00Z',
      type: 'detection',
      description: 'Oil spill detected from SAR imagery; extent initialized.',
    },
    {
      id: 'evt-003',
      incidentId: 'INC-2026-001',
      timestamp: '2026-08-27T07:52:00Z',
      type: 'investigation_started',
      description: 'Investigation opened; spill shape analyzed.',
    },
    {
      id: 'evt-004',
      incidentId: 'INC-2026-001',
      timestamp: '2026-08-27T08:20:00Z',
      type: 'environmental_update',
      description: 'Gale ~7 m/s from NW; surface drift projected east-southeast.',
    },
    {
      id: 'evt-005',
      incidentId: 'INC-2026-001',
      timestamp: '2026-08-27T08:34:00Z',
      type: 'ais_correlation',
      description: 'AIS tracks intersected with back-projected spill drift path.',
    },
    {
      id: 'evt-006',
      incidentId: 'INC-2026-001',
      timestamp: '2026-08-27T08:41:00Z',
      type: 'candidate_ranked',
      description: '3 candidate vessels ranked; top candidate Ocean Guardian (vsl-001).',
    },
    {
      id: 'evt-007',
      incidentId: 'INC-2026-001',
      timestamp: '2026-08-27T09:10:00Z',
      type: 'drift_prediction',
      description: 'Predicted drift path computed over next 12 hours.',
    },
  ],
};

export type MockEvidence = Evidence;