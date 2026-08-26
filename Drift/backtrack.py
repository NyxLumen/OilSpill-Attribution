"""Backward-in-time oil drift simulation for source identification."""

from drift.particle import ParticleSet
from drift.engine import DriftEngine
from drift.readers.current_reader import CurrentReader
from drift.readers.wind_reader import WindReader
from config.settings import DEFAULT_NUM_PARTICLES, DEFAULT_BACKTRACK_HOURS, DEFAULT_TIMESTEP_S

def run_backtrack(
    detection_lon,
    detection_lat,
    detection_time,
    current_file=None,
    wind_file=None,
    n_particles=DEFAULT_NUM_PARTICLES,
    backtrack_hours=DEFAULT_BACKTRACK_HOURS,
    timestep_s=DEFAULT_TIMESTEP_S,
    oil_type="light_crude",
    seed_radius_m=500,
):
    """
    Run a backward drift simulation from a detected oil slick to find its source.
    """
    print("=" * 60)
    print("🌊 OIL SPILL BACKTRACKING SIMULATION")
    print("=" * 60)
    print(f"Detection: ({detection_lat:.4f}°N, {detection_lon:.4f}°E)")
    print(f"Time: {detection_time}")
    print(f"Backtrack: {backtrack_hours} hours")
    print(f"Particles: {n_particles}")
    print()

    # 1. Load Data
    current_reader = CurrentReader(current_file) if current_file else None
    wind_reader = WindReader(wind_file) if wind_file else None

    # 2. Release particles at the detection site
    particles = ParticleSet(
        n_particles=n_particles,
        lon_center=detection_lon,
        lat_center=detection_lat,
        seed_radius_m=seed_radius_m,
    )

    # 3. Setup the physics engine
    engine = DriftEngine(
        current_reader=current_reader,
        wind_reader=wind_reader,
        oil_type=oil_type,
        timestep_s=timestep_s,
        enable_weathering=False,  # You don't "un-weather" oil when going backward
    )

    # 4. Run the engine BACKWARD
    print("\n🚀 Starting backward simulation...")
    trajectory = engine.run(
        particles=particles,
        start_time=detection_time,
        duration_hours=backtrack_hours,
        backward=True,
    )

    return trajectory, particles
