"""Reconstruct ship trajectories from AIS points."""

import numpy as np
import pandas as pd


def reconstruct_trajectories(df):
    """
    Group AIS data into individual ship trajectories.
    """
    trajectories = {}

    for mmsi, group in df.groupby("mmsi"):
        group = group.sort_values("timestamp").reset_index(drop=True)
        trajectories[mmsi] = group

    print(f"Reconstructed {len(trajectories)} ship trajectories")

    return trajectories


def get_trajectory_at_time(trajectories, target_time):
    """Get ship positions at a specific time."""
    records = []

    for mmsi, traj in trajectories.items():
        time_diffs = abs(traj["timestamp"] - target_time)
        min_idx = time_diffs.idxmin()
        min_diff = time_diffs[min_idx]

        if min_diff.total_seconds() <= 1800:
            records.append({
                "mmsi": mmsi,
                "latitude": traj.loc[min_idx, "latitude"],
                "longitude": traj.loc[min_idx, "longitude"],
            })

    return pd.DataFrame(records)