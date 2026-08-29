import {
  Layers,
  Ship,
  AlertTriangle,
  Wind,
  Waves,
  Route,
  Anchor,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useUIStore, useMapStore } from '@/store';
import type { MapLayerId } from '@/types/map';
import { cn } from '@/lib/utils';

/**
 * Layer configuration with icons and labels
 */
const LAYERS: Array<{ id: MapLayerId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'vessels', label: 'Vessels', icon: Ship },
  { id: 'vesselTrails', label: 'Vessel Trails', icon: Route },
  { id: 'oilSpills', label: 'Oil Spills', icon: AlertTriangle },
  { id: 'oceanCurrents', label: 'Ocean Currents', icon: Waves },
  { id: 'windFlow', label: 'Wind Flow', icon: Wind },
  { id: 'eezBoundaries', label: 'EEZ Boundaries', icon: Anchor },
  { id: 'shippingLanes', label: 'Shipping Lanes', icon: Route },
  { id: 'investigationPaths', label: 'Investigation Paths', icon: Layers },
];

/**
 * OceanWatch Sidebar Component
 *
 * Left sidebar with layer controls and quick actions.
 * Follows the glass-panel aesthetic from PRD §31.
 */
export function Sidebar() {
  const { sidebarOpen, toggleSidebar, setActivePanel } = useUIStore();
  const { layerVisibility, toggleLayer } = useMapStore();

  return (
    <aside
      className={cn(
        'w-64 bg-ocean-800/95 backdrop-blur-sm border-r border-ocean-700/50 flex flex-col transition-all duration-300 ease-in-out',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full absolute inset-y-14 left-0 z-10'
      )}
    >
      {/* Collapse Toggle */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="absolute -right-3 top-4 w-6 h-6 rounded-full bg-ocean-700 border border-ocean-600 flex items-center justify-center text-ocean-400 hover:text-ocean-200 hover:bg-ocean-600 transition-smooth z-20"
        aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {/* Layer Controls */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 border-b border-ocean-700/50">
          <h2 className="text-xs font-semibold text-ocean-400 uppercase tracking-wider mb-3">
            Map Layers
          </h2>
          <div className="space-y-1">
            {LAYERS.map((layer) => {
              const Icon = layer.icon;
              const isVisible = layerVisibility[layer.id];
              return (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => toggleLayer(layer.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-smooth',
                    isVisible
                      ? 'bg-ocean-700/60 text-ocean-200 border border-ocean-600/50'
                      : 'text-ocean-500 hover:bg-ocean-700/30 hover:text-ocean-300 border border-transparent'
                  )}
                >
                  <Icon className={cn('w-4 h-4', isVisible && 'text-cyan-accent')} />
                  <span className="flex-1 text-left">{layer.label}</span>
                  {/* Visibility indicator */}
                  <div
                    className={cn(
                      'w-4 h-4 rounded border-2 flex items-center justify-center transition-smooth',
                      isVisible
                        ? 'bg-cyan-accent border-cyan-accent'
                        : 'border-ocean-600'
                    )}
                  >
                    {isVisible && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4">
          <h2 className="text-xs font-semibold text-ocean-400 uppercase tracking-wider mb-3">
            Quick Actions
          </h2>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setActivePanel('incidents')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ocean-400 hover:bg-ocean-700/30 hover:text-ocean-200 transition-smooth"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>View Incidents</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('vessels')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ocean-400 hover:bg-ocean-700/30 hover:text-ocean-200 transition-smooth"
            >
              <Ship className="w-4 h-4" />
              <span>Vessel Search</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('settings')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ocean-400 hover:bg-ocean-700/30 hover:text-ocean-200 transition-smooth"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer: Data Attribution */}
      <div className="p-3 border-t border-ocean-700/50">
        <p className="text-[10px] text-ocean-600 text-center">
          Data sources: AIS, Sentinel-1 SAR
        </p>
      </div>
    </aside>
  );
}
