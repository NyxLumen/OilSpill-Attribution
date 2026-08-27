"""Simulation constants and default parameters."""

import numpy as np

# Earth
EARTH_RADIUS_M = 6_371_000

# Time
DEFAULT_TIMESTEP_S = 900          # 15 minutes per step
DEFAULT_BACKTRACK_HOURS = 24      # Trace back 24 hours by default
DEFAULT_NUM_PARTICLES = 1000      # Number of particles to simulate

# Physics
WIND_DRIFT_FACTOR = 0.03          # Oil moves at ~3% of wind speed
WIND_DRIFT_ANGLE_DEG = 15.0       # Deflection angle (Ekman effect)
STOKES_DRIFT_FACTOR = 0.016       # Wave drift contribution

# Diffusion (Random walk spread)
HORIZONTAL_DIFFUSIVITY = 10.0     # m²/s — turbulent diffusion coefficient
MIN_DIFFUSIVITY = 0.1
MAX_DIFFUSIVITY = 100.0

# Oil weathering
EVAPORATION_RATE = 2.5e-6         # fraction per second (light crude)
DISPERSION_RATE = 1.0e-7          # fraction per second
EMULSIFICATION_MAX = 0.8          # max water content fraction
EMULSIFICATION_RATE = 5.0e-6      # per second

# Particle seeding
SEED_RADIUS_M = 500               # Initial spread radius of detected oil (meters)

# Coordinate conversion constants
DEG_TO_RAD = np.pi / 180.0
RAD_TO_DEG = 180.0 / np.pi