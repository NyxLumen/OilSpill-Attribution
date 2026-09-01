import { useMemo, useCallback, useEffect, useRef } from 'react';
import type { Layer } from '@deck.gl/core';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMapStore, useIncidentStore, useUIStore, useScenarioStore } from '@/store';
import { scenarioController, environmentAt, driftVectorAt } from '@/simulation';
import { useDataProvider } from '@/app/providers';
import type { VesselTrail } from '@/types/vessel';
import { createVesselLayers } from './vesselLayer';
import { createSpillLayers } from './spillLayer';
import { createTrailLayers } from './trailLayer';
import { createEnvironmentLayers } from './environmentLayer';

/**
 * Poll interval (ms) for live simulation updates on the map when playing.
 */
const SIM_POLL_VESSELS_MS = 150;
const SIM_POLL_TRAILS_MS = 300;

/**
 * Hook to construct and manage the active deck.gl layers.
 *
 * Centralizes layer construction according to layer visibility settings,
 * loaded dataset state, selection state, and authoritative scenario clock.
 *
 * Layer Composition Order (lowest to highest):
 *   1. Environmental Fields (Ocean Currents & Wind Flow)
 *   2. Oil Spills (Polygon body, boundary, backtrack, origin, forecast)
 *   3. Vessel Trails (Subdued background, highlighted candidates, active selected)
 *   4. Vessels (2D Directional symbols + candidate indicators + selection halo)
 *   5. Net Surface Drift Vector
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
  const phase = useScenarioStore((state) => state.phase);
  const simTimeMs = useScenarioStore((state) => state.simTimeMs);

  const isCorrelating = phase === 'correlating' || phase === 'attribution-ready';

  // 1. Vessels Query
  const { data: vessels = [] } = useQuery({
    queryKey: ['vessels'],
    queryFn: () => dataProvider.getVessels(),
    staleTime: 0,
    refetchInterval: isPlaying ? SIM_POLL_VESSELS_MS : false,
  });

  // 2. Incidents Query
  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => dataProvider.getIncidents(),
    staleTime: 0,
    refetchInterval: isPlaying ? SIM_POLL_TRAILS_MS : false,
  });

  const activeIncident = incidents[0] || null;

  // 3. Candidates Query (available during correlation & attribution)
  const { data: candidates = [] } = useQuery({
    queryKey: ['candidates', activeIncident?.id],
    queryFn: () => (activeIncident ? dataProvider.getCandidates(activeIncident.id) : []),
    enabled: Boolean(activeIncident && isCorrelating),
    staleTime: 0,
    refetchInterval: isPlaying && isCorrelating ? SIM_POLL_TRAILS_MS : false,
  });

  const candidateVesselIds = useMemo(() => candidates.map((c) => c.vesselId), [candidates]);
  const vesselIds = useMemo(() => vessels.map((v) => v.id), [vessels]);

  // 4. Selective Trail Targets
  // Fetch all trails if layer is visible, or candidate trails during correlation, or selected vessel
  const trailTargetIds = useMemo(() => {
    if (layerVisibility.vesselTrails) return vesselIds;
    const targets = new Set<string>();
    if (selectedVesselId) targets.add(selectedVesselId);
    if (isCorrelating) {
      for (const id of candidateVesselIds) targets.add(id);
    }
    return Array.from(targets);
  }, [layerVisibility.vesselTrails, selectedVesselId, isCorrelating, candidateVesselIds, vesselIds]);

  const { data: trails = [] } = useQuery({
    queryKey: ['vessel-trails', trailTargetIds],
    queryFn: async () => {
      if (trailTargetIds.length === 0) return [];
      const results = await Promise.all(
        trailTargetIds.map((id) => dataProvider.getVesselTrail(id))
      );
      return results.filter((t): t is VesselTrail => t !== null);
    },
    enabled: trailTargetIds.length > 0,
    staleTime: 0,
    refetchInterval: isPlaying && trailTargetIds.length > 0 ? SIM_POLL_TRAILS_MS : false,
    placeholderData: keepPreviousData,
  });

  // Synchronize immediate re-fetches when seeking, resetting, or pausing
  const prevSimTimeRef = useRef<number>(scenarioController.getSimTimeMs());
  useEffect(() => {
    const unsub = scenarioController.subscribe((snap) => {
      const timeJump = Math.abs(snap.simTimeMs - prevSimTimeRef.current) > 2000;
      prevSimTimeRef.current = snap.simTimeMs;

      if (!snap.isPlaying || timeJump) {
        queryClient.invalidateQueries({ queryKey: ['vessels'] });
        queryClient.invalidateQueries({ queryKey: ['vessel-trails'] });
        queryClient.invalidateQueries({ queryKey: ['incidents'] });
        queryClient.invalidateQueries({ queryKey: ['candidates'] });
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

  // Environmental state computed deterministically from clock
  const oceanConditions = useMemo(() => environmentAt(simTimeMs), [simTimeMs]);
  const driftVector = useMemo(() => driftVectorAt(simTimeMs), [simTimeMs]);

  // Compose memoized deck.gl layers
  const layers = useMemo<Layer[]>(() => {
    const activeLayers: Layer[] = [];

    // 1. Environmental Forces Layer (Ocean currents & wind flow)
    const showEnvCurrents = layerVisibility.oceanCurrents || isCorrelating;
    const showEnvWind = layerVisibility.windFlow || isCorrelating;
    if (showEnvCurrents || showEnvWind) {
      activeLayers.push(
        ...createEnvironmentLayers({
          oceanConditions,
          driftVector,
          showCurrents: showEnvCurrents,
          showWind: showEnvWind,
          showDriftVector: isCorrelating && incidents.length > 0,
          driftOrigin: activeIncident?.location,
        })
      );
    }

    // 2. Oil Spills Layer
    if (layerVisibility.oilSpills && incidents.length > 0) {
      activeLayers.push(
        ...createSpillLayers({
          incidents,
          selectedIncidentId,
          isCorrelating,
          onSelectIncident: handleSelectIncident,
        })
      );
    }

    // 3. Vessel Trails Layer
    const showTrails =
      (layerVisibility.vesselTrails || selectedVesselId !== null || (isCorrelating && candidateVesselIds.length > 0)) &&
      trails.length > 0;
    if (showTrails) {
      activeLayers.push(
        ...createTrailLayers({
          trails,
          selectedVesselId,
          candidateVesselIds,
          isCorrelating,
        })
      );
    }

    // 4. 2D Vessels Layer
    if (layerVisibility.vessels && vessels.length > 0) {
      activeLayers.push(
        ...createVesselLayers({
          vessels,
          selectedVesselId,
          candidateVesselIds,
          isCorrelating,
          onSelectVessel: handleSelectVessel,
        })
      );
    }

    return activeLayers;
  }, [
    layerVisibility.oceanCurrents,
    layerVisibility.windFlow,
    layerVisibility.oilSpills,
    layerVisibility.vesselTrails,
    layerVisibility.vessels,
    isCorrelating,
    oceanConditions,
    driftVector,
    incidents,
    activeIncident,
    selectedIncidentId,
    handleSelectIncident,
    selectedVesselId,
    candidateVesselIds,
    trails,
    vessels,
    handleSelectVessel,
  ]);

  return layers;
}
