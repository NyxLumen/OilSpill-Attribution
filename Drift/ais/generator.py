"""Generate synthetic AIS data for testing vessel matching."""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone
import os

# Constants defined at module level
EARTH_RADIUS = 6371000
DEG_TO_RAD = np.pi / 180.0


def generate_synthetic_ais(
    start_time,
    end_time,
    lat_range=(18.0, 22.0),
    lon_range=(68.0, 73.0),
    n_ships=20,
    interval_minutes=15,
    seed=42,
    include_guilty_ship=True,
    guilty_path=None,
):
    """
    Generate synthetic AIS data for testing.
    """
    np.random.seed(seed)

    vessel_types = ["tanker", "cargo", "fishing", "passenger", "other"]

    duration_hours = (end_time - start_time).total_seconds() / 3600
    n_timesteps = int(duration_hours * 60 / interval_minutes) + 1

    timestamps = [start_time + timedelta(minutes=i * interval_minutes) for i in range(n_timesteps)]

    all_records = []
    guilty_mmsi = None

    for ship_idx in range(n_ships):
        mmsi = 100000000 + ship_idx * 1000 + np.random.randint(0, 1000)
        vessel_type = np.random.choice(vessel_types)

        if include_guilty_ship and ship_idx == 0 and guilty_path is not None:
            # GUILTY SHIP: Follow the provided path
            guilty_lons, guilty_lats = guilty_path

            from scipy.interpolate import interp1d
            t_original = np.linspace(0, 1, len(guilty_lons))
            t_new = np.linspace(0, 1, n_timesteps)

            lon_interp = interp1d(t_original, guilty_lons, kind='linear', fill_value='extrapolate')
            lat_interp = interp1d(t_original, guilty_lats, kind='linear', fill_value='extrapolate')

            ship_lons = lon_interp(t_new)
            ship_lats = lat_interp(t_new)
            vessel_type = "tanker"
            guilty_mmsi = mmsi
        else:
            # NORMAL SHIP: Random trajectory
            start_lon = np.random.uniform(*lon_range)
            start_lat = np.random.uniform(*lat_range)

            speed_ms = np.random.uniform(3, 12)
            heading = np.random.uniform(0, 360)

            heading_changes = np.cumsum(np.random.normal(0, 2, n_timesteps))
            headings = (heading + heading_changes) % 360

            lons = [start_lon]
            lats = [start_lat]

            for i in range(1, n_timesteps):
                dt = interval_minutes * 60
                h = headings[i] * DEG_TO_RAD

                dx = speed_ms * np.sin(h) * dt
                dy = speed_ms * np.cos(h) * dt

                new_lat = lats[-1] + (dy / EARTH_RADIUS) * (180 / np.pi)
                new_lon = lons[-1] + (dx / (EARTH_RADIUS * np.cos(new_lat * DEG_TO_RAD))) * (180 / np.pi)

                new_lat = np.clip(new_lat, lat_range[0], lat_range[1])
                new_lon = np.clip(new_lon, lon_range[0], lon_range[1])

                lats.append(new_lat)
                lons.append(new_lon)

            ship_lons = np.array(lons)
            ship_lats = np.array(lats)

        # Calculate SOG and COG from positions
        sog = np.zeros(n_timesteps)
        cog = np.zeros(n_timesteps)

        for i in range(1, n_timesteps):
            dlat = ship_lats[i] - ship_lats[i-1]
            dlon = ship_lons[i] - ship_lons[i-1]

            lat1 = ship_lats[i-1] * DEG_TO_RAD
            dist_lat = dlat * 111320
            dist_lon = dlon * 111320 * np.cos(lat1)
            dist = np.sqrt(dist_lat**2 + dist_lon**2)

            sog[i] = dist / (interval_minutes * 60)
            cog[i] = (np.arctan2(dlon, dlat) * 180 / np.pi) % 360

        if n_timesteps > 1:
            sog[0] = sog[1]
            cog[0] = cog[1]

        # Create records
        for i, ts in enumerate(timestamps):
            all_records.append({
                "mmsi": mmsi,
                "timestamp": ts,
                "latitude": float(ship_lats[i]),
                "longitude": float(ship_lons[i]),
                "sog": float(sog[i]),
                "cog": float(cog[i]),
                "heading": float(cog[i]),
                "vessel_type": vessel_type,
            })

    df = pd.DataFrame(all_records)

    if guilty_mmsi:
        print(f"🕵️ Guilty ship MMSI: {guilty_mmsi} (tanker)")

    return df


def save_ais_to_csv(df, filepath="data/ais/synthetic_ais.csv"):
    """Save AIS DataFrame to CSV."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    df.to_csv(filepath, index=False)
    print(f"✅ Saved AIS data: {filepath}")
    print(f"   Ships: {df['mmsi'].nunique()}")
    print(f"   Records: {len(df)}")