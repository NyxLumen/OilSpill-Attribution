import { MOCK_CANDIDATES, MOCK_INCIDENTS, MOCK_TIMELINES } from '../data/mock/incidents';
import { getMockEnvironmentPoint } from '../data/mock/environment';
import { simulationEngine } from '../simulation';
import type { EnvironmentQuery, OceanConditions } from '../types/environment';
import type {
  IncidentQuery,
  OilSpillIncident,
  SuspectVessel,
  TimelineEvent,
} from '../types/incident';
import type { GeoPoint } from '../types/map';
import type { TrailQuery, Vessel, VesselQuery, VesselTrail } from '../types/vessel';
import type { OceanWatchDataProvider } from './provider';

/**
 * Deterministic mock data provider.
 *
 * This is a permanent development and demo capability (see AGENTS.md §4),
 * not temporary throwaway code. It returns typed domain models with no
 * network activity. Vessels and trails come from the centralized
 * `SimulationEngine`, which advances a single deterministic simulation clock;
 * incidents, candidates, timelines and environment remain static scenario
 * data.
 */
export class MockDataProvider implements OceanWatchDataProvider {
  private readonly incidents: OilSpillIncident[];
  private readonly candidates: Record<string, SuspectVessel[]>;
  private readonly timelines: Record<string, TimelineEvent[]>;

  constructor() {
    this.incidents = structuredClone(MOCK_INCIDENTS);
    this.candidates = structuredClone(MOCK_CANDIDATES);
    this.timelines = structuredClone(MOCK_TIMELINES);
  }

  async getVessels(params?: VesselQuery): Promise<Vessel[]> {
    let result = simulationEngine.getVessels();

    if (params?.types && params.types.length > 0) {
      const types = new Set(params.types);
      result = result.filter((v) => types.has(v.type));
    }

    if (params?.limit !== undefined) {
      result = result.slice(0, params.limit);
    }

    return result;
  }

  async getVessel(id: string): Promise<Vessel | null> {
    return simulationEngine.getVessel(id);
  }

  async getVesselTrail(id: string, params?: TrailQuery): Promise<VesselTrail | null> {
    const trail = simulationEngine.getVesselTrail(id);
    if (!trail) return null;

    let points = trail.points;
    if (params?.startTime) {
      points = points.filter((p) => p.timestamp >= (params.startTime as string));
    }
    if (params?.endTime) {
      points = points.filter((p) => p.timestamp <= (params.endTime as string));
    }
    if (params?.maxPoints !== undefined) {
      points = points.slice(-(params.maxPoints as number));
    }

    return { vesselId: trail.vesselId, points };
  }

  async getIncidents(params?: IncidentQuery): Promise<OilSpillIncident[]> {
    let result = this.incidents;

    if (params?.status && params.status.length > 0) {
      const statuses = new Set(params.status);
      result = result.filter((i) => statuses.has(i.status));
    }

    if (params?.severity && params.severity.length > 0) {
      const severities = new Set(params.severity);
      result = result.filter((i) => severities.has(i.severity));
    }

    if (params?.limit !== undefined) {
      result = result.slice(0, params.limit);
    }

    return structuredClone(result);
  }

  async getIncident(id: string): Promise<OilSpillIncident | null> {
    const incident = this.incidents.find((i) => i.id === id);
    return incident ? structuredClone(incident) : null;
  }

  async getCandidates(incidentId: string): Promise<SuspectVessel[]> {
    return structuredClone(this.candidates[incidentId] ?? []);
  }

  async getTimeline(incidentId: string): Promise<TimelineEvent[]> {
    return structuredClone(this.timelines[incidentId] ?? []);
  }

  async getEnvironment(location: GeoPoint, _params?: EnvironmentQuery): Promise<OceanConditions> {
    // Location is accepted for contract compatibility; mock conditions are
    // currently constant across the region.
    void location;
    return structuredClone(getMockEnvironmentPoint());
  }
}
