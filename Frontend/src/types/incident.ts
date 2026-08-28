import type { GeoPoint } from './map';

/**
 * Oil spill severity levels
 */
export type SpillSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Oil spill detection source
 */
export type SpillSource = 'sar' | 'optical' | 'combined';

/**
 * Oil spill investigation status
 */
export type IncidentStatus = 'detected' | 'investigating' | 'attributed' | 'resolved';

/**
 * Core oil spill incident domain model
 */
export interface OilSpillIncident {
  id: string;
  detectedAt: string;
  location: GeoPoint;
  areaKm2: number;
  confidence: number;
  severity: SpillSeverity;
  source: SpillSource;
  status: IncidentStatus;
  geometry?: unknown;
}

/**
 * Candidate/suspect vessel for an incident
 */
export interface Evidence {
  type: 'temporal' | 'route' | 'behavioral' | 'distance' | 'environmental';
  description: string;
  score: number;
  supportingData?: Record<string, unknown>;
}

export interface SuspectVessel {
  vesselId: string;
  matchScore: number;
  distanceFromOriginKm: number;
  temporalCorrelation: number;
  routeCorrelation: number;
  behavioralCorrelation: number;
  evidence: Evidence[];
}

/**
 * Timeline event for incident investigation
 */
export interface TimelineEvent {
  id: string;
  incidentId: string;
  timestamp: string;
  type: 'detection' | 'satellite_pass' | 'ais_correlation' | 'candidate_ranked' | 'source_identified' | 'investigation_started' | 'drift_prediction' | 'environmental_update';
  description: string;
  metadata?: Record<string, unknown>;
}

/**
 * Query parameters for fetching incidents
 */
export interface IncidentQuery {
  status?: IncidentStatus[];
  severity?: SpillSeverity[];
  startDate?: string;
  endDate?: string;
  bbox?: [number, number, number, number];
  limit?: number;
}