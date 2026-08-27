"""Main vessel matching algorithm."""

import numpy as np
import pandas as pd
from datetime import datetime
from .scoring import (
    calculate_distance_matrix,
    calculate_distance_score,
    calculate_temporal_score,
    calculate_course_score,
)


class VesselMatcher:
    """
    Match backtracked oil particles to AIS ship trajectories.
    """

    def __init__(self, weight_distance=0.5, weight_temporal=0.3, weight_course=0.2):
        """
        Initialize matcher with scoring weights.
        """
        self.weight_distance = weight_distance
        self.weight_temporal = weight_temporal
        self.weight_course = weight_course

        assert abs(weight_distance + weight_temporal + weight_course - 1.0) < 0.01, \
            "Weights must sum to 1.0"

    def match(self, oil_trajectory, ship_trajectories, detection_time, backtrack_hours):
        """
        Match oil trajectory to all ships and return ranked candidates.
        """
        candidates = []

        # Extract oil particle data
        oil_times = oil_trajectory['time']
        oil_lats = oil_trajectory['lat']
        oil_lons = oil_trajectory['lon']
        n_timesteps, n_particles = oil_lats.shape

        print(f"\n🔍 Matching {n_particles} oil particles to {len(ship_trajectories)} ships...")

        for mmsi, ship_traj in ship_trajectories.items():
            # Get ship positions at oil trajectory times
            ship_positions = self._interpolate_to_times(
                ship_traj, oil_times
            )

            if ship_positions is None or len(ship_positions) == 0:
                continue

            # Calculate scores
            distance_scores = []

            for t_idx in range(n_timesteps):
                # Get oil particle positions at this timestep
                particle_lats = oil_lats[t_idx, :]
                particle_lons = oil_lons[t_idx, :]

                # Get ship position at this timestep
                if t_idx < len(ship_positions):
                    ship_lat = ship_positions['latitude'].iloc[t_idx]
                    ship_lon = ship_positions['longitude'].iloc[t_idx]
                else:
                    continue

                # Calculate distances
                dist_matrix = calculate_distance_matrix(
                    particle_lats, particle_lons,
                    [ship_lat], [ship_lon]
                )

                dist_score = calculate_distance_score(dist_matrix, threshold_km=10.0)
                distance_scores.append(dist_score)

            if not distance_scores:
                continue

            # Aggregate distance scores
            mean_dist = np.mean([s['mean_distance_km'] for s in distance_scores])
            min_dist = np.min([s['min_distance_km'] for s in distance_scores])
            avg_spatial_score = np.mean([s['mean_score'] for s in distance_scores])

            # Temporal score
            temp_score = calculate_temporal_score(
                oil_times,
                ship_traj['timestamp'].values
            )

            # Course score (if COG available)
            if 'cog' in ship_traj.columns:
                course_score = calculate_course_score([], ship_traj['cog'].values)
            else:
                course_score = {'course_score': 0.5}

            # Composite score
            composite_score = (
                self.weight_distance * avg_spatial_score +
                self.weight_temporal * temp_score['temporal_score'] +
                self.weight_course * course_score['course_score']
            )

            # Get vessel type
            vessel_type = ship_traj['vessel_type'].iloc[0] if 'vessel_type' in ship_traj.columns else 'unknown'

            candidates.append({
                'mmsi': mmsi,
                'vessel_type': vessel_type,
                'composite_score': round(composite_score, 4),
                'spatial_score': round(avg_spatial_score, 4),
                'temporal_score': round(temp_score['temporal_score'], 4),
                'course_score': round(course_score['course_score'], 4),
                'mean_distance_km': round(mean_dist, 2),
                'min_distance_km': round(min_dist, 2),
                'n_matches': len(distance_scores),
            })

        # Sort by composite score (descending)
        df = pd.DataFrame(candidates)
        df = df.sort_values('composite_score', ascending=False).reset_index(drop=True)
        df['rank'] = df.index + 1

        print(f"\n✅ Matching complete! Found {len(df)} candidate ships")

        return df

    def _interpolate_to_times(self, ship_traj, target_times):
        """Interpolate ship trajectory to match oil trajectory times."""
        ship_traj = ship_traj.copy()
        ship_traj['timestamp'] = pd.to_datetime(ship_traj['timestamp'])
        target_times = pd.to_datetime(target_times)

        # Set timestamp as index
        ship_traj = ship_traj.set_index('timestamp')

        # Create a combined time index
        ship_index = ship_traj.index
        target_index = pd.Index(target_times)
        all_times = ship_index.union(target_index)

        # Reindex and interpolate
        ship_traj = ship_traj.reindex(all_times)
        ship_traj['latitude'] = ship_traj['latitude'].interpolate(method='time')
        ship_traj['longitude'] = ship_traj['longitude'].interpolate(method='time')

        # Keep only target times
        ship_traj = ship_traj.loc[target_times]

        # Drop rows where interpolation failed
        ship_traj = ship_traj.dropna(subset=['latitude', 'longitude'])

        return ship_traj.reset_index()

    def find_guilty_ship(self, ranked_candidates, threshold_score=0.5):
        """
        Identify the most likely guilty ship from ranked candidates.
        """
        if len(ranked_candidates) == 0:
            return None

        best = ranked_candidates.iloc[0]

        if best['composite_score'] < threshold_score:
            return {
                'mmsi': best['mmsi'],
                'confidence': 'LOW',
                'score': best['composite_score'],
                'reason': f"Score {best['composite_score']:.2f} below threshold {threshold_score}"
            }

        # Check if there's a clear winner
        if len(ranked_candidates) > 1:
            score_gap = best['composite_score'] - ranked_candidates.iloc[1]['composite_score']

            if score_gap > 0.2:
                confidence = 'HIGH'
            elif score_gap > 0.1:
                confidence = 'MEDIUM'
            else:
                confidence = 'LOW'
        else:
            confidence = 'HIGH'

        return {
            'mmsi': best['mmsi'],
            'vessel_type': best['vessel_type'],
            'confidence': confidence,
            'composite_score': best['composite_score'],
            'mean_distance_km': best['mean_distance_km'],
            'min_distance_km': best['min_distance_km'],
        }