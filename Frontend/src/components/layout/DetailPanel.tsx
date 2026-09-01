import { X, Droplet, ArrowRight, Ship, Navigation, Compass, Gauge, Clock, Radio, RotateCcw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useUIStore, useIncidentStore, useScenarioStore } from '@/store';
import { useDataProvider } from '@/app/providers';
import { VESSEL_TYPE_COLORS } from '@/map/layers';
import type { VesselType } from '@/types/vessel';

/** Human-readable class label for the candidate card. */
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

/** Format timestamp to e.g. "14 Aug 2026, 14:32 UTC" */
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
/**
 * Floating Oil Spill Detection Card
 */
function OilSpillCard({
  incident,
  onTraceSource,
  onViewTimeline,
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
  onTraceSource: () => void;
  onViewTimeline: () => void;
}) {
  const { setActivePanel } = useUIStore();
  const severity = (incident.severity || 'high').toUpperCase();
  const status = (incident.status || 'detected').toUpperCase();
  const source = incident.source === 'sar' ? 'SAR SATELLITE (Sentinel-1A)' : (incident.source || 'SAR SATELLITE').toUpperCase();

  return (
    <div className="w-80 rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 shadow-[0_12px_32px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)] p-5 text-ocean-900 transition-smooth">
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
      <div className="space-y-3 mb-5 text-xs">
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

      {/* Primary CTA: Solid Dark Navy Button */}
      <button
        type="button"
        onClick={onTraceSource}
        className="w-full py-2.5 rounded-xl bg-ocean-900 text-white font-bold text-xs tracking-wider uppercase hover:bg-ocean-800 active:scale-[0.99] transition-smooth shadow-md shadow-ocean-900/10 mb-2.5"
      >
        TRACE SOURCE
      </button>

      {/* Secondary Action */}
      <button
        type="button"
        onClick={onViewTimeline}
        className="w-full flex items-center justify-between text-xs font-semibold text-ocean-600 hover:text-ocean-900 pt-1 group transition-smooth"
      >
        <span>View Investigation</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-smooth" />
      </button>
    </div>
  );
}

/**
 * Floating Top Candidate Vessel Card
 */
function TopCandidateCard({
  candidate,
  vessel,
  onViewDetails,
}: {
  candidate: { matchScore: number; vesselId: string };
  vessel: { id: string; name: string; type: VesselType; imo: string };
  onViewDetails: () => void;
}) {
  return (
    <div className="w-80 rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 shadow-[0_12px_32px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)] p-5 text-ocean-900 transition-smooth">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ocean-500">
          TOP CANDIDATE
        </span>
        <span className="text-xs font-bold text-cyan-600">
          {Math.round(candidate.matchScore * 100)}% Match
        </span>
      </div>

      {/* Vessel Identity */}
      <h4 className="text-base font-extrabold text-ocean-900 tracking-tight leading-snug">
        {vessel.name}
      </h4>
      <p className="text-xs text-ocean-500 font-medium mb-3">
        {vesselClassLabel(vessel.type)} &nbsp;|&nbsp; IMO {vessel.imo}
      </p>

      {/* Real Ship Image Asset Preview */}
      <div className="rounded-xl overflow-hidden border border-ocean-100 bg-ocean-50/50 mb-3 relative aspect-16/9 shadow-xs group">
        <img
          src="/assets/vessels/tanker.jpg"
          alt={vessel.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-500"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>

      {/* Secondary Action */}
      <button
        type="button"
        onClick={onViewDetails}
        className="w-full flex items-center justify-between text-xs font-semibold text-ocean-700 hover:text-ocean-900 pt-1 group transition-smooth"
      >
        <span>View Details</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-smooth" />
      </button>
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
    <div className="w-88 rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 shadow-[0_12px_32px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)] p-5 text-ocean-900 transition-smooth">
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
          title="Back to fleet / close"
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
    <div className="w-88 max-h-[calc(100vh-10rem)] rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 shadow-[0_12px_32px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)] p-5 text-ocean-900 flex flex-col transition-smooth">
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
 * Incident Investigation & Attribution Card
 */
function IncidentInvestigationPanel({
  incident,
  candidates,
  onSelectCandidate,
  onClose,
}: {
  incident: { id: string; detectedAt: string; areaKm2: number; confidence: number };
  candidates: Array<{ vesselId: string; matchScore: number; reason?: string }>;
  onSelectCandidate: (vesselId: string) => void;
  onClose: () => void;
}) {
  const dataProvider = useDataProvider();
  const { data: vessels = [] } = useQuery({
    queryKey: ['vessels'],
    queryFn: () => dataProvider.getVessels(),
  });

  return (
    <div className="w-88 max-h-[calc(100vh-10rem)] rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 shadow-[0_12px_32px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)] p-5 text-ocean-900 flex flex-col transition-smooth">
      <div className="flex items-center justify-between pb-3 border-b border-ocean-100 mb-3">
        <div className="flex items-center gap-2">
          <Droplet className="w-4 h-4 text-red-alert fill-current" />
          <h3 className="text-xs font-bold text-ocean-900 uppercase tracking-wider">
            Incident #{incident.id} Attribution
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

      <div className="p-3 rounded-xl bg-ocean-50/70 border border-border-subtle mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-ocean-500">Detection Extent:</span>
          <span className="font-bold text-ocean-900">{incident.areaKm2.toFixed(1)} km²</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-ocean-500">Confidence:</span>
          <span className="font-bold text-ocean-900">{(incident.confidence * 100).toFixed(1)}%</span>
        </div>
      </div>

      <h4 className="text-[11px] font-bold text-ocean-500 uppercase tracking-wider mb-2">
        Ranked Suspect Vessels ({candidates.length})
      </h4>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
        {candidates.map((cand, idx) => {
          const v = vessels.find((v) => v.id === cand.vesselId);
          const scorePercent = Math.round(cand.matchScore * 100);

          return (
            <div
              key={cand.vesselId}
              className="p-3 rounded-xl bg-surface-white border border-border-subtle shadow-xs"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-ocean-900">
                  #{idx + 1} {v ? v.name : cand.vesselId}
                </span>
                <span className="text-xs font-extrabold text-blue-accent">
                  {scorePercent}% Match
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
                <span>Inspect Candidate Trail</span>
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
 * Dynamically reacts to user interactions, sidebar selection, and map picking:
 * 1. Default Map View (activePanel === null): Dual Reference Cards (Oil Spill + Top Candidate)
 * 2. activePanel === 'vessels': Vessel Telemetry (if vessel selected) OR Active Fleet Directory
 * 3. activePanel === 'incidents': Incident Investigation & Ranked Attribution Breakdown
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

  const { data: candidates = [] } = useQuery({
    queryKey: ['candidates', activeIncident?.id],
    queryFn: () => (activeIncident ? dataProvider.getCandidates(activeIncident.id) : []),
    enabled: Boolean(activeIncident && (phase === 'correlating' || phase === 'attribution-ready')),
    staleTime: 0,
    refetchInterval: isPlaying ? 300 : false,
  });

  const topCandidate = candidates[0] || null;

  const { data: candidateVessel } = useQuery({
    queryKey: ['vessel', topCandidate?.vesselId],
    queryFn: () => (topCandidate ? dataProvider.getVessel(topCandidate.vesselId) : null),
    enabled: Boolean(topCandidate),
    staleTime: 0,
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

  const handleTraceSource = () => {
    if (activeIncident) {
      selectIncident(activeIncident.id);
      if (candidateVessel) {
        selectVessel(candidateVessel.id);
      }
      setActivePanel('incidents');
    }
  };

  const handleViewDetails = () => {
    if (candidateVessel) {
      selectVessel(candidateVessel.id);
      setActivePanel('vessels');
    }
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
            onSelectCandidate={(vesselId) => {
              selectVessel(vesselId);
              setActivePanel('vessels');
            }}
            onClose={() => closePanel()}
          />
        ) : null
      ) : (
        /* 3. Default Overview: Dynamic Spill Detection & Candidate Focus */
        <>
          {isDetected && activeIncident && (
            <OilSpillCard
              incident={activeIncident}
              onTraceSource={handleTraceSource}
              onViewTimeline={() => setActivePanel('incidents')}
            />
          )}

          {isDetected && (phase === 'correlating' || phase === 'attribution-ready') && topCandidate && candidateVessel && (
            <TopCandidateCard
              candidate={topCandidate}
              vessel={candidateVessel}
              onViewDetails={handleViewDetails}
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