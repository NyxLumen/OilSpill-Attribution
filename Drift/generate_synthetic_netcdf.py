
"""Generates massive, complex fake NetCDF files for stress-testing physics."""

import numpy as np
import xarray as xr
import pandas as pd
from datetime import datetime

def create_synthetic_ocean_data(out_dir="data"):
    print("Generating large synthetic NetCDF datasets...")

    # 1. Define the grid (Large Area: 100 x 100 grid points)
    lons = np.arange(65.0, 75.0, 0.1)
    lats = np.arange(15.0, 25.0, 0.1)

    # 2. Define the time dimension (48 hours of hourly data)
    start_time = datetime(2026, 8, 24, 12, 0)
    times = pd.date_range(start=start_time, periods=49, freq='h')

    # NEW: We must strip the timezone/date units out manually for xarray to save correctly
    # We will save it as hours float instead of datetime objects
    time_hours = np.arange(0, 49.0, 1.0)

    lon2d, lat2d = np.meshgrid(lons, lats)
    print(f"Grid size: {len(lons)}x{len(lats)} spatial, {len(times)} time steps")

    # ==========================================
    # GENERATE CURRENTS (Copernicus style)
    # ==========================================
    base_u = np.full((len(times), len(lats), len(lons)), 0.2) # moving East
    base_v = np.full((len(times), len(lats), len(lons)), -0.1) # moving South

    # Add a giant spatial eddy (whirlpool) in the middle of the ocean
    eddy_lon, eddy_lat = 70.0, 20.0
    r = np.sqrt((lon2d - eddy_lon)**2 + (lat2d - eddy_lat)**2)

    for t_idx in range(len(times)):
        intensity = 0.5 * (1 + 0.2 * np.sin(t_idx / 5.0)) # pulses over time
        base_v[t_idx, :, :] += intensity * (lon2d - eddy_lon) * np.exp(-r)
        base_u[t_idx, :, :] += intensity * -(lat2d - eddy_lat) * np.exp(-r)

    ds_currents = xr.Dataset(
        data_vars=dict(
            uo=(["time", "latitude", "longitude"], base_u, {"units": "m/s"}),
            vo=(["time", "latitude", "longitude"], base_v, {"units": "m/s"})
        ),
        coords=dict(
            longitude=(["longitude"], lons, {"units": "degrees_east"}),
            latitude=(["latitude"], lats, {"units": "degrees_north"}),
            # FIX: Properly set CF-compliant time units
            time=(["time"], times, {"units": "hours since 2026-08-24 12:00:00"}),
        ),
        attrs=dict(description="Synthetic Copernicus Currents")
    )

    # FIX: Delete units if it generated any accidentally so it doesn't crash on save
    if "units" in ds_currents.time.attrs:
        del ds_currents.time.attrs["units"]

    current_path = f"{out_dir}/currents/synthetic_currents.nc"
    ds_currents.to_netcdf(current_path)
    print(f"✅ Saved synthetic ocean currents: {current_path}")


    # ==========================================
    # GENERATE WIND (ERA5 style)
    # ==========================================
    wind_u = np.full((len(times), len(lats), len(lons)), 6.0)
    wind_v = np.full((len(times), len(lats), len(lons)), 4.0)

    # Add a nasty storm (cyclone-like) that moves across the map
    for t_idx in range(len(times)):
        storm_lon = 66.0 + (t_idx * 0.15)
        storm_lat = 16.0 + (t_idx * 0.15)
        distance = np.sqrt((lon2d - storm_lon)**2 + (lat2d - storm_lat)**2)
        wind_intensity = 15.0 * np.exp(-distance / 2.0)

        wind_v[t_idx, :, :] += wind_intensity * (lon2d - storm_lon)
        wind_u[t_idx, :, :] += wind_intensity * -(lat2d - storm_lat)

    ds_wind = xr.Dataset(
        data_vars=dict(
            u10=(["time", "latitude", "longitude"], wind_u, {"units": "m/s"}),
            v10=(["time", "latitude", "longitude"], wind_v, {"units": "m/s"})
        ),
        coords=dict(
            longitude=(["longitude"], lons, {"units": "degrees_east"}),
            latitude=(["latitude"], lats, {"units": "degrees_north"}),
            time=(["time"], times, {"units": "hours since 2026-08-24 12:00:00"}),
        ),
        attrs=dict(description="Synthetic ERA5 Winds with moving storm")
    )

    if "units" in ds_wind.time.attrs:
        del ds_wind.time.attrs["units"]

    wind_path = f"{out_dir}/wind/synthetic_winds.nc"
    ds_wind.to_netcdf(wind_path)
    print(f"✅ Saved synthetic wind data: {wind_path}")

if __name__ == "__main__":
    create_synthetic_ocean_data()