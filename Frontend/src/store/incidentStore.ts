import { create } from 'zustand';

/**
 * Investigation mode states
 */
export type InvestigationMode = 'inactive' | 'active' | 'reviewing';

/**
 * Incident store state interface
 */
interface IncidentState {
  selectedVesselId: string | null;
  selectedIncidentId: string | null;
  investigationMode: InvestigationMode;
  timelinePosition: string | null;

  // Selection actions
  selectVessel: (id: string | null) => void;
  selectIncident: (id: string | null) => void;
  clearSelection: () => void;

  // Investigation actions
  setInvestigationMode: (mode: InvestigationMode) => void;
  startInvestigation: (incidentId: string) => void;
  endInvestigation: () => void;

  // Timeline actions
  setTimelinePosition: (timestamp: string | null) => void;
  resetTimeline: () => void;
}

/**
 * Incident store for selection and investigation state.
 *
 * Manages which vessel and incident are currently selected,
 * investigation mode, and timeline position. These are
 * cross-cutting concerns that multiple features need to access.
 *
 * See AGENTS.md §6: Use Zustand for selected vessel, incident, and investigation mode.
 */
export const useIncidentStore = create<IncidentState>((set) => ({
  selectedVesselId: null,
  selectedIncidentId: null,
  investigationMode: 'inactive',
  timelinePosition: null,

  selectVessel: (id) =>
    set({ selectedVesselId: id }),

  selectIncident: (id) =>
    set((state) => ({
      selectedIncidentId: id,
      // Clear vessel selection when switching incidents
      selectedVesselId: id !== state.selectedIncidentId ? null : state.selectedVesselId,
    })),

  clearSelection: () =>
    set({
      selectedVesselId: null,
      selectedIncidentId: null,
    }),

  setInvestigationMode: (mode) =>
    set({ investigationMode: mode }),

  startInvestigation: (incidentId) =>
    set({
      selectedIncidentId: incidentId,
      investigationMode: 'active',
      timelinePosition: null,
    }),

  endInvestigation: () =>
    set({
      investigationMode: 'inactive',
      timelinePosition: null,
    }),

  setTimelinePosition: (timestamp) =>
    set({ timelinePosition: timestamp }),

  resetTimeline: () =>
    set({ timelinePosition: null }),
}));
