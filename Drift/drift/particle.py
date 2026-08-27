"""Oil particle representation and state management."""

import numpy as np
from config.settings import SEED_RADIUS_M, DEG_TO_RAD, EARTH_RADIUS_M

class ParticleSet:
    """Collection of Lagrangian oil particles."""

    def __init__(self, n_particles, lon_center, lat_center, seed_radius_m=SEED_RADIUS_M):
        self.n = n_particles

        # Seed particles in a random circle around the satellite detection point
        angles = np.random.uniform(0, 2 * np.pi, n_particles)
        # using sqrt so particles are evenly distributed in the circle area
        radii = np.sqrt(np.random.uniform(0, 1, n_particles)) * seed_radius_m

        dx_m = radii * np.cos(angles)
        dy_m = radii * np.sin(angles)

        # Convert meter offsets to longitude/latitude degrees
        self.lon = lon_center + (dx_m / (EARTH_RADIUS_M * np.cos(lat_center * DEG_TO_RAD))) / DEG_TO_RAD
        self.lat = lat_center + (dy_m / EARTH_RADIUS_M) / DEG_TO_RAD

        # Oil state per particle
        self.mass = np.ones(n_particles)             # normalized mass (1.0 = 100% full)
        self.water_fraction = np.zeros(n_particles)  # emulsification (mousse formation)
        self.age_s = np.zeros(n_particles)           # seconds since release
        self.active = np.ones(n_particles, dtype=bool) # True = drifting, False = beached/evaporated

    def deactivate_beached(self, is_land_func):
        """Mark particles that hit land as inactive."""
        if is_land_func is None:
            return
        on_land = is_land_func(self.lon, self.lat)
        self.active[on_land] = False

    def get_active_mask(self):
        """Returns boolean mask of particles that are still drifting and have mass."""
        return self.active & (self.mass > 0.01)

    def get_positions(self):
        """Return a copy of all current lon/lat positions."""
        return self.lon.copy(), self.lat.copy()

    def summary(self):
        """Get a dictionary summarizing the current state of the slick."""
        mask = self.get_active_mask()
        return {
            "total": self.n,
            "active": int(mask.sum()),
            "mean_mass": float(self.mass[mask].mean()) if mask.any() else 0,
            "mean_water_fraction": float(self.water_fraction[mask].mean()) if mask.any() else 0,
            "lon_range": (float(self.lon[mask].min()), float(self.lon[mask].max())) if mask.any() else (0, 0),
            "lat_range": (float(self.lat[mask].min()), float(self.lat[mask].max())) if mask.any() else (0, 0),
        }