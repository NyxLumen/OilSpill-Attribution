"""Core simulation engine — runs the drift physics loop."""

import numpy as np
from datetime import timedelta
from config.settings import DEFAULT_TIMESTEP_S
from drift.physics.advection import advect_by_current, advect_by_wind
from drift.physics.diffusion import apply_diffusion
from drift.physics.weathering import apply_evaporation, apply_dispersion, apply_emulsification
from drift.physics.oil_properties import get_oil

class DriftEngine:
    """Lagrangian particle tracking engine for oil drift simulation."""

    def __init__(self, current_reader=None, wind_reader=None, oil_type="light_crude",
                 timestep_s=DEFAULT_TIMESTEP_S, enable_weathering=True):
        self.current_reader = current_reader
        self.wind_reader = wind_reader
        self.oil_props = get_oil(oil_type)
        self.timestep_s = timestep_s
        self.enable_weathering = enable_weathering
        self.is_land_func = None

    def set_land_check(self, func):
        """Set a function to check if particles have hit land (beached)."""
        self.is_land_func = func

    def run(self, particles, start_time, duration_hours, backward=False):
        """
        Run the simulation loop over time.
        """
        dt = -self.timestep_s if backward else self.timestep_s
        total_seconds = duration_hours * 3600
        n_steps = int(total_seconds / abs(dt))

        # Storage for all trajectory data
        trajectory = {
            "time": [],
            "lon": np.zeros((n_steps + 1, particles.n)),
            "lat": np.zeros((n_steps + 1, particles.n)),
            "mass": np.zeros((n_steps + 1, particles.n)),
        }

        # Record initial state (T=0)
        trajectory["time"].append(start_time)
        trajectory["lon"][0] = particles.lon.copy()
        trajectory["lat"][0] = particles.lat.copy()
        trajectory["mass"][0] = particles.mass.copy()

        current_time = start_time

        # THE MAIN LOOP
        for step in range(n_steps):
            active = particles.get_active_mask()
            if not active.any():
                print(f"  Step {step}: all particles beached or evaporated, stopping.")
                # Chop off the empty arrays
                trajectory["lon"] = trajectory["lon"][:step + 1]
                trajectory["lat"] = trajectory["lat"][:step + 1]
                trajectory["mass"] = trajectory["mass"][:step + 1]
                break

            # 1. OCEAN CURRENTS
            if self.current_reader is not None:
                u_cur, v_cur = self.current_reader.get_current(particles.lon, particles.lat, current_time)
                particles.lon, particles.lat = advect_by_current(
                    particles.lon, particles.lat, u_cur, v_cur, dt, active
                )

            # 2. WIND (with Ekman deflection)
            wind_speed = None
            if self.wind_reader is not None:
                u_wind, v_wind = self.wind_reader.get_wind(particles.lon, particles.lat, current_time)
                particles.lon, particles.lat = advect_by_wind(
                    particles.lon, particles.lat, u_wind, v_wind, dt, active
                )
                wind_speed = np.sqrt(u_wind**2 + v_wind**2)

            # 3. TURBULENT DIFFUSION
            particles.lon, particles.lat = apply_diffusion(particles.lon, particles.lat, dt, active)

            # 4. WEATHERING (Only if going forward in time)
            if self.enable_weathering and not backward:
                particles.mass = apply_evaporation(particles.mass, particles.age_s, dt, active, self.oil_props, wind_speed)
                particles.mass = apply_dispersion(particles.mass, dt, active, wind_speed)
                particles.water_fraction = apply_emulsification(particles.water_fraction, dt, active, wind_speed)

            # 5. BEACHING Check
            particles.deactivate_beached(self.is_land_func)

            # 6. ADVANCE TIME
            current_time += timedelta(seconds=dt)
            particles.age_s[active] += abs(dt)

            # 7. RECORD STATE
            trajectory["time"].append(current_time)
            trajectory["lon"][step + 1] = particles.lon.copy()
            trajectory["lat"][step + 1] = particles.lat.copy()
            trajectory["mass"][step + 1] = particles.mass.copy()

            if step % 10 == 0:
                pct = (step + 1) / n_steps * 100
                print(f"  Step {step + 1:1d}/{n_steps} ({pct:02.0f}%) | Time={current_time.strftime('%Y-%m-%d %H:%M')} | Active Parts={int(active.sum())}")

        print(f"Simulation complete. {len(trajectory['time'])} timesteps recorded.")
        return trajectory
