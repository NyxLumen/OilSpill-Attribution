import { useMemo, useCallback } from 'react';
import type { Layer } from '@deck.gl/core';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMapStore, useIncidentStore, useUIStore } from '@/store';
import { useDataProvider } from '@/app/providers';
import type { VesselTrail } from '@/types/vessel';
import { createVesselLayers } from './vesselLayer';
import { createSpillLayers } from './spillLayer';
import { createTrailLayers } from './trailLayer';

/**
 * Poll interval (ms) for live simulation updates on the map.
 *
 * The mock simulation advances a single centralized clock; these queries
 * re-snapshot the fleet at this rate so deck.gl redraws moving vessels and
 * their trails without per-vessel timers or per-vessel React updates.
 */
const SIM_POLL_MS = 300;

/**
 * Hook to construct and manage the active deck.gl layers.
 *
 * Centralizes layer construction according to layer visibility settings,
 * loaded dataset state, and selection state.
 *
 * Layer Composition Order:
 *   1. Oil Spills (Polygon body, boundary, origin marker)
 *   2. Vessel Trails (Historical paths)
 *   3. Vessels (2D Directional symbols + selection halo)
 *
 * This ensures vessel picking is always prioritized over background geometry.
 */
export function useDeckLayers(): Layer[] {
  const dataProvider = useDataProvider();

  // Stores
  const layerVisibility = useMapStore((state) => state.layerVisibility);
  const selectedVesselId = useIncidentStore((state) => state.selectedVesselId);
  const selectedIncidentId = useIncidentStore((state) => state.selectedIncidentId);
  const selectVessel = useIncidentStore((state) => state.selectVessel);
  const selectIncident = useIncidentStore((state) => state.selectIncident);
  const setActivePanel = useUIStore((state) => state.setActivePanel);

  // Queries
  const { data: vessels = [] } = useQuery({
    queryKey: ['vessels'],
    queryFn: () => dataProvider.getVessels(),
    staleTime: 60 * 1000,
    refetchInterval: SIM_POLL_MS,
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => dataProvider.getIncidents(),
    staleTime: 60 * 1000,
    // The incident is scenario-derived: area growth and drift progress with
    // the simulated clock, so re-snapshot at the same rate as the fleet. The
    // geometry is cached per simulated minute, so this does not regenerate
    // the polygon on every poll.
    refetchInterval: SIM_POLL_MS,
  });

  const vesselIds = useMemo(() => vessels.map((v) => v.id), [vessels]);

  const { data: trails = [] } = useQuery({
    queryKey: ['vessel-trails', vesselIds],
    queryFn: async () => {
      if (vesselIds.length === 0) return [];
      const results = await Promise.all(
        vesselIds.map((id) => dataProvider.getVesselTrail(id))
      );
      return results.filter((t): t is VesselTrail => t !== null);
    },
    enabled: vesselIds.length > 0,
    staleTime: 60 * 1000,
    refetchInterval: SIM_POLL_MS,
    // Keep the previous trails rendered while the next poll is in flight so
    // the trail layer never flickers out between updates.
    placeholderData: keepPreviousData,
  });

  // Interaction Handlers
  const handleSelectVessel = useCallback(
    (vesselId: string) => {
      selectVessel(vesselId);
      setActivePanel('vessels');
    },
    [selectVessel, setActivePanel]
  );

  const handleSelectIncident = useCallback(
    (incidentId: string) => {
      selectIncident(incidentId);
      setActivePanel('incidents');
    },
    [selectIncident, setActivePanel]
  );

  // Compose memoized deck.gl layers
  const layers = useMemo<Layer[]>(() => {
    const activeLayers: Layer[] = [];

    // 1. Oil Spills Layer
    if (layerVisibility.oilSpills && incidents.length > 0) {
      activeLayers.push(
        ...createSpillLayers({
          incidents,
          selectedIncidentId,
          onSelectIncident: handleSelectIncident,
        })
      );
    }

    // 2. Vessel Trails Layer
    if (layerVisibility.vesselTrails && trails.length > 0) {
      activeLayers.push(
        ...createTrailLayers({
          trails,
          selectedVesselId,
        })
      );
    }

    // 3. 2D Vessels Layer (Rendered above spills for reliable picking)
    if (layerVisibility.vessels && vessels.length > 0) {
      activeLayers.push(
        ...createVesselLayers({
          vessels,
          selectedVesselId,
          onSelectVessel: handleSelectVessel,
        })
      );
    }

    return activeLayers;
  }, [
    layerVisibility.oilSpills,
    layerVisibility.vesselTrails,
    layerVisibility.vessels,
    incidents,
    selectedIncidentId,
    handleSelectIncident,
    trails,
    selectedVesselId,
    vessels,
    handleSelectVessel,
  ]);

  return layers;
}
