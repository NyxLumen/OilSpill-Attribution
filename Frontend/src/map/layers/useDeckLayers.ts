import { useMemo, useCallback } from 'react';
import type { Layer } from '@deck.gl/core';
import { useQuery } from '@tanstack/react-query';
import { useMapStore, useIncidentStore, useUIStore } from '@/store';
import { useDataProvider } from '@/app/providers';
import type { VesselTrail } from '@/types/vessel';
import { createVesselLayers } from './vesselLayer';
import { createSpillLayers } from './spillLayer';
import { createTrailLayers } from './trailLayer';

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
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => dataProvider.getIncidents(),
    staleTime: 60 * 1000,
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
