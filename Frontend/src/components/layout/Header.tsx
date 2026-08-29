import { Activity, Menu, Bell, Settings, Radio } from 'lucide-react';
import { useUIStore } from '@/store';

/**
 * OceanWatch Header Component
 *
 * Top navigation bar with logo, status indicators, and controls.
 * Follows the glass-panel aesthetic from PRD §31.
 */
export function Header() {
  const { toggleSidebar, sidebarOpen } = useUIStore();

  return (
    <header className="h-14 flex items-center justify-between px-4 bg-ocean-800/95 backdrop-blur-sm border-b border-ocean-700/50">
      {/* Left Section: Logo & Branding */}
      <div className="flex items-center gap-3">
        {/* Sidebar Toggle */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-ocean-400 hover:text-ocean-200 hover:bg-ocean-700/50 transition-smooth"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-accent to-blue-accent flex items-center justify-center shadow-lg shadow-cyan-accent/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-semibold text-white tracking-tight">OceanWatch</h1>
            <span className="text-[10px] text-ocean-500 -mt-0.5">Maritime Intelligence</span>
          </div>
        </div>
      </div>

      {/* Center Section: Status Bar */}
      <div className="flex items-center gap-6">
        {/* Live Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-ocean-700/60 border border-ocean-600/50">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-green-live" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-live animate-ping opacity-75" />
          </div>
          <span className="text-xs font-medium text-ocean-300">LIVE</span>
        </div>

        {/* Data Source */}
        <div className="flex items-center gap-2 text-xs text-ocean-400">
          <Radio className="w-3.5 h-3.5" />
          <span>
            {import.meta.env.VITE_USE_MOCK_DATA === 'true' ? 'Mock Data' : 'API Connected'}
          </span>
        </div>
      </div>

      {/* Right Section: Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button
          type="button"
          className="relative p-2 rounded-lg text-ocean-400 hover:text-ocean-200 hover:bg-ocean-700/50 transition-smooth"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {/* Notification badge */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-alert" />
        </button>

        {/* Settings */}
        <button
          type="button"
          className="p-2 rounded-lg text-ocean-400 hover:text-ocean-200 hover:bg-ocean-700/50 transition-smooth"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
