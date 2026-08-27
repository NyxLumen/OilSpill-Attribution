# validate_spread.py
import numpy as np
import matplotlib.pyplot as plt
from drift.particle import ParticleSet
from drift.physics.diffusion import apply_diffusion
from config.settings import HORIZONTAL_DIFFUSIVITY

# 1. Start with 5,000 particles at exact same spot (radius=0)
particles = ParticleSet(n_particles=5000, lon_center=0, lat_center=0, seed_radius_m=0)
active = particles.get_active_mask()

# 2. Run ONLY diffusion (no wind/current) for 10 hours
# 10 hours = 36,000 seconds
time_seconds = 36000
particles.lon, particles.lat = apply_diffusion(
    particles.lon, particles.lat, dt=time_seconds, active=active, diffusivity=HORIZONTAL_DIFFUSIVITY)

# 3. Calculate how far they spread in meters
# 1 degree of latitude is ~111,320 meters
spread_y_meters = particles.lat * 111320

# 4. Math Check: The standard deviation should equal sqrt(2 * D * t)
expected_std = np.sqrt(2 * HORIZONTAL_DIFFUSIVITY * time_seconds)
actual_std = np.std(spread_y_meters)

print(f"Time Elapsed: {time_seconds / 3600} hours")
print(f"Diffusivity used: {HORIZONTAL_DIFFUSIVITY} m^2/s")
print(f"EXPECTED spread (Standard Deviation): {expected_std:.2f} meters")
print(f"ACTUAL computer spread:               {actual_std:.2f} meters")

if abs(expected_std - actual_std) < (expected_std * 0.05): # within 5% error margin
    print("✅ SUCCESS: The spread physics are mathematically correct.")
else:
    print("❌ ERROR: The spread is wrong.")