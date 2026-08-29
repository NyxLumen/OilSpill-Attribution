import { Header, Sidebar, StatusBar, DetailPanel } from '@/components/layout';
import { MapArea } from '@/components/map';

/**
 * OceanWatch Application Shell
 *
 * Main application component providing the complete UI shell for the
 * maritime intelligence dashboard.
 *
 * Layout structure:
 * - Header: Top navigation with branding, status, and controls
 * - Sidebar: Left panel with layer controls and quick actions
 * - MapArea: Main viewport for the interactive map
 * - DetailPanel: Right panel for detailed information
 * - StatusBar: Bottom bar with viewport and data information
 *
 * See AGENTS.md §1: Read PRD.md and PROGRESS.md before making changes.
 */
function App() {
  return (
    <div className="h-screen w-screen flex flex-col bg-ocean-900 text-ocean-100 overflow-hidden">
      {/* Top Header */}
      <Header />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Center: Map Viewport */}
        <MapArea />

        {/* Right Detail Panel */}
        <DetailPanel />
      </div>

      {/* Bottom Status Bar */}
      <StatusBar />
    </div>
  );
}

export default App;
