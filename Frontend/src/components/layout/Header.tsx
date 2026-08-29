import { Activity, Search, Bell, Clock } from 'lucide-react';
import { useUIStore } from '@/store';

/**
 * OceanWatch Header Component
 *
 * Floating header with search bar, branding, and status.
 * Light maritime aesthetic with translucent white background.
 */
export function Header() {
  const { setActivePanel } = useUIStore();

  // Get current time for timestamp display
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <header className="h-20 flex items-center justify-between px-6 bg-surface-transparent backdrop-blur-md border-b border-border-subtle shadow-floating">
      {/* Left Section: Logo & Branding */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-accent to-cyan-accent flex items-center justify-center shadow-lg shadow-blue-accent/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-ocean-900 tracking-tight">OceanWatch</h1>
            <span className="text-xs text-ocean-600 -mt-0.5 uppercase tracking-wider">Marine Intelligence</span>
          </div>
        </div>
      </div>

      {/* Center Section: Search Bar */}
      <div className="flex-1 max-w-2xl mx-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-ocean-500" />
          </div>
          <input
            type="text"
            placeholder="Search location, vessel, or incident..."
            className="w-full h-12 px-4 pl-12 py-2 rounded-full bg-surface-white border border-border-subtle focus:outline-none focus:ring-2 focus:ring-blue-accent focus:border-transparent text-sm text-ocean-800 placeholder-ocean-500 transition-smooth"
          />
        </div>
      </div>

      {/* Right Section: Timestamp & Status */}
      <div className="flex items-center gap-6">
        {/* Current Time */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-ocean-500" />
          <span className="text-sm font-medium text-ocean-800">{getCurrentTime()}</span>
        </div>

        {/* Live Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-live/10 border border-green-live/20">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-green-live" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-live animate-ping opacity-75" />
          </div>
          <span className="text-xs font-medium text-green-live uppercase">Live</span>
        </div>

        {/* Notifications */}
        <button
          type="button"
          onClick={() => setActivePanel('incidents')}
          className="relative p-2 rounded-lg text-ocean-600 hover:text-ocean-900 hover:bg-ocean-100 transition-smooth"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {/* Notification badge */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-alert" />
        </button>
      </div>
    </header>
  );
}
