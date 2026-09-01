import { useMemo, useCallback, useEffect, useRef } from 'react';
import type { Layer } from '@deck.gl/core';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMapStore, useIncidentStore, useUIStore, useScenarioStore } from '@/store';
import { scenarioController } from '@/simulation';
import { useDataProvider } from '@/app/providers';
import type { VesselTrail } from '@/types/vessel';
import { createVesselLayers } from './vesselLayer';
import { createSpillLayers } from './spillLayer';
import { createTrailLayers } from './trailLayer';

/**
 * Poll interval (ms) for live simulation updates on the map when playing.
 *
 * 150 ms (≈6.7 Hz) combined with deck.gl's 150 ms GPU linear position/heading
 * transition produces buttery-smooth continuous vessel movement without
 * creating per-vessel timers or re-rendering React components.
 */
const SIM_POLL_VESSELS_MS = 150;
const SIM_POLL_TRAILS_MS = 300;

/**
 * Hook to construct and manage the active deck.gl layers.
 *
 * Centralizes layer construction according to layer visibility settings,
 * loaded dataset state, selection state, and authoritative scenario clock.
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
  const queryClient = useQueryClient();

  // Stores
  const layerVisibility = useMapStore((state) => state.layerVisibility);
  const selectedVesselId = useIncidentStore((state) => state.selectedVesselId);
  const selectedIncidentId = useIncidentStore((state) => state.selectedIncidentId);
  const selectVessel = useIncidentStore((state) => state.selectVessel);
  const selectIncident = useIncidentStore((state) => state.selectIncident);
  const setActivePanel = useUIStore((state) => state.setActivePanel);
  const isPlaying = useScenarioStore((state) => state.isPlaying);

  // Queries - Driven authoritatively by scenarioController
  const { data: vessels = [] } = useQuery({
    queryKey: ['vessels'],
    queryFn: () => dataProvider.getVessels(),
    staleTime: 0,
    refetchInterval: isPlaying ? SIM_POLL_VESSELS_MS : false,
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => dataProvider.getIncidents(),
    staleTime: 0,
    refetchInterval: isPlaying ? SIM_POLL_TRAILS_MS : false,
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
    staleTime: 0,
    refetchInterval: isPlaying ? SIM_POLL_TRAILS_MS : false,
    placeholderData: keepPreviousData,
  });

  // Synchronize immediate re-fetches when seeking, resetting, or pausing
  const prevSimTimeRef = useRef<number>(scenarioController.getSimTimeMs());
  useEffect(() => {
    const unsub = scenarioController.subscribe((snap) => {
      const timeJump = Math.abs(snap.simTimeMs - prevSimTimeRef.current) > 2000;
      prevSimTimeRef.current = snap.simTimeMs;

      // Invalidate queries immediately on seek/reset or when not actively polling
      if (!snap.isPlaying || timeJump) {
        queryClient.invalidateQueries({ queryKey: ['vessels'] });
        queryClient.invalidateQueries({ queryKey: ['vessel-trails'] });
        queryClient.invalidateQueries({ queryKey: ['incidents'] });
      }
    });
    return unsub;
  }, [queryClient]);

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
