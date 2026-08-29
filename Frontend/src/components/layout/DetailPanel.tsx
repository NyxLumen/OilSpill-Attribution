import { X, AlertTriangle, Ship, ArrowRight, BarChart2 } from 'lucide-react';
import { useUIStore } from '@/store';

/**
 * Incident Panel Content
 */
function IncidentPanelContent() {
  return (
    <div className="space-y-6">
      {/* Oil Spill Detected Card */}
      <div className="rounded-xl bg-surface-white border border-border-subtle p-6 shadow-floating">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-alert" />
              <h3 className="text-lg font-bold text-ocean-900">OIL SPILL DETECTED</h3>
            </div>
            <h4 className="text-base font-semibold text-ocean-800 mb-4">Incident #OS-2026-014</h4>

            {/* Incident Details */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ocean-600">Detected</span>
                <span className="font-medium text-ocean-900">14 Aug 2026, 14:32 UTC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ocean-600">Area</span>
                <span className="font-medium text-ocean-900">18.4 km²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ocean-600">Confidence</span>
                <span className="font-medium text-ocean-900">94.7%</span>
              </div>

              {/* Confidence Bar */}
              <div className="pt-2">
                <div className="w-full bg-ocean-100 rounded-full h-2">
                  <div className="bg-blue-accent h-2 rounded-full" style={{ width: '94.7%' }}></div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button className="flex-1 bg-blue-accent text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-accent/90 transition-smooth">
                TRACE SOURCE
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-ocean-700 hover:text-ocean-900 transition-smooth">
                <span className="text-sm font-medium">View Timeline</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Top Candidate Card */}
      <div className="rounded-xl bg-surface-white border border-border-subtle p-6 shadow-floating">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-xl bg-ocean-100 flex items-center justify-center border border-border-subtle">
            <Ship className="w-10 h-10 text-blue-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <BarChart2 className="w-4 h-4 text-green-live" />
              <span className="text-sm font-medium text-green-live">91% Match</span>
            </div>
            <h4 className="text-lg font-bold text-ocean-900 mb-1">MT Ocean Star</h4>
            <p className="text-sm text-ocean-600 mb-3">Oil Tanker | IMO 9876543</p>

            <button className="flex items-center gap-2 text-sm font-medium text-blue-accent hover:text-blue-accent/80 transition-smooth">
              <span>View Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Vessel Panel Content
 */
function VesselPanelContent() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-ocean-900">Vessel Search</h3>
      <p className="text-ocean-600">Search and filter vessels by various criteria.</p>
    </div>
  );
}

/**
 * Settings Panel Content
 */
function SettingsPanelContent() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-ocean-900">Settings</h3>
      <p className="text-ocean-600">Application configuration and preferences.</p>
    </div>
  );
}

/**
 * OceanWatch Detail Panel Component
 *
 * Floating intelligence panel with light maritime aesthetic.
 */
export function DetailPanel() {
  const { activePanel, closePanel } = useUIStore();

  if (!activePanel) {
    return null;
  }

  return (
    <div className="absolute right-6 top-24 bottom-24 w-96 rounded-2xl bg-surface-transparent backdrop-blur-md border border-border-subtle shadow-floating-lg overflow-hidden z-20">
      {/* Panel Header */}
      <div className="flex items-center justify-between p-6 border-b border-border-subtle">
        <h2 className="text-lg font-bold text-ocean-900">
          {activePanel === 'incidents' && 'Incident Intelligence'}
          {activePanel === 'vessels' && 'Vessel Search'}
          {activePanel === 'settings' && 'Settings'}
        </h2>
        <button
          type="button"
          onClick={closePanel}
          className="p-2 rounded-lg text-ocean-600 hover:text-ocean-900 hover:bg-ocean-50 transition-smooth"
          aria-label="Close panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activePanel === 'incidents' && <IncidentPanelContent />}
        {activePanel === 'vessels' && <VesselPanelContent />}
        {activePanel === 'settings' && <SettingsPanelContent />}
      </div>
    </div>
  );
}