import xarray as xr
import numpy as np
from scipy.interpolate import RegularGridInterpolator

class WindReader:
    """Reads 10m u/v wind components from ERA5 NetCDF."""

    def __init__(self, filepath):
        self.ds = xr.open_dataset(filepath)

        self.u_var = self._find_var(["u10", "10u", "U10", "u10m"])
        self.v_var = self._find_var(["v10", "10v", "V10", "v10m"])

        self.lon_var = self._find_coord(["longitude", "lon", "x"])
        self.lat_var = self._find_coord(["latitude", "lat", "y"])
        self.time_var = self._find_coord(["time", "valid_time"])

        self.lons = self.ds[self.lon_var].values
        self.lats = self.ds[self.lat_var].values
        self.times = self.ds[self.time_var].values

        # ERA5 lats are often descending — we must sort ascending for the interpolator
        if self.lats[0] > self.lats[-1]:
            self.lats = self.lats[::-1]
            self._lat_flipped = True
        else:
            self._lat_flipped = False

        print(f"[WindReader] Loaded: {filepath}")
        print(f"  u={self.u_var}, v={self.v_var}")
        print(f"  lon: {self.lons.min():.2f} to {self.lons.max():.2f}")
        print(f"  lat: {self.lats.min():.2f} to {self.lats.max():.2f}")

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

    def get_wind(self, lon, lat, time):
        """Interpolate wind to particle positions. Returns u_wind, v_wind in m/s."""
        time_np = np.datetime64(time)
        ds_at_time = self.ds.sel({self.time_var: time_np}, method="nearest")

        u_field = ds_at_time[self.u_var].values.squeeze()
        v_field = ds_at_time[self.v_var].values.squeeze()

        # If we flipped lat coordinates in __init__, flip the 2D arrays too
        if self._lat_flipped:
            u_field = u_field[::-1, ...]
            v_field = v_field[::-1, ...]

        u_field = np.nan_to_num(u_field, nan=0.0)
        v_field = np.nan_to_num(v_field, nan=0.0)

        u_interp = RegularGridInterpolator(
            (self.lats, self.lons), u_field,
            method="linear", bounds_error=False, fill_value=0.0
        )
        v_interp = RegularGridInterpolator(
            (self.lats, self.lons), v_field,
            method="linear", bounds_error=False, fill_value=0.0
        )

        points = np.column_stack([lat, lon])
        return u_interp(points), v_interp(points)

    def get_wind_speed(self, lon, lat, time):
        """Return scalar wind speed at particle positions."""
        u, v = self.get_wind(lon, lat, time)
        return np.sqrt(u**2 + v**2)