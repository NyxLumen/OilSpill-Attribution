"""Vessel Matching Module - Connects oil drift to ship trajectories."""

from .matcher import VesselMatcher
from .scoring import calculate_distance_score, calculate_temporal_score

__all__ = [
    "VesselMatcher",
    "calculate_distance_score",
    "calculate_temporal_score",
]