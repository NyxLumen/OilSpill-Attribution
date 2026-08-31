import { X, AlertTriangle, Ship, ArrowRight, BarChart2, Navigation, Compass, Gauge, Clock, Radio, RotateCcw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useUIStore, useIncidentStore } from '@/store';
import { useDataProvider } from '@/app/providers';
import { VESSEL_TYPE_COLORS } from '@/map/layers';
import type { VesselType } from '@/types/vessel';

/** Human-readable class label for the candidate card. */
function vesselClassLabel(type: VesselType): string {
  switch (type) {
    case 'tanker':
      return 'Crude Oil Tanker';
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

/**
 * Incident Panel Content with real mock scenario data and candidate attribution flow
 */
function IncidentPanelContent() {
  const dataProvider = useDataProvider();
  const selectVessel = useIncidentStore((state) => state.selectVessel);
  const setActivePanel = useUIStore((state) => state.setActivePanel);

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => dataProvider.getIncidents(),
  });

  const incident = incidents[0];

  // Candidates come from the scenario runner (fleet-derived, deterministic).
  const { data: candidates = [] } = useQuery({
    queryKey: ['candidates', incident?.id],
    queryFn: () => dataProvider.getCandidates(incident!.id),
    enabled: incident != null,
  });
  const topCandidate = candidates[0];

  const { data: candidateVessel } = useQuery({
    queryKey: ['vessel', topCandidate?.vesselId],
    queryFn: () => dataProvider.getVessel(topCandidate!.vesselId),
    enabled: topCandidate != null,
  });

  const handleSelectCandidate = (vesselId: string) => {
    selectVessel(vesselId);
    setActivePanel('vessels');
  };

  return (
    <div className="space-y-6">
      {/* Oil Spill Detected Card */}
      {incident ? (
        <div className="rounded-xl bg-surface-white border border-border-subtle p-5 shadow-floating">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-alert shrink-0" />
                <h3 className="text-sm font-bold tracking-wide text-red-alert uppercase">OIL SPILL DETECTED</h3>
              </div>
              <h4 className="text-base font-semibold text-ocean-900 mb-3">Incident #{incident.id}</h4>

              {/* Incident Details */}
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-ocean-600">Detected</span>
                  <span className="font-medium text-ocean-900">
                    {new Date(incident.detectedAt).toUTCString().replace('GMT', 'UTC')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ocean-600">Calculated Extent</span>
                  <span className="font-medium text-ocean-900">{incident.areaKm2} km²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ocean-600">Source Sensor</span>
                  <span className="font-medium text-ocean-900 uppercase">{incident.source} Satellite</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ocean-600">Confidence</span>
                  <span className="font-medium text-ocean-900">{Math.round(incident.confidence * 100)}%</span>
                </div>

                {/* Confidence Bar */}
                <div className="pt-1">
                  <div className="w-full bg-ocean-100 rounded-full h-2">
                    <div
                      className="bg-blue-accent h-2 rounded-full transition-all duration-500"
                      style={{ width: `${incident.confidence * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Top Candidate Card */}
      <div className="rounded-xl bg-surface-white border border-border-subtle p-5 shadow-floating">
        {topCandidate && candidateVessel ? (
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-200 shrink-0">
              <Ship className="w-7 h-7 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <BarChart2 className="w-4 h-4 text-green-live" />
                <span className="text-xs font-bold text-green-live uppercase tracking-wide">
                  {Math.round(topCandidate.matchScore * 100)}% Match Candidate
                </span>
              </div>
              <h4 className="text-base font-bold text-ocean-900 truncate">{candidateVessel.name}</h4>
              <p className="text-xs text-ocean-600 mb-3">
                {vesselClassLabel(candidateVessel.type)} • IMO-{candidateVessel.imo}
              </p>

              <button
                type="button"
                onClick={() => handleSelectCandidate(topCandidate.vesselId)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold bg-blue-accent text-white hover:bg-blue-accent/90 transition-smooth shadow-xs"
              >
                <span>Inspect Vessel & Trail</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-ocean-600">No candidate vessels ranked yet.</p>
        )}
      </div>
    </div>
  );
}

/**
 * Vessel Panel Content: displays selected vessel details or vessel directory
 */
function VesselPanelContent() {
  const dataProvider = useDataProvider();
  const selectedVesselId = useIncidentStore((state) => state.selectedVesselId);
  const selectVessel = useIncidentStore((state) => state.selectVessel);

  const { data: vessels = [] } = useQuery({
    queryKey: ['vessels'],
    queryFn: () => dataProvider.getVessels(),
  });

  const selectedVessel = vessels.find((v) => v.id === selectedVesselId);

  // If a vessel is selected, render deep telemetry inspection card
  if (selectedVessel) {
    const color = VESSEL_TYPE_COLORS[selectedVessel.type] || VESSEL_TYPE_COLORS.other;

    return (
      <div className="space-y-5">
        {/* Selected Vessel Header Card */}
        <div className="rounded-xl bg-surface-white border border-border-subtle p-5 shadow-floating">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center border shadow-xs"
                style={{ backgroundColor: `${color}15`, borderColor: `${color}40` }}
              >
                <Ship className="w-6 h-6" style={{ color }} />
              </div>
              <div>
                <h3 className="text-base font-bold text-ocean-900 leading-tight">{selectedVessel.name}</h3>
                <span className="text-xs font-medium text-ocean-500 font-mono">{selectedVessel.imo}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => selectVessel(null)}
              className="p-1.5 text-ocean-400 hover:text-ocean-700 hover:bg-ocean-50 rounded-lg transition-smooth"
              title="Deselect vessel"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Telemetry Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-ocean-50/70 border border-border-subtle">
              <div className="flex items-center gap-1.5 text-ocean-500 text-xs mb-1">
                <Gauge className="w-3.5 h-3.5 text-blue-accent" />
                <span>Speed</span>
              </div>
              <div className="font-mono text-base font-bold text-ocean-900">
                {selectedVessel.speed.toFixed(1)} <span className="text-xs font-normal text-ocean-600">kn</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-ocean-50/70 border border-border-subtle">
              <div className="flex items-center gap-1.5 text-ocean-500 text-xs mb-1">
                <Compass className="w-3.5 h-3.5 text-blue-accent" />
                <span>Heading</span>
              </div>
              <div className="font-mono text-base font-bold text-ocean-900">
                {selectedVessel.heading}°
              </div>
            </div>

            <div className="p-3 rounded-lg bg-ocean-50/70 border border-border-subtle">
              <div className="flex items-center gap-1.5 text-ocean-500 text-xs mb-1">
                <Radio className="w-3.5 h-3.5 text-green-live" />
                <span>Type</span>
              </div>
              <div className="text-sm font-semibold text-ocean-900 capitalize">
                {selectedVessel.type}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-ocean-50/70 border border-border-subtle">
              <div className="flex items-center gap-1.5 text-ocean-500 text-xs mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-accent" />
                <span>Status</span>
              </div>
              <div className="text-sm font-semibold text-ocean-900 capitalize">
                {selectedVessel.status}
              </div>
            </div>
          </div>

          {/* Position Telemetry */}
          <div className="p-3 rounded-lg bg-ocean-50/70 border border-border-subtle flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-ocean-600">
              <Navigation className="w-3.5 h-3.5 text-blue-accent" />
              <span>Position:</span>
            </div>
            <div className="font-mono font-medium text-ocean-900">
              {selectedVessel.position.lat.toFixed(4)}°N, {selectedVessel.position.lng.toFixed(4)}°E
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vessel Fleet List when no specific vessel is active
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ocean-800 uppercase tracking-wider">
          Active Fleet ({vessels.length})
        </h3>
      </div>
      <div className="space-y-2">
        {vessels.map((v) => {
          const color = VESSEL_TYPE_COLORS[v.type] || VESSEL_TYPE_COLORS.other;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => selectVessel(v.id)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-white border border-border-subtle hover:border-blue-accent/40 hover:bg-ocean-50/60 transition-smooth text-left shadow-xs group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center border"
                  style={{ backgroundColor: `${color}15`, borderColor: `${color}30` }}
                >
                  <Ship className="w-4 h-4" style={{ color }} />
                </div>
                <div>
                  <div className="text-sm font-bold text-ocean-900 group-hover:text-blue-accent transition-smooth">
                    {v.name}
                  </div>
                  <div className="text-xs text-ocean-500 capitalize">{v.type} • {v.speed.toFixed(1)} kn</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-ocean-400 group-hover:text-blue-accent group-hover:translate-x-0.5 transition-smooth" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Settings Panel Content
 */
function SettingsPanelContent() {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-ocean-800 uppercase tracking-wider">Settings</h3>
      <p className="text-xs text-ocean-600">Application configuration and telemetry preferences.</p>
    </div>
  );
}

/**
 * OceanWatch Detail Panel Component
 *
 * Floating intelligence panel with light maritime aesthetic and bidirectional
 * selection synchronization.
 */
export function DetailPanel() {
  const { activePanel, closePanel } = useUIStore();
  const selectedVesselId = useIncidentStore((state) => state.selectedVesselId);

  if (!activePanel) {
    return null;
  }

  return (
    <div className="absolute right-6 top-24 bottom-24 w-96 rounded-2xl bg-surface-transparent backdrop-blur-md border border-border-subtle shadow-floating-lg overflow-hidden z-20 flex flex-col">
      {/* Panel Header */}
      <div className="flex items-center justify-between p-5 border-b border-border-subtle bg-surface-white/60">
        <h2 className="text-base font-bold text-ocean-900">
          {activePanel === 'incidents' && 'Incident Intelligence'}
          {activePanel === 'vessels' && (selectedVesselId ? 'Vessel Telemetry' : 'Vessel Fleet')}
          {activePanel === 'settings' && 'Settings'}
        </h2>
        <button
          type="button"
          onClick={closePanel}
          className="p-1.5 rounded-lg text-ocean-600 hover:text-ocean-900 hover:bg-ocean-100/60 transition-smooth"
          aria-label="Close panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {activePanel === 'incidents' && <IncidentPanelContent />}
        {activePanel === 'vessels' && <VesselPanelContent />}
        {activePanel === 'settings' && <SettingsPanelContent />}
      </div>
    </div>
  );
}