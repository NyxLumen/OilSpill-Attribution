"""Clean and validate raw AIS data."""

import numpy as np
import pandas as pd
from geopy.distance import geodesic


def clean_ais_data(df, max_speed_knots=50):
    """
    Clean raw AIS data by removing invalid records.
    """
    original_len = len(df)

    df = df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)

    valid_lat = df["latitude"].between(-90, 90)
    valid_lon = df["longitude"].between(-180, 180)
    df = df[valid_lat & valid_lon]

    df = df.drop_duplicates(subset=["mmsi", "timestamp"])
    df = df.sort_values(["mmsi", "timestamp"]).reset_index(drop=True)

    cleaned_groups = []

    for mmsi, group in df.groupby("mmsi"):
        group = group.sort_values("timestamp").reset_index(drop=True)

        if len(group) < 2:
            continue

        speeds = [0]
        for i in range(1, len(group)):
            p1 = (group.iloc[i-1]["latitude"], group.iloc[i-1]["longitude"])
            p2 = (group.iloc[i]["latitude"], group.iloc[i]["longitude"])

            dist_km = geodesic(p1, p2).km
            time_hours = (group.iloc[i]["timestamp"] - group.iloc[i-1]["timestamp"]).total_seconds() / 3600

            if time_hours > 0:
                speed_knots = (dist_km / time_hours) * 0.539957
            else:
                speed_knots = 0

            speeds.append(speed_knots)

        group["implied_speed"] = speeds
        group = group[group["implied_speed"] <= max_speed_knots]
        group = group.drop(columns=["implied_speed"])

        cleaned_groups.append(group)

    if cleaned_groups:
        df = pd.concat(cleaned_groups, ignore_index=True)
    else:
        df = pd.DataFrame()

    removed = original_len - len(df)
    print(f"Cleaned AIS data:")
    print(f"   Original: {original_len}, Removed: {removed}, Remaining: {len(df)}")

    return df