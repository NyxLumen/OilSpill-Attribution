"""Diffusion: turbulent random walk spreading of oil particles."""

import numpy as np
from config.settings import (
    EARTH_RADIUS_M, DEG_TO_RAD, RAD_TO_DEG,
    HORIZONTAL_DIFFUSIVITY,
)

def apply_diffusion(lon, lat, dt, active, diffusivity=HORIZONTAL_DIFFUSIVITY):
    """
    Apply horizontal turbulent diffusion as a random walk.
    """
    lon_new = lon.copy()
    lat_new = lat.copy()

    n_active = int(active.sum())
    if n_active == 0:
        return lon_new, lat_new

    # Standard deviation of displacement: sigma = sqrt(2 * D * |dt|)
    sigma = np.sqrt(2.0 * diffusivity * abs(dt))

    # Generate random meter displacements
    dx_m = np.random.normal(0, sigma, n_active)
    dy_m = np.random.normal(0, sigma, n_active)

    lat_new[active] += (dy_m / EARTH_RADIUS_M) * RAD_TO_DEG
    lon_new[active] += (dx_m / (EARTH_RADIUS_M * np.cos(lat[active] * DEG_TO_RAD))) * RAD_TO_DEG

    return lon_new, lat_new