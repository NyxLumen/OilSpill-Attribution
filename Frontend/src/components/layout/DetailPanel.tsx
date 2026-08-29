import { X, Search, Filter, ChevronRight } from 'lucide-react';
import { useUIStore } from '@/store';

/**
 * Panel configuration for different panel types
 */
const PANEL_CONFIG = {
  incidents: {
    title: 'Incidents',
    icon: null,
  },
  vessels: {
    title: 'Vessels',
    icon: null,
  },
  settings: {
    title: 'Settings',
    icon: null,
  },
  layers: {
    title: 'Layer Controls',
    icon: null,
  },
};

/**
 * Incident Panel Content
 */
function IncidentPanelContent() {
  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ocean-500" />
        <input
          type="text"
          placeholder="Search incidents..."
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-ocean-700/50 border border-ocean-600/50 text-sm text-ocean-200 placeholder-ocean-500 focus:outline-none focus:border-cyan-accent/50 focus:ring-1 focus:ring-cyan-accent/20"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-ocean-400 hover:text-ocean-200 hover:bg-ocean-700/50 transition-smooth"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filter</span>
        </button>
        <div className="flex gap-1">
          <span className="px-2 py-1 rounded text-xs bg-red-alert/20 text-red-alert border border-red-alert/30">
            Critical
          </span>
          <span className="px-2 py-1 rounded text-xs bg-amber-warning/20 text-amber-warning border border-amber-warning/30">
            Active
          </span>
        </div>
      </div>

      {/* Incident List Placeholder */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <button
              key={i}
              type="button"
              className="w-full p-3 rounded-lg bg-ocean-700/30 border border-ocean-600/30 text-left hover:bg-ocean-700/50 hover:border-ocean-600/50 transition-smooth group"
            >
              <div className="flex items-start justify-between mb-1.5">
                <span className="text-sm font-medium text-ocean-200">
                  Incident #{i}
                </span>
                <ChevronRight className="w-4 h-4 text-ocean-500 group-hover:text-ocean-300 transition-smooth" />
              </div>
              <div className="flex items-center gap-2 text-xs text-ocean-500">
                <span className="px-1.5 py-0.5 rounded bg-amber-warning/20 text-amber-warning">
                  Investigating
                </span>
                <span>•</span>
                <span>36.5°N, -5.2°W</span>
              </div>
            </button>
          ))}
        </div>

        {/* Empty State */}
        <div className="mt-4 p-4 rounded-lg border border-dashed border-ocean-700 text-center">
          <p className="text-sm text-ocean-500">
            No incidents in current viewport
          </p>
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
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ocean-500" />
        <input
          type="text"
          placeholder="Search vessels by name or IMO..."
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-ocean-700/50 border border-ocean-600/50 text-sm text-ocean-200 placeholder-ocean-500 focus:outline-none focus:border-cyan-accent/50 focus:ring-1 focus:ring-cyan-accent/20"
        />
      </div>

      {/* Vessel List Placeholder */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <button
              key={i}
              type="button"
              className="w-full p-3 rounded-lg bg-ocean-700/30 border border-ocean-600/30 text-left hover:bg-ocean-700/50 hover:border-ocean-600/50 transition-smooth group"
            >
              <div className="flex items-start justify-between mb-1.5">
                <span className="text-sm font-medium text-ocean-200">
                  Vessel {i}
                </span>
                <ChevronRight className="w-4 h-4 text-ocean-500 group-hover:text-ocean-300 transition-smooth" />
              </div>
              <div className="flex items-center gap-2 text-xs text-ocean-500">
                <span className="px-1.5 py-0.5 rounded bg-ocean-600/50 text-ocean-300">
                  Tanker
                </span>
                <span>•</span>
                <span>IMO 123456{i}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Empty State */}
        <div className="mt-4 p-4 rounded-lg border border-dashed border-ocean-700 text-center">
          <p className="text-sm text-ocean-500">
            No vessels in current viewport
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Settings Panel Content
 */
function SettingsPanelContent() {
  return (
    <div className="space-y-6">
      {/* Display Settings */}
      <div>
        <h3 className="text-xs font-semibold text-ocean-400 uppercase tracking-wider mb-3">
          Display
        </h3>
        <div className="space-y-2">
          {['Dark Mode', 'Show Grid', 'Animate Vessels'].map((setting) => (
            <div
              key={setting}
              className="flex items-center justify-between p-3 rounded-lg bg-ocean-700/30 border border-ocean-600/30"
            >
              <span className="text-sm text-ocean-300">{setting}</span>
              <button
                type="button"
                className="w-10 h-5 rounded-full bg-cyan-accent/20 border border-cyan-accent/30 relative transition-smooth"
              >
                <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-cyan-accent transition-smooth" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Data Settings */}
      <div>
        <h3 className="text-xs font-semibold text-ocean-400 uppercase tracking-wider mb-3">
          Data
        </h3>
        <div className="space-y-2">
          <div className="p-3 rounded-lg bg-ocean-700/30 border border-ocean-600/30">
            <span className="text-sm text-ocean-300">API Endpoint</span>
            <input
              type="text"
              defaultValue="http://localhost:8000"
              className="w-full mt-2 px-3 py-1.5 rounded bg-ocean-800 border border-ocean-600/50 text-sm text-ocean-300 font-mono"
              readOnly
            />
          </div>
        </div>
      </div>

      {/* About */}
      <div className="pt-4 border-t border-ocean-700/50">
        <p className="text-xs text-ocean-500 text-center">
          OceanWatch v0.1.0<br />
          Smart India Hackathon 2026
        </p>
      </div>
    </div>
  );
}

/**
 * OceanWatch Detail Panel Component
 *
 * Right sidebar for detailed information about selected items.
 * Follows the glass-panel aesthetic from PRD §31.
 */
export function DetailPanel() {
  const { activePanel, closePanel } = useUIStore();

  if (!activePanel) {
    return null;
  }

  const panelConfig = PANEL_CONFIG[activePanel];

  return (
    <aside className="w-80 bg-ocean-800/95 backdrop-blur-sm border-l border-ocean-700/50 flex flex-col overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4 border-b border-ocean-700/50">
        <h2 className="text-sm font-semibold text-ocean-200">
          {panelConfig.title}
        </h2>
        <button
          type="button"
          onClick={closePanel}
          className="p-1.5 rounded-lg text-ocean-500 hover:text-ocean-300 hover:bg-ocean-700/50 transition-smooth"
          aria-label="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activePanel === 'incidents' && <IncidentPanelContent />}
        {activePanel === 'vessels' && <VesselPanelContent />}
        {activePanel === 'settings' && <SettingsPanelContent />}
      </div>
    </aside>
  );
}
