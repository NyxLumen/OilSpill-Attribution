import { Activity } from 'lucide-react';
import { useUIStore } from './store';

/**
 * OceanWatch Application Shell
 *
 * This is the main application component that provides the basic
 * layout structure for the maritime intelligence dashboard.
 *
 * See AGENTS.md §1: Read PRD.md and PROGRESS.md before making changes.
 */
function App() {
  const { activePanel, setActivePanel, sidebarOpen } = useUIStore();

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-900 text-slate-100">
      {/* Header / Top Bar */}
      <header className="h-14 flex items-center justify-between px-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-white">OceanWatch</h1>
          </div>
          <span className="text-xs text-slate-400 ml-2">Maritime Intelligence</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/50">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-300">Live</span>
          </div>

          {/* Data Mode Indicator */}
          <div className="text-xs text-slate-500">
            {import.meta.env.VITE_USE_MOCK_DATA === 'true' ? 'Mock Mode' : 'API Mode'}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={`w-64 bg-slate-800 border-r border-slate-700 flex flex-col transition-all duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Layer Panel */}
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-sm font-medium text-slate-300 mb-3">Layers</h2>
            <div className="space-y-2">
              {['Vessels', 'Oil Spills', 'Trails', 'Currents'].map((layer) => (
                <button
                  key={layer}
                  type="button"
                  className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
                >
                  {layer}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4">
            <h2 className="text-sm font-medium text-slate-300 mb-3">Actions</h2>
            <div className="space-y-2">
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
                onClick={() => setActivePanel('incidents')}
              >
                View Incidents
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
              >
                Export Data
              </button>
            </div>
          </div>
        </aside>

        {/* Map Area */}
        <main className="flex-1 relative">
          {/* Map Placeholder */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center">
                <div className="text-slate-600">
                  <svg
                    className="w-16 h-16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-medium text-slate-400 mb-2">
                MapLibre + deck.gl
              </h2>
              <p className="text-sm text-slate-500 max-w-md">
                Interactive maritime map with vessel tracking, oil spill visualization,
                and investigation tools will be rendered here.
              </p>
            </div>
          </div>

          {/* Map Controls Placeholder */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <div className="w-10 h-10 rounded-lg bg-slate-800/90 border border-slate-700 flex items-center justify-center text-slate-400">
              +
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-800/90 border border-slate-700 flex items-center justify-center text-slate-400">
              -
            </div>
          </div>
        </main>

        {/* Right Panel */}
        {activePanel && (
          <aside className="w-80 bg-slate-800 border-l border-slate-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-slate-300 capitalize">
                {activePanel}
              </h2>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="text-slate-500 hover:text-slate-300"
              >
                ×
              </button>
            </div>
            <div className="text-sm text-slate-500">
              {activePanel === 'incidents' && 'Incident list will appear here'}
              {activePanel === 'vessels' && 'Vessel details will appear here'}
              {activePanel === 'layers' && 'Layer controls will appear here'}
              {activePanel === 'settings' && 'Settings will appear here'}
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Status Bar */}
      <footer className="h-8 flex items-center justify-between px-4 bg-slate-800 border-t border-slate-700 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span>Viewport: 36.0°N, -5.0°W | Zoom: 6</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Vessels: --</span>
          <span>Incidents: --</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
