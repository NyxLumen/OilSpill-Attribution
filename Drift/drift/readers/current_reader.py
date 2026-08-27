import xarray as xr
import numpy as np
from scipy.interpolate import RegularGridInterpolator

class CurrentReader:
    """Reads uo/vo from a CF-compliant NetCDF file and interpolates to particle positions."""

    def __init__(self, filepath):
        self.ds = xr.open_dataset(filepath)

        # Auto-detect variable names since different datasets use slightly different naming
        self.u_var = self._find_var(["uo", "u", "U", "water_u", "ucur"])
        self.v_var = self._find_var(["vo", "v", "V", "water_v", "vcur"])

        self.lon_var = self._find_coord(["longitude", "lon", "x"])
        self.lat_var = self._find_coord(["latitude", "lat", "y"])
        self.time_var = self._find_coord(["time", "time_counter"])

        self.lons = self.ds[self.lon_var].values
        self.lats = self.ds[self.lat_var].values
        self.times = self.ds[self.time_var].values

        print(f"[CurrentReader] Loaded: {filepath}")
        print(f"  u={self.u_var}, v={self.v_var}")
        print(f"  lon: {self.lons.min():.2f} to {self.lons.max():.2f}")
        print(f"  lat: {self.lats.min():.2f} to {self.lats.max():.2f}")
        print(f"  time: {self.times[0]} to {self.times[-1]}")

    def _find_var(self, candidates):
        for name in candidates:
            if name in self.ds.data_vars:
                return name
        raise KeyError(f"Could not find variable. Tried: {candidates}. Available: {list(self.ds.data_vars)}")

    def _find_coord(self, candidates):
        all_coords = list(self.ds.coords) + list(self.ds.dims)
        for name in candidates:
            if name in all_coords:
                return name
        raise KeyError(f"Could not find coordinate. Tried: {candidates}. Available: {all_coords}")

    def get_current(self, lon, lat, time):
        """
        Interpolate current velocity to particle positions at a given time.
        Returns u_current, v_current arrays in m/s.
        """
        time_np = np.datetime64(time)

        # Pull the data array for the specific time using nearest neighbor
        ds_at_time = self.ds.sel({self.time_var: time_np}, method="nearest")

        u_field = ds_at_time[self.u_var].values.squeeze()
        v_field = ds_at_time[self.v_var].values.squeeze()

        # Handle Missing/NaN values (like land) by setting to 0 velocity
        u_field = np.nan_to_num(u_field, nan=0.0)
        v_field = np.nan_to_num(v_field, nan=0.0)

        # Set up a grid interpolator so we can grab velocities at any arbitrary lat/lon
        u_interp = RegularGridInterpolator(
            (self.lats, self.lons), u_field,
            method="linear", bounds_error=False, fill_value=0.0
        )
        v_interp = RegularGridInterpolator(
            (self.lats, self.lons), v_field,
            method="linear", bounds_error=False, fill_value=0.0
        )

        points = np.column_stack([lat, lon])
        u_at_particles = u_interp(points)
        v_at_particles = v_interp(points)

        return u_at_particles, v_at_particles