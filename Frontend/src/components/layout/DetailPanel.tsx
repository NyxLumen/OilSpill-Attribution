import {
  X,
  Droplet,
  ArrowRight,
  Ship,
  Navigation,
  Compass,
  Gauge,
  Clock,
  Radio,
  RotateCcw,
  Wind,
  Waves,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useUIStore, useIncidentStore, useScenarioStore } from '@/store';
import { useDataProvider } from '@/app/providers';
import { environmentAt, driftVectorAt } from '@/simulation';
import { VESSEL_TYPE_COLORS } from '@/map/layers';
import type { VesselType } from '@/types/vessel';

/** Human-readable class label for candidate items. */
function vesselClassLabel(type: VesselType): string {
  switch (type) {
    case 'tanker':
      return 'Oil Tanker';
    case 'cargo':
      return 'Cargo Vessel';
    case 'container':
      return 'Container Ship';
    case 'fishing':
      return 'Fishing Vessel';
    case 'patrol':
      return 'Patrol Craft';
    default:
      return 'Vessel';
  }
}

/** Format timestamp to e.g. "27 Aug 2026, 07:42 UTC" */
function formatIncidentDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    const day = d.getUTCDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes} UTC`;
  } catch {
    return isoString;
  }
}

/**
 * Floating Oil Spill Detection Card
 */
function OilSpillCard({
  incident,
  phase,
  onInvestigate,
}: {
  incident: {
    id: string;
    detectedAt: string;
    areaKm2: number;
    confidence: number;
    severity?: string;
    status?: string;
    source?: string;
  };
  phase: string;
  onInvestigate: () => void;
}) {
  const { setActivePanel } = useUIStore();
  const simTimeMs = useScenarioStore((state) => state.simTimeMs);
  const drift = driftVectorAt(simTimeMs);

  const severity = (incident.severity || 'high').toUpperCase();
  const status = (incident.status || 'detected').toUpperCase();
  const source = incident.source === 'sar' ? 'SAR SATELLITE (Sentinel-1A)' : (incident.source || 'SAR SATELLITE').toUpperCase();
  const isCorrelating = phase === 'correlating' || phase === 'attribution-ready';

  return (
    <div className="w-84 rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 shadow-[0_12px_32px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)] p-5 text-ocean-900 transition-smooth">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-ocean-900">
            OIL SPILL DETECTED
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setActivePanel(null)}
          className="text-ocean-400 hover:text-ocean-700 p-1 rounded-md transition-smooth"
          aria-label="Dismiss panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Incident Tag & Status Badges */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-ocean-700">
          <div className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center text-red-600">
            <Droplet className="w-3 h-3 fill-current" />
          </div>
          <span>#{incident.id}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-red-50 text-red-700 border border-red-200/60">
            {severity}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-ocean-50 text-ocean-700 border border-ocean-200/60">
            {status}
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="space-y-3 mb-4 text-xs">
        <div>
          <div className="text-[10px] font-semibold text-ocean-500 uppercase tracking-wider">Classification</div>
          <div className="font-bold text-ocean-900 mt-0.5">HYDROCARBON SLICK</div>
        </div>

        <div>
          <div className="text-[10px] font-semibold text-ocean-500 uppercase tracking-wider">Detection Source</div>
          <div className="font-semibold text-ocean-800 mt-0.5">{source}</div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-ocean-100/70">
          <div>
            <div className="text-[10px] font-semibold text-ocean-500 uppercase tracking-wider">Detected Time</div>
            <div className="font-semibold text-ocean-800 mt-0.5">
              {formatIncidentDate(incident.detectedAt)}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-ocean-500 uppercase tracking-wider">Observed Area</div>
            <div className="text-base font-extrabold text-ocean-900 mt-0.5">
              {incident.areaKm2.toFixed(1)} km²
            </div>
          </div>
        </div>

        {/* Environmental Drift Telemetry (Revealed during correlating phase) */}
        {isCorrelating && (
          <div className="pt-2 border-t border-ocean-100/70">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-ocean-500 font-semibold uppercase tracking-wider">Surface Drift Force</span>
              <span className="font-mono font-bold text-amber-700">
                {drift.speedKmH.toFixed(1)} km/h @ {drift.bearingDeg}° WSW
              </span>
            </div>
            <div className="text-[10px] text-ocean-600 leading-tight">
              Ebb outflow + ENE wind driving slick WSW down-channel
            </div>
          </div>
        )}

        <div className="pt-1">
          <div className="flex items-center justify-between text-[11px] font-medium mb-1.5">
            <span className="text-ocean-500">Confidence</span>
            <span className="font-bold text-ocean-900">{(incident.confidence * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-ocean-100/80 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-accent h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${incident.confidence * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Investigation Action */}
      <button
        type="button"
        onClick={onInvestigate}
        className="w-full py-2.5 rounded-xl bg-ocean-900 text-white font-bold text-xs tracking-wider uppercase hover:bg-ocean-800 active:scale-[0.99] transition-smooth shadow-md shadow-ocean-900/10 flex items-center justify-center gap-2"
      >
        <Activity className="w-3.5 h-3.5 text-cyan-400" />
        <span>{isCorrelating ? 'View Drift & AIS Correlation' : 'Begin Correlation Analysis'}</span>
      </button>
    </div>
  );
}

/**
 * Floating AIS Correlation Card
 *
 * Communicates: "These vessels are relevant to the investigation."
 * Displays active spatiotemporal correlation parameters, drift model summary,
 * and compact relevant candidate vessels.
 */
function AISCorrelationCard({
  candidates,
  phase,
  onSelectCandidate,
}: {
  candidates: Array<{
    vesselId: string;
    matchScore: number;
    distanceFromOriginKm: number;
    temporalCorrelation: number;
    routeCorrelation: number;
    behavioralCorrelation: number;
  }>;
  phase: string;
  onSelectCandidate: (vesselId: string) => void;
}) {
  const dataProvider = useDataProvider();
  const simTimeMs = useScenarioStore((state) => state.simTimeMs);
  const env = environmentAt(simTimeMs);
  const drift = driftVectorAt(simTimeMs);

  const { data: vessels = [] } = useQuery({
    queryKey: ['vessels'],
    queryFn: () => dataProvider.getVessels(),
  });

  const isComplete = phase === 'attribution-ready';

  return (
    <div className="w-84 rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 shadow-[0_12px_32px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)] p-5 text-ocean-900 transition-smooth">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 className="w-4 h-4 text-cyan-600" />
          ) : (
            <Activity className="w-4 h-4 text-blue-accent animate-pulse" />
          )}
          <span className="text-[11px] font-bold uppercase tracking-wider text-ocean-900">
            {isComplete ? 'AIS CORRELATION COMPLETE' : 'AIS CORRELATION IN PROGRESS'}
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200/60">
          50 VESSELS ANALYZED
        </span>
      </div>

      {/* Spatiotemporal Parameters & Drift Vector */}
      <div className="p-3 rounded-xl bg-ocean-50/70 border border-border-subtle mb-3 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-ocean-500 uppercase tracking-wider">Release Window:</span>
          <span className="font-mono font-bold text-ocean-900">06:12–07:27 UTC</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-ocean-500 uppercase tracking-wider">Net Drift Vector:</span>
          <span className="font-mono font-bold text-ocean-900">
            {drift.speedKmH.toFixed(1)} km/h @ {drift.bearingDeg}°
          </span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-ocean-200/50 text-[11px] text-ocean-600">
          <div className="flex items-center gap-1">
            <Wind className="w-3 h-3 text-ocean-500" />
            <span>{(env.wind.speed * 1.94).toFixed(1)} kn ENE</span>
          </div>
          <div className="flex items-center gap-1">
            <Waves className="w-3 h-3 text-ocean-500" />
            <span>{(env.current.speed * 1.94).toFixed(1)} kn W</span>
          </div>
        </div>
      </div>

      {/* Relevant Candidate Vessels List */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-ocean-600 uppercase tracking-wider">
          Relevant Candidates ({candidates.length})
        </span>
        <span className="text-[10px] text-ocean-400 font-medium">Trajectory & Proximity Match</span>
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
        {candidates.map((cand, idx) => {
          const v = vessels.find((item) => item.id === cand.vesselId);
          const color = v ? VESSEL_TYPE_COLORS[v.type] : '#64748b';

          return (
            <button
              key={cand.vesselId}
              type="button"
              onClick={() => onSelectCandidate(cand.vesselId)}
              className="w-full p-2.5 rounded-xl bg-surface-white border border-border-subtle hover:border-blue-accent/50 hover:bg-ocean-50/80 transition-smooth text-left shadow-xs group"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs font-bold text-ocean-900 group-hover:text-blue-accent transition-smooth">
                    #{idx + 1} {v ? v.name : cand.vesselId}
                  </span>
                </div>
                <span className="font-mono text-[11px] font-bold text-ocean-700">
                  {cand.distanceFromOriginKm.toFixed(1)} km
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-ocean-500">
                <span>{v ? `${vesselClassLabel(v.type)} • IMO ${v.imo}` : 'Vessel'}</span>
                <div className="flex items-center gap-1 font-semibold text-blue-accent">
                  <span>Inspect Track</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-smooth" />
                </div>
              </div>

              {/* Correlation Correlation Tags */}
              <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-ocean-100/60">
                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                  TEMPORAL MATCH
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/50">
                  ROUTE MATCH
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-ocean-50 text-ocean-700 border border-ocean-200/50">
                  DISTANCE MATCH
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Deep Vessel Telemetry Inspection Card
 */
function VesselTelemetryDrawer({
  vessel,
  onClose,
}: {
  vessel: {
    id: string;
    name: string;
    type: VesselType;
    imo: string;
    speed: number;
    heading: number;
    status: string;
    position: { lat: number; lng: number };
  };
  onClose: () => void;
}) {
  const color = VESSEL_TYPE_COLORS[vessel.type] || VESSEL_TYPE_COLORS.other;

  return (
    <div className="w-84 rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 shadow-[0_12px_32px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)] p-5 text-ocean-900 transition-smooth">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center border shadow-xs"
            style={{ backgroundColor: `${color}15`, borderColor: `${color}40` }}
          >
            <Ship className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-ocean-900 leading-tight">{vessel.name}</h3>
            <span className="text-xs font-semibold text-ocean-500 font-mono">IMO {vessel.imo}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-ocean-400 hover:text-ocean-700 hover:bg-ocean-100/60 rounded-lg transition-smooth"
          title="Back to overview / close"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className="p-3 rounded-xl bg-ocean-50/70 border border-border-subtle">
          <div className="flex items-center gap-1.5 text-ocean-500 text-[11px] font-medium mb-1">
            <Gauge className="w-3.5 h-3.5 text-blue-accent" />
            <span>Speed</span>
          </div>
          <div className="font-mono text-sm font-bold text-ocean-900">
            {vessel.speed.toFixed(1)} <span className="text-xs font-normal text-ocean-600">kn</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-ocean-50/70 border border-border-subtle">
          <div className="flex items-center gap-1.5 text-ocean-500 text-[11px] font-medium mb-1">
            <Compass className="w-3.5 h-3.5 text-blue-accent" />
            <span>Heading</span>
          </div>
          <div className="font-mono text-sm font-bold text-ocean-900">
            {vessel.heading}°
          </div>
        </div>

        <div className="p-3 rounded-xl bg-ocean-50/70 border border-border-subtle">
          <div className="flex items-center gap-1.5 text-ocean-500 text-[11px] font-medium mb-1">
            <Radio className="w-3.5 h-3.5 text-green-live" />
            <span>Type</span>
          </div>
          <div className="text-xs font-bold text-ocean-900 capitalize">
            {vessel.type}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-ocean-50/70 border border-border-subtle">
          <div className="flex items-center gap-1.5 text-ocean-500 text-[11px] font-medium mb-1">
            <Clock className="w-3.5 h-3.5 text-blue-accent" />
            <span>Status</span>
          </div>
          <div className="text-xs font-bold text-ocean-900 capitalize">
            {vessel.status}
          </div>
        </div>
      </div>

      {/* Position Telemetry */}
      <div className="p-3 rounded-xl bg-ocean-50/70 border border-border-subtle flex items-center justify-between text-xs mb-3">
        <div className="flex items-center gap-1.5 text-ocean-600 font-medium">
          <Navigation className="w-3.5 h-3.5 text-blue-accent" />
          <span>Position:</span>
        </div>
        <div className="font-mono font-bold text-ocean-900">
          {vessel.position.lat.toFixed(4)}°N, {vessel.position.lng.toFixed(4)}°E
        </div>
      </div>
    </div>
  );
}

/**
 * Vessel Fleet List Panel
 */
function VesselFleetList({
  onSelectVessel,
  onClose,
}: {
  onSelectVessel: (vesselId: string) => void;
  onClose: () => void;
}) {
  const dataProvider = useDataProvider();
  const { data: vessels = [] } = useQuery({
    queryKey: ['vessels'],
    queryFn: () => dataProvider.getVessels(),
  });

  return (
    <div className="w-84 max-h-[calc(100vh-10rem)] rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 shadow-[0_12px_32px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)] p-5 text-ocean-900 flex flex-col transition-smooth">
      <div className="flex items-center justify-between pb-3 border-b border-ocean-100 mb-3">
        <div className="flex items-center gap-2">
          <Ship className="w-4 h-4 text-blue-accent" />
          <h3 className="text-xs font-bold text-ocean-900 uppercase tracking-wider">
            Active Fleet ({vessels.length})
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-ocean-400 hover:text-ocean-700 transition-smooth"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {vessels.map((v) => {
          const color = VESSEL_TYPE_COLORS[v.type] || VESSEL_TYPE_COLORS.other;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelectVessel(v.id)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-white border border-border-subtle hover:border-blue-accent/40 hover:bg-ocean-50/70 transition-smooth text-left shadow-xs group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center border shrink-0"
                  style={{ backgroundColor: `${color}15`, borderColor: `${color}30` }}
                >
                  <Ship className="w-4 h-4" style={{ color }} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-ocean-900 truncate group-hover:text-blue-accent transition-smooth">
                    {v.name}
                  </div>
                  <div className="text-[11px] text-ocean-500 capitalize truncate">
                    {v.type} • {v.speed.toFixed(1)} kn
                  </div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-ocean-400 group-hover:text-blue-accent group-hover:translate-x-0.5 transition-smooth shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Detailed Incident Investigation & Drift Analysis Panel
 */
function IncidentInvestigationPanel({
  incident,
  candidates,
  onSelectCandidate,
  onClose,
}: {
  incident: { id: string; detectedAt: string; areaKm2: number; confidence: number };
  candidates: Array<{
    vesselId: string;
    matchScore: number;
    distanceFromOriginKm: number;
  }>;
  onSelectCandidate: (vesselId: string) => void;
  onClose: () => void;
}) {
  const dataProvider = useDataProvider();
  const simTimeMs = useScenarioStore((state) => state.simTimeMs);
  const env = environmentAt(simTimeMs);
  const drift = driftVectorAt(simTimeMs);

  const { data: vessels = [] } = useQuery({
    queryKey: ['vessels'],
    queryFn: () => dataProvider.getVessels(),
  });

  return (
    <div className="w-84 max-h-[calc(100vh-10rem)] rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 shadow-[0_12px_32px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)] p-5 text-ocean-900 flex flex-col transition-smooth">
      <div className="flex items-center justify-between pb-3 border-b border-ocean-100 mb-3">
        <div className="flex items-center gap-2">
          <Droplet className="w-4 h-4 text-red-alert fill-current" />
          <h3 className="text-xs font-bold text-ocean-900 uppercase tracking-wider">
            Incident #{incident.id} Analysis
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-ocean-400 hover:text-ocean-700 transition-smooth"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Environmental & Drift Summary */}
      <div className="p-3 rounded-xl bg-ocean-50/70 border border-border-subtle mb-3 space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-ocean-500 font-semibold">Current Extent:</span>
          <span className="font-bold text-ocean-900">{incident.areaKm2.toFixed(1)} km²</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ocean-500 font-semibold">Net Surface Drift:</span>
          <span className="font-mono font-bold text-ocean-900">
            {drift.speedKmH.toFixed(1)} km/h @ {drift.bearingDeg}°
          </span>
        </div>
        <div className="flex justify-between text-[11px] text-ocean-600 pt-1 border-t border-ocean-200/50">
          <span>Wind: {(env.wind.speed * 1.94).toFixed(1)} kn ENE</span>
          <span>Current: {(env.current.speed * 1.94).toFixed(1)} kn W</span>
        </div>
      </div>

      <h4 className="text-[11px] font-bold text-ocean-600 uppercase tracking-wider mb-2">
        Correlated Candidates ({candidates.length})
      </h4>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {candidates.map((cand, idx) => {
          const v = vessels.find((item) => item.id === cand.vesselId);

          return (
            <div
              key={cand.vesselId}
              className="p-3 rounded-xl bg-surface-white border border-border-subtle shadow-xs"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-ocean-900">
                  #{idx + 1} {v ? v.name : cand.vesselId}
                </span>
                <span className="font-mono text-xs font-bold text-blue-accent">
                  {cand.distanceFromOriginKm.toFixed(1)} km to origin
                </span>
              </div>
              <p className="text-[11px] text-ocean-500 mb-2">
                {v ? `${vesselClassLabel(v.type)} • IMO ${v.imo}` : 'Vessel'}
              </p>
              <button
                type="button"
                onClick={() => onSelectCandidate(cand.vesselId)}
                className="w-full py-1.5 rounded-lg bg-blue-accent/10 hover:bg-blue-accent text-blue-accent hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-smooth"
              >
                <span>Inspect Candidate Track</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * OceanWatch Right Intelligence Stack
 *
 * Reacts dynamically to scenario phase and user interactions:
 * - normal: clean map
 * - spill-detected (07:42): OilSpillCard
 * - correlating (08:00): OilSpillCard + AISCorrelationCard
 * - attribution-ready (08:41): OilSpillCard + AISCorrelationCard
 * - panel toggles: VesselTelemetryDrawer, VesselFleetList, IncidentInvestigationPanel
 */
export function DetailPanel() {
  const dataProvider = useDataProvider();
  const { activePanel, setActivePanel, closePanel } = useUIStore();
  const selectedVesselId = useIncidentStore((state) => state.selectedVesselId);
  const selectVessel = useIncidentStore((state) => state.selectVessel);
  const selectIncident = useIncidentStore((state) => state.selectIncident);
  const isPlaying = useScenarioStore((state) => state.isPlaying);
  const phase = useScenarioStore((state) => state.phase);

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => dataProvider.getIncidents(),
    staleTime: 0,
    refetchInterval: isPlaying ? 300 : false,
  });

  const activeIncident = incidents[0] || null;
  const isDetected = activeIncident !== null && phase !== 'normal';
  const isCorrelating = phase === 'correlating' || phase === 'attribution-ready';

  const { data: candidates = [] } = useQuery({
    queryKey: ['candidates', activeIncident?.id],
    queryFn: () => (activeIncident ? dataProvider.getCandidates(activeIncident.id) : []),
    enabled: Boolean(activeIncident && isCorrelating),
    staleTime: 0,
    refetchInterval: isPlaying ? 300 : false,
  });

  const { data: vessels = [] } = useQuery({
    queryKey: ['vessels'],
    queryFn: () => dataProvider.getVessels(),
    staleTime: 0,
    refetchInterval: isPlaying ? 150 : false,
  });

  const selectedVessel = selectedVesselId
    ? vessels.find((v) => v.id === selectedVesselId) || null
    : null;

  const handleInvestigate = () => {
    if (activeIncident) {
      selectIncident(activeIncident.id);
      setActivePanel('incidents');
    }
  };

  const handleSelectCandidateFromCard = (vesselId: string) => {
    selectVessel(vesselId);
    setActivePanel('vessels');
  };

  const handleSelectVesselFromList = (vesselId: string) => {
    selectVessel(vesselId);
  };

  // If nothing to display in default mode before detection, return null
  if (activePanel === null && !isDetected && !selectedVessel) {
    return null;
  }

  return (
    <div className="absolute right-6 top-24 z-20 flex flex-col gap-4">
      {/* 1. Vessels View */}
      {activePanel === 'vessels' ? (
        selectedVessel ? (
          <VesselTelemetryDrawer
            vessel={selectedVessel}
            onClose={() => selectVessel(null)}
          />
        ) : (
          <VesselFleetList
            onSelectVessel={handleSelectVesselFromList}
            onClose={() => closePanel()}
          />
        )
      ) : activePanel === 'incidents' ? (
        /* 2. Incidents Investigation View */
        activeIncident ? (
          <IncidentInvestigationPanel
            incident={activeIncident}
            candidates={candidates}
            onSelectCandidate={handleSelectCandidateFromCard}
            onClose={() => closePanel()}
          />
        ) : null
      ) : (
        /* 3. Default Overview: Dynamic Spill Detection & AIS Correlation Progression */
        <>
          {isDetected && activeIncident && (
            <OilSpillCard
              incident={activeIncident}
              phase={phase}
              onInvestigate={handleInvestigate}
            />
          )}

          {isDetected && isCorrelating && candidates.length > 0 && (
            <AISCorrelationCard
              candidates={candidates}
              phase={phase}
              onSelectCandidate={handleSelectCandidateFromCard}
            />
          )}

          {selectedVessel && (
            <VesselTelemetryDrawer
              vessel={selectedVessel}
              onClose={() => selectVessel(null)}
            />
          )}
        </>
      )}
    </div>
  );
}