"""Oil Spill Backtracking — Main Entry Point"""

import numpy as np
from datetime import datetime, timezone, timedelta
import matplotlib.pyplot as plt

from drift.backtrack import run_backtrack
from drift.particle import ParticleSet
from drift.physics.advection import advect_by_current, advect_by_wind
from drift.physics.diffusion import apply_diffusion
from drift.export import (
    export_trajectory_to_csv,
    export_origin_cloud_to_csv,
    export_plot_all_formats
)


def run_synthetic_demo():
    """Run with fake constant currents and wind just to test the physics engine."""
    print("=" * 60)
    print("🧪 SYNTHETIC DEMO — testing physics (no real data loaded)")
    print("=" * 60)

    detection_lon, detection_lat = 72.80, 19.00
    detection_time = datetime(2026, 8, 26, 12, 0, tzinfo=timezone.utc)

    n_particles = 1000
    backtrack_hours = 12
    dt = -900

    particles = ParticleSet(n_particles, detection_lon, detection_lat, seed_radius_m=1000)

    n_steps = int(backtrack_hours * 3600 / abs(dt))
    times, lons, lats = [detection_time], [particles.lon.copy()], [particles.lat.copy()]

    current_time = detection_time

    for step in range(n_steps):
        active = particles.get_active_mask()

        particles.lon, particles.lat = advect_by_current(
            particles.lon, particles.lat, np.full(particles.n, 0.3), np.full(particles.n, 0.1), dt, active)

        particles.lon, particles.lat = advect_by_wind(
            particles.lon, particles.lat, np.full(particles.n, 5.0), np.full(particles.n, 0.0), dt, active)

        particles.lon, particles.lat = apply_diffusion(
            particles.lon, particles.lat, dt, active, diffusivity=30.0)

        current_time += timedelta(seconds=dt)
        times.append(current_time)
        lons.append(particles.lon.copy())
        lats.append(particles.lat.copy())

        if step % 10 == 0:
            print(f"  Step {step + 1:1d}/{n_steps} | Time={current_time.strftime('%H:%M')}")

    print(f"\n✅ Simulation complete!")
    print(f"Detection point: Lon {detection_lon:.4f}, Lat {detection_lat:.4f}")
    print(f"Probable Origin: Lon {particles.lon.min():.4f} to {particles.lon.max():.4f}, "
          f"Lat {particles.lat.min():.4f} to {particles.lat.max():.4f}")

    # ==========================================
    # EXPORT TO CSV
    # ==========================================
    trajectory = {
        "time": times,
        "lon": np.array(lons),
        "lat": np.array(lats),
        "mass": np.ones((len(times), n_particles))
    }

    print("\n📤 Exporting trajectory data to CSV...")
    export_trajectory_to_csv(trajectory, "results/demo_full_trajectory.csv")
    export_origin_cloud_to_csv(particles, detection_time, "results/demo_origin_cloud.csv")

    # ==========================================
    # CREATE PLOT
    # ==========================================
    print("\n📊 Generating visualization...")
    fig, ax = plt.subplots(figsize=(12, 9))

    lons_arr = np.array(lons)
    lats_arr = np.array(lats)

    # Plot particle trajectories (1 in every 20)
    for i in range(0, n_particles, 20):
        ax.plot(lons_arr[:, i], lats_arr[:, i], alpha=0.2, c="gray", linewidth=0.8)

    # Plot origin cloud
    ax.scatter(particles.lon, particles.lat, s=8, alpha=0.6, c="blue",
               label=f"Probable Origin ({backtrack_hours}h ago)", zorder=3)

    # Plot detection point
    ax.scatter(detection_lon, detection_lat, s=250, c="red", marker="X",
               zorder=5, label="Satellite Detection", edgecolors='black', linewidths=1.5)

    # Add arrow showing backtrack direction
    mid_lon = (detection_lon + particles.lon.mean()) / 2
    mid_lat = (detection_lat + particles.lat.mean()) / 2
    ax.annotate('', xy=(particles.lon.mean(), particles.lat.mean()),
                xytext=(detection_lon, detection_lat),
                arrowprops=dict(arrowstyle='->', color='purple', lw=2, alpha=0.7))
    ax.text(mid_lon, mid_lat, f"Backtrack\n{backtrack_hours}h",
            fontsize=10, ha='center', color='purple', fontweight='bold')

    ax.set_title(f"Oil Spill Backtracking Simulation\n{backtrack_hours}-Hour Reverse Trajectory Analysis",
                 fontsize=14, fontweight='bold')
    ax.set_xlabel("Longitude (°E)", fontsize=11)
    ax.set_ylabel("Latitude (°N)", fontsize=11)
    ax.legend(loc='upper right', fontsize=10)
    ax.grid(True, alpha=0.3, linestyle='--')

    # Add info box
    info_text = (f"Particles: {n_particles}\n"
                 f"Backtrack: {backtrack_hours} hours\n"
                 f"Timestep: {abs(dt)//60} min\n"
                 f"Origin Area: {particles.lon.max()-particles.lon.min():.3f}° × "
                 f"{particles.lat.max()-particles.lat.min():.3f}°")
    ax.text(0.02, 0.02, info_text, transform=ax.transAxes, fontsize=9,
            verticalalignment='bottom', bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.8))

    plt.tight_layout()

    # ==========================================
    # EXPORT PLOT IN ALL FORMATS
    # ==========================================
    print("\n💾 Exporting plot to multiple formats...")
    export_plot_all_formats(fig, "results/demo_backtrack_plot",
                           formats=['png', 'pdf', 'svg', 'eps', 'tiff'])

    plt.show()


if __name__ == "__main__":
    run_synthetic_demo()