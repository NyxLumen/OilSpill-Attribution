"""Resample and interpolate AIS trajectories."""

import numpy as np
import pandas as pd


def resample_trajectory(traj_df, interval_minutes=15, max_gap_hours=1):
    """
    Resample a single ship trajectory to regular time intervals.
    """
    if len(traj_df) < 2:
        return traj_df

    traj_df = traj_df.copy()
    traj_df["timestamp"] = pd.to_datetime(traj_df["timestamp"], utc=True)

    start = traj_df["timestamp"].min().floor(f"{interval_minutes}min")
    end = traj_df["timestamp"].max().ceil(f"{interval_minutes}min")

    regular_times = pd.date_range(start=start, end=end, freq=f"{interval_minutes}min", tz="UTC")

    traj_df = traj_df.set_index("timestamp")
    resampled = traj_df.reindex(traj_df.index.union(regular_times))

    limit = int(max_gap_hours * 60 / interval_minutes)
    resampled["latitude"] = resampled["latitude"].interpolate(method="time", limit=limit)
    resampled["longitude"] = resampled["longitude"].interpolate(method="time", limit=limit)

    if "sog" in resampled.columns:
        resampled["sog"] = resampled["sog"].interpolate(method="linear", limit=limit)
    if "cog" in resampled.columns:
        resampled["cog"] = resampled["cog"].interpolate(method="linear", limit=limit)

    resampled = resampled.loc[regular_times]

    if "vessel_type" in resampled.columns:
        resampled["vessel_type"] = resampled["vessel_type"].ffill()
    if "mmsi" in resampled.columns:
        resampled["mmsi"] = resampled["mmsi"].ffill()

    resampled = resampled.reset_index()
    resampled = resampled.rename(columns={"index": "timestamp"})

    return resampled.dropna(subset=["latitude", "longitude"])


def resample_all_trajectories(trajectories, interval_minutes=15, max_gap_hours=1):
    """Resample all ship trajectories."""
    resampled = {}

    for mmsi, traj in trajectories.items():
        resampled[mmsi] = resample_trajectory(traj, interval_minutes, max_gap_hours)

    print(f"Resampled {len(resampled)} trajectories to {interval_minutes}-min intervals")

    return resampled