import {
  Map as MapIcon,
  AlertTriangle,
  Ship,
  BarChart2,
  Cloud,
  FileText,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useUIStore, useMapStore } from '@/store';
import type { MapLayerId } from '@/types/map';
import { cn } from '@/lib/utils';

/**
 * Navigation items for floating panel
 */
const NAV_ITEMS = [
  { id: 'map', label: 'Map', icon: MapIcon },
  { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
  { id: 'vessels', label: 'Vessels', icon: Ship },
  { id: 'analysis', label: 'Analysis', icon: BarChart2 },
  { id: 'environment', label: 'Environment', icon: Cloud },
  { id: 'reports', label: 'Reports', icon: FileText },
];

/**
 * Layer configuration for layers panel
 */
const LAYERS: Array<{ id: MapLayerId; label: string }> = [
  { id: 'vessels', label: 'Vessels' },
  { id: 'vesselTrails', label: 'Vessel Trails' },
  { id: 'oilSpills', label: 'Oil Spills' },
  { id: 'oceanCurrents', label: 'Ocean Currents' },
  { id: 'windFlow', label: 'Wind Flow' },
  { id: 'eezBoundaries', label: 'EEZ Boundaries' },
  { id: 'shippingLanes', label: 'Shipping Lanes' },
];

/**
 * OceanWatch Sidebar Component
 *
 * Floating navigation and layers panels with light maritime aesthetic.
 */
export function Sidebar() {
  const { setActivePanel } = useUIStore();
  const { layerVisibility, toggleLayer } = useMapStore();

  return (
    <div className="absolute left-6 top-24 z-20 flex flex-col gap-4">
      {/* Floating Navigation Panel */}
      <div className="w-64 rounded-2xl bg-surface-transparent backdrop-blur-md border border-border-subtle shadow-floating-lg overflow-hidden">
        <div className="p-4">
          <h2 className="text-sm font-semibold text-ocean-800 uppercase tracking-wider mb-4">
            Navigation
          </h2>
          <div className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActivePanel(item.id as any)}
                  className={cn(
                    'w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-smooth',
                    'text-ocean-700 hover:text-ocean-900 hover:bg-ocean-50',
                    'focus:outline-none focus:ring-2 focus:ring-blue-accent'
                  )}
                >
                  <Icon className="w-5 h-5 text-blue-accent" />
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Layers Panel */}
      <div className="w-64 rounded-2xl bg-surface-transparent backdrop-blur-md border border-border-subtle shadow-floating-lg overflow-hidden">
        <div className="p-4">
          <h2 className="text-sm font-semibold text-ocean-800 uppercase tracking-wider mb-4">
            Layers
          </h2>
          <div className="space-y-2">
            {LAYERS.map((layer) => {
              const isVisible = layerVisibility[layer.id];
              const EyeIcon = isVisible ? Eye : EyeOff;

              return (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => toggleLayer(layer.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-smooth',
                    'text-ocean-700 hover:bg-ocean-50 focus:outline-none focus:ring-2 focus:ring-blue-accent',
                    layer.id === 'oilSpills' && 'bg-blue-accent/10 border border-blue-accent/20'
                  )}
                >
                  <span className={cn(
                    'font-medium',
                    layer.id === 'oilSpills' && 'text-blue-accent'
                  )}>
                    {layer.label}
                  </span>
                  <EyeIcon className={cn(
                    'w-5 h-5',
                    isVisible ? 'text-blue-accent' : 'text-ocean-400'
                  )} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
