"""Scoring functions for vessel-oil matching."""

import numpy as np
import pandas as pd


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points on earth (in km).
    """
    from math import radians, sin, cos, sqrt, atan2

    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))

    return 6371 * c  # Earth radius in km


def calculate_distance_matrix(particle_lats, particle_lons, ship_lats, ship_lons):
    """
    Calculate distance matrix between particles and ship positions.
    """
    n_particles = len(particle_lats)
    n_positions = len(ship_lats)

    distances = np.zeros((n_particles, n_positions))

    for i in range(n_particles):
        for j in range(n_positions):
            distances[i, j] = haversine_distance(
                particle_lats[i], particle_lons[i],
                ship_lats[j], ship_lons[j]
            )

    return distances


def calculate_distance_score(distances, threshold_km=5.0):
    """
    Score based on minimum distance between particles and ship.
    """
    min_distances = distances.min(axis=1)
    scores = np.exp(-min_distances / threshold_km)

    return {
        "mean_score": float(scores.mean()),
        "median_score": float(np.median(scores)),
        "min_distance_km": float(min_distances.min()),
        "mean_distance_km": float(min_distances.mean()),
        "particles_within_threshold": int((min_distances <= threshold_km).sum()),
        "particle_coverage": float((min_distances <= threshold_km).sum() / len(min_distances)),
    }


def _make_tz_naive(ts):
    """Convert any timestamp to timezone-naive."""
    if hasattr(ts, 'tz_convert'):
        if ts.tz is not None:
            return ts.tz_convert('UTC').tz_localize(None)
    return ts


def calculate_temporal_score(oil_times, ship_times, tolerance_hours=2.0):
    """
    Score based on temporal overlap between oil trajectory and ship track.
    """
    oil_times = pd.to_datetime(oil_times)
    ship_times = pd.to_datetime(ship_times)

    # Get start and end times
    oil_start = oil_times.min()
    oil_end = oil_times.max()
    ship_start = ship_times.min()
    ship_end = ship_times.max()

    # Convert to timezone-naive
    oil_start = _make_tz_naive(oil_start)
    oil_end = _make_tz_naive(oil_end)
    ship_start = _make_tz_naive(ship_start)
    ship_end = _make_tz_naive(ship_end)

    # Calculate overlap
    overlap_start = max(oil_start, ship_start)
    overlap_end = min(oil_end, ship_end)

    if overlap_start >= overlap_end:
        return {"temporal_score": 0.0, "overlap_hours": 0.0}

    overlap_hours = (overlap_end - overlap_start).total_seconds() / 3600
    oil_duration = (oil_end - oil_start).total_seconds() / 3600

    temporal_score = overlap_hours / oil_duration if oil_duration > 0 else 0.0

    return {
        "temporal_score": float(min(temporal_score, 1.0)),
        "overlap_hours": float(overlap_hours),
        "oil_duration_hours": float(oil_duration),
    }


def calculate_course_score(oil_directions, ship_cogs):
    """
    Score based on course consistency.
    """
    if len(oil_directions) == 0 or len(ship_cogs) == 0:
        return {"course_score": 0.5}

    def angle_diff(a1, a2):
        diff = abs(a1 - a2)
        return min(diff, 360 - diff)

    avg_oil_direction = np.mean(oil_directions)
    avg_ship_cog = np.mean(ship_cogs)

    diff = angle_diff(avg_oil_direction, avg_ship_cog)
    course_score = 1.0 - (diff / 180.0)

    return {
        "course_score": float(course_score),
        "angle_difference_deg": float(diff),
    }