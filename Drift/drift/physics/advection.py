import numpy as np
from config.settings import (
    EARTH_RADIUS_M, DEG_TO_RAD, RAD_TO_DEG,
    WIND_DRIFT_FACTOR, WIND_DRIFT_ANGLE_DEG,
)

def advect_by_current(lon, lat, u_current, v_current, dt, active):
    """
    Move particles by ocean current.
    """
    lon_new = lon.copy()
    lat_new = lat.copy()

    # displacement in meters (velocity * time)
    dx_m = u_current[active] * dt
    dy_m = v_current[active] * dt

    # convert meters back to degrees
    lat_new[active] += (dy_m / EARTH_RADIUS_M) * RAD_TO_DEG
    lon_new[active] += (dx_m / (EARTH_RADIUS_M * np.cos(lat[active] * DEG_TO_RAD))) * RAD_TO_DEG

    return lon_new, lat_new

def advect_by_wind(lon, lat, u_wind, v_wind, dt, active,
                   drift_factor=WIND_DRIFT_FACTOR,
                   drift_angle_deg=WIND_DRIFT_ANGLE_DEG):
    """
    Move particles by wind.
    Oil drifts at ~3% of wind speed, deflected ~15° (Ekman transport).
    If dt is negative (backtracking), the angle is reversed automatically.
    """
    lon_new = lon.copy()
    lat_new = lat.copy()

    angle_rad = drift_angle_deg * DEG_TO_RAD
    if dt < 0:
        angle_rad = -angle_rad  # Reverse deflection for backward simulation

    cos_a = np.cos(angle_rad)
    sin_a = np.sin(angle_rad)

    # Rotate the wind vector by the Ekman angle and apply 3% drift factor
    u_drift = drift_factor * (u_wind[active] * cos_a - v_wind[active] * sin_a)
    v_drift = drift_factor * (u_wind[active] * sin_a + v_wind[active] * cos_a)

    dx_m = u_drift * dt
    dy_m = v_drift * dt

    lat_new[active] += (dy_m / EARTH_RADIUS_M) * RAD_TO_DEG
    lon_new[active] += (dx_m / (EARTH_RADIUS_M * np.cos(lat[active] * DEG_TO_RAD))) * RAD_TO_DEG

    return lon_new, lat_new
